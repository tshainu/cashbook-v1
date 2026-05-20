import { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, TrendUp, TrendDown, CreditCard,
  ChartBar, ListBullets, CaretDown, CaretUp,
} from "phosphor-react-native";
import { api } from "../lib/api";
import { getStoredUser } from "../lib/auth";

const TEAL = "#419873";
const RED = "#E03A2A";
const BLUE = "#3a6eb5";

type Period = "today" | "yesterday" | "week" | "month" | "lastMonth" | "year";
const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "year", label: "Year" },
];

type TabKey = "all" | "sales" | "expenses" | "credit";
const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "all", label: "All", color: "#555" },
  { key: "sales", label: "Sales", color: TEAL },
  { key: "expenses", label: "Expenses", color: RED },
  { key: "credit", label: "Credit", color: BLUE },
];

function getPeriodDates(period: Period): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  switch (period) {
    case "today": { const t = fmt(now); return { from: t, to: t }; }
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1); return { from: fmt(y), to: fmt(y) };
    }
    case "week": {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return { from: fmt(mon), to: fmt(now) };
    }
    case "month": return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) };
    case "lastMonth": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: fmt(s), to: fmt(e) };
    }
    case "year": return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: fmt(now) };
  }
}

function fmtDate(d: any) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}

function fmtTime(d: any) {
  if (!d) return "";
  const dt = new Date(d);
  const h = dt.getHours(), m = dt.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export default function Reports() {
  const router = useRouter();
  const user = getStoredUser();
  const shopId = user?.shopId ?? "";

  const [period, setPeriod] = useState<Period>("month");
  const [tab, setTab] = useState<TabKey>("all");
  const [expandedCategories, setExpandedCategories] = useState(false);

  const { from, to } = useMemo(() => getPeriodDates(period), [period]);

  const typeParam = tab === "all" ? undefined : tab === "sales" ? "sale" : tab === "expenses" ? "expense" : "credit";

  const { data, isLoading } = useQuery({
    queryKey: ["reports", shopId, from, to, tab],
    queryFn: async () => {
      const res = await (api as any).reports.summary.$get({
        query: { shopId: String(shopId), from, to, ...(typeParam ? { type: typeParam } : {}) },
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!shopId,
  });

  const transactions: any[] = data?.transactions ?? [];
  const categories: any[] = data?.categories ?? [];
  const visibleCategories = expandedCategories ? categories : categories.slice(0, 4);

  function typeColor(t: string) {
    if (t === "sale") return TEAL;
    if (t === "expense") return RED;
    return BLUE;
  }

  function typeLabel(t: string) {
    if (t === "sale") return "Sale";
    if (t === "expense") return "Expense";
    return "Credit";
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Reports</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Period selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[s.periodTab, period === p.key && s.periodTabActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[s.periodText, period === p.key && s.periodTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Type tabs */}
        <View style={s.tabRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[s.tabBtn, tab === t.key && { borderBottomColor: t.color, borderBottomWidth: 2 }]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[s.tabText, tab === t.key && { color: t.color, fontWeight: "700" }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={TEAL} size="large" />
            <Text style={s.loadingText}>Loading report…</Text>
          </View>
        ) : (
          <>
            {/* Summary cards */}
            {tab === "all" && (
              <>
                <View style={s.summaryRow}>
                  <View style={[s.summaryCard, { borderLeftColor: TEAL }]}>
                    <View style={[s.summaryIcon, { backgroundColor: "#E8F5EE" }]}>
                      <TrendUp size={16} color={TEAL} weight="bold" />
                    </View>
                    <Text style={s.summaryLabel}>Sales</Text>
                    <Text style={[s.summaryVal, { color: TEAL }]}>Rs. {(data?.totalSales ?? 0).toLocaleString()}</Text>
                  </View>
                  <View style={[s.summaryCard, { borderLeftColor: RED }]}>
                    <View style={[s.summaryIcon, { backgroundColor: "#FDECEA" }]}>
                      <TrendDown size={16} color={RED} weight="bold" />
                    </View>
                    <Text style={s.summaryLabel}>Expenses</Text>
                    <Text style={[s.summaryVal, { color: RED }]}>Rs. {(data?.totalExpenses ?? 0).toLocaleString()}</Text>
                  </View>
                </View>

                {/* Credit summary */}
                <View style={s.creditBox}>
                  <View style={s.creditRow}>
                    <CreditCard size={16} color={BLUE} weight="fill" />
                    <Text style={s.creditTitle}>Credit Sales</Text>
                    <Text style={[s.creditTotal, { color: BLUE }]}>Rs. {(data?.totalCredit ?? 0).toLocaleString()}</Text>
                  </View>
                  <View style={s.creditDetails}>
                    <View style={s.creditDetailItem}>
                      <View style={[s.dot, { backgroundColor: "#52c47a" }]} />
                      <Text style={s.creditDetailLabel}>Settled</Text>
                      <Text style={s.creditDetailVal}>Rs. {(data?.totalCreditSettled ?? 0).toLocaleString()}</Text>
                    </View>
                    <View style={s.creditDetailItem}>
                      <View style={[s.dot, { backgroundColor: "#faad14" }]} />
                      <Text style={s.creditDetailLabel}>Pending</Text>
                      <Text style={[s.creditDetailVal, { color: "#e67e00" }]}>Rs. {(data?.totalCreditPending ?? 0).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>

                {/* Net profit */}
                <View style={[s.profitBox, (data?.netProfit ?? 0) >= 0 ? s.profitPos : s.profitNeg]}>
                  <Text style={s.profitLabel}>Net Profit</Text>
                  <Text style={[s.profitVal, { color: (data?.netProfit ?? 0) >= 0 ? TEAL : RED }]}>
                    {(data?.netProfit ?? 0) >= 0 ? "+" : ""}Rs. {(data?.netProfit ?? 0).toLocaleString()}
                  </Text>
                </View>
              </>
            )}

            {/* Credit tab detail */}
            {tab === "credit" && (
              <View style={s.creditBox}>
                <View style={s.creditRow}>
                  <CreditCard size={16} color={BLUE} weight="fill" />
                  <Text style={s.creditTitle}>Credit Sales Total</Text>
                  <Text style={[s.creditTotal, { color: BLUE }]}>Rs. {(data?.totalCredit ?? 0).toLocaleString()}</Text>
                </View>
                <View style={s.creditDetails}>
                  <View style={s.creditDetailItem}>
                    <View style={[s.dot, { backgroundColor: "#52c47a" }]} />
                    <Text style={s.creditDetailLabel}>Settled</Text>
                    <Text style={s.creditDetailVal}>Rs. {(data?.totalCreditSettled ?? 0).toLocaleString()}</Text>
                  </View>
                  <View style={s.creditDetailItem}>
                    <View style={[s.dot, { backgroundColor: "#faad14" }]} />
                    <Text style={s.creditDetailLabel}>Pending</Text>
                    <Text style={[s.creditDetailVal, { color: "#e67e00" }]}>Rs. {(data?.totalCreditPending ?? 0).toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Category breakdown */}
            {categories.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <ChartBar size={14} color="#A0ADB8" weight="bold" />
                  <Text style={s.sectionTitle}>By Category</Text>
                </View>
                <View style={s.card}>
                  {visibleCategories.map((cat, i) => {
                    const pct = data?.totalSales + data?.totalExpenses + data?.totalCredit > 0
                      ? Math.round((cat.total / (data.totalSales + data.totalExpenses + data.totalCredit)) * 100)
                      : 0;
                    return (
                      <View key={i} style={[s.catRow, i < visibleCategories.length - 1 && s.catBorder]}>
                        <View style={[s.catDot, { backgroundColor: typeColor(cat.type) }]} />
                        <View style={s.catInfo}>
                          <Text style={s.catName}>{cat.name}</Text>
                          <Text style={s.catMeta}>{cat.count} transactions · {typeLabel(cat.type)}</Text>
                        </View>
                        <View style={s.catRight}>
                          <Text style={[s.catAmount, { color: typeColor(cat.type) }]}>
                            Rs. {cat.total.toLocaleString()}
                          </Text>
                          <Text style={s.catPct}>{pct}%</Text>
                        </View>
                      </View>
                    );
                  })}
                  {categories.length > 4 && (
                    <TouchableOpacity style={s.showMoreBtn} onPress={() => setExpandedCategories(v => !v)}>
                      {expandedCategories
                        ? <CaretUp size={14} color={TEAL} weight="bold" />
                        : <CaretDown size={14} color={TEAL} weight="bold" />}
                      <Text style={s.showMoreText}>
                        {expandedCategories ? "Show less" : `Show ${categories.length - 4} more`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Transaction list */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <ListBullets size={14} color="#A0ADB8" weight="bold" />
                <Text style={s.sectionTitle}>Transactions ({transactions.length})</Text>
              </View>
              {transactions.length === 0 ? (
                <View style={s.emptyBox}>
                  <Text style={s.emptyText}>No transactions found</Text>
                </View>
              ) : (
                <View style={s.card}>
                  {transactions.map((tx, i) => (
                    <View key={tx.id} style={[s.txRow, i < transactions.length - 1 && s.catBorder]}>
                      <View style={[s.txTypeDot, { backgroundColor: typeColor(tx.type) }]} />
                      <View style={s.txInfo}>
                        <Text style={s.txName}>{tx.itemName}</Text>
                        {tx.customerName ? (
                          <Text style={s.txMeta}>{tx.customerName}{tx.customerPhone ? ` · ${tx.customerPhone}` : ""}</Text>
                        ) : null}
                        {tx.type === "credit" && (
                          <View style={[s.creditBadge, { backgroundColor: tx.creditSettled ? "#E8F5EE" : "#FFF7E6" }]}>
                            <Text style={[s.creditBadgeText, { color: tx.creditSettled ? TEAL : "#e67e00" }]}>
                              {tx.creditSettled ? "Settled" : "Pending"}
                            </Text>
                          </View>
                        )}
                        <Text style={s.txDate}>{fmtDate(tx.createdAt)} · {fmtTime(tx.createdAt)}</Text>
                      </View>
                      <Text style={[s.txAmount, { color: tx.type === "expense" ? RED : tx.type === "credit" ? BLUE : TEAL }]}>
                        {tx.type === "expense" ? "-" : "+"}Rs. {tx.amount.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  header: {
    backgroundColor: TEAL, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  periodRow: { gap: 8, paddingBottom: 14 },
  periodTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#E8EDE9" },
  periodTabActive: { backgroundColor: TEAL },
  periodText: { fontSize: 13, color: "#6B8070", fontWeight: "500" },
  periodTextActive: { color: "#fff", fontWeight: "700" },
  tabRow: {
    flexDirection: "row", backgroundColor: "#fff", borderRadius: 12,
    marginBottom: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 13, color: "#A0ADB8", fontWeight: "600" },
  loadingBox: { alignItems: "center", paddingTop: 60, gap: 12 },
  loadingText: { color: "#A0ADB8", fontSize: 14 },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderLeftWidth: 3,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  summaryIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  summaryLabel: { fontSize: 11, color: "#A0ADB8", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  summaryVal: { fontSize: 18, fontWeight: "800", marginTop: 4 },
  creditBox: {
    backgroundColor: "#EEF4FF", borderRadius: 14, padding: 14, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: BLUE,
  },
  creditRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  creditTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: "#1a2e22" },
  creditTotal: { fontSize: 15, fontWeight: "800" },
  creditDetails: { gap: 6 },
  creditDetailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  creditDetailLabel: { flex: 1, fontSize: 13, color: "#555" },
  creditDetailVal: { fontSize: 13, fontWeight: "700", color: "#1a2e22" },
  profitBox: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  profitPos: { backgroundColor: "#E8F5EE" },
  profitNeg: { backgroundColor: "#FDECEA" },
  profitLabel: { fontSize: 13, color: "#555", fontWeight: "600" },
  profitVal: { fontSize: 16, fontWeight: "800" },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#A0ADB8", textTransform: "uppercase", letterSpacing: 1 },
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    overflow: "hidden",
  },
  catRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  catBorder: { borderBottomWidth: 1, borderBottomColor: "#F0F4F2" },
  catDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  catInfo: { flex: 1 },
  catName: { fontSize: 14, fontWeight: "600", color: "#1a2e22" },
  catMeta: { fontSize: 11, color: "#A0ADB8", marginTop: 2 },
  catRight: { alignItems: "flex-end" },
  catAmount: { fontSize: 14, fontWeight: "700" },
  catPct: { fontSize: 11, color: "#A0ADB8", marginTop: 1 },
  showMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F0F4F2",
  },
  showMoreText: { fontSize: 13, color: TEAL, fontWeight: "600" },
  txRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  txTypeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: "600", color: "#1a2e22" },
  txMeta: { fontSize: 12, color: "#A0ADB8", marginTop: 1 },
  txDate: { fontSize: 11, color: "#C0CCC8", marginTop: 3 },
  txAmount: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  creditBadge: {
    alignSelf: "flex-start", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3,
  },
  creditBadgeText: { fontSize: 10, fontWeight: "700" },
  emptyBox: { backgroundColor: "#fff", borderRadius: 14, padding: 32, alignItems: "center" },
  emptyText: { color: "#A0ADB8", fontSize: 14 },
});
