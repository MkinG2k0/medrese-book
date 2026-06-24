import path from "node:path";

export const AUTH_DIR = path.resolve(__dirname, "../.auth");

export const AUTH_STATE = {
  superAdmin: path.join(AUTH_DIR, "super-admin.json"),
  manager: path.join(AUTH_DIR, "manager.json"),
  teacher1: path.join(AUTH_DIR, "teacher1.json"),
  teacher2: path.join(AUTH_DIR, "teacher2.json"),
  studentAli: path.join(AUTH_DIR, "student-ali.json"),
  studentUsman: path.join(AUTH_DIR, "student-usman.json"),
} as const;
