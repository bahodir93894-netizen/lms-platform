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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  MessageSquare,
  RotateCcw,
  Search,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { ROLES } from "@/convex/schema";
import { useEffect, useState } from "react";

export default function GradingPanel() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const myCourses = useQuery(api.courses.myCourses);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [tab, setTab] = useState<"submissions" | "quizzes">("submissions");

  // Quiz grading
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const quizAttempts = useQuery(
    api.quizzes.listAttempts,
    selectedQuiz ? { quizId: selectedQuiz as Id<"quizzes"> } : "skip",
  );
  const gradeQuestion = useMutation(api.quizzes.gradeQuestion);

  // Short answer grading dialog
  const [gradeDialog, setGradeDialog] = useState<{
    answerId: string;
    questionText: string;
    answer: string;
    maxPoints: number;
  } | null>(null);
  const [gradeScore, setGradeScore] = useState(0);
  const [isGrading, setIsGrading] = useState(false);

  const handleGradeShortAnswer = async () => {
    if (!gradeDialog) return;
    setIsGrading(true);
    try {
      await gradeQuestion({
        answerId: gradeDialog.answerId as Id<"attemptAnswers">,
        isCorrect: gradeScore > 0,
        earnedPoints: gradeScore,
      });
      setGradeDialog(null);
      setGradeScore(0);
    } catch (error) {
      console.error("Grade error:", error);
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  // For quiz grading, get lessons with quizzes for the selected course
  const modules = useQuery(
    api.modules.listByCourse,
    selectedCourse ? { courseId: selectedCourse as Id<"courses"> } : "skip",
  );

  // Get all quizzes for this course
  const courseQuizzes = modules?.flatMap((mod) => {
    // We can't query by lesson easily, so this will list available quizzes
    return [mod._id];
  });

  const selectedCourseName = myCourses?.find((c) => c._id === selectedCourse)?.title;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Baholash paneli
        </h1>
        <p className="text-muted-foreground mt-1">
          O'quvchilarning topshiriqlari va test natijalarini baholang
        </p>
      </div>

      {/* Course selection */}
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
                <CardHeader>
                  <CardTitle className="text-base">{course.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {course.enrollmentCount || 0} o'quvchi · {course.moduleCount} modul
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Kursni tanlash
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {(!myCourses || myCourses.length === 0) && (
            <Card className="border-dashed border-2 border-border/50 col-span-full">
              <CardContent className="py-12 text-center">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Hali kurslar yo'q</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => {
                setSelectedCourse(null);
                setSelectedQuiz(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              {selectedCourseName || "Orqaga"}
            </Button>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="rounded-xl">
              <TabsTrigger value="submissions" className="rounded-lg gap-2">
                <FileText className="h-4 w-4" />
                Topshiriqlar
              </TabsTrigger>
              <TabsTrigger value="quizzes" className="rounded-lg gap-2">
                <HelpCircle className="h-4 w-4" />
                Test natijalari
              </TabsTrigger>
            </TabsList>

            <TabsContent value="submissions" className="mt-6">
              <Card className="border-border/50">
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Submission tizimi
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    O'quvchilar topshiriqlarni yuklaganda, ular shu yerda ko'rinadi.
                    Baholash, fikr-mulohaza berish va qayta topshirish imkoniyati mavjud.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Baholash
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      Feedback
                    </span>
                    <span className="flex items-center gap-1">
                      <RotateCcw className="h-4 w-4 text-amber-500" />
                      Qayta topshirish
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quizzes" className="mt-6 space-y-6">
              {/* List of quiz attempts */}
              {!selectedQuiz ? (
                <div className="space-y-4">
                  <h3 className="font-semibold">Kursdagi testlar</h3>
                  {modules?.map((mod) => (
                    <Card key={mod._id} className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{mod.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {/* We need to fetch lessons and their quizzes */}
                        {/* For now show a placeholder */}
                        <p className="text-xs text-muted-foreground">
                          Darslardagi testlar natijalarini ko'rish uchun
                          dars muharriridagi "Test" sahifasiga o'ting.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-lg"
                          onClick={() => {
                            // Navigate to the course editor
                            navigate(`/teacher/courses/${selectedCourse}/edit`);
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Kurs muharririga o'tish
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setSelectedQuiz(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Barcha testlar
                  </Button>

                  {quizAttempts?.map((attempt) => {
                    const shortAnswers = attempt.answers.filter(
                      (a: any) => a.isCorrect === null && a.textAnswer,
                    );
                    return (
                      <Card key={attempt._id} className="border-border/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <CardTitle className="text-sm">
                                {attempt.studentName}
                              </CardTitle>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                attempt.status === "graded"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : attempt.status === "in_progress"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-amber-50 text-amber-600"
                              }
                            >
                              {attempt.status === "graded"
                                ? "Baholangan"
                                : attempt.status === "in_progress"
                                ? "Jarayonda"
                                : "Kutilmoqda"}
                            </Badge>
                          </div>
                          <CardDescription>
                            {attempt.score !== undefined
                              ? `${attempt.score}%`
                              : "Baholanmagan"}
                          </CardDescription>
                        </CardHeader>
                        {shortAnswers.length > 0 && (
                          <CardContent>
                            <p className="text-xs text-muted-foreground mb-2">
                              Ochiq savollar ({shortAnswers.length}):
                            </p>
                            {shortAnswers.map((answer: any) => (
                              <div
                                key={answer._id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 mb-1"
                              >
                                <span className="text-sm truncate flex-1">
                                  {answer.textAnswer?.slice(0, 50)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 gap-1"
                                  onClick={() =>
                                    setGradeDialog({
                                      answerId: answer._id,
                                      questionText: answer._id,
                                      answer: answer.textAnswer || "",
                                      maxPoints: 10,
                                    })
                                  }
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Baholash
                                </Button>
                              </div>
                            ))}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}

                  {(!quizAttempts || quizAttempts.length === 0) && (
                    <Card className="border-dashed border-2 border-border/50">
                      <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          Hali test natijalari yo'q
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Short answer grading dialog */}
      <Dialog
        open={!!gradeDialog}
        onOpenChange={(o) => !o && setGradeDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ochiq savolni baholash</DialogTitle>
            <DialogDescription>
              O'quvchining javobini baholang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-xl bg-muted/30 text-sm">
              <p className="font-medium mb-1">O'quvchi javobi:</p>
              <p className="text-muted-foreground">
                {gradeDialog?.answer || "Javob kiritilmagan"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Ball (maks. {gradeDialog?.maxPoints || 10})</Label>
              <Input
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(parseInt(e.target.value) || 0)}
                min={0}
                max={gradeDialog?.maxPoints || 10}
                className="rounded-xl w-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGradeDialog(null)}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleGradeShortAnswer}
              disabled={isGrading}
            >
              {isGrading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Baholash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
