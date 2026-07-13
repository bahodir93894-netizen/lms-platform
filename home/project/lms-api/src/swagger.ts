import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "O'quv Markazi LMS - REST API",
    version: "1.0.0",
    description: `
To'liq LMS platformasi uchun REST API.

## Auth
Barcha APIda autentifikatsiya Convex token orqali amalga oshiriladi:
- \`Authorization: Bearer <convex-auth-token>\` header'ini yuboring
- Convex dashboard'dan yoki frontend login'dan token olishingiz mumkin

## Base URL
\`http://localhost:3001/api\`
    `,
    contact: {
      name: "O'quv Markazi",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Convex authentication token",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          message: { type: "string" },
          details: { type: "object" },
        },
      },
      Course: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          status: { type: "string", enum: ["draft", "published"] },
          teacherId: { type: "string" },
          coverStorageId: { type: "string" },
          _creationTime: { type: "number" },
        },
      },
      Module: {
        type: "object",
        properties: {
          _id: { type: "string" },
          courseId: { type: "string" },
          title: { type: "string" },
          order: { type: "number" },
          lessons: {
            type: "array",
            items: { $ref: "#/components/schemas/Lesson" },
          },
        },
      },
      Lesson: {
        type: "object",
        properties: {
          _id: { type: "string" },
          moduleId: { type: "string" },
          title: { type: "string" },
          type: { type: "string", enum: ["text", "video", "quiz", "assignment", "file"] },
          contentMd: { type: "string" },
          order: { type: "number" },
          videoUrl: { type: "string" },
          isFreePreview: { type: "boolean" },
        },
      },
      Enrollment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          courseId: { type: "string" },
          studentId: { type: "string" },
          enrolledAt: { type: "number" },
        },
      },
      Quiz: {
        type: "object",
        properties: {
          _id: { type: "string" },
          lessonId: { type: "string" },
          title: { type: "string" },
          timeLimitMin: { type: "number" },
          passScore: { type: "number" },
          maxAttempts: { type: "number" },
          shuffleQuestions: { type: "boolean" },
          questions: {
            type: "array",
            items: { $ref: "#/components/schemas/Question" },
          },
        },
      },
      Question: {
        type: "object",
        properties: {
          _id: { type: "string" },
          quizId: { type: "string" },
          type: { type: "string", enum: ["single_choice", "multiple_choice", "true_false", "short_answer"] },
          textMd: { type: "string" },
          points: { type: "number" },
          order: { type: "number" },
          options: {
            type: "array",
            items: { $ref: "#/components/schemas/Option" },
          },
        },
      },
      Option: {
        type: "object",
        properties: {
          _id: { type: "string" },
          questionId: { type: "string" },
          textMd: { type: "string" },
          isCorrect: { type: "boolean" },
          order: { type: "number" },
        },
      },
      Assignment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          lessonId: { type: "string" },
          title: { type: "string" },
          descriptionMd: { type: "string" },
          maxScore: { type: "number" },
          dueAt: { type: "number" },
        },
      },
      Submission: {
        type: "object",
        properties: {
          _id: { type: "string" },
          assignmentId: { type: "string" },
          studentId: { type: "string" },
          textMd: { type: "string" },
          fileStorageId: { type: "string" },
          status: { type: "string", enum: ["submitted", "graded", "returned"] },
          score: { type: "number" },
          feedbackMd: { type: "string" },
          submittedAt: { type: "number" },
          gradedAt: { type: "number" },
        },
      },
      Certificate: {
        type: "object",
        properties: {
          _id: { type: "string" },
          courseId: { type: "string" },
          studentId: { type: "string" },
          issuedAt: { type: "number" },
          courseTitle: { type: "string" },
          studentName: { type: "string" },
          certificateId: { type: "string" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          type: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          link: { type: "string" },
          read: { type: "boolean" },
          createdAt: { type: "number" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["admin", "teacher", "student", "unassigned"] },
          image: { type: "string" },
          isAnonymous: { type: "boolean" },
        },
      },
      PlatformStats: {
        type: "object",
        properties: {
          totalUsers: { type: "number" },
          teachers: { type: "number" },
          students: { type: "number" },
          admins: { type: "number" },
          unassigned: { type: "number" },
          totalCourses: { type: "number" },
          publishedCourses: { type: "number" },
          draftCourses: { type: "number" },
          totalEnrollments: { type: "number" },
          totalAttempts: { type: "number" },
          gradedAttempts: { type: "number" },
          avgScore: { type: "number" },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
