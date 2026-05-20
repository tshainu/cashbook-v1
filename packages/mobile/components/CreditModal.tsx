import { useState } from "react";
import {
  View, Text, Modal, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { X, UserCircle, Phone, CalendarBlank, CheckCircle } from "phosphor-react-native";
import { api } from "../lib/api";

const BLUE = "#3a6eb5";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shopId: string;
  itemId: string;
  amount: string;
}

export default function CreditModal({ visible, onClose, onSuccess, shopId, itemId, amount }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [promiseDate, setPromiseDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!customerName.trim()) { Alert.alert("Error", "Customer name is required."); return; }
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { Alert.alert("Error", "Invalid amount."); return; }
    setLoading(true);
    try {
      const res = await api.transactions.$post({
        json: {
          shopId: Number(shopId), itemId: itemId ? Number(itemId) : null,
          itemName: null, amount: parsed, type: "credit",
          customerName: customerName.trim(),
          customerPhone: phone.trim() || null,
          promiseDate: promiseDate || null,
          note: null,
        } as any,
      });
      if (!res.ok) throw new Error();
      setCustomerName(""); setPhone(""); setPromiseDate("");
      setLoading(false);
      onSuccess();
    } catch {
      setLoading(false);
      Alert.alert("Error", "Failed to save credit transaction.");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.sheet}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Credit Sale</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color="#666" weight="bold" />
            </TouchableOpacity>
          </View>

          {/* Amount badge */}
          <View style={s.amountBadge}>
            <Text style={s.amountLabel}>Amount</Text>
            <Text style={s.amountValue}>Rs. {amount || "0"}</Text>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Customer Name */}
            <Text style={s.label}>Customer Name *</Text>
            <View style={s.inputRow}>
              <UserCircle size={18} color="#B0B8C1" weight="fill" />
              <TextInput
                style={s.input}
                placeholder="Enter customer name"
                placeholderTextColor="#C0C8D0"
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>

            {/* Phone */}
            <Text style={s.label}>Phone Number</Text>
            <View style={s.inputRow}>
              <Phone size={18} color="#B0B8C1" weight="fill" />
              <TextInput
                style={s.input}
                placeholder="Enter phone number"
                placeholderTextColor="#C0C8D0"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            {/* Promise date */}
            <Text style={s.label}>Promise Date</Text>
            <View style={s.inputRow}>
              <CalendarBlank size={18} color="#B0B8C1" weight="fill" />
              <TextInput
                style={s.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#C0C8D0"
                value={promiseDate}
                onChangeText={setPromiseDate}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[s.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><CheckCircle size={18} color="#fff" weight="fill" /><Text style={s.submitText}> Submit Credit</Text></>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: "85%",
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 16,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#1A1F2E" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center",
  },
  amountBadge: {
    backgroundColor: "#EEF3FB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: { fontSize: 13, color: "#6B7A9E", fontWeight: "600" },
  amountValue: { fontSize: 20, fontWeight: "800", color: BLUE },
  label: { fontSize: 12, fontWeight: "600", color: "#8A9099", marginBottom: 6, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E4E8EF", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#FAFBFC", gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#1A1F2E" },
  submitBtn: {
    flexDirection: "row", backgroundColor: BLUE, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
    marginTop: 20,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
