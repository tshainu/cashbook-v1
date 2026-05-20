import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function ShopsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", shopCode: "" });
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => (await api.shops.$get()).json(),
  });

  const createShop = useMutation({
    mutationFn: async (d: any) => (await api.shops.$post({ json: d })).json(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shops"] }); setShowForm(false); setForm({ name: "", shopCode: "" }); },
  });

  const updateShop = useMutation({
    mutationFn: async ({ id, ...d }: any) => (await (api.shops as any)[":id"].$put({ param: { id: String(id) }, json: d })).json(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["shops"] }); setEditing(null); },
  });

  const deleteShop = useMutation({
    mutationFn: async (id: number) => (await (api.shops as any)[":id"].$delete({ param: { id: String(id) } })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shops"] }),
  });

  const shops = data?.shops ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shops</h1>
          <p className="text-gray-500 text-sm mt-1">Manage shop accounts</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", shopCode: "" }); }}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: "#419873" }}>
          + Add Shop
        </button>
      </div>

      {/* Form */}
      {(showForm || editing) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">{editing ? "Edit Shop" : "New Shop"}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Shop Name</label>
              <input value={editing ? editing.name : form.name}
                onChange={e => editing ? setEditing({ ...editing, name: e.target.value }) : setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Axis Shop" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Shop ID (Login Code)</label>
              <input value={editing ? editing.shopCode : form.shopCode}
                onChange={e => editing ? setEditing({ ...editing, shopCode: e.target.value }) : setForm({ ...form, shopCode: e.target.value })}
                placeholder="e.g. AXIS001" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => editing ? updateShop.mutate(editing) : createShop.mutate(form)}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium" style={{ background: "#419873" }}>
              {editing ? "Update" : "Create"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }}
              className="px-5 py-2 rounded-xl text-gray-600 text-sm font-medium border border-gray-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Shop Name</th>
              <th className="px-6 py-3 text-left">Shop ID (Login Code)</th>
              <th className="px-6 py-3 text-left">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {shops.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">No shops yet</td></tr>
            ) : shops.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                <td className="px-6 py-4"><span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-mono">{s.shopCode}</span></td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => setEditing(s)} className="text-sm text-[#419873] font-medium hover:underline">Edit</button>
                  <button onClick={() => { if (confirm("Delete this shop?")) deleteShop.mutate(s.id); }}
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
