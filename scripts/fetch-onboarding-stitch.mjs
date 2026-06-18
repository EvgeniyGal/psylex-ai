import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "docs", "stitch");
const PROJECT_ID = "4139161588628616929";

const screens = [
  { id: "e860d541e7cc46c3a554af3ad1ca549a", name: "welcome-screen" },
  { id: "a44ea237b6ed4933b823d8ddffb3feda", name: "disclaimer-consent" },
  { id: "e68406b2ae684411886bbebe2b284205", name: "testing-dashboard" },
];

function getApiKey() {
  if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY;
  const mcpPath = path.join(process.env.USERPROFILE || process.env.HOME || "", ".cursor", "mcp.json");
  if (!fs.existsSync(mcpPath)) return null;
  const mcp = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
  return mcp?.mcpServers?.stitch?.headers?.["X-Goog-Api-Key"] ?? null;
}

async function stitchCall(apiKey, args) {
  const res = await fetch("https://stitch.googleapis.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "get_screen", arguments: args },
    }),
  });
  const data = await res.json();
  const content = data.result?.content?.[0]?.text;
  return content ? JSON.parse(content) : data.result;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("No STITCH_API_KEY found");
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const screen of screens) {
    console.log(`Fetching ${screen.name}...`);
    const result = await stitchCall(apiKey, {
      name: `projects/${PROJECT_ID}/screens/${screen.id}`,
      projectId: PROJECT_ID,
      screenId: screen.id,
    });
    if (result?.htmlCode?.downloadUrl) {
      await download(result.htmlCode.downloadUrl, path.join(outDir, `${screen.name}.html`));
      console.log(`  saved ${screen.name}.html`);
    }
    if (result?.screenshot?.downloadUrl) {
      await download(`${result.screenshot.downloadUrl}=s2560`, path.join(outDir, `${screen.name}.png`));
      console.log(`  saved ${screen.name}.png`);
    }
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
