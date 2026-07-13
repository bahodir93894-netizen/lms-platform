import jwt from "jsonwebtoken";
export function optionalAuth(req, _res, next) {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    req.authToken = h.slice(7);
    try { const d = jwt.decode(req.authToken); if (d) { req.authPayload = d; req.userId = d.sub; } } catch {}
  }
  next();
}
export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  req.authToken = h.slice(7);
  try { const d = jwt.decode(req.authToken); if (d) { req.authPayload = d; req.userId = d.sub; } } catch {}
  next();
}