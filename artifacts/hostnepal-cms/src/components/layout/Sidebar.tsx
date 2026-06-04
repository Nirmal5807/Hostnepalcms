import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Ticket, DollarSign, BellRing, Settings, UserCircle, LogOut } from "lucide-react";
import { removeToken } from "../../lib/auth";

export function Sidebar() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    removeToken();
    setLocation("/login");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Tickets", href: "/tickets", icon: Ticket },
    { name: "Revenue", href: "/revenue", icon: DollarSign },
    { name: "Renewals", href: "/renewals", icon: BellRing },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
            <span className="font-bold text-lg">H</span>
          </div>
          HostNepal
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Admin Control Center</p>
      </div>
      
      <div className="flex-1 py-6 flex flex-col gap-1 px-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
                <Icon size={18} />
                {item.name}
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-border mt-auto">
        <Link href="/profile">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-muted-foreground hover:bg-muted hover:text-foreground">
            <UserCircle size={18} />
            Profile
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors text-red-400 hover:bg-red-400/10 hover:text-red-300 text-left mt-1"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}