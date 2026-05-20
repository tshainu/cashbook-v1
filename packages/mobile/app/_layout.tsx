import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { View, Image, StyleSheet, Dimensions } from "react-native";
import { getToken, getStoredUser } from "../lib/auth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const { width: SW, height: SH } = Dimensions.get("window");

function SplashScreen() {
  return (
    <View style={splash.container}>
      <StatusBar style="dark" hidden />
      <Image
        source={require("../assets/images/splash.jpg")}
        style={splash.image}
        resizeMode="cover"
      />
    </View>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    const inAuth = segments[0] === "sign-in";

    if (!token || !user) {
      if (!inAuth) router.replace("/sign-in");
    } else {
      if (inAuth) router.replace("/(tabs)");
    }
    setChecked(true);
  }, [segments]);

  if (!checked) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthGuard>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  image: {
    width: SW,
    height: SH,
  },
});
