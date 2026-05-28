import { useState } from "react";
import {
  View, Text, Modal, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from "react-native";
import { X, UserCircle, Phone, CalendarBlank, CheckCircle, CaretUp, CaretDown } from "phosphor-react-native";
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const now = new Date();
  const parsed = value ? new Date(value) : now;
  const [day, setDay] = useState(parsed.getDate());
  const [month, setMonth] = useState(parsed.getMonth() + 1);
  const [year, setYear] = useState(parsed.getFullYear());

  function emit(d: number, m: number, y: number) {
    onChange(`${y}-${pad(m)}-${pad(d)}`);
  }

  function changeDay(delta: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const next = ((day - 1 + delta + daysInMonth) % daysInMonth) + 1;
    setDay(next); emit(next, month, year);
  }
  function changeMonth(delta: number) {
    const next = ((month - 1 + delta + 12) % 12) + 1;
    setMonth(next); emit(day, next, year);
  }
  function changeYear(delta: number) {
    const next = Math.max(now.getFullYear(), Math.min(now.getFullYear() + 5, year + delta));
    setYear(next); emit(day, month, next);
  }

  const col = (label: string, val: string, onUp: () => void, onDown: () => void) => (
    <View style={dp.col}>
      <TouchableOpacity onPress={onUp} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <CaretUp size={18} color={BLUE} weight="bold" />
      </TouchableOpacity>
      <View style={dp.valBox}>
        <Text style={dp.val}>{val}</Text>
        <Text style={dp.colLabel}>{label}</Text>
      </View>
      <TouchableOpacity onPress={onDown} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <CaretDown size={18} color={BLUE} weight="bold" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={dp.container}>
      {col("Day", pad(day), () => changeDay(1), () => changeDay(-1))}
      <Text style={dp.sep}>/</Text>
      {col("Month", MONTHS[month - 1], () => changeMonth(1), () => changeMonth(-1))}
      <Text style={dp.sep}>/</Text>
      {col("Year", String(year), () => changeYear(1), () => changeYear(-1))}
    </View>
  );
}

const dp = StyleSheet.create({
  container: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "#D0D8E8", borderRadius: 12,
    backgroundColor: "#F3F6FB", paddingVertical: 12, paddingHorizontal: 8,
    gap: 4,
  },
  col: { alignItems: "center", flex: 1, gap: 6 },
  valBox: { alignItems: "center" },
  val: { fontSize: 20, fontWeight: "800", color: "#1A1F2E" },
  colLabel: { fontSize: 10, color: "#8A9099", fontWeight: "600", textTransform: "uppercase", marginTop: 2 },
  sep: { fontSize: 22, fontWeight: "800", color: "#C0C8D8", marginBottom: 12 },
});

export default function CreditModal({ visible, onClose, onSuccess, shopId, itemId, amount }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [hasDate, setHasDate] = useState(false);
  const [promiseDate, setPromiseDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  });
  const [loading, setLoading] = useState(false);

  function reset() {
    setCustomerName(""); setPhone(""); setHasDate(false);
    const d = new Date(); d.setDate(d.getDate() + 7);
    setPromiseDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
  }

  async function handleSubmit() {
    if (!customerName.trim()) { Alert.alert("Error", "Customer name is required."); return; }
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { Alert.alert("Error", "Invalid amount."); return; }
    setLoading(true);
    try {
      const res = await api.transactions.$post({
        json: {
          shopId: Number(shopId),
          itemId: itemId ? Number(itemId) : null,
          itemName: "Credit Sale",
          amount: parsed,
          type: "credit",
          customerName: customerName.trim(),
          customerPhone: phone.trim() || null,
          promiseDate: hasDate ? promiseDate : null,
          note: null,
        } as any,
      });
      if (!res.ok) throw new Error();
      reset();
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

            {/* Promise date toggle + picker */}
            <View style={s.dateHeader}>
              <View style={s.labelRow}>
                <CalendarBlank size={14} color="#8A9099" weight="fill" />
                <Text style={s.label}>Promise Date</Text>
              </View>
              <TouchableOpacity
                style={[s.toggle, hasDate && s.toggleOn]}
                onPress={() => setHasDate(v => !v)}
              >
                <Text style={[s.toggleText, hasDate && s.toggleTextOn]}>
                  {hasDate ? "On" : "Off"}
                </Text>
              </TouchableOpacity>
            </View>

            {hasDate && (
              <DatePicker value={promiseDate} onChange={setPromiseDate} />
            )}

            <View style={{ height: 16 }} />
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
    backgroundColor: "#EEF3FB", borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 20, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
  },
  amountLabel: { fontSize: 13, color: "#6B7A9E", fontWeight: "600" },
  amountValue: { fontSize: 20, fontWeight: "800", color: BLUE },
  label: {
    fontSize: 12, fontWeight: "600", color: "#8A9099",
    marginBottom: 6, marginTop: 14,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E4E8EF", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#FAFBFC", gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#1A1F2E" },
  dateHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginTop: 14,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  toggle: {
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: "#D0D8E8", backgroundColor: "#F3F6FB",
  },
  toggleOn: { borderColor: BLUE, backgroundColor: "#EEF3FB" },
  toggleText: { fontSize: 12, fontWeight: "700", color: "#B0B8C8" },
  toggleTextOn: { color: BLUE },
  submitBtn: {
    flexDirection: "row", backgroundColor: BLUE, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
    marginTop: 16,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
