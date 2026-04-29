import { notFound } from "next/navigation";
import { ExecutionTraceView } from "@/components/mcp/ExecutionTraceView";
import { getExecutionTrace } from "@/lib/mcp/execution-trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const trace = getExecutionTrace(runId);
  if (!trace) notFound();
  return <ExecutionTraceView trace={trace} />;
}
