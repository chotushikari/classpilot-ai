import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:3000/v1/auth/google/callback"),
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  CHROME_EXTENSION_ID: z.string().optional(),
  DEMO_MODE: z.enum(["true", "false"]).default("true")
}).superRefine((value, ctx) => {
  if (value.NODE_ENV === "production" && !value.SESSION_SECRET) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "SESSION_SECRET is required in production" });
  if (value.NODE_ENV === "production" && !value.TOKEN_ENCRYPTION_KEY) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TOKEN_ENCRYPTION_KEY is required in production" });
  if (value.NODE_ENV === "production" && !value.DATABASE_URL) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DATABASE_URL is required in production" });
  if (value.NODE_ENV === "production" && value.DEMO_MODE === "true") ctx.addIssue({ code: z.ZodIssueCode.custom, message: "DEMO_MODE must be false in production" });
});

export const config = envSchema.parse(process.env);
export const sessionSecret = config.SESSION_SECRET ?? "development-only-secret-not-for-production-000";
// Required for a student to enumerate their own courses, coursework, and submission metadata.
export const readonlyScopes = ["openid", "email", "profile", "https://www.googleapis.com/auth/classroom.courses.readonly", "https://www.googleapis.com/auth/classroom.coursework.me.readonly", "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly"];
