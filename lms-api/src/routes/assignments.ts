import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/lesson/:lessonId", async (req, res, next) => { try { const a = await convexQuery("assignments:getByLesson", { lessonId: req.params.lessonId }); if (!a) return res.status(404).json({ error: "Not Found" }); res.json(a); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { lessonId, title, descriptionMd, maxScore, dueAt } = req.body; const id = await convexMutation("assignments:upsert", { lessonId, title, descriptionMd, maxScore, dueAt }, req.authToken); res.json({ _id: id }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("assignments:remove", { assignmentId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;