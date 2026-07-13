import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/assignments/lesson/{lessonId}:
 *   get:
 *     tags: [Assignments]
 *     summary: Dars topshirig'ini olish
 *     security: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Topshiriq ma'lumotlari
 */
router.get("/lesson/:lessonId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await convexQuery("assignments:getByLesson", {
      lessonId: req.params.lessonId,
    });
    if (!assignment) {
      res.status(404).json({ error: "Not Found", message: "Assignment not found" });
      return;
    }
    res.json(assignment);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/assignments:
 *   post:
 *     tags: [Assignments]
 *     summary: Topshiriq yaratish/yangilash
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lessonId, title, descriptionMd]
 *             properties:
 *               lessonId: { type: string }
 *               title: { type: string }
 *               descriptionMd: { type: string }
 *               maxScore: { type: number }
 *               dueAt: { type: number }
 *     responses:
 *       200:
 *         description: Topshiriq ID
 */
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId, title, descriptionMd, maxScore, dueAt } = req.body;
    const assignmentId = await convexMutation(
      "assignments:upsert",
      { lessonId, title, descriptionMd, maxScore, dueAt },
      req.authToken
    );
    res.json({ _id: assignmentId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/assignments/{id}:
 *   delete:
 *     tags: [Assignments]
 *     summary: Topshiriqni o'chirish
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
    await convexMutation("assignments:remove", { assignmentId: req.params.id }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
