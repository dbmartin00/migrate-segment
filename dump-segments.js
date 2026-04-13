// dump-segments.js
// Exports all segments (and their keys) from Harness FME/Split to local JSON files.
// Each file is named {segmentName}.json and matches the schema expected by migrate-segment.js.
//
// Usage: node dump-segments.js [output-dir]
//   output-dir defaults to "src/"

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const HARNESS_API_KEY = process.env.HARNESS_API_KEY;
const WORKSPACE_ID = process.env.WORKSPACE_ID;
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;

if (!HARNESS_API_KEY || !WORKSPACE_ID || !ENVIRONMENT_ID) {
  console.error(
    `❌ Missing required environment variables: HARNESS_API_KEY: ${HARNESS_API_KEY} WORKSPACE_ID: ${WORKSPACE_ID}, ENVIRONMENT_ID: ${ENVIRONMENT_ID}`
  );
  process.exit(1);
}

const OUTPUT_DIR = process.argv[2] || "src";

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BASE_URL = "https://api.split.io/internal/api/v2";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-api-key": HARNESS_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllSegments() {
  const limit = 50;
  let offset = 0;
  let allSegments = [];
  let hasMore = true;

  while (hasMore) {
    console.log(`➡️  Fetching segments (offset ${offset})...`);
    const res = await api.get(`/segments/ws/${WORKSPACE_ID}?limit=${limit}&offset=${offset}`);
    const segments = res.data.objects || [];
    allSegments.push(...segments);
    console.log(`⬅️  Got ${segments.length} segments`);

    if (segments.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return allSegments;
}

// Normalize raw key entries — the API may return plain strings or objects like { key: "..." }
function normalizeKeys(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(k => (typeof k === "string" ? k : k.key ?? String(k)));
}

async function fetchKeys(segmentName) {
  // Try the keys sub-resource first; fall back to the segment root if 404
  try {
    const res = await api.get(`/segments/${ENVIRONMENT_ID}/${segmentName}/keys`);
    const data = res.data;
    // Response may be { keys: [...] } or { objects: [...] } depending on API version
    if (Array.isArray(data.keys)) return normalizeKeys(data.keys);
    if (Array.isArray(data.objects)) return normalizeKeys(data.objects);
    if (Array.isArray(data)) return normalizeKeys(data);
    return [];
  } catch (err) {
    if (err.response?.status === 404) {
      console.log(`⚠️  /keys endpoint 404 for ${segmentName}, trying segment root...`);
      try {
        const res = await api.get(`/segments/${ENVIRONMENT_ID}/${segmentName}`);
        const data = res.data;
        if (Array.isArray(data.keys)) return normalizeKeys(data.keys);
        if (Array.isArray(data.objects)) return normalizeKeys(data.objects);
      } catch (fallbackErr) {
        console.log(`⚠️  Could not fetch keys for ${segmentName}: ${fallbackErr.response?.status || fallbackErr.message}`);
      }
    } else {
      console.log(`⚠️  Error fetching keys for ${segmentName}: ${err.response?.status || err.message}`);
    }
    return [];
  }
}

async function main() {
  console.log("✅ dump-segments start");
  console.log(`   Output directory: ${path.resolve(OUTPUT_DIR)}\n`);

  const segments = await getAllSegments();
  console.log(`\n📦 Total segments: ${segments.length}\n`);

  for (const seg of segments) {
    const segmentName = seg.name || seg;
    console.log(`🚀 Processing: ${segmentName}`);

    const keys = await fetchKeys(segmentName);

    const payload = {
      keys,
      comment: "Exported from Harness FME",
    };

    const outPath = path.join(OUTPUT_DIR, `${segmentName}.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
    console.log(`✅ Written: ${outPath} (${keys.length} keys)`);
    console.log("======================");

    await sleep(500);
  }

  console.log("\n🎉 All done.");
}

main().catch(err => {
  console.error("❌ Script Error:", err.message);
  process.exit(1);
});
