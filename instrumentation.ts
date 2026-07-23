// On this network, DNS64/NAT64 (e.g. Cloudflare WARP) synthesizes IPv6
// addresses (64:ff9b::/96) for IPv4-only hosts like Supabase storage.
// Next.js's image optimizer treats that prefix as a private IP and refuses
// to fetch it, breaking course/session cover images. Preferring IPv4
// resolution avoids the synthesized address entirely.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("node:dns");
    dns.setDefaultResultOrder("ipv4first");
  }
}
