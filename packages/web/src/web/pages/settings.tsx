import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "../lib/auth";
import { api } from "../lib/api";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (!session?.user?.id) {
        throw new Error("User not found");
      }

      return (await (api.staff as any)[":id"].$patch({
        param: { id: session.user.id },
        json: { password: newPassword },
      })).json();
    },
    onSuccess: () => {
      setMessage({ type: "success", text: "Password changed successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: "error", text: error.message || "Failed to change password" });
    },
  });

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account</p>
        </div>

        {/* Change Password Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Change Password</h2>

          {message && (
            <div
              className={`mb-4 p-4 rounded-xl text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-2 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => changePassword.mutate()}
                disabled={changePassword.isPending || !currentPassword || !newPassword || !confirmPassword}
                className="px-5 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                style={{ background: "#419873" }}
              >
                {changePassword.isPending ? "Updating..." : "Change Password"}
              </button>
              <button
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setMessage(null);
                }}
                className="px-5 py-2 rounded-xl text-gray-600 text-sm font-medium border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Account Info Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Name</p>
              <p className="text-gray-800 font-medium">{session?.user?.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</p>
              <p className="text-gray-800 font-medium">{session?.user?.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</p>
              <p className="text-gray-800 font-medium capitalize">{(session?.user as any)?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
