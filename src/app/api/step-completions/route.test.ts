import { beforeEach, describe, expect, it, vi } from "vitest";

const authorizeApiRequestMock = vi.fn();
const groupEnrollmentFindFirstMock = vi.fn();
const stepCompletionFindManyMock = vi.fn();
const buildTeachingSessionDurationByDateMock = vi.fn();

vi.mock("@/shared/lib/authorize-api-request", () => ({
  authorizeApiRequest: (...args: unknown[]) => authorizeApiRequestMock(...args),
}));

vi.mock("@/shared/lib/prisma", () => ({
  prisma: {
    groupEnrollment: {
      findFirst: (...args: unknown[]) => groupEnrollmentFindFirstMock(...args),
    },
    stepCompletion: {
      findMany: (...args: unknown[]) => stepCompletionFindManyMock(...args),
    },
  },
}));

vi.mock("@/shared/lib/teaching-session-duration-map", () => ({
  buildTeachingSessionDurationByDate: (...args: unknown[]) =>
    buildTeachingSessionDurationByDateMock(...args),
  teachingSessionDurationFromMap: (
    map: Map<string, number | null>,
    date: Date,
  ) => map.get(date.toISOString().slice(0, 10)) ?? null,
}));

describe("GET /api/step-completions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authorizeApiRequestMock.mockResolvedValue({
      session: { user: { id: "user-1", role: "TEACHER" } },
    });
    groupEnrollmentFindFirstMock.mockResolvedValue({ groupId: "group-primary" });
    stepCompletionFindManyMock.mockResolvedValue([]);
    buildTeachingSessionDurationByDateMock.mockResolvedValue(new Map());
  });

  it("returns 400 when studentId is missing", async () => {
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/step-completions"));

    expect(response.status).toBe(400);
    expect(stepCompletionFindManyMock).not.toHaveBeenCalled();
  });

  it("filters completions by session.group.subjectId when subjectId is provided", async () => {
    const { GET } = await import("./route");
    await GET(
      new Request(
        "http://localhost/api/step-completions?studentId=student-1&subjectId=subject-quran",
      ),
    );

    expect(groupEnrollmentFindFirstMock).not.toHaveBeenCalled();
    expect(stepCompletionFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentId: "student-1",
          isPriorCredit: false,
          session: expect.objectContaining({
            isAdjustment: false,
            group: { subjectId: "subject-quran" },
          }),
        }),
      }),
    );
  });

  it("keeps legacy query without subject filter when subjectId is omitted", async () => {
    const { GET } = await import("./route");
    await GET(
      new Request("http://localhost/api/step-completions?studentId=student-1"),
    );

    expect(groupEnrollmentFindFirstMock).toHaveBeenCalled();
    expect(stepCompletionFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studentId: "student-1",
        },
      }),
    );
  });

  it("uses session groupId for duration map when subjectId is provided", async () => {
    const sessionDate = new Date("2026-07-10T12:00:00.000Z");
    stepCompletionFindManyMock.mockResolvedValue([
      {
        id: "completion-1",
        stepId: "step-1",
        grade: 5,
        note: null,
        createdAt: sessionDate,
        step: { order: 1, title: "Шаг 1", hours: 1 },
        session: {
          id: "session-1",
          date: sessionDate,
          attendance: "PRESENT",
          groupId: "group-quran",
        },
      },
    ]);
    buildTeachingSessionDurationByDateMock.mockResolvedValue(
      new Map([["2026-07-10", 45]]),
    );

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/step-completions?studentId=student-1&subjectId=subject-quran",
      ),
    );

    expect(response.status).toBe(200);
    expect(buildTeachingSessionDurationByDateMock).toHaveBeenCalledWith(
      "group-quran",
      expect.objectContaining({
        gte: expect.any(Date),
        lte: expect.any(Date),
      }),
    );
    const json = (await response.json()) as {
      data: Array<{ session: { sessionDurationMinutes: number | null } }>;
      error: null;
    };
    expect(json.error).toBeNull();
    expect(json.data[0]?.session.sessionDurationMinutes).toBe(45);
  });
});
