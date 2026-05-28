import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Plus, User, Trash, PencilSimple } from "phosphor-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { getStoredUser } from "../lib/auth";

const TEAL = "#419873";

type StaffUser = { id: string; name: string; email: string; role: string };

export default function UserManagement() {
  const router = useRouter();
  const user = getStoredUser();
  const shopId = user?.shopId ?? "";
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: users = [], isLoading } = useQuery<StaffUser[]>({
    queryKey: ["shop-users", shopId],
    queryFn: async () => {
      const res = await (api as any).users.$get({ query: { shopId } });
      if (!res.ok) return [];
      const d = await res.json();
      return d.users ?? d ?? [];
    },
    enabled: !!shopId,
  });

  async function handleAdd() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "All fields required."); return;
    }
    setSaving(true);
    try {
      const res = await (api as any).users.$post({
        json: { shopId: Number(shopId), name: name.trim(), email: email.trim(), password, role: "staff" },
      });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ["shop-users", shopId] });
      setShowAdd(false); setName(""); setEmail(""); setPassword("");
    } catch {
      Alert.alert("Error", "Failed to add user.");
    }
    setSaving(false);
  }

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
              <Text style={s.emptyText}>No staff users yet</Text>
              <Text style={s.emptySub}>Tap + to add a staff member</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.userCard}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={s.userInfo}>
                <Text style={s.userName}>{item.name}</Text>
                <Text style={s.userEmail}>{item.email}</Text>
                <View style={s.roleBadge}>
                  <Text style={s.roleBadgeText}>{item.role}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Add user modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Add Staff User</Text>
            <TextInput
              style={s.input} placeholder="Full Name" value={name}
              onChangeText={setName} placeholderTextColor="#B0BDB6"
            />
            <TextInput
              style={s.input} placeholder="Email" value={email}
              onChangeText={setEmail} keyboardType="email-address"
              autoCapitalize="none" placeholderTextColor="#B0BDB6"
            />
            <TextInput
              style={s.input} placeholder="Password" value={password}
              onChangeText={setPassword} secureTextEntry placeholderTextColor="#B0BDB6"
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Add User</Text>}
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: "#E8F5EE", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: TEAL },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "700", color: "#1a2e22" },
  userEmail: { fontSize: 12, color: "#A0ADB8", marginTop: 2 },
  roleBadge: {
    marginTop: 6, alignSelf: "flex-start",
    backgroundColor: "#E8F5EE", borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  roleBadgeText: { color: TEAL, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#C0CCC8" },
  emptySub: { fontSize: 13, color: "#C0CCC8" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1a2e22", marginBottom: 20 },
  input: {
    borderWidth: 1.5, borderColor: "#E0E8E3", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: "#1a2e22", marginBottom: 12, backgroundColor: "#F7FAF8",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 8 },
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
