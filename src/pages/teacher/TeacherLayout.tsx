import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Import,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  PlusCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import NotificationsBell from "@/components/NotificationsBell";

export default function TeacherLayout() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { path: "/teacher/courses", label: "Kurslarim", icon: BookOpen },
    { path: "/teacher/analytics", label: "Statistika", icon: LineChart },
    { path: "/teacher/submissions", label: "Baholash", icon: ClipboardCheck },
    { path: "/teacher/import", label: "Import", icon: Import },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/teacher/courses")) return "Kurslar";
    if (path.startsWith("/teacher/analytics")) return "Statistika";
    if (path.startsWith("/teacher/submissions")) return "Baholash";
    if (path.startsWith("/teacher/import")) return "Import";
    return "O'qituvchi paneli";
  };

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 border-r border-border/50 bg-card/95 backdrop-blur-xl transform transition-transform duration-300 md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border/50">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2.5 group">
              <img src={logo} alt="" width={28} height={28} className="rounded-lg transition-transform duration-300 group-hover:rotate-3" />
              <span className="font-semibold text-sm">O'quv Markazi</span>
            </button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center justify-between gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                location.pathname.startsWith(item.path) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" /> {item.label}
                </div>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ))}
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tezkor</p>
            </div>
            <button onClick={() => navigate("/teacher/courses")} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground transition-colors">
              <PlusCircle className="h-4 w-4" /> Yangi kurs yaratish
            </button>
          </nav>

          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.firstName || "User"}</p>
                <p className="text-xs text-muted-foreground">O'qituvchi</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">{getPageTitle()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationsBell />
              <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => navigate("/dashboard")}>
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Button>
            </div>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
