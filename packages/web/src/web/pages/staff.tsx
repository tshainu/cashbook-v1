import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function StaffPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: "staff", shopId: "" });

  const { data: shopsData } = useQuery({
    queryKey: ["shops"],
    queryFn: async () => (await api.shops.$get()).json(),
  });

  const { data: staffData } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await api.staff.$get()).json(),
  });

  const createStaff = useMutation({
    mutationFn: async (d: any) => (await api.staff.$post({ json: { ...d, shopId: parseInt(d.shopId) } })).json(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["staff"] }); setShowForm(false); setForm({ name: "", username: "", email: "", password: "", role: "staff", shopId: "" }); },
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => (await (api.staff as any)[":id"].$delete({ param: { id } })).json(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff"] }),
  });

  const updatePassword = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => 
      (await (api.staff as any)[":id"].$patch({ param: { id }, json: { password } })).json(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setEditingPassword(null);
      setNewPassword("");
    },
  });

  const shops = shopsData?.shops ?? [];
  const staffList = staffData?.staff ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-500 text-sm mt-1">Manage staff accounts</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: "#419873" }}>
          + Add Staff
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">New Staff Account</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
              { key: "username", label: "Username (login)", type: "text", placeholder: "johndoe" },
              { key: "email", label: "Email", type: "email", placeholder: "john@example.com" },
              { key: "password", label: "Password", type: "password", placeholder: "••••••••" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-sm text-gray-600 mb-1 block">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Shop</label>
              <select value={form.shopId} onChange={e => setForm({ ...form, shopId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="">Select shop...</option>
                {shops.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => createStaff.mutate(form)}
              disabled={createStaff.isPending}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ background: "#419873" }}>
              {createStaff.isPending ? "Creating..." : "Create Staff"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-xl text-gray-600 text-sm font-medium border border-gray-200">Cancel</button>
          </div>
          {createStaff.isError && <p className="text-red-500 text-sm mt-2">Failed to create staff. Check details.</p>}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-left">Shop</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {staffList.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No staff yet</td></tr>
            ) : staffList.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{s.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {shops.find((sh: any) => sh.id === s.shopId)?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => setEditingPassword(s)}
                    className="text-sm text-blue-500 font-medium hover:underline">Change Password</button>
                  <button onClick={() => { if (confirm("Delete this staff?")) deleteStaff.mutate(s.id); }}
                    className="text-sm text-red-500 font-medium hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password Edit Modal */}
      {editingPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Change Password for {editingPassword.name}</h3>
            <div className="mb-4">
              <label className="text-sm text-gray-600 mb-2 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => updatePassword.mutate({ id: editingPassword.id, password: newPassword })}
                disabled={updatePassword.isPending || !newPassword}
                className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                style={{ background: "#419873" }}
              >
                {updatePassword.isPending ? "Updating..." : "Update Password"}
              </button>
              <button
                onClick={() => { setEditingPassword(null); setNewPassword(""); }}
                className="flex-1 px-4 py-2 rounded-xl text-gray-600 text-sm font-medium border border-gray-200"
              >
                Cancel
              </button>
            </div>
            {updatePassword.isError && <p className="text-red-500 text-sm mt-2">Failed to update password</p>}
          </div>
        </div>
      )}
    </div>
  );
}
