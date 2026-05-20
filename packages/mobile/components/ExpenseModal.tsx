import { useState, useEffect } from "react";
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { X, CaretDown, CheckCircle } from "phosphor-react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import NumPad from "./NumPad";

const RED = "#E03A2A";
const BG = "#FDF7F6";

type Item = { id: string; name: string; price: number | null; type: string };

interface Props {
  visible: boolean;
  shopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExpenseModal({ visible, shopId, onClose, onSuccess }: Props) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["items", shopId, "expense"],
    queryFn: async () => {
      const res = await api.items.$get({ query: { shopId, type: "expense" } });
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
    if (!visible) { setSelectedItem(null); setAmount(""); setPickerOpen(false); }
  }, [visible]);

  function handleKey(key: string) {
    if (key === "*") { setAmount(p => p.slice(0, -1)); return; }
    if (key === "." && amount.includes(".")) return;
    setAmount(p => p.length >= 10 ? p : p + key);
  }

  async function handleSubmit() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { Alert.alert("Error", "Enter a valid amount."); return; }
    if (!selectedItem) { Alert.alert("Error", "Please select a category."); return; }
    setLoading(true);
    try {
      const res = await api.transactions.$post({
        json: {
          shopId: Number(shopId), itemId: Number(selectedItem.id),
          itemName: selectedItem.name, amount: parsed, type: "expense",
          customerName: null, customerPhone: null, promiseDate: null, note: null,
        } as any,
      });
      if (!res.ok) throw new Error();
      setLoading(false);
      onSuccess();
    } catch {
      setLoading(false);
      Alert.alert("Error", "Failed to save expense.");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Add Expense</Text>
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
              {selectedItem?.name ?? "Select category…"}
            </Text>
            <CaretDown size={16} color={RED} weight="bold" />
          </TouchableOpacity>

          {pickerOpen && (
            <ScrollView style={s.dropdown} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {items.length === 0
                ? <Text style={s.noItems}>No categories — add from Settings</Text>
                : items.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.dropItem, selectedItem?.id === item.id && s.dropItemActive]}
                    onPress={() => { setSelectedItem(item); setPickerOpen(false); }}
                  >
                    <Text style={[s.dropItemText, selectedItem?.id === item.id && { color: RED, fontWeight: "700" }]}>
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
          <NumPad onKey={handleKey} accentColor={RED} />

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, loading && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><CheckCircle size={18} color="#fff" weight="fill" /><Text style={s.submitText}> Submit Expense</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
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
  title: { fontSize: 18, fontWeight: "800", color: "#2E1A18" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#FDF0EE", alignItems: "center", justifyContent: "center",
  },
  picker: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderWidth: 1.5, borderColor: "#F0D8D5", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: BG, marginBottom: 8,
  },
  pickerOpen: { borderColor: RED },
  pickerText: { fontSize: 15, color: "#2E1A18", fontWeight: "500" },
  pickerPlaceholder: { color: "#C0A8A5" },
  dropdown: {
    borderWidth: 1.5, borderColor: "#F0D8D5", borderRadius: 12,
    maxHeight: 150, backgroundColor: "#fff", marginBottom: 8,
  },
  dropItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderColor: "#FBF0EE",
  },
  dropItemActive: { backgroundColor: "#FEF4F3" },
  dropItemText: { fontSize: 14, color: "#333" },
  dropItemPrice: { fontSize: 13, color: RED, fontWeight: "600" },
  noItems: { padding: 14, color: "#C0A8A5", textAlign: "center", fontSize: 13 },
  amountBox: {
    flexDirection: "row", alignItems: "baseline",
    backgroundColor: BG, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: "#F0D8D5", marginBottom: 4,
    justifyContent: "flex-end",
  },
  amountCurrency: { fontSize: 18, fontWeight: "600", color: "#C0706A", marginRight: 6 },
  amountValue: { fontSize: 34, fontWeight: "800", color: "#2E1A18" },
  submitBtn: {
    flexDirection: "row", backgroundColor: RED, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
    marginTop: 14,
  },
  btnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
