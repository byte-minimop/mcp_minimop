export interface VendorDocSnippet {
  title: string;
  url: string;
  snippet: string;
  source: string;
  docType?: string | null;
  updateTime?: string | null;
  parent?: string | null;
}

export interface VendorDocSearchResult {
  query: string;
  results: VendorDocSnippet[];
}
