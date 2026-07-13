import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/** Get all modules for a course */
export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const modules = await ctx.db
      .query("modules")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .order("asc")
      .collect();

    return Promise.all(
      modules.map(async (module) => {
        const lessons = await ctx.db
          .query("lessons")
          .withIndex("moduleId", (q) => q.eq("moduleId", module._id))
          .order("asc")
          .collect();
        return { ...module, lessons };
      }),
    );
  },
});

/** Create a module */
export const create = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Only teachers can create modules");
    }

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    // Get current max order
    const existing = await ctx.db
      .query("modules")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .order("desc")
      .first();

    const newOrder = existing ? existing.order + 1 : 0;

    return await ctx.db.insert("modules", {
      courseId: args.courseId,
      title: args.title,
      order: newOrder,
    });
  },
});

/** Update a module */
export const update = mutation({
  args: {
    moduleId: v.id("modules"),
    title: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const module = await ctx.db.get(args.moduleId);
    if (!module) throw new Error("Module not found");

    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.moduleId, {
      ...(args.title !== undefined && { title: args.title }),
      ...(args.order !== undefined && { order: args.order }),
    });
  },
});

/** Delete a module */
export const remove = mutation({
  args: { moduleId: v.id("modules") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const module = await ctx.db.get(args.moduleId);
    if (!module) throw new Error("Module not found");

    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    // Delete all lessons in this module
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("moduleId", (q) => q.eq("moduleId", args.moduleId))
      .collect();

    for (const lesson of lessons) {
      // Clean up related data
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

      await ctx.db.delete(lesson._id);
    }

    await ctx.db.delete(args.moduleId);
  },
});

/** Reorder modules */
export const reorder = mutation({
  args: {
    moduleIds: v.array(v.id("modules")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    for (let i = 0; i < args.moduleIds.length; i++) {
      const module = await ctx.db.get(args.moduleIds[i]);
      if (!module) continue;

      const course = await ctx.db.get(module.courseId);
      if (!course) continue;
      if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
        continue;
      }

      await ctx.db.patch(args.moduleIds[i], { order: i });
    }
  },
});
