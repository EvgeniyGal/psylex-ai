"use server";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { legalDocuments } from "@/drizzle/schema";
import { isLegalDocumentCategory } from "@/lib/rag/categories";
import { getAllLegalDocuments } from "@/lib/rag/documents";
import { validateUploadFile } from "@/lib/rag/extract";
import { processDocument } from "@/lib/rag/ingest";
import { runRagInquiry } from "@/lib/rag/inquiry";
import { isRoomJurisdiction } from "@/lib/room/jurisdiction";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

const uploadSchema = z.object({
  name: z.string().trim().min(1),
  sourceUrl: z.string().trim().url(),
  jurisdiction: z.string().refine(isRoomJurisdiction, "Invalid jurisdiction"),
  category: z.string().refine(isLegalDocumentCategory, "Invalid category"),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  sourceUrl: z.string().trim().url(),
  category: z.string().refine(isLegalDocumentCategory, "Invalid category"),
});

export async function uploadDocument(formData: FormData) {
  await requireAdmin();
  const userId = await requireSessionUserId();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("Document file is required.");
  }

  const parsed = uploadSchema.parse({
    name: formData.get("name"),
    sourceUrl: formData.get("sourceUrl"),
    jurisdiction: formData.get("jurisdiction"),
    category: formData.get("category"),
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { mimeType } = validateUploadFile(file.name, buffer.length);

  const [created] = await db
    .insert(legalDocuments)
    .values({
      name: parsed.name,
      sourceUrl: parsed.sourceUrl,
      jurisdiction: parsed.jurisdiction,
      category: parsed.category,
      originalFilename: file.name,
      mimeType,
      fileData: buffer,
      status: "pending",
      uploadedByUserId: userId,
    })
    .returning({ id: legalDocuments.id });

  try {
    await processDocument(created.id);
  } catch {
    // Status is persisted as failed inside processDocument.
  }

  revalidatePath("/admin/settings");
}

export async function updateDocument(formData: FormData) {
  await requireAdmin();

  const parsed = updateSchema.parse({
    id: formData.get("id"),
    name: formData.get("name"),
    sourceUrl: formData.get("sourceUrl"),
    category: formData.get("category"),
  });

  await db
    .update(legalDocuments)
    .set({
      name: parsed.name,
      sourceUrl: parsed.sourceUrl,
      category: parsed.category,
      updatedAt: new Date(),
    })
    .where(eq(legalDocuments.id, parsed.id));

  revalidatePath("/admin/settings");
}

export async function deleteDocument(documentId: string) {
  await requireAdmin();

  if (!z.string().uuid().safeParse(documentId).success) {
    throw new Error("Invalid document id.");
  }

  await db.delete(legalDocuments).where(eq(legalDocuments.id, documentId));
  revalidatePath("/admin/settings");
}

export async function reprocessDocument(documentId: string) {
  await requireAdmin();

  if (!z.string().uuid().safeParse(documentId).success) {
    throw new Error("Invalid document id.");
  }

  try {
    await processDocument(documentId);
  } catch {
    // Failed status is stored on the document.
  }

  revalidatePath("/admin/settings");
}

export async function testInquiry(formData: FormData) {
  await requireAdmin();

  const jurisdiction = String(formData.get("jurisdiction") ?? "");
  const question = String(formData.get("question") ?? "").trim();
  const documentId = String(formData.get("documentId") ?? "").trim();
  const categoryValue = String(formData.get("category") ?? "").trim();
  const localeValue = String(formData.get("locale") ?? "en");
  const locale = localeValue === "uk" ? "uk" : "en";

  if (!isRoomJurisdiction(jurisdiction)) throw new Error("Invalid jurisdiction.");
  if (!question) throw new Error("Question is required.");

  const category = categoryValue && isLegalDocumentCategory(categoryValue) ? categoryValue : undefined;

  if (documentId) {
    const [document] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, documentId)).limit(1);
    if (!document) throw new Error("Document not found.");
    if (document.status !== "ready") throw new Error("Document processing is not complete.");

    return runRagInquiry({
      question,
      jurisdiction: document.jurisdiction,
      category: document.category,
      documentId: document.id,
      locale,
    });
  }

  return runRagInquiry({
    question,
    jurisdiction,
    category,
    locale,
  });
}

export async function loadRagDocuments() {
  await requireAdmin();
  return getAllLegalDocuments();
}
