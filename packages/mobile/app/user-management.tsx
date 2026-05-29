import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, User, Trash, ShieldCheck, ShoppingCart, PencilSimple, Prohibit, CheckCircle } from "phosphor-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { authFetch } from "../lib/authFetch";
import { getStoredUser } from "../lib/auth";

const TEAL = "#419873";
const PURPLE = "#7B5EA7";
const ORANGE = "#E08A2A";

type StaffUser = { id: string; name: string; username: string; role: string; suspended?: boolean };

export default function UserManagement() {
  const router = useRouter();
  const user = getStoredUser();
  const shopId = user?.shopId ?? "";

  // Role guard
  if ((user as any)?.role !== "admin") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F7F5" }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#419873", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={22} color="#fff" weight="bold" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: "800", color: "#fff" }}>User Management</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 32 }}>
          <ShieldCheck size={56} color="#D0D8D4" weight="duotone" />
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#A0ADB8" }}>Access Denied</Text>
          <Text style={{ fontSize: 14, color: "#B0BDB6", textAlign: "center" }}>Only admins can manage users.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const qc = useQueryClient();

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "admin">("staff");
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"staff" | "admin">("staff");
  const [editSaving, setEditSaving] = useState(false);

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["shop-staff", shopId],
    queryFn: async () => {
      const res = await (api as any).staff.$get({ query: { shopId } });
      if (!res.ok) return [];
      const d = await res.json();
      return d.users ?? d ?? [];
    },
    enabled: !!shopId,
  });

  function resetForm() {
    setName(""); setUsername(""); setPassword(""); setRole("staff");
  }

  function openEdit(u: StaffUser) {
    setEditTarget(u);
    setEditName(u.name);
    setEditPassword("");
    setEditRole(u.role === "admin" ? "admin" : "staff");
    setShowEdit(true);
  }

  async function handleAdd() {
    if (!name.trim() || !username.trim() || !password.trim()) {
      Alert.alert("Error", "All fields required."); return;
    }
    setSaving(true);
    try {
      await authFetch("/api/staff", {
        method: "POST",
        body: JSON.stringify({ shopId: Number(shopId), name: name.trim(), username: username.trim(), password, role }),
      });
      qc.invalidateQueries({ queryKey: ["shop-staff", shopId] });
      setShowAdd(false); resetForm();
    } catch (e: any) {
      if (e?.message !== "Session expired") {
        Alert.alert("Error", e?.message || "Failed to add user.");
      }
    }
    setSaving(false);
  }

  async function handleEdit() {
    if (!editTarget || !editName.trim()) {
      Alert.alert("Error", "Name required."); return;
    }
    setEditSaving(true);
    try {
      const body: any = { name: editName.trim(), role: editRole };
      if (editPassword.trim()) body.password = editPassword.trim();
      await authFetch(`/api/staff/${editTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      qc.invalidateQueries({ queryKey: ["shop-staff", shopId] });
      setShowEdit(false); setEditTarget(null);
    } catch (e: any) {
      if (e?.message !== "Session expired") {
        Alert.alert("Error", e?.message || "Failed to update user.");
      }
    }
    setEditSaving(false);
  }

  async function handleSuspend(u: StaffUser) {
    const action = u.suspended ? "unsuspend" : "suspend";
    Alert.alert(
      u.suspended ? "Unsuspend User" : "Suspend User",
      `${u.suspended ? "Re-enable" : "Suspend"} "${u.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: u.suspended ? "Unsuspend" : "Suspend",
          style: u.suspended ? "default" : "destructive",
          onPress: async () => {
            try {
              await authFetch(`/api/staff/${u.id}/suspend`, {
                method: "PATCH",
                body: JSON.stringify({ suspended: !u.suspended }),
              });
              qc.invalidateQueries({ queryKey: ["shop-staff", shopId] });
            } catch {
              Alert.alert("Error", "Failed to update user.");
            }
          },
        },
      ]
    );
  }

  async function handleDelete(u: StaffUser) {
    Alert.alert(
      "Delete User",
      `Remove "${u.name}" from this shop?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              const res = await (api as any).staff[":id"].$delete({ param: { id: u.id } });
              if (!res.ok) throw new Error();
              qc.invalidateQueries({ queryKey: ["shop-staff", shopId] });
            } catch {
              Alert.alert("Error", "Failed to delete user.");
            }
          },
        },
      ]
    );
  }

  const isAdmin = (r: string) => r === "admin";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={22} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Management</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Plus size={18} color="#fff" weight="bold" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <User size={48} color="#D0D8D4" weight="duotone" />
              <Text style={s.emptyText}>No users yet</Text>
              <Text style={s.emptySub}>Tap + to add a cashier or admin</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[s.userCard, item.suspended && s.userCardSuspended]}>
              <View style={[s.avatar, isAdmin(item.role) && s.avatarAdmin]}>
                <Text style={[s.avatarText, isAdmin(item.role) && { color: PURPLE }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={s.userInfo}>
                <Text style={s.userName}>{item.name}</Text>
                <Text style={s.userUsername}>@{item.username}</Text>
                <View style={s.badgeRow}>
                  <View style={[s.roleBadge, isAdmin(item.role) && s.roleBadgeAdmin]}>
                    {isAdmin(item.role)
                      ? <ShieldCheck size={11} color={PURPLE} weight="fill" />
                      : <ShoppingCart size={11} color={TEAL} weight="fill" />
                    }
                    <Text style={[s.roleBadgeText, isAdmin(item.role) && { color: PURPLE }]}>
                      {isAdmin(item.role) ? "Admin" : "Cashier"}
                    </Text>
                  </View>
                  {item.suspended && (
                    <View style={s.suspendedBadge}>
                      <Text style={s.suspendedBadgeText}>Suspended</Text>
                    </View>
                  )}
                </View>
              </View>
              {/* Action buttons */}
              <View style={s.actionBtns}>
                <TouchableOpacity style={s.actionBtn} onPress={() => openEdit(item)}>
                  <PencilSimple size={16} color={TEAL} weight="bold" />
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: item.suspended ? "#E8F5EE" : "#FFF4E5" }]} onPress={() => handleSuspend(item)}>
                  {item.suspended
                    ? <CheckCircle size={16} color="#419873" weight="bold" />
                    : <Prohibit size={16} color={ORANGE} weight="bold" />
                  }
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: "#FEF0EE" }]} onPress={() => handleDelete(item)}>
                  <Trash size={16} color="#E03A2A" weight="bold" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add user modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => { setShowAdd(false); resetForm(); }}>
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={s.modalSheet}>
              <View style={s.handle} />
              <Text style={s.modalTitle}>Add User</Text>

              <Text style={s.fieldLabel}>Full Name</Text>
              <TextInput style={s.input} placeholder="e.g. John Perera" value={name} onChangeText={setName} placeholderTextColor="#B0BDB6" />

              <Text style={s.fieldLabel}>Username</Text>
              <TextInput style={s.input} placeholder="e.g. john_p" value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor="#B0BDB6" />

              <Text style={s.fieldLabel}>Password</Text>
              <TextInput style={s.input} placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#B0BDB6" />

              <Text style={s.fieldLabel}>Role</Text>
              <View style={s.roleRow}>
                <TouchableOpacity style={[s.roleBtn, role === "staff" && s.roleBtnActive]} onPress={() => setRole("staff")}>
                  <ShoppingCart size={16} color={role === "staff" ? "#fff" : TEAL} weight="fill" />
                  <Text style={[s.roleBtnText, role === "staff" && s.roleBtnTextActive]}>Cashier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.roleBtn, s.roleBtnAdmin, role === "admin" && s.roleBtnAdminActive]} onPress={() => setRole("admin")}>
                  <ShieldCheck size={16} color={role === "admin" ? "#fff" : PURPLE} weight="fill" />
                  <Text style={[s.roleBtnText, { color: role === "admin" ? "#fff" : PURPLE }, role === "admin" && s.roleBtnTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>

              <View style={s.privilegeNote}>
                <Text style={s.privilegeText}>
                  <Text style={{ fontWeight: "700" }}>Cashier:</Text> can add sales & expenses.{"  "}
                  <Text style={{ fontWeight: "700" }}>Admin:</Text> full access.
                </Text>
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowAdd(false); resetForm(); }}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Add User</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit user modal */}
      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => { setShowEdit(false); setEditTarget(null); }}>
        <View style={s.modalOverlay}>
          <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={s.modalSheet}>
              <View style={s.handle} />
              <Text style={s.modalTitle}>Edit User</Text>

              <Text style={s.fieldLabel}>Full Name</Text>
              <TextInput style={s.input} placeholder="Full name" value={editName} onChangeText={setEditName} placeholderTextColor="#B0BDB6" />

              <Text style={s.fieldLabel}>New Password <Text style={{ color: "#B0BDB6", fontWeight: "400" }}>(leave blank to keep)</Text></Text>
              <TextInput style={s.input} placeholder="••••••••" value={editPassword} onChangeText={setEditPassword} secureTextEntry placeholderTextColor="#B0BDB6" />

              <Text style={s.fieldLabel}>Role</Text>
              <View style={s.roleRow}>
                <TouchableOpacity style={[s.roleBtn, editRole === "staff" && s.roleBtnActive]} onPress={() => setEditRole("staff")}>
                  <ShoppingCart size={16} color={editRole === "staff" ? "#fff" : TEAL} weight="fill" />
                  <Text style={[s.roleBtnText, editRole === "staff" && s.roleBtnTextActive]}>Cashier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.roleBtn, s.roleBtnAdmin, editRole === "admin" && s.roleBtnAdminActive]} onPress={() => setEditRole("admin")}>
                  <ShieldCheck size={16} color={editRole === "admin" ? "#fff" : PURPLE} weight="fill" />
                  <Text style={[s.roleBtnText, { color: editRole === "admin" ? "#fff" : PURPLE }, editRole === "admin" && s.roleBtnTextActive]}>Admin</Text>
                </TouchableOpacity>
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowEdit(false); setEditTarget(null); }}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.saveBtn, editSaving && { opacity: 0.6 }]} onPress={handleEdit} disabled={editSaving}>
                  {editSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  header: {
    backgroundColor: TEAL, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "800", color: "#fff" },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  userCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  userCardSuspended: { opacity: 0.65 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#E8F5EE", alignItems: "center", justifyContent: "center",
  },
  avatarAdmin: { backgroundColor: "#F0EBF8" },
  avatarText: { fontSize: 20, fontWeight: "800", color: TEAL },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: "#1a2e22" },
  userUsername: { fontSize: 12, color: "#A0ADB8", marginTop: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5EE", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  roleBadgeAdmin: { backgroundColor: "#F0EBF8" },
  roleBadgeText: { color: TEAL, fontSize: 11, fontWeight: "700" },
  suspendedBadge: {
    backgroundColor: "#FEF0EE", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  suspendedBadgeText: { color: "#E03A2A", fontSize: 11, fontWeight: "700" },
  actionBtns: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#E8F5EE",
    alignItems: "center", justifyContent: "center",
  },
  emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#C0CCC8" },
  emptySub: { fontSize: 13, color: "#C0CCC8" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalScroll: { justifyContent: "flex-end", flexGrow: 1 },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 48,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1a2e22", marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#8A9099", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: "#E0E8E3", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: "#1a2e22", marginBottom: 16, backgroundColor: "#F7FAF8",
  },
  roleRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  roleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 12, paddingVertical: 12,
    borderWidth: 1.5, borderColor: TEAL, backgroundColor: "#F7FAF8",
  },
  roleBtnActive: { backgroundColor: TEAL, borderColor: TEAL },
  roleBtnAdmin: { borderColor: PURPLE },
  roleBtnAdminActive: { backgroundColor: PURPLE, borderColor: PURPLE },
  roleBtnText: { fontSize: 14, fontWeight: "700", color: TEAL },
  roleBtnTextActive: { color: "#fff" },
  privilegeNote: {
    backgroundColor: "#F4F7F5", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 20,
  },
  privilegeText: { fontSize: 12, color: "#6B8070", lineHeight: 18 },
  modalActions: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", backgroundColor: "#F0F4F2",
  },
  cancelBtnText: { color: "#6B8070", fontWeight: "700", fontSize: 15 },
  saveBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", backgroundColor: TEAL,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
