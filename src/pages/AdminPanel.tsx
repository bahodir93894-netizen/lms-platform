import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Loader2,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  Users,
  UserX,
  LayoutDashboard,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ROLES } from "@/convex/schema";
import logo from "@/assets/logo.svg";

const roleColors: Record<string, string> = {
  admin: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  teacher: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  student: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  unassigned: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  teacher: "O'qituvchi",
  student: "O'quvchi",
  unassigned: "Belgilanmagan",
};

export default function AdminPanel() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const stats = useQuery(api.analytics.getPlatformStats);
  const allUsers = useQuery(api.analytics.listAllUsers);
  const allCourses = useQuery(api.analytics.listAllCourses);
  const updateRole = useMutation(api.analytics.updateUserRole);
  const removeUser = useMutation(api.analytics.removeUser);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleDialog, setRoleDialog] = useState<{ userId: string; currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "users" | "courses">("overview");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleUpdateRole = async () => {
    if (!roleDialog || !newRole) return;
    setIsUpdating(true);
    try {
      await updateRole({
        userId: roleDialog.userId as Id<"users">,
        role: newRole as any,
      });
      setRoleDialog(null);
      setNewRole("");
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    try {
      await removeUser({ userId: deleteConfirm as Id<"users"> });
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>;
  }

  if (!user || user.role !== ROLES.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-sm">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">Siz admin emassiz</p>
            <p className="text-sm text-muted-foreground mt-1">
              Bu sahifa faqat adminlar uchun
            </p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")}>
              Dashboardga qaytish
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = allUsers?.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group">
                <img src={logo} alt="" width={28} height={28} className="rounded-lg" />
                <span className="font-semibold hidden sm:block">O'quv Markazi</span>
              </button>
              <div className="hidden md:flex items-center gap-1 ml-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Admin</Badge>
              <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin paneli</h1>
          <p className="text-muted-foreground mt-1">Platformani boshqarish va monitoring</p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-border/50 pb-2">
          {(["overview", "users", "courses"] as const).map((t) => (
            <Button
              key={t}
              variant={tab === t ? "secondary" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => setTab(t)}
            >
              {t === "overview" && "Umumiy"}
              {t === "users" && "Foydalanuvchilar"}
              {t === "courses" && "Kurslar"}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Jami foydalanuvchilar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">O'qituvchilar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.teachers || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">O'quvchilar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.students || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Kurslar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalCourses || 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Nashr etilgan kurslar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats?.publishedCourses || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Yozilishlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats?.totalEnrollments || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">O'rtacha test natijasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats?.avgScore || 0}%</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Foydalanuvchilarni qidirish..."
                className="pl-10 rounded-xl max-w-sm"
              />
            </div>

            <Card className="border-border/50">
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {filteredUsers?.map((u) => (
                    <div key={u._id} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name || "No name"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${roleColors[u.role] || roleColors.unassigned}`}>
                          {roleLabels[u.role] || roleLabels.unassigned}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => {
                            setRoleDialog({ userId: u._id, currentRole: u.role });
                            setNewRole(u.role);
                          }}
                        >
                          Rolni o'zgartirish
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirm(u._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Courses Tab */}
        {tab === "courses" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCourses?.map((course) => (
                <Card key={course._id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      <Badge variant="outline" className={`text-xs ${
                        course.status === "published"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {course.status === "published" ? "Nashr" : "Qoralama"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {course.teacherName} · {course.enrollmentCount} o'quvchi
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Role Dialog */}
      <Dialog open={!!roleDialog} onOpenChange={(o) => !o && setRoleDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rolni o'zgartirish</DialogTitle>
            <DialogDescription>Foydalanuvchi rolini tanlang</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">O'qituvchi</SelectItem>
                <SelectItem value="student">O'quvchi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog(null)}>Bekor qilish</Button>
            <Button onClick={handleUpdateRole} disabled={isUpdating}>
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Foydalanuvchini o'chirish</DialogTitle>
            <DialogDescription>Bu amalni qaytarib bo'lmaydi</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Bekor qilish</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
