/**
 * New Realities — authoritative corporate knowledge pack.
 *
 * This file is the single source of truth for Concentrix's current campaign
 * platform, market positioning, audience strategy, messaging hierarchy, and
 * corporate narrative direction.
 *
 * IMPORTANT — SCOPE AND USAGE
 *   This is shared enterprise knowledge. It is NOT Google Ads-specific logic,
 *   NOT Beacon-specific logic, and NOT channel execution rules. Channel
 *   execution guidance (e.g. paid search priorities) is DERIVED from this
 *   pack — it does not define it.
 *
 *   Any MCP coworker or agent that needs to reason about Concentrix positioning,
 *   messaging, audience strategy, or narrative direction should import from this
 *   file — not embed its own copy of these truths.
 *
 * VERSION
 *   pack_version: "1.0"  —  increment when authoritative corporate truth changes.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type CampaignStoryId =
  | "end_of_ai_fantasy"
  | "built_for_reality"
  | "stop_piloting_start_performing"
  | "here_for_whats_next";

export type FunnelStage = "awareness" | "consideration" | "conversion" | "authority";

export interface CampaignStory {
  id: CampaignStoryId;
  name: string;
  stage: FunnelStage;
  thesis: string;
}

export interface MessagePillar {
  phrase: string;
}

export interface AudienceRole {
  role: string;
  rationale: string;
}

export interface MessagingHierarchyLevel {
  level_id: "brand_position" | "brand_mandate" | "campaign_platform" | "campaign_line";
  phrase: string;
  /** When this phrase is appropriate to use */
  scope: string;
  /** How to apply it correctly; what mixing rule applies */
  rule: string;
}

export interface NewRealitiesKnowledgePack {
  pack_id: "new_realities";
  pack_version: "1.0";

  /** Core campaign and brand identity — the hierarchy must be preserved */
  identity: {
    campaign_platform: string;
    campaign_line: string;
    brand_position: string;
    brand_mandate: {
      phrase: string;
      /** Brand mandate is for corporate contexts only — never mix into campaign copy */
      scope: "corporate_only";
    };
  };

  /**
   * Strict phrase hierarchy.
   * These levels must not be collapsed into each other.
   * Any agent generating or validating copy should enforce these boundaries.
   */
  messaging_hierarchy: MessagingHierarchyLevel[];

  /** The market moment this campaign responds to */
  market_context: {
    era: string;
    core_problem: string;
    execution_gap: string;
    market_truth: string;
  };

  /**
   * The central insight that drives the campaign platform.
   * This is the "why now" and "why this matters" for all New Realities work.
   */
  core_insight: {
    summary: string;
    failure_modes: string[];
  };

  /**
   * What Concentrix promises and how it differentiates.
   * Use this as the "what we do" anchor when building messaging.
   */
  core_promise: {
    summary: string;
    capabilities: string[];
    accountability_scope: string;
  };

  /**
   * Who to address and how.
   * Primary buyers own outcomes and budget. Influencers must be acknowledged
   * but must not become the center of gravity.
   */
  audience: {
    primary_buyers: AudienceRole[];
    influencers: AudienceRole[];
    tone_guidance: string;
  };

  /**
   * Hard positioning rules.
   * must_not_be: categories Concentrix must never be positioned as.
   * must_be: the correct positioning categories.
   * Any agent generating or validating messaging should check against these.
   */
  positioning: {
    must_not_be_positioned_as: string[];
    must_be_positioned_as: string[];
  };

  /**
   * The four campaign stories. Each maps to a funnel stage.
   * Use the story that matches the campaign's funnel/intent objective.
   */
  campaign_stories: CampaignStory[];

  /** The four message pillars. Use these as organizing axes for copy and strategy. */
  message_pillars: MessagePillar[];

  /**
   * The company's active narrative direction.
   * challenges: what the narrative actively pushes back on
   * emphasizes: what the narrative leans into
   * avoids: what the narrative steers away from
   */
  narrative_direction: {
    challenges: string[];
    emphasizes: string[];
    avoids: string[];
  };

  /**
   * Derived channel execution guidance.
   * This is secondary — channel rules derive from the shared truth above.
   * Channel-specific agents may extend this but must not override the core pack.
   */
  channel_guidance: {
    paid_performance: {
      priority_story: CampaignStoryId;
      emphasis: string[];
      avoid: string[];
      rationale: string;
    };
  };
}

// ── Authoritative knowledge pack ──────────────────────────────────────────────

export const NEW_REALITIES: NewRealitiesKnowledgePack = {
  pack_id: "new_realities",
  pack_version: "1.0",

  identity: {
    campaign_platform: "New Realities",
    campaign_line: "Real starts here",
    brand_position: "The Intelligent Transformation Partner",
    brand_mandate: {
      phrase: "To power a world that works",
      scope: "corporate_only",
    },
  },

  messaging_hierarchy: [
    {
      level_id: "brand_position",
      phrase: "The Intelligent Transformation Partner",
      scope: "all corporate contexts",
      rule: "Defines who Concentrix is. Use to anchor identity, not as a tagline.",
    },
    {
      level_id: "brand_mandate",
      phrase: "To power a world that works",
      scope: "corporate_only",
      rule: "Explains why Concentrix exists. For corporate comms only — do not mix into campaign copy or paid media.",
    },
    {
      level_id: "campaign_platform",
      phrase: "New Realities",
      scope: "campaign contexts",
      rule: "Names the market moment and campaign platform. Not a tagline; sets the strategic frame.",
    },
    {
      level_id: "campaign_line",
      phrase: "Real starts here",
      scope: "campaign copy and campaign-facing outputs",
      rule: "The campaign declaration and response. Use as the primary campaign-level expression.",
    },
  ],

  market_context: {
    era: "Intelligence Era",
    core_problem:
      "Enterprise AI investment is high but a large share of AI initiatives fail in execution — not from lack of access but from failure to operationalize AI at scale in real enterprise environments.",
    execution_gap:
      "The gap between AI ambition and operational reality is the central market truth. Most AI ambition stops at the pilot stage.",
    market_truth:
      "The key problem is not AI access; it is making AI perform reliably at scale inside live operations.",
  },

  core_insight: {
    summary:
      "Transformation fails when AI meets real operations: legacy systems, governance constraints, workforce realities, and enterprise complexity. AI only creates value when it performs reliably at scale inside live operations.",
    failure_modes: [
      "AI stuck at pilot stage",
      "AI meets legacy systems and stalls",
      "Governance and compliance barriers block operationalization",
      "Workforce realities not accounted for in AI rollout",
      "Enterprise complexity not addressed in AI design",
      "Strategy-only engagements that never reach execution",
    ],
  },

  core_promise: {
    summary:
      "Concentrix makes intelligence work in the real world by designing, building, and running integrated human + AI operations — and staying accountable for outcomes beyond pilots, demos, and strategy-only engagements.",
    capabilities: ["designs", "builds", "runs"],
    accountability_scope:
      "Beyond pilots and demos. Concentrix stays through execution and is accountable for real operational outcomes.",
  },

  audience: {
    primary_buyers: [
      {
        role: "COO",
        rationale: "Owns operational outcomes and operational AI ROI",
      },
      {
        role: "CMO",
        rationale: "Owns marketing operations, customer experience, and performance accountability",
      },
      {
        role: "CRO",
        rationale: "Owns revenue operations and commercial outcome accountability",
      },
      {
        role: "Chief Digital Officer",
        rationale: "Owns digital transformation execution and AI operationalization mandate",
      },
    ],
    influencers: [
      {
        role: "CIO",
        rationale: "Technical infrastructure authority — blocker or enabler, not primary buyer",
      },
      {
        role: "CTO",
        rationale: "Technical credibility audience — must be satisfied but not the center of gravity",
      },
    ],
    tone_guidance:
      "Maintain technical credibility without shifting the center of gravity into deep technical tone. Speak to operational outcomes, not platform capabilities.",
  },

  positioning: {
    must_not_be_positioned_as: [
      "a pure AI software vendor",
      "a legacy BPO",
      "a strategy-only consultancy",
    ],
    must_be_positioned_as: [
      "an operational transformation partner",
      "a human + AI orchestration expert",
      "an accountable operator that stays through execution",
    ],
  },

  campaign_stories: [
    {
      id: "end_of_ai_fantasy",
      name: "The End of AI Fantasy",
      stage: "awareness",
      thesis:
        "Attacks AI hype, demos, and pilot theater. Challenges the belief that AI access alone drives transformation. Opens the conversation about real operational failure.",
    },
    {
      id: "built_for_reality",
      name: "Built for Reality",
      stage: "consideration",
      thesis:
        "Scaling AI is an operations problem, not just a technology problem. Concentrix is built to bridge the gap between AI strategy and real-world execution at enterprise scale.",
    },
    {
      id: "stop_piloting_start_performing",
      name: "Stop Piloting, Start Performing",
      stage: "conversion",
      thesis:
        "Pilots do not drive revenue — operations do. Concentrix converts AI investment into measurable operational outcomes. Strongest story for commercial and performance-oriented contexts.",
    },
    {
      id: "here_for_whats_next",
      name: "Here for What's Next",
      stage: "authority",
      thesis:
        "Concentrix already operates where the market is going. Positions Concentrix as the thought leader and operational expert for the Intelligence Era — for authority and trust-building contexts.",
    },
  ],

  message_pillars: [
    { phrase: "Outcomes, Not Promises" },
    { phrase: "Scale That Stays" },
    { phrase: "The Intelligence Advantage" },
    { phrase: "Real Starts Here" },
  ],

  narrative_direction: {
    challenges: [
      "AI hype and over-promise",
      "Pilot theater — demos and pilots that never reach production",
      "Feature-first vendor positioning",
      "Future-gazing that avoids accountability for present outcomes",
    ],
    emphasizes: [
      "Real operational execution — not strategy or demos",
      "Design + build + run — full lifecycle accountability",
      "Accountability for outcomes beyond the engagement",
      "Intelligence working inside real enterprise complexity",
      "Integrated human + AI operations",
      "Reliability and performance at scale in live environments",
    ],
    avoids: [
      "Feature hype and capability lists",
      "Future-gazing without operational grounding",
      "Vendor-style AI positioning (platform, tools, models)",
      "Deep technical tone that alienates operational buyers",
      "Legacy BPO identity or cost-reduction-only framing",
      "Strategy-only consulting language",
    ],
  },

  channel_guidance: {
    paid_performance: {
      priority_story: "stop_piloting_start_performing",
      emphasis: [
        "Outcomes and measurable operational performance",
        "Accountability — Concentrix stays through execution",
        "Operational transformation, not just AI access",
      ],
      avoid: [
        "Future-gazing and speculative AI language",
        "Feature lists and platform capability claims",
        "Platform hype and vendor-style positioning",
      ],
      rationale:
        "Story 3 (Stop Piloting, Start Performing) is the strongest conversion story because it speaks directly to commercial accountability and revenue outcomes — the language of the primary buying audience.",
    },
  },
};
