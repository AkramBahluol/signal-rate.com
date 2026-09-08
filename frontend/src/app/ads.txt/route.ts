const authorizedSellerPattern = /^google\.com, pub-\d+, DIRECT, f08c47fec0942fa0$/;

export function GET() {
  const line = process.env.ADS_TXT_LINE?.trim();
  if (!line || !authorizedSellerPattern.test(line)) {
    return new Response("Advertising seller not configured.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  return new Response(`${line}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
