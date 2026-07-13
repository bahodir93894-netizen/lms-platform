import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Award, CheckCircle2, Download, GraduationCap, Printer, Star } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import logo from "@/assets/logo.svg";

export default function CertificateView() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const certificate = useQuery(api.certificates.getById, {
    certificateId: certificateId || "",
  });

  if (certificate === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Award className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Sertifikat topilmadi</h2>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/")}
          >
            Bosh sahifaga qaytish
          </Button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full"
      >
        {/* Certificate card */}
        <div
          id="certificate"
          className="relative bg-white dark:bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden print:shadow-none"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 50%, oklch(0.38 0.12 265 / 0.03) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 50%, oklch(0.62 0.18 35 / 0.03) 0%, transparent 50%)
            `,
          }}
        >
          {/* Top decorative border */}
          <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
          
          <div className="px-8 sm:px-16 py-12 sm:py-16 text-center space-y-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3">
              <img src={logo} alt="" width={40} height={40} className="rounded-lg opacity-80" />
              <span className="text-lg font-semibold text-muted-foreground">O'quv Markazi</span>
            </div>

            {/* Decorative line */}
            <div className="flex items-center gap-4 justify-center">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
              <Award className="h-8 w-8 text-amber-500" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Sertifikat
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {certificate.courseTitle}
              </h1>
            </div>

            {/* Body */}
            <div className="space-y-4 max-w-lg mx-auto">
              <p className="text-muted-foreground">
                Ushbu sertifikat
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {certificate.studentName}
              </p>
              <p className="text-muted-foreground">
                ga kursni muvaffaqiyatli tugatganligi uchun berildi
              </p>
            </div>

            {/* Score */}
            {certificate.completionScore && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Star className="h-4 w-4" />
                <span className="text-sm font-medium">O'rtacha natija: {certificate.completionScore}%</span>
              </div>
            )}

            {/* Date */}
            <div className="text-sm text-muted-foreground">
              Berilgan sana: {" "}
              {new Date(certificate.issuedAt).toLocaleDateString("uz-UZ", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            {/* Certificate ID */}
            <div className="text-[10px] text-muted-foreground/50 font-mono">
              Sertifikat ID: {certificate.certificateId}
            </div>

            {/* Bottom decorative line */}
            <div className="flex items-center gap-4 justify-center">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
              <GraduationCap className="h-6 w-6 text-muted-foreground" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
            </div>

            {/* Footer */}
            <p className="text-xs text-muted-foreground/60">
              O'quv Markazi — Zamonaviy ta'lim platformasi
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6 print:hidden">
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Button>
          <Button
            className="gap-2 rounded-xl"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Chop etish
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
