import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function ItemsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"sale" | "expense">("sale");
  const [form, setForm] = useState({ name: "", defaultPrice: "", type: "sale", shopId: "" });

  const { data: shopsData } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => (await api.shops.$get()).json(),
  });

  const { data: itemsData } = useQuery({
    queryKey: ["items", tab],
    queryFn: async () => (await api.items.$get({ query: { type: tab } })).json(),
  });

  const createItem = useMutation({
    mutationFn: async (d: any) => (await api.items.$post({ json: { ...d, defaultPrice: parseFloat(d.defaultPrice), shopId: parseInt(d.shopId) } })).json(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["items"] }); setShowForm(false); setForm({ name: "", defaultPrice: "", type: tab, shopId: "" }); },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => (await (api.items as any)[":id"].$delete({ param: { id: String(id) } })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  const shops = shopsData?.shops ?? [];
  const itemsList = itemsData?.items ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Items</h1>
          <p className="text-gray-500 text-sm mt-1">Manage sale items and expense categories</p>
        </div>
        <button onClick={() => { setShowForm(true); setForm(f => ({ ...f, type: tab })); }}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: "#419873" }}>
          + Add Item
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["sale", "expense"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t ? "text-white" : "bg-white text-gray-600 border border-gray-200"
            }`}
            style={tab === t ? { background: t === "sale" ? "#419873" : "#e03a2a" } : {}}>
            {t === "sale" ? "Sale Items" : "Expense Categories"}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">New {tab === "sale" ? "Sale Item" : "Expense Category"}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Water 20L" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Default Price</label>
              <input type="number" value={form.defaultPrice} onChange={e => setForm({ ...form, defaultPrice: e.target.value })}
                placeholder="100.00" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Shop</label>
              <select value={form.shopId} onChange={e => setForm({ ...form, shopId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="">Select shop...</option>
                {shops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createItem.mutate({ ...form, type: tab })}
              disabled={createItem.isPending}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: "#419873" }}>
              {createItem.isPending ? "Saving..." : "Save Item"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-gray-600 text-sm font-medium border border-gray-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Default Price</th>
              <th className="px-6 py-3 text-left">Shop</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {itemsList.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No items yet</td></tr>
            ) : itemsList.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{item.name}</td>
                <td className="px-6 py-4 text-sm font-semibold" style={{ color: "#419873" }}>
                  Rs. {item.defaultPrice.toLocaleString("en", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {shops.find((s: any) => s.id === item.shopId)?.name ?? "—"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { if (confirm("Delete this item?")) deleteItem.mutate(item.id); }}
                    className="text-sm text-red-500 font-medium hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
