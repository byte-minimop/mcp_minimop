import { McpOfficeView } from "@/components/mcp/McpOfficeView";
import { REAL } from "@/lib/mcp/real-data";
import { getBeaconOperationalSnapshot } from "@/lib/mcp/beacon-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function McpOfficePage() {
  const beacon = getBeaconOperationalSnapshot();
  return <McpOfficeView data={REAL} beacon={beacon} />;
}
