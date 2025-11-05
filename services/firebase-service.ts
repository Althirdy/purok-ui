/**
 * Firebase Service - Handles IoT Sensor Data Fetching
 */

import { database } from '@/config/firebase';
import { SENSOR_RULES, SENSOR_THRESHOLDS } from '@/constants/sensor-config';
import type { EmergencyReport } from '@/types';
import { DataSnapshot, get, limitToLast, off, onChildAdded, orderByChild, query, ref, startAt } from 'firebase/database';

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

// Consider only very recent sensor records (last 5 minutes)
const RECENT_WINDOW_MS = 5 * 60 * 1000;

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
      reportType = SENSOR_RULES.reportTypeMapping.smoke;
      severity = SENSOR_RULES.severityMapping.smoke(sensorData.status);
      title = 'Smoke Detected';
      description = `Smoke sensor detected ${sensorData.value} ${sensorData.unit} of smoke particles. Status: ${sensorData.status.toUpperCase()}`;
      break;
    
    case 'temperature':
      reportType = SENSOR_RULES.reportTypeMapping.temperature(sensorData.value);
      severity = SENSOR_RULES.severityMapping.temperature(sensorData.value);
      if (sensorData.value > SENSOR_THRESHOLDS.temperature.critical) {
        title = 'High Temperature Detected';
        description = `Temperature sensor reading: ${sensorData.value}°C. Possible fire risk.`;
      } else {
        title = 'Temperature Alert';
        description = `Temperature sensor reading: ${sensorData.value}°C`;
      }
      break;
    
    case 'humidity':
      reportType = SENSOR_RULES.reportTypeMapping.humidity;
      severity = SENSOR_RULES.severityMapping.humidity(sensorData.value);
      if (sensorData.value > SENSOR_THRESHOLDS.humidity.critical) {
        title = 'High Humidity Detected';
        description = `Humidity sensor reading: ${sensorData.value}%. High moisture levels detected.`;
      } else {
        title = 'Humidity Alert';
        description = `Humidity sensor reading: ${sensorData.value}%`;
      }
      break;
    
    case 'motion':
      // Check if this is a tampering alert
      const motionMetadata = sensorData.metadata ? {
        is_tampering: sensorData.metadata.is_tampering,
        magnetic_deviation: typeof sensorData.metadata.magnetic_deviation === 'string' 
          ? parseFloat(sensorData.metadata.magnetic_deviation) 
          : (typeof sensorData.metadata.magnetic_deviation === 'number' ? sensorData.metadata.magnetic_deviation : undefined)
      } : undefined;
      
      reportType = SENSOR_RULES.reportTypeMapping.motion(motionMetadata);
      if (sensorData.metadata?.is_tampering === true || sensorData.metadata?.tampering_type) {
        severity = 'critical';
        title = 'Device Tampering Detected';
        description = `Tampering detected. Type: ${sensorData.metadata.tampering_type || 'Unknown'}. Immediate attention required.`;
      } else if (sensorData.metadata?.magnetic_deviation) {
        const magDevValue = typeof sensorData.metadata.magnetic_deviation === 'string' 
          ? parseFloat(sensorData.metadata.magnetic_deviation) 
          : Number(sensorData.metadata.magnetic_deviation);
        if (!isNaN(magDevValue) && magDevValue >= SENSOR_THRESHOLDS.magnetic_deviation.critical) {
          severity = 'high';
          title = 'Suspicious Magnetic Activity';
          description = `Unusual magnetic deviation detected. Possible tampering attempt.`;
        } else {
          severity = SENSOR_RULES.severityMapping.motion(sensorData.status, motionMetadata);
          title = 'Motion Detected';
          description = `Unusual activity detected.`;
        }
      } else {
        severity = SENSOR_RULES.severityMapping.motion(sensorData.status, motionMetadata);
        title = 'Motion Detected';
        description = `Unusual activity detected.`;
      }
      break;
    
    case 'noise':
      // Use status from threshold check (already done in listener)
      reportType = SENSOR_RULES.reportTypeMapping.noise;
      severity = SENSOR_RULES.severityMapping.noise(sensorData.status);
      if (sensorData.status === 'critical') {
        title = 'Critical Noise Level Detected';
        description = `High noise level detected: ${sensorData.value}${sensorData.unit ? ' ' + sensorData.unit : ''}. May indicate disturbance or emergency.`;
      } else if (sensorData.status === 'warning') {
        title = 'High Noise Level';
        description = `Noise level detected: ${sensorData.value}${sensorData.unit ? ' ' + sensorData.unit : ''}.`;
      } else {
        title = 'Noise Alert';
        description = `Noise level: ${sensorData.value}${sensorData.unit ? ' ' + sensorData.unit : ''}`;
      }
      break;
    
    case 'vibration':
      reportType = SENSOR_RULES.reportTypeMapping.vibration;
      severity = SENSOR_RULES.severityMapping.vibration(sensorData.status);
      title = 'Vibration Detected';
      description = `Vibration sensor detected unusual movement. Value: ${sensorData.value}`;
      break;
    
    default:
      reportType = 'other';
      severity = 'medium';
      title = `Sensor Alert: ${sensorData.sensorType}`;
      description = `${sensorData.sensorType} sensor reading: ${sensorData.value} ${sensorData.unit}`;
  }

  // Format location: short lat/lng for concise UI
  const location = sensorData.location.address || 
    `Lat ${sensorData.location.latitude.toFixed(4)}, Lng ${sensorData.location.longitude.toFixed(4)}`;

  // Generate truly unique report ID with random suffix
  const randomSuffix = Math.random().toString(36).substring(2, 11); // 9 chars random
  const timestamp = sensorData.timestamp || Date.now();
  const sensorFieldType = sensorData.metadata?.is_tampering ? 'tampering' :
    sensorData.metadata?.magnetic_deviation ? 'magnetic' :
    sensorData.sensorType === 'noise' ? (sensorData.unit === 'dB' ? 'decibels' : 'sound') :
    sensorData.sensorType === 'motion' || sensorData.sensorType === 'vibration' ? 'hall' :
    sensorData.sensorType;
  const reportId = `SENSOR-${sensorData.sensorId}-${sensorFieldType}-${timestamp}-${randomSuffix}`;

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
  };
}

// Export thresholds for use in other files
export { SENSOR_THRESHOLDS } from '@/constants/sensor-config';

/**
 * Listen to sensor data from Firebase Realtime Database
 * @param callback Function to call when new sensor data is received
 * @returns Cleanup function to unsubscribe
 */
export function listenToSensorData(
  callback: (sensorData: SensorData, report: EmergencyReport) => void
): () => void {
  const sensorsRef = ref(database, 'urbanwatch/anomaly_data');

  // Query only recent items; also rely on onChildAdded for realtime new children
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  const recentQuery = query(
    sensorsRef,
    orderByChild('timestamp'),
    startAt(new Date(cutoff).toISOString()),
    limitToLast(100)
  );

  const processedKeys = new Set<string>();

  const unsubscribe = onChildAdded(recentQuery, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) return;
    const recordKey = snapshot.key as string;
    if (processedKeys.has(recordKey)) return;
    const record = snapshot.val();

    // Parse and validate recency
    const date = record.timestamp ? new Date(record.timestamp) : new Date();
    const timestamp = !isNaN(date.getTime()) ? date.getTime() : Date.now();
    if (timestamp < cutoff) return; // ignore stale

    const sensorId = `sensor-${recordKey}`;

    // Process decibels (noise)
    if (record.decibels !== undefined && record.decibels !== null) {
      const decibelsValue = typeof record.decibels === 'string' ? parseFloat(record.decibels) : Number(record.decibels);
      if (!isNaN(decibelsValue)) {
        const decibelStatus = SENSOR_RULES.statusRules.getStatus(
          decibelsValue,
          SENSOR_THRESHOLDS.decibels.warning,
          SENSOR_THRESHOLDS.decibels.critical
        );
        if (decibelStatus !== 'normal') {
          const sensorData: SensorData = {
            id: `${sensorId}-decibels-${timestamp}`,
            sensorId,
            sensorType: 'noise',
            value: decibelsValue,
            unit: 'dB',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: { min: 0, max: SENSOR_THRESHOLDS.decibels.warning },
            status: decibelStatus,
            metadata: { amplitude: record.amplitude, sound: record.sound, ...record.metadata },
          };
          const report = sensorDataToReport(sensorData);
          callback(sensorData, report);
        }
      }
    }

    // Process sound (noise)
    if (record.sound !== undefined && record.sound !== null) {
      const soundValue = typeof record.sound === 'string' ? parseFloat(record.sound) : Number(record.sound);
      if (!isNaN(soundValue)) {
        const soundStatus = SENSOR_RULES.statusRules.getStatus(
          soundValue,
          SENSOR_THRESHOLDS.sound.warning,
          SENSOR_THRESHOLDS.sound.critical
        );
        if (soundStatus !== 'normal') {
          const sensorData: SensorData = {
            id: `${sensorId}-sound-${timestamp}`,
            sensorId,
            sensorType: 'noise',
            value: soundValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: { min: 0, max: SENSOR_THRESHOLDS.sound.warning },
            status: soundStatus,
            metadata: { amplitude: record.amplitude, decibels: record.decibels, ...record.metadata },
          };
          const report = sensorDataToReport(sensorData);
          callback(sensorData, report);
        }
      }
    }

    // Process hall_effect (motion/vibration)
    if (record.hall_effect !== undefined && record.hall_effect !== null) {
      const hallValue = typeof record.hall_effect === 'string' ? parseFloat(record.hall_effect) : Number(record.hall_effect);
      if (!isNaN(hallValue)) {
        const magneticDeviationValue = record.magnetic_deviation !== undefined && record.magnetic_deviation !== null
          ? (typeof record.magnetic_deviation === 'string' ? parseFloat(record.magnetic_deviation) : Number(record.magnetic_deviation))
          : 0;
        const hallStatus = SENSOR_RULES.statusRules.getStatus(
          hallValue,
          SENSOR_THRESHOLDS.hall_effect.warning,
          SENSOR_THRESHOLDS.hall_effect.critical
        );
        if (hallStatus !== 'normal') {
          const sensorData: SensorData = {
            id: `${sensorId}-hall-${timestamp}`,
            sensorId,
            sensorType: magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.warning ? 'motion' : 'vibration',
            value: hallValue,
            unit: '',
            location: record.location || { latitude: 0, longitude: 0 },
            timestamp,
            threshold: { min: 0, max: SENSOR_THRESHOLDS.hall_effect.warning },
            status: hallStatus,
            metadata: { magnetic_deviation: magneticDeviationValue, is_tampering: record.is_tampering, tampering_type: record.tampering_type, ...record.metadata },
          };
          const report = sensorDataToReport(sensorData);
          callback(sensorData, report);
        }
      }
    }

    // Tampering (always report)
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
        threshold: { min: 0, max: SENSOR_THRESHOLDS.magnetic_deviation.critical },
        status: 'critical',
        metadata: { tampering_type: record.tampering_type || 'Unknown', magnetic_deviation: magneticDeviationValue, hall_effect: hallValue, ...record.metadata },
      };
      const report = sensorDataToReport(sensorData);
      callback(sensorData, report);
    }

    // magnetic_deviation (warning and above)
    if (record.magnetic_deviation !== undefined && record.magnetic_deviation !== null) {
      const magneticDeviationValue = typeof record.magnetic_deviation === 'string' ? parseFloat(record.magnetic_deviation) : Number(record.magnetic_deviation);
      if (!isNaN(magneticDeviationValue) && magneticDeviationValue >= SENSOR_THRESHOLDS.magnetic_deviation.warning) {
        const magStatus = SENSOR_RULES.statusRules.getStatus(
          magneticDeviationValue,
          SENSOR_THRESHOLDS.magnetic_deviation.warning,
          SENSOR_THRESHOLDS.magnetic_deviation.critical
        );
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
          threshold: { min: 0, max: SENSOR_THRESHOLDS.magnetic_deviation.warning },
          status: magStatus,
          metadata: { is_tampering: record.is_tampering, tampering_type: record.tampering_type, hall_effect: hallValue, ...record.metadata },
        };
        const report = sensorDataToReport(sensorData);
        callback(sensorData, report);
      }
    }

    processedKeys.add(recordKey);
  }, (error) => {
    console.error('Error listening to sensor data:', error);
  });

  return () => {
    off(recentQuery);
    processedKeys.clear();
  };
}

/**
 * Fetch latest sensor data (one-time fetch)
 */
export async function fetchLatestSensorData(limit: number = 10): Promise<SensorData[]> {
  // Legacy helper now points to anomaly_data for consistency
  try {
    const sensorsRef = ref(database, 'urbanwatch/anomaly_data');
    const cutoff = Date.now() - RECENT_WINDOW_MS;
    // Try to fetch only the most recent items by timestamp, then filter by cutoff as safeguard
    const recentQuery = query(
      sensorsRef,
      orderByChild('timestamp'),
      startAt(new Date(cutoff).toISOString()),
      limitToLast(limit * 5)
    );
    const snapshot = await get(recentQuery);
    
    if (!snapshot.exists()) {
      return [];
    }

    const sensorDataList: SensorData[] = [];

    snapshot.forEach((child) => {
      const recordKey = child.key as string;
      const record = child.val();
      const sensorId = `sensor-${recordKey}`;
      
      // Parse timestamp - ensure proper date parsing
      let timestamp: number;
      if (record.timestamp) {
        const date = new Date(record.timestamp);
        timestamp = !isNaN(date.getTime()) ? date.getTime() : Date.now();
      } else {
        timestamp = Date.now();
      }

      // Skip stale items outside the recent window
      if (timestamp < cutoff) {
        return;
      }
      
      // Process decibels (noise) - Only if threshold exceeded
      // Parse as number (Firebase may return strings)
      if (record.decibels !== undefined && record.decibels !== null) {
        const decibelsValue = typeof record.decibels === 'string' ? parseFloat(record.decibels) : Number(record.decibels);
        if (isNaN(decibelsValue)) return; // Skip if not a valid number
        
        const decibelStatus = SENSOR_RULES.statusRules.getStatus(
          decibelsValue,
          SENSOR_THRESHOLDS.decibels.warning,
          SENSOR_THRESHOLDS.decibels.critical
        );
        
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
        
        const soundStatus = SENSOR_RULES.statusRules.getStatus(
          soundValue,
          SENSOR_THRESHOLDS.sound.warning,
          SENSOR_THRESHOLDS.sound.critical
        );
        
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
        
        const hallStatus = SENSOR_RULES.statusRules.getStatus(
          hallValue,
          SENSOR_THRESHOLDS.hall_effect.warning,
          SENSOR_THRESHOLDS.hall_effect.critical
        );
        
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
          const magStatus = SENSOR_RULES.statusRules.getStatus(
            magneticDeviationValue,
            SENSOR_THRESHOLDS.magnetic_deviation.warning,
            SENSOR_THRESHOLDS.magnetic_deviation.critical
          );
          
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
 * Fetch anomalies since a given timestamp (ms). Defaults to last 5 minutes window if not provided.
 */
export async function fetchLatestAnomaliesSince(sinceMs?: number, limit: number = 20): Promise<SensorData[]> {
  try {
    const sensorsRef = ref(database, 'urbanwatch/anomaly_data');
    const cutoff = sinceMs ?? (Date.now() - RECENT_WINDOW_MS);
    let snapshot: DataSnapshot | null = null;
    try {
      const recentQuery = query(
        sensorsRef,
        orderByChild('timestamp'),
        startAt(new Date(cutoff).toISOString()),
        limitToLast(limit * 5)
      );
      snapshot = await get(recentQuery);
    } catch (err) {
      // Index missing on backend; fallback to simple limit and client-side filter
      console.warn('Anomaly index missing, falling back to client filter:', err);
      const fallbackQuery = query(sensorsRef, limitToLast(limit * 10));
      snapshot = await get(fallbackQuery);
    }
    if (!snapshot.exists()) return [];
    const list: SensorData[] = [];
    snapshot.forEach((child) => {
      const recordKey = child.key as string;
      const record = child.val();
      const sensorId = `sensor-${recordKey}`;
      let timestamp: number;
      if (record.timestamp) {
        const date = new Date(record.timestamp);
        timestamp = !isNaN(date.getTime()) ? date.getTime() : Date.now();
      } else {
        timestamp = Date.now();
      }
      if (timestamp < cutoff) return;
      // Build minimal SensorData structure
      const sensorData: SensorData = {
        id: `${sensorId}-${timestamp}`,
        sensorId,
        sensorType: (record.sensorType || 'other') as SensorData['sensorType'],
        value: Number(record.value ?? 0),
        unit: record.unit ?? '',
        location: record.location || { latitude: 0, longitude: 0 },
        timestamp,
        status: (record.status || 'warning') as SensorData['status'],
        metadata: { ...record.metadata },
      };
      list.push(sensorData);
    });
    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  } catch (e) {
    console.error('Error fetching anomalies:', e);
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
        const decibelStatus = SENSOR_RULES.statusRules.getStatus(
          decibelsValue,
          SENSOR_THRESHOLDS.decibels.warning,
          SENSOR_THRESHOLDS.decibels.critical
        );
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

