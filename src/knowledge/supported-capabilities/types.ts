export type SupportLevel = "supported" | "partial" | "visible_only" | "unsupported";

export interface SupportedCapability {
  id: string;
  label: string;
  supportLevel: SupportLevel;
  notes?: string;
}

export interface SupportedCapabilityRegistry {
  platform: string;
  owner: "marketing-mcp";
  summary: string;
  capabilities: SupportedCapability[];
}
