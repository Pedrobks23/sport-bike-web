import { Bike, BarChart3, Package, Users, Settings, Receipt, FileText, ShoppingBag } from "lucide-react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";

const items = [
  { to: "/admin", icon: BarChart3, label: "E-commerce" },
  { to: "/admin/users", icon: Users, label: "User" },
  { to: "/admin/product", icon: Package, label: "Product" },
  { to: "/admin/order", icon: ShoppingBag, label: "Order" },
  { to: "/admin/invoice", icon: Receipt, label: "Invoice" },
  { to: "/admin/course", icon: FileText, label: "Course" },
  { to: "/admin/bike", icon: Bike, label: "Bike" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-white/10 bg-white">
      <div className="h-16 flex items-center px-6 border-b">
        <div className="h-8 w-8 rounded-md bg-brand-green"></div>
        <span className="ml-3 font-semibold">Admin</span>
      </div>
      <nav className="flex-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-brand-greenLight/40 text-brand-green"
                    : "text-gray-600 hover:bg-gray-100"
                )
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
