#!/usr/bin/env bash
#
# LMS API generator script
# Ishga tushirish: bash generate-api.sh
# Natija: ../lms-api/ papkasida to'liq REST API
#

set -e

BASE="../lms-api"
echo "📦 LMS REST API generatsiya qilinmoqda: $BASE"

mkdir -p "$BASE/src/routes"
mkdir -p "$BASE/src/middleware"

# ─── package.json ─────────────────────────────────────────────
cat > "$BASE/package.json" << 'EOF'
{
  "name": "lms-api",
  "version": "1.0.0",
  "description": "O'quv Markazi LMS - REST API",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "convex": "^1.30.0",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "swagger-ui-express": "^5.0.1",
    "swagger-jsdoc": "^6.2.8",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.1",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.15.3",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.8",
    "tsx": "^4.19.4",
    "typescript": "~5.9.3"
  }
}
EOF

# ─── tsconfig.json ────────────────────────────────────────────
cat > "$BASE/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# ─── .env.example ─────────────────────────────────────────────
cat > "$BASE/.env.example" << 'EOF'
# Convex deployment URL (convex.json yoki dashboard dan oling)
CONVEX_URL=https://your-project.convex.site

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# API
API_PREFIX=/api
EOF

# ─── .gitignore ───────────────────────────────────────────────
cat > "$BASE/.gitignore" << 'EOF'
node_modules/
dist/
.env
*.log
.DS_Store
EOF

# ─── src/config.ts ────────────────────────────────────────────
cat > "$BASE/src/config.ts" << 'EOF'
export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  convexUrl: process.env.CONVEX_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],
  apiPrefix: process.env.API_PREFIX || "/api",
} as const;
EOF

# ─── src/convex.ts ────────────────────────────────────────────
cat > "$BASE/src/convex.ts" << 'CEOF'
import { ConvexHttpClient } from "convex/browser";
import { config } from "./config.js";

let client: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!client) {
    if (!config.convexUrl) {
      throw new Error("CONVEX_URL environment variable is required");
    }
    client = new ConvexHttpClient(config.convexUrl);
  }
  return client;
}

export async function convexQuery<T>(
  functionPath: string,
  args: Record<string, unknown> = {},
  authToken?: string
): Promise<T> {
  const c = getConvexClient();
  if (authToken) c.setAuth(authToken);
  try {
    return await c.query(functionPath as any, args) as T;
  } finally {
    if (authToken) c.clearAuth();
  }
}

export async function convexMutation<T>(
  functionPath: string,
  args: Record<string, unknown> = {},
  authToken?: string
): Promise<T> {
  const c = getConvexClient();
  if (authToken) c.setAuth(authToken);
  try {
    return await c.mutation(functionPath as any, args) as T;
  } finally {
    if (authToken) c.clearAuth();
  }
}
CEOF

# ─── src/middleware/auth.ts ────────────────────────────────────
cat > "$BASE/src/middleware/auth.ts" << 'AEOF'
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload { sub?: string; sid?: string; }

declare global {
  namespace Express {
    interface Request { authToken?: string; authPayload?: AuthPayload; userId?: string; }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    req.authToken = authHeader.slice(7);
    try { const d = jwt.decode(req.authToken) as AuthPayload; if (d) { req.authPayload = d; req.userId = d.sub; } } catch {}
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "Bearer token required" });
    return;
  }
  req.authToken = authHeader.slice(7);
  try { const d = jwt.decode(req.authToken) as AuthPayload; if (d) { req.authPayload = d; req.userId = d.sub; } } catch {}
  next();
}
AEOF

# ─── src/middleware/error.ts ───────────────────────────────────
cat > "$BASE/src/middleware/error.ts" << 'EEOF'
import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(public statusCode: number, message: string, public details?: unknown) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[ERROR]", err);
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.name, message: err.message, details: err.details });
    return;
  }
  if (err.message?.includes("Not authenticated")) { res.status(401).json({ error: "Unauthorized", message: "Authentication required" }); return; }
  if (err.message?.includes("Not authorized")) { res.status(403).json({ error: "Forbidden", message: "Permission denied" }); return; }
  if (err.message?.includes("Not found") || err.message?.includes("not found")) { res.status(404).json({ error: "Not Found", message: err.message }); return; }
  res.status(500).json({ error: "Internal Server Error", message: process.env.NODE_ENV === "production" ? "Server error" : err.message });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Not Found", message: "Endpoint does not exist" });
}
EEOF

# ─── src/swagger.ts ───────────────────────────────────────────
cat > "$BASE/src/swagger.ts" << 'SEOF'
import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "LMS REST API",
    version: "1.0.0",
    description: "O'quv Markazi LMS - to'liq REST API. Endpointlarga qarang: /api/health",
  },
  servers: [{ url: "http://localhost:3001", description: "Development" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Course: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, slug: { type: "string" }, status: { type: "string" } } },
      Module: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, order: { type: "number" } } },
      Lesson: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, type: { type: "string" }, contentMd: { type: "string" } } },
      Error: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};

export const swaggerSpec = swaggerJsdoc({ definition: swaggerDefinition, apis: ["./src/routes/*.ts"] });
SEOF

# ─── src/index.ts ─────────────────────────────────────────────
cat > "$BASE/src/index.ts" << 'IEOF'
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { swaggerSpec } from "./swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { optionalAuth } from "./middleware/auth.js";

// Import all route modules
import coursesRouter from "./routes/courses.js";
import modulesRouter from "./routes/modules.js";
import lessonsRouter from "./routes/lessons.js";
import enrollmentsRouter from "./routes/enrollments.js";
import quizzesRouter from "./routes/quizzes.js";
import assignmentsRouter from "./routes/assignments.js";
import submissionsRouter from "./routes/submissions.js";
import usersRouter from "./routes/users.js";
import analyticsRouter from "./routes/analytics.js";
import certificatesRouter from "./routes/certificates.js";
import notificationsRouter from "./routes/notifications.js";
import importsRouter from "./routes/imports.js";
import materialsRouter from "./routes/materials.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(optionalAuth);

// Swagger docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: ".swagger-ui .topbar { display: none }", customSiteTitle: "LMS API Docs" }));
app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

// API routes
const api = config.apiPrefix;
app.use(\`\${api}/courses\`, coursesRouter);
app.use(\`\${api}/modules\`, modulesRouter);
app.use(\`\${api}/lessons\`, lessonsRouter);
app.use(\`\${api}/enrollments\`, enrollmentsRouter);
app.use(\`\${api}/quizzes\`, quizzesRouter);
app.use(\`\${api}/assignments\`, assignmentsRouter);
app.use(\`\${api}/submissions\`, submissionsRouter);
app.use(\`\${api}/users\`, usersRouter);
app.use(\`\${api}/analytics\`, analyticsRouter);
app.use(\`\${api}/certificates\`, certificatesRouter);
app.use(\`\${api}/notifications\`, notificationsRouter);
app.use(\`\${api}/imports\`, importsRouter);
app.use(\`\${api}/materials\`, materialsRouter);

// Health check
app.get(\`\${api}/health\`, (_req, res) => res.json({ status: "ok", timestamp: Date.now() }));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(\`Server: http://localhost:\${config.port}\`);
  console.log(\`API:    http://localhost:\${config.port}\${api}\`);
  console.log(\`Docs:   http://localhost:\${config.port}/docs\`);
});

export default app;
IEOF

# ─── Routes ───────────────────────────────────────────────────

# courses.ts
cat > "$BASE/src/routes/courses.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try { const courses = await convexQuery("courses:listPublished", {}); res.json(courses); } catch (e) { next(e); }
});

router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try { const course = await convexQuery("courses:getBySlug", { slug: req.params.slug }); if (!course) { res.status(404).json({ error: "Not Found" }); return; } res.json(course); } catch (e) { next(e); }
});

router.get("/mine/teacher", async (req: Request, res: Response, next: NextFunction) => {
  try { const courses = await convexQuery("courses:myCourses", {}, req.authToken); res.json(courses); } catch (e) { next(e); }
});

router.get("/enrolled/mine", async (req: Request, res: Response, next: NextFunction) => {
  try { const courses = await convexQuery("courses:myEnrolledCourses", {}, req.authToken); res.json(courses); } catch (e) { next(e); }
});

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { title, slug, description } = req.body; const id = await convexMutation("courses:create", { title, slug, description }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});

router.patch("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("courses:update", { courseId: req.params.id, ...req.body }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("courses:remove", { courseId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.post("/:id/publish", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("courses:togglePublish", { courseId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

export default router;
REOF

# enrollments.ts
cat > "$BASE/src/routes/enrollments.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.post("/:courseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const id = await convexMutation("enrollments:enroll", { courseId: req.params.courseId }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});

router.delete("/:courseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("enrollments:unenroll", { courseId: req.params.courseId }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.get("/:courseId/check", async (req: Request, res: Response, next: NextFunction) => {
  try { const enrolled = await convexQuery("enrollments:isEnrolled", { courseId: req.params.courseId }, req.authToken); res.json({ enrolled }); } catch (e) { next(e); }
});

router.get("/:courseId/count", async (_req: Request, res: Response, next: NextFunction) => {
  try { const count = await convexQuery("enrollments:count", { courseId: _req.params.courseId }); res.json({ count }); } catch (e) { next(e); }
});

router.get("/:courseId/students", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const students = await convexQuery("enrollments:listStudents", { courseId: req.params.courseId }, req.authToken); res.json(students); } catch (e) { next(e); }
});

export default router;
REOF

# modules.ts
cat > "$BASE/src/routes/modules.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try { const modules = await convexQuery("modules:listByCourse", { courseId: req.params.courseId }); res.json(modules); } catch (e) { next(e); }
});

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { courseId, title } = req.body; const id = await convexMutation("modules:create", { courseId, title }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});

router.patch("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("modules:update", { moduleId: req.params.id, ...req.body }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("modules:remove", { moduleId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.post("/reorder", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("modules:reorder", { moduleIds: req.body.moduleIds }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

export default router;
REOF

# lessons.ts
cat > "$BASE/src/routes/lessons.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { moduleId, title, type, contentMd } = req.body; const id = await convexMutation("lessons:create", { moduleId, title, type, contentMd }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});

router.patch("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("lessons:update", { lessonId: req.params.id, ...req.body }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("lessons:remove", { lessonId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.post("/:id/complete", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("lessons:markComplete", { lessonId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

router.get("/progress/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try { const progress = await convexQuery("lessons:getProgress", { courseId: req.params.courseId }, req.authToken); res.json(progress); } catch (e) { next(e); }
});

export default router;
REOF

# quizzes.ts
cat > "$BASE/src/routes/quizzes.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

// Quiz CRUD
router.get("/lesson/:lessonId", async (req: Request, res: Response, next: NextFunction) => {
  try { const q = await convexQuery("quizzes:getByLesson", { lessonId: req.params.lessonId }); if (!q) { res.status(404).json({ error: "Not Found" }); return; } res.json(q); } catch (e) { next(e); }
});
router.get("/lesson/:lessonId/teacher", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const q = await convexQuery("quizzes:getByLessonTeacher", { lessonId: req.params.lessonId }, req.authToken); if (!q) { res.status(404).json({ error: "Not Found" }); return; } res.json(q); } catch (e) { next(e); }
});
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try { const q = await convexQuery("quizzes:getById", { quizId: req.params.id }); if (!q) { res.status(404).json({ error: "Not Found" }); return; } res.json(q); } catch (e) { next(e); }
});
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { lessonId, title, timeLimitMin, passScore, maxAttempts, shuffleQuestions } = req.body; const id = await convexMutation("quizzes:upsert", { lessonId, title, timeLimitMin, passScore, maxAttempts, shuffleQuestions }, req.authToken); res.json({ _id: id }); } catch (e) { next(e); }
});
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("quizzes:remove", { quizId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

// Questions
router.post("/:quizId/questions", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { type, textMd, points, options } = req.body; const id = await convexMutation("quizzes:addQuestion", { quizId: req.params.quizId, type, textMd, points, options }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});
router.patch("/questions/:questionId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { type, textMd, points, options } = req.body; await convexMutation("quizzes:updateQuestion", { questionId: req.params.questionId, type, textMd, points, options }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});
router.delete("/questions/:questionId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("quizzes:removeQuestion", { questionId: req.params.questionId }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

// Attempts
router.post("/:quizId/attempts/start", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const id = await convexMutation("quizzes:startAttempt", { quizId: req.params.quizId }, req.authToken); res.json({ _id: id }); } catch (e) { next(e); }
});
router.get("/:quizId/attempts/current", async (req: Request, res: Response, next: NextFunction) => {
  try { const a = await convexQuery("quizzes:getCurrentAttempt", { quizId: req.params.quizId }, req.authToken); res.json(a); } catch (e) { next(e); }
});
router.get("/:quizId/attempts/mine", async (req: Request, res: Response, next: NextFunction) => {
  try { const a = await convexQuery("quizzes:getMyAttempts", { quizId: req.params.quizId }, req.authToken); res.json(a); } catch (e) { next(e); }
});
router.get("/:quizId/attempts", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const a = await convexQuery("quizzes:listAttempts", { quizId: req.params.quizId }, req.authToken); res.json(a); } catch (e) { next(e); }
});
router.post("/attempts/:attemptId/answer", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { questionId, selectedOptionIds, textAnswer } = req.body; const id = await convexMutation("quizzes:saveAnswer", { attemptId: req.params.attemptId, questionId, selectedOptionIds, textAnswer }, req.authToken); res.json({ _id: id }); } catch (e) { next(e); }
});
router.post("/attempts/:attemptId/submit", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await convexMutation("quizzes:submitAttempt", { attemptId: req.params.attemptId }, req.authToken); res.json(r); } catch (e) { next(e); }
});
router.get("/attempts/:attemptId", async (req: Request, res: Response, next: NextFunction) => {
  try { const a = await convexQuery("quizzes:getAttempt", { attemptId: req.params.attemptId }, req.authToken); if (!a) { res.status(404).json({ error: "Not Found" }); return; } res.json(a); } catch (e) { next(e); }
});
router.post("/answers/:answerId/grade", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { isCorrect, earnedPoints } = req.body; await convexMutation("quizzes:gradeQuestion", { answerId: req.params.answerId, isCorrect, earnedPoints }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

export default router;
REOF

# assignments.ts
cat > "$BASE/src/routes/assignments.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/lesson/:lessonId", async (req: Request, res: Response, next: NextFunction) => {
  try { const a = await convexQuery("assignments:getByLesson", { lessonId: req.params.lessonId }); if (!a) { res.status(404).json({ error: "Not Found" }); return; } res.json(a); } catch (e) { next(e); }
});
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { lessonId, title, descriptionMd, maxScore, dueAt } = req.body; const id = await convexMutation("assignments:upsert", { lessonId, title, descriptionMd, maxScore, dueAt }, req.authToken); res.json({ _id: id }); } catch (e) { next(e); }
});
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("assignments:remove", { assignmentId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

export default router;
REOF

# submissions.ts
cat > "$BASE/src/routes/submissions.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/assignment/:assignmentId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const s = await convexQuery("submissions:listByAssignment", { assignmentId: req.params.assignmentId }, req.authToken); res.json(s); } catch (e) { next(e); }
});
router.get("/mine/:assignmentId", async (req: Request, res: Response, next: NextFunction) => {
  try { const s = await convexQuery("submissions:mySubmissions", { assignmentId: req.params.assignmentId }, req.authToken); res.json(s); } catch (e) { next(e); }
});
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { assignmentId, textMd, fileStorageId } = req.body; const id = await convexMutation("submissions:submit", { assignmentId, textMd, fileStorageId }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});
router.post("/:id/grade", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { score, feedbackMd } = req.body; await convexMutation("submissions:grade", { submissionId: req.params.id, score, feedbackMd }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});
router.post("/:id/return", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("submissions:returnSubmission", { submissionId: req.params.id, feedbackMd: req.body.feedbackMd }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

export default router;
REOF

# users.ts
cat > "$BASE/src/routes/users.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery } from "../convex.js";
const router = Router();

router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try { const user = await convexQuery("users:currentUser", {}, req.authToken); if (!user) { res.status(401).json({ error: "Unauthorized" }); return; } res.json(user); } catch (e) { next(e); }
});

export default router;
REOF

# analytics.ts
cat > "$BASE/src/routes/analytics.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/platform", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const s = await convexQuery("analytics:getPlatformStats", {}, req.authToken); res.json(s); } catch (e) { next(e); }
});
router.get("/users", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const u = await convexQuery("analytics:listAllUsers", {}, req.authToken); res.json(u); } catch (e) { next(e); }
});
router.patch("/users/:userId/role", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("analytics:updateUserRole", { userId: req.params.userId, role: req.body.role }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});
router.delete("/users/:userId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("analytics:removeUser", { userId: req.params.userId }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});
router.get("/courses", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const c = await convexQuery("analytics:listAllCourses", {}, req.authToken); res.json(c); } catch (e) { next(e); }
});
router.get("/courses/:courseId/stats", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const s = await convexQuery("analytics:getCourseStats", { courseId: req.params.courseId }, req.authToken); res.json(s); } catch (e) { next(e); }
});

export default router;
REOF

# certificates.ts
cat > "$BASE/src/routes/certificates.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try { const c = await convexQuery("certificates:myCertificates", {}, req.authToken); res.json(c); } catch (e) { next(e); }
});
router.get("/:certificateId", async (req: Request, res: Response, next: NextFunction) => {
  try { const c = await convexQuery("certificates:getById", { certificateId: req.params.certificateId }); if (!c) { res.status(404).json({ error: "Not Found" }); return; } res.json(c); } catch (e) { next(e); }
});
router.post("/generate/:courseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const id = await convexMutation("certificates:generate", { courseId: req.params.courseId }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});
router.get("/check/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await convexQuery("certificates:canGenerate", { courseId: req.params.courseId }, req.authToken); res.json(r); } catch (e) { next(e); }
});

export default router;
REOF

# notifications.ts
cat > "$BASE/src/routes/notifications.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try { const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined; const n = await convexQuery("notifications:list", { limit }, req.authToken); res.json(n); } catch (e) { next(e); }
});
router.get("/unread-count", async (req: Request, res: Response, next: NextFunction) => {
  try { const c = await convexQuery("notifications:unreadCount", {}, req.authToken); res.json({ unreadCount: c }); } catch (e) { next(e); }
});
router.post("/:id/read", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("notifications:markRead", { notificationId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});
router.post("/read-all", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("notifications:markAllRead", {}, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

export default router;
REOF

# imports.ts
cat > "$BASE/src/routes/imports.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.post("/markdown", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { lessonId, contentMd, title } = req.body; await convexMutation("imports:importMarkdown", { lessonId, contentMd, title }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});
router.post("/quiz", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { lessonId, quizText } = req.body; const r = await convexMutation("imports:importQuiz", { lessonId, quizText }, req.authToken); res.json(r); } catch (e) { next(e); }
});

export default router;
REOF

# materials.ts
cat > "$BASE/src/routes/materials.ts" << 'REOF'
import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();

router.get("/lesson/:lessonId", async (req: Request, res: Response, next: NextFunction) => {
  try { const m = await convexQuery("materials:listByLesson", { lessonId: req.params.lessonId }); res.json(m); } catch (e) { next(e); }
});
router.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try { const m = await convexQuery("materials:listByCourse", { courseId: req.params.courseId }); res.json(m); } catch (e) { next(e); }
});
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { const { title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes } = req.body; const id = await convexMutation("materials:create", { title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes }, req.authToken); res.status(201).json({ _id: id }); } catch (e) { next(e); }
});
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try { await convexMutation("materials:remove", { materialId: req.params.id }, req.authToken); res.json({ success: true }); } catch (e) { next(e); }
});

export default router;
REOF

# ─── README.md ────────────────────────────────────────────────
cat > "$BASE/README.md" << 'MDEOF'
# O'quv Markazi LMS - REST API

Express.js + TypeScript + JWT auth + Swagger docs

## Ishga tushirish

```bash
cp .env.example .env
# .env faylini ochib CONVEX_URL ni yozing
npm install
npm run dev
```

## API hujjati

Ishga tushgandan so'ng: http://localhost:3001/docs

## Endpointlar

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/courses | - |
| POST | /api/courses | ✅ |
| GET | /api/courses/:slug | - |
| POST | /api/enrollments/:courseId | ✅ |
| POST | /api/quizzes/:quizId/attempts/start | ✅ |
| POST | /api/quizzes/attempts/:id/submit | ✅ |
| GET | /api/users/me | - |
| GET | /api/analytics/platform | ✅ |

To'liq ro'yxat: http://localhost:3001/docs
MDEOF

echo ""
echo "✅ LMS API generatsiya qilindi: $BASE"
echo ""
echo "  Ishga tushirish:"
echo "  cd $BASE"
echo "  cp .env.example .env"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "  Swagger: http://localhost:3001/docs"
echo ""
