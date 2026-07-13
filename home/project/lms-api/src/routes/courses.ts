import { Router, Request, Response, NextFunction } from "express";
import { convexQuery } from "../convex.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags: [Courses]
 *     summary: Published kurslar ro'yxati
 *     security: []
 *     responses:
 *       200:
 *         description: Published kurslar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Course'
 */
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await convexQuery("courses:listPublished", {});
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/courses/{slug}:
 *   get:
 *     tags: [Courses]
 *     summary: Kursni slug bo'yicha olish
 *     security: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kurs ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Course'
 *       404:
 *         description: Kurs topilmadi
 */
router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await convexQuery("courses:getBySlug", { slug: req.params.slug });
    if (!course) {
      res.status(404).json({ error: "Not Found", message: "Course not found" });
      return;
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/courses/mine:
 *   get:
 *     tags: [Courses]
 *     summary: Mening kurslarim (o'qituvchi uchun)
 *     responses:
 *       200:
 *         description: O'qituvchining kurslari
 */
router.get("/mine/teacher", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await convexQuery("courses:myCourses", {}, req.authToken);
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/courses/enrolled/mine:
 *   get:
 *     tags: [Courses]
 *     summary: Men yozilgan kurslar (student uchun)
 *     responses:
 *       200:
 *         description: Student yozilgan kurslar
 */
router.get("/enrolled/mine", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courses = await convexQuery("courses:myEnrolledCourses", {}, req.authToken);
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/courses:
 *   post:
 *     tags: [Courses]
 *     summary: Yangi kurs yaratish
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug]
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course ID
 */
router.post("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, slug, description } = req.body;
    const courseId = await convexMutation(
      "courses:create",
      { title, slug, description },
      req.authToken
    );
    res.status(201).json({ _id: courseId });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/courses/{id}:
 *   patch:
 *     tags: [Courses]
 *     summary: Kursni yangilash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               slug: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [draft, published] }
 *     responses:
 *       200:
 *         description: Yangilandi
 */
router.patch("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("courses:update", { courseId: req.params.id, ...req.body }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/courses/{id}:
 *   delete:
 *     tags: [Courses]
 *     summary: Kursni o'chirish
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: O'chirildi
 */
router.delete("/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("courses:remove", { courseId: req.params.id }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /api/courses/{id}/publish:
 *   post:
 *     tags: [Courses]
 *     summary: Kursni nashr qilish/olib tashlash
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status o'zgartirildi
 */
router.post("/:id/publish", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await convexMutation("courses:togglePublish", { courseId: req.params.id }, req.authToken);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

import { convexMutation } from "../convex.js";

export default router;
