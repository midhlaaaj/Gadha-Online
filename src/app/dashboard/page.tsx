"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardIndex() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const child = searchParams.get("child");
    router.replace(`/dashboard/overview${child ? `?child=${child}` : ""}`);
  }, []);

  return null;
}
