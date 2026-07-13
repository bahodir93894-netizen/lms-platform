import { Router } from "express";
import { convexQuery } from "../convex.js";
const r = Router();
r.get("/me", async (req, res, next) => { try { const u = await convexQuery("users:currentUser", {}, req.authToken); if (!u) return res.status(401).json({ error: "Unauthorized" }); res.json(u); } catch(e) { next(e); } });
export default r;