import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES, questionTypeValidator } from "./schema";
import { Id } from "./_generated/dataModel";

// ─── Queries ─────────────────────────────────────────────────

/** Get quiz for a lesson */
export const getByLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();
    if (!quiz) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
      .order("asc")
      .collect();

    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await ctx.db
          .query("options")
          .withIndex("questionId", (q) => q.eq("questionId", question._id))
          .order("asc")
          .collect();
        // Strip isCorrect for student-facing queries
        const safeOptions = options.map((opt) => ({
          _id: opt._id,
          textMd: opt.textMd,
          order: opt.order,
        }));
        return { ...question, options: safeOptions };
      }),
    );

    return { ...quiz, questions: questionsWithOptions };
  },
});

/** Get a single quiz by ID */
export const getById = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
      .order("asc")
      .collect();

    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await ctx.db
          .query("options")
          .withIndex("questionId", (q) => q.eq("questionId", question._id))
          .order("asc")
          .collect();
        return { ...question, options };
      }),
    );

    return { ...quiz, questions: questionsWithOptions };
  },
});

/** Get quiz by lesson with all correct answers exposed (teacher only) */
export const getByLessonTeacher = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();
    if (!quiz) return null;

    const questions = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", quiz._id))
      .order("asc")
      .collect();

    const questionsWithOptions = await Promise.all(
      questions.map(async (question) => {
        const options = await ctx.db
          .query("options")
          .withIndex("questionId", (q) => q.eq("questionId", question._id))
          .order("asc")
          .collect();
        return { ...question, options };
      }),
    );

    return { ...quiz, questions: questionsWithOptions };
  },
});

/** Get the current active attempt for a student */
export const getCurrentAttempt = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    return await ctx.db
      .query("quizAttempts")
      .withIndex("quizStudent", (q) =>
        q.eq("quizId", args.quizId).eq("studentId", user._id),
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();
  },
});

/** Get a student's attempts for a quiz */
export const getMyAttempts = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("quizStudent", (q) =>
        q.eq("quizId", args.quizId).eq("studentId", user._id),
      )
      .order("desc")
      .collect();

    return Promise.all(
      attempts.map(async (attempt) => {
        const answers = await ctx.db
          .query("attemptAnswers")
          .withIndex("attemptId", (q) => q.eq("attemptId", attempt._id))
          .collect();
        return { ...attempt, answers };
      }),
    );
  },
});

/** Get attempt details with answers */
export const getAttempt = query({
  args: { attemptId: v.id("quizAttempts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) return null;
    if (attempt.studentId !== user._id && user.role !== ROLES.ADMIN && user.role !== ROLES.TEACHER) {
      return null;
    }

    const answers = await ctx.db
      .query("attemptAnswers")
      .withIndex("attemptId", (q) => q.eq("attemptId", args.attemptId))
      .collect();

    return { ...attempt, answers };
  },
});

/** List all attempts for a quiz (teacher) */
export const listAttempts = query({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    return Promise.all(
      attempts.map(async (attempt) => {
        const student = await ctx.db.get(attempt.studentId);
        const answers = await ctx.db
          .query("attemptAnswers")
          .withIndex("attemptId", (q) => q.eq("attemptId", attempt._id))
          .collect();
        return {
          ...attempt,
          studentName: student?.name || student?.firstName || "Unknown",
          studentEmail: student?.email,
          answers,
        };
      }),
    );
  },
});

// ─── Mutations ────────────────────────────────────────────────

/** Create or update a quiz for a lesson */
export const upsert = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.string(),
    timeLimitMin: v.optional(v.number()),
    passScore: v.optional(v.number()),
    maxAttempts: v.optional(v.number()),
    shuffleQuestions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Only teachers can manage quizzes");
    }

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
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        timeLimitMin: args.timeLimitMin,
        passScore: args.passScore ?? 60,
        maxAttempts: args.maxAttempts ?? 1,
        shuffleQuestions: args.shuffleQuestions ?? true,
      });
      return existing._id;
    }

    return await ctx.db.insert("quizzes", {
      lessonId: args.lessonId,
      title: args.title,
      timeLimitMin: args.timeLimitMin,
      passScore: args.passScore ?? 60,
      maxAttempts: args.maxAttempts ?? 1,
      shuffleQuestions: args.shuffleQuestions ?? true,
    });
  },
});

/** Delete a quiz */
export const remove = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    const lesson = await ctx.db.get(quiz.lessonId);
    if (!lesson) throw new Error("Lesson not found");
    const module = await ctx.db.get(lesson.moduleId);
    if (!module) throw new Error("Module not found");
    const course = await ctx.db.get(module.courseId);
    if (!course) throw new Error("Course not found");
    if (course.teacherId !== user._id && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const question of questions) {
      const options = await ctx.db
        .query("options")
        .withIndex("questionId", (q) => q.eq("questionId", question._id))
        .collect();
      for (const option of options) {
        await ctx.db.delete(option._id);
      }
      await ctx.db.delete(question._id);
    }

    await ctx.db.delete(args.quizId);
  },
});

// ─── Questions ────────────────────────────────────────────────

/** Add a question to a quiz */
export const addQuestion = mutation({
  args: {
    quizId: v.id("quizzes"),
    type: questionTypeValidator,
    textMd: v.string(),
    points: v.optional(v.number()),
    options: v.array(
      v.object({
        textMd: v.string(),
        isCorrect: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Only teachers can manage questions");
    }

    const existing = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", args.quizId))
      .order("desc")
      .first();
    const newOrder = existing ? existing.order + 1 : 0;

    const questionId = await ctx.db.insert("questions", {
      quizId: args.quizId,
      type: args.type,
      textMd: args.textMd,
      points: args.points ?? 1,
      order: newOrder,
    });

    for (let i = 0; i < args.options.length; i++) {
      await ctx.db.insert("options", {
        questionId: questionId as Id<"questions">,
        textMd: args.options[i].textMd,
        isCorrect: args.options[i].isCorrect,
        order: i,
      });
    }

    return questionId;
  },
});

/** Update a question */
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    type: v.optional(questionTypeValidator),
    textMd: v.optional(v.string()),
    points: v.optional(v.number()),
    options: v.optional(
      v.array(
        v.object({
          optionId: v.id("options"),
          textMd: v.string(),
          isCorrect: v.boolean(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    await ctx.db.patch(args.questionId, {
      ...(args.type !== undefined && { type: args.type }),
      ...(args.textMd !== undefined && { textMd: args.textMd }),
      ...(args.points !== undefined && { points: args.points }),
    });

    if (args.options) {
      for (let i = 0; i < args.options.length; i++) {
        const opt = args.options[i];
        await ctx.db.patch(opt.optionId, {
          textMd: opt.textMd,
          isCorrect: opt.isCorrect,
          order: i,
        });
      }
    }
  },
});

/** Delete a question */
export const removeQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const options = await ctx.db
      .query("options")
      .withIndex("questionId", (q) => q.eq("questionId", args.questionId))
      .collect();
    for (const option of options) {
      await ctx.db.delete(option._id);
    }

    await ctx.db.delete(args.questionId);
  },
});

// ─── Quiz Attempts ────────────────────────────────────────────

/** Start a new quiz attempt */
export const startAttempt = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Check max attempts
    if (quiz.maxAttempts && quiz.maxAttempts > 0) {
      const prevAttempts = await ctx.db
        .query("quizAttempts")
        .withIndex("quizStudent", (q) =>
          q.eq("quizId", args.quizId).eq("studentId", user._id),
        )
        .filter((q) => q.neq(q.field("status"), "in_progress"))
        .collect();
      if (prevAttempts.length >= quiz.maxAttempts) {
        throw new Error("Maximum attempts reached");
      }
    }

    // Check for existing in-progress attempt
    const existing = await ctx.db
      .query("quizAttempts")
      .withIndex("quizStudent", (q) =>
        q.eq("quizId", args.quizId).eq("studentId", user._id),
      )
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("quizAttempts", {
      quizId: args.quizId,
      studentId: user._id,
      status: "in_progress",
      startedAt: Date.now(),
    });
  },
});

/** Save an answer for an attempt */
export const saveAnswer = mutation({
  args: {
    attemptId: v.id("quizAttempts"),
    questionId: v.id("questions"),
    selectedOptionIds: v.optional(v.array(v.id("options"))),
    textAnswer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.studentId !== user._id) throw new Error("Not your attempt");
    if (attempt.status !== "in_progress") throw new Error("Attempt already submitted");

    // Check time limit
    const quiz = await ctx.db.get(attempt.quizId);
    if (quiz?.timeLimitMin) {
      const elapsed = (Date.now() - attempt.startedAt) / 1000 / 60;
      if (elapsed > quiz.timeLimitMin) {
        throw new Error("Time limit exceeded");
      }
    }

    // Upsert answer
    const existing = await ctx.db
      .query("attemptAnswers")
      .withIndex("attemptId", (q) => q.eq("attemptId", args.attemptId))
      .filter((q) => q.eq(q.field("questionId"), args.questionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        selectedOptionIds: args.selectedOptionIds,
        textAnswer: args.textAnswer,
      });
      return existing._id;
    }

    return await ctx.db.insert("attemptAnswers", {
      attemptId: args.attemptId,
      questionId: args.questionId,
      selectedOptionIds: args.selectedOptionIds,
      textAnswer: args.textAnswer,
    });
  },
});

/** Submit an attempt and auto-grade closed questions */
export const submitAttempt = mutation({
  args: { attemptId: v.id("quizAttempts") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.studentId !== user._id) throw new Error("Not your attempt");
    if (attempt.status !== "in_progress") throw new Error("Already submitted");

    const quiz = await ctx.db.get(attempt.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Check time limit
    if (quiz.timeLimitMin) {
      const elapsed = (Date.now() - attempt.startedAt) / 1000 / 60;
      if (elapsed > quiz.timeLimitMin) {
        // Auto-submit even if time exceeded
      }
    }

    // Get all questions
    const questions = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", attempt.quizId))
      .collect();

    // Get answers
    const answers = await ctx.db
      .query("attemptAnswers")
      .withIndex("attemptId", (q) => q.eq("attemptId", args.attemptId))
      .collect();

    let totalPoints = 0;
    let earnedPoints = 0;
    let hasManualGrade = false;

    for (const question of questions) {
      const pts = question.points ?? 1;
      totalPoints += pts;

      const answer = answers.find((a) => a.questionId === question._id);

      if (question.type === "short_answer") {
        hasManualGrade = true;
        continue;
      }

      // Auto-grade closed questions
      if (answer) {
        const options = await ctx.db
          .query("options")
          .withIndex("questionId", (q) => q.eq("questionId", question._id))
          .collect();

        const correctOptions = options.filter((o) => o.isCorrect);
        const selectedOptions = options.filter((o) =>
          answer.selectedOptionIds?.includes(o._id),
        );

        let isCorrect = false;

        if (question.type === "single_choice" || question.type === "true_false") {
          isCorrect =
            selectedOptions.length === 1 &&
            selectedOptions[0]?.isCorrect === true;
        } else if (question.type === "multiple_choice") {
          isCorrect =
            selectedOptions.length === correctOptions.length &&
            selectedOptions.every((o) => o.isCorrect);
        }

        if (isCorrect) {
          earnedPoints += pts;
        }

        // Save grading result
        await ctx.db.patch(answer._id, {
          isCorrect,
          earnedPoints: isCorrect ? pts : 0,
        });
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = !hasManualGrade ? score >= (quiz.passScore ?? 60) : undefined;

    await ctx.db.patch(args.attemptId, {
      status: hasManualGrade ? "submitted" : "graded",
      finishedAt: Date.now(),
      score,
      passed,
    });

    return { score, passed, hasManualGrade };
  },
});

/** Grade short answer questions (teacher only) */
export const gradeQuestion = mutation({
  args: {
    answerId: v.id("attemptAnswers"),
    isCorrect: v.boolean(),
    earnedPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.answerId, {
      isCorrect: args.isCorrect,
      earnedPoints: args.earnedPoints,
    });

    // Recalculate total score
    const answer = await ctx.db.get(args.answerId);
    if (!answer) return;

    const attempt = await ctx.db.get(answer.attemptId);
    if (!attempt) return;

    const answers = await ctx.db
      .query("attemptAnswers")
      .withIndex("attemptId", (q) => q.eq("attemptId", answer.attemptId))
      .collect();

    const questions = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", attempt.quizId))
      .collect();

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const question of questions) {
      const pts = question.points ?? 1;
      totalPoints += pts;
      const ans = answers.find((a) => a.questionId === question._id);
      if (ans?.earnedPoints) {
        earnedPoints += ans.earnedPoints;
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const quiz = await ctx.db.get(attempt.quizId);

    await ctx.db.patch(answer.attemptId, {
      status: "graded",
      score,
      passed: score >= (quiz?.passScore ?? 60),
    });
  },
});
