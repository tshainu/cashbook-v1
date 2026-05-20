import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "*"];

interface NumPadProps {
  onKey: (key: string) => void;
  accentColor?: string;
}

export default function NumPad({ onKey, accentColor = "#419873" }: NumPadProps) {
  return (
    <View style={styles.grid}>
      {KEYS.map((k) => (
        <TouchableOpacity
          key={k}
          style={[styles.key, k === "*" && { backgroundColor: accentColor }]}
          onPress={() => onKey(k)}
          activeOpacity={0.65}
        >
          <Text style={[styles.keyText, k === "*" && { color: "#fff" }]}>
            {k === "*" ? "⌫" : k}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginVertical: 10,
  },
  key: {
    width: "30%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f2f4f3",
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontSize: 22, fontWeight: "600", color: "#1a2e22" },
});
