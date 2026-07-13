import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import logo from "@/assets/logo.svg";
import { useAuth } from "@/hooks/use-auth";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  LineChart,
  Menu,
  Moon,
  PlayCircle,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeInOut" as const },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: "easeInOut" as const,
    },
  }),
};

function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-20 left-[10%] w-64 h-64 rounded-full opacity-[0.03] bg-current"
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-40 right-[15%] w-48 h-48 rounded-full opacity-[0.02] bg-current"
        animate={{
          y: [0, 15, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute bottom-40 left-[20%] w-36 h-36 rounded-full opacity-[0.025] bg-current"
        animate={{
          y: [0, -12, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </div>
  );
}

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              <img
                src={logo}
                alt="O'quv Markazi"
                width={36}
                height={36}
                className="rounded-lg transition-transform duration-300 group-hover:rotate-3"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-semibold tracking-tight text-foreground">
                O'quv Markazi
              </span>
            </div>
          </motion.button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#stats"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Statistics
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Pricing
            </a>
            <a
              href="#cta"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Contact
            </a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {!isLoading &&
              (isAuthenticated ? (
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:inline-flex gap-2"
                >
                  Dashboard
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="hidden sm:inline-flex"
                    onClick={() => navigate("/auth")}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="hidden sm:inline-flex gap-2 bg-accent text-accent-foreground hover:opacity-90"
                  >
                    Get Started
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              ))}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={{
            height: mobileOpen ? "auto" : 0,
            opacity: mobileOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden"
        >
          <div className="py-4 space-y-3 border-t border-border/50">
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Features
            </a>
            <a
              href="#stats"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Statistics
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Pricing
            </a>
            <div className="pt-2 space-y-2">
              {isAuthenticated ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    setMobileOpen(false);
                    navigate("/dashboard");
                  }}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/auth");
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full bg-accent text-accent-foreground hover:opacity-90"
                    onClick={() => {
                      setMobileOpen(false);
                      navigate("/auth");
                    }}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}

function HeroSection() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  return (
    <motion.section
      style={{ opacity: heroOpacity, scale: heroScale }}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, oklch(0.38 0.12 265 / 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, oklch(0.62 0.18 35 / 0.05) 0%, transparent 50%)",
        }}
      />

      <FloatingShapes />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-32 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/20 bg-primary/5 text-primary"
            >
              <GraduationCap className="mr-1.5 h-3.5 w-3.5 inline" />
              Zamonaviy ta'lim platformasi
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
              <span className="text-foreground">Bilim olishning</span>
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, oklch(0.38 0.12 265), oklch(0.62 0.18 35))",
                }}
              >
                yangi davri
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
              O'quv Markazi — o'qituvchilar va o'quvchilar uchun yagona platforma.
              Kurslar yarating, testlar tuzing, natijalarni tahlil qiling.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            {!isLoading &&
              (isAuthenticated ? (
                <Button
                  size="lg"
                  className="h-12 px-8 text-base gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboardga kirish
                  <ChevronRight className="h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base gap-2 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                    onClick={() => navigate("/auth")}
                  >
                    Bepul boshlash
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-8 text-base gap-2 rounded-xl border-border/60 hover:border-border"
                    onClick={() => navigate("/auth")}
                  >
                    <PlayCircle className="h-5 w-5" />
                    Qanday ishlaydi
                  </Button>
                </>
              ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-16 max-w-3xl mx-auto"
          >
            {[
              { value: "500+", label: "Faol kurslar" },
              { value: "10K+", label: "O'quvchilar" },
              { value: "98%", label: "Mamnuniyat" },
              { value: "50+", label: "O'qituvchilar" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </motion.section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Layers,
      title: "Kurs boshqaruvi",
      description:
        "Modulli kurslar yarating, darslarni tartibga soling va kontentni Markdown formatida yozing. Barcha materiallar bir joyda.",
      color: "from-blue-500/20 to-blue-600/10",
      accent: "text-blue-500",
    },
    {
      icon: ClipboardCheck,
      title: "Test tizimi",
      description:
        "Bir necha turdagi savollar bilan testlar tuzing. Avtomatik baholash, vaqt cheklovi va natijalar tahlili.",
      color: "from-emerald-500/20 to-emerald-600/10",
      accent: "text-emerald-500",
    },
    {
      icon: FileText,
      title: "Uy vazifalari",
      description:
        "PDF, DOCX va Markdown formatida topshiriqlar qabul qiling. Baholash va fikr-mulohaza bilan qayta topshirish imkoniyati.",
      color: "from-amber-500/20 to-amber-600/10",
      accent: "text-amber-500",
    },
    {
      icon: Users,
      title: "Guruhlar bilan ishlash",
      description:
        "O'quvchilarni kurslarga yozing, guruhlar tuzing va har bir o'quvchining progressini kuzatib boring.",
      color: "from-violet-500/20 to-violet-600/10",
      accent: "text-violet-500",
    },
    {
      icon: BookOpen,
      title: "Markdown editor",
      description:
        "Live preview bilan MD editor. Rasm va fayllarni joylang, avvalgi .docx fayllarni avtomatik MD ga o'tkazing.",
      color: "from-rose-500/20 to-rose-600/10",
      accent: "text-rose-500",
    },
    {
      icon: LineChart,
      title: "Analitika",
      description:
        "O'zlashtirish statistikasi, test natijalari tahlili, faollik hisobotlari va batafsil analitik ma'lumotlar.",
      color: "from-cyan-500/20 to-cyan-600/10",
      accent: "text-cyan-500",
    },
  ];

  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/20 bg-primary/5 text-primary"
            >
              Imkoniyatlar
            </Badge>
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-4xl font-bold tracking-tight"
          >
            Platformaning asosiy imkoniyatlari
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto text-lg text-muted-foreground"
          >
            O'qituvchilar va o'quvchilar uchun barcha kerakli vositalar
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
            >
              <Card className="group relative h-full border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 overflow-hidden">
                {/* Icon area */}
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${feature.color} ${feature.accent} mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.accent}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>

                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${feature.color} opacity-[0.03]`}
                />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Ro'yxatdan o'ting",
      description: "Bir necha soniyada o'qituvchi yoki o'quvchi sifatida profilingizni yarating.",
      icon: GraduationCap,
    },
    {
      step: "02",
      title: "Kurslar yarating",
      description: "Modullar va darslar bilan to'liq kurslar tuzing. Matn, test va topshiriqlarni qo'shing.",
      icon: Layers,
    },
    {
      step: "03",
      title: "O'quvchilarni qo'shing",
      description: "O'quvchilarni kurslarga yozing va ularning progressini kuzatib boring.",
      icon: Users,
    },
    {
      step: "04",
      title: "Natijalarni tahlil qiling",
      description: "Test natijalari, topshiriq baholari va o'zlashtirish ko'rsatkichlarini monitoring qiling.",
      icon: LineChart,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="relative py-24 sm:py-32 bg-gradient-to-b from-background via-muted/30 to-background"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/20 bg-primary/5 text-primary"
            >
              Jarayon
            </Badge>
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-4xl font-bold tracking-tight"
          >
            Qanday ishlaydi
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto text-lg text-muted-foreground"
          >
            To'rt oddiy qadamda boshlang
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView="visible"
              viewport={{ once: true }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="relative text-center group"
            >
              {/* Step number */}
              <div className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-110 transition-all duration-300">
                <span className="text-lg font-bold text-primary-foreground">
                  {step.step}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "500+", label: "Faol kurslar", suffix: "ta" },
    { value: "10K+", label: "O'quvchilar", suffix: "nafar" },
    { value: "98%", label: "O'quvchilar mamnuniyati", suffix: "" },
    { value: "50+", label: "Malakali o'qituvchilar", suffix: "nafar" },
  ];

  return (
    <section
      id="stats"
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.38 0.12 265 / 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="text-center mb-16 space-y-4"
        >
          <motion.div variants={itemVariants}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-xs font-medium rounded-full border-primary/20 bg-primary/5 text-primary"
            >
              Statistika
            </Badge>
          </motion.div>
          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-4xl font-bold tracking-tight"
          >
            Platformamiz raqamlarda
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="max-w-2xl mx-auto text-lg text-muted-foreground"
          >
            O'zbekistondagi eng tez rivojlanayotgan ta'lim platformasi
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView="visible"
              viewport={{ once: true }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="relative"
            >
              <Card className="text-center border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    {stat.value}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section id="cta" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.2 0.06 260) 0%, oklch(0.38 0.12 265) 50%, oklch(0.32 0.1 250) 100%)",
            }}
          />

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView="visible"
              viewport={{ once: true }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-6 max-w-3xl mx-auto"
            >
              <Badge className="px-4 py-1.5 text-xs font-medium rounded-full bg-white/10 text-white border-white/20 hover:bg-white/15">
                Boshlashga tayyormisiz?
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Ta'limni yangi bosqichga ko'taring
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                O'z bilimlaringizni ulashing, o'quvchilaringizning muvaffaqiyatini kuzating.
                Bepul boshlang, hech qanday kredit karta kerak emas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                {!isLoading &&
                  (isAuthenticated ? (
                    <Button
                      size="lg"
                      className="h-12 px-8 text-base gap-2 rounded-xl bg-white text-primary hover:bg-white/90 shadow-xl"
                      onClick={() => navigate("/dashboard")}
                    >
                      Dashboardga kirish
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        className="h-12 px-8 text-base gap-2 rounded-xl bg-accent text-accent-foreground hover:opacity-90 shadow-xl shadow-accent/30"
                        onClick={() => navigate("/auth")}
                      >
                        Bepul boshlash
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 px-8 text-base gap-2 rounded-xl border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                        onClick={() => navigate("/auth")}
                      >
                        <PlayCircle className="h-5 w-5" />
                        Demo ko'rish
                      </Button>
                    </>
                  ))}
              </div>
              <p className="text-sm text-white/50">
                Ro'yxatdan o'tish 30 soniya vaqt oladi
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="O'quv Markazi"
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="font-semibold">O'quv Markazi</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Zamonaviy ta'lim platformasi. O'qituvchilar va o'quvchilar uchun
              eng yaxshi vositalar bilan ta'lim sifatini yangi bosqichga
              ko'taring.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Platforma</h4>
            <ul className="space-y-2">
              {["Kurslar", "Testlar", "Topshiriqlar", "Narxlar"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Qo'llab-quvvatlash</h4>
            <ul className="space-y-2">
              {["Yordam", "FAQ", "Aloqa", "Maxfiylik"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 O'quv Markazi. Barcha huquqlar himoyalangan.
          </p>
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://freebuff.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              freebuff.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </motion.div>
  );
}
