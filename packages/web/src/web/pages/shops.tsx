import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

function generateShopId(): string {
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const digits = String(Math.floor(100 + Math.random() * 900));
  return `${letter}${digits}`;
}

const emptyForm = () => ({
  name: "",
  shopCode: generateShopId(),
  address: "",
  contactNumber: "",
  ownerName: "",
  password: "",
});

function FormField({
  label, value, onChange, placeholder, readOnly = false, type = "text",
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; readOnly?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#419873]/30 ${readOnly ? "bg-gray-50 text-gray-500 cursor-default" : ""}`}
      />
    </div>
  );
}

export default function ShopsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => (await api.shops.$get()).json(),
  });

  const createShop = useMutation({
    mutationFn: async (d: any) => (await api.shops.$post({ json: d })).json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shops"] });
      setShowForm(false);
      setForm(emptyForm());
    },
  });

  const updateShop = useMutation({
    mutationFn: async ({ id, ...d }: any) =>
      (await (api.shops as any)[":id"].$put({ param: { id: String(id) }, json: d })).json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shops"] });
      setEditing(null);
    },
  });

  const deleteShop = useMutation({
    mutationFn: async (id: number) =>
      (await (api.shops as any)[":id"].$delete({ param: { id: String(id) } })).json(),
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
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm()); }}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ background: "#419873" }}
        >
          + Add Shop
        </button>
      </div>

      {/* Create Form */}
      {showForm && !editing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-5">New Shop</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Shop Name"
              value={form.name}
              onChange={v => setForm({ ...form, name: v })}
              placeholder="e.g. Axis Super Store"
            />
            <FormField
              label="Owner's Name"
              value={form.ownerName}
              onChange={v => setForm({ ...form, ownerName: v })}
              placeholder="e.g. Kamal Perera"
            />
            <FormField
              label="Shop Address"
              value={form.address}
              onChange={v => setForm({ ...form, address: v })}
              placeholder="e.g. 42 Main Street, Colombo"
            />
            <FormField
              label="Contact Number"
              value={form.contactNumber}
              onChange={v => setForm({ ...form, contactNumber: v })}
              placeholder="e.g. 0771234567"
            />

            {/* Shop ID — auto-generated, read-only with refresh button */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Shop ID</label>
              <div className="flex gap-2">
                <input
                  value={form.shopCode}
                  readOnly
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700 font-mono cursor-default focus:outline-none"
                />
                <button
                  onClick={() => setForm({ ...form, shopCode: generateShopId() })}
                  title="Regenerate ID"
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 text-sm"
                >
                  ↻
                </button>
              </div>
            </div>

            {/* Admin login section */}
            <div className="col-span-2 mt-1">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Admin Login Credentials</p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Username"
                    value="admin"
                    readOnly
                  />
                  <FormField
                    label="Password"
                    value={form.password}
                    onChange={v => setForm({ ...form, password: v })}
                    placeholder="Set a password"
                    type="password"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => createShop.mutate(form)}
              disabled={createShop.isPending || !form.name || !form.password}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ background: "#419873" }}
            >
              {createShop.isPending ? "Creating…" : "Create Shop"}
            </button>
            <button
              onClick={() => { setShowForm(false); }}
              className="px-5 py-2 rounded-xl text-gray-600 text-sm font-medium border border-gray-200"
            >
              Cancel
            </button>
          </div>
          {(createShop.data as any)?.error && (
            <p className="text-sm text-red-500 mt-2">{(createShop.data as any).error}</p>
          )}
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-5">Edit Shop</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Shop Name"
              value={editing.name}
              onChange={v => setEditing({ ...editing, name: v })}
            />
            <FormField
              label="Owner's Name"
              value={editing.ownerName ?? ""}
              onChange={v => setEditing({ ...editing, ownerName: v })}
              placeholder="e.g. Kamal Perera"
            />
            <FormField
              label="Shop Address"
              value={editing.address ?? ""}
              onChange={v => setEditing({ ...editing, address: v })}
              placeholder="e.g. 42 Main Street, Colombo"
            />
            <FormField
              label="Contact Number"
              value={editing.contactNumber ?? ""}
              onChange={v => setEditing({ ...editing, contactNumber: v })}
              placeholder="e.g. 0771234567"
            />
            <FormField
              label="Shop ID"
              value={editing.shopCode}
              readOnly
            />
          </div>
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => updateShop.mutate(editing)}
              disabled={updateShop.isPending}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ background: "#419873" }}
            >
              {updateShop.isPending ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-5 py-2 rounded-xl text-gray-600 text-sm font-medium border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Shop ID</th>
              <th className="px-6 py-3 text-left">Shop Name</th>
              <th className="px-6 py-3 text-left">Owner</th>
              <th className="px-6 py-3 text-left">Contact</th>
              <th className="px-6 py-3 text-left">Address</th>
              <th className="px-6 py-3 text-left">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {shops.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No shops yet
                </td>
              </tr>
            ) : shops.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <span className="bg-gray-100 px-3 py-1 rounded-lg text-sm font-mono font-medium">{s.shopCode}</span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.ownerName ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.contactNumber ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{s.address ?? "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => setEditing(s)}
                    className="text-sm text-[#419873] font-medium hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteShop.mutate(s.id); }}
                    className="text-sm text-red-500 font-medium hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
