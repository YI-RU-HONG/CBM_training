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
      ],
      // Dev Build 配置
      developmentClient: {
        silentLaunch: true
      },
      extra: {
        eas: {
          projectId: "c3496cba-e89e-47fd-8de9-0f2e181dc6dc"
        }
      }
    }
  };
  