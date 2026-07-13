import swaggerJsdoc from "swagger-jsdoc";
const def = {
  openapi: "3.0.0",
  info: { title: "LMS REST API", version: "1.0.0", description: "O'quv Markazi LMS - REST API" },
  servers: [{ url: "http://localhost:3001", description: "Development" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
    schemas: {
      Course: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, slug: { type: "string" }, status: { type: "string" } } },
      Module: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, order: { type: "number" } } },
      Lesson: { type: "object", properties: { _id: { type: "string" }, title: { type: "string" }, type: { type: "string" } } },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {},
};
export const swaggerSpec = swaggerJsdoc({ definition: def, apis: ["./src/routes/*.ts"] });