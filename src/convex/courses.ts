import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES, courseStatusValidator } from "./schema";

// ─── Queries ─────────────────────────────────────────────────

/** List published courses (for public catalog) */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db
      .query("courses")
      .withIndex("status", (q) => q.eq("status", "published"))
      .collect();

    return Promise.all(
      courses.map(async (course) => {
        const teacher = await ctx.db.get(course.teacherId);
        const moduleCount = (
          await ctx.db
            .query("modules")
            .withIndex("courseId", (q) => q.eq("courseId", course._id))
            .collect()
        ).length;

        return {
          ...course,
          teacherName: teacher?.name || teacher?.firstName || "Unknown",
          moduleCount,
        };
      }),
    );
  },
});

/** Get a single course by slug */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!course) return null;

    const teacher = await ctx.db.get(course.teacherId);
    const modules = await ctx.db
      .query("modules")
      .withIndex("courseId", (q) => q.eq("courseId", course._id))
      .order("asc")
      .collect();

    // Get lessons for each module
    const modulesWithLessons = await Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("moduleId", (q) => q.eq("moduleId", module._id))
          .order("asc")
          .collect();
        return { ...module, lessons };
      }),
    );

    return {
      ...course,
      teacherName: teacher?.name || teacher?.firstName || "Unknown",
      modules: modulesWithLessons,
    };
  },
});

/** Get courses taught by the current teacher */
export const myCourses = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const courses = await ctx.db
      .query("courses")
      .withIndex("teacherId", (q) => q.eq("teacherId", user._id))
      .collect();

    return Promise.all(
      courses.map(async (course) => {
        const moduleCount = (
          await ctx.db
            .query("modules")
            .withIndex("courseId", (q) => q.eq("courseId", course._id))
            .collect()
        ).length;
        const enrollmentCount = (
          await ctx.db
            .query("enrollments")
            .withIndex("courseId", (q) => q.eq("courseId", course._id))
            .collect()
        ).length;

        return { ...course, moduleCount, enrollmentCount };
      }),
    );
  },
});

/** Get student's enrolled courses */
export const myEnrolledCourses = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("studentId", (q) => q.eq("studentId", user._id))
      .collect();

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await ctx.db.get(enrollment.courseId);
        if (!course) return null;
        const teacher = await ctx.db.get(course.teacherId);
        const moduleCount = (
          await ctx.db
            .query("modules")
            .withIndex("courseId", (q) => q.eq("courseId", course._id))
            .collect()
        ).length;

        return {
          enrollment,
          course: {
            ...course,
            teacherName: teacher?.name || teacher?.firstName || "Unknown",
            moduleCount,
          },
        };
      }),
    ).then((results) => results.filter(Boolean));
  },
});

// ─── Mutations ────────────────────────────────────────────────

/** Create a new course (teacher or admin only) */
export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Only teachers can create courses");
    }

    // Check slug uniqueness
    const existing = await ctx.db
      .query("courses")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("A course with this slug already exists");

    const courseId = await ctx.db.insert("courses", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      status: "draft",
      teacherId: user._id,
    });

    return courseId;
  },
});

/** Update a course */
export const update = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(courseStatusValidator),
    coverStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    // Only teacher (owner) or admin can update
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.courseId, {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.slug !== undefined && { slug: args.slug }),
      ...(args.description !== undefined && { description: args.description }),
      ...(args.status !== undefined && { status: args.status }),
      ...(args.coverStorageId !== undefined && {
        coverStorageId: args.coverStorageId,
      }),
    });
  },
});

/** Delete a course */
export const remove = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    // Delete related modules, lessons, enrollments, etc.
    const modules = await ctx.db
      .query("modules")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    for (const module of modules) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("moduleId", (q) => q.eq("moduleId", module._id))
        .collect();

      for (const lesson of lessons) {
        // Delete quiz, assignment, progress, materials for each lesson
        const quiz = await ctx.db
          .query("quizzes")
          .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
          .first();
        if (quiz) await ctx.db.delete(quiz._id);

        const assignment = await ctx.db
          .query("assignments")
          .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
          .first();
        if (assignment) await ctx.db.delete(assignment._id);

        const materials = await ctx.db
          .query("materials")
          .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
          .collect();
        for (const m of materials) await ctx.db.delete(m._id);

        await ctx.db.delete(lesson._id);
      }

      await ctx.db.delete(module._id);
    }

    // Delete enrollments
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
    for (const e of enrollments) await ctx.db.delete(e._id);

    await ctx.db.delete(args.courseId);
  },
});

/** Publish/unpublish a course */
export const togglePublish = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const newStatus =
      course.status === "published" ? "draft" : "published";
    await ctx.db.patch(args.courseId, { status: newStatus });
  },
});
