import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState } from "react";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "lastmonth", label: "Last Month" },
  { key: "year", label: "This Year" },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState("today");

  const { data } = useQuery({
    queryKey: ["transactions", "all", period],
    queryFn: async () => (await api.transactions.$get({ query: { period } })).json(),
  });

  const totalSales = data?.totalSales ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const txList = data?.transactions ?? [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of all transactions</p>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PERIODS.map(p => (
          <button key={p.key} onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              period === p.key ? "text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#419873]"
            }`}
            style={period === p.key ? { background: "#419873" } : {}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Income</p>
          <p className="text-3xl font-bold" style={{ color: "#419873" }}>
            Rs. {totalSales.toLocaleString("en", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold text-red-500">
            Rs. {totalExpenses.toLocaleString("en", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Net Balance</p>
          <p className={`text-3xl font-bold ${(totalSales - totalExpenses) >= 0 ? "" : "text-red-500"}`}
            style={(totalSales - totalExpenses) >= 0 ? { color: "#419873" } : {}}>
            Rs. {(totalSales - totalExpenses).toLocaleString("en", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Item</th>
                <th className="px-6 py-3 text-left">Staff</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {txList.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No transactions yet</td></tr>
              ) : txList.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(tx.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{tx.itemName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{tx.userName ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === "sale" ? "bg-green-100 text-green-700" :
                      tx.type === "credit" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-right" style={{ color: tx.type === "expense" ? "#e03a2a" : "#419873" }}>
                    Rs. {tx.amount.toLocaleString("en", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
