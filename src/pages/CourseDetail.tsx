import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  LogIn,
  PlayCircle,
  Users,
  ArrowLeft,
  Video,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

const lessonTypeIcons: Record<string, React.ElementType> = {
  text: FileText,
  video: Video,
  file: BookOpen,
  quiz: HelpCircle,
};

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const course = useQuery(api.courses.getBySlug, { slug: slug || "" });
  const enrollMutation = useMutation(api.enrollments.enroll);
  const unenrollMutation = useMutation(api.enrollments.unenroll);
  const isEnrolled = useQuery(
    api.enrollments.isEnrolled,
    course?._id ? { courseId: course._id as Id<"courses"> } : "skip",
  );

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    if (!course?._id) return;
    try {
      await enrollMutation({ courseId: course._id as Id<"courses"> });
    } catch (error: any) {
      console.error("Enroll error:", error);
    }
  };

  const handleUnenroll = async () => {
    if (!course?._id) return;
    try {
      await unenrollMutation({ courseId: course._id as Id<"courses"> });
    } catch (error: any) {
      console.error("Unenroll error:", error);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Kurs yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0,
  ) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Bosh sahifa
            </button>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                  onClick={() => navigate("/dashboard")}
                >
                  <GraduationCap className="h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-lg"
                  onClick={() => navigate("/auth")}
                >
                  <LogIn className="h-4 w-4" />
                  Kirish
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8"
        >
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course info */}
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="px-3 py-1 text-xs font-medium bg-primary/5 text-primary border-primary/20"
              >
                {course.status === "published" ? "Ochiq kurs" : "Qoralama"}
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {course.title}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {course.description || "Tavsif yo'q"}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {course.teacherName}
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {course.modules?.length || 0} ta modul
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  {totalLessons} ta dars
                </div>
              </div>
            </div>

            <Separator />

            {/* Course modules & lessons */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold tracking-tight">
                Kurs tuzilishi
              </h2>
              {course.modules?.map((module, mi) => (
                <motion.div
                  key={module._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mi * 0.05 }}
                >
                  <Card className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {mi + 1}
                        </span>
                        {module.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {module.lessons?.map((lesson, li) => {
                        const Icon = lessonTypeIcons[lesson.type] || FileText;
                        return (
                          <div
                            key={lesson._id}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                          >
                            <div className="w-7 h-7 rounded flex items-center justify-center bg-muted text-muted-foreground">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="flex-1">{lesson.title}</span>
                            {lesson.durationMin && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.durationMin} min
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50 sticky top-24">
              <CardContent className="py-6 space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                    <GraduationCap className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.teacherName}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Modullar</span>
                    <span className="font-medium">{course.modules?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Darslar</span>
                    <span className="font-medium">{totalLessons}</span>
                  </div>
                </div>

                {course.status === "published" && (
                  <>
                    <Separator />
                    {isEnrolled ? (
                      <div className="space-y-3">
                        <Badge className="w-full py-2 bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Siz yozilgansiz
                        </Badge>
                        <Button
                          className="w-full gap-2 rounded-xl"
                          onClick={() => navigate(`/learn/${slug}`)}
                        >
                          <PlayCircle className="h-4 w-4" />
                          O'qishni boshlash
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 rounded-lg text-muted-foreground"
                          onClick={handleUnenroll}
                        >
                          Bekor qilish
                        </Button>
                      </div>
                    ) : (
                      <Button
                        className="w-full gap-2 rounded-xl h-12 text-base"
                        onClick={handleEnroll}
                      >
                        {authLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <GraduationCap className="h-5 w-5" />
                            {isAuthenticated ? "Kursga yozilish" : "Kirish va yozilish"}
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
