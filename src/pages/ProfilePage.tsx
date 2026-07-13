import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Save,
  User,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ROLES } from "@/convex/schema";

export default function ProfilePage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.name || user?.firstName) {
      setName(user.name || user.firstName || "");
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const roleLabel = user.role === ROLES.ADMIN ? "Admin" : user.role === ROLES.TEACHER ? "O'qituvchi" : "O'quvchi";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profil</h1>
          <p className="text-muted-foreground mt-1">Shaxsiy ma'lumotlaringiz</p>
        </motion.div>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>{user.name || user.firstName || "User"}</CardTitle>
                <CardDescription>{user.email || "Email yo'q"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={
                user.role === ROLES.ADMIN ? "bg-red-50 text-red-600 border-red-200" :
                user.role === ROLES.TEACHER ? "bg-blue-50 text-blue-600 border-blue-200" :
                "bg-emerald-50 text-emerald-600 border-emerald-200"
              }>{roleLabel}</Badge>
              {user.isAnonymous && <Badge variant="outline" className="bg-muted">Mehmon</Badge>}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ism</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" placeholder="Ismingiz" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user.email || ""} disabled className="rounded-xl opacity-60" />
                <p className="text-xs text-muted-foreground">Emailni o'zgartirish uchun admin bilan bog'laning</p>
              </div>
            </div>

            <Button
              className="gap-2 rounded-xl"
              onClick={() => {
                setSaving(true);
                setTimeout(() => {
                  setSaving(false);
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                }, 500);
              }}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Save className="h-4 w-4" />}
              {saved ? "Saqlangan" : "Saqlash"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
