import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface State { hasError: boolean; error?: string; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(e: any): State {
    return { hasError: true, error: e?.message ?? String(e) };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.msg}>{this.state.error}</Text>
          <TouchableOpacity style={s.btn} onPress={() => this.setState({ hasError: false })}>
            <Text style={s.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "800", color: "#1a2e22", marginBottom: 12 },
  msg: { fontSize: 13, color: "#888", textAlign: "center", marginBottom: 24 },
  btn: { backgroundColor: "#419873", borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
