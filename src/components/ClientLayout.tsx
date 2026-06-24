"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobileMenuOpen = false; // dummy state if needed, not needed here

  // Conditionally render the Navbar. We don't render it on the admin page.
  const showNavbar = pathname !== "/admin";

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
}
