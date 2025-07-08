export default {
    expo: {
      name: "CBM APP 2",
      slug: "cbm-app",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      userInterfaceStyle: "light",
      splash: {
        image: "./assets/images/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      assetBundlePatterns: ["**/*"],
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.anonymous.cbm-app-2"
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/images/adaptive-icon.png",
          backgroundColor: "#FFFFFF"
        },
        package: "com.anonymous.cbmapp"
      },
      plugins: [
        [
          "expo-build-properties",
          {
            ios: {
              deploymentTarget: "13.4"
            }
          }
        ]
      ]
    }
  };
  