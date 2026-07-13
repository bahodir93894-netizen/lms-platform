import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/materials/lesson/{lessonId}:
 *   get:
 *     tags: [Materials]
 *     summary: Dars materiallari
 *     security: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Materiallar ro'yxati
 */
router.get("/lesson/:lessonId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materials = await convexQuery("materials:listByLesson", {
      lessonId: req.params.lessonId,
    });
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/materials/course/{courseId}:
 *   get:
 *     tags: [Materials]
 *     summary: Kurs materiallari
 *     security: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Materiallar ro'yxati
 */
router.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const materials = await convexQuery("materials:listByCourse", {
      courseId: req.params.courseId,
    });
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/materials:
 *   post:
 *     tags: [Materials]
 *     summary: Material qo'shish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, storageId, originalName, mimeType, sizeBytes]
 *             properties:
 *               title: { type: string }
 *               lessonId: { type: string }
 *               courseId: { type: string }
 *               storageId: { type: string }
 *               originalName: { type: string }
 *               mimeType: { type: string }
 *               sizeBytes: { type: number }
 *     responses:
 *       201:
 *         description: Material ID
 */
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes } = req.body;
    const materialId = await convexMutation("materials:create", {
      title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes,
    }, req.authToken);
    res.status(201).json({ _id: materialId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/materials/{id}:
 *   delete:
 *     tags: [Materials]
 *     summary: Materialni o'chirish
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
    await convexMutation("materials:remove", {
      materialId: req.params.id,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
