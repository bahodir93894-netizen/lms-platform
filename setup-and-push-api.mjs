#!/usr/bin/env node
/**
 * LMS API - GitHub ga generatsiya va push qilish skripti
 * 
 * Ishga tushirish:
 *   node setup-and-push-api.mjs <github_token>
 *
 * Bu skript:
 *   1. /home/project/lms-api/ papkasida to'liq API repo'sini yaratadi
 *   2. npm install qiladi
 *   3. GitHub'ga push qiladi
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import simpleGit from "simple-git";

const API_DIR = "/home/project/lms-api";

// ─── Fayl yozish helper ───────────────────────────────────────
function writeFile(relativePath, content) {
  const fullPath = path.join(API_DIR, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trimStart(), "utf-8");
  console.log(`  📝 ${relativePath}`);
}

// ─── Barcha fayllarni yaratish ────────────────────────────────
function generateProject() {
  console.log("\n  📁 LMS API generatsiya qilinmoqda...\n");

  // package.json
  writeFile("package.json", `{
  "name": "lms-api",
  "version": "1.0.0",
  "description": "LMS REST API",
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
}`);

  // tsconfig.json
  writeFile("tsconfig.json", `{
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
}`);

  // .env.example
  writeFile(".env.example", `# Convex deployment URL
CONVEX_URL=https://your-project.convex.site
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
API_PREFIX=/api`);

  // .gitignore
  writeFile(".gitignore", `node_modules/
dist/
.env
*.log
.DS_Store`);

  // src/config.ts
  writeFile("src/config.ts", `export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  convexUrl: process.env.CONVEX_URL || "",
  jwtSecret: process.env.JWT_SECRET || "",
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],
  apiPrefix: process.env.API_PREFIX || "/api",
} as const;`);

  // src/convex.ts
  writeFile("src/convex.ts", `import { ConvexHttpClient } from "convex/browser";
import { config } from "./config.js";
let client = null;
export function getConvexClient() {
  if (!client) {
    if (!config.convexUrl) throw new Error("CONVEX_URL is required");
    client = new ConvexHttpClient(config.convexUrl);
  }
  return client;
}
export async function convexQuery(fn, args = {}, authToken) {
  const c = getConvexClient();
  if (authToken) c.setAuth(authToken);
  try { return await c.query(fn, args); } finally { if (authToken) c.clearAuth(); }
}
export async function convexMutation(fn, args = {}, authToken) {
  const c = getConvexClient();
  if (authToken) c.setAuth(authToken);
  try { return await c.mutation(fn, args); } finally { if (authToken) c.clearAuth(); }
}`);

  // src/middleware/auth.ts
  writeFile("src/middleware/auth.ts", `import jwt from "jsonwebtoken";
export function optionalAuth(req, _res, next) {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    req.authToken = h.slice(7);
    try { const d = jwt.decode(req.authToken); if (d) { req.authPayload = d; req.userId = d.sub; } } catch {}
  }
  next();
}
export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.authToken = h.slice(7);
  try { const d = jwt.decode(req.authToken); if (d) { req.authPayload = d; req.userId = d.sub; } } catch {}
  next();
}`);

  // src/middleware/error.ts
  writeFile("src/middleware/error.ts", `export class AppError extends Error {
  constructor(statusCode, message, details) { super(message); this.statusCode = statusCode; this.details = details; }
}
export function errorHandler(err, _req, res, _next) {
  console.error("[ERROR]", err);
  if (err instanceof AppError) return res.status(err.statusCode).json({ error: err.name, message: err.message });
  if (err.message?.includes("Not authenticated")) return res.status(401).json({ error: "Unauthorized" });
  if (err.message?.includes("Not authorized")) return res.status(403).json({ error: "Forbidden" });
  res.status(500).json({ error: "Internal Error", message: process.env.NODE_ENV === "production" ? "Server error" : err.message });
}
export function notFoundHandler(_req, res) { res.status(404).json({ error: "Not Found" }); }`);

  // src/swagger.ts
  writeFile("src/swagger.ts", `import swaggerJsdoc from "swagger-jsdoc";
const def = {
  openapi: "3.0.0",
  info: { title: "LMS REST API", version: "1.0.0", description: "O'quv Markazi LMS - REST API" },
  servers: [{ url: "http://localhost:3001", description: "Development" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    schemas: {
      Course: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, slug: { type: "string" }, status: { type: "string" } } },
      Module: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, order: { type: "number" } } },
      Lesson: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, type: { type: "string" } } },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};
export const swaggerSpec = swaggerJsdoc({ definition: def, apis: ["./src/routes/*.ts"] });`);

  // src/index.ts
  writeFile("src/index.ts", `import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { swaggerSpec } from "./swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { optionalAuth } from "./middleware/auth.js";
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
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: ".swagger-ui .topbar { display: none }" }));
app.get("/docs.json", (req, res) => res.json(swaggerSpec));

const a = config.apiPrefix;
app.use(a + "/courses", coursesRouter);
app.use(a + "/modules", modulesRouter);
app.use(a + "/lessons", lessonsRouter);
app.use(a + "/enrollments", enrollmentsRouter);
app.use(a + "/quizzes", quizzesRouter);
app.use(a + "/assignments", assignmentsRouter);
app.use(a + "/submissions", submissionsRouter);
app.use(a + "/users", usersRouter);
app.use(a + "/analytics", analyticsRouter);
app.use(a + "/certificates", certificatesRouter);
app.use(a + "/notifications", notificationsRouter);
app.use(a + "/imports", importsRouter);
app.use(a + "/materials", materialsRouter);
app.get(a + "/health", (req, res) => res.json({ status: "ok" }));

app.use(notFoundHandler);
app.use(errorHandler);
app.listen(config.port, () => {
  console.log("Server: http://localhost:" + config.port);
  console.log("Docs:  http://localhost:" + config.port + "/docs");
});
export default app;`);

  // ─── Routes ─────────────────────────────────────────────────
  
  writeFile("src/routes/courses.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/", async (req, res, next) => { try { res.json(await convexQuery("courses:listPublished", {})); } catch(e) { next(e); } });
r.get("/:slug", async (req, res, next) => { try { const c = await convexQuery("courses:getBySlug", { slug: req.params.slug }); if (!c) return res.status(404).json({ error: "Not Found" }); res.json(c); } catch(e) { next(e); } });
r.get("/mine/teacher", async (req, res, next) => { try { res.json(await convexQuery("courses:myCourses", {}, req.authToken)); } catch(e) { next(e); } });
r.get("/enrolled/mine", async (req, res, next) => { try { res.json(await convexQuery("courses:myEnrolledCourses", {}, req.authToken)); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { title, slug, description } = req.body; const id = await convexMutation("courses:create", { title, slug, description }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.patch("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("courses:update", { courseId: req.params.id, ...req.body }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("courses:remove", { courseId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/:id/publish", requireAuth, async (req, res, next) => { try { await convexMutation("courses:togglePublish", { courseId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/enrollments.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.post("/:courseId", requireAuth, async (req, res, next) => { try { const id = await convexMutation("enrollments:enroll", { courseId: req.params.courseId }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.delete("/:courseId", requireAuth, async (req, res, next) => { try { await convexMutation("enrollments:unenroll", { courseId: req.params.courseId }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.get("/:courseId/check", async (req, res, next) => { try { res.json({ enrolled: await convexQuery("enrollments:isEnrolled", { courseId: req.params.courseId }, req.authToken) }); } catch(e) { next(e); } });
r.get("/:courseId/count", async (req, res, next) => { try { res.json({ count: await convexQuery("enrollments:count", { courseId: req.params.courseId }) }); } catch(e) { next(e); } });
r.get("/:courseId/students", requireAuth, async (req, res, next) => { try { res.json(await convexQuery("enrollments:listStudents", { courseId: req.params.courseId }, req.authToken)); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/modules.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/course/:courseId", async (req, res, next) => { try { res.json(await convexQuery("modules:listByCourse", { courseId: req.params.courseId })); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { courseId, title } = req.body; const id = await convexMutation("modules:create", { courseId, title }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.patch("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("modules:update", { moduleId: req.params.id, ...req.body }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("modules:remove", { moduleId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/reorder", requireAuth, async (req, res, next) => { try { await convexMutation("modules:reorder", { moduleIds: req.body.moduleIds }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/lessons.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.post("/", requireAuth, async (req, res, next) => { try { const { moduleId, title, type, contentMd } = req.body; const id = await convexMutation("lessons:create", { moduleId, title, type, contentMd }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.patch("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("lessons:update", { lessonId: req.params.id, ...req.body }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("lessons:remove", { lessonId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/:id/complete", requireAuth, async (req, res, next) => { try { await convexMutation("lessons:markComplete", { lessonId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.get("/progress/:courseId", async (req, res, next) => { try { res.json(await convexQuery("lessons:getProgress", { courseId: req.params.courseId }, req.authToken)); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/quizzes.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/lesson/:lessonId", async (req, res, next) => { try { const q = await convexQuery("quizzes:getByLesson", { lessonId: req.params.lessonId }); if (!q) return res.status(404).json({ error: "Not Found" }); res.json(q); } catch(e) { next(e); } });
r.get("/lesson/:lessonId/teacher", requireAuth, async (req, res, next) => { try { const q = await convexQuery("quizzes:getByLessonTeacher", { lessonId: req.params.lessonId }, req.authToken); if (!q) return res.status(404).json({ error: "Not Found" }); res.json(q); } catch(e) { next(e); } });
r.get("/:id", async (req, res, next) => { try { const q = await convexQuery("quizzes:getById", { quizId: req.params.id }); if (!q) return res.status(404).json({ error: "Not Found" }); res.json(q); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { lessonId, title, timeLimitMin, passScore, maxAttempts, shuffleQuestions } = req.body; const id = await convexMutation("quizzes:upsert", { lessonId, title, timeLimitMin, passScore, maxAttempts, shuffleQuestions }, req.authToken); res.json({ _id: id }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("quizzes:remove", { quizId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/:quizId/questions", requireAuth, async (req, res, next) => { try { const { type, textMd, points, options } = req.body; const id = await convexMutation("quizzes:addQuestion", { quizId: req.params.quizId, type, textMd, points, options }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.patch("/questions/:questionId", requireAuth, async (req, res, next) => { try { const { type, textMd, points, options } = req.body; await convexMutation("quizzes:updateQuestion", { questionId: req.params.questionId, type, textMd, points, options }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.delete("/questions/:questionId", requireAuth, async (req, res, next) => { try { await convexMutation("quizzes:removeQuestion", { questionId: req.params.questionId }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/:quizId/attempts/start", requireAuth, async (req, res, next) => { try { const id = await convexMutation("quizzes:startAttempt", { quizId: req.params.quizId }, req.authToken); res.json({ _id: id }); } catch(e) { next(e); } });
r.get("/:quizId/attempts/current", async (req, res, next) => { try { res.json(await convexQuery("quizzes:getCurrentAttempt", { quizId: req.params.quizId }, req.authToken)); } catch(e) { next(e); } });
r.get("/:quizId/attempts/mine", async (req, res, next) => { try { res.json(await convexQuery("quizzes:getMyAttempts", { quizId: req.params.quizId }, req.authToken)); } catch(e) { next(e); } });
r.get("/:quizId/attempts", requireAuth, async (req, res, next) => { try { res.json(await convexQuery("quizzes:listAttempts", { quizId: req.params.quizId }, req.authToken)); } catch(e) { next(e); } });
r.post("/attempts/:attemptId/answer", requireAuth, async (req, res, next) => { try { const { questionId, selectedOptionIds, textAnswer } = req.body; const id = await convexMutation("quizzes:saveAnswer", { attemptId: req.params.attemptId, questionId, selectedOptionIds, textAnswer }, req.authToken); res.json({ _id: id }); } catch(e) { next(e); } });
r.post("/attempts/:attemptId/submit", requireAuth, async (req, res, next) => { try { const r2 = await convexMutation("quizzes:submitAttempt", { attemptId: req.params.attemptId }, req.authToken); res.json(r2); } catch(e) { next(e); } });
r.get("/attempts/:attemptId", async (req, res, next) => { try { const a = await convexQuery("quizzes:getAttempt", { attemptId: req.params.attemptId }, req.authToken); if (!a) return res.status(404).json({ error: "Not Found" }); res.json(a); } catch(e) { next(e); } });
r.post("/answers/:answerId/grade", requireAuth, async (req, res, next) => { try { const { isCorrect, earnedPoints } = req.body; await convexMutation("quizzes:gradeQuestion", { answerId: req.params.answerId, isCorrect, earnedPoints }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/assignments.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/lesson/:lessonId", async (req, res, next) => { try { const a = await convexQuery("assignments:getByLesson", { lessonId: req.params.lessonId }); if (!a) return res.status(404).json({ error: "Not Found" }); res.json(a); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { lessonId, title, descriptionMd, maxScore, dueAt } = req.body; const id = await convexMutation("assignments:upsert", { lessonId, title, descriptionMd, maxScore, dueAt }, req.authToken); res.json({ _id: id }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("assignments:remove", { assignmentId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/submissions.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/assignment/:assignmentId", requireAuth, async (req, res, next) => { try { res.json(await convexQuery("submissions:listByAssignment", { assignmentId: req.params.assignmentId }, req.authToken)); } catch(e) { next(e); } });
r.get("/mine/:assignmentId", async (req, res, next) => { try { res.json(await convexQuery("submissions:mySubmissions", { assignmentId: req.params.assignmentId }, req.authToken)); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { assignmentId, textMd, fileStorageId } = req.body; const id = await convexMutation("submissions:submit", { assignmentId, textMd, fileStorageId }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.post("/:id/grade", requireAuth, async (req, res, next) => { try { const { score, feedbackMd } = req.body; await convexMutation("submissions:grade", { submissionId: req.params.id, score, feedbackMd }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/:id/return", requireAuth, async (req, res, next) => { try { await convexMutation("submissions:returnSubmission", { submissionId: req.params.id, feedbackMd: req.body.feedbackMd }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/users.ts", `import { Router } from "express";
import { convexQuery } from "../convex.js";
const r = Router();
r.get("/me", async (req, res, next) => { try { const u = await convexQuery("users:currentUser", {}, req.authToken); if (!u) return res.status(401).json({ error: "Unauthorized" }); res.json(u); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/analytics.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/platform", requireAuth, async (req, res, next) => { try { res.json(await convexQuery("analytics:getPlatformStats", {}, req.authToken)); } catch(e) { next(e); } });
r.get("/users", requireAuth, async (req, res, next) => { try { res.json(await convexQuery("analytics:listAllUsers", {}, req.authToken)); } catch(e) { next(e); } });
r.patch("/users/:userId/role", requireAuth, async (req, res, next) => { try { await convexMutation("analytics:updateUserRole", { userId: req.params.userId, role: req.body.role }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.delete("/users/:userId", requireAuth, async (req, res, next) => { try { await convexMutation("analytics:removeUser", { userId: req.params.userId }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.get("/courses", requireAuth, async (req, res, next) => { try { res.json(await convexQuery("analytics:listAllCourses", {}, req.authToken)); } catch(e) { next(e); } });
r.get("/courses/:courseId/stats", requireAuth, async (req, res, next) => { try { res.json(await convexQuery("analytics:getCourseStats", { courseId: req.params.courseId }, req.authToken)); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/certificates.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/", async (req, res, next) => { try { res.json(await convexQuery("certificates:myCertificates", {}, req.authToken)); } catch(e) { next(e); } });
r.get("/:certificateId", async (req, res, next) => { try { const c = await convexQuery("certificates:getById", { certificateId: req.params.certificateId }); if (!c) return res.status(404).json({ error: "Not Found" }); res.json(c); } catch(e) { next(e); } });
r.post("/generate/:courseId", requireAuth, async (req, res, next) => { try { const id = await convexMutation("certificates:generate", { courseId: req.params.courseId }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.get("/check/:courseId", async (req, res, next) => { try { res.json(await convexQuery("certificates:canGenerate", { courseId: req.params.courseId }, req.authToken)); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/notifications.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/", async (req, res, next) => { try { const limit = req.query.limit ? parseInt(req.query.limit) : undefined; res.json(await convexQuery("notifications:list", { limit }, req.authToken)); } catch(e) { next(e); } });
r.get("/unread-count", async (req, res, next) => { try { res.json({ unreadCount: await convexQuery("notifications:unreadCount", {}, req.authToken) }); } catch(e) { next(e); } });
r.post("/:id/read", requireAuth, async (req, res, next) => { try { await convexMutation("notifications:markRead", { notificationId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/read-all", requireAuth, async (req, res, next) => { try { await convexMutation("notifications:markAllRead", {}, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/imports.ts", `import { Router } from "express";
import { convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.post("/markdown", requireAuth, async (req, res, next) => { try { const { lessonId, contentMd, title } = req.body; await convexMutation("imports:importMarkdown", { lessonId, contentMd, title }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/quiz", requireAuth, async (req, res, next) => { try { const { lessonId, quizText } = req.body; res.json(await convexMutation("imports:importQuiz", { lessonId, quizText }, req.authToken)); } catch(e) { next(e); } });
export default r;`);

  writeFile("src/routes/materials.ts", `import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/lesson/:lessonId", async (req, res, next) => { try { res.json(await convexQuery("materials:listByLesson", { lessonId: req.params.lessonId })); } catch(e) { next(e); } });
r.get("/course/:courseId", async (req, res, next) => { try { res.json(await convexQuery("materials:listByCourse", { courseId: req.params.courseId })); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes } = req.body; const id = await convexMutation("materials:create", { title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("materials:remove", { materialId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;`);

  // README.md
  writeFile("README.md", `# LMS REST API

Express.js + TypeScript + JWT auth + Swagger docs

## Ishga tushirish

\`\`\`bash
cp .env.example .env
# .env faylini ochib CONVEX_URL ni yozing
npm install
npm run dev
\`\`\`

## API hujjati

Ishga tushgandan so'ng: http://localhost:3001/docs
`);

  console.log("\n  ✅ Barcha fayllar yaratildi!\n");
}

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error("\n  ❌ GitHub token kerak!");
    console.error("  Usage: node setup-and-push-api.mjs <github_token>\n");
    process.exit(1);
  }

  // Step 1: Generate project
  fs.mkdirSync(API_DIR, { recursive: true });
  generateProject();

  // Step 2: npm install
  console.log("  📦 npm install qilinmoqda...");
  execSync("npm install", { cwd: API_DIR, stdio: "pipe" });
  console.log("  ✅ npm install tugadi!\n");

  // Step 3: Create GitHub repo & push
  console.log("  🔑 GitHub repozitoriy yaratilmoqda...");
  const username = "bahodir93894-netizen";
  const repoName = "lms-api";
  
  try {
    execSync(
      `curl -s -X POST -H "Authorization: token ${token}" \
        -H "Content-Type: application/json" \
        -d '{"name":"${repoName}","description":"LMS REST API - Express.js + Convex","private":false}' \
        https://api.github.com/user/repos`,
      { stdio: "pipe" }
    );
    console.log("  ✅ Repo yaratildi!");
  } catch (e) {
    // Repo already exists probably
    console.log("  ℹ️  Repo allaqachon mavjud (yoki xatolik)");
  }

  const git = simpleGit(API_DIR);
  await git.init();
  await git.addConfig("user.name", "LMS API");
  await git.addConfig("user.email", "lms@example.com");
  await git.add(".");
  await git.commit("Initial commit: LMS REST API");
  await git.addRemote("origin", `https://${token}@github.com/${username}/${repoName}.git`);
  await git.push("origin", "main");

  console.log("\n  ✅ GitHub ga yuklandi!");
  console.log(`  🌐 https://github.com/${username}/${repoName}`);
  console.log("");
  console.log("  📋 O'z kompyuteringizda ishga tushirish:");
  console.log(`  git clone https://github.com/${username}/${repoName}.git`);
  console.log("  cd lms-api");
  console.log("  cp .env.example .env");
  console.log("  npm install");
  console.log("  npm run dev\n");
}

main().catch((err) => {
  console.error("\n  ❌ Xatolik:", err.message);
  process.exit(1);
});
