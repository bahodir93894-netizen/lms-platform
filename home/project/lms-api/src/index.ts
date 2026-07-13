import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { swaggerSpec } from "./swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { optionalAuth } from "./middleware/auth.js";

// Routes
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

// ─── Global Middleware ────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Apply optional auth globally (endpoints can enforce auth as needed)
app.use(optionalAuth);

// ─── Swagger Docs ─────────────────────────────────────────────

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "LMS API Docs",
}));

// JSON endpoint for the OpenAPI spec
app.get("/docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────────────

const api = config.apiPrefix;

app.use(`${api}/courses`, coursesRouter);
app.use(`${api}/modules`, modulesRouter);
app.use(`${api}/lessons`, lessonsRouter);
app.use(`${api}/enrollments`, enrollmentsRouter);
app.use(`${api}/quizzes`, quizzesRouter);
app.use(`${api}/assignments`, assignmentsRouter);
app.use(`${api}/submissions`, submissionsRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/analytics`, analyticsRouter);
app.use(`${api}/certificates`, certificatesRouter);
app.use(`${api}/notifications`, notificationsRouter);
app.use(`${api}/imports`, importsRouter);
app.use(`${api}/materials`, materialsRouter);

// Health check
app.get(`${api}/health`, (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ─── Error Handling ───────────────────────────────────────────

app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     O'quv Markazi LMS - REST API        ║
  ║──────────────────────────────────────────║
  ║  Server: http://localhost:${config.port}       ║
  ║  API:    http://localhost:${config.port}${api}  ║
  ║  Docs:   http://localhost:${config.port}/docs  ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
