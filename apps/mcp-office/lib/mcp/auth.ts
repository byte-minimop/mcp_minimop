import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

const MCP_SHARED_SECRET_HEADER = "x-mcp-shared-secret";

function safeEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.byteLength !== bBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Protects non-health MCP runtime endpoints with a shared service secret.
 *
 * Local development remains open when MCP_SHARED_SECRET is unset. Production
 * fails closed: if the secret is not configured, protected endpoints return 503.
 * /api/mcp/health intentionally stays public for platform health probes.
 */
export function requireMCPSharedSecret(req: NextRequest): NextResponse<{ error: string }> | null {
  const expectedSecret = process.env.MCP_SHARED_SECRET?.trim() ?? "";

  if (!expectedSecret) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "MCP shared-secret authentication is not configured." },
        { status: 503 },
      );
    }

    return null;
  }

  const providedSecret = req.headers.get(MCP_SHARED_SECRET_HEADER)?.trim() ?? "";
  if (!providedSecret || !safeEquals(providedSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
