import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/submissions/assignment/{assignmentId}:
 *   get:
 *     tags: [Submissions]
 *     summary: Topshiriq bo'yicha barcha javoblar (teacher)
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Javoblar ro'yxati
 */
router.get("/assignment/:assignmentId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await convexQuery("submissions:listByAssignment", {
      assignmentId: req.params.assignmentId,
    }, req.authToken);
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/submissions/mine/{assignmentId}:
 *   get:
 *     tags: [Submissions]
 *     summary: Mening javoblarim
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Javoblar
 */
router.get("/mine/:assignmentId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const submissions = await convexQuery("submissions:mySubmissions", {
      assignmentId: req.params.assignmentId,
    }, req.authToken);
    res.json(submissions);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/submissions:
 *   post:
 *     tags: [Submissions]
 *     summary: Javob yuborish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignmentId]
 *             properties:
 *               assignmentId: { type: string }
 *               textMd: { type: string }
 *               fileStorageId: { type: string }
 *     responses:
 *       201:
 *         description: Javob ID
 */
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, textMd, fileStorageId } = req.body;
    const submissionId = await convexMutation("submissions:submit", {
      assignmentId, textMd, fileStorageId,
    }, req.authToken);
    res.status(201).json({ _id: submissionId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/submissions/{id}/grade:
 *   post:
 *     tags: [Submissions]
 *     summary: Javobni baholash (teacher)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [score]
 *             properties:
 *               score: { type: number }
 *               feedbackMd: { type: string }
 *     responses:
 *       200:
 *         description: Baholandi
 */
router.post("/:id/grade", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { score, feedbackMd } = req.body;
    await convexMutation("submissions:grade", {
      submissionId: req.params.id, score, feedbackMd,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/submissions/{id}/return:
 *   post:
 *     tags: [Submissions]
 *     summary: Javobni qaytarish (teacher)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               feedbackMd: { type: string }
 *     responses:
 *       200:
 *         description: Qaytarildi
 */
router.post("/:id/return", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("submissions:returnSubmission", {
      submissionId: req.params.id,
      feedbackMd: req.body.feedbackMd,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
