import { Redirect } from "expo-router";
import { getToken } from "../lib/auth";

export default function Index() {
  const token = getToken();
  return token ? <Redirect href="/(tabs)" /> : <Redirect href="/sign-in" />;
}
