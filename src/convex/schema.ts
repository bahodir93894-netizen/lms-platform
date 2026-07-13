import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.TEACHER),
  v.literal(ROLES.STUDENT),
);
export type Role = Infer<typeof roleValidator>;

export const CourseStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;
export const courseStatusValidator = v.union(
  v.literal(CourseStatus.DRAFT),
  v.literal(CourseStatus.PUBLISHED),
  v.literal(CourseStatus.ARCHIVED),
);

export const LessonType = {
  TEXT: "text",
  VIDEO: "video",
  FILE: "file",
  QUIZ: "quiz",
} as const;
export const lessonTypeValidator = v.union(
  v.literal(LessonType.TEXT),
  v.literal(LessonType.VIDEO),
  v.literal(LessonType.FILE),
  v.literal(LessonType.QUIZ),
);

export const QuestionType = {
  SINGLE_CHOICE: "single_choice",
  MULTIPLE_CHOICE: "multiple_choice",
  TRUE_FALSE: "true_false",
  SHORT_ANSWER: "short_answer",
} as const;
export const questionTypeValidator = v.union(
  v.literal(QuestionType.SINGLE_CHOICE),
  v.literal(QuestionType.MULTIPLE_CHOICE),
  v.literal(QuestionType.TRUE_FALSE),
  v.literal(QuestionType.SHORT_ANSWER),
);

export const AttemptStatus = {
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  GRADED: "graded",
} as const;
export const attemptStatusValidator = v.union(
  v.literal(AttemptStatus.IN_PROGRESS),
  v.literal(AttemptStatus.SUBMITTED),
  v.literal(AttemptStatus.GRADED),
);

export const SubmissionStatus = {
  SUBMITTED: "submitted",
  GRADED: "graded",
  RETURNED: "returned",
} as const;
export const submissionStatusValidator = v.union(
  v.literal(SubmissionStatus.SUBMITTED),
  v.literal(SubmissionStatus.GRADED),
  v.literal(SubmissionStatus.RETURNED),
);

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
    })
      .index("email", ["email"])
      .index("role", ["role"]),

    // Courses
    courses: defineTable({
      title: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      status: courseStatusValidator,
      teacherId: v.id("users"),
      coverStorageId: v.optional(v.string()),
    })
      .index("slug", ["slug"])
      .index("teacherId", ["teacherId"])
      .index("status", ["status"]),

    // Modules (course sections)
    modules: defineTable({
      courseId: v.id("courses"),
      title: v.string(),
      order: v.number(),
    })
      .index("courseId", ["courseId"])
      .index("courseOrder", ["courseId", "order"]),

    // Lessons
    lessons: defineTable({
      moduleId: v.id("modules"),
      title: v.string(),
      type: lessonTypeValidator,
      order: v.number(),
      contentMd: v.optional(v.string()),
      videoUrl: v.optional(v.string()),
      durationMin: v.optional(v.number()),
      isFreePreview: v.optional(v.boolean()),
    })
      .index("moduleId", ["moduleId"])
      .index("moduleOrder", ["moduleId", "order"]),

    // Quiz
    quizzes: defineTable({
      lessonId: v.id("lessons"),
      title: v.string(),
      timeLimitMin: v.optional(v.number()),
      passScore: v.optional(v.number()),
      maxAttempts: v.optional(v.number()),
      shuffleQuestions: v.optional(v.boolean()),
    })
      .index("lessonId", ["lessonId"]),

    // Questions
    questions: defineTable({
      quizId: v.id("quizzes"),
      type: questionTypeValidator,
      textMd: v.string(),
      points: v.optional(v.number()),
      order: v.number(),
    })
      .index("quizId", ["quizId"]),

    // Options for questions
    options: defineTable({
      questionId: v.id("questions"),
      textMd: v.string(),
      isCorrect: v.boolean(),
      order: v.number(),
    })
      .index("questionId", ["questionId"]),

    // Quiz attempts
    quizAttempts: defineTable({
      quizId: v.id("quizzes"),
      studentId: v.id("users"),
      status: attemptStatusValidator,
      startedAt: v.number(),
      finishedAt: v.optional(v.number()),
      score: v.optional(v.number()),
      passed: v.optional(v.boolean()),
    })
      .index("quizId", ["quizId"])
      .index("studentId", ["studentId"])
      .index("quizStudent", ["quizId", "studentId"]),

    // Attempt answers
    attemptAnswers: defineTable({
      attemptId: v.id("quizAttempts"),
      questionId: v.id("questions"),
      selectedOptionIds: v.optional(v.array(v.id("options"))),
      textAnswer: v.optional(v.string()),
      isCorrect: v.optional(v.boolean()),
      earnedPoints: v.optional(v.number()),
    })
      .index("attemptId", ["attemptId"])
      .index("questionId", ["questionId"]),

    // Assignments (homework)
    assignments: defineTable({
      lessonId: v.id("lessons"),
      title: v.string(),
      descriptionMd: v.string(),
      dueAt: v.optional(v.number()),
      maxScore: v.optional(v.number()),
    })
      .index("lessonId", ["lessonId"]),

    // Submissions
    submissions: defineTable({
      assignmentId: v.id("assignments"),
      studentId: v.id("users"),
      fileStorageId: v.optional(v.string()),
      textMd: v.optional(v.string()),
      status: submissionStatusValidator,
      score: v.optional(v.number()),
      feedbackMd: v.optional(v.string()),
      submittedAt: v.number(),
      gradedAt: v.optional(v.number()),
    })
      .index("assignmentId", ["assignmentId"])
      .index("studentId", ["studentId"])
      .index("assignmentStudent", ["assignmentId", "studentId"]),

    // Enrollments
    enrollments: defineTable({
      courseId: v.id("courses"),
      studentId: v.id("users"),
      enrolledAt: v.number(),
      expiresAt: v.optional(v.number()),
    })
      .index("courseId", ["courseId"])
      .index("studentId", ["studentId"])
      .index("courseStudent", ["courseId", "studentId"]),

    // Lesson progress
    lessonProgress: defineTable({
      lessonId: v.id("lessons"),
      studentId: v.id("users"),
      completedAt: v.optional(v.number()),
    })
      .index("lessonId", ["lessonId"])
      .index("studentId", ["studentId"])
      .index("lessonStudent", ["lessonId", "studentId"]),

    // Materials (files attached to lessons or courses)
    materials: defineTable({
      title: v.string(),
      lessonId: v.optional(v.id("lessons")),
      courseId: v.optional(v.id("courses")),
      storageId: v.string(),
      originalName: v.string(),
      mimeType: v.string(),
      sizeBytes: v.number(),
      order: v.optional(v.number()),
    })
      .index("lessonId", ["lessonId"])
      .index("courseId", ["courseId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
