# UrbanWatch - Purok Officials Portal

A comprehensive mobile application for Purok leaders and officials to monitor and respond to emergency reports from CCTV systems, IoT sensors, and citizen reports in real-time.

## 🎯 Overview

UrbanWatch empowers community leaders with real-time incident monitoring, emergency response coordination, and comprehensive reporting capabilities. The app features a clean, professional interface with a unified design system for easy maintenance and future development.

## ✨ Features

### 🔐 Authentication
- Secure PIN-based login system
- Backend API authentication via Laravel Sanctum
- 4-digit PIN with visual feedback
- Auto-login on PIN completion
- Bearer token-based session management

### 📱 News Feed Dashboard
- **Real-time emergency reports** from multiple sources via Pusher
- **Live citizen concern distribution** to assigned purok leaders
- Filter by source: CCTV, Sensor Box, Citizen Reports
- Pull-to-refresh for latest updates
- Toast notifications for new critical/high severity reports
- Quick emergency report button

### 📊 Reports Management
- View all historical and active reports
- Filter by status: Pending, Ongoing, Resolved
- **Backend API integration** for fetching assigned concerns
- **Status updates** via REST API (ongoing, resolved)
- Detailed report information with severity indicators
- Real-time updates when citizen reports are assigned

### 🔔 Notifications Center
- Real-time alerts and updates via Pusher
- Unread notification tracking
- Mark all as read functionality
- System update notifications
- Toast notifications for new citizen concerns

## 🏗️ Architecture

### Clean Folder Structure
```
├── app/                    # Screens and navigation
│   ├── (auth)/            # Authentication flow
│   └── (tabs)/            # Main app tabs
├── components/            # Reusable components
│   ├── common/           # UI components (Button, Card, Badge)
│   └── news/             # News-specific components
├── constants/            # Design system and global styles
│   └── realtime.ts       # Pusher configuration
├── services/             # Business logic and data services
│   ├── realtime-service.ts      # Pusher real-time subscriptions
│   ├── purok-leader-service.ts  # Backend API integration
│   └── firebase-service.ts      # Sensor/CCTV reports
├── api/                  # API client configuration
│   └── axios.ts          # HTTP client with base URL
└── types/                # TypeScript definitions
```

### Global Design System
All styling is unified through a comprehensive design system:
- ✅ No hardcoded values
- ✅ Consistent colors, typography, spacing
- ✅ Reusable component styles
- ✅ Easy to maintain and extend

### Real-time Architecture

The app uses **Pusher** for real-time communication between the citizen app (`uw-citizen`) and the purok officials app (`uw-purok`).

#### Pusher Configuration
- **Cluster**: `ap1`
- **App Key**: `8abc068a07e65df34203`
- **Auth Endpoint**: `https://www.urbanwatch.me/broadcasting/auth`
- **Authentication**: Bearer token (Laravel Sanctum)

#### Real-time Distribution Flow

1. **Citizen submits a concern** via `uw-citizen` app
2. **Backend assigns the concern** to a purok leader (currently hardcoded to `purok_leader_id = 2`)
3. **Backend broadcasts** `concern.assigned` event on private channel: `private-purok-leader.{purok_leader_id}`
4. **Purok app receives** the event in real-time via Pusher subscription
5. **News feed updates** automatically with new concern card
6. **Toast notification** appears for high/critical severity reports

#### Pusher Channels & Events

- **Private Channel**: `private-purok-leader.{userId}`
  - **Event**: `concern.assigned`
  - **Payload**: Contains `concern`, `citizen`, and `distribution` data
  - **Authentication**: Required (Bearer token in auth headers)

- **Public Channel** (legacy): `citizen-reports`
  - **Event**: `report.created`
  - **Status**: Available but not actively used for purok assignments

### Backend API Integration

The app integrates with the UrbanWatch backend API (`https://www.urbanwatch.me/api/v1`):

#### Authentication Endpoints
- `POST /api/v1/login/purok-leader` - PIN-based login
- `GET /api/v1/auth/user` - Fetch current user profile

#### Purok Leader Endpoints
- `GET /api/v1/purok-leader/concerns` - Fetch all assigned concerns
- `GET /api/v1/purok-leader/concerns/{id}` - Fetch concern details
- `PUT /api/v1/purok-leader/concerns/{id}/status` - Update concern status

#### Data Flow
1. **Initial Load**: Fetch assigned concerns via REST API on app start
2. **Real-time Updates**: Subscribe to Pusher for instant notifications
3. **Status Updates**: Send PUT requests to update concern status
4. **Data Normalization**: Convert API responses to unified `EmergencyReport` format

## 🎨 Design System

### Color Palette
- **Primary Navy**: `#1e2a3d` - Main background and branding
- **Accent Orange**: `#ff5a3d` - Primary actions and highlights
- **Semantic Colors**: Success, Warning, Error, Info

### Typography Scale
- Font sizes: `xs` (12px) to `5xl` (36px)
- Font weights: Regular, Medium, Semibold, Bold
- Consistent line heights

### Spacing System
- Spacing scale: `xs` (4px) to `4xl` (64px)
- Applied consistently across all components

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android    # Android
npm run ios        # iOS
npm run web        # Web browser
```

### Environment Variables

Create a `.env` file or configure environment variables:

```bash
# Pusher Configuration
EXPO_PUBLIC_PUSHER_KEY=8abc068a07e65df34203
EXPO_PUBLIC_PUSHER_CLUSTER=ap1
EXPO_PUBLIC_PUSHER_AUTH_ENDPOINT=https://www.urbanwatch.me/broadcasting/auth

# API Base URL (defaults to https://www.urbanwatch.me/api/v1)
```

### Test Credentials
- **PIN**: `1234` (must be valid in backend database)
- **User**: Must be authenticated as Purok Leader (role_id = 2)
- **Note**: Currently, backend assigns concerns to `purok_leader_id = 2` for testing

## 📱 Screens

### 1. Login Screen
- PIN pad interface with visual feedback
- UrbanWatch branding
- Forgot PIN option

### 2. News Feed
- Emergency reports from all sources
- Filter tabs for source selection
- Emergency report creation button
- Report cards with severity badges

### 3. Reports
- Comprehensive report listing
- Status-based filtering
- Quick acknowledge actions
- Report details view

### 4. Notifications
- Alert center for officials
- Unread indicators
- Timestamp information
- Action notifications

## 🛠️ Development Guidelines

### Using the Design System

```typescript
import { DesignSystem } from '@/constants/design-system';

const { colors, typography, spacing } = DesignSystem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
});
```

### Creating Components

```typescript
import { Button, Card, Badge } from '@/components/common';

// Use pre-built components
<Button 
  title="Submit" 
  onPress={handleSubmit} 
  variant="primary" 
  fullWidth 
/>

<Card variant="elevated">
  <Badge label="CRITICAL" variant="error" />
</Card>
```

### Best Practices
1. ✅ Always use the design system
2. ✅ Never hardcode colors, spacing, or typography
3. ✅ Use TypeScript for type safety
4. ✅ Keep components small and focused
5. ✅ Export through index files for clean imports

## 📦 Component Library

### Common Components
- **Button**: Primary, Secondary, Outline variants
- **Card**: Default and Elevated variants
- **Badge**: Status and severity indicators
- **Header**: Page headers with actions

### News Components
- **ReportCard**: Emergency report display
- **FilterTabs**: Source filter tabs

## 🔄 Data Flow

### Real-time + REST API Integration

The app uses a hybrid approach: **REST API for initial data** and **Pusher for real-time updates**.

#### 1. Initial Data Fetching
```typescript
// services/purok-leader-service.ts
import { fetchAssignedConcerns } from '@/services/purok-leader-service';

// Fetch assigned concerns from backend
const concerns = await fetchAssignedConcerns(accessToken);
```

#### 2. Real-time Subscriptions
```typescript
// services/realtime-service.ts
import { subscribeToPurokAssignments } from '@/services/realtime-service';

// Subscribe to private Pusher channel
const unsubscribe = subscribeToPurokAssignments({
  token: accessToken,
  userId: user.id,
  onReport: (report) => {
    // Handle new concern assignment in real-time
    setReports(prev => [report, ...prev]);
    showToastNotification(report);
  },
});
```

#### 3. Status Updates
```typescript
// Update concern status via REST API
import { updateAssignedConcernStatus } from '@/services/purok-leader-service';

await updateAssignedConcernStatus(accessToken, concernId, 'resolved');
```

### Data Normalization

All API responses and Pusher payloads are normalized into a unified `EmergencyReport` format:

```typescript
interface EmergencyReport {
  id: string;                    // Format: "PUROK-{concern_id}"
  title: string;
  description: string;
  type: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious' | 'other';
  location: string;
  timestamp: Date;
  status: 'pending' | 'ongoing' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'cctv' | 'sensor' | 'citizen';
  reportedBy?: string;
}
```

## 📋 Type Definitions

All types are centralized in `types/index.ts`:

```typescript
interface EmergencyReport {
  id: string;
  type: 'accident' | 'crime' | 'fire' | 'medical' | 'suspicious';
  title: string;
  description: string;
  location: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source?: 'cctv' | 'sensor' | 'citizen';
}
```

## 🔌 API Integration Details

### Purok Leader Service

The `services/purok-leader-service.ts` module provides helper functions for backend integration:

#### Fetch Assigned Concerns
```typescript
const concerns = await fetchAssignedConcerns(accessToken);
// Returns: EmergencyReport[]
```

#### Fetch Concern Detail
```typescript
const concern = await fetchAssignedConcernDetail(accessToken, concernId);
// Returns: EmergencyReport
```

#### Update Concern Status
```typescript
await updateAssignedConcernStatus(accessToken, concernId, 'resolved');
// Status options: 'pending' | 'ongoing' | 'escalated' | 'resolved'
```

### Real-time Service

The `services/realtime-service.ts` module handles Pusher subscriptions:

#### Subscribe to Purok Assignments
```typescript
const unsubscribe = subscribeToPurokAssignments({
  token: accessToken,
  userId: user.id,
  onReport: (report: EmergencyReport) => {
    // Handle new concern assignment
  },
});
```

#### Channel & Event Details
- **Channel**: `private-purok-leader.{userId}`
- **Event**: `concern.assigned`
- **Authentication**: Bearer token required
- **Payload**: Contains `concern`, `citizen`, and `distribution` objects

## 🎯 Future Enhancements

- [x] Real-time updates via Pusher ✅
- [x] Backend API integration ✅
- [x] Citizen concern distribution ✅
- [ ] Push notifications (FCM/APNS)
- [x] Map view of incidents ✅ (OpenStreetMap integration)
- [ ] Report creation with photo/video
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Offline mode with sync
- [ ] Voice commands
- [ ] Report export (PDF/Excel)
- [ ] Advanced filtering and search

## 🤝 Contributing

1. Follow the established folder structure
2. Use the design system for all styling
3. Maintain type safety
4. Write clean, documented code
5. Test on multiple devices

## 📄 License

Copyright © 2025 UrbanWatch. All rights reserved.

## 📞 Support

For support and questions, contact your system administrator.

---

**Tech Stack**: React Native • Expo • TypeScript • Expo Router • Pusher • Laravel Sanctum

**Design**: Custom Design System with Unified Theming

**Backend API**: `https://www.urbanwatch.me/api/v1`

**Real-time**: Pusher (Cluster: `ap1`)

**Version**: 1.0.0

---

## 📚 Real-time Distribution Architecture

### Overview

This feature automatically distributes citizen concerns to purok leaders and sends real-time notifications via Pusher when a new concern is submitted.

### Events (ConcernAssigned Event)

**Channel:** `private-purok-leader.{purok_leader_id}` (Laravel automatically prepends `private-` for private channels)

**Event:** `concern.assigned`

**Important Note on `purok_leader_id`:** Currently, the backend logic for assigning concerns to a Purok Leader is hardcoded to `purok_leader_id = 2`. This means that only frontend applications authenticated as `User ID 2` (with `role_id = 2`) will receive these broadcasted events.

### Implementation

The app uses `pusher-js/react-native` for real-time subscriptions:

1. **Initialization**: Pusher client is initialized with the app key, cluster, and auth endpoint
2. **Authentication**: Bearer token is passed in auth headers for private channel access
3. **Subscription**: App subscribes to `private-purok-leader.{userId}` channel
4. **Event Binding**: Listens for `concern.assigned` events
5. **Data Normalization**: Incoming payloads are normalized into `EmergencyReport` format
6. **UI Updates**: News feed and toast notifications are updated automatically

### Payload Structure

```json
{
  "concern": {
    "id": 42,
    "title": "Voice Concern - Nov 24, 08:30",
    "description": "Audio recording received. Transcription pending...",
    "category": "safety",
    "severity": "low",
    "status": "pending",
    "created_at": "2025-11-24T08:30:00.000000Z",
    "images": [],
    "audio": "https://r2.cloudflarestorage.com/bucket/concerns/audio/12345.mp3",
    "summary": null,
    "transcript": null
  },
  "citizen": {
    "name": "Juan Dela Cruz"
  },
  "distribution": {
    "id": 1,
    "status": "assigned",
    "assigned_at": "2025-11-24T08:30:00.000000Z"
  }
}
```

For more details, see `services/realtime-service.ts` and `services/purok-leader-service.ts`.
