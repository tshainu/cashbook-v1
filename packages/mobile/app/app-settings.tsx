import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Bell, Moon, CurrencyCircleDollar, Translate } from "phosphor-react-native";
import { useState } from "react";

const TEAL = "#419873";

export default function AppSettings() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [roundAmounts, setRoundAmounts] = useState(false);

  const toggleItems = [
    {
      icon: <Bell size={20} color={TEAL} weight="fill" />,
      label: "Notifications",
      sub: "Daily summary & reminders",
      value: notifications,
      onChange: setNotifications,
    },
    {
      icon: <Moon size={20} color="#5B4BB0" weight="fill" />,
      label: "Dark Mode",
      sub: "Switch to dark theme",
      value: darkMode,
      onChange: setDarkMode,
    },
    {
      icon: <CurrencyCircleDollar size={20} color="#E07820" weight="fill" />,
      label: "Round Amounts",
      sub: "Round to nearest whole number",
      value: roundAmounts,
      onChange: setRoundAmounts,
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>App Settings</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionTitle}>Preferences</Text>
        <View style={s.card}>
          {toggleItems.map((item, i) => (
            <View
              key={item.label}
              style={[s.row, i < toggleItems.length - 1 && s.rowBorder]}
            >
              <View style={s.iconWrap}>{item.icon}</View>
              <View style={s.rowContent}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowSub}>{item.sub}</Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.onChange}
                trackColor={{ false: "#E0E8E3", true: TEAL }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        <Text style={[s.sectionTitle, { marginTop: 24 }]}>About</Text>
        <View style={s.card}>
          <View style={[s.row, s.rowBorder]}>
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>App Version</Text>
              <Text style={s.rowSub}>Cashbook v1.0.0</Text>
            </View>
          </View>
          <View style={s.row}>
            <View style={s.rowContent}>
              <Text style={s.rowLabel}>Build</Text>
              <Text style={s.rowSub}>Production</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  header: {
    backgroundColor: TEAL, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: "#A0ADB8",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, paddingLeft: 4,
  },
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderColor: "#F0F4F2" },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#F0F7F3",
    alignItems: "center", justifyContent: "center",
  },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600", color: "#1a2e22" },
  rowSub: { fontSize: 12, color: "#A0ADB8", marginTop: 1 },
});
