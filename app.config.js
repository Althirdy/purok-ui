export default {
  expo: {
    name: "UrbanWatch",
    slug: "urbanwatch-purok",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/urbanwatchicondark.png",
    scheme: "urbanwatch",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.urbanwatchpurok",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/images/urbanwatchicondark.png",
      },
      package: "com.anonymous.urbanwatchpurok",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/urbanwatchicondark.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/images/urbanwatchicondark.png",
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "c48f1a37-15db-4f52-b5d2-28d32a16a049",
      },
    },
  },
};
