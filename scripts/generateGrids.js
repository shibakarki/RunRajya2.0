import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Define ES Module compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple manual .env parser to avoid dependency issues on Windows
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const config = {};
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        config[match[1]] = value;
      }
    });
    return config;
  } catch (e) {
    console.error('Could not locate .env configuration file.');
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;

// Fall back to public anon key if service role key is not defined
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY must be defined in your .env file.');
  process.exit(1);
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\x1b[33m%s\x1b[0m', 'Notice: SUPABASE_SERVICE_ROLE_KEY not found in .env. Falling back to VITE_SUPABASE_ANON_KEY.');
  console.log('\x1b[33m%s\x1b[0m', 'If the sync fails with an RLS violation, temporarily disable RLS on the "zones" table in Supabase SQL editor using "alter table public.zones disable row level security;".\n');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ray-casting math to verify if grid center coordinates sit inside Rupandehi bounds
function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersect = ((yi > lng) !== (yj > lng)) && (lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function generateSectorGrid() {
  console.log('Loading Rupandehi boundary data...');
  
  // Resolve boundary file (compatible with both name patterns)
  let boundaryPath = path.resolve(__dirname, '../src/data/rupandehi.json');
  if (!fs.existsSync(boundaryPath)) {
    boundaryPath = path.resolve(__dirname, '../src/data/rupandehi_boundary.json');
  }

  if (!fs.existsSync(boundaryPath)) {
    console.error('Error: Could not locate your Rupandehi boundary JSON file.');
    process.exit(1);
  }

  const boundaryGeoJson = JSON.parse(fs.readFileSync(boundaryPath, 'utf-8'));
  
  // Extract coordinate list safely, handling different formats
  const features = boundaryGeoJson.features;
  const geometry = features ? features[0].geometry : boundaryGeoJson.geometry;
  let rawCoordinates = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0][0];

  // Auto-detect coordinate order (re-align standard GeoJSON [lng, lat] to [lat, lng])
  const firstVal = rawCoordinates[0][0];
  const borderPolygon = firstVal > 50 
    ? rawCoordinates.map(c => [c[1], c[0]]) // Safely swapped coordinate array mapping
    : rawCoordinates.map(c => [c[0], c[1]]);

  // Calculate bounding box boundaries
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  borderPolygon.forEach(([lat, lng]) => {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  });

  console.log(`Bounding Box calculated: Lat [${minLat.toFixed(4)} to ${maxLat.toFixed(4)}], Lng [${minLng.toFixed(4)} to ${maxLng.toFixed(4)}]`);

  // Approx coordinate offsets representing a 500m × 500m cell at 27.6° N latitude
  const latStep = 0.0045;  
  const lngStep = 0.00508; 

  const zonesToInsert = [];
  let cellCount = 0;

  // Grid Generation Loop
  for (let lat = minLat; lat < maxLat; lat += latStep) {
    for (let lng = minLng; lng < maxLng; lng += lngStep) {
      // Find the geometric center of the cell
      const centerLat = lat + (latStep / 2);
      const centerLng = lng + (lngStep / 2);

      // Verify that cell center sits inside Rupandehi bounds
      if (isPointInPolygon(centerLat, centerLng, borderPolygon)) {
        cellCount++; // Increment cell count
        
        // Define the four corners of our 500m zone cell
        const boundary = [
          { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) },
          { lat: Number((lat + latStep).toFixed(6)), lng: Number(lng.toFixed(6)) },
          { lat: Number((lat + latStep).toFixed(6)), lng: Number((lng + lngStep).toFixed(6)) },
          { lat: Number(lat.toFixed(6)), lng: Number((lng + lngStep).toFixed(6)) }
        ];

        zonesToInsert.push({
          id: cellCount, // Use the sequential integer ID (fixes casting error)
          boundary: boundary,
          owner_id: null,
          faction_id: null,
          captured_at: null
        });
      }
    }
  }

  console.log(`Grid calculation finished. Generated ${zonesToInsert.length} active cells inside Rupandehi boundary.`);
  return zonesToInsert;
}

async function uploadGridToDatabase() {
  const gridCells = generateSectorGrid();
  const batchSize = 100; // Small batch size to avoid HTTP connection timeouts
  
  console.log(`Initiating database synchronization...`);

  for (let i = 0; i < gridCells.length; i += batchSize) {
    const batch = gridCells.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('zones')
      .upsert(batch, { onConflict: 'id' });

    if (error) {
      console.error(`Database error during batch ${i / batchSize + 1} execution:`, error.message);
      console.log('\x1b[31m%s\x1b[0m', '\nTip: If you got an RLS permission error, please temporarily disable RLS on your "zones" table in Supabase SQL editor using:\n"alter table public.zones disable row level security;"\nThen run this script, and re-enable RLS afterwards.');
      process.exit(1);
    }

    const progressPct = ((Math.min(i + batchSize, gridCells.length) / gridCells.length) * 100).toFixed(1);
    console.log(`Synced progress: ${progressPct}% (${Math.min(i + batchSize, gridCells.length)} / ${gridCells.length} cells synced)`);
  }

  console.log(`Database grid sync successfully completed.`);
}

uploadGridToDatabase();