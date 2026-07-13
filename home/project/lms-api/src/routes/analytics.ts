import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/analytics/platform:
 *   get:
 *     tags: [Analytics]
 *     summary: Platforma statistikasi (admin)
 *     responses:
 *       200:
 *         description: Platforma statistikasi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PlatformStats'
 */
router.get("/platform", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await convexQuery("analytics:getPlatformStats", {}, req.authToken);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/analytics/users:
 *   get:
 *     tags: [Analytics]
 *     summary: Barcha foydalanuvchilar ro'yxati (admin)
 *     responses:
 *       200:
 *         description: Foydalanuvchilar ro'yxati
 */
router.get("/users", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await convexQuery("analytics:listAllUsers", {}, req.authToken);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/analytics/users/{userId}/role:
 *   patch:
 *     tags: [Analytics]
 *     summary: Foydalanuvchi rolini o'zgartirish (admin)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student]
 *     responses:
 *       200:
 *         description: O'zgartirildi
 */
router.patch("/users/:userId/role", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("analytics:updateUserRole", {
      userId: req.params.userId,
      role: req.body.role,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/analytics/users/{userId}:
 *   delete:
 *     tags: [Analytics]
 *     summary: Foydalanuvchini o'chirish (admin)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'chirildi
 */
router.delete("/users/:userId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("analytics:removeUser", {
      userId: req.params.userId,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/analytics/courses:
 *   get:
 *     tags: [Analytics]
 *     summary: Barcha kurslar ro'yxati (admin)
 *     responses:
 *       200:
 *         description: Kurslar ro'yxati
 */
router.get("/courses", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await convexQuery("analytics:listAllCourses", {}, req.authToken);
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/analytics/courses/{courseId}/stats:
 *   get:
 *     tags: [Analytics]
 *     summary: Kurs statistikasi
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kurs statistikasi
 */
router.get("/courses/:courseId/stats", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await convexQuery("analytics:getCourseStats", {
      courseId: req.params.courseId,
    }, req.authToken);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
