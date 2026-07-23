"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboardIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/lms/overview");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect-on-mount only; router is a stable Next.js instance
  }, []);
  return null;
}
