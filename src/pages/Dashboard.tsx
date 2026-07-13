import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import logo from "@/assets/logo.svg";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  PlusCircle,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { ROLES } from "@/convex/schema";
import NotificationsBell from "@/components/NotificationsBell";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeInOut" as const },
  },
};

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-border/50 hover:shadow-md hover:border-primary/20 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const navigate = useNavigate();

  const myCourses = useQuery(api.courses.myCourses);
  const enrolledCourses = useQuery(api.courses.myEnrolledCourses);
  const publishedCourses = useQuery(api.courses.listPublished);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
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

  const isTeacher =
    user.role === ROLES.TEACHER || user.role === ROLES.ADMIN;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30"
    >
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2.5 group"
              >
                <img
                  src={logo}
                  alt="O'quv Markazi"
                  width={32}
                  height={32}
                  className="rounded-lg transition-transform duration-300 group-hover:rotate-3"
                />
                <span className="font-semibold hidden sm:block">
                  O'quv Markazi
                </span>
              </button>

              <div className="hidden md:flex items-center gap-1 ml-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground gap-2"
                  onClick={() => navigate("/dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                {isTeacher && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate("/teacher")}
                  >
                    <GraduationCap className="h-4 w-4" />
                    O'qituvchi
                  </Button>
                )}
                {user.role === ROLES.ADMIN && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => navigate("/admin")}
                  >
                    Admin
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>
                  {user.name || user.firstName || "User"}
                </span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {user.role === ROLES.ADMIN
                    ? "Admin"
                    : user.role === ROLES.TEACHER
                      ? "O'qituvchi"
                      : "O'quvchi"}
                </span>
              </div>
              <NotificationsBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome */}
          <motion.div variants={itemVariants}>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Xush kelibsiz, {user.name || user.firstName || "User"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isTeacher
                ? "Kurslaringizni boshqaring va o'quvchilaringizning progressini kuzating"
                : "Kurslaringizni davom ettiring va bilim oling"}
            </p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {isTeacher ? (
              <>
                <StatCard
                  icon={BookOpen}
                  label="Mening kurslarim"
                  value={myCourses?.length || 0}
                  trend="Jami kurslar"
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={Users}
                  label="O'quvchilar"
                  value={
                    myCourses?.reduce(
                      (acc, c) => acc + (c.enrollmentCount || 0),
                      0,
                    ) || 0
                  }
                  trend="Faol o'quvchilar"
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatCard
                  icon={FileText}
                  label="Nashr etilgan"
                  value={
                    myCourses?.filter((c) => c.status === "published")
                      .length || 0
                  }
                  color="bg-gradient-to-br from-amber-500 to-amber-600"
                />
                <StatCard
                  icon={TrendingUp}
                  label="Qoralama"
                  value={
                    myCourses?.filter((c) => c.status === "draft").length || 0
                  }
                  color="bg-gradient-to-br from-violet-500 to-violet-600"
                />
              </>
            ) : (
              <>
                <StatCard
                  icon={BookOpen}
                  label="Mening kurslarim"
                  value={enrolledCourses?.length || 0}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={Clock}
                  label="Davom etilmoqda"
                  value={enrolledCourses?.length || 0}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatCard
                  icon={LineChart}
                  label="O'rtacha natija"
                  value="—"
                  color="bg-gradient-to-br from-amber-500 to-amber-600"
                />
                <StatCard
                  icon={GraduationCap}
                  label="Barcha kurslar"
                  value={publishedCourses?.length || 0}
                  color="bg-gradient-to-br from-violet-500 to-violet-600"
                />
              </>
            )}
          </div>

          {/* Teacher: My Courses */}
          {isTeacher && (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Mening kurslarim
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Barcha kurslaringiz ro'yxati
                  </p>
                </div>
                <Button className="gap-2 rounded-xl" size="sm">
                  <PlusCircle className="h-4 w-4" />
                  Yangi kurs
                </Button>
              </div>

              {!myCourses || myCourses.length === 0 ? (
                <Card className="border-dashed border-2 border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Hali kurslar yo'q</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Birinchi kursingizni yarating
                    </p>
                    <Button size="sm" className="gap-2 rounded-lg">
                      <PlusCircle className="h-4 w-4" />
                      Kurs yaratish
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myCourses.map((course) => (
                    <motion.div
                      key={course._id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group h-full"
                        onClick={() => navigate(`/teacher/courses/${course._id}/edit`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base">
                                {course.title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {course.moduleCount} ta modul
                                {course.enrollmentCount
                                  ? ` · ${course.enrollmentCount} ta o'quvchi`
                                  : ""}
                              </CardDescription>
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                course.status === "published"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                                  : course.status === "draft"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                                    : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              {course.status === "published"
                                ? "Nashr etilgan"
                                : course.status === "draft"
                                  ? "Qoralama"
                                  : "Arxivlangan"}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {course.description?.slice(0, 60) || "Tavsif yo'q"}
                          </p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Student: Enrolled Courses */}
          {!isTeacher && (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Mening kurslarim
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Siz yozilgan kurslar
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={() => navigate("/")}
                >
                  <BookOpen className="h-4 w-4" />
                  Barcha kurslar
                </Button>
              </div>

              {!enrolledCourses || enrolledCourses.length === 0 ? (
                <Card className="border-dashed border-2 border-border/50">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <GraduationCap className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">
                      Hali hech qanday kursga yozilmagansiz
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                      Kurslarni ko'rib chiqing va o'qishni boshlang
                    </p>
                    <Button
                      size="sm"
                      className="gap-2 rounded-lg"
                      onClick={() => navigate("/")}
                    >
                      <BookOpen className="h-4 w-4" />
                      Kurslarni ko'rish
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledCourses.map((enrollment) => {
                    if (!enrollment) return null;
                    return (
                      <motion.div
                        key={enrollment.course._id}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group h-full"
                          onClick={() => navigate(`/learn/${enrollment.course.slug}`)}
                        >
                          <CardHeader>
                            <CardTitle className="text-base">
                              {enrollment.course.title}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {enrollment.course.teacherName} ·{" "}
                              {enrollment.course.moduleCount} ta modul
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(
                                enrollment.enrollment.enrolledAt,
                              ).toLocaleDateString("uz-UZ", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Certificates section for students */}
          {!isTeacher && (
            <motion.div variants={itemVariants}>
              <Card
                className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20"
                onClick={() => navigate("/certificates")}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium">Sertifikatlarim</p>
                      <p className="text-xs text-muted-foreground">
                        Kurslarni tugatganingiz uchun olingan sertifikatlar
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Public courses */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Ommabop kurslar
                </h2>
                <p className="text-sm text-muted-foreground">
                  Eng ko'p o'qilayotgan kurslar
                </p>
              </div>
            </div>

            {!publishedCourses || publishedCourses.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Hali nashr etilgan kurslar yo'q
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publishedCourses.slice(0, 6).map((course) => (
                  <motion.div
                    key={course._id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group h-full"
                      onClick={() => navigate(`/courses/${course.slug}`)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {course.teacherName} · {course.moduleCount} ta modul
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {course.description || "Tavsif yo'q"}
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 O'quv Markazi
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              freebuff.com
            </a>
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
