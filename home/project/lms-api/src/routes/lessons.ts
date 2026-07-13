import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/lessons:
 *   post:
 *     tags: [Lessons]
 *     summary: Yangi dars yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleId, title, type]
 *             properties:
 *               moduleId: { type: string }
 *               title: { type: string }
 *               type: { type: string, enum: [text, video, quiz, assignment, file] }
 *               contentMd: { type: string }
 *     responses:
 *       201:
 *         description: Dars ID
 */
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { moduleId, title, type, contentMd } = req.body;
    const lessonId = await convexMutation(
      "lessons:create",
      { moduleId, title, type, contentMd },
      req.authToken
    );
    res.status(201).json({ _id: lessonId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/lessons/{id}:
 *   patch:
 *     tags: [Lessons]
 *     summary: Darsni yangilash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yangilandi
 */
router.patch("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation(
      "lessons:update",
      { lessonId: req.params.id, ...req.body },
      req.authToken
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/lessons/{id}:
 *   delete:
 *     tags: [Lessons]
 *     summary: Darsni o'chirish
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
    await convexMutation(
      "lessons:remove",
      { lessonId: req.params.id },
      req.authToken
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/lessons/{id}/complete:
 *   post:
 *     tags: [Lessons]
 *     summary: Darsni tugallangan deb belgilash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Belgilandi
 */
router.post("/:id/complete", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation(
      "lessons:markComplete",
      { lessonId: req.params.id },
      req.authToken
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/lessons/progress/{courseId}:
 *   get:
 *     tags: [Lessons]
 *     summary: Dars progressini olish
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progress ma'lumotlari
 */
router.get("/progress/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const progress = await convexQuery(
      "lessons:getProgress",
      { courseId: req.params.courseId },
      req.authToken
    );
    res.json(progress);
  } catch (err) {
    next(err);
  }
});

export default router;
