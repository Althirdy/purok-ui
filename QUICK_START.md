# UrbanWatch - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the App
```bash
npm start
```

### Step 3: Test the App
- Scan QR code with Expo Go app, or
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Press `w` for web browser

## 🔐 Login
**PIN**: `1234`

## 📱 Navigate the App

### Main Screens:
1. **News Feed** - View all emergency reports
2. **Reports** - Filter and manage reports
3. **Notifications** - View alerts and updates

## 🎨 Customize the Design

### Change Colors
Edit `constants/design-system.ts`:

```typescript
export const DesignSystem = {
  colors: {
    accent: {
      orange: '#your-color-here',  // Change accent color
    },
    primary: {
      navy: '#your-color-here',    // Change background
    },
  },
  // ...
};
```

Changes apply everywhere automatically! ✨

### Add New Components

1. Create in `components/common/your-component.tsx`
2. Use design system:
```typescript
import { DesignSystem } from '@/constants/design-system';
const { colors, spacing, typography } = DesignSystem;
```

3. Export from `components/common/index.ts`:
```typescript
export { YourComponent } from './your-component';
```

## 📊 Use Mock Data

```typescript
import { mockReports, mockUser } from '@/services/mock-data';
```

## 🔌 Connect to Real API

Replace in your screens:
```typescript
// Before (mock)
import { mockReports } from '@/services/mock-data';

// After (real API)
import { fetchReports } from '@/services/api';
const reports = await fetchReports();
```

## 📖 Learn More

- **Full Documentation**: `README.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **Style Guide**: `STYLE_GUIDE.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`

## 🆘 Common Issues

### TypeScript Errors
The linter may show some module resolution errors. These are IDE-specific and won't affect the app running. Just run `npm start` and the app will work fine.

### App Not Starting
```bash
# Clear cache
npm start -- --clear

# Or reset project
npx expo start -c
```

## ✅ What You Get

- ✅ Login with PIN authentication
- ✅ News feed with emergency reports
- ✅ Report filtering and management
- ✅ Notification center
- ✅ Global design system
- ✅ Reusable components
- ✅ Type-safe code
- ✅ Clean architecture

## 🎯 Next Steps

1. **Test the app** - Run and explore all features
2. **Customize branding** - Change colors and logos
3. **Connect real data** - Integrate with your backend
4. **Add features** - Use existing components to build new screens
5. **Deploy** - Build for production

---

**Happy Coding!** 🎉

For questions, refer to the comprehensive documentation files.

