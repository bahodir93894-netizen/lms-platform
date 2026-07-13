import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/** Get materials for a lesson */
export const listByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("materials")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .collect();
  },
});

/** Get materials for a course */
export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("materials")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

/** Add a material to a lesson or course */
export const create = mutation({
  args: {
    title: v.string(),
    lessonId: v.optional(v.id("lessons")),
    courseId: v.optional(v.id("courses")),
    storageId: v.string(),
    originalName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Only teachers can add materials");
    }

    if (!args.lessonId && !args.courseId) {
      throw new Error("Either lessonId or courseId is required");
    }

    // Verify ownership
    if (args.lessonId) {
      const lesson = await ctx.db.get(args.lessonId);
      if (lesson) {
        const module = await ctx.db.get(lesson.moduleId);
        if (module) {
          const course = await ctx.db.get(module.courseId);
          if (course && course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
            throw new Error("Not authorized");
          }
        }
      }
    }

    if (args.courseId) {
      const course = await ctx.db.get(args.courseId);
      if (course && course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
        throw new Error("Not authorized");
      }
    }

    // Get count for ordering
    const existing = args.lessonId
      ? await ctx.db
          .query("materials")
          .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId!))
          .collect()
      : [];

    return await ctx.db.insert("materials", {
      title: args.title,
      lessonId: args.lessonId,
      courseId: args.courseId,
      storageId: args.storageId,
      originalName: args.originalName,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      order: existing.length,
    });
  },
});

/** Delete a material */
export const remove = mutation({
  args: { materialId: v.id("materials") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const material = await ctx.db.get(args.materialId);
    if (!material) throw new Error("Material not found");

    // Check ownership through lesson or course
    if (material.lessonId) {
      const lesson = await ctx.db.get(material.lessonId);
      if (lesson) {
        const module = await ctx.db.get(lesson.moduleId);
        if (module) {
          const course = await ctx.db.get(module.courseId);
          if (course && course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
            throw new Error("Not authorized");
          }
        }
      }
    }

    if (material.courseId) {
      const course = await ctx.db.get(material.courseId);
      if (course && course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
        throw new Error("Not authorized");
      }
    }

    await ctx.db.delete(args.materialId);
  },
});
