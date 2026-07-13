import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/** Get assignment for a lesson */
export const getByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assignments")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();
  },
});

/** Get assignment by ID */
export const getById = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.assignmentId);
  },
});

/** Create or update assignment for a lesson */
export const upsert = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.string(),
    descriptionMd: v.string(),
    dueAt: v.optional(v.number()),
    maxScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Only teachers can manage assignments");
    }

    // Verify ownership
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");
    const module = await ctx.db.get(lesson.moduleId);
    if (!module) throw new Error("Module not found");
    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const existing = await ctx.db
      .query("assignments")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        descriptionMd: args.descriptionMd,
        dueAt: args.dueAt,
        maxScore: args.maxScore ?? 100,
      });
      return existing._id;
    }

    return await ctx.db.insert("assignments", {
      lessonId: args.lessonId,
      title: args.title,
      descriptionMd: args.descriptionMd,
      dueAt: args.dueAt,
      maxScore: args.maxScore ?? 100,
    });
  },
});

/** Delete assignment */
export const remove = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const lesson = await ctx.db.get(assignment.lessonId);
    if (!lesson) throw new Error("Lesson not found");
    const module = await ctx.db.get(lesson.moduleId);
    if (!module) throw new Error("Module not found");
    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    // Delete all submissions for this assignment
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignmentId", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();
    for (const sub of submissions) {
      await ctx.db.delete(sub._id);
    }

    await ctx.db.delete(args.assignmentId);
  },
});
