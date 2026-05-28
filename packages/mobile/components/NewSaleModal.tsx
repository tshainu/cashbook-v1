import { useState, useEffect, useRef } from "react";
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, CaretDown, CheckCircle } from "phosphor-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getToken } from "../lib/auth";
import Constants from "expo-constants";
import NumPad from "./NumPad";
import CreditModal from "./CreditModal";

const BASE = Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "";

const TEAL = "#419873";
const BG = "#F7FAF8";

type Item = { id: string; name: string; price: number | null; type: string };

interface Props {
  visible: boolean;
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewSaleModal({ visible, shopId, onClose, onSuccess }: Props) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isFresh = useRef(false);
  const insets = useSafeAreaInsets();

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items", shopId, "sale"],
    queryFn: async () => {
      const res = await api.items.$get({ query: { shopId, type: "sale" } });
      if (!res.ok) throw new Error();
      const d = await res.json() as any;
      return (d.items ?? d).map((i: any) => ({
        id: String(i.id), name: i.name,
        price: i.defaultPrice ?? null, type: i.type,
      }));
    },
    enabled: !!shopId && visible,
  });

  useEffect(() => {
    if (!visible) { setSelectedItem(null); setAmount(""); setPickerOpen(false); isFresh.current = false; }
  }, [visible]);

  // Auto-select first item when items load
  useEffect(() => {
    if (items.length > 0 && !selectedItem) {
      setSelectedItem(items[0]);
    }
  }, [items]);

  useEffect(() => {
    if (selectedItem?.price != null) {
      setAmount(String(selectedItem.price));
      isFresh.current = true;
    } else {
      setAmount("");
      isFresh.current = false;
    }
  }, [selectedItem]);

  function handleKey(key: string) {
    if (key === "*") { setAmount(p => p.slice(0, -1)); isFresh.current = false; return; }
    // First keypress after auto-fill: replace entire amount
    if (isFresh.current) {
      isFresh.current = false;
      if (key === ".") { setAmount("0."); return; }
      setAmount(key);
      return;
    }
    if (key === "." && amount.includes(".")) return;
    setAmount(p => p.length >= 10 ? p : p + key);
  }

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { Alert.alert("Error", "Enter a valid amount."); return; }
    if (!selectedItem) { Alert.alert("Error", "Please select an item."); return; }
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`${BASE}/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          shopId: Number(shopId), itemId: Number(selectedItem.id),
          itemName: selectedItem.name, amount: parsed, type: "sale",
          customerName: null, customerPhone: null, promiseDate: null, note: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || `Server error ${res.status}`);
      }
      setLoading(false);
      onSuccess();
    } catch (e: any) {
      setLoading(false);
      Alert.alert("Error", e?.message || "Failed to save sale.");
    }
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
            {/* Handle */}
            <View style={s.handle} />

            {/* Header */}
            <View style={s.header}>
              <Text style={s.title}>New Sale</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color="#666" weight="bold" />
              </TouchableOpacity>
            </View>

            {/* Picker */}
            <TouchableOpacity
              style={[s.picker, pickerOpen && s.pickerOpen]}
              onPress={() => setPickerOpen(o => !o)}
              activeOpacity={0.8}
            >
              <Text style={[s.pickerText, !selectedItem && s.pickerPlaceholder]}>
                {selectedItem?.name ?? "Select item…"}
              </Text>
              <CaretDown size={16} color={TEAL} weight="bold" style={{ transform: [{ rotate: pickerOpen ? "180deg" : "0deg" }] }} />
            </TouchableOpacity>

            {pickerOpen && (
              <ScrollView style={s.dropdown} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {items.length === 0
                  ? <Text style={s.noItems}>No items — add from Settings</Text>
                  : items.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[s.dropItem, selectedItem?.id === item.id && s.dropItemActive]}
                      onPress={() => { setSelectedItem(item); setPickerOpen(false); }}
                    >
                      <Text style={[s.dropItemText, selectedItem?.id === item.id && { color: TEAL, fontWeight: "700" }]}>
                        {item.name}
                      </Text>
                      {item.price != null && (
                        <Text style={s.dropItemPrice}>Rs. {item.price}</Text>
                      )}
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            )}

            {/* Amount */}
            <View style={s.amountBox}>
              <Text style={s.amountCurrency}>Rs.</Text>
              <Text style={s.amountValue}>{amount || "0"}</Text>
            </View>

            {/* NumPad */}
            <NumPad onKey={handleKey} accentColor={TEAL} />

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity
                style={[s.btn, s.btnPrimary, loading && s.btnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><CheckCircle size={18} color="#fff" weight="fill" /><Text style={s.btnText}> Submit</Text></>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, s.btnCredit]}
                onPress={() => setShowCredit(true)}
              >
                <Text style={s.btnText}>Credit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CreditModal
        visible={showCredit}
        shopId={shopId}
        itemId={selectedItem?.id ?? ""}
        amount={amount}
        onClose={() => setShowCredit(false)}
        onSuccess={() => { setShowCredit(false); onSuccess(); }}
      />
    </>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 16,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#1a2e22" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F2F4F3", alignItems: "center", justifyContent: "center",
  },
  picker: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E0E8E3", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: BG, marginBottom: 8,
  },
  pickerOpen: { borderColor: TEAL },
  pickerText: { fontSize: 15, color: "#1a2e22", fontWeight: "500" },
  pickerPlaceholder: { color: "#B0BDB6" },
  dropdown: {
    borderWidth: 1.5, borderColor: "#E0E8E3", borderRadius: 12,
    maxHeight: 150, backgroundColor: "#fff", marginBottom: 8,
  },
  dropItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderColor: "#F2F4F3",
  },
  dropItemActive: { backgroundColor: "#F0FAF5" },
  dropItemText: { fontSize: 14, color: "#333" },
  dropItemPrice: { fontSize: 13, color: TEAL, fontWeight: "600" },
  noItems: { padding: 14, color: "#B0BDB6", textAlign: "center", fontSize: 13 },
  amountBox: {
    flexDirection: "row", alignItems: "baseline",
    backgroundColor: BG, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "#E0E8E3", marginBottom: 4,
    justifyContent: "flex-end",
  },
  amountCurrency: { fontSize: 18, fontWeight: "600", color: "#6B8C7A", marginRight: 6 },
  amountValue: { fontSize: 34, fontWeight: "800", color: "#1a2e22" },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  btn: {
    flex: 1, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", justifyContent: "center", flexDirection: "row",
  },
  btnPrimary: { backgroundColor: TEAL },
  btnCredit: { backgroundColor: "#3a6eb5" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
