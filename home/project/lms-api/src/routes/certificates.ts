import { Router, Request, Response, NextFunction } from "express";
import { convexQuery, convexMutation } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/certificates:
 *   get:
 *     tags: [Certificates]
 *     summary: Mening sertifikatlarim
 *     responses:
 *       200:
 *         description: Sertifikatlar ro'yxati
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificates = await convexQuery("certificates:myCertificates", {}, req.authToken);
    res.json(certificates);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/certificates/{certificateId}:
 *   get:
 *     tags: [Certificates]
 *     summary: Sertifikatni olish
 *     security: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sertifikat ma'lumotlari
 */
router.get("/:certificateId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certificate = await convexQuery("certificates:getById", {
      certificateId: req.params.certificateId,
    });
    if (!certificate) {
      res.status(404).json({ error: "Not Found", message: "Certificate not found" });
      return;
    }
    res.json(certificate);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/certificates/generate/{courseId}:
 *   post:
 *     tags: [Certificates]
 *     summary: Sertifikat yaratish
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Sertifikat ID
 */
router.post("/generate/:courseId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certId = await convexMutation("certificates:generate", {
      courseId: req.params.courseId,
    }, req.authToken);
    res.status(201).json({ _id: certId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/certificates/check/{courseId}:
 *   get:
 *     tags: [Certificates]
 *     summary: Sertifikat olish mumkinligini tekshirish
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tekshiruv natijasi
 */
router.get("/check/:courseId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await convexQuery("certificates:canGenerate", {
      courseId: req.params.courseId,
    }, req.authToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
