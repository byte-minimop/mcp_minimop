/**
 * Concentrix sitelink catalog — sourced from "Concentrix Sitelinks 25-26.xlsx".
 *
 * This is the authoritative list of approved Concentrix sitelinks.
 * The Google translator prompt uses this catalog to prioritise real sitelinks
 * over generated generic ones when the landing page URL matches.
 *
 * Future improvement: replace this static module with a runtime loader that
 * reads directly from the Excel/CSV source so updates don't require a deploy.
 */

export interface CatalogSitelink {
  text: string;       // Sitelink text (max 25 chars for Google Ads)
  desc1: string;      // Description Line 1
  desc2: string;      // Description Line 2
  url: string;        // Final URL (canonical)
}

export const SITELINK_CATALOG: CatalogSitelink[] = [
  // ── What We Do / Products ────────────────────────────────────────────────
  { text: "What We Do",           desc1: "End-to-end transformation",       desc2: "Design, Build, Run solutions",    url: "https://www.concentrix.com/what-we-do/" },
  { text: "iX Product Suite",     desc1: "AI-powered experience tools",     desc2: "Boost CX and productivity",       url: "https://www.concentrix.com/ix-product-suite/" },
  { text: "iX Hello",             desc1: "Multimodal AI assistants",        desc2: "No-code, fast deployment",        url: "https://www.concentrix.com/ix-hello/" },
  { text: "iX Hero",              desc1: "AI workspace for advisors",       desc2: "Boost CX and efficiency",         url: "https://www.concentrix.com/ix-hero/" },

  // ── Services overview ────────────────────────────────────────────────────
  { text: "Services Overview",    desc1: "Tech-powered performance",        desc2: "End-to-end capabilities",         url: "https://www.concentrix.com/services-solutions/" },

  // ── Strategy & Design ────────────────────────────────────────────────────
  { text: "Strategy & Design",    desc1: "Human-centric innovation",        desc2: "Accelerate transformation",       url: "https://www.concentrix.com/services-solutions/strategy-design/" },
  { text: "Experience Design",    desc1: "Design for growth",               desc2: "Human-centered solutions",        url: "https://www.concentrix.com/services-solutions/experience-design/" },
  { text: "Digital Innovation",   desc1: "Emerging tech solutions",         desc2: "Streamline operations",           url: "https://www.concentrix.com/services-solutions/digital-innovation/" },
  { text: "Lifecycle Engagement", desc1: "Customer journey focus",          desc2: "Boost loyalty and value",         url: "https://www.concentrix.com/services-solutions/lifecycle-engagement/" },
  { text: "Business Transform.",  desc1: "Future-ready practices",          desc2: "Optimize performance",            url: "https://www.concentrix.com/services-solutions/business-transformation/" },

  // ── Data & Analytics ─────────────────────────────────────────────────────
  { text: "Data & Analytics",     desc1: "Data-driven decisions",           desc2: "Unlock business insights",        url: "https://www.concentrix.com/services-solutions/data-analytics/" },
  { text: "Data & Analytics Tx.", desc1: "Transform with data",             desc2: "Drive smarter outcomes",          url: "https://www.concentrix.com/services-solutions/data-analytics-transformation/" },
  { text: "Data Engineering",     desc1: "Build data pipelines",            desc2: "Enable data access",              url: "https://www.concentrix.com/services-solutions/data-analytics/data-engineering/" },
  { text: "Advanced Analytics",   desc1: "Predictive insights",             desc2: "Improve decision-making",         url: "https://www.concentrix.com/services-solutions/advanced-analytics/" },
  { text: "Enterprise Intel.",    desc1: "Enterprise-wide insights",        desc2: "Data-powered decisions",          url: "https://www.concentrix.com/services-solutions/data-analytics/enterprise-intelligence/" },
  { text: "Operational Insights", desc1: "Optimize operations",             desc2: "Real-time analytics",             url: "https://www.concentrix.com/services-solutions/data-analytics/operational-insights/" },
  { text: "Voice of Customer",    desc1: "Customer feedback tools",         desc2: "Improve CX strategy",             url: "https://www.concentrix.com/services-solutions/voice-customer/" },
  { text: "AI Support & Data",    desc1: "AI and data support",             desc2: "Enhance automation",              url: "https://www.concentrix.com/services-solutions/ai-support-data-services/" },

  // ── Enterprise Technology ─────────────────────────────────────────────────
  { text: "Enterprise Tech",      desc1: "Modernize tech stack",            desc2: "AI-powered solutions",            url: "https://www.concentrix.com/services-solutions/enterprise-technology/" },
  { text: "Tech Transformation",  desc1: "Tech modernization",              desc2: "Accelerate innovation",           url: "https://www.concentrix.com/services-solutions/technology-transformation/" },
  { text: "Application Services", desc1: "App development",                 desc2: "Custom software solutions",       url: "https://www.concentrix.com/services-solutions/enterprise-technology/application-services/" },
  { text: "Enterprise Automation",desc1: "Automate processes",              desc2: "Boost efficiency",                url: "https://www.concentrix.com/services-solutions/enterprise-technology/enterprise-automation/" },
  { text: "Experience Platforms", desc1: "CX platforms",                    desc2: "Deliver seamless journeys",       url: "https://www.concentrix.com/services-solutions/enterprise-technology/experience-platforms/" },
  { text: "Testing Services",     desc1: "Quality assurance",               desc2: "Test digital solutions",          url: "https://www.concentrix.com/services-solutions/enterprise-technology/testing-services/" },
  { text: "CX Technology",        desc1: "Customer tech tools",             desc2: "Enhance experiences",             url: "https://www.concentrix.com/services-solutions/enterprise-technology/cx-technology/" },

  // ── AI ────────────────────────────────────────────────────────────────────
  { text: "Generative AI",        desc1: "AI content creation",             desc2: "Boost productivity",              url: "https://www.concentrix.com/services-solutions/generative-ai/" },
  { text: "Agentic AI",           desc1: "Autonomous AI agents",            desc2: "Drive intelligent actions",       url: "https://www.concentrix.com/services-solutions/agentic-ai/" },
  { text: "Cybersecurity",        desc1: "Protect digital assets",          desc2: "Secure your business",            url: "https://www.concentrix.com/services-solutions/cybersecurity/" },

  // ── Digital Operations ────────────────────────────────────────────────────
  { text: "Digital Operations",   desc1: "AI-powered operations",           desc2: "Solve business challenges",       url: "https://www.concentrix.com/services-solutions/digital-operations/" },
  { text: "Sales",                desc1: "Boost revenue",                   desc2: "Sales optimization",              url: "https://www.concentrix.com/services-solutions/sales/" },
  { text: "Marketing",            desc1: "Marketing solutions",             desc2: "Engage customers",                url: "https://www.concentrix.com/services-solutions/digital-operations/marketing/" },
  { text: "Customer Service",     desc1: "Support solutions",               desc2: "Improve satisfaction",            url: "https://www.concentrix.com/services-solutions/digital-operations/customer-service/" },
  { text: "Trust & Safety",       desc1: "Online safety tools",             desc2: "Protect users",                   url: "https://www.concentrix.com/services-solutions/digital-operations/trust-safety/" },
  { text: "Finance & Compliance", desc1: "Financial operations",            desc2: "Ensure compliance",               url: "https://www.concentrix.com/services-solutions/digital-operations/finance-compliance/" },
  { text: "Industry Solutions",   desc1: "Industry expertise",              desc2: "Tailored solutions",              url: "https://www.concentrix.com/industries/" },

  // ── Industries ────────────────────────────────────────────────────────────
  { text: "Automotive",           desc1: "Auto industry services",          desc2: "Drive transformation",            url: "https://www.concentrix.com/industries/automotive/" },
  { text: "Banking & Insurance",  desc1: "Financial solutions",             desc2: "Secure and scalable",             url: "https://www.concentrix.com/industries/bfsi/" },
  { text: "Energy & Utilities",   desc1: "Energy sector tools",             desc2: "Optimize operations",             url: "https://www.concentrix.com/industries/energy-utilities/" },
  { text: "Government & Public",  desc1: "Public sector support",           desc2: "Digital transformation",          url: "https://www.concentrix.com/industries/government-public-sector/" },
  { text: "Healthcare",           desc1: "Healthcare solutions",            desc2: "Improve patient care",            url: "https://www.concentrix.com/industries/healthcare/" },
  { text: "Media & Comms",        desc1: "Media industry tools",            desc2: "Engage audiences",                url: "https://www.concentrix.com/industries/media-communications/" },
  { text: "Retail & Ecommerce",   desc1: "Retail solutions",                desc2: "Boost online sales",              url: "https://www.concentrix.com/industries/retail-ecommerce/" },
  { text: "Technology & CE",      desc1: "Tech industry support",           desc2: "Innovate and grow",               url: "https://www.concentrix.com/industries/technology-consumer-electronics/" },
  { text: "Travel & Tourism",     desc1: "Travel industry tools",           desc2: "Enhance experiences",             url: "https://www.concentrix.com/industries/travel-transportation-tourism/" },

  // ── Content & Thought Leadership ─────────────────────────────────────────
  { text: "Thought Leadership",   desc1: "Expert insights",                 desc2: "Industry trends",                 url: "https://www.concentrix.com/thought-leadership/" },
  { text: "Case Studies",         desc1: "Success stories",                 desc2: "Real-world examples",             url: "https://www.concentrix.com/case-studies/" },
  { text: "Solution Sheets",      desc1: "Service overviews",               desc2: "Quick reference guides",          url: "https://www.concentrix.com/insights/solution-sheets/" },
  { text: "Events",               desc1: "Upcoming events",                 desc2: "Join our sessions",               url: "https://www.concentrix.com/events/" },

  // ── Company ───────────────────────────────────────────────────────────────
  { text: "About Concentrix",     desc1: "Company overview",                desc2: "Mission and values",              url: "https://www.concentrix.com/about/" },
  { text: "Investors",            desc1: "Investor relations",              desc2: "Financial information",           url: "https://ir.concentrix.com/" },
  { text: "Partners",             desc1: "Partner network",                 desc2: "Collaborate and grow",            url: "https://www.concentrix.com/partners/" },
  { text: "Newsroom",             desc1: "Latest updates",                  desc2: "Press releases",                  url: "https://www.concentrix.com/newsroom/" },
  { text: "Sustainability 2025",  desc1: "Sustainability goals",            desc2: "Progress and impact",             url: "https://www.concentrix.com/esg/" },
  { text: "Think Human Fund",     desc1: "Social impact",                   desc2: "Empower communities",             url: "https://www.thinkhumanfund.org/" },
  { text: "Concentrix Catalyst",  desc1: "Digital innovation",              desc2: "Accelerate growth",               url: "https://www.concentrix.com/catalyst/" },
  { text: "The Nest",             desc1: "Innovation hub",                  desc2: "Explore new ideas",               url: "https://www.concentrix.com/the-nest/" },
  { text: "Legal",                desc1: "Legal information",               desc2: "Terms and policies",              url: "https://www.concentrix.com/legal/" },
  { text: "Contact Us",           desc1: "Reach out to us",                 desc2: "Get support or info",             url: "https://www.concentrix.com/contact/" },

  // ── Careers (employer brand / recruitment) ───────────────────────────────
  { text: "Careers",              desc1: "Join our team",                   desc2: "Explore open roles",              url: "https://jobs.concentrix.com/" },
  { text: "Search Open Roles",    desc1: "Find your next role",             desc2: "Browse current vacancies",        url: "https://jobs.concentrix.com/search/" },
  { text: "Benefits & Perks",     desc1: "Competitive pay & benefits",      desc2: "Health, pension and more",        url: "https://jobs.concentrix.com/benefits/" },
  { text: "Life at Concentrix",   desc1: "Culture and belonging",           desc2: "See what our team says",          url: "https://jobs.concentrix.com/life-at-concentrix/" },
  { text: "Our Locations",        desc1: "Find roles near you",             desc2: "Offices and remote options",      url: "https://jobs.concentrix.com/locations/" },
];
