import { McpOverviewView } from "@/components/mcp/McpOverviewView";
import { REAL } from "@/lib/mcp/real-data";
import { getBeaconOperationalSnapshot } from "@/lib/mcp/beacon-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function McpOverviewPage() {
  const beacon = getBeaconOperationalSnapshot();
  return <McpOverviewView data={REAL} beacon={beacon} />;
}
