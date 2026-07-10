import { Route, Switch, Redirect } from "wouter";
import { authClient } from "./lib/auth";
import LoginPage from "./pages/login";
import DashboardPage from "./pages/dashboard";
import ShopsPage from "./pages/shops";
import StaffPage from "./pages/staff";
import ItemsPage from "./pages/items";
import SettingsPage from "./pages/settings";
import Layout from "./components/layout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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
      <Route path="/settings">
        <ProtectedRoute>
          <Layout>
            <SettingsPage />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
