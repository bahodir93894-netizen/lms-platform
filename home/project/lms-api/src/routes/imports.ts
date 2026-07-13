import { Router, Request, Response, NextFunction } from "express";
import { convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/imports/markdown:
 *   post:
 *     tags: [Imports]
 *     summary: Markdown kontentni import qilish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, contentMd]
 *             properties:
 *               lessonId: { type: string }
 *               contentMd: { type: string }
 *               title: { type: string }
 *     responses:
 *       200:
 *         description: Import qilindi
 */
router.post("/markdown", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId, contentMd, title } = req.body;
    await convexMutation("imports:importMarkdown", {
      lessonId, contentMd, title,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/imports/quiz:
 *   post:
 *     tags: [Imports]
 *     summary: Testni matn formatidan import qilish
 *     description: |
 *       Format:
 *       ```
 *       ? Savol matni
 *       * To'g'ri javob
 *       - Noto'g'ri javob
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, quizText]
 *             properties:
 *               lessonId: { type: string }
 *               quizText: { type: string }
 *     responses:
 *       200:
 *         description: Import qilindi
 */
router.post("/quiz", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId, quizText } = req.body;
    const result = await convexMutation("imports:importQuiz", {
      lessonId, quizText,
    }, req.authToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
