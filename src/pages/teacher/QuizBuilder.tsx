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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

const questionTypeLabels: Record<string, string> = {
  single_choice: "Bitta to'g'ri javob",
  multiple_choice: "Bir necha to'g'ri javob",
  true_false: "To'g'ri / Noto'g'ri",
  short_answer: "Qisqa javob",
};

const questionTypeColors: Record<string, string> = {
  single_choice: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  multiple_choice: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  true_false: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  short_answer: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

export default function QuizBuilder() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();

  const quizData = useQuery(api.quizzes.getByLessonTeacher, {
    lessonId: lessonId as Id<"lessons">,
  });

  const moduleData = useQuery(api.modules.listByCourse, {
    courseId: courseId as Id<"courses">,
  });

  const upsertQuiz = useMutation(api.quizzes.upsert);
  const addQuestion = useMutation(api.quizzes.addQuestion);
  const removeQuestion = useMutation(api.quizzes.removeQuestion);
  const removeQuiz = useMutation(api.quizzes.remove);

  const [quizSettings, setQuizSettings] = useState({
    title: "",
    timeLimitMin: 10,
    passScore: 60,
    maxAttempts: 1,
    shuffleQuestions: true,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [questionDialog, setQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    textMd: "",
    type: "single_choice",
    points: 1,
    options: ["", ""] as string[],
    correctIndex: 0,
    correctIndices: [0] as number[],
  });

  useEffect(() => {
    if (quizData && !quizSettings.title) {
      setQuizSettings({
        title: quizData.title || "",
        timeLimitMin: quizData.timeLimitMin ?? 10,
        passScore: quizData.passScore ?? 60,
        maxAttempts: quizData.maxAttempts ?? 1,
        shuffleQuestions: quizData.shuffleQuestions ?? true,
      });
    }
  }, [quizData]);

  const handleSaveSettings = async () => {
    if (!lessonId) return;
    setIsSaving(true);
    try {
      await upsertQuiz({
        lessonId: lessonId as Id<"lessons">,
        title: quizSettings.title,
        timeLimitMin: quizSettings.timeLimitMin,
        passScore: quizSettings.passScore,
        maxAttempts: quizSettings.maxAttempts,
        shuffleQuestions: quizSettings.shuffleQuestions,
      });
      setSettingsOpen(false);
    } catch (error) {
      console.error("Failed to save quiz settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!quizData?._id || !newQuestion.textMd.trim()) return;
    setIsSaving(true);
    try {
      const options = newQuestion.options
        .filter((o) => o.trim())
        .map((text, i) => ({
          textMd: text,
          isCorrect:
            newQuestion.type === "single_choice" || newQuestion.type === "true_false"
              ? i === newQuestion.correctIndex
              : newQuestion.correctIndices.includes(i),
        }));

      await addQuestion({
        quizId: quizData._id as Id<"quizzes">,
        type: newQuestion.type as any,
        textMd: newQuestion.textMd,
        points: newQuestion.points,
        options,
      });

      setQuestionDialog(false);
      setNewQuestion({
        textMd: "",
        type: "single_choice",
        points: 1,
        options: ["", ""],
        correctIndex: 0,
        correctIndices: [0],
      });
    } catch (error) {
      console.error("Failed to add question:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await removeQuestion({ questionId: questionId as Id<"questions"> });
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizData?._id) return;
    try {
      await removeQuiz({ quizId: quizData._id as Id<"quizzes"> });
      navigate(`/teacher/courses/${courseId}/edit`);
    } catch (error) {
      console.error("Failed to delete quiz:", error);
    }
  };

  const moduleInfo = moduleData?.find((m) => m._id === moduleId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6"
    >
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kursga qaytish
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground truncate max-w-[200px]">
          {moduleInfo?.title || "Test"}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {quizData?.title || "Test yaratish"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {quizData?.questions?.length || 0} ta savol
              {quizData?.timeLimitMin ? ` · ${quizData.timeLimitMin} daqiqa` : ""}
              {quizData?.passScore ? ` · O'tish: ${quizData.passScore}%` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-lg"
            onClick={() => setSettingsOpen(true)}
          >
            <Save className="h-4 w-4" />
            Sozlamalar
          </Button>
          <Button
            size="sm"
            className="gap-2 rounded-lg"
            onClick={() => setQuestionDialog(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Savol qo'shish
          </Button>
        </div>
      </div>

      <Separator />

      {/* Questions List */}
      {!quizData ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Test hali yaratilmagan</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Avval test sozlamalarini saqlang, so'ng savollar qo'shing
            </p>
            <Button
              className="gap-2 rounded-xl"
              onClick={() => setSettingsOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Test yaratish
            </Button>
          </CardContent>
        </Card>
      ) : quizData.questions.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Hali savollar yo'q. Birinchi savolni qo'shing.
            </p>
            <Button
              size="sm"
              className="gap-2 rounded-lg"
              onClick={() => setQuestionDialog(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Savol qo'shish
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizData.questions.map((question, index) => (
            <motion.div
              key={question._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/50 hover:border-primary/20 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {index + 1}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          questionTypeColors[question.type] ||
                          "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {questionTypeLabels[question.type] || question.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {question.points || 1} ball
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteQuestion(question._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm font-medium mb-3">{question.textMd}</p>
                  <div className="space-y-1.5">
                    {question.options?.map((opt, oi) => (
                      <div
                        key={opt._id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          opt.isCorrect
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200"
                            : "bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {opt.isCorrect ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {opt.textMd}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Test sozlamalari</DialogTitle>
            <DialogDescription>Test nomi va parametrlarini sozlang</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Test nomi</Label>
              <Input
                value={quizSettings.title}
                onChange={(e) =>
                  setQuizSettings((s) => ({ ...s, title: e.target.value }))
                }
                placeholder="Test nomi"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Vaqt (daqiqa)</Label>
                <Input
                  type="number"
                  value={quizSettings.timeLimitMin}
                  onChange={(e) =>
                    setQuizSettings((s) => ({
                      ...s,
                      timeLimitMin: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="rounded-xl"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>O'tish %</Label>
                <Input
                  type="number"
                  value={quizSettings.passScore}
                  onChange={(e) =>
                    setQuizSettings((s) => ({
                      ...s,
                      passScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="rounded-xl"
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label>Urinishlar</Label>
                <Input
                  type="number"
                  value={quizSettings.maxAttempts}
                  onChange={(e) =>
                    setQuizSettings((s) => ({
                      ...s,
                      maxAttempts: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="rounded-xl"
                  min={1}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yangi savol</DialogTitle>
            <DialogDescription>Savol matni va variantlarni kiriting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Savol turi</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(v) =>
                  setNewQuestion((q) => ({
                    ...q,
                    type: v,
                    correctIndex: 0,
                    correctIndices: [0],
                    options: v === "true_false" ? ["To'g'ri", "Noto'g'ri"] : q.options,
                  }))
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Bitta to'g'ri javob</SelectItem>
                  <SelectItem value="multiple_choice">Bir necha to'g'ri javob</SelectItem>
                  <SelectItem value="true_false">To'g'ri / Noto'g'ri</SelectItem>
                  <SelectItem value="short_answer">Qisqa javob</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Savol matni</Label>
              <textarea
                value={newQuestion.textMd}
                onChange={(e) =>
                  setNewQuestion((q) => ({ ...q, textMd: e.target.value }))
                }
                className="w-full min-h-[80px] p-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                placeholder="Savolni kiriting..."
              />
            </div>

            {newQuestion.type !== "short_answer" && (
              <div className="space-y-3">
                <Label>Javob variantlari</Label>
                {newQuestion.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type={
                        newQuestion.type === "multiple_choice"
                          ? "checkbox"
                          : "radio"
                      }
                      name="correct-answer"
                      checked={
                        newQuestion.type === "single_choice" ||
                        newQuestion.type === "true_false"
                          ? i === newQuestion.correctIndex
                          : newQuestion.correctIndices.includes(i)
                      }
                      onChange={() => {
                        if (
                          newQuestion.type === "single_choice" ||
                          newQuestion.type === "true_false"
                        ) {
                          setNewQuestion((q) => ({ ...q, correctIndex: i }));
                        } else {
                          setNewQuestion((q) => ({
                            ...q,
                            correctIndices: q.correctIndices.includes(i)
                              ? q.correctIndices.filter((ci) => ci !== i)
                              : [...q.correctIndices, i],
                          }));
                        }
                      }}
                      className="shrink-0"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[i] = e.target.value;
                        setNewQuestion((q) => ({ ...q, options: newOpts }));
                      }}
                      placeholder={`Variant ${i + 1}`}
                      className="rounded-xl"
                    />
                    {newQuestion.type !== "true_false" && newQuestion.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => {
                          const newOpts = newQuestion.options.filter(
                            (_, idx) => idx !== i,
                          );
                          setNewQuestion((q) => ({
                            ...q,
                            options: newOpts,
                            correctIndex: Math.min(q.correctIndex, newOpts.length - 1),
                            correctIndices: q.correctIndices
                              .filter((ci) => ci !== i)
                              .map((ci) => (ci > i ? ci - 1 : ci)),
                          }));
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {newQuestion.type !== "true_false" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs w-full rounded-lg border border-dashed border-border/50"
                    onClick={() =>
                      setNewQuestion((q) => ({
                        ...q,
                        options: [...q.options, ""],
                      }))
                    }
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    Variant qo'shish
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Ball</Label>
              <Input
                type="number"
                value={newQuestion.points}
                onChange={(e) =>
                  setNewQuestion((q) => ({
                    ...q,
                    points: parseInt(e.target.value) || 1,
                  }))
                }
                className="rounded-xl w-24"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQuestionDialog(false)}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleAddQuestion}
              disabled={
                !newQuestion.textMd.trim() ||
                isSaving ||
                (newQuestion.type !== "short_answer" &&
                  newQuestion.options.filter((o) => o.trim()).length < 2)
              }
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Savol qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
