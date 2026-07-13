import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/** Enroll a student in a course */
export const enroll = mutation({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    if (course.status !== "published") throw new Error("Course is not published");

    // Check if already enrolled
    const existing = await ctx.db
      .query("enrollments")
      .withIndex("courseStudent", (q) =>
        q.eq("courseId", args.courseId).eq("studentId", user._id),
      )
      .first();

    if (existing) throw new Error("Already enrolled in this course");

    return await ctx.db.insert("enrollments", {
      courseId: args.courseId,
      studentId: user._id,
      enrolledAt: Date.now(),
    });
  },
});

/** Unenroll from a course */
export const unenroll = mutation({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("courseStudent", (q) =>
        q.eq("courseId", args.courseId).eq("studentId", user._id),
      )
      .first();

    if (!enrollment) throw new Error("Not enrolled in this course");
    await ctx.db.delete(enrollment._id);
  },
});

/** Check if user is enrolled in a course */
export const isEnrolled = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return false;

    const enrollment = await ctx.db
      .query("enrollments")
      .withIndex("courseStudent", (q) =>
        q.eq("courseId", args.courseId).eq("studentId", user._id),
      )
      .first();

    return !!enrollment;
  },
});

/** Get enrollment count for a course */
export const count = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    return enrollments.length;
  },
});

/** Get all students enrolled in a course (teacher/admin only) */
export const listStudents = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await ctx.db.get(enrollment.studentId);
        return {
          enrollment,
          student: {
            _id: student?._id,
            name: student?.name || student?.firstName || "Unknown",
            email: student?.email,
            image: student?.image,
          },
        };
      }),
    );
  },
});
