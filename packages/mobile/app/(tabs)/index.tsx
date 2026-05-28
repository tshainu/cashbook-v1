import { useState, useMemo } from "react";import { TrendUp, TrendDown, CloudSlash, CloudCheck, ArrowsClockwise } from "phosphor-react-native";import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { LineChart } from "react-native-chart-kit";

import { api } from "../../lib/api";
import { getStoredUser } from "../../lib/auth";
import NewSaleModal from "../../components/NewSaleModal";
import ExpenseModal from "../../components/ExpenseModal";
import { useSyncStatus } from "../../lib/useSyncStatus";
import { runSync } from "../../lib/syncService";

const TEAL = "#419873";
const RED = "#E03A2A";
const { width: SW } = Dimensions.get("window");

type Period = "today" | "yesterday" | "week" | "month" | "lastMonth" | "year";
const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
  { key: "year", label: "This Year" },
];

function getPeriodDates(period: Period): { from: string; to: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  switch (period) {
    case "today": { const t = fmt(now); return { from: t, to: t }; }
    case "yesterday": {
      const y = new Date(now); y.setDate(y.getDate() - 1); const t = fmt(y);
      return { from: t, to: t };
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

// Thin out labels so they don't overlap
function thinLabels(labels: string[], maxVisible = 7): string[] {
  if (labels.length <= maxVisible) return labels;
  const step = Math.ceil(labels.length / maxVisible);
  return labels.map((l, i) => (i % step === 0 ? l : ""));
}

export default function Dashboard() {
  const user = getStoredUser();
  const shopId = user?.shopId ?? "";
  const [period, setPeriod] = useState<Period>("month");
  const [showSale, setShowSale] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const insets = useSafeAreaInsets();
  const { pendingCount, isOnline } = useSyncStatus();

  const { from, to } = useMemo(() => getPeriodDates(period), [period]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard", shopId, from, to],
    queryFn: async () => {
      const res = await api.dashboard.$get({ query: { shopId, from, to } });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!shopId,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const income = data?.income ?? 0;
  const expense = data?.expense ?? 0;
  const profit = income - expense;

  // Build chart datasets — ensure at least 2 points for line to render
  const rawLabels: string[] = (data as any)?.chartLabels ?? [];
  const rawSales: number[] = (data as any)?.chartSales ?? [];
  const rawExpenses: number[] = (data as any)?.chartExpenses ?? [];

  const hasData = rawLabels.length >= 2;

  // Pad to at least 2 points if needed
  const chartLabels = hasData ? thinLabels(rawLabels, 7) : ["Start", "Now"];
  const chartSales = hasData ? rawSales : [0, 0];
  const chartExpenses = hasData ? rawExpenses : [0, 0];

  const maxVal = Math.max(...chartSales, ...chartExpenses, 1);
  // react-native-chart-kit crashes with two datasets when all values are identical/zero
  // Ensure no dataset has all-identical values by adding a tiny epsilon to last point if needed
  const safeDataset = (arr: number[]) => {
    const allSame = arr.every(v => v === arr[0]);
    if (allSame) return arr.map((v, i) => (i === arr.length - 1 ? v + 0.001 : v));
    return arr;
  };
  const safeSales = safeDataset(chartSales);
  const safeExpenses = safeDataset(chartExpenses);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Top bar */}
      <View style={s.topBar}>
        {/* Left: shop icon + name */}
        <View style={s.topLeft}>
          <View style={s.shopIconWrap}>
            <Text style={s.shopIconText}>
              {(user?.shopName ?? "S").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={s.shopName}>{user?.shopName ?? "My Shop"}</Text>
            <Text style={s.greeting}>Good {getGreeting()}</Text>
          </View>
        </View>
        {/* Right: sync indicator + date pill + user avatar */}
        <View style={s.topRight}>
          {/* Sync status badge */}
          <TouchableOpacity
            style={[s.syncBadge, !isOnline && s.syncBadgeOffline, pendingCount > 0 && isOnline && s.syncBadgePending]}
            onPress={() => runSync()}
            activeOpacity={0.7}
          >
            {!isOnline
              ? <CloudSlash size={13} color="#fff" weight="bold" />
              : pendingCount > 0
                ? <ArrowsClockwise size={13} color="#fff" weight="bold" />
                : <CloudCheck size={13} color="#fff" weight="bold" />
            }
            <Text style={s.syncBadgeText}>
              {!isOnline ? "Offline" : pendingCount > 0 ? `${pendingCount} pending` : "Synced"}
            </Text>
          </TouchableOpacity>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Period tabs */}
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

        {isLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={TEAL} size="large" />
            <Text style={s.loadingText}>Loading…</Text>
          </View>
        ) : (
          <>
            {/* Summary cards */}
            <View style={s.cardRow}>
              <View style={[s.card, { backgroundColor: TEAL }]}>
                <View style={s.cardIcon}>
                  <TrendUp size={18} color="rgba(255,255,255,0.9)" weight="bold" />
                </View>
                <Text style={s.cardLabel}>Income</Text>
                <Text style={s.cardAmount}>Rs. {income.toLocaleString()}</Text>
              </View>
              <View style={[s.card, { backgroundColor: RED }]}>
                <View style={s.cardIcon}>
                  <TrendDown size={18} color="rgba(255,255,255,0.9)" weight="bold" />
                </View>
                <Text style={s.cardLabel}>Expense</Text>
                <Text style={s.cardAmount}>Rs. {expense.toLocaleString()}</Text>
              </View>
            </View>

            {/* Profit strip */}
            <View style={[s.profitStrip, profit >= 0 ? s.profitPos : s.profitNeg]}>
              <Text style={s.profitLabel}>Net Profit</Text>
              <Text style={[s.profitValue, { color: profit >= 0 ? TEAL : RED }]}>
                {profit >= 0 ? "+" : ""}Rs. {profit.toLocaleString()}
              </Text>
            </View>

            {/* Sales Chart */}
            <View style={s.chartCard}>
              <View style={s.chartHeader}>
                <Text style={s.chartTitle}>Sales & Expenses</Text>
                <View style={s.chartLegend}>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: TEAL }]} />
                    <Text style={s.legendText}>Sales</Text>
                  </View>
                  <View style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: RED }]} />
                    <Text style={s.legendText}>Expenses</Text>
                  </View>
                </View>
              </View>

              {!hasData ? (
                <View style={s.noDataBox}>
                  <Text style={s.noDataText}>No transactions yet</Text>
                  <Text style={s.noDataSub}>Add a sale or expense to see the chart</Text>
                </View>
              ) : (
                <LineChart
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        data: safeSales,
                        color: (o = 1) => `rgba(65,152,115,${o})`,
                        strokeWidth: 2.5,
                      },
                      {
                        data: safeExpenses,
                        color: (o = 1) => `rgba(224,58,42,${o})`,
                        strokeWidth: 2,
                      },
                    ],
                    legend: [],
                  }}
                  width={SW - 64}
                  height={190}
                  chartConfig={{
                    backgroundColor: "#fff",
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    decimalPlaces: 0,
                    color: (o = 1) => `rgba(65,152,115,${o})`,
                    labelColor: () => "#B0BDB6",
                    style: { borderRadius: 10 },
                    propsForDots: {
                      r: "3",
                      strokeWidth: "2",
                    },
                    propsForBackgroundLines: {
                      stroke: "#F0F3F2",
                      strokeWidth: 1,
                      strokeDasharray: "4",
                    },
                    propsForLabels: {
                      fontSize: 10,
                    },
                  }}
                  bezier
                  withInnerLines
                  withOuterLines={false}
                  withShadow={false}
                  style={s.chart}
                  getDotColor={(_, datasetIndex) =>
                    datasetIndex === 0 ? TEAL : RED
                  }
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB row — sits directly above the bottom tab bar */}
      <View style={s.fabRow}>
        <TouchableOpacity style={[s.fab, { backgroundColor: TEAL }]} onPress={() => setShowSale(true)} activeOpacity={0.85}>
          <Image source={require("../../assets/income.png")} style={s.fabIcon} />
          <Text style={s.fabText}>Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.fab, { backgroundColor: RED }]} onPress={() => setShowExpense(true)} activeOpacity={0.85}>
          <Image source={require("../../assets/expenses.png")} style={s.fabIcon} />
          <Text style={s.fabText}>Expense</Text>
        </TouchableOpacity>
      </View>

      <NewSaleModal
        visible={showSale}
        shopId={String(shopId)}
        onClose={() => setShowSale(false)}
        onSuccess={() => { refetch(); }}
      />
      <ExpenseModal
        visible={showExpense}
        shopId={String(shopId)}
        onClose={() => setShowExpense(false)}
        onSuccess={() => { setShowExpense(false); refetch(); }}
      />
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function getTodayLabel() {
  const d = new Date();
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  topBar: {
    backgroundColor: TEAL,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
  },
  topLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  shopIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  shopIconText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  shopName: { fontSize: 17, fontWeight: "800", color: "#fff", letterSpacing: 0.2 },
  greeting: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  topRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  datePill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  datePillText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  syncBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5,
  },
  syncBadgeOffline: { backgroundColor: "rgba(200,60,40,0.5)" },
  syncBadgePending: { backgroundColor: "rgba(230,126,0,0.5)" },
  syncBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  avatarCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.28)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  periodRow: { gap: 8, paddingBottom: 16 },
  periodTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#E8EDE9",
  },
  periodTabActive: { backgroundColor: TEAL },
  periodText: { fontSize: 13, color: "#6B8070", fontWeight: "500" },
  periodTextActive: { color: "#fff", fontWeight: "700" },
  loadingBox: { alignItems: "center", paddingTop: 60, gap: 12 },
  loadingText: { color: "#A0ADB8", fontSize: 14 },
  cardRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: {
    flex: 1, borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  cardIcon: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  cardLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  cardAmount: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 4 },
  profitStrip: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  profitPos: { backgroundColor: "#E8F5EE" },
  profitNeg: { backgroundColor: "#FDECEA" },
  profitLabel: { fontSize: 13, color: "#555", fontWeight: "600" },
  profitValue: { fontSize: 16, fontWeight: "800" },

  // Chart
  chartCard: {
    backgroundColor: "#fff", borderRadius: 16,
    paddingTop: 16, paddingBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  chartHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, marginBottom: 12,
  },
  chartTitle: { fontSize: 13, fontWeight: "700", color: "#3a4a3e", textTransform: "uppercase", letterSpacing: 0.5 },
  chartLegend: { flexDirection: "row", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#8a9a8e", fontWeight: "500" },
  chart: { borderRadius: 0, marginLeft: -8 },
  noDataBox: {
    alignItems: "center", justifyContent: "center",
    height: 160, gap: 6,
  },
  noDataText: { color: "#A0ADB8", fontSize: 14, fontWeight: "600" },
  noDataSub: { color: "#C8D0CC", fontSize: 12 },

  // FABs
  fabRow: {
    flexDirection: "row", gap: 12,
    backgroundColor: "#F4F7F5",
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E8EDE9",
  },
  fab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 15, borderRadius: 14, gap: 6,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, elevation: 5,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  fabIconWrap: { position: "relative", width: 24, height: 24 },
  fabIcon: { width: 24, height: 24, resizeMode: "contain" },
  fabBadge: {
    position: "absolute", bottom: -4, right: -6,
    width: 14, height: 14, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },
  fabBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800", lineHeight: 12 },
  cardImg: { width: 22, height: 22, resizeMode: "contain", tintColor: "#fff" },
  cardIconWrap: { position: "relative", width: 22, height: 22 },
  cardBadge: {
    position: "absolute", bottom: -5, right: -7,
    width: 14, height: 14, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#fff",
  },
  cardBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", lineHeight: 12 },
});
