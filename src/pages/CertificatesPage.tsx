import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Award,
  ChevronRight,
  Download,
  GraduationCap,
  Loader2,
  Trophy,
  ExternalLink,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export default function CertificatesPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const myCertificates = useQuery(api.certificates.myCertificates);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Mening sertifikatlarim
            </h1>
            <p className="text-muted-foreground mt-1">
              Kurslarni tugatganingiz uchun olingan sertifikatlar
            </p>
          </div>
        </div>

        {!myCertificates || myCertificates.length === 0 ? (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Trophy className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Hali sertifikatlaringiz yo'q
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Kurslarni to'liq tugatib, sertifikat oling. Har bir kurs uchun
                sertifikat beriladi.
              </p>
              <Button
                className="gap-2 rounded-xl"
                onClick={() => navigate("/dashboard")}
              >
                Kurslarni ko'rish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCertificates.map((cert, i) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden">
                  {/* Certificate preview */}
                  <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center">
                        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-600 border-emerald-200 text-xs"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Sertifikatlangan
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-base">{cert.courseTitle}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cert.studentName}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(cert.issuedAt).toLocaleDateString("uz-UZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      {cert.completionScore && (
                        <span className="font-medium text-primary">
                          {cert.completionScore}%
                        </span>
                      )}
                    </div>
                  </CardContent>
                  <div className="px-6 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 rounded-lg group-hover:border-primary/30 transition-colors"
                      onClick={() =>
                        navigate(`/certificate/${cert.certificateId}`)
                      }
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Sertifikatni ko'rish
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
