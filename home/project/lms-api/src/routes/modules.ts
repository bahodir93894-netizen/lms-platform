import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/modules/course/{courseId}:
 *   get:
 *     tags: [Modules]
 *     summary: Kurs modullari ro'yxati
 *     security: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Modullar va ularning darslari
 */
router.get("/course/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modules = await convexQuery("modules:listByCourse", {
      courseId: req.params.courseId,
    });
    res.json(modules);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/modules:
 *   post:
 *     tags: [Modules]
 *     summary: Yangi modul yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [courseId, title]
 *             properties:
 *               courseId: { type: string }
 *               title: { type: string }
 *     responses:
 *       201:
 *         description: Modul ID
 */
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, title } = req.body;
    const moduleId = await convexMutation(
      "modules:create",
      { courseId, title },
      req.authToken
    );
    res.status(201).json({ _id: moduleId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/modules/{id}:
 *   patch:
 *     tags: [Modules]
 *     summary: Modulni yangilash
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
      "modules:update",
      { moduleId: req.params.id, ...req.body },
      req.authToken
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/modules/{id}:
 *   delete:
 *     tags: [Modules]
 *     summary: Modulni o'chirish
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
      "modules:remove",
      { moduleId: req.params.id },
      req.authToken
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/modules/reorder:
 *   post:
 *     tags: [Modules]
 *     summary: Modullarni qayta tartiblash
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [moduleIds]
 *             properties:
 *               moduleIds:
 *                 type: array
 *                 items: { type: string }
 *     responses:
 *       200:
 *         description: Tartiblandi
 */
router.post("/reorder", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation(
      "modules:reorder",
      { moduleIds: req.body.moduleIds },
      req.authToken
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
