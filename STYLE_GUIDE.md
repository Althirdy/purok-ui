# UrbanWatch Style Guide

## Design System Usage

### ✅ DO: Use Design System Constants

```typescript
import { DesignSystem } from '@/constants/design-system';
const { colors, typography, spacing, borderRadius } = DesignSystem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
});
```

### ❌ DON'T: Hardcode Values

```typescript
// BAD - Never do this!
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e2a3d',  // ❌ Hardcoded color
    padding: 20,                  // ❌ Hardcoded spacing
    borderRadius: 12,             // ❌ Hardcoded radius
  },
  title: {
    fontSize: 24,                 // ❌ Hardcoded font size
    fontWeight: '700',            // ❌ Hardcoded weight
    color: '#fff',                // ❌ Hardcoded color
  },
});
```

## Color Usage

### Background Colors
```typescript
colors.background.primary    // Main screen background (#1e2a3d)
colors.background.secondary  // Cards and elevated sections (#2a3a52)
colors.background.card       // Card background
colors.background.overlay    // Modal overlays
```

### Text Colors
```typescript
colors.text.primary         // Main text (white)
colors.text.secondary       // Secondary text (gray)
colors.text.tertiary        // Tertiary text (lighter gray)
colors.text.inverse         // Inverse text (dark on light)
```

### Accent Colors
```typescript
colors.accent.orange        // Primary actions (#ff5a3d)
colors.accent.orangeLight   // Hover/active states
colors.accent.orangeDark    // Pressed states
```

### Semantic Colors
```typescript
colors.semantic.success     // Success messages (#10b981)
colors.semantic.warning     // Warning messages (#f59e0b)
colors.semantic.error       // Error messages (#ef4444)
colors.semantic.info        // Info messages (#3b82f6)
```

## Typography

### Font Sizes
```typescript
typography.fontSize.xs      // 12px - Tiny text
typography.fontSize.sm      // 14px - Small text
typography.fontSize.base    // 16px - Body text
typography.fontSize.lg      // 18px - Large text
typography.fontSize.xl      // 20px - Extra large
typography.fontSize['2xl']  // 24px - Heading 3
typography.fontSize['3xl']  // 28px - Heading 2
typography.fontSize['4xl']  // 32px - Heading 1
```

### Font Weights
```typescript
typography.fontWeight.regular   // 400
typography.fontWeight.medium    // 500
typography.fontWeight.semibold  // 600
typography.fontWeight.bold      // 700
```

### Usage Example
```typescript
// Heading 1
<Text style={{
  fontSize: typography.fontSize['4xl'],
  fontWeight: typography.fontWeight.bold,
  color: colors.text.primary,
}}>
  Title
</Text>

// Body text
<Text style={{
  fontSize: typography.fontSize.base,
  fontWeight: typography.fontWeight.regular,
  color: colors.text.secondary,
}}>
  Body content
</Text>
```

## Spacing

### Spacing Scale
```typescript
spacing.xs      // 4px
spacing.sm      // 8px
spacing.md      // 16px
spacing.lg      // 24px
spacing.xl      // 32px
spacing['2xl']  // 40px
spacing['3xl']  // 48px
spacing['4xl']  // 64px
```

### Common Patterns
```typescript
// Container padding
paddingHorizontal: spacing.lg  // 24px horizontal
paddingVertical: spacing.md    // 16px vertical

// Element margins
marginBottom: spacing.md       // 16px between elements
marginTop: spacing.xl          // 32px section spacing

// Component gaps
gap: spacing.sm                // 8px between items
```

## Border Radius

```typescript
borderRadius.none    // 0
borderRadius.sm      // 4px
borderRadius.md      // 8px - Buttons, inputs
borderRadius.lg      // 12px - Cards
borderRadius.xl      // 16px - Large cards
borderRadius['2xl']  // 24px - Special cases
borderRadius.full    // 9999px - Circles, pills
```

## Shadows

```typescript
// Small shadow - subtle elevation
...shadows.sm

// Medium shadow - cards
...shadows.md

// Large shadow - modals
...shadows.lg
```

## Component Patterns

### Button Styles
```typescript
// Primary button
<TouchableOpacity style={{
  backgroundColor: colors.accent.orange,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderRadius: borderRadius.md,
  ...shadows.sm,
}}>
  <Text style={{
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  }}>
    Button Text
  </Text>
</TouchableOpacity>
```

### Card Styles
```typescript
// Standard card
<View style={{
  backgroundColor: colors.background.card,
  padding: spacing.md,
  borderRadius: borderRadius.lg,
  ...shadows.md,
}}>
  {children}
</View>
```

### Input Styles
```typescript
<TextInput style={{
  backgroundColor: colors.background.secondary,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: borderRadius.md,
  fontSize: typography.fontSize.base,
  color: colors.text.primary,
  borderWidth: 1,
  borderColor: colors.neutral.gray600,
}} />
```

## Global Styles

Use pre-defined global styles for common patterns:

```typescript
import { globalStyles } from '@/constants/global-styles';

// Container
<View style={globalStyles.container}>

// Card
<View style={globalStyles.card}>

// Text styles
<Text style={globalStyles.textHeading1}>
<Text style={globalStyles.textHeading2}>
<Text style={globalStyles.textBody}>
<Text style={globalStyles.textCaption}>

// Buttons
<TouchableOpacity style={globalStyles.buttonPrimary}>
  <Text style={globalStyles.buttonPrimaryText}>
```

## Naming Conventions

### Style Names
- Use camelCase: `headerTitle`, `cardBody`, `buttonPrimary`
- Be descriptive: `emergencyButton` not `btn1`
- Group by component: `header`, `headerTitle`, `headerSubtitle`

### Component Names
- Use PascalCase: `ReportCard`, `FilterTabs`
- Be specific: `EmergencyReportCard` not `Card1`

### File Names
- Use kebab-case: `report-card.tsx`, `filter-tabs.tsx`
- Match component name: `ReportCard` → `report-card.tsx`

## Accessibility

### Touch Targets
Minimum touch target size: 44x44 pixels

```typescript
// Good touch target
<TouchableOpacity style={{
  minWidth: 44,
  minHeight: 44,
  justifyContent: 'center',
  alignItems: 'center',
}}>
```

### Color Contrast
- Text on dark backgrounds: Use `colors.text.primary` (white)
- Text on light backgrounds: Use `colors.text.inverse` (dark)
- Maintain WCAG AA contrast ratio (4.5:1 minimum)

## Component Reusability

### DO: Create Reusable Components
```typescript
// components/common/status-badge.tsx
export function StatusBadge({ status }: { status: string }) {
  return (
    <View style={[
      styles.badge,
      styles[`badge_${status}`],
    ]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}
```

### DON'T: Duplicate Code
```typescript
// ❌ Bad - Duplicating badge code everywhere
<View style={{ backgroundColor: '#ff5a3d', padding: 8, borderRadius: 20 }}>
  <Text>{status}</Text>
</View>
```

## Performance

### StyleSheet.create
Always use `StyleSheet.create` for better performance:

```typescript
// ✅ Good
const styles = StyleSheet.create({
  container: { ... },
});

// ❌ Bad
const styles = {
  container: { ... },
};
```

### Avoid Inline Styles
```typescript
// ✅ Good
<View style={styles.container}>

// ❌ Bad (unless dynamic)
<View style={{ padding: 20, backgroundColor: '#1e2a3d' }}>
```

## Documentation

### Comment Complex Logic
```typescript
/**
 * Calculates the severity color based on report type
 * Critical reports show red, high shows orange, etc.
 */
const getSeverityColor = (severity: string) => {
  // Implementation
}
```

### Document Component Props
```typescript
interface ButtonProps {
  /** Button text label */
  title: string;
  /** Click handler */
  onPress: () => void;
  /** Visual style variant */
  variant?: 'primary' | 'secondary';
}
```

## Quick Reference

### Most Common Patterns

```typescript
// Container
style={globalStyles.container}

// Padding
paddingHorizontal: spacing.lg,
paddingVertical: spacing.md,

// Text
fontSize: typography.fontSize.base,
fontWeight: typography.fontWeight.semibold,
color: colors.text.primary,

// Background
backgroundColor: colors.background.card,

// Border
borderRadius: borderRadius.lg,

// Shadow
...shadows.md,
```

---

**Remember**: Consistency is key! Always use the design system for a unified look and easier maintenance.

