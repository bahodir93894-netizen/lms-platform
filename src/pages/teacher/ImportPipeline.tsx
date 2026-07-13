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
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  FileDown,
  FileText,
  HelpCircle,
  Import,
  Loader2,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";

export default function ImportPipeline() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);

  const importOptions = [
    {
      title: "Markdown (.md)",
      description: "Mavjud MD fayllarni to'g'ridan-to'g'ri dars kontenti sifatida import qiling. Front-matter dan title va order avtomatik olinadi.",
      icon: FileText,
      color: "from-blue-500/20 to-blue-600/10",
      accent: "text-blue-500",
      format: ".md",
    },
    {
      title: "Test formati (.txt/.md)",
      description: "Maxsus formatdagi matnli faylni yuklab, avtomatik test yarating: ? savol, * to'g'ri javob, - noto'g'ri variant.",
      icon: HelpCircle,
      color: "from-violet-500/20 to-violet-600/10",
      accent: "text-violet-500",
      format: ".txt, .md",
    },
    {
      title: "DOCX konvertatsiya",
      description: "Word fayllarni yuklab, avtomatik Markdown ga o'tkazing. Keyin tahrirlab dars sifatida saqlang.",
      icon: FileDown,
      color: "from-amber-500/20 to-amber-600/10",
      accent: "text-amber-500",
      format: ".docx",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Import qilish
        </h1>
        <p className="text-muted-foreground mt-1">
          Mavjud fayllarni platformaga import qiling
        </p>
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-all ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-primary/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Faylni tortib keling yoki tanlang
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            MD, DOCX yoki TXT formatidagi fayllarni qo'llab-quvvatlaymiz
          </p>
          <div className="flex items-center gap-3">
            <Button className="gap-2 rounded-xl" disabled>
              <Upload className="h-4 w-4" />
              Faylni tanlash
            </Button>
            <p className="text-xs text-muted-foreground">
              (Tez kunda ishga tushadi)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Import options */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Qo'llab-quvvatlanadigan formatlar
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {importOptions.map((opt, i) => (
            <motion.div
              key={opt.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group h-full border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${opt.color} mb-3`}>
                    <opt.icon className={`h-5 w-5 ${opt.accent}`} />
                  </div>
                  <CardTitle className="text-base">{opt.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {opt.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quiz format example */}
      <Card className="border-border/50 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Test import formati
          </CardTitle>
          <CardDescription>
            Quyidagi formatda fayl yuklab, bir zumda test yarating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-xl text-sm font-mono leading-relaxed overflow-x-auto">
{`? JavaScript da o'zgaruvchini e'lon qilish uchun qaysi kalit so'z ishlatiladi?
* let
- variable
- int
- def

? typeof null nima qaytaradi?
* "object"
- "null"
- "undefined"
- "boolean"`}
          </pre>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3" /> ? Savol</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> * To'g'ri javob</span>
            <span className="flex items-center gap-1"><span className="text-muted-foreground">-</span> Noto'g'ri variant</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
