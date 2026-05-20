import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, FlatList, Animated, PanResponder,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, CurrencyCircleDollar, Trash, PencilSimple, Check, X, Plus } from "phosphor-react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getStoredUser } from "../lib/auth";

const TEAL = "#419873";
const RED = "#E03A2A";
const ACTION_WIDTH = 128;
const SWIPE_THRESHOLD = 55;

type Category = { id: string; name: string; defaultPrice: number };

function SwipeRow({ item, onEdit, onDelete }: {
  item: Category; onEdit: (i: Category) => void; onDelete: (id: string) => void;
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const open = useRef(false);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
    onPanResponderMove: (_, g) => {
      tx.setValue(Math.max(-ACTION_WIDTH, Math.min(0, g.dx + (open.current ? -ACTION_WIDTH : 0))));
    },
    onPanResponderRelease: (_, g) => {
      const final = g.dx + (open.current ? -ACTION_WIDTH : 0);
      if (final < -SWIPE_THRESHOLD) {
        Animated.spring(tx, { toValue: -ACTION_WIDTH, useNativeDriver: true }).start();
        open.current = true;
      } else {
        Animated.spring(tx, { toValue: 0, useNativeDriver: true }).start();
        open.current = false;
      }
    },
  })).current;

  const close = () => {
    Animated.spring(tx, { toValue: 0, useNativeDriver: true }).start();
    open.current = false;
  };

  return (
    <View style={sw.wrapper}>
      <View style={sw.actions}>
        <TouchableOpacity style={[sw.actionBtn, { backgroundColor: "#F0A500" }]}
          onPress={() => { close(); onEdit(item); }}>
          <PencilSimple size={18} color="#fff" weight="fill" />
          <Text style={sw.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[sw.actionBtn, { backgroundColor: RED }]}
          onPress={() => { close(); onDelete(item.id); }}>
          <Trash size={18} color="#fff" weight="fill" />
          <Text style={sw.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={[sw.row, { transform: [{ translateX: tx }] }]} {...pan.panHandlers}>
        <View style={sw.iconBox}>
          <CurrencyCircleDollar size={16} color={TEAL} weight="fill" />
        </View>
        <View style={sw.info}>
          <Text style={sw.name}>{item.name}</Text>
          <Text style={sw.price}>Default: Rs. {Number(item.defaultPrice).toFixed(2)}</Text>
        </View>
        <Text style={sw.hint}>←</Text>
      </Animated.View>
    </View>
  );
}

function EditCard({ item, onDone, onCancel }: {
  item: Category; onDone: () => void; onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.defaultPrice));
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  async function save() {
    if (!name.trim()) { Alert.alert("Error", "Name required"); return; }
    setSaving(true);
    try {
      const res = await api.items[":id"].$put({
        param: { id: item.id },
        json: { name: name.trim(), defaultPrice: parseFloat(price) || 0, type: "sale" },
      });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ["income-categories"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      setSaving(false);
      onDone();
    } catch { setSaving(false); Alert.alert("Error", "Failed to save."); }
  }

  return (
    <View style={ec.card}>
      <Text style={ec.title}>Edit Category</Text>
      <TextInput style={ec.input} value={name} onChangeText={setName} placeholder="Category name" placeholderTextColor="#B0BDB6" />
      <TextInput style={ec.input} value={price} onChangeText={setPrice} placeholder="Default price" keyboardType="decimal-pad" placeholderTextColor="#B0BDB6" />
      <View style={ec.row}>
        <TouchableOpacity style={[ec.btn, { backgroundColor: TEAL }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Check size={15} color="#fff" /><Text style={ec.btnText}> Save</Text></>}
        </TouchableOpacity>
        <TouchableOpacity style={[ec.btn, { backgroundColor: "#B0B8C1" }]} onPress={onCancel}>
          <X size={15} color="#fff" /><Text style={ec.btnText}> Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function IncomeCategoriesScreen() {
  const router = useRouter();
  const user = getStoredUser();
  const shopId = user?.shopId ?? 0;
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["income-categories", shopId],
    queryFn: async () => {
      const res = await api.items.$get({ query: { shopId: String(shopId), type: "sale" } });
      if (!res.ok) throw new Error();
      const d = await res.json() as any;
      return (d.items ?? d).map((i: any) => ({ id: String(i.id), name: i.name, defaultPrice: i.defaultPrice ?? 0 }));
    },
    enabled: !!shopId,
  });

  async function handleAdd() {
    if (!newName.trim()) { Alert.alert("Error", "Enter a category name"); return; }
    setAdding(true); Keyboard.dismiss();
    try {
      const res = await api.items.$post({
        json: { shopId, name: newName.trim(), defaultPrice: parseFloat(newPrice) || 0, type: "sale" },
      });
      if (!res.ok) throw new Error();
      setNewName(""); setNewPrice("");
      qc.invalidateQueries({ queryKey: ["income-categories"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      setAdding(false);
    } catch { setAdding(false); Alert.alert("Error", "Failed to add category."); }
  }

  function handleDelete(id: string) {
    Alert.alert("Delete", "Remove this category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await api.items[":id"].$delete({ param: { id } });
            qc.invalidateQueries({ queryKey: ["income-categories"] });
            qc.invalidateQueries({ queryKey: ["items"] });
          } catch { Alert.alert("Error", "Failed to delete."); }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color="#fff" weight="bold" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Income Categories</Text>
          <Text style={s.headerSub}>{categories.length} categories</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          data={categories}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Add form */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>Add New Category</Text>
                <View style={s.addCard}>
                  <TextInput style={s.input} placeholder="Category name" placeholderTextColor="#B0BDB6" value={newName} onChangeText={setNewName} />
                  <TextInput style={s.input} placeholder="Default price (optional)" placeholderTextColor="#B0BDB6" keyboardType="decimal-pad" value={newPrice} onChangeText={setNewPrice} />
                  <TouchableOpacity style={[s.addBtn, adding && { opacity: 0.6 }]} onPress={handleAdd} disabled={adding}>
                    {adding
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Plus size={16} color="#fff" weight="bold" /><Text style={s.addBtnText}> Add Category</Text></>}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Edit card */}
              {editing && (
                <View style={s.section}>
                  <EditCard item={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
                </View>
              )}

              <View style={s.section}>
                <Text style={s.sectionLabel}>List of Categories</Text>
                <Text style={s.sectionHint}>Swipe left to edit or delete</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            isLoading
              ? <ActivityIndicator color={TEAL} style={{ marginTop: 48 }} />
              : <View style={s.emptyBox}><CurrencyCircleDollar size={36} color="#DDD" weight="duotone" /><Text style={s.emptyText}>No categories yet</Text></View>
          }
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <SwipeRow item={item} onEdit={setEditing} onDelete={handleDelete} />
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F7F5" },
  header: {
    backgroundColor: TEAL, flexDirection: "row",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 14,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#A0ADB8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  sectionHint: { fontSize: 12, color: "#C0CCC8", marginTop: 2 },
  addCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  input: {
    borderWidth: 1.5, borderColor: "#E0E8E3", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: "#1A2E24", marginBottom: 10, backgroundColor: "#F7FAF8",
  },
  addBtn: {
    backgroundColor: TEAL, borderRadius: 10, paddingVertical: 13,
    alignItems: "center", flexDirection: "row", justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { color: "#C0CCC8", fontSize: 15, fontWeight: "600" },
});

const sw = StyleSheet.create({
  wrapper: { borderRadius: 12, overflow: "hidden" },
  actions: {
    position: "absolute", right: 0, top: 0, bottom: 0,
    flexDirection: "row", width: ACTION_WIDTH,
  },
  actionBtn: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  actionText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, gap: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#E8F5EE", alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: "600", color: "#1A2E24" },
  price: { fontSize: 12, color: "#A0ADB8", marginTop: 2 },
  hint: { fontSize: 13, color: "#D0D8D4" },
});

const ec = StyleSheet.create({
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16,
    borderLeftWidth: 3, borderLeftColor: TEAL,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  title: { fontSize: 13, fontWeight: "700", color: TEAL, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: "#E0E8E3", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: "#1A2E24", marginBottom: 8, backgroundColor: "#F7FAF8",
  },
  row: { flexDirection: "row", gap: 8, marginTop: 4 },
  btn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 10, paddingVertical: 11,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
