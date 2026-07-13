import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { GraduationCap, Home } from "lucide-react";
import { useNavigate } from "react-router";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/50"
    >
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.38 0.12 265), transparent)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.18 35), transparent)",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center max-w-md px-4"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/20">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          {/* Error code */}
          <h1 className="text-7xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            404
          </h1>

          {/* Message */}
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Sahifa topilmadi
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Qidirgan sahifangiz mavjud emas yoki ko'chirilgan bo'lishi mumkin.
            Bosh sahifaga qayting yoki kurslarni ko'rib chiqing.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4" />
              Bosh sahifa
            </Button>
            <Button
              variant="outline"
              className="gap-2 rounded-xl h-11 px-6 border-border/60"
              onClick={() => navigate("/auth")}
            >
              Kirish
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; 2026 O'quv Markazi |{" "}
          <a
            href="https://freebuff.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            freebuff.com
          </a>
        </p>
      </footer>
    </motion.div>
  );
}
