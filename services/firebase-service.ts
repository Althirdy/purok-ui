/**
 * Firebase Service - Handles IoT Sensor Data Fetching
 */

import { database } from '@/config/firebase';
import type { EmergencyReport } from '@/types';
import { DataSnapshot, get, off, onValue, ref } from 'firebase/database';

export interface SensorData {
  id: string;
  sensorId: string;
  sensorType: 'temperature' | 'humidity' | 'smoke' | 'motion' | 'noise' | 'vibration';
  value: number;
  unit: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  timestamp: number;
  threshold?: {
    min?: number;
    max?: number;
  };
  status: 'normal' | 'warning' | 'critical';
  metadata?: {
    deviceId?: string;
    batteryLevel?: number;
    signalStrength?: number;
    // Sensor-specific fields
    amplitude?: number | string;
    sound?: number | string;
    decibels?: number | string;
    magnetic_deviation?: number | string;
    hall_effect?: number | string;
    is_tampering?: boolean;
    tampering_type?: string | null;
    [key: string]: any; // Allow additional fields
  };
}

/**
 * Convert sensor data to emergency report
 */
export function sensorDataToReport(sensorData: SensorData): EmergencyReport {
  // Determine report type based on sensor type and status
  let reportType: EmergencyReport['type'] = 'other';
  let severity: EmergencyReport['severity'] = 'low';
  let title = '';
  let description = '';

  switch (sensorData.sensorType) {
    case 'smoke':
      reportType = 'fire';
      severity = sensorData.status === 'critical' ? 'critical' : 'high';
      title = 'Smoke Detected';
      description = `Smoke sensor detected ${sensorData.value} ${sensorData.unit} of smoke particles. Status: ${sensorData.status.toUpperCase()}`;
      break;
    
    case 'temperature':
      if (sensorData.value > 50) {
        reportType = 'fire';
        severity = 'high';
        title = 'High Temperature Detected';
        description = `Temperature sensor reading: ${sensorData.value}°C. Possible fire risk.`;
      } else {
        reportType = 'other';
        severity = 'medium';
        title = 'Temperature Alert';
        description = `Temperature sensor reading: ${sensorData.value}°C`;
      }
      break;
    
    case 'humidity':
      if (sensorData.value > 80) {
        reportType = 'other';
        severity = 'medium';
        title = 'High Humidity Detected';
        description = `Humidity sensor reading: ${sensorData.value}%. High moisture levels detected.`;
      } else {
        reportType = 'other';
        severity = 'low';
        title = 'Humidity Alert';
        description = `Humidity sensor reading: ${sensorData.value}%`;
      }
      break;
    
    case 'motion':
      // Check if this is a tampering alert
      if (sensorData.metadata?.is_tampering === true || sensorData.metadata?.tampering_type) {
        reportType = 'suspicious';
        severity = 'critical';
        title = 'Device Tampering Detected';
        description = `Tampering detected! Type: ${sensorData.metadata.tampering_type || 'Unknown'}. Magnetic deviation: ${sensorData.metadata.magnetic_deviation || 'N/A'}. Immediate attention required.`;
      } else if (sensorData.metadata?.magnetic_deviation) {
        const magDevValue = typeof sensorData.metadata.magnetic_deviation === 'string' 
          ? parseFloat(sensorData.metadata.magnetic_deviation) 
          : Number(sensorData.metadata.magnetic_deviation);
        if (!isNaN(magDevValue) && magDevValue >= 10) {
          reportType = 'suspicious';
          severity = 'high';
          title = 'Suspicious Magnetic Activity';
          description = `Unusual magnetic deviation detected: ${magDevValue}. Possible tampering attempt.`;
        }
      } else {
        reportType = 'suspicious';
        severity = sensorData.status === 'critical' ? 'high' : 'medium';
        title = 'Motion Detected';
        description = `Motion sensor detected unusual activity. Sensor value: ${sensorData.value}`;
      }
      break;
    
    case 'noise':
      // Use status from threshold check (already done in listener)
      if (sensorData.status === 'critical') {
        reportType = 'other';
        severity = 'high';
        title = 'Critical Noise Level Detected';
        description = `High noise level detected: ${sensorData.value}${sensorData.unit ? ' ' + sensorData.unit : ''}. May indicate disturbance or emergency.`;
      } else if (sensorData.status === 'warning') {
        reportType = 'other';
        severity = 'medium';
        title = 'High Noise Level';
        description = `Noise sensor detected ${sensorData.value}${sensorData.unit ? ' ' + sensorData.unit : ''}. May indicate disturbance.`;
      } else {
        reportType = 'other';
        severity = 'low';
        title = 'Noise Alert';
        description = `Noise level: ${sensorData.value}${sensorData.unit ? ' ' + sensorData.unit : ''}`;
      }
      break;
    
    case 'vibration':
      reportType = 'accident';
      severity = sensorData.status === 'critical' ? 'high' : 'medium';
      title = 'Vibration Detected';
      description = `Vibration sensor detected unusual movement. Value: ${sensorData.value}`;
      break;
    
    default:
      reportType = 'other';
      severity = 'medium';
      title = `Sensor Alert: ${sensorData.sensorType}`;
      description = `${sensorData.sensorType} sensor reading: ${sensorData.value} ${sensorData.unit}`;
  }

  // Format location
  const location = sensorData.location.address || 
    `Lat: ${sensorData.location.latitude.toFixed(6)}, Lng: ${sensorData.location.longitude.toFixed(6)}`;

  // Generate report ID
  const reportId = `SENSOR-${sensorData.sensorId}-${Date.now()}`;

  return {
    id: reportId,
    type: reportType,
    title,
    description,
    location,
    timestamp: new Date(sensorData.timestamp),
    status: 'pending',
    severity,
    source: 'sensor',
    reportedBy: `Sensor ${sensorData.sensorId}`,
  };
}

// Threshold levels for sensor alerts
const SENSOR_THRESHOLDS = {
  decibels: {
    warning: 80,   // dB - Moderate noise level
    critical: 90,   // dB - High noise level
  },
  sound: {
    warning: 100,  // Raw sound value
    critical: 150,  // Raw sound value
  },
  hall_effect: {
    warning: 500,  // Hall effect sensor value
    critical: 800,  // Hall effect sensor value
  },
  magnetic_deviation: {
    warning: 5,    // Magnetic deviation
    critical: 10,  // Magnetic deviation - indicates tampering
  },
};

/**
 * Listen to sensor data from Firebase Realtime Database
 * @param callback Function to call when new sensor data is received
 * @returns Cleanup function to unsubscribe
 */
export function listenToSensorData(
  callback: (sensorData: SensorData, report: EmergencyReport) => void
): () => void {
  // Listen to urbanwatch/sensor_data path (matches actual Firebase structure)
  const sensorsRef = ref(database, 'urbanwatch/sensor_data');

  const unsubscribe = onValue(sensorsRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      return;
    }

    const sensorDataRecords = snapshot.val();
    
    // Handle structure: urbanwatch/sensor_data/{auto-generated-key}
    // Each record has: amplitude, decibels, hall_effect, is_tampering, magnetic_deviation, sound, tampering_type, timestamp
    Object.keys(sensorDataRecords).forEach((recordKey) => {
      const record = sensorDataRecords[recordKey];
      const sensorId = `sensor-${recordKey}`;
      
      // Parse timestamp (format: "2025-11-04T06:25:27.317730")
      const timestamp = record.timestamp 
        ? new Date(record.timestamp).getTime() 
        : Date.now();
      
      // Process decibels (noise sensor) - Check threshold
      // Parse as number (Firebase may return strings)
      if (record.decibels !== undefined && record.decibels !== null) {
        const decibelsValue = typeof record.decibels === 'string' ? parseFloat(record.decibels) : Number(record.decibels);
        if (isNaN(decibelsValue)) return; // Skip if not a valid number
        
        const decibelStatus = decibelsValue >= SENSOR_THRESHOLDS.decibels.critical 
          ? 'critical' 
          : decibelsValue >= SENSOR_THRESHOLDS.decibels.warning 
          ? 'warning' 
          : 'normal';
        
        // Only generate report if threshold is exceeded
        if (decibelStatus !== 'normal') {
          const sensorData: SensorData = {
            id: `${sensorId}-decibels-${timestamp}`,
            sensorId,
            sensorType: 'noise',
            value: decibelsValue,
            unit: 'dB',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.decibels.warning,
            },
            status: decibelStatus,
            metadata: {
              amplitude: record.amplitude,
              sound: record.sound,
              ...record.metadata,
            },
          };
          const report = sensorDataToReport(sensorData);
          callback(sensorData, report);
        }
      }
      
      // Process sound (noise sensor) - Check threshold
      // Parse as number (Firebase may return strings)
      if (record.sound !== undefined && record.sound !== null) {
        const soundValue = typeof record.sound === 'string' ? parseFloat(record.sound) : Number(record.sound);
        if (isNaN(soundValue)) return; // Skip if not a valid number
        
        const soundStatus = soundValue >= SENSOR_THRESHOLDS.sound.critical 
          ? 'critical' 
          : soundValue >= SENSOR_THRESHOLDS.sound.warning 
          ? 'warning' 
          : 'normal';
        
        // Only generate report if threshold is exceeded
        if (soundStatus !== 'normal') {
          const sensorData: SensorData = {
            id: `${sensorId}-sound-${timestamp}`,
            sensorId,
            sensorType: 'noise',
            value: soundValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.sound.warning,
            },
            status: soundStatus,
            metadata: {
              amplitude: record.amplitude,
              decibels: record.decibels,
              ...record.metadata,
            },
          };
          const report = sensorDataToReport(sensorData);
          callback(sensorData, report);
        }
      }
      
      // Process hall_effect (motion/vibration sensor) - Check threshold
      // Parse as number (Firebase may return strings)
      if (record.hall_effect !== undefined && record.hall_effect !== null) {
        const hallValue = typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect);
        if (isNaN(hallValue)) return; // Skip if not a valid number
        
        const magneticDeviationValue = record.magnetic_deviation !== undefined && record.magnetic_deviation !== null
          ? (typeof record.magnetic_deviation === 'string' ? parseFloat(record.magnetic_deviation) : Number(record.magnetic_deviation))
          : 0;
        
        const hallStatus = hallValue >= SENSOR_THRESHOLDS.hall_effect.critical 
          ? 'critical' 
          : hallValue >= SENSOR_THRESHOLDS.hall_effect.warning 
          ? 'warning' 
          : 'normal';
        
        // Only generate report if threshold is exceeded
        if (hallStatus !== 'normal') {
          const sensorData: SensorData = {
            id: `${sensorId}-hall-${timestamp}`,
            sensorId,
            sensorType: magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.warning ? 'motion' : 'vibration',
            value: hallValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.hall_effect.warning,
            },
            status: hallStatus,
            metadata: {
              magnetic_deviation: magneticDeviationValue,
              is_tampering: record.is_tampering,
              tampering_type: record.tampering_type,
              ...record.metadata,
            },
          };
          const report = sensorDataToReport(sensorData);
          callback(sensorData, report);
        }
      }
      
      // Process tampering detection (CRITICAL ALERT) - Always generate report if tampering detected
      if (record.is_tampering === true) {
        const magneticDeviationValue = record.magnetic_deviation !== undefined && record.magnetic_deviation !== null
          ? (typeof record.magnetic_deviation === 'string' ? parseFloat(record.magnetic_deviation) : Number(record.magnetic_deviation))
          : 0;
        const hallValue = record.hall_effect !== undefined && record.hall_effect !== null
          ? (typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect))
          : 0;
        
        const sensorData: SensorData = {
          id: `${sensorId}-tampering-${timestamp}`,
          sensorId,
          sensorType: 'motion',
          value: magneticDeviationValue || hallValue || 0,
          unit: '',
          location: record.location || { latitude: 0, longitude: 0 },
          timestamp,
          threshold: {
            min: 0,
            max: SENSOR_THRESHOLDS.magnetic_deviation.critical,
          },
          status: 'critical',
          metadata: {
            tampering_type: record.tampering_type || 'Unknown',
            magnetic_deviation: magneticDeviationValue,
            hall_effect: hallValue,
            ...record.metadata,
          },
        };
        const report = sensorDataToReport(sensorData);
        callback(sensorData, report);
      }
      
      // Process magnetic_deviation (tampering indicator) - Check threshold
      // Parse as number (Firebase may return strings)
      if (record.magnetic_deviation !== undefined && record.magnetic_deviation !== null) {
        const magneticDeviationValue = typeof record.magnetic_deviation === 'string' 
          ? parseFloat(record.magnetic_deviation) 
          : Number(record.magnetic_deviation);
        
        if (!isNaN(magneticDeviationValue) && magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.warning) {
          const magStatus = magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.critical 
            ? 'critical' 
            : 'warning';
          
          const hallValue = record.hall_effect !== undefined && record.hall_effect !== null
            ? (typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect))
            : undefined;
          
          const sensorData: SensorData = {
            id: `${sensorId}-magnetic-${timestamp}`,
            sensorId,
            sensorType: 'motion',
            value: magneticDeviationValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.magnetic_deviation.warning,
            },
            status: magStatus,
            metadata: {
              is_tampering: record.is_tampering,
              tampering_type: record.tampering_type,
              hall_effect: hallValue,
              ...record.metadata,
            },
          };
          const report = sensorDataToReport(sensorData);
          callback(sensorData, report);
        }
      }
    });
  }, (error) => {
    console.error('Error listening to sensor data:', error);
  });

  // Return cleanup function
  return () => {
    off(sensorsRef);
  };
}

/**
 * Fetch latest sensor data (one-time fetch)
 */
export async function fetchLatestSensorData(limit: number = 10): Promise<SensorData[]> {
  try {
    // Fetch from urbanwatch/sensor_data path
    const sensorsRef = ref(database, 'urbanwatch/sensor_data');
    const snapshot = await get(sensorsRef);
    
    if (!snapshot.exists()) {
      return [];
    }

    const sensorDataRecords = snapshot.val();
    const sensorDataList: SensorData[] = [];

    // Process each record in sensor_data
    Object.keys(sensorDataRecords).forEach((recordKey) => {
      const record = sensorDataRecords[recordKey];
      const sensorId = `sensor-${recordKey}`;
      
      // Parse timestamp
      const timestamp = record.timestamp 
        ? new Date(record.timestamp).getTime() 
        : Date.now();
      
      // Process decibels (noise) - Only if threshold exceeded
      // Parse as number (Firebase may return strings)
      if (record.decibels !== undefined && record.decibels !== null) {
        const decibelsValue = typeof record.decibels === 'string' ? parseFloat(record.decibels) : Number(record.decibels);
        if (isNaN(decibelsValue)) return; // Skip if not a valid number
        
        const decibelStatus = decibelsValue >= SENSOR_THRESHOLDS.decibels.critical 
          ? 'critical' 
          : decibelsValue >= SENSOR_THRESHOLDS.decibels.warning 
          ? 'warning' 
          : 'normal';
        
        if (decibelStatus !== 'normal') {
          sensorDataList.push({
            id: `${sensorId}-decibels-${timestamp}`,
            sensorId,
            sensorType: 'noise',
            value: decibelsValue,
            unit: 'dB',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.decibels.warning,
            },
            status: decibelStatus,
            metadata: {
              amplitude: record.amplitude,
              sound: record.sound,
            },
          });
        }
      }
      
      // Process sound (noise) - Only if threshold exceeded
      // Parse as number (Firebase may return strings)
      if (record.sound !== undefined && record.sound !== null) {
        const soundValue = typeof record.sound === 'string' ? parseFloat(record.sound) : Number(record.sound);
        if (isNaN(soundValue)) return; // Skip if not a valid number
        
        const soundStatus = soundValue >= SENSOR_THRESHOLDS.sound.critical 
          ? 'critical' 
          : soundValue >= SENSOR_THRESHOLDS.sound.warning 
          ? 'warning' 
          : 'normal';
        
        if (soundStatus !== 'normal') {
          sensorDataList.push({
            id: `${sensorId}-sound-${timestamp}`,
            sensorId,
            sensorType: 'noise',
            value: soundValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.sound.warning,
            },
            status: soundStatus,
            metadata: {
              amplitude: record.amplitude,
              decibels: record.decibels,
            },
          });
        }
      }
      
      // Process hall_effect - Only if threshold exceeded
      // Parse as number (Firebase may return strings)
      if (record.hall_effect !== undefined && record.hall_effect !== null) {
        const hallValue = typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect);
        if (isNaN(hallValue)) return; // Skip if not a valid number
        
        const magneticDeviationValue = record.magnetic_deviation !== undefined && record.magnetic_deviation !== null
          ? (typeof record.magnetic_deviation === 'string' ? parseFloat(record.magnetic_deviation) : Number(record.magnetic_deviation))
          : 0;
        
        const hallStatus = hallValue >= SENSOR_THRESHOLDS.hall_effect.critical 
          ? 'critical' 
          : hallValue >= SENSOR_THRESHOLDS.hall_effect.warning 
          ? 'warning' 
          : 'normal';
        
        if (hallStatus !== 'normal') {
          sensorDataList.push({
            id: `${sensorId}-hall-${timestamp}`,
            sensorId,
            sensorType: magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.warning ? 'motion' : 'vibration',
            value: hallValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.hall_effect.warning,
            },
            status: hallStatus,
            metadata: {
              magnetic_deviation: magneticDeviationValue,
              is_tampering: record.is_tampering,
              tampering_type: record.tampering_type,
            },
          });
        }
      }
      
      // Process tampering detection - Always include if tampering detected
      if (record.is_tampering === true) {
        const magneticDeviationValue = record.magnetic_deviation !== undefined && record.magnetic_deviation !== null
          ? (typeof record.magnetic_deviation === 'string' ? parseFloat(record.magnetic_deviation) : Number(record.magnetic_deviation))
          : 0;
        const hallValue = record.hall_effect !== undefined && record.hall_effect !== null
          ? (typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect))
          : 0;
        
        sensorDataList.push({
          id: `${sensorId}-tampering-${timestamp}`,
          sensorId,
          sensorType: 'motion',
          value: magneticDeviationValue || hallValue || 0,
          unit: '',
          location: record.location || { latitude: 0, longitude: 0 },
          timestamp,
          threshold: {
            min: 0,
            max: SENSOR_THRESHOLDS.magnetic_deviation.critical,
          },
          status: 'critical',
          metadata: {
            tampering_type: record.tampering_type || 'Unknown',
            magnetic_deviation: magneticDeviationValue,
            hall_effect: hallValue,
          },
        });
      }
      
      // Process magnetic_deviation - Only if threshold exceeded
      // Parse as number (Firebase may return strings)
      if (record.magnetic_deviation !== undefined && record.magnetic_deviation !== null) {
        const magneticDeviationValue = typeof record.magnetic_deviation === 'string' 
          ? parseFloat(record.magnetic_deviation) 
          : Number(record.magnetic_deviation);
        
        if (!isNaN(magneticDeviationValue) && magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.warning) {
          const magStatus = magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.critical 
            ? 'critical' 
            : 'warning';
          
          const hallValue = record.hall_effect !== undefined && record.hall_effect !== null
            ? (typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect))
            : undefined;
          
          sensorDataList.push({
            id: `${sensorId}-magnetic-${timestamp}`,
            sensorId,
            sensorType: 'motion',
            value: magneticDeviationValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: {
              min: 0,
              max: SENSOR_THRESHOLDS.magnetic_deviation.warning,
            },
            status: magStatus,
            metadata: {
              is_tampering: record.is_tampering,
              tampering_type: record.tampering_type,
              hall_effect: hallValue,
            },
          });
        }
      }
    });

    // Sort by timestamp (newest first) and limit
    return sensorDataList
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return [];
  }
}

/**
 * Generate report from sensor data
 */
export async function generateReportFromSensor(recordKey: string): Promise<EmergencyReport | null> {
  try {
    const sensorRef = ref(database, `urbanwatch/sensor_data/${recordKey}`);
    const snapshot = await get(sensorRef);
    
    if (!snapshot.exists()) {
      return null;
    }

    const record = snapshot.val();
    const sensorId = `sensor-${recordKey}`;
    const timestamp = record.timestamp 
      ? new Date(record.timestamp).getTime() 
      : Date.now();

    // Check which sensor value exceeded threshold and generate report
    // Priority: tampering > magnetic_deviation > decibels > sound > hall_effect
    if (record.is_tampering === true) {
      const magneticDeviationValue = record.magnetic_deviation !== undefined && record.magnetic_deviation !== null
        ? (typeof record.magnetic_deviation === 'string' ? parseFloat(record.magnetic_deviation) : Number(record.magnetic_deviation))
        : 0;
      const hallValue = record.hall_effect !== undefined && record.hall_effect !== null
        ? (typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect))
        : 0;
      
      const sensorData: SensorData = {
        id: `${sensorId}-tampering-${timestamp}`,
        sensorId,
        sensorType: 'motion',
        value: magneticDeviationValue || hallValue || 0,
        unit: '',
        location: record.location || { latitude: 0, longitude: 0 },
        timestamp,
        threshold: {
          min: 0,
          max: SENSOR_THRESHOLDS.magnetic_deviation.critical,
        },
        status: 'critical',
        metadata: {
          tampering_type: record.tampering_type || 'Unknown',
          magnetic_deviation: magneticDeviationValue,
          hall_effect: hallValue,
        },
      };
      return sensorDataToReport(sensorData);
    }

    // Parse as number (Firebase may return strings)
    if (record.decibels !== undefined && record.decibels !== null) {
      const decibelsValue = typeof record.decibels === 'string' ? parseFloat(record.decibels) : Number(record.decibels);
      
      if (!isNaN(decibelsValue) && decibelsValue >= SENSOR_THRESHOLDS.decibels.warning) {
        const decibelStatus = decibelsValue >= SENSOR_THRESHOLDS.decibels.critical ? 'critical' : 'warning';
        const sensorData: SensorData = {
          id: `${sensorId}-decibels-${timestamp}`,
          sensorId,
          sensorType: 'noise',
          value: decibelsValue,
          unit: 'dB',
          location: record.location || { latitude: 0, longitude: 0 },
          timestamp,
          threshold: {
            min: 0,
            max: SENSOR_THRESHOLDS.decibels.warning,
          },
          status: decibelStatus,
          metadata: {
            amplitude: record.amplitude,
            sound: record.sound,
          },
        };
        return sensorDataToReport(sensorData);
      }
    }

    return null;
  } catch (error) {
    console.error('Error generating report from sensor:', error);
    return null;
  }
}

