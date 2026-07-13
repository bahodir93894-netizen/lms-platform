import { Router } from "express";
import { convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.post("/markdown", requireAuth, async (req, res, next) => { try { const { lessonId, contentMd, title } = req.body; await convexMutation("imports:importMarkdown", { lessonId, contentMd, title }, req.authToken); res.json({ success: true }); } catch(e) { next(e); } });
r.post("/quiz", requireAuth, async (req, res, next) => { try { const { lessonId, quizText } = req.body; res.json(await convexMutation("imports:importQuiz", { lessonId, quizText }, req.authToken)); } catch(e) { next(e); } });
export default r;