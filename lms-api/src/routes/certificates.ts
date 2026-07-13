import { Router } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";
const r = Router();
r.get("/", async (req, res, next) => { try { res.json(await convexQuery("certificates:myCertificates", {}, req.authToken)); } catch(e) { next(e); } });
r.get("/:certificateId", async (req, res, next) => { try { const c = await convexQuery("certificates:getById", { certificateId: req.params.certificateId }); if (!c) return res.status(404).json({ error: "Not Found" }); res.json(c); } catch(e) { next(e); } });
r.post("/generate/:courseId", requireAuth, async (req, res, next) => { try { const id = await convexMutation("certificates:generate", { courseId: req.params.courseId }, req.authToken); res.status(201).json({ _id: id }); } catch(e) { next(e); } });
r.get("/check/:courseId", async (req, res, next) => { try { res.json(await convexQuery("certificates:canGenerate", { courseId: req.params.courseId }, req.authToken)); } catch(e) { next(e); } });
export default r;