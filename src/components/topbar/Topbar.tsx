import { Bell, Globe, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-16 w-full border-b border-white/10 bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">Team 1</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Free</span>
        </div>

        <div className="relative hidden sm:block w-1/2 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="Search"
            className="w-full rounded-full border bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-full p-2 hover:bg-gray-100" aria-label="Language">
            <Globe size={18} />
          </button>
          <button className="relative rounded-full p-2 hover:bg-gray-100" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-green text-[10px] text-white">1</span>
          </button>
          <img
            src="https://i.pravatar.cc/48?img=5"
            className="h-8 w-8 rounded-full"
            alt="avatar"
          />
        </div>
      </div>
    </header>
  );
}
