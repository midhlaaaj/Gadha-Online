import { NextResponse, type NextRequest } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Memory store for sliding window rate limiting
const ipStore: RateLimitStore = {};

// Clean up expired IP entries every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const ip in ipStore) {
    if (ipStore[ip].resetTime < now) {
      delete ipStore[ip];
    }
  }
}, 120000);

export function rateLimit(
  request: NextRequest,
  options = { maxRequests: 60, windowMs: 60000 }
): NextResponse | null {
  // Extract client IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "127.0.0.1";
  
  const pathname = request.nextUrl.pathname;
  const isPost = request.method === "POST";
  
  // Stricter limits for POST, auth, and sensitive operations
  let max = options.maxRequests;
  let windowMs = options.windowMs;

  if (pathname.includes("/auth") || pathname.includes("/login") || pathname.includes("/signup")) {
    max = 10; // Max 10 auth attempts per minute
  } else if (isPost || pathname.startsWith("/api/")) {
    max = 30; // Max 30 POST/API requests per minute
  }

  const key = `${ip}:${pathname.startsWith("/api") ? "api" : isPost ? "post" : "page"}`;
  const now = Date.now();

  if (!ipStore[key] || ipStore[key].resetTime < now) {
    ipStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return null;
  }

  ipStore[key].count += 1;

  if (ipStore[key].count > max) {
    const retryAfter = Math.ceil((ipStore[key].resetTime - now) / 1000);
    return new NextResponse(
      JSON.stringify({
        error: "Too Many Requests",
        message: "You have exceeded the request rate limit. Please try again shortly.",
        retryAfterSeconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(max),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
