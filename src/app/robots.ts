import type { MetadataRoute } from "next";

const BASE_URL = "https://gadhaonline.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/lms", "/mentor", "/my-children", "/profile", "/bookings"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
