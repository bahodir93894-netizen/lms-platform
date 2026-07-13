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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  FileText,
  HelpCircle,
  Loader2,
  Save,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

function SimpleMarkdownPreview({ content }: { content: string }) {
  if (!content) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Hali kontent yo'q. Markdown formatida yozishni boshlang.
      </p>
    );
  }

  // Simple Markdown to HTML conversion
  const html = content
    // Headers
    .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-5 mb-2'>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2 class='text-xl font-semibold mt-6 mb-2'>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-6 mb-3'>$1</h1>")
    // Bold & Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`(.+?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-sm font-mono'>$1</code>")
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, "<pre class='bg-muted p-4 rounded-xl overflow-x-auto text-sm font-mono my-3'><code>$2</code></pre>")
    // Images
    .replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' class='rounded-xl my-4 max-w-full' />")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, "<a href='$2' class='text-primary underline' target='_blank'>$1</a>")
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li class='ml-5 list-disc text-sm'>$1</li>")
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li class='ml-5 list-decimal text-sm'>$1</li>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr class='my-6 border-border/50' />")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3'>$1</blockquote>")
    // Paragraphs - wrap double newlines
    .replace(/\n\n/g, "</p><p class='mb-3 leading-relaxed'>")
    // Single newlines (within paragraph)
    .replace(/\n/g, "<br />");

  return (
    <div className="prose prose-sm max-w-none">
      <p className="mb-3 leading-relaxed">{html}</p>
    </div>
  );
}

const lessonTypeIcons = {
  text: FileText,
  video: Video,
  file: BookOpen,
  quiz: HelpCircle,
};

export default function LessonEditor() {
  const { courseId, moduleId, lessonId } = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();
  const navigate = useNavigate();

  // Fetch lesson data
  const moduleData = useQuery(api.modules.listByCourse, {
    courseId: (courseId as Id<"courses">) || ("skip" as any),
  });

  // We need a way to get the individual lesson. Let's search through modules
  const lesson = moduleData
    ?.flatMap((m) => m.lessons || [])
    .find((l) => l._id === lessonId);

  const moduleInfo = moduleData?.find((m) => m._id === moduleId);

  const updateLesson = useMutation(api.lessons.update);

  const [title, setTitle] = useState("");
  const [contentMd, setContentMd] = useState("");
  const [type, setType] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || "");
      setContentMd(lesson.contentMd || "");
      setType(lesson.type || "text");
    }
  }, [lesson]);

  const handleSave = async () => {
    if (!lessonId) return;
    setIsSaving(true);
    try {
      await updateLesson({
        lessonId: lessonId as Id<"lessons">,
        title,
        contentMd: contentMd || undefined,
        type: type as any,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to update lesson:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const Icon = lessonTypeIcons[type as keyof typeof lessonTypeIcons] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6"
    >
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate(`/teacher/courses/${courseId}/edit`)}
          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kursga qaytish
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground truncate max-w-[200px]">
          {moduleInfo?.title || "Modul"}
        </span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium truncate max-w-[200px]">
          {title || "Yangi dars"}
        </span>
      </div>

      {/* Lesson Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-bold border-0 bg-transparent px-0 focus-visible:ring-0 h-auto py-0"
                placeholder="Dars nomi"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Matnli
                  </div>
                </SelectItem>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-3.5 w-3.5" />
                    Video
                  </div>
                </SelectItem>
                <SelectItem value="quiz">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Test
                  </div>
                </SelectItem>
                <SelectItem value="file">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    Fayl
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              {moduleInfo?.title || "Modul"}
            </Badge>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 rounded-xl shrink-0"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <span className="text-green-400">✓</span>
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? "Saqlangan" : "Saqlash"}
        </Button>
      </div>

      <Separator />

      {/* Content Editor */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="edit" className="gap-2 rounded-lg">
            <FileText className="h-4 w-4" />
            Markdown
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2 rounded-lg">
            <Eye className="h-4 w-4" />
            Ko'rinish
          </TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <textarea
                value={contentMd}
                onChange={(e) => setContentMd(e.target.value)}
                className="w-full min-h-[500px] p-5 bg-background text-foreground font-mono text-sm leading-relaxed resize-y focus:outline-none rounded-xl border-0"
                placeholder="Markdown formatida yozing...

# 1-sarlavha
## 2-sarlavha

**Qalin matn** va *kursiv*

- Ro'yxat elementi
- Yana bir element

1. Raqamlangan ro'yxat
2. Ikkinchi element

`inline kod`

```javascript
// kod bloki
console.log('Hello');
```

[Link matni](https://example.com)

![Rasm tavsifi](url)

> Iqtibos

---"
                spellCheck
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">{title || "Dars nomi"}</CardTitle>
              <CardDescription>
                {type === "text"
                  ? "Matnli dars"
                  : type === "video"
                    ? "Video dars"
                    : type === "quiz"
                      ? "Test"
                      : "Fayl"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-none">
                <SimpleMarkdownPreview content={contentMd} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick tips */}
      <Card className="border-border/30 bg-muted/20">
        <CardContent className="py-4 px-5">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Markdown yordamida tez formatlash</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <code className="bg-muted px-2 py-1 rounded"># Sarlavha</code>
                <code className="bg-muted px-2 py-1 rounded">**Qalin**</code>
                <code className="bg-muted px-2 py-1 rounded">*Kursiv*</code>
                <code className="bg-muted px-2 py-1 rounded">- Ro'yxat</code>
                <code className="bg-muted px-2 py-1 rounded">`kod`</code>
                <code className="bg-muted px-2 py-1 rounded">```blok```</code>
                <code className="bg-muted px-2 py-1 rounded">[link](url)</code>
                <code className="bg-muted px-2 py-1 rounded">![rasm](url)</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
