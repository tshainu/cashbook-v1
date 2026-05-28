import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Plus, Receipt, ArrowDownLeft } from "phosphor-react-native";
import { api } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import NewSaleModal from "../../components/NewSaleModal";
import ExpenseModal from "../../components/ExpenseModal";

const TEAL = "#419873";
const RED = "#E03A2A";
const ORANGE = "#E07820";

type Tab = "sales" | "expenses";

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
  catch { return "--"; }
}
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return "--"; }
}

type Tx = {
  id: string; createdAt: string; amount: number;
  itemName?: string | null; type: string; customerName?: string | null;
};

export default function Data() {
  const user = getStoredUser();
  const shopId = user?.shopId ?? "";
  const [activeTab, setActiveTab] = useState<Tab>("sales");
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const insets = useSafeAreaInsets();

  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ["data-sales", shopId],
    queryFn: async () => {
      const res = await api.transactions.$get({ query: { shopId, period: "today", type: "sale" } });
      if (!res.ok) throw new Error();
      const d = await res.json() as any;
      return (d.transactions ?? d) as Tx[];
    },
    enabled: !!shopId,
  });

  const { data: expensesData, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ["data-expenses", shopId],
    queryFn: async () => {
      const res = await api.transactions.$get({ query: { shopId, period: "today", type: "expense" } });
      if (!res.ok) throw new Error();
      const d = await res.json() as any;
      return (d.transactions ?? d) as Tx[];
    },
    enabled: !!shopId,
  });

  const sales = salesData ?? [];
  const expenses = expensesData ?? [];
  const isLoading = activeTab === "sales" ? salesLoading : expensesLoading;
  const transactions = activeTab === "sales" ? sales : expenses;
  const total = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const salesTotal = sales.reduce((sum, t) => sum + t.amount, 0);
  const expensesTotal = expenses.reduce((sum, t) => sum + t.amount, 0);
  const accentColor = activeTab === "sales" ? TEAL : RED;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Today's Data</Text>
          <Text style={s.headerSub}>{formatDate(new Date().toISOString())}</Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: accentColor }]}
          onPress={() => activeTab === "sales" ? setShowSaleModal(true) : setShowExpenseModal(true)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#fff" weight="bold" />
          <Text style={s.addBtnText}>{activeTab === "sales" ? "New Sale" : "New Expense"}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary strip */}
      <View style={s.summaryStrip}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Sales</Text>
          <Text style={[s.summaryValue, { color: TEAL }]}>Rs. {salesTotal.toLocaleString()}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Expenses</Text>
          <Text style={[s.summaryValue, { color: RED }]}>Rs. {expensesTotal.toLocaleString()}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Net</Text>
          <Text style={[s.summaryValue, { color: salesTotal - expensesTotal >= 0 ? TEAL : RED }]}>
            Rs. {(salesTotal - expensesTotal).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabBtn, activeTab === "sales" && { borderBottomColor: TEAL, borderBottomWidth: 2.5 }]}
          onPress={() => setActiveTab("sales")}
        >
          <Text style={[s.tabText, activeTab === "sales" && { color: TEAL, fontWeight: "700" }]}>
            Sales ({sales.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, activeTab === "expenses" && { borderBottomColor: RED, borderBottomWidth: 2.5 }]}
          onPress={() => setActiveTab("expenses")}
        >
          <Text style={[s.tabText, activeTab === "expenses" && { color: RED, fontWeight: "700" }]}>
            Expenses ({expenses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator color={accentColor} size="large" />
        </View>
      ) : (
        <>
          {/* Column header */}
          <View style={[s.colHeader, { backgroundColor: accentColor }]}>
            <Text style={[s.col, s.colTime, s.colHeaderText]}>Time</Text>
            <Text style={[s.col, s.colCat, s.colHeaderText]}>
              {activeTab === "sales" ? "Item" : "Category"}
            </Text>
            {activeTab === "sales" && (
              <Text style={[s.col, s.colType, s.colHeaderText]}>Type</Text>
            )}
            <Text style={[s.col, s.colAmt, s.colHeaderText]}>Amount</Text>
          </View>

          <FlatList
            data={transactions}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyBox}>
                {activeTab === "sales"
                  ? <Receipt size={40} color="#D0D8D4" weight="duotone" />
                  : <ArrowDownLeft size={40} color="#D0D8D4" weight="duotone" />
                }
                <Text style={s.emptyText}>
                  No {activeTab === "sales" ? "sales" : "expenses"} today
                </Text>
                <Text style={s.emptySubText}>
                  Tap "{activeTab === "sales" ? "New Sale" : "New Expense"}" to add one
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <View style={[s.row, index % 2 === 0 ? s.rowEven : s.rowOdd]}>
                <Text style={[s.col, s.colTime]}>{formatTime(item.createdAt)}</Text>
                <Text style={[s.col, s.colCat]} numberOfLines={1}>
                  {item.itemName ?? item.customerName ?? "—"}
                </Text>
                {activeTab === "sales" && (
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
                )}
                <Text style={[s.col, s.colAmt, { color: activeTab === "sales" ? TEAL : RED }]}>
                  Rs. {item.amount.toLocaleString()}
                </Text>
              </View>
            )}
          />

          {/* Footer total */}
          <View style={[s.footer, { paddingBottom: insets.bottom + 8 }]}>
            <Text style={s.footerLabel}>
              {activeTab === "sales" ? "Total Sales" : "Total Expenses"}
            </Text>
            <Text style={[s.footerValue, { color: accentColor }]}>
              Rs. {total.toLocaleString()}
            </Text>
          </View>
        </>
      )}

      <NewSaleModal
        visible={showSaleModal}
        shopId={String(shopId)}
        onClose={() => setShowSaleModal(false)}
        onSuccess={() => { setShowSaleModal(false); refetchSales(); }}
      />
      <ExpenseModal
        visible={showExpenseModal}
        shopId={String(shopId)}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={() => { setShowExpenseModal(false); refetchExpenses(); }}
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
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  summaryStrip: {
    flexDirection: "row", backgroundColor: "#fff",
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderColor: "#EEF2F0",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryLabel: { fontSize: 11, color: "#A0ADB8", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  summaryValue: { fontSize: 15, fontWeight: "800", marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: "#EEF2F0" },
  tabRow: {
    flexDirection: "row", backgroundColor: "#fff",
    borderBottomWidth: 1, borderColor: "#EEF2F0",
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: "center",
    borderBottomColor: "transparent", borderBottomWidth: 2.5,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#A0ADB8" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  colHeader: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 10 },
  colHeaderText: { color: "#fff", fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  row: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, alignItems: "center" },
  rowEven: { backgroundColor: "#fff" },
  rowOdd: { backgroundColor: "#F6FAF7" },
  col: { fontSize: 13, color: "#333" },
  colTime: { width: 56 },
  colCat: { flex: 1, paddingRight: 4 },
  colType: { width: 60 },
  colAmt: { width: 90, textAlign: "right", fontWeight: "600" },
  typeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
  typeBadgeSale: { backgroundColor: "#E8F5EE" },
  typeBadgeCredit: { backgroundColor: "#FEF3E8" },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#C0CCC8" },
  emptySubText: { fontSize: 13, color: "#C0CCC8" },
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#EEF2F0",
    paddingHorizontal: 20, paddingVertical: 12,
  },
  footerLabel: { fontSize: 13, color: "#A0ADB8", fontWeight: "600", textTransform: "uppercase" },
  footerValue: { fontSize: 18, fontWeight: "800" },
});
