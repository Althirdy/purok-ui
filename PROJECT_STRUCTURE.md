# UrbanWatch Purok Officials App - Project Structure

## Overview
A mobile application for Purok leaders and officials to monitor and respond to emergency reports from CCTV, sensors, and citizen reports.

## Folder Structure

```
purok-ui/
├── app/                          # App screens and navigation
│   ├── (auth)/                   # Authentication flow
│   │   ├── _layout.tsx          # Auth layout wrapper
│   │   └── login.tsx            # PIN login screen
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx          # Tab navigation config
│   │   ├── news-feed.tsx        # Main news and reports feed
│   │   ├── reports.tsx          # All reports view
│   │   ├── notifications.tsx    # Notifications center
│   │   ├── index.tsx            # (Legacy - hidden)
│   │   └── explore.tsx          # (Legacy - hidden)
│   └── _layout.tsx              # Root layout
│
├── components/                   # Reusable components
│   ├── common/                   # Common UI components
│   │   ├── button.tsx           # Button component
│   │   ├── card.tsx             # Card container
│   │   ├── badge.tsx            # Badge/label component
│   │   ├── header.tsx           # Header component
│   │   └── index.ts             # Exports
│   ├── news/                     # News feed specific components
│   │   ├── report-card.tsx      # Emergency report card
│   │   ├── filter-tabs.tsx      # Feed filter tabs
│   │   └── index.ts             # Exports
│   └── ui/                       # Base UI components
│       ├── icon-symbol.tsx      # Icon wrapper
│       └── collapsible.tsx      # Collapsible component
│
├── constants/                    # Global constants and theme
│   ├── design-system.ts         # Complete design system
│   ├── global-styles.ts         # Reusable style patterns
│   └── theme.ts                 # (Legacy theme)
│
├── services/                     # Business logic and data
│   └── mock-data.ts             # Mock data for development
│
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All app types
│
└── hooks/                        # Custom React hooks
    └── use-color-scheme.ts      # Color scheme hook
```

## Design System

### Global Theme (`constants/design-system.ts`)
All styling is centralized in the design system:

- **Colors**: Primary (navy), Accent (orange), Neutral, Semantic, Text, Background
- **Typography**: Font sizes, weights, line heights
- **Spacing**: Consistent spacing scale (xs to 4xl)
- **Border Radius**: Standardized border radius values
- **Shadows**: Elevation shadows (sm, md, lg)
- **Component Styles**: Pre-defined component configurations

### Usage Example
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

## Key Features

### 1. Authentication
- **Screen**: `app/(auth)/login.tsx`
- PIN-based authentication with visual feedback
- Auto-login when 6 digits entered
- Mock authentication (PIN: 1234)

### 2. News Feed
- **Screen**: `app/(tabs)/news-feed.tsx`
- Real-time emergency reports
- Filter by source (All, CCTV, Sensor Box, Citizens)
- Pull-to-refresh functionality
- Emergency report button

### 3. Reports Management
- **Screen**: `app/(tabs)/reports.tsx`
- View all reports
- Filter by status (All, Pending, Active, Resolved)
- Acknowledge and manage reports

### 4. Notifications
- **Screen**: `app/(tabs)/notifications.tsx`
- Alert center for officials
- Unread notification tracking
- Mark as read functionality

## Component Library

### Common Components
All components use the global design system:

```typescript
import { Button, Card, Badge, Header } from '@/components/common';

// Primary button
<Button title="Login" onPress={handleLogin} variant="primary" />

// Card with press handler
<Card onPress={handlePress} variant="elevated">
  {children}
</Card>

// Status badge
<Badge label="CRITICAL" variant="error" />
```

### Report Card Component
```typescript
<ReportCard
  report={reportData}
  onPress={handleViewReport}
  onAcknowledge={handleAcknowledge}
/>
```

## Type Definitions

All types are defined in `types/index.ts`:

- `User`: User profile and authentication
- `EmergencyReport`: Report data structure
- `FeedSource`: Feed filter types
- `ButtonProps`, `CardProps`, etc.: Component prop types

## Navigation Flow

```
(auth) - Login Screen
  ↓
(tabs)
  ├── news-feed - Main dashboard
  ├── reports - All reports view
  └── notifications - Alert center
```

## Color Palette

### Primary Colors
- **Navy**: `#1e2a3d` (Main background)
- **Navy Dark**: `#151d2b`
- **Navy Light**: `#2a3a52`

### Accent Colors
- **Orange**: `#ff5a3d` (Primary actions)
- **Orange Light**: `#ff7659`
- **Orange Dark**: `#e64d33`

### Semantic Colors
- **Success**: `#10b981`
- **Warning**: `#f59e0b`
- **Error**: `#ef4444`
- **Info**: `#3b82f6`

## Best Practices

### 1. Never Use Hardcoded Values
❌ Bad:
```typescript
const styles = {
  container: {
    backgroundColor: '#1e2a3d',
    padding: 20,
  }
};
```

✅ Good:
```typescript
import { DesignSystem } from '@/constants/design-system';
const { colors, spacing } = DesignSystem;

const styles = {
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
  }
};
```

### 2. Use Global Styles for Common Patterns
```typescript
import { globalStyles } from '@/constants/global-styles';

// Use pre-defined styles
<View style={globalStyles.container}>
  <Text style={globalStyles.textHeading2}>Title</Text>
  <Text style={globalStyles.textBody}>Body text</Text>
</View>
```

### 3. Component Organization
- Keep components small and focused
- Export through index files
- Use TypeScript for prop types
- Document complex components

### 4. Styling Convention
- Use `StyleSheet.create` for performance
- Group styles by component sections
- Follow naming convention: `componentPart` (e.g., `headerTitle`, `cardBody`)

## Data Flow

### Current Implementation (Mock Data)
```typescript
import { mockReports, mockUser } from '@/services/mock-data';
```

### Future: API Integration
Replace mock data service with API calls:
```typescript
// services/api.ts
export async function fetchReports(): Promise<EmergencyReport[]> {
  const response = await fetch('/api/reports');
  return response.json();
}
```

## Development Guidelines

1. **Always use the design system** - Never hardcode colors, spacing, or typography
2. **Maintain type safety** - Define types for all data structures
3. **Component reusability** - Create reusable components in `components/common`
4. **Consistent naming** - Follow the established naming conventions
5. **Clean imports** - Use index files for cleaner imports

## Testing Data

### Test PIN
- **PIN**: `1234`

### Test User
```typescript
{
  id: 'user-001',
  name: 'Juan Dela Cruz',
  role: 'purok_leader',
  purokId: 'purok-001',
  purokName: 'Purok 1 - Argus',
}
```

## Future Enhancements

1. Real-time updates (WebSocket integration)
2. Push notifications
3. Report creation and submission
4. Map view of incidents
5. Analytics dashboard
6. Multi-language support
7. Offline mode support
8. Report attachments (photos, videos)

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

---

**Built with**: React Native + Expo Router + TypeScript
**Design System**: Custom design system with unified theming
**Architecture**: Component-based with centralized styling

