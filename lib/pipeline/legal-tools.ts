import type { LegalAnalysis } from "@/lib/pipeline/schemas";

/** Future hook for external legal APIs alongside local RAG. */
export type ExternalLegalToolResult = {
  source: string;
  content: string;
};

export interface LegalToolsProvider {
  searchExternal?(query: string, jurisdiction: string): Promise<ExternalLegalToolResult[]>;
}

export const defaultLegalToolsProvider: LegalToolsProvider = {};

export function mergeLegalToolResults(
  ragAnalysis: LegalAnalysis,
  _external: ExternalLegalToolResult[],
): LegalAnalysis {
  return ragAnalysis;
}
