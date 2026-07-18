/**
 * useCalorieCounter – calorie burn from distance and duration.
 * Responsibility: fixed-MET calculation from distance/time (no per-user
 * weight input in this scope). Pure function of session data.
 * 
 * Returns: { calories }
 */
export function useCalorieCounter(distanceM = 0, durationS = 0) {
  if (!distanceM || !durationS || durationS <= 0) {
    return { calories: 0 };
  }

  // Calculate speed in meters per second
  const speed = distanceM / durationS;

  // Map metabolic equivalent of task (MET) dynamically to user's average velocity
  let met = 1.0; 
  if (speed < 1.0) {
    met = 3.0;   // Walking pace
  } else if (speed < 2.2) {
    met = 6.0;   // Slow jog
  } else if (speed < 3.5) {
    met = 9.0;   // Moderate pace run
  } else {
    met = 11.5;  // High velocity sprinting
  }

  // Average static participant mass (kg)
  const baselineWeightKg = 70;

  // Standard MET formula: 
  // kcal/min = (MET * 3.5 * weightKg) / 200
  const kcalPerMin = (met * 3.5 * baselineWeightKg) / 200;
  const kcalPerSec = kcalPerMin / 60;

  const calories = kcalPerSec * durationS; // Cleaned reference variable

  return { 
    calories: Math.round(calories * 10) / 10 
  };
}