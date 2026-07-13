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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileQuestion,
  FileText,
  HelpCircle,
  Loader2,
  MessageSquare,
  Save,
  Trophy,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";

function SimpleMarkdownRender({ content }: { content?: string | null }) {
  if (!content) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Bu darsda hali kontent yo'q.
      </p>
    );
  }

  const html = content
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-5 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-semibold mt-6 mb-3'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-6 mb-4'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm font-mono'>$1</code>")
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre class='bg-muted p-4 rounded-xl overflow-x-auto text-sm font-mono my-3'><code>$2</code></pre>")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' class='rounded-xl my-4 max-w-full' />")
    .replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2' class='text-primary underline' target='_blank'>$1</a>")
    .replace(/^- (.+)$/gm, "<li class='ml-5 list-disc text-sm mb-1'>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-5 list-decimal text-sm mb-1'>$1</li>")
    .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3'>$1</blockquote>")
    .replace(/\n\n/g, "</p><p class='mb-3 leading-relaxed'>")
    .replace(/\n/g, "<br />");

  return (
    <div className="max-w-none">
      <p className="mb-3 leading-relaxed">{html}</p>
    </div>
  );
}

/** Video player for YouTube/iframe */
function VideoPlayer({ url }: { url?: string | null }) {
  if (!url) {
    return (
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="py-12 text-center">
          <Youtube className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Video URL kiritilmagan</p>
        </CardContent>
      </Card>
    );
  }

  // Extract YouTube video ID
  let embedUrl = url;
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
  );
  if (ytMatch) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }

  return (
    <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video dars"
      />
    </div>
  );
}

/** Assignment submission component */
function AssignmentSubmission({
  lessonId,
}: {
  lessonId: string;
}) {
  const assignment = useQuery(api.assignments.getByLesson, {
    lessonId: lessonId as Id<"lessons">,
  });
  const mySubmissions = useQuery(
    api.submissions.mySubmissions,
    assignment?._id
      ? { assignmentId: assignment._id as Id<"assignments"> }
      : "skip",
  );
  const submitMutation = useMutation(api.submissions.submit);

  const [textMd, setTextMd] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const latestSubmission = mySubmissions?.[0];

  const handleSubmit = async () => {
    if (!assignment?._id || !textMd.trim()) return;
    setIsSaving(true);
    try {
      await submitMutation({
        assignmentId: assignment._id as Id<"assignments">,
        textMd: textMd,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!assignment) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-lg">{assignment.title}</CardTitle>
            <CardDescription>
              {assignment.maxScore ? `Maksimal ball: ${assignment.maxScore}` : ""}
              {assignment.dueAt
                ? ` · Muddat: ${new Date(assignment.dueAt).toLocaleDateString("uz-UZ")}`
                : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">
          <SimpleMarkdownRender content={assignment.descriptionMd} />
        </div>

        {/* Previous feedback */}
        {latestSubmission?.status === "graded" && latestSubmission.score !== undefined && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-sm">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Baholangan: {latestSubmission.score}/{assignment.maxScore || 100}
            </span>
          </div>
        )}

        {latestSubmission?.feedbackMd && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 text-sm">
            <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">O'qituvchi fikri:</span>
            </div>
            <p className="text-muted-foreground">{latestSubmission.feedbackMd}</p>
          </div>
        )}

        {/* Submission form */}
        {(!latestSubmission || latestSubmission.status === "returned") && (
          <div className="space-y-3">
            <Label>Javobingiz</Label>
            <Textarea
              value={textMd}
              onChange={(e) => setTextMd(e.target.value)}
              className="min-h-[150px] rounded-xl resize-y"
              placeholder="Javobingizni yozing..."
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={!textMd.trim() || isSaving}
                className="gap-2 rounded-xl"
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {latestSubmission ? "Qayta topshirish" : "Topshirish"}
              </Button>
            </div>
          </div>
        )}

        {latestSubmission?.status === "submitted" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950 text-sm">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-300">
              Topshirilgan, baho kutilmoqda
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Quiz taking component */
function QuizTaking({ lessonId, courseSlug }: { lessonId: string; courseSlug: string }) {
  const navigate = useNavigate();
  const quizData = useQuery(api.quizzes.getByLesson, {
    lessonId: lessonId as Id<"lessons">,
  });
  const currentAttempt = useQuery(api.quizzes.getCurrentAttempt, {
    quizId: quizData?._id as Id<"quizzes">,
  });
  const myAttempts = useQuery(api.quizzes.getMyAttempts, {
    quizId: quizData?._id as Id<"quizzes">,
  });

  const startAttempt = useMutation(api.quizzes.startAttempt);
  const saveAnswer = useMutation(api.quizzes.saveAnswer);
  const submitAttempt = useMutation(api.quizzes.submitAttempt);
  const markComplete = useMutation(api.lessons.markComplete);
  const generateCertificate = useMutation(api.certificates.generate);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed?: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [certGenerated, setCertGenerated] = useState(false);

  // Timer
  useEffect(() => {
    if (!currentAttempt || !quizData?.timeLimitMin || !started) return;
    const endTime = currentAttempt.startedAt + quizData.timeLimitMin * 60 * 1000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentAttempt, quizData?.timeLimitMin, started]);

  const handleStart = async () => {
    if (!quizData?._id) return;
    try {
      await startAttempt({ quizId: quizData._id as Id<"quizzes"> });
      setStarted(true);
    } catch (error) {
      console.error("Failed to start attempt:", error);
    }
  };

  const handleSelectOption = async (questionId: string, optionId: string, isMultiple: boolean) => {
    if (!currentAttempt) return;
    const current = answers[questionId] || (isMultiple ? [] : "");
    let newValue: string | string[];
    if (isMultiple) {
      const arr = current as string[];
      newValue = arr.includes(optionId)
        ? arr.filter((id) => id !== optionId)
        : [...arr, optionId];
    } else {
      newValue = optionId;
    }
    setAnswers((prev) => ({ ...prev, [questionId]: newValue }));
    try {
      await saveAnswer({
        attemptId: currentAttempt._id as Id<"quizAttempts">,
        questionId: questionId as Id<"questions">,
        selectedOptionIds: Array.isArray(newValue)
          ? (newValue as Id<"options">[])
          : ([newValue] as Id<"options">[]),
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const handleTextAnswer = async (questionId: string, value: string) => {
    if (!currentAttempt) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    try {
      await saveAnswer({
        attemptId: currentAttempt._id as Id<"quizAttempts">,
        questionId: questionId as Id<"questions">,
        textAnswer: value,
      });
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  };

  const handleSubmit = async () => {
    if (!currentAttempt) return;
    setIsSubmitting(true);
    try {
      const res = await submitAttempt({
        attemptId: currentAttempt._id as Id<"quizAttempts">,
      });
      if (res) setResult({ score: res.score, passed: res.passed });
      await markComplete({ lessonId: lessonId as Id<"lessons"> });
    } catch (error) {
      console.error("Failed to submit attempt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetCertificate = async () => {
    try {
      // Find course ID from context
      const context = (window as any).__courseContext;
      if (context?.course?._id) {
        await generateCertificate({ courseId: context.course._id });
        setCertGenerated(true);
      }
    } catch (error) {
      console.error("Certificate error:", error);
    }
  };

  if (!quizData) {
    return (
      <Card className="border-dashed border-2 border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">Bu darsda test mavjud emas</p>
        </CardContent>
      </Card>
    );
  }

  // Show result
  if (result) {
    const passed = result.passed ?? result.score >= (quizData.passScore ?? 60);
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-4">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
              passed ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900"
            }`}>
              {passed ? (
                <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <HelpCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <h2 className="text-2xl font-bold">{passed ? "Tabriklaymiz!" : "Qayta urinib ko'ring"}</h2>
            <div className="text-5xl font-bold text-primary">{result.score}%</div>
            <p className="text-muted-foreground">
              {passed ? "Siz testdan muvaffaqiyatli o'tdingiz" : `O'tish bali: ${quizData.passScore}%`}
            </p>
            {passed && (
              <Button
                variant="outline"
                className="gap-2 rounded-xl"
                onClick={handleGetCertificate}
                disabled={certGenerated}
              >
                <Award className="h-4 w-4" />
                {certGenerated ? "Sertifikat olindi" : "Sertifikat olish"}
              </Button>
            )}
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate(`/learn/${courseSlug}`)}>
                <ChevronLeft className="h-4 w-4" /> Kursga qaytish
              </Button>
              <Button className="gap-2 rounded-xl" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Show start screen
  if (!currentAttempt && !started) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
              <FileQuestion className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle>{quizData.title}</CardTitle>
              <CardDescription>
                {quizData.questions?.length || 0} ta savol
                {quizData.timeLimitMin ? ` · ${quizData.timeLimitMin} daqiqa` : ""}
                {quizData.passScore ? ` · O'tish: ${quizData.passScore}%` : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {myAttempts && myAttempts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Avvalgi urinishlar</p>
              {myAttempts.map((attempt) => (
                <div key={attempt._id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{new Date(attempt.startedAt).toLocaleDateString("uz-UZ")}</span>
                  <Badge variant="outline" className={attempt.passed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}>
                    {attempt.score !== undefined ? `${attempt.score}%` : "Yakunlanmagan"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          <Button size="lg" className="w-full gap-2 rounded-xl" onClick={handleStart}>
            <Clock className="h-5 w-5" /> Testni boshlash
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Quiz taking UI
  const isMultiple = (type: string) => type === "multiple_choice";

  return (
    <div className="space-y-6">
      {timeLeft !== null && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={`font-mono font-medium ${timeLeft < 60 ? "text-destructive" : ""}`}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
          <span className="text-muted-foreground">qoldi</span>
          <div className="flex-1" />
          <Button size="sm" variant="default" className="gap-2 rounded-lg" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yakunlash"}
          </Button>
        </div>
      )}

      {quizData.questions?.map((question, qi) => (
        <motion.div key={question._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.05 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{qi + 1}</span>
                <span className="text-xs text-muted-foreground">{question.points || 1} ball</span>
              </div>
              <CardTitle className="text-base font-medium">{question.textMd}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {question.options?.map((opt) => (
                <button
                  key={opt._id}
                  onClick={() => handleSelectOption(question._id, opt._id, isMultiple(question.type))}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    (isMultiple(question.type)
                      ? (answers[question._id] as string[])?.includes(opt._id)
                      : answers[question._id] === opt._id
                    )
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/60 hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      (isMultiple(question.type)
                        ? (answers[question._id] as string[])?.includes(opt._id)
                        : answers[question._id] === opt._id
                      ) ? "border-primary bg-primary" : "border-muted-foreground/30"
                    }`}>
                      {(isMultiple(question.type)
                        ? (answers[question._id] as string[])?.includes(opt._id)
                        : answers[question._id] === opt._id) && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {opt.textMd}
                  </div>
                </button>
              ))}
              {question.type === "short_answer" && (
                <textarea
                  value={(answers[question._id] as string) || ""}
                  onChange={(e) => handleTextAnswer(question._id, e.target.value)}
                  className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                  placeholder="Javobingizni kiriting..."
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export default function LearningPage() {
  const { courseSlug, lessonId } = useParams<{ courseSlug: string; lessonId: string }>();
  const navigate = useNavigate();
  const context = useOutletContext<{ course?: any; progress?: any[] }>();

  const lesson = context.course?.modules
    ?.flatMap((m: any) => m.lessons || [])
    .find((l: any) => l._id === lessonId);

  const markComplete = useMutation(api.lessons.markComplete);

  const allLessons = context.course?.modules
    ?.flatMap((m: any) => m.lessons || [])
    .sort((a: any, b: any) => a.order - b.order) || [];

  const currentIndex = allLessons.findIndex((l: any) => l._id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Store course context for certificate generation
  useEffect(() => {
    (window as any).__courseContext = context;
    return () => { delete (window as any).__courseContext; };
  }, [context]);

  const handleComplete = async () => {
    if (!lessonId) return;
    try {
      await markComplete({ lessonId: lessonId as Id<"lessons"> });
    } catch (error) {
      console.error("Failed to mark complete:", error);
    }
  };

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Dars topilmadi</p>
      </div>
    );
  }

  const typeLabel = {
    text: "Matnli dars",
    video: "Video dars",
    quiz: "Test",
    file: "Fayl",
  }[lesson.type] || "Dars";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-8">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{typeLabel}</p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{lesson.title}</h1>
      </div>

      <Separator />

      {/* Video lesson */}
      {lesson.type === "video" && (
        <VideoPlayer url={lesson.videoUrl} />
      )}

      {/* Text lesson */}
      {lesson.type === "text" && (
        <Card className="border-border/50">
          <CardContent className="py-6 px-6">
            <SimpleMarkdownRender content={lesson.contentMd} />
          </CardContent>
        </Card>
      )}

      {/* Quiz */}
      {lesson.type === "quiz" && lessonId && (
        <QuizTaking lessonId={lessonId} courseSlug={courseSlug || ""} />
      )}

      {/* Assignment */}
      {lessonId && (
        <AssignmentSubmission lessonId={lessonId} />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <div>
          {prevLesson && (
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => navigate(`/learn/${courseSlug}/${prevLesson._id}`)}>
              <ChevronLeft className="h-4 w-4" /> {prevLesson.title}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lesson.type !== "quiz" && (
            <Button variant="outline" className="gap-2 rounded-xl" onClick={handleComplete}>
              <CheckCircle2 className="h-4 w-4" /> Tugallandi
            </Button>
          )}
          {nextLesson && (
            <Button className="gap-2 rounded-xl" onClick={() => navigate(`/learn/${courseSlug}/${nextLesson._id}`)}>
              {nextLesson.title} <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
