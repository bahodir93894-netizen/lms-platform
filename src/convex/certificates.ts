import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/** Generate a certificate for a completed course */
export const generate = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("Course not found");

    // Check already exists
    const all = await ctx.db.query("certificates").collect();
    const existing = all.find(
      (c) => c.courseId === args.courseId && c.studentId === user._id,
    );
    if (existing) return existing._id;

    const studentName = user.name || user.firstName || user.email || "Student";
    const certificateId = crypto.randomUUID();

    const certId = await ctx.db.insert("certificates", {
      courseId: args.courseId,
      studentId: user._id,
      issuedAt: Date.now(),
      courseTitle: course.title,
      studentName,
      certificateId,
    });

    return certId;
  },
});

/** Get user's certificates */
export const myCertificates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const all = await ctx.db.query("certificates").collect();
    return all
      .filter((c) => c.studentId === user._id)
      .sort((a, b) => b.issuedAt - a.issuedAt);
  },
});

/** Get certificate by certificateId string */
export const getById = query({
  args: { certificateId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("certificates").collect();
    return all.find((c) => c.certificateId === args.certificateId) || null;
  },
});

/** Check if user can get a certificate for a course */
export const canGenerate = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { canGenerate: false, reason: "Not authenticated" };

    const all = await ctx.db.query("certificates").collect();
    const existing = all.find(
      (c) => c.courseId === args.courseId && c.studentId === user._id,
    );

    if (existing) {
      return {
        canGenerate: false,
        reason: "Certificate already exists",
        certificateId: existing.certificateId,
      };
    }

    return { canGenerate: true, reason: "Ready" };
  },
});
