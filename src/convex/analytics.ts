import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";
import { v } from "convex/values";

/** Admin: get platform-wide statistics */
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const allUsers = await ctx.db.query("users").collect();
    const allCourses = await ctx.db.query("courses").collect();
    const allEnrollments = await ctx.db.query("enrollments").collect();
    const allAttempts = await ctx.db.query("quizAttempts").collect();

    const teachers = allUsers.filter((u) => u.role === ROLES.TEACHER).length;
    const students = allUsers.filter((u) => u.role === ROLES.STUDENT).length;
    const admins = allUsers.filter((u) => u.role === ROLES.ADMIN).length;
    const unassigned = allUsers.filter((u) => !u.role).length;

    const publishedCourses = allCourses.filter((c) => c.status === "published").length;
    const draftCourses = allCourses.filter((c) => c.status === "draft").length;

    const gradedAttempts = allAttempts.filter((a) => a.status === "graded");
    const avgScore =
      gradedAttempts.length > 0
        ? Math.round(
            gradedAttempts.reduce((sum, a) => sum + (a.score ?? 0), 0) /
              gradedAttempts.length,
          )
        : 0;

    return {
      totalUsers: allUsers.length,
      teachers,
      students,
      admins,
      unassigned,
      totalCourses: allCourses.length,
      publishedCourses,
      draftCourses,
      totalEnrollments: allEnrollments.length,
      totalAttempts: allAttempts.length,
      gradedAttempts: gradedAttempts.length,
      avgScore,
    };
  },
});

/** Admin: list all users */
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const users = await ctx.db.query("users").collect();
    return Promise.all(
      users.map(async (u) => {
        const courseCount =
          u.role === ROLES.TEACHER
            ? (
                await ctx.db
                  .query("courses")
                  .withIndex("teacherId", (q) => q.eq("teacherId", u._id))
                  .collect()
              ).length
            : 0;

        return {
          _id: u._id,
          name: u.name || u.firstName || "",
          email: u.email || "",
          role: u.role || "unassigned",
          isAnonymous: u.isAnonymous || false,
          courseCount,
          createdAt: u._creationTime,
        };
      }),
    );
  },
});

/** Admin: update user role */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal(ROLES.ADMIN),
      v.literal(ROLES.TEACHER),
      v.literal(ROLES.STUDENT),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.userId, { role: args.role });
  },
});

/** Admin: delete a user */
export const removeUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    // Delete user's courses if teacher
    const courses = await ctx.db
      .query("courses")
      .withIndex("teacherId", (q) => q.eq("teacherId", args.userId))
      .collect();
    for (const course of courses) {
      await ctx.db.delete(course._id);
    }

    await ctx.db.delete(args.userId);
  },
});

/** Admin: list all courses with teacher info */
export const listAllCourses = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const courses = await ctx.db.query("courses").collect();
    return Promise.all(
      courses.map(async (course) => {
        const teacher = await ctx.db.get(course.teacherId);
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("courseId", (q) => q.eq("courseId", course._id))
          .collect();

        return {
          ...course,
          teacherName: teacher?.name || teacher?.firstName || "Unknown",
          enrollmentCount: enrollments.length,
        };
      }),
    );
  },
});

/** Get course statistics for teacher/analytics */
export const getCourseStats = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.TEACHER) {
      throw new Error("Not authorized");
    }

    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    const modules = await ctx.db
      .query("modules")
      .withIndex("courseId", (q) => q.eq("courseId", args.courseId))
      .collect();

    let totalLessons = 0;
    for (const mod of modules) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("moduleId", (q) => q.eq("moduleId", mod._id))
        .collect();
      totalLessons += lessons.length;
    }

    // Get quiz attempt stats
    let totalAttempts = 0;
    let avgScore = 0;
    for (const mod of modules) {
      const lessons = await ctx.db
        .query("lessons")
        .withIndex("moduleId", (q) => q.eq("moduleId", mod._id))
        .collect();
      for (const lesson of lessons) {
        const quiz = await ctx.db
          .query("quizzes")
          .withIndex("lessonId", (q) => q.eq("lessonId", lesson._id))
          .first();
        if (quiz) {
          const attempts = await ctx.db
            .query("quizAttempts")
            .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
            .collect();
          totalAttempts += attempts.length;
          const graded = attempts.filter((a) => a.status === "graded");
          if (graded.length > 0) {
            avgScore += graded.reduce((s, a) => s + (a.score ?? 0), 0);
          }
        }
      }
    }

    return {
      enrollmentCount: enrollments.length,
      moduleCount: modules.length,
      lessonCount: totalLessons,
      totalAttempts,
      avgScore: totalAttempts > 0 ? Math.round(avgScore / totalAttempts) : 0,
    };
  },
});
