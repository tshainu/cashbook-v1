import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt } from "phosphor-react-native";
import { api } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import NewSaleModal from "../../components/NewSaleModal";

const TEAL = "#419873";
const ORANGE = "#E07820";

function today() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return "--"; }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "--"; }
}

type Tx = {
  id: string; createdAt: string; amount: number;
  itemName?: string | null; type: string; customerName?: string | null;
};

export default function Sales() {
  const user = getStoredUser();
  const shopId = user?.shopId ?? "";
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sales", shopId],
    queryFn: async () => {
      const res = await api.transactions.$get({ query: { shopId, period: "today", type: "sale" } });
      if (!res.ok) throw new Error();
      const d = await res.json() as any;
      return (d.transactions ?? d) as Tx[];
    },
    enabled: !!shopId,
  });

  const transactions = data ?? [];
  const total = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const creditTotal = transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Sales</Text>
          <Text style={s.headerSub}>{formatDate(new Date().toISOString())}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Plus size={16} color="#fff" weight="bold" />
          <Text style={s.addBtnText}>New Sale</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={TEAL} size="large" />
          <Text style={s.loadingText}>Loading…</Text>
        </View>
      ) : (
        <>
          {/* Column header */}
          <View style={s.colHeader}>
            <Text style={[s.col, s.colTime, s.colHeaderText]}>Time</Text>
            <Text style={[s.col, s.colCat, s.colHeaderText]}>Item</Text>
            <Text style={[s.col, s.colType, s.colHeaderText]}>Type</Text>
            <Text style={[s.col, s.colAmt, s.colHeaderText]}>Amount</Text>
          </View>

          <FlatList
            data={transactions}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 90 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Receipt size={40} color="#D0D8D4" weight="duotone" />
                <Text style={s.emptyText}>No sales today</Text>
                <Text style={s.emptySubText}>Tap "New Sale" to record one</Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <View style={[s.row, index % 2 === 0 ? s.rowEven : s.rowOdd]}>
                <Text style={[s.col, s.colTime]}>{formatTime(item.createdAt)}</Text>
                <Text style={[s.col, s.colCat]} numberOfLines={1}>
                  {item.itemName ?? (item.customerName ? item.customerName : "—")}
                </Text>
                <View style={[s.col, s.colType]}>
                  <View style={[s.typeBadge,
                    item.type === "credit" ? s.typeBadgeCredit : s.typeBadgeSale
                  ]}>
                    <Text style={[s.typeBadgeText,
                      item.type === "credit" ? { color: ORANGE } : { color: TEAL }
                    ]}>
                      {item.type === "credit" ? "Credit" : "Sale"}
                    </Text>
                  </View>
                </View>
                <Text style={[s.col, s.colAmt, item.type === "credit" && { color: ORANGE }]}>
                  Rs. {item.amount.toLocaleString()}
                </Text>
              </View>
            )}
          />

          {/* Footer totals */}
          <View style={s.footer}>
            <View style={s.footerItem}>
              <Text style={s.footerLabel}>Credit</Text>
              <Text style={[s.footerValue, { color: ORANGE }]}>Rs. {creditTotal.toLocaleString()}</Text>
            </View>
            <View style={s.footerDivider} />
            <View style={s.footerItem}>
              <Text style={s.footerLabel}>Total</Text>
              <Text style={[s.footerValue, { color: TEAL }]}>Rs. {total.toLocaleString()}</Text>
            </View>
          </View>
        </>
      )}

      <NewSaleModal
        visible={showModal}
        shopId={String(shopId)}
        onClose={() => setShowModal(false)}
        onSuccess={() => { setShowModal(false); refetch(); }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#fff",
    borderBottomWidth: 1, borderColor: "#EEF2F0",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1a2e22" },
  headerSub: { fontSize: 12, color: "#A0ADB8", marginTop: 2 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: TEAL, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#A0ADB8", fontSize: 14 },
  colHeader: {
    flexDirection: "row", backgroundColor: TEAL,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  colHeaderText: { color: "#fff", fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  row: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "center" },
  rowEven: { backgroundColor: "#fff" },
  rowOdd: { backgroundColor: "#F6FAF7" },
  col: { fontSize: 13, color: "#333" },
  colTime: { width: 56 },
  colCat: { flex: 1, paddingRight: 4 },
  colType: { width: 60 },
  colAmt: { width: 90, textAlign: "right", fontWeight: "600" },
  typeBadge: {
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start",
  },
  typeBadgeSale: { backgroundColor: "#E8F5EE" },
  typeBadgeCredit: { backgroundColor: "#FEF3E8" },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#C0CCC8" },
  emptySubText: { fontSize: 13, color: "#C0CCC8" },
  footer: {
    flexDirection: "row", backgroundColor: "#fff",
    borderTopWidth: 1, borderColor: "#EEF2F0",
    paddingHorizontal: 20, paddingVertical: 14,
  },
  footerItem: { flex: 1, alignItems: "center" },
  footerLabel: { fontSize: 11, color: "#A0ADB8", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  footerValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  footerDivider: { width: 1, backgroundColor: "#EEF2F0" },
});
