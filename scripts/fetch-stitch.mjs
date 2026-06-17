import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "docs", "stitch");

const PROJECT_ID = "4139161588628616929";

const screens = [
  { id: "439cef063c644a748e736da04ec6ac28", name: "prism-concept" },
  { id: "6a083dbbd6704172a6dd7124e35f29f5", name: "logo" },
  { id: "asset-stub-assets_3ff8f14bec7d444e8876edaff18e1443", name: "design-system" },
  { id: "10542681353879881039", name: "landing-how-it-works" },
  { id: "c1d10cd876204d948c6f251dce359da5", name: "admin-settings" },
  { id: "f3c62eb393d74211b14458d98342016d", name: "admin-sessions" },
  { id: "27c3a600e85a40fc8824fb686d3f7501", name: "admin-mediators" },
];

function getApiKey() {
  if (process.env.STITCH_API_KEY) return process.env.STITCH_API_KEY;
  const mcpPath = path.join(process.env.USERPROFILE || process.env.HOME || "", ".cursor", "mcp.json");
  if (!fs.existsSync(mcpPath)) return null;
  const mcp = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
  return mcp?.mcpServers?.stitch?.headers?.["X-Goog-Api-Key"] ?? null;
}

async function stitchCall(apiKey, toolName, args) {
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
      params: { name: toolName, arguments: args },
    }),
  });
  if (!res.ok) throw new Error(`MCP HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  const content = data.result?.content?.[0]?.text;
  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return data.result;
    }
  }
  return data.result?.structuredContent ?? data.result;
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("No STITCH_API_KEY found");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  for (const screen of screens) {
    const name = `projects/${PROJECT_ID}/screens/${screen.id}`;
    console.log(`Fetching ${screen.name}...`);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const result = await stitchCall(apiKey, "get_screen", {
        name,
        projectId: PROJECT_ID,
        screenId: screen.id,
      });

      const htmlUrl = result?.htmlCode?.downloadUrl;
      const imgUrl = result?.screenshot?.downloadUrl;

      if (htmlUrl) {
        await download(htmlUrl, path.join(outDir, `${screen.name}.html`));
        console.log(`  saved ${screen.name}.html`);
      }
      if (imgUrl) {
        const imgDest = path.join(outDir, `${screen.name}.png`);
        await download(`${imgUrl}=s2560`, imgDest);
        console.log(`  saved ${screen.name}.png`);
      }
    } catch (err) {
      console.error(`  failed ${screen.name}:`, err.message);
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
