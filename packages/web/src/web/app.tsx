import { Route, Switch, Redirect } from "wouter";
import { authClient } from "./lib/auth";
import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import ShopsPage from "./pages/shops";
import StaffPage from "./pages/staff";
import ItemsPage from "./pages/items";
import Layout from "./components/layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#419873] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!session) return <Redirect to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/shops">
        <ProtectedRoute>
          <Layout>
            <ShopsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/staff">
        <ProtectedRoute>
          <Layout>
            <StaffPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/items">
        <ProtectedRoute>
          <Layout>
            <ItemsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
