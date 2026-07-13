import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/** Get submissions for an assignment (teacher view) */
export const listByAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // Verify teacher owns the course
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

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignmentId", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();

    return Promise.all(
      submissions.map(async (sub) => {
        const student = await ctx.db.get(sub.studentId);
        return {
          ...sub,
          studentName: student?.name || student?.firstName || "Unknown",
          studentEmail: student?.email,
        };
      }),
    );
  },
});

/** Get student's own submissions */
export const mySubmissions = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignmentStudent", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("studentId", user._id),
      )
      .collect();

    return submissions;
  },
});

/** Submit or update an assignment submission */
export const submit = mutation({
  args: {
    assignmentId: v.id("assignments"),
    textMd: v.optional(v.string()),
    fileStorageId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (!args.textMd && !args.fileStorageId) {
      throw new Error("Either text or file is required");
    }

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    // Check if already submitted
    const existing = await ctx.db
      .query("submissions")
      .withIndex("assignmentStudent", (q) =>
        q.eq("assignmentId", args.assignmentId).eq("studentId", user._id),
      )
      .first();

    if (existing) {
      // Update existing submission (resubmit)
      await ctx.db.patch(existing._id, {
        textMd: args.textMd,
        fileStorageId: args.fileStorageId,
        status: "submitted",
        submittedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("submissions", {
      assignmentId: args.assignmentId,
      studentId: user._id,
      textMd: args.textMd,
      fileStorageId: args.fileStorageId,
      status: "submitted",
      submittedAt: Date.now(),
    });
  },
});

/** Grade a submission (teacher only) */
export const grade = mutation({
  args: {
    submissionId: v.id("submissions"),
    score: v.number(),
    feedbackMd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const assignment = await ctx.db.get(submission.assignmentId);
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

    await ctx.db.patch(args.submissionId, {
      score: args.score,
      feedbackMd: args.feedbackMd,
      status: "graded",
      gradedAt: Date.now(),
    });
  },
});

/** Return submission for resubmission */
export const returnSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    feedbackMd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found");

    const assignment = await ctx.db.get(submission.assignmentId);
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

    await ctx.db.patch(args.submissionId, {
      status: "returned",
      feedbackMd: args.feedbackMd,
    });
  },
});
