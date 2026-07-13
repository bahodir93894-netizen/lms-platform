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
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Edit3,
  FileText,
  Globe,
  Loader2,
  PlusCircle,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ROLES } from "@/convex/schema";

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

export default function TeacherCourses() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const myCourses = useQuery(api.courses.myCourses);
  const createCourse = useMutation(api.courses.create);
  const togglePublish = useMutation(api.courses.togglePublish);
  const deleteCourse = useMutation(api.courses.remove);

  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const form = new FormData(e.currentTarget);
      const title = form.get("title") as string;
      const slug = form.get("slug") as string;
      const description = form.get("description") as string;

      const courseId = await createCourse({
        title,
        slug: slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: description || undefined,
      });

      setCreateOpen(false);
      navigate(`/teacher/courses/${courseId}/edit`);
    } catch (error) {
      console.error("Failed to create course:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePublish = async (courseId: string) => {
    try {
      await togglePublish({ courseId: courseId as any });
    } catch (error) {
      console.error("Failed to toggle publish:", error);
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      await deleteCourse({ courseId: courseId as any });
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Failed to delete course:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-6xl px-4 sm:px-6 py-8"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Kurslarim
          </h1>
          <p className="text-muted-foreground mt-1">
            Barcha kurslaringizni boshqaring
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/10">
              <PlusCircle className="h-4 w-4" />
              Yangi kurs
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Yangi kurs yaratish</DialogTitle>
                <DialogDescription>
                  Kurs ma'lumotlarini kiriting. Keyinroq modul va darslarni
                  qo'shishingiz mumkin.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Kurs nomi</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Masalan: JavaScript asoslari"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug (URL)
                    <span className="text-xs text-muted-foreground ml-2">
                      avtomatik to'ldiriladi
                    </span>
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="javascript-asoslari"
                    className="rounded-xl font-mono text-sm"
                    onBlur={(e) => {
                      const titleInput = document.getElementById(
                        "title",
                      ) as HTMLInputElement;
                      if (
                        !e.target.value &&
                        titleInput?.value
                      ) {
                        e.target.value = titleInput.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Tavsif (ixtiyoriy)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Kurs haqida qisqacha ma'lumot..."
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Bekor qilish
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Yaratilmoqda...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" />
                      Kurs yaratish
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Course Grid */}
      {!myCourses || myCourses.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Hali kurslar yo'q
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Birinchi kursingizni yarating va o'quvchilar bilan bilim
                ulashing.
              </p>
              <Button
                className="gap-2 rounded-xl"
                onClick={() => setCreateOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Birinchi kursni yaratish
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {myCourses.map((course, i) => (
            <motion.div
              key={course._id}
              variants={itemVariants}
              custom={i}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    {/* Status badge */}
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
                  <CardTitle className="text-lg leading-snug">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {course.description || "Tavsif yo'q"}
                  </CardDescription>
                </CardHeader>

                {/* Stats */}
                <CardContent className="pb-4 flex-1">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {course.moduleCount} modul
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.enrollmentCount || 0} o'quvchi
                    </span>
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="px-6 pb-4 pt-0 flex items-center gap-2 border-t border-border/30 mt-auto">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 gap-1.5 rounded-lg text-xs h-9"
                    onClick={() =>
                      navigate(`/teacher/courses/${course._id}/edit`)
                    }
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Tahrirlash
                  </Button>
                  <Button
                    variant={course.status === "published" ? "secondary" : "outline"}
                    size="sm"
                    className="gap-1.5 rounded-lg text-xs h-9"
                    onClick={() => handleTogglePublish(course._id)}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {course.status === "published" ? "Chiqarish" : "Nashr"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-lg"
                    onClick={() => setDeleteConfirm(course._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Kursni o'chirish</DialogTitle>
            <DialogDescription>
              Bu amalni qaytarib bo'lmaydi. Barcha modullar, darslar va
              ma'lumotlar o'chiriladi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Bekor qilish
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
