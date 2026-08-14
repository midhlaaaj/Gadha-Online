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
  options = { maxRequests: 120, windowMs: 60000 }
): NextResponse | null {
  // Extract client IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "127.0.0.1";

  const pathname = request.nextUrl.pathname;
  const isPost = request.method === "POST";
  const isApi = pathname.startsWith("/api/");
  const isAuth = pathname.includes("/auth") || pathname.includes("/login") || pathname.includes("/signup");

  // Only rate limit auth and POST/API requests — plain page navigations are unrestricted
  if (!isAuth && !isPost && !isApi) {
    return null;
  }

  // Stricter limits for POST, auth, and sensitive operations
  let max = options.maxRequests;
  const windowMs = options.windowMs;

  if (isAuth) {
    max = 10; // Max 10 auth attempts per minute — brute-force protection
  } else {
    // Server Actions are POSTs to the current page, and this app polls
    // (chat, notifications) every few seconds per open tab, so this needs
    // headroom above just "clicking around" for one legitimate user.
    max = 120; // Max 120 POST/API requests per minute
  }

  // Auth requests get their own bucket, separate from general POST/API
  // traffic — otherwise a burst of unrelated server-action calls (chat
  // polling, form saves, etc.) could eat into the much stricter 10/min
  // auth limit and lock a legitimate user out of the login page.
  const key = `${ip}:${isApi ? "api" : isAuth ? "auth" : "post"}`;
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
    const headers = {
      "Retry-After": String(retryAfter),
      "X-RateLimit-Limit": String(max),
      "X-RateLimit-Remaining": "0",
    };

    // Browser page navigations get a branded HTML page; background
    // fetches/Server Actions get JSON so calling code can handle it.
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (acceptsHtml) {
      return new NextResponse(renderRateLimitPage(retryAfter), {
        status: 429,
        headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new NextResponse(
      JSON.stringify({
        error: "Too Many Requests",
        message: "You have exceeded the request rate limit. Please try again shortly.",
        retryAfterSeconds: retryAfter,
      }),
      {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json" },
      }
    );
  }

  return null;
}

function renderRateLimitPage(retryAfterSeconds: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Too Many Requests | Gadha Online</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F7FF;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1B3A6B;
    padding: 24px;
  }
  .card {
    max-width: 420px;
    width: 100%;
    background: #fff;
    border: 1px solid #E6EBF8;
    border-radius: 20px;
    padding: 40px 32px;
    text-align: center;
    box-shadow: 0 20px 60px -20px rgba(27, 58, 107, 0.25);
  }
  .logo { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 28px; }
  .logo img { width: 34px; height: 34px; object-fit: contain; }
  .logo span { font-weight: 800; font-size: 17px; letter-spacing: -0.02em; }
  .icon-wrap {
    width: 64px; height: 64px; margin: 0 auto 20px;
    border-radius: 50%;
    background: #FFF4E5;
    display: flex; align-items: center; justify-content: center;
  }
  h1 { font-size: 19px; font-weight: 800; margin: 0 0 10px; letter-spacing: -0.01em; }
  p { font-size: 13px; line-height: 1.6; color: #6B7A99; margin: 0 0 24px; }
  .countdown {
    display: inline-flex; align-items: center; gap: 8px;
    background: #F5F7FF; border: 1px solid #E6EBF8;
    border-radius: 12px; padding: 10px 18px;
    font-size: 13px; font-weight: 700; color: #1B3A6B; margin-bottom: 24px;
  }
  .countdown b { color: #2F7FE8; font-variant-numeric: tabular-nums; }
  button {
    width: 100%; padding: 13px; border: none; border-radius: 12px;
    background: #2F7FE8; color: #fff; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: background 0.15s;
  }
  button:hover { background: #1B3A6B; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <img src="/logo.png" alt="Gadha Online" />
      <span>Gadha Online</span>
    </div>
    <div class="icon-wrap">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
    </div>
    <h1>Whoa, slow down a little</h1>
    <p>You've sent a lot of requests in a short time, so we've briefly paused this page to keep things running smoothly for everyone. It'll unlock itself automatically.</p>
    <div class="countdown">Retrying in <b id="secs">${retryAfterSeconds}</b>s</div>
    <button id="retryBtn" disabled onclick="location.reload()">Try Again</button>
  </div>
  <script>
    var secs = ${retryAfterSeconds};
    var el = document.getElementById("secs");
    var btn = document.getElementById("retryBtn");
    var timer = setInterval(function () {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(timer);
        el.textContent = "0";
        btn.disabled = false;
        btn.textContent = "Reload Now";
        location.reload();
      } else {
        el.textContent = String(secs);
      }
    }, 1000);
  </script>
</body>
</html>`;
}
