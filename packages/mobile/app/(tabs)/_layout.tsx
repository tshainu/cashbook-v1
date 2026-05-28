import { Tabs } from "expo-router";
import { Wallet, Database, Gear } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEAL = "#419873";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#EEF2F0",
          height: tabBarHeight,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarActiveTintColor: TEAL,
        tabBarInactiveTintColor: "#B0BDB6",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size ?? 24} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="data"
        options={{
          title: "Data",
          tabBarIcon: ({ color, size }) => <Database color={color} size={size ?? 24} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Gear color={color} size={size ?? 24} weight="fill" />,
        }}
      />
    </Tabs>
  );
}
