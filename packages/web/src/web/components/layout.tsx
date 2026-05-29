import { Link, useLocation } from "wouter";
import { authClient, clearToken } from "../lib/auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/shops", label: "Shops", icon: "🏪" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#419873" }}>
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <p className="font-bold text-gray-800 leading-tight">Cash Book</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`} style={active ? { background: "#419873" } : {}}>
                  <span>{item.icon}</span>
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "#419873" }}>
              {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="w-full text-sm text-gray-500 hover:text-red-500 text-left transition-colors px-1">
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
