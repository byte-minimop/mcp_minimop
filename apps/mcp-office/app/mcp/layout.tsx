import { McpShell } from "@/components/mcp/McpShell";

export default function McpLayout({ children }: { children: React.ReactNode }) {
  return <McpShell>{children}</McpShell>;
}
