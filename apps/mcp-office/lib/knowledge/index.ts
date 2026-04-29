/**
 * MCP knowledge packs — shared enterprise knowledge layer.
 *
 * Each pack is an authoritative, structured, dependency-free knowledge module
 * reusable by any MCP coworker or agent. Packs define company-level truths;
 * channel-specific execution rules are derived from them, not embedded in them.
 */

export { NEW_REALITIES } from "./new-realities";
export type {
  NewRealitiesKnowledgePack,
  CampaignStory,
  CampaignStoryId,
  FunnelStage,
  MessagePillar,
  AudienceRole,
  MessagingHierarchyLevel,
} from "./new-realities";

export { getCorporateMessagingGuidance } from "./corporate-messaging";
