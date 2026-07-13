import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getCurrentUser } from "./users";
import { ROLES } from "./schema";

/** Import Markdown content as a lesson */
export const importMarkdown = mutation({
  args: {
    lessonId: v.id("lessons"),
    contentMd: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    await ctx.db.patch(args.lessonId, {
      contentMd: args.contentMd,
      ...(args.title && { title: args.title }),
    });
  },
});

/** Import quiz from text format */
export const importQuiz = mutation({
  args: {
    lessonId: v.id("lessons"),
    quizText: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    if (user.role !== ROLES.TEACHER && user.role !== ROLES.ADMIN) {
      throw new Error("Not authorized");
    }

    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    // Parse quiz format:
    // ? Question text
    // * Correct answer
    // - Wrong answer
    const lines = args.quizText.split("\n").filter((l) => l.trim());
    let currentQuestion: {
      textMd: string;
      options: { textMd: string; isCorrect: boolean }[];
    } | null = null;
    const questions: {
      textMd: string;
      options: { textMd: string; isCorrect: boolean }[];
    }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("? ")) {
        if (currentQuestion && currentQuestion.options.length >= 2) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          textMd: trimmed.slice(2),
          options: [],
        };
      } else if (trimmed.startsWith("* ") && currentQuestion) {
        currentQuestion.options.push({
          textMd: trimmed.slice(2),
          isCorrect: true,
        });
      } else if (trimmed.startsWith("- ") && currentQuestion) {
        currentQuestion.options.push({
          textMd: trimmed.slice(2),
          isCorrect: false,
        });
      }
    }
    if (currentQuestion && currentQuestion.options.length >= 2) {
      questions.push(currentQuestion);
    }

    if (questions.length === 0) {
      throw new Error("No valid questions found in the text");
    }

    // Create or get quiz for this lesson
    const existingQuiz = await ctx.db
      .query("quizzes")
      .withIndex("lessonId", (q) => q.eq("lessonId", args.lessonId))
      .first();

    let quizId: string;
    if (existingQuiz) {
      quizId = existingQuiz._id;
    } else {
      quizId = await ctx.db.insert("quizzes", {
        lessonId: args.lessonId,
        title: "Imported Quiz",
        passScore: 60,
        maxAttempts: 1,
        shuffleQuestions: true,
      });
    }

    // Find max order
    const existingQuestions = await ctx.db
      .query("questions")
      .withIndex("quizId", (q) => q.eq("quizId", quizId as any))
      .order("desc")
      .first();
    let order = existingQuestions ? existingQuestions.order + 1 : 0;

    for (const question of questions) {
      const questionId = await ctx.db.insert("questions", {
        quizId: quizId as any,
        type: question.options.filter((o) => o.isCorrect).length > 1 ? "multiple_choice" : "single_choice",
        textMd: question.textMd,
        points: 1,
        order,
      });
      order++;

      for (let i = 0; i < question.options.length; i++) {
        const opt = question.options[i];
        await ctx.db.insert("options", {
          questionId: questionId as any,
          textMd: opt.textMd,
          isCorrect: opt.isCorrect,
          order: i,
        });
      }
    }

    return { questionsImported: questions.length };
  },
});
