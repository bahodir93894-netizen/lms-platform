import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── Quiz CRUD ────────────────────────────────────────────────

/**
 * @openapi
 * /api/quizzes/lesson/{lessonId}:
 *   get:
 *     tags: [Quizzes]
 *     summary: Dars testini olish (student)
 *     security: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test ma'lumotlari (to'g'ri javobsiz)
 */
router.get("/lesson/:lessonId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await convexQuery("quizzes:getByLesson", {
      lessonId: req.params.lessonId,
    });
    if (!quiz) {
      res.status(404).json({ error: "Not Found", message: "Quiz not found" });
      return;
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/lesson/{lessonId}/teacher:
 *   get:
 *     tags: [Quizzes]
 *     summary: Dars testini olish (teacher, to'g'ri javob bilan)
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test ma'lumotlari (to'g'ri javob bilan)
 */
router.get("/lesson/:lessonId/teacher", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await convexQuery("quizzes:getByLessonTeacher", {
      lessonId: req.params.lessonId,
    }, req.authToken);
    if (!quiz) {
      res.status(404).json({ error: "Not Found", message: "Quiz not found" });
      return;
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/{id}:
 *   get:
 *     tags: [Quizzes]
 *     summary: Testni ID bo'yicha olish
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test ma'lumotlari
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quiz = await convexQuery("quizzes:getById", {
      quizId: req.params.id,
    });
    if (!quiz) {
      res.status(404).json({ error: "Not Found", message: "Quiz not found" });
      return;
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes:
 *   post:
 *     tags: [Quizzes]
 *     summary: Test yaratish/yangilash
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, title]
 *             properties:
 *               lessonId: { type: string }
 *               title: { type: string }
 *               timeLimitMin: { type: number }
 *               passScore: { type: number }
 *               maxAttempts: { type: number }
 *               shuffleQuestions: { type: boolean }
 *     responses:
 *       200:
 *         description: Test ID
 */
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId, title, timeLimitMin, passScore, maxAttempts, shuffleQuestions } = req.body;
    const quizId = await convexMutation("quizzes:upsert", {
      lessonId, title, timeLimitMin, passScore, maxAttempts, shuffleQuestions,
    }, req.authToken);
    res.json({ _id: quizId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/{id}:
 *   delete:
 *     tags: [Quizzes]
 *     summary: Testni o'chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'chirildi
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("quizzes:remove", { quizId: req.params.id }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Questions ────────────────────────────────────────────────

/**
 * @openapi
 * /api/quizzes/{quizId}/questions:
 *   post:
 *     tags: [Quizzes]
 *     summary: Savol qo'shish
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, textMd, options]
 *             properties:
 *               type: { type: string, enum: [single_choice, multiple_choice, true_false, short_answer] }
 *               textMd: { type: string }
 *               points: { type: number }
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     textMd: { type: string }
 *                     isCorrect: { type: boolean }
 *     responses:
 *       201:
 *         description: Savol ID
 */
router.post("/:quizId/questions", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, textMd, points, options } = req.body;
    const questionId = await convexMutation("quizzes:addQuestion", {
      quizId: req.params.quizId, type, textMd, points, options,
    }, req.authToken);
    res.status(201).json({ _id: questionId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/questions/{questionId}:
 *   patch:
 *     tags: [Quizzes]
 *     summary: Savolni yangilash
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yangilandi
 */
router.patch("/questions/:questionId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, textMd, points, options } = req.body;
    await convexMutation("quizzes:updateQuestion", {
      questionId: req.params.questionId, type, textMd, points, options,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/questions/{questionId}:
 *   delete:
 *     tags: [Quizzes]
 *     summary: Savolni o'chirish
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'chirildi
 */
router.delete("/questions/:questionId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("quizzes:removeQuestion", {
      questionId: req.params.questionId,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Quiz Attempts ────────────────────────────────────────────

/**
 * @openapi
 * /api/quizzes/{quizId}/attempts/start:
 *   post:
 *     tags: [Quizzes]
 *     summary: Testni boshlash
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt ID
 */
router.post("/:quizId/attempts/start", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attemptId = await convexMutation("quizzes:startAttempt", {
      quizId: req.params.quizId,
    }, req.authToken);
    res.json({ _id: attemptId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/{quizId}/attempts/current:
 *   get:
 *     tags: [Quizzes]
 *     summary: Joriy attemptni olish
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt ma'lumotlari
 */
router.get("/:quizId/attempts/current", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attempt = await convexQuery("quizzes:getCurrentAttempt", {
      quizId: req.params.quizId,
    }, req.authToken);
    res.json(attempt);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/{quizId}/attempts/mine:
 *   get:
 *     tags: [Quizzes]
 *     summary: Mening attemptlarim
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attemptlar ro'yxati
 */
router.get("/:quizId/attempts/mine", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attempts = await convexQuery("quizzes:getMyAttempts", {
      quizId: req.params.quizId,
    }, req.authToken);
    res.json(attempts);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/{quizId}/attempts:
 *   get:
 *     tags: [Quizzes]
 *     summary: Barcha attemptlar (teacher)
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attemptlar ro'yxati
 */
router.get("/:quizId/attempts", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attempts = await convexQuery("quizzes:listAttempts", {
      quizId: req.params.quizId,
    }, req.authToken);
    res.json(attempts);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/attempts/{attemptId}/answer:
 *   post:
 *     tags: [Quizzes]
 *     summary: Javobni saqlash
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               questionId: { type: string }
 *               selectedOptionIds: { type: array, items: { type: string } }
 *               textAnswer: { type: string }
 *     responses:
 *       200:
 *         description: Saqlandi
 */
router.post("/attempts/:attemptId/answer", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questionId, selectedOptionIds, textAnswer } = req.body;
    const answerId = await convexMutation("quizzes:saveAnswer", {
      attemptId: req.params.attemptId, questionId, selectedOptionIds, textAnswer,
    }, req.authToken);
    res.json({ _id: answerId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/attempts/{attemptId}/submit:
 *   post:
 *     tags: [Quizzes]
 *     summary: Testni topshirish
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Natija
 */
router.post("/attempts/:attemptId/submit", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await convexMutation("quizzes:submitAttempt", {
      attemptId: req.params.attemptId,
    }, req.authToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/attempts/{attemptId}:
 *   get:
 *     tags: [Quizzes]
 *     summary: Attempt detallarini olish
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt + javoblar
 */
router.get("/attempts/:attemptId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const attempt = await convexQuery("quizzes:getAttempt", {
      attemptId: req.params.attemptId,
    }, req.authToken);
    if (!attempt) {
      res.status(404).json({ error: "Not Found", message: "Attempt not found" });
      return;
    }
    res.json(attempt);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/quizzes/answers/{answerId}/grade:
 *   post:
 *     tags: [Quizzes]
 *     summary: Short answer savolini baholash (teacher)
 *     parameters:
 *       - in: path
 *         name: answerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isCorrect, earnedPoints]
 *             properties:
 *               isCorrect: { type: boolean }
 *               earnedPoints: { type: number }
 *     responses:
 *       200:
 *         description: Baholandi
 */
router.post("/answers/:answerId/grade", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isCorrect, earnedPoints } = req.body;
    await convexMutation("quizzes:gradeQuestion", {
      answerId: req.params.answerId, isCorrect, earnedPoints,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
