import { Router, Request, Response, NextFunction } from "express";
import { convexQuery } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Joriy foydalanuvchi ma'lumotlari
 *     responses:
 *       200:
 *         description: Foydalanuvchi ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await convexQuery("users:currentUser", {}, req.authToken);
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "Not authenticated" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
