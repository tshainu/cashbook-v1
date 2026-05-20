import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  Modal,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Eye, EyeSlash, Storefront, User, Lock } from "phosphor-react-native";
import { setToken, storeUser } from "../lib/auth";

const baseUrl =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

const { width: SW } = Dimensions.get("window");

export default function SignIn() {
  const router = useRouter();
  const [shopId, setShopId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleLogin() {
    if (!shopId.trim() || !username.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopCode: shopId.trim(),
          username: username.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Login Failed", data.message ?? data.error ?? "Invalid credentials.");
        return;
      }
      setToken(data.token);
      storeUser(data.user);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Could not connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo image */}
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Login heading */}
        <Text style={styles.loginHeading}>Login</Text>

        {/* Shop ID */}
        <View style={styles.inputWrap}>
          <View style={styles.iconWrap}>
            <Storefront size={20} color="#888" weight="fill" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Shop ID"
            placeholderTextColor="#bbb"
            value={shopId}
            onChangeText={setShopId}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Username */}
        <View style={styles.inputWrap}>
          <View style={styles.iconWrap}>
            <User size={20} color="#888" weight="fill" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#bbb"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrap}>
          <View style={styles.iconWrap}>
            <Lock size={20} color="#888" weight="fill" />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#bbb"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCorrect={false}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <Eye size={20} color="#aaa" />
            ) : (
              <EyeSlash size={20} color="#aaa" />
            )}
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.75 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginBtnText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Forget password */}
        <TouchableOpacity style={styles.forgotWrap} activeOpacity={0.7} onPress={() => setShowForgot(true)}>
          <Text style={styles.forgotText}>Forget password</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Forgot password modal */}
      <Modal visible={showForgot} transparent animationType="fade" onRequestClose={() => setShowForgot(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Lock size={26} color="#419873" weight="fill" />
            </View>
            <Text style={styles.modalTitle}>Forgot Password?</Text>
            <Text style={styles.modalBody}>
              Please contact your administrator to reset your password.{"\n\n"}
              Call us at{"\n"}
              <Text style={styles.modalPhone}>+94 76 161 9596</Text>
            </Text>
            <TouchableOpacity
              style={styles.modalCallBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL("tel:+94761619596")}
            >
              <Text style={styles.modalCallText}>📞  Call Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowForgot(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SW * 0.08,
    paddingVertical: 48,
    backgroundColor: "#fff",
  },

  logo: {
    width: SW * 0.65,
    height: SW * 0.38,
    marginBottom: 28,
  },

  loginHeading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 20,
    alignSelf: "center",
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 22,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginBottom: 10,
    width: "100%",
    height: 42,
  },
  iconWrap: {
    marginRight: 8,
    width: 20,
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: "#222",
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },

  loginBtn: {
    backgroundColor: "#419873",
    borderRadius: 22,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 6,
    shadowColor: "#419873",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  forgotWrap: { marginTop: 14 },
  forgotText: {
    color: "#555",
    fontSize: 13,
  },

  // Forgot password modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e8f5ee",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  modalPhone: {
    color: "#419873",
    fontWeight: "700",
  },
  modalCallBtn: {
    backgroundColor: "#419873",
    borderRadius: 22,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
    shadowColor: "#419873",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCallText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  modalCancelBtn: {
    paddingVertical: 10,
  },
  modalCancelText: {
    color: "#999",
    fontSize: 13,
  },
});
