"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type StepCompletionRow = {
  id: string;
  stepId: string;
  grade: number;
  note: string | null;
  createdAt: string;
  step: {
    order: number;
    title: string;
    type: "LETTER" | "SURAH";
    hours: number;
  };
  session: {
    id: string;
    date: string;
    attendance: "PRESENT" | "LATE" | "ABSENT";
  };
};

export function useStepCompletions(studentId: string, date?: string | null) {
  return useQuery<StepCompletionRow[]>({
    queryKey: ["step-completions", studentId, date ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams({ studentId });
      if (date) params.set("date", date);
      const res = await fetch(`/api/step-completions?${params}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    enabled: !!studentId,
  });
}

export function useUpdateStepCompletion(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      grade,
      note,
    }: {
      id: string;
      grade: number;
      note?: string | null;
    }) => {
      const res = await fetch(`/api/step-completions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, note }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data as StepCompletionRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["step-completions", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-session", studentId] });
    },
  });
}

export function useDeleteStepCompletions(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/step-completions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["step-completions", studentId] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student-session", studentId] });
    },
  });
}
