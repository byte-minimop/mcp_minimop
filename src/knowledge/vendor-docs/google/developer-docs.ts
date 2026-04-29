import type { VendorDocSearchResult, VendorDocSnippet } from "../types";

type GoogleDeveloperProduct = "google-ads" | "ga4" | "gtm" | "search-console";

interface SearchGoogleDeveloperDocsOptions {
  pageSize?: number;
  product?: GoogleDeveloperProduct;
}

interface GoogleDeveloperSearchResponse {
  results?: Array<{
    document?: {
      derivedStructData?: {
        title?: string;
        link?: string;
        snippet?: string;
      };
      name?: string;
      id?: string;
      schemaId?: string;
      updateTime?: string;
      content?: {
        mimeType?: string;
      };
    };
  }>;
}

const GOOGLE_DEVELOPER_DOCS_API_BASE =
  "https://developerscontent.googleapis.com/v1alpha/projects/-/locations/global/collections/default_collection/dataStores/default_data_store/servingConfigs/default_search:search";

const DEFAULT_PAGE_SIZE = 5;

const PRODUCT_QUERY_HINTS: Record<GoogleDeveloperProduct, string> = {
  "google-ads": "site:developers.google.com/google-ads",
  ga4: "site:developers.google.com/analytics",
  gtm: "site:developers.google.com/tag-platform",
  "search-console": "site:developers.google.com/search",
};

function getGoogleDeveloperDocsApiKey(): string {
  const apiKey = process.env.GOOGLE_DEVELOPER_KNOWLEDGE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_DEVELOPER_KNOWLEDGE_API_KEY is not configured");
  }
  return apiKey;
}

function buildSearchQuery(query: string, product?: GoogleDeveloperProduct): string {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("query is required");
  }
  return product ? `${trimmed} ${PRODUCT_QUERY_HINTS[product]}` : trimmed;
}

function normalizeSnippet(
  row: NonNullable<GoogleDeveloperSearchResponse["results"]>[number]
): VendorDocSnippet | null {
  const document = row.document;
  const struct = document?.derivedStructData;
  if (!struct?.title || !struct.link) return null;

  return {
    title: struct.title,
    url: struct.link,
    snippet: struct.snippet ?? "",
    source: "google-developer-docs",
    docType: document?.schemaId ?? document?.content?.mimeType ?? null,
    updateTime: document?.updateTime ?? null,
    parent: document?.name ?? document?.id ?? null,
  };
}

export async function searchGoogleDeveloperDocs(
  query: string,
  options: SearchGoogleDeveloperDocsOptions = {}
): Promise<VendorDocSearchResult> {
  const apiKey = getGoogleDeveloperDocsApiKey();
  const finalQuery = buildSearchQuery(query, options.product);
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const response = await fetch(`${GOOGLE_DEVELOPER_DOCS_API_BASE}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: finalQuery,
      pageSize,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Google Developer Knowledge API request failed (${response.status}): ${body.slice(0, 240)}`
    );
  }

  const payload = await response.json() as GoogleDeveloperSearchResponse;
  if (!payload || (payload.results !== undefined && !Array.isArray(payload.results))) {
    throw new Error("Google Developer Knowledge API returned an unexpected response shape");
  }

  return {
    query: finalQuery,
    results: (payload.results ?? [])
      .map(normalizeSnippet)
      .filter((result): result is VendorDocSnippet => result !== null),
  };
}
