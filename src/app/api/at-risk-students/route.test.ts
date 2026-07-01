import { beforeEach, describe, expect, it, vi } from "vitest";

const authorizeApiRequestMock = vi.fn();
const getAtRiskStudentsMock = vi.fn();
const teacherFindManyMock = vi.fn();

vi.mock("@/shared/lib/authorize-api-request", () => ({
  authorizeApiRequest: (...args: unknown[]) => authorizeApiRequestMock(...args),
}));

vi.mock("@/shared/lib/analytics", () => ({
  getAtRiskStudents: (...args: unknown[]) => getAtRiskStudentsMock(...args),
  parseAnalyticsMonth: () => new Date("2026-07-01T00:00:00.000Z"),
}));

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    teacher: {
      findMany: (...args: unknown[]) => teacherFindManyMock(...args),
    },
  },
}));

describe("GET /api/at-risk-students", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    teacherFindManyMock.mockResolvedValue([{ id: "teacher-1" }]);
    getAtRiskStudentsMock.mockResolvedValue([]);
  });

  it("returns 403 when caller is STUDENT", async () => {
    const { NextResponse } = await import("next/server");
    authorizeApiRequestMock.mockResolvedValue({
      error: NextResponse.json(
        { data: null, error: "Недостаточно прав" },
        { status: 403 },
      ),
    });

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/at-risk-students"),
    );

    expect(response.status).toBe(403);
    const json = (await response.json()) as { data: null; error: string };
    expect(json.error).toBe("Недостаточно прав");
    expect(getAtRiskStudentsMock).not.toHaveBeenCalled();
  });

  it("returns at-risk data for TEACHER", async () => {
    authorizeApiRequestMock.mockResolvedValue({
      session: {
        user: {
          role: "TEACHER",
          teacherId: "teacher-1",
          id: "user-1",
        },
      },
    });

    const mockRows = [
      {
        student: { id: "student-1", name: "Али" },
        teacherName: "Учитель Ахмад",
        levelTitle: "Уровень 1",
        riskFlags: [],
        absencesInMonth: 0,
        actualMinutes: 60,
        budgetMinutes: 120,
      },
    ];
    getAtRiskStudentsMock.mockResolvedValue(mockRows);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/at-risk-students?month=2026-07"),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      data: typeof mockRows;
      error: null;
    };
    expect(json.error).toBeNull();
    expect(json.data).toEqual(mockRows);
    expect(getAtRiskStudentsMock).toHaveBeenCalledOnce();
  });
});
