import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";

const lessonTypeIcons: Record<string, React.ElementType> = {
  text: FileText,
  video: Video,
  file: BookOpen,
  quiz: HelpCircle,
};

export default function StudentLearningLayout() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { courseSlug } = useParams<{ courseSlug: string }>();

  const course = useQuery(api.courses.getBySlug, { slug: courseSlug || "" });
  const progress = useQuery(
    api.lessons.getProgress,
    course?._id ? { courseId: course._id as Id<"courses"> } : "skip",
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Calculate progress
  const progressPercent = useMemo(() => {
    if (!progress || progress.length === 0) return 0;
    const completed = progress.filter((p) => p.completed).length;
    return Math.round((completed / progress.length) * 100);
  }, [progress]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate("/auth");
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (course?.modules) {
      setExpandedModules(course.modules.map((m) => m._id));
    }
  }, [course]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>;
  }

  if (!user) return null;

  const currentLessonId = location.pathname.split("/").pop();
  const isLessonCompleted = (lessonId: string) =>
    progress?.some((p) => p.lessonId === lessonId && p.completed) ?? false;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 border-r border-border/50 bg-card/95 backdrop-blur-xl transform transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-border/50">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2.5 group">
              <img src={logo} alt="" width={28} height={28} className="rounded-lg transition-transform duration-300 group-hover:rotate-3" />
              <span className="font-semibold text-sm truncate">{course?.title || "Kurs"}</span>
            </button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-3 border-b border-border/30">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>

          {/* Course content */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="flex items-center gap-2 mb-4 px-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kurs tuzilishi</span>
            </div>

            {course?.modules?.map((module) => (
              <div key={module._id} className="mb-3">
                <button
                  onClick={() => setExpandedModules((prev) =>
                    prev.includes(module._id) ? prev.filter((id) => id !== module._id) : [...prev, module._id]
                  )}
                  className="flex items-center gap-2 w-full px-2 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${
                    expandedModules.includes(module._id) ? "rotate-90" : ""
                  }`} />
                  <span className="truncate">{module.title}</span>
                </button>

                {expandedModules.includes(module._id) && (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {module.lessons?.map((lesson) => {
                      const Icon = lessonTypeIcons[lesson.type] || FileText;
                      const completed = isLessonCompleted(lesson._id);
                      const isActive = lesson._id === currentLessonId;

                      return (
                        <Link
                          key={lesson._id}
                          to={`/learn/${courseSlug}/${lesson._id}`}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${
                            isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
                            {completed ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Icon className="h-3.5 w-3.5" />}
                          </div>
                          <span className="truncate flex-1">{lesson.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="border-t border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.firstName || "User"}</p>
                <p className="text-xs text-muted-foreground">O'quvchi</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }} className="text-muted-foreground hover:text-foreground shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => navigate("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground">{course?.title}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
            </Button>
          </div>
        </header>

        <main>
          <Outlet context={{ course, progress }} />
        </main>
      </div>
    </div>
  );
}
