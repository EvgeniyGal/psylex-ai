import { asc, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { legalDocuments } from "@/drizzle/schema";
import type { LegalDocumentCategory, LegalDocumentRow, RoomJurisdiction } from "@/lib/rag/types";

export async function getDocumentsByJurisdiction(
  jurisdiction: RoomJurisdiction,
  category?: LegalDocumentCategory,
): Promise<LegalDocumentRow[]> {
  const filters = [eq(legalDocuments.jurisdiction, jurisdiction)];
  if (category) filters.push(eq(legalDocuments.category, category));

  const rows = await db
    .select({
      id: legalDocuments.id,
      name: legalDocuments.name,
      sourceUrl: legalDocuments.sourceUrl,
      jurisdiction: legalDocuments.jurisdiction,
      category: legalDocuments.category,
      originalFilename: legalDocuments.originalFilename,
      mimeType: legalDocuments.mimeType,
      status: legalDocuments.status,
      errorMessage: legalDocuments.errorMessage,
      uploadedByUserId: legalDocuments.uploadedByUserId,
      createdAt: legalDocuments.createdAt,
      updatedAt: legalDocuments.updatedAt,
    })
    .from(legalDocuments)
    .where(filters.length === 1 ? filters[0] : and(...filters))
    .orderBy(asc(legalDocuments.createdAt));

  return rows;
}

export async function getAllLegalDocuments(): Promise<LegalDocumentRow[]> {
  return db
    .select({
      id: legalDocuments.id,
      name: legalDocuments.name,
      sourceUrl: legalDocuments.sourceUrl,
      jurisdiction: legalDocuments.jurisdiction,
      category: legalDocuments.category,
      originalFilename: legalDocuments.originalFilename,
      mimeType: legalDocuments.mimeType,
      status: legalDocuments.status,
      errorMessage: legalDocuments.errorMessage,
      uploadedByUserId: legalDocuments.uploadedByUserId,
      createdAt: legalDocuments.createdAt,
      updatedAt: legalDocuments.updatedAt,
    })
    .from(legalDocuments)
    .orderBy(asc(legalDocuments.createdAt));
}
