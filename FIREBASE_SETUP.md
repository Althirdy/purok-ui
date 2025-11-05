# Firebase Integration Guide

This document explains how the Firebase integration works for fetching IoT sensor data and generating reports.

## Installation

Make sure you have Firebase installed:

```bash
npm install firebase
```

## Firebase Configuration

The Firebase configuration is stored in `config/firebase.ts` with your provided credentials:

- Project ID: `urbanwatch-d3ddf`
- Database URL: `https://urbanwatch-d3ddf-default-rtdb.asia-southeast1.firebasedatabase.app`

## Firebase Database Structure

The app expects sensor data to be stored in Firebase Realtime Database under the `sensors` node. The service supports multiple data structures:

### Structure 1: Direct Sensor Data
```
sensors/
  {sensorId}/
    sensorType: "temperature" | "smoke" | "motion" | "air_quality" | "noise" | "vibration"
    value: 25.5
    unit: "°C" | "ppm" | etc.
    location: {
      latitude: 14.6042,
      longitude: 121.0823,
      address: "Barangay 176, Near Metroplaza" (optional)
    }
    timestamp: 1234567890 (Unix timestamp in milliseconds)
    status: "normal" | "warning" | "critical"
    threshold: {
      min: 0,
      max: 100
    } (optional)
    metadata: {
      deviceId: "device-001",
      batteryLevel: 85,
      signalStrength: -65
    } (optional)
```

### Structure 2: Sensor with Data Array
```
sensors/
  {sensorId}/
    data: [
      {
        sensorType: "smoke",
        value: 150,
        unit: "ppm",
        location: { latitude: 14.6042, longitude: 121.0823 },
        timestamp: 1234567890,
        status: "critical",
        ...
      },
      ...
    ]
```

## How It Works

### 1. Real-time Listener
- The app sets up a real-time listener on the `sensors` node
- When new sensor data is detected, it automatically:
  - Converts sensor data to emergency reports
  - Adds the report to the news feed
  - Shows notifications for critical/high severity alerts

### 2. Report Generation
Sensor data is automatically converted to emergency reports based on:
- **Sensor Type**: Determines the report category (fire, suspicious, medical, etc.)
- **Value & Status**: Determines severity (critical, high, medium, low)
- **Location**: Used for report location

### 3. Sensor Type Mappings

| Sensor Type | Report Type | Severity Logic |
|------------|------------|----------------|
| `smoke` | Fire | Critical if status=critical, High otherwise |
| `temperature` | Fire (if >50°C) or Other | High if >50°C, Medium otherwise |
| `motion` | Suspicious | High if critical, Medium otherwise |
| `air_quality` | Medical (if >100) or Other | High if >100, Low otherwise |
| `noise` | Other | Medium if >80dB, Low otherwise |
| `vibration` | Accident | High if critical, Medium otherwise |

### 4. Notifications
- **Critical/High Severity**: Shows alert dialog immediately
- **All Reports**: Appears in news feed with notification badge
- Badge shows count of pending reports + new sensor reports

## Testing

To test the integration:

1. **Set up Firebase Realtime Database** with the structure above
2. **Add test sensor data** to your Firebase database
3. **Run the app** - it will automatically listen for updates
4. **Push new data** to Firebase - it should appear in the news feed

### Example Test Data

Add this to Firebase Realtime Database:

```json
{
  "sensors": {
    "sensor-001": {
      "sensorType": "smoke",
      "value": 200,
      "unit": "ppm",
      "location": {
        "latitude": 14.6042,
        "longitude": 121.0823,
        "address": "Barangay 176, Near Metroplaza"
      },
      "timestamp": 1704067200000,
      "status": "critical"
    }
  }
}
```

This should generate a Fire report with Critical severity that appears in the news feed with an alert notification.

## Features

✅ Real-time sensor data listening
✅ Automatic report generation from sensor data
✅ Push notifications for critical alerts
✅ Filter by sensor source in news feed
✅ Report acknowledgment
✅ Badge notifications for new reports

## Troubleshooting

1. **No data appearing**: Check Firebase database rules allow read access
2. **Connection errors**: Verify Firebase config credentials are correct
3. **Notifications not showing**: Check if sensor status is "critical" or "high"
4. **Reports not generating**: Verify sensor data structure matches expected format

## Security Notes

⚠️ **Important**: The Firebase config contains API keys. In production:
- Use environment variables for sensitive config
- Set up proper Firebase Database Rules
- Restrict read/write access appropriately
- Consider using Firebase App Check for additional security

