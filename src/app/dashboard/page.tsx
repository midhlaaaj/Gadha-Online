"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardIndex() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const child = searchParams.get("child");
    router.replace(`/dashboard/overview${child ? `?child=${child}` : ""}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirect-on-mount only; router/searchParams are stable Next.js instances and re-running this on their identity changes would cause redirect loops
  }, []);

  return null;
}
