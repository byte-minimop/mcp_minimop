import { notFound } from "next/navigation";
import { McpDetailView } from "@/components/mcp/McpDetailView";
import { detailPages } from "@/lib/mcp/office-data";
import { REAL } from "@/lib/mcp/real-data";
import { getBeaconActivity, getBeaconOperationalSnapshot } from "@/lib/mcp/beacon-activity";

export const runtime = "nodejs";

export default async function McpSurfacePage({
  params,
}: {
  params: Promise<{ surface: string }>;
}) {
  const { surface } = await params;
  const page = detailPages[surface];

  if (!page) {
    notFound();
  }

  // Query the Beacon database only for surfaces that display live operational data.
  const beaconActivity = surface === "beacon" ? getBeaconActivity() : null;
  const memorySnapshot = surface === "memory" ? getBeaconOperationalSnapshot() : null;

  return <McpDetailView page={page} data={REAL} beaconActivity={beaconActivity} memorySnapshot={memorySnapshot} />;
}
