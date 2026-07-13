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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { motion, Reorder } from "framer-motion";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Edit3,
  FileText,
  GripVertical,
  HelpCircle,
  Loader2,
  PlusCircle,
  Trash2,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

const lessonTypeIcons = {
  text: FileText,
  video: Video,
  file: BookOpen,
  quiz: HelpCircle,
};

const lessonTypeLabels = {
  text: "Matn",
  video: "Video",
  file: "Fayl",
  quiz: "Test",
};

const lessonTypeColors = {
  text: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  video: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
  file: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  quiz: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
};

export default function CourseEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const course = useQuery(api.courses.getBySlug, {
    slug: courseId || "",
  });
  // If courseId is an actual ID, try getting via a direct query
  const courseById = useQuery(
    (api as any).courses.getById,
    courseId?.startsWith("course:")
      ? { courseId: courseId as Id<"courses"> }
      : "skip",
  );

  const modules = useQuery(api.modules.listByCourse, {
    courseId: (courseId as Id<"courses">) || ("skip" as any),
  });

  const updateCourse = useMutation(api.courses.update);
  const createModule = useMutation(api.modules.create);
  const updateModule = useMutation(api.modules.update);
  const deleteModule = useMutation(api.modules.remove);
  const createLesson = useMutation(api.lessons.create);
  const deleteLesson = useMutation(api.lessons.remove);

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    slug: "",
  });
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [newLessonModuleId, setNewLessonModuleId] = useState<string | null>(
    null,
  );
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonType, setLessonType] = useState<string>("text");
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  // Sync course data to form
  useEffect(() => {
    const data = course || (courseById as any);
    if (data && !courseForm.title) {
      setCourseForm({
        title: data.title || "",
        description: data.description || "",
        slug: data.slug || "",
      });
    }
  }, [course, courseById]);

  // Derive course data
  const courseData = course || (courseById as any);

  const handleSaveCourse = async () => {
    if (!courseId || !courseForm.title) return;
    try {
      await updateCourse({
        courseId: courseId as Id<"courses">,
        title: courseForm.title,
        description: courseForm.description || undefined,
      });
    } catch (error) {
      console.error("Failed to update course:", error);
    }
  };

  const handleCreateModule = async () => {
    if (!courseId || !moduleTitle.trim()) return;
    setIsCreatingModule(true);
    try {
      await createModule({
        courseId: courseId as Id<"courses">,
        title: moduleTitle.trim(),
      });
      setModuleTitle("");
      setModuleDialogOpen(false);
    } catch (error) {
      console.error("Failed to create module:", error);
    } finally {
      setIsCreatingModule(false);
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    if (!moduleTitle.trim()) return;
    try {
      await updateModule({
        moduleId: moduleId as Id<"modules">,
        title: moduleTitle.trim(),
      });
      setEditingModule(null);
      setModuleTitle("");
    } catch (error) {
      console.error("Failed to update module:", error);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule({
        moduleId: moduleId as Id<"modules">,
      });
    } catch (error) {
      console.error("Failed to delete module:", error);
    }
  };

  const handleCreateLesson = async () => {
    if (!newLessonModuleId || !lessonTitle.trim()) return;
    setIsCreatingLesson(true);
    try {
      await createLesson({
        moduleId: newLessonModuleId as Id<"modules">,
        title: lessonTitle.trim(),
        type: lessonType as any,
      });
      setLessonTitle("");
      setLessonDialogOpen(false);
      setNewLessonModuleId(null);
    } catch (error) {
      console.error("Failed to create lesson:", error);
    } finally {
      setIsCreatingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await deleteLesson({
        lessonId: lessonId as Id<"lessons">,
      });
    } catch (error) {
      console.error("Failed to delete lesson:", error);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  if (!courseData && !courseById) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Kurs yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/teacher/courses")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-2"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            Kurslarim
          </button>
          <h1 className="text-2xl font-bold tracking-tight">
            {courseForm.title || "Kurs tahrirlash"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {courseData && (
            <Badge
              variant="outline"
              className={
                courseData.status === "published"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400"
              }
            >
              {courseData.status === "published"
                ? "Nashr etilgan"
                : "Qoralama"}
            </Badge>
          )}
        </div>
      </div>

      {/* Course Info Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Kurs ma'lumotlari
          </CardTitle>
          <CardDescription>
            Kurs nomi va tavsifini o'zgartiring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="edit-title">Kurs nomi</Label>
              <Input
                id="edit-title"
                value={courseForm.title}
                onChange={(e) =>
                  setCourseForm((f) => ({ ...f, title: e.target.value }))
                }
                className="rounded-xl"
                placeholder="Kurs nomi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={courseForm.slug}
                onChange={(e) =>
                  setCourseForm((f) => ({ ...f, slug: e.target.value }))
                }
                className="rounded-xl font-mono text-sm"
                placeholder="kurs-slugi"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Tavsif</Label>
            <Textarea
              id="edit-desc"
              value={courseForm.description}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, description: e.target.value }))
              }
              className="rounded-xl resize-none"
              rows={3}
              placeholder="Kurs haqida qisqacha..."
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveCourse}
              className="gap-2 rounded-xl"
              size="sm"
            >
              <Edit3 className="h-4 w-4" />
              Saqlash
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Modullar va darslar
            </h2>
            <p className="text-sm text-muted-foreground">
              Kurs tuzilmasini yarating — modullar va darslarni boshqaring
            </p>
          </div>
          <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 rounded-xl">
                <PlusCircle className="h-4 w-4" />
                Yangi modul
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi modul</DialogTitle>
                <DialogDescription>
                  Modul nomini kiriting (masalan: "1-hafta: Kirish")
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Modul nomi"
                  className="rounded-xl"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateModule();
                  }}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setModuleDialogOpen(false);
                    setModuleTitle("");
                  }}
                >
                  Bekor qilish
                </Button>
                <Button
                  onClick={handleCreateModule}
                  disabled={!moduleTitle.trim() || isCreatingModule}
                >
                  {isCreatingModule ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-2" />
                  )}
                  Qo'shish
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {!modules || modules.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Hali modullar yo'q</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Modul qo'shishni boshlang
              </p>
              <Button
                size="sm"
                className="gap-2 rounded-lg"
                onClick={() => setModuleDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Birinchi modulni qo'shish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((module, index) => (
              <motion.div
                key={module._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border/50 overflow-hidden">
                  {/* Module Header */}
                  <div
                    className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleModule(module._id)}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                        {index + 1}
                      </span>
                      <span className="font-medium text-sm truncate">
                        {module.title}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {module.lessons?.length || 0} ta dars
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingModule(module._id);
                          setModuleTitle(module.title);
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(module._id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {expandedModules.includes(module._id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Lessons List */}
                  {expandedModules.includes(module._id) && (
                    <div className="border-t border-border/50 bg-muted/20">
                      <div className="px-5 py-3 space-y-2">
                        {module.lessons && module.lessons.length > 0 ? (
                          module.lessons.map((lesson) => {
                            const Icon =
                              lessonTypeIcons[
                                lesson.type as keyof typeof lessonTypeIcons
                              ] || FileText;
                            return (
                              <div
                                key={lesson._id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border/40 hover:border-primary/20 hover:shadow-sm transition-all group cursor-pointer"
                                onClick={() =>
                                  navigate(
                                    `/teacher/courses/${courseId}/modules/${module._id}/lessons/${lesson._id}/edit`,
                                  )
                                }
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    lessonTypeColors[
                                      lesson.type as keyof typeof lessonTypeColors
                                    ] || "bg-gray-50 text-gray-600"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {lessonTypeLabels[
                                      lesson.type as keyof typeof lessonTypeLabels
                                    ] || lesson.type}
                                    {lesson.order !== undefined &&
                                      ` · ${lesson.order + 1}-dars`}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteLesson(lesson._id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-3">
                            Hali darslar yo'q
                          </p>
                        )}

                        {/* Add lesson button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full gap-2 text-muted-foreground hover:text-foreground border border-dashed border-border/50 rounded-lg h-9"
                          onClick={() => {
                            setNewLessonModuleId(module._id);
                            setLessonDialogOpen(true);
                          }}
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Dars qo'shish
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Module Dialog */}
      <Dialog
        open={!!editingModule}
        onOpenChange={(open) => {
          if (!open) {
            setEditingModule(null);
            setModuleTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modulni tahrirlash</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              placeholder="Modul nomi"
              className="rounded-xl"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && editingModule) {
                  handleUpdateModule(editingModule);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingModule(null);
                setModuleTitle("");
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={() => editingModule && handleUpdateModule(editingModule)}
              disabled={!moduleTitle.trim()}
            >
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lesson Dialog */}
      <Dialog
        open={lessonDialogOpen}
        onOpenChange={(open) => {
          setLessonDialogOpen(open);
          if (!open) setNewLessonModuleId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi dars</DialogTitle>
            <DialogDescription>
              Dars nomi va turini tanlang
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dars nomi</Label>
              <Input
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Dars nomi"
                className="rounded-xl"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Dars turi</Label>
              <Select value={lessonType} onValueChange={setLessonType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Dars turini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Matnli dars
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video dars
                    </div>
                  </SelectItem>
                  <SelectItem value="quiz">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Test
                    </div>
                  </SelectItem>
                  <SelectItem value="file">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Fayl
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLessonDialogOpen(false);
                setNewLessonModuleId(null);
                setLessonTitle("");
              }}
            >
              Bekor qilish
            </Button>
            <Button
              onClick={handleCreateLesson}
              disabled={!lessonTitle.trim() || isCreatingLesson}
            >
              {isCreatingLesson ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Dars yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
