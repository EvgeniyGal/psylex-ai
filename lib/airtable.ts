import type { AirtableTableConfig } from "@/lib/airtable-config";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
};

function escapeFormulaValue(value: string) {
  return value.replace(/'/g, "''");
}

function buildFilterFormula(fieldName: string, value: string) {
  return `{${fieldName}}='${escapeFormulaValue(value)}'`;
}

export async function findAirtableRecordByLogin(
  apiKey: string,
  config: AirtableTableConfig,
  login: string,
): Promise<AirtableRecord | null> {
  const formula = buildFilterFormula(config.loginField, login);
  const url = new URL(
    `https://api.airtable.com/v0/${config.baseId}/${config.tableId}`,
  );
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("maxRecords", "1");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `Airtable request failed (${response.status}) for ${config.baseId}/${config.tableId}: ${body}`,
    );
    return null;
  }

  const data = (await response.json()) as AirtableListResponse;
  return data.records[0] ?? null;
}

export async function hasAirtableRecordForLogin(
  apiKey: string,
  config: AirtableTableConfig,
  login: string,
) {
  const record = await findAirtableRecordByLogin(apiKey, config, login);
  return record !== null;
}
