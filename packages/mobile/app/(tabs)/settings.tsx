import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  GearSix, Users, SignOut, CaretRight,
  Tag, CurrencyCircleDollar, ChartBar,
} from "phosphor-react-native";
import { clearToken } from "../../lib/auth";
import { getStoredUser } from "../../lib/auth";

const TEAL = "#419873";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
};

type Section = { title: string; items: MenuItem[] };

export default function Settings() {
  const router = useRouter();
  const user = getStoredUser();

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => { await clearToken(); router.replace("/sign-in"); },
      },
    ]);
  }

  const sections: Section[] = [
    {
      title: "Reports",
      items: [
        {
          icon: <ChartBar size={20} color={TEAL} weight="fill" />,
          label: "Sales Report",
          sub: "Sales, expenses & credit overview",
          onPress: () => router.push("/reports"),
        },
      ],
    },
    {
      title: "Categories",
      items: [
        {
          icon: <CurrencyCircleDollar size={20} color={TEAL} weight="fill" />,
          label: "Income Categories",
          sub: "Manage sale/income types",
          onPress: () => router.push("/income-categories"),
        },
        {
          icon: <Tag size={20} color="#E03A2A" weight="fill" />,
          label: "Expense Categories",
          sub: "Manage expense types",
          onPress: () => router.push("/categories"),
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: <Users size={20} color={TEAL} weight="fill" />,
          label: "User Management",
          sub: "Add or manage staff",
          onPress: () => router.push("/user-management"),
        },
        {
          icon: <GearSix size={20} color={TEAL} weight="fill" />,
          label: "App Settings",
          sub: "Preferences & configuration",
          onPress: () => router.push("/app-settings"),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Profile header */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(user?.name ?? "U").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={s.profileInfo}>
          <Text style={s.profileName}>{user?.name ?? "User"}</Text>
          <Text style={s.profileShop}>{user?.shopName ?? "Shop"}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleBadgeText}>{(user as any)?.role ?? "staff"}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {sections.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <View style={s.sectionCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.menuItem, i < section.items.length - 1 && s.menuItemBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={s.menuIconWrap}>{item.icon}</View>
                  <View style={s.menuContent}>
                    <Text style={[s.menuLabel, item.danger && { color: "#E03A2A" }]}>{item.label}</Text>
                    {item.sub && <Text style={s.menuSub}>{item.sub}</Text>}
                  </View>
                  <CaretRight size={16} color="#C8D0CC" weight="bold" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign out */}
        <View style={s.section}>
          <View style={s.sectionCard}>
            <TouchableOpacity style={s.menuItem} onPress={handleLogout} activeOpacity={0.7}>
              <View style={[s.menuIconWrap, { backgroundColor: "#FEF0EE" }]}>
                <SignOut size={20} color="#E03A2A" weight="fill" />
              </View>
              <View style={s.menuContent}>
                <Text style={[s.menuLabel, { color: "#E03A2A" }]}>Sign Out</Text>
                <Text style={s.menuSub}>Log out of your account</Text>
              </View>
              <CaretRight size={16} color="#E03A2A" weight="bold" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.version}>Cashbook v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  profileCard: {
    backgroundColor: TEAL,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: { color: "#fff", fontSize: 18, fontWeight: "800" },
  profileShop: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 2 },
  roleBadge: {
    marginTop: 6, alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  roleBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: "#A0ADB8",
    textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderColor: "#F0F4F2" },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#F0F7F3",
    alignItems: "center", justifyContent: "center",
  },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: "600", color: "#1a2e22" },
  menuSub: { fontSize: 12, color: "#A0ADB8", marginTop: 1 },
  version: {
    textAlign: "center", color: "#C0CCC8", fontSize: 12,
    marginTop: 24, marginBottom: 8,
  },
});
