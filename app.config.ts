import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  slug: "my-app",
  name: "My App",

  ios: {
    bundleIdentifier: "com.anonymous.ambossbanco",
  },

  plugins: ["expo-localization"],
});
