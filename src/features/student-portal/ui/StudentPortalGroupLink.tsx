"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { writeStudentPortalGroupId } from "@/features/student-portal/lib/student-portal-storage";

type StudentPortalGroupLinkProps = {
  href: string;
  groupId: string;
  children: ReactNode;
};

export function StudentPortalGroupLink({
  href,
  groupId,
  children,
}: StudentPortalGroupLinkProps) {
  return (
    <Link href={href} onClick={() => writeStudentPortalGroupId(groupId)}>
      {children}
    </Link>
  );
}
