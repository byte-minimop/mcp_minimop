import { cookies } from "next/headers";
import { RunsListView } from "@/components/mcp/RunsListView";
import { listRuns, isExecutionTraceAvailable } from "@/lib/mcp/execution-trace";
import { listCaseSnapshotRows } from "@/lib/mcp/case-snapshot-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cookie written by Beacon when an active Google Ads account is selected.
// Only read when the user explicitly requests account-scoped view (?scope=account).
// MCP default is admin-wide — operational oversight must not depend on Beacon UI state.
const ACTIVE_ACCOUNT_COOKIE = "beacon_placeholder_active_account";

export default async function RunsIndexPage(
  { searchParams }: { searchParams?: Promise<{ scope?: string; customer_id?: string; q?: string }> },
) {
  const available = isExecutionTraceAvailable();
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();

  // Resolution order — admin-wide is the default:
  //   ?customer_id=...   → explicit account filter
  //   ?scope=account     → opt-in to Beacon's active-account cookie
  //   ?scope=all         → explicit admin-wide (same as default, kept for backward compat)
  //   nothing            → admin-wide (operational oversight must not depend on Beacon UI state)
  let activeCustomerId: string | null = null;
  if (params.customer_id) {
    activeCustomerId = params.customer_id;
  } else if (params.scope === "account") {
    activeCustomerId = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value ?? null;
  }
  // else: null = admin-wide (default)

  const runs = available ? listRuns(100, activeCustomerId) : listCaseSnapshotRows(100, activeCustomerId);
  return (
    <RunsListView
      runs={runs}
      available={available || runs.length > 0}
      scope={activeCustomerId ? { kind: "customer", customer_id: activeCustomerId } : { kind: "all" }}
      initialQuery={params.q ?? ""}
      source={available ? "beacon_sqlite" : "case_snapshot"}
    />
  );
}
