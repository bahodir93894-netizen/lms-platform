import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/lesson/:lessonId", async (req, res, next) => { try { res.json(await convexQuery("materials:listByLesson", { lessonId: req.params.lessonId })); } catch(e) { next(e); } });
r.get("/course/:courseId", async (req, res, next) => { try { res.json(await convexQuery("materials:listByCourse", { courseId: req.params.courseId })); } catch(e) { next(e); } });
r.post("/", requireAuth, async (req, res, next) => { try { const { title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes } = req.body; const id = await convexMutation("materials:create", { title, lessonId, courseId, storageId, originalName, mimeType, sizeBytes }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.delete("/:id", requireAuth, async (req, res, next) => { try { await convexMutation("materials:remove", { materialId: req.params.id }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
export default r;