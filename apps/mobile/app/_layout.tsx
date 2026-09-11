// Root navigator. Wraps GamiPrivyProvider (the only sanctioned way apps/mobile
// touches Privy — eslint rule 1, §11.3) + SafeAreaProvider. Status bar is
// always light-content: every screen in the design source renders dark
// (§0's frame files render `dark={true}` throughout).
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GamiPrivyProvider } from "@gami/identity/mobile";
import { color } from "@gami/ui";

const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID ?? "";
const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GamiPrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: color.bg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="quest/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
          <Stack.Screen name="settings" options={{ presentation: "card" }} />
          <Stack.Screen name="send" options={{ presentation: "card" }} />
          <Stack.Screen name="receive" options={{ presentation: "card" }} />
        </Stack>
      </GamiPrivyProvider>
    </SafeAreaProvider>
  );
}
