# UrbanWatch - Purok Officials Portal

A comprehensive mobile application for Purok leaders and officials to monitor and respond to emergency reports from CCTV systems, IoT sensors, and citizen reports in real-time.

## 🎯 Overview

UrbanWatch empowers community leaders with real-time incident monitoring, emergency response coordination, and comprehensive reporting capabilities. The app features a clean, professional interface with a unified design system for easy maintenance and future development.

## ✨ Features

### 🔐 Authentication
- Secure PIN-based login system
- 6-digit PIN with visual feedback
- Auto-login on PIN completion

### 📱 News Feed Dashboard
- Real-time emergency reports from multiple sources
- Filter by source: CCTV, Sensor Box, Citizen Reports
- Pull-to-refresh for latest updates
- Quick emergency report button

### 📊 Reports Management
- View all historical and active reports
- Filter by status: Pending, Active, Resolved
- Acknowledge and manage emergency reports
- Detailed report information with severity indicators

### 🔔 Notifications Center
- Real-time alerts and updates
- Unread notification tracking
- Mark all as read functionality
- System update notifications

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
├── services/             # Business logic and data services
└── types/                # TypeScript definitions
```

### Global Design System
All styling is unified through a comprehensive design system:
- ✅ No hardcoded values
- ✅ Consistent colors, typography, spacing
- ✅ Reusable component styles
- ✅ Easy to maintain and extend

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

### Test Credentials
- **PIN**: `1234`
- **User**: Juan Dela Cruz
- **Purok**: Purok 1 - Argus

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

### Current: Mock Data
```typescript
import { mockReports, mockUser } from '@/services/mock-data';
```

### Future: API Integration
Replace mock services with real API calls:
```typescript
// services/api.ts
export async function fetchReports(): Promise<EmergencyReport[]> {
  const response = await fetch('https://api.urbanwatch.com/reports');
  return response.json();
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

## 🎯 Future Enhancements

- [ ] Real-time updates via WebSocket
- [ ] Push notifications
- [ ] Map view of incidents
- [ ] Report creation with photo/video
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Offline mode
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

**Tech Stack**: React Native • Expo • TypeScript • Expo Router

**Design**: Custom Design System with Unified Theming

**Version**: 1.0.0
