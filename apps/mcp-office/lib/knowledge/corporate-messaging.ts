/**
 * Corporate messaging runtime adapter.
 *
 * Derives lean runtime guidance from the New Realities knowledge pack and
 * returns it in the shape expected by the MCP API contract. This is the
 * only file in lib/knowledge/ that is MCP-contract-aware.
 *
 * The separation is intentional:
 *   lib/knowledge/new-realities.ts   — pure company truth, no dependencies
 *   lib/knowledge/corporate-messaging.ts — MCP runtime adapter, thin layer
 *
 * Called by context-assembly.ts when corporate campaign context is detected.
 */

import { NEW_REALITIES, type CampaignStory } from "./new-realities";
import type { MCPCorporateMessagingGuidance } from "../mcp/contract";

/**
 * Derive runtime corporate messaging guidance from the New Realities pack.
 *
 * Returns null for careers context — positioning guidance is not relevant.
 * Returns null if the knowledge pack is somehow unavailable (defensive; in
 * practice it's a static import and this cannot happen at runtime).
 *
 * The recommended_story is selected based on available context signals:
 *   - Default: Story 3 (Stop Piloting, Start Performing) — best conversion story
 *   - Future extension: accept a funnel_stage hint to pick awareness/consideration/authority stories
 */
export function getCorporateMessagingGuidance(
  campaignContext: "careers" | "corporate",
): MCPCorporateMessagingGuidance | null {
  if (campaignContext !== "corporate") return null;

  const pack = NEW_REALITIES;

  const recommendedStory: CampaignStory =
    pack.campaign_stories.find(
      (s) => s.id === pack.channel_guidance.paid_performance.priority_story,
    ) ?? pack.campaign_stories[2]; // fallback to index 2 (stop_piloting_start_performing)

  return {
    source_pack: pack.pack_id,
    identity: {
      campaign_platform: pack.identity.campaign_platform,
      campaign_line: pack.identity.campaign_line,
      brand_position: pack.identity.brand_position,
    },
    primary_audience: pack.audience.primary_buyers.map((r) => r.role),
    influencer_audience: pack.audience.influencers.map((r) => r.role),
    recommended_story: {
      id: recommendedStory.id,
      name: recommendedStory.name,
      stage: recommendedStory.stage,
      thesis: recommendedStory.thesis,
    },
    all_stories: pack.campaign_stories.map((s) => ({
      id: s.id,
      name: s.name,
      stage: s.stage,
      thesis: s.thesis,
    })),
    message_pillars: pack.message_pillars.map((p) => p.phrase),
    positioning_constraints: {
      never: pack.positioning.must_not_be_positioned_as,
      always: pack.positioning.must_be_positioned_as,
    },
    language_rules: pack.messaging_hierarchy.map((h) => ({
      phrase: h.phrase,
      scope: h.scope,
      rule: h.rule,
    })),
    narrative_direction: {
      challenges: pack.narrative_direction.challenges,
      emphasizes: pack.narrative_direction.emphasizes,
      avoids: pack.narrative_direction.avoids,
    },
  };
}
