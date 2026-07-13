/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as assignments from "../assignments.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as certificates from "../certificates.js";
import type * as courses from "../courses.js";
import type * as enrollments from "../enrollments.js";
import type * as http from "../http.js";
import type * as imports from "../imports.js";
import type * as lessons from "../lessons.js";
import type * as materials from "../materials.js";
import type * as modules from "../modules.js";
import type * as notifications from "../notifications.js";
import type * as quizzes from "../quizzes.js";
import type * as submissions from "../submissions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  assignments: typeof assignments;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  certificates: typeof certificates;
  courses: typeof courses;
  enrollments: typeof enrollments;
  http: typeof http;
  imports: typeof imports;
  lessons: typeof lessons;
  materials: typeof materials;
  modules: typeof modules;
  notifications: typeof notifications;
  quizzes: typeof quizzes;
  submissions: typeof submissions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
