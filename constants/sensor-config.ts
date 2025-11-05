/**
 * Standard Sensor Configuration - Rules, Thresholds, and Processing Intervals
 * Centralized configuration for all sensor data processing
 */

/**
 * Standard processing interval for batching incoming sensor data
 * All incoming data is batched and processed every 30 seconds
 */
export const SENSOR_PROCESSING_INTERVAL = 30000; // 30 seconds in milliseconds

/**
 * Standard sensor thresholds for alert generation
 * These values determine when sensor readings trigger warnings or critical alerts
 */
export const SENSOR_THRESHOLDS = {
  // Noise sensor thresholds (decibels)
  decibels: {
    warning: 100,   // dB - High noise level
    critical: 110,  // dB - Very high noise level
  },
  // Raw sound sensor thresholds
  sound: {
    warning: 200,   // Raw sound value
    critical: 250,  // Raw sound value
  },
  // Hall effect sensor thresholds (motion/vibration detection)
  hall_effect: {
    warning: 500,   // Hall effect sensor value
    critical: 800,  // Hall effect sensor value
  },
  // Magnetic deviation thresholds (tampering detection)
  magnetic_deviation: {
    warning: 5,     // Magnetic deviation - suspicious activity
    critical: 10,   // Magnetic deviation - indicates tampering
  },
  // Temperature thresholds
  temperature: {
    warning: 40,    // °C - Elevated temperature
    critical: 50,   // °C - Fire risk threshold
  },
  // Humidity thresholds
  humidity: {
    warning: 70,    // % - High humidity
    critical: 80,   // % - Very high humidity
  },
  // Smoke sensor thresholds
  smoke: {
    warning: 150,   // ppm - Smoke detected
    critical: 200, // ppm - High smoke concentration
  },
} as const;

/**
 * Standard sensor processing rules
 * Determines how sensor data is converted to emergency reports
 */
export const SENSOR_RULES = {
  // Priority order for processing multiple sensor readings
  priority: ['tampering', 'magnetic_deviation', 'decibels', 'sound', 'hall_effect'] as const,
  
  // Status determination rules
  statusRules: {
    // Determine status based on value and thresholds
    getStatus: (value: number, warningThreshold: number, criticalThreshold: number): 'normal' | 'warning' | 'critical' => {
      if (value >= criticalThreshold) return 'critical';
      if (value >= warningThreshold) return 'warning';
      return 'normal';
    },
  },
  
  // Report type mapping rules
  reportTypeMapping: {
    smoke: 'fire' as const,
    temperature: (value: number) => value > SENSOR_THRESHOLDS.temperature.critical ? 'fire' as const : 'other' as const,
    humidity: 'other' as const,
    motion: (metadata?: { is_tampering?: boolean; magnetic_deviation?: number }) => {
      if (metadata?.is_tampering === true) return 'suspicious' as const;
      if (metadata?.magnetic_deviation && metadata.magnetic_deviation >= SENSOR_THRESHOLDS.magnetic_deviation.warning) {
        return 'suspicious' as const;
      }
      return 'suspicious' as const;
    },
    noise: 'other' as const,
    vibration: 'accident' as const,
  },
  
  // Severity mapping rules
  severityMapping: {
    smoke: (status: 'normal' | 'warning' | 'critical'): 'critical' | 'high' => {
      return status === 'critical' ? 'critical' : 'high';
    },
    temperature: (value: number): 'high' | 'medium' => {
      return value > SENSOR_THRESHOLDS.temperature.critical ? 'high' : 'medium';
    },
    humidity: (value: number): 'medium' | 'low' => {
      return value > SENSOR_THRESHOLDS.humidity.critical ? 'medium' : 'low';
    },
    motion: (status: 'normal' | 'warning' | 'critical', metadata?: { is_tampering?: boolean }): 'critical' | 'high' | 'medium' => {
      if (metadata?.is_tampering === true) return 'critical';
      return status === 'critical' ? 'high' : 'medium';
    },
    noise: (status: 'normal' | 'warning' | 'critical'): 'high' | 'medium' | 'low' => {
      if (status === 'critical') return 'high';
      if (status === 'warning') return 'medium';
      return 'low';
    },
    vibration: (status: 'normal' | 'warning' | 'critical'): 'high' | 'medium' => {
      return status === 'critical' ? 'high' : 'medium';
    },
  },
} as const;

/**
 * Maximum number of reports to keep in memory
 * Prevents memory issues with high-frequency sensor data
 */
export const MAX_REPORTS_LIMIT = 100;

/**
 * Debounce interval for duplicate detection
 * Prevents processing the same sensor data multiple times
 */
export const DUPLICATE_DETECTION_WINDOW = 5000; // 5 seconds

