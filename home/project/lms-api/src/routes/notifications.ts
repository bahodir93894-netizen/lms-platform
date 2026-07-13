import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Bildirishnomalar ro'yxati
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Bildirishnomalar
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const notifications = await convexQuery("notifications:list", { limit }, req.authToken);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: O'qilmagan bildirishnomalar soni
 *     responses:
 *       200:
 *         description: Soni
 */
router.get("/unread-count", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await convexQuery("notifications:unreadCount", {}, req.authToken);
    res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Bildirishnomani o'qilgan deb belgilash
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
router.post("/:id/read", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("notifications:markRead", {
      notificationId: req.params.id,
    }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: Barchasini o'qilgan deb belgilash
 *     responses:
 *       200:
 *         description: Belgilandi
 */
router.post("/read-all", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("notifications:markAllRead", {}, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
