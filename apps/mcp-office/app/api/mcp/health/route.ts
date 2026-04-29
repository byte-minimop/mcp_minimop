import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { MCPHealthResponse } from "@/lib/mcp/contract";

export const runtime = "nodejs";

type StorageCheck = NonNullable<NonNullable<MCPHealthResponse["checks"]>["storage"]>;

function checkStorage(): StorageCheck {
  const isDataDirConfigured = Boolean(process.env.MCP_DATA_DIR);
  const dataDir = process.env.MCP_DATA_DIR ?? path.resolve(process.cwd(), "data");
  const probePath = path.join(dataDir, `.mcp-health-${process.pid}-${Date.now()}`);
  const probeValue = "ok";

  if (process.env.NODE_ENV === "production" && !isDataDirConfigured) {
    return {
      ok: false,
      data_dir_configured: false,
      error: "storage_data_dir_unconfigured",
    };
  }

  try {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(probePath, probeValue, { encoding: "utf8" });
    const storedValue = readFileSync(probePath, { encoding: "utf8" });
    rmSync(probePath, { force: true });

    if (storedValue !== probeValue) {
      return {
        ok: false,
        data_dir_configured: isDataDirConfigured,
        error: "storage_probe_mismatch",
      };
    }

    return {
      ok: true,
      data_dir_configured: isDataDirConfigured,
    };
  } catch {
    try {
      rmSync(probePath, { force: true });
    } catch {
      // Ignore cleanup failures; the health response should report the storage failure.
    }

    return {
      ok: false,
      data_dir_configured: isDataDirConfigured,
      error: "storage_unavailable",
    };
  }
}

export function GET(): NextResponse<MCPHealthResponse> {
  const storage = checkStorage();
  const status = storage.ok ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      version: "1",
      timestamp: new Date().toISOString(),
      checks: {
        storage,
      },
    },
    { status: storage.ok ? 200 : 503 }
  );
}
