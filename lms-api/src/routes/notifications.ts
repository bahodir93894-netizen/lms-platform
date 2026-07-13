import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/", async (req, res, next) => { try { const limit = req.query.limit ? parseInt(req.query.limit) : undefined; res.json(await convexQuery("notifications:list", { limit }, req.authToken)); } catch(e) { next(e); } });
r.get("/unread-count", async (req, res, next) => { try { res.json({ unreadCount: await convexQuery("notifications:unreadCount", {}, req.authToken) }); } catch(e) { next(e); } });
r.post("/:id/read", requireAuth, async (req, res, next) => { try { await convexMutation("notifications:markRead", { notificationId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/read-all", requireAuth, async (req, res, next) => { try { await convexMutation("notifications:markAllRead", {}, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;