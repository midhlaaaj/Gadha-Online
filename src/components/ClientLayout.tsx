"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Conditionally render the Navbar. We don't render it on the admin page.
  const showNavbar = !pathname.startsWith("/admin") && !pathname.startsWith("/lms") && !(pathname.startsWith("/mentor") && !pathname.startsWith("/mentors"));

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}
