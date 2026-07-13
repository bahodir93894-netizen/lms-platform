import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES, lessonTypeValidator } from "./schema";

/** Create a lesson */
export const create = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.string(),
    type: lessonTypeValidator,
    contentMd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Only teachers can create lessons");
    }

    const module = await ctx.db.get(args.moduleId);
    if (!module) throw new Error("Module not found");

    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    // Get current max order
    const existing = await ctx.db
      .query("lessons")
      .withIndex("moduleId", (q) => q.eq("moduleId", args.moduleId))
      .order("desc")
      .first();

    const newOrder = existing ? existing.order + 1 : 0;

    return await ctx.db.insert("lessons", {
      moduleId: args.moduleId,
      title: args.title,
      type: args.type,
      order: newOrder,
      contentMd: args.contentMd,
    });
  },
});

/** Update a lesson */
export const update = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    type: v.optional(lessonTypeValidator),
    contentMd: v.optional(v.string()),
    order: v.optional(v.number()),
    isFreePreview: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const module = await ctx.db.get(lesson.moduleId);
    if (!module) throw new Error("Module not found");
    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.lessonId, {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.type !== undefined && { type: args.type }),
      ...(args.contentMd !== undefined && { contentMd: args.contentMd }),
      ...(args.order !== undefined && { order: args.order }),
      ...(args.isFreePreview !== undefined && {
        isFreePreview: args.isFreePreview,
      }),
    });
  },
});

/** Delete a lesson */
export const remove = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const module = await ctx.db.get(lesson.moduleId);
    if (!module) throw new Error("Module not found");
    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    // Clean up related data
    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();
    if (quiz) await ctx.db.delete(quiz._id);

    const assignment = await ctx.db
      .query("assignments")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();
    if (assignment) await ctx.db.delete(assignment._id);

    const materials = await ctx.db
      .query("materials")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    for (const m of materials) await ctx.db.delete(m._id);

    await ctx.db.delete(args.lessonId);
  },
});

/** Mark lesson as completed */
export const markComplete = mutation({
  args: {
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("lessonStudent", (q) =>
        q.eq("lessonId", args.lessonId).eq("studentId", user._id),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("lessonProgress", {
        lessonId: args.lessonId,
        studentId: user._id,
        completedAt: Date.now(),
      });
    }
  },
});

/** Get lesson progress for a student */
export const getProgress = query({
  args: {
    courseId: v.id("courses"),
    studentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const studentId = args.studentId || user._id;

    // Get all modules and lessons for the course
    const modules = await ctx.db
      .query("modules")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    const allLessons = [];
    for (const mod of modules) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("moduleId", (q) => q.eq("moduleId", mod._id))
        .collect();
      allLessons.push(...lessons);
    }

    // Get progress for all lessons
    const progress = [];
    for (const lesson of allLessons) {
      const prog = await ctx.db
        .query("lessonProgress")
        .withIndex("lessonStudent", (q) =>
          q.eq("lessonId", lesson._id).eq("studentId", studentId),
        )
        .first();
      progress.push({
        lessonId: lesson._id,
        completed: !!prog?.completedAt,
        completedAt: prog?.completedAt ?? null,
      });
    }

    return progress;
  },
});
