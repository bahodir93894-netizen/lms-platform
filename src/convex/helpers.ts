import { QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Fetch a user by ID and return a display name.
 * Safe — returns "Unknown" if user is null.
 */
export async function getTeacherName(
  ctx: QueryCtx,
  teacherId: Id<"users">,
): Promise<string> {
  const teacher = await ctx.db.get(teacherId);
  return teacher?.name || teacher?.firstName || "Unknown";
}

/**
 * Count modules for a course.
 */
export async function countModules(
  ctx: QueryCtx,
  courseId: Id<"courses">,
): Promise<number> {
  const modules = await ctx.db
    .query("modules")
    .withIndex("courseId", (q) => q.eq("courseId", courseId))
    .collect();
  return modules.length;
}

/**
 * Count enrollments for a course.
 */
export async function countEnrollments(
  ctx: QueryCtx,
  courseId: Id<"courses">,
): Promise<number> {
  const enrollments = await ctx.db
    .query("enrollments")
    .withIndex("courseId", (q) => q.eq("courseId", courseId))
    .collect();
  return enrollments.length;
}

/**
 * Enrich a course with teacher name and module count.
 */
export async function enrichCourse(
  ctx: QueryCtx,
  course: Doc<"courses">,
): Promise<Doc<"courses"> & { teacherName: string; moduleCount: number }> {
  const [teacherName, moduleCount] = await Promise.all([
    getTeacherName(ctx, course.teacherId),
    countModules(ctx, course._id as Id<"courses">),
  ]);
  return { ...course, teacherName, moduleCount };
}

/**
 * Enrich a course with teacher name, module count, and enrollment count.
 */
export async function enrichCourseFull(
  ctx: QueryCtx,
  course: Doc<"courses">,
): Promise<
  Doc<"courses"> & {
    teacherName: string;
    moduleCount: number;
    enrollmentCount: number;
  }
> {
  const [teacherName, moduleCount, enrollmentCount] = await Promise.all([
    getTeacherName(ctx, course.teacherId),
    countModules(ctx, course._id as Id<"courses">),
    countEnrollments(ctx, course._id as Id<"courses">),
  ]);
  return { ...course, teacherName, moduleCount, enrollmentCount };
}

/**
 * Type-safe filter guard for removing nulls from arrays.
 *
 * @example
 * ```tsx
 * const results: (T | null)[] = [a, null, b];
 * const clean: T[] = results.filter(nonNull);
 * ```
 */
export function nonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
