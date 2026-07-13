import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/enrollments/{courseId}:
 *   post:
 *     tags: [Enrollments]
 *     summary: Kursga yozilish
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Yozildi
 *       400:
 *         description: Allaqachon yozilgan
 */
router.post("/:courseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollmentId = await convexMutation(
      "enrollments:enroll",
      { courseId: req.params.courseId },
      req.authToken
    );
    res.status(201).json({ _id: enrollmentId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/enrollments/{courseId}:
 *   delete:
 *     tags: [Enrollments]
 *     summary: Kursdan chiqish
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chiqildi
 */
router.delete("/:courseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation(
      "enrollments:unenroll",
      { courseId: req.params.courseId },
      req.authToken
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/enrollments/{courseId}/check:
 *   get:
 *     tags: [Enrollments]
 *     summary: Kursga yozilganligini tekshirish
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Yozilgan/yo'q
 */
router.get("/:courseId/check", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrolled = await convexQuery(
      "enrollments:isEnrolled",
      { courseId: req.params.courseId },
      req.authToken
    );
    res.json({ enrolled });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/enrollments/{courseId}/count:
 *   get:
 *     tags: [Enrollments]
 *     summary: Kursdagi o'quvchilar soni
 *     security: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'quvchilar soni
 */
router.get("/:courseId/count", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await convexQuery(
      "enrollments:count",
      { courseId: req.params.courseId }
    );
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/enrollments/{courseId}/students:
 *   get:
 *     tags: [Enrollments]
 *     summary: Kursdagi o'quvchilar ro'yxati (teacher/admin)
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'quvchilar ro'yxati
 */
router.get("/:courseId/students", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const students = await convexQuery(
      "enrollments:listStudents",
      { courseId: req.params.courseId },
      req.authToken
    );
    res.json(students);
  } catch (err) {
    next(err);
  }
});

export default router;
