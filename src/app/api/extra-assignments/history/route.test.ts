import { beforeEach, describe, expect, it, vi } from "vitest";

const authorizeApiRequestMock = vi.fn();
const studentExtraAssignmentFindManyMock = vi.fn();

vi.mock("@/shared/lib/authorize-api-request", () => ({
  authorizeApiRequest: (...args: unknown[]) => authorizeApiRequestMock(...args),
}));

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    studentExtraAssignment: {
      findMany: (...args: unknown[]) => studentExtraAssignmentFindManyMock(...args),
    },
  },
}));

describe("GET /api/extra-assignments/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizeApiRequestMock.mockResolvedValue({
      session: {
        user: { id: "user-1", role: "TEACHER", studentId: null },
      },
    });
    studentExtraAssignmentFindManyMock.mockResolvedValue([]);
  });

  it("returns 400 when studentId is missing for TEACHER", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/extra-assignments/history"),
    );

    expect(response.status).toBe(400);
    expect(studentExtraAssignmentFindManyMock).not.toHaveBeenCalled();
  });

  it("allows STUDENT without studentId query param", async () => {
    authorizeApiRequestMock.mockResolvedValue({
      session: {
        user: { id: "student-user", role: "STUDENT", studentId: "student-ali" },
      },
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/extra-assignments/history"),
    );

    expect(response.status).toBe(200);
    expect(authorizeApiRequestMock).toHaveBeenCalledWith({
      allowedRoles: ["TEACHER", "MANAGER", "SUPER_ADMIN", "STUDENT"],
      context: { studentId: "student-ali" },
    });
    expect(studentExtraAssignmentFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: "student-ali" },
      }),
    );
  });

  it("returns 403 when STUDENT requests foreign studentId", async () => {
    authorizeApiRequestMock.mockResolvedValue({
      error: { status: 403 },
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/extra-assignments/history?studentId=other-student",
      ),
    );

    expect(response.status).toBe(403);
    expect(studentExtraAssignmentFindManyMock).not.toHaveBeenCalled();
  });

  it("filters by subjectId via session group or display step level", async () => {
    const { GET } = await import("./route");
    await GET(
      new Request(
        "http://localhost/api/extra-assignments/history?studentId=student-1&subjectId=subject-tajweed",
      ),
    );

    expect(studentExtraAssignmentFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studentId: "student-1",
          OR: [
            { session: { group: { subjectId: "subject-tajweed" } } },
            { displayStep: { level: { subjectId: "subject-tajweed" } } },
          ],
        },
      }),
    );
  });

  it("maps subject from session group in response", async () => {
    studentExtraAssignmentFindManyMock.mockResolvedValue([
      {
        id: "instance-1",
        createdAt: new Date("2026-07-10T12:00:00.000Z"),
        displayStep: {
          order: 1,
          title: "Шаг 1",
          level: {
            subjectId: "subject-quran",
            subject: { id: "subject-quran", name: "Коран" },
          },
        },
        template: {
          title: "E2E Extra Quran",
          author: { id: "author-1", name: "Учитель" },
        },
        completion: {
          id: "completion-1",
          grade: 3,
          note: null,
          gradedAt: new Date("2026-07-10T13:00:00.000Z"),
          createdAt: new Date("2026-07-10T13:00:00.000Z"),
        },
        session: {
          date: new Date("2026-07-10T12:00:00.000Z"),
          group: {
            subjectId: "subject-quran",
            subject: { id: "subject-quran", name: "Коран" },
          },
        },
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/extra-assignments/history?studentId=student-1",
      ),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data[0].subject).toEqual({ id: "subject-quran", name: "Коран" });
  });
});
