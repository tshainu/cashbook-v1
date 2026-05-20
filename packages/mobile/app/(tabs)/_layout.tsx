import { Tabs } from "expo-router";
import { Wallet, Receipt, Gear } from "phosphor-react-native";

const TEAL = "#419873";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#EEF2F0",
          height: 62,
          paddingBottom: 10,
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
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size ?? 24} weight="fill" />,
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
