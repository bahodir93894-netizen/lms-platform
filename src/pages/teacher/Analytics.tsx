import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  FileText,
  GraduationCap,
  LineChart,
  Loader2,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/convex/schema";
import { useEffect, useState } from "react";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-border/50 hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function TeacherAnalytics() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const myCourses = useQuery(api.courses.myCourses);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const courseStats = useQuery(
    api.analytics.getCourseStats,
    selectedCourse ? { courseId: selectedCourse as Id<"courses"> } : "skip",
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalStudents = myCourses?.reduce(
    (acc, c) => acc + (c.enrollmentCount || 0),
    0,
  ) || 0;

  const totalCourses = myCourses?.length || 0;
  const publishedCount = myCourses?.filter((c) => c.status === "published").length || 0;
  const draftCount = myCourses?.filter((c) => c.status === "draft").length || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Statistika
        </h1>
        <p className="text-muted-foreground mt-1">
          Kurslaringiz va o'quvchilaringiz haqida batafsil ma'lumot
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          label="Jami kurslar"
          value={totalCourses}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          subtitle={`${publishedCount} nashr · ${draftCount} qoralama`}
        />
        <StatCard
          icon={Users}
          label="O'quvchilar"
          value={totalStudents}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          subtitle="Barcha kurslar bo'yicha"
        />
        <StatCard
          icon={GraduationCap}
          label="Nashr etilgan"
          value={publishedCount}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <StatCard
          icon={LineChart}
          label="Faollik"
          value={totalCourses > 0 ? "Faol" : "—"}
          color="bg-gradient-to-br from-violet-500 to-violet-600"
        />
      </div>

      {/* Course selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Kurslar bo'yicha statistika
        </h2>

        {!selectedCourse ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses?.map((course) => (
              <motion.div
                key={course._id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer"
                  onClick={() => setSelectedCourse(course._id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          course.status === "published"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {course.status === "published" ? "Nashr" : "Qoralama"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {course.enrollmentCount || 0} o'quvchi · {course.moduleCount} modul
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Statistikani ko'rish</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {(!myCourses || myCourses.length === 0) && (
              <Card className="border-dashed border-2 border-border/50 col-span-full">
                <CardContent className="py-12 text-center">
                  <LineChart className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Hali kurslar yo'q</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setSelectedCourse(null)}
            >
              <ArrowLeft className="h-4 w-4" />
              Barcha kurslar
            </Button>

            {courseStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Users}
                  label="O'quvchilar"
                  value={courseStats.enrollmentCount}
                  color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard
                  icon={BookOpen}
                  label="Modullar"
                  value={courseStats.moduleCount}
                  color="bg-gradient-to-br from-emerald-500 to-emerald-600"
                />
                <StatCard
                  icon={FileText}
                  label="Darslar"
                  value={courseStats.lessonCount}
                  color="bg-gradient-to-br from-amber-500 to-amber-600"
                />
                <StatCard
                  icon={Trophy}
                  label="Test urinishlari"
                  value={courseStats.totalAttempts}
                  color="bg-gradient-to-br from-violet-500 to-violet-600"
                  subtitle={courseStats.avgScore > 0 ? `O'rtacha: ${courseStats.avgScore}%` : undefined}
                />
              </div>
            )}

            {/* Insights card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/0 border-primary/10">
              <CardContent className="py-6 space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Tahliliy ma'lumotlar
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-xl bg-background/50">
                    <p className="text-muted-foreground">O'rtacha o'quvchilar soni</p>
                    <p className="text-lg font-semibold">
                      {courseStats && courseStats.moduleCount > 0
                        ? Math.round(courseStats.enrollmentCount / courseStats.moduleCount)
                        : 0}{" "}
                      <span className="text-sm text-muted-foreground font-normal">/ modul</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-background/50">
                    <p className="text-muted-foreground">Test topshirish foizi</p>
                    <p className="text-lg font-semibold">
                      {courseStats && courseStats.enrollmentCount > 0
                        ? Math.round((courseStats.totalAttempts / Math.max(courseStats.enrollmentCount, 1)) * 10)
                        : 0}
                      <span className="text-sm text-muted-foreground font-normal">%</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
