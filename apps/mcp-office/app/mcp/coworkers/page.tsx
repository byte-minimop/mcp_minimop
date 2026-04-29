import { McpCoworkersView } from "@/components/mcp/McpCoworkersView";
import { REAL } from "@/lib/mcp/real-data";
import { getBeaconOperationalSnapshot } from "@/lib/mcp/beacon-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function McpCoworkersPage() {
  const beacon = getBeaconOperationalSnapshot();
  return <McpCoworkersView data={REAL} beacon={beacon} />;
}
