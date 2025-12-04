import { NavLink } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Hammer,
  Home,
  LayoutDashboard,
  Receipt,
  Settings,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Recibos", to: "/admin/receipts", icon: Receipt },
  { label: "Nova OS", to: "/admin/ordens/nova", icon: FileText },
  { label: "Ordens de Serviço", to: "/admin/orders", icon: Wrench },
  { label: "Clientes", to: "/admin/customers", icon: Users },
  { label: "Serviços", to: "/admin/services", icon: Settings },
  { label: "Mecânicos", to: "/admin/mecanicos", icon: UserCog },
  { label: "Home", to: "/admin/home", icon: Home },
  { label: "Relatórios", to: "/admin/reports", icon: BarChart3 },
  { label: "Serviço Rápido", to: "/admin/servico-rapido", icon: Hammer },
];

export default function SidebarNav({ isOpen, onNavigate }: { isOpen: boolean; onNavigate?: () => void }) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-black/5 bg-white/95 p-4 shadow-sm backdrop-blur-xl transition-transform duration-300 dark:border-white/10 dark:bg-neutral-900/90 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex items-center justify-between px-2 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Admin</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Sport & Bike</p>
          </div>
        </div>
      </div>
      <nav className="mt-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isActive
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-200"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-neutral-800"
                }`
              }
              onClick={onNavigate}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg border text-slate-700 transition group-hover:border-amber-300 group-hover:text-amber-700 dark:border-white/10 dark:text-slate-200 dark:group-hover:border-amber-400 ${
                ""
              }`}>
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
