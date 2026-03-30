//
// DANGER!  THIS WILL DELETE ALL YOUR SEGMENTS
////
////
//
const axios = require('axios');

const workspaceId = process.env.WORKSPACE_ID;
const apiKey = process.env.HARNESS_API_KEY;

if (!workspaceId || !apiKey) {
  console.error("❌ Missing WORKSPACE_ID or HARNESS_API_KEY");
  process.exit(1);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const BASE_URL = `https://api.split.io/internal/api/v2/segments/ws/${workspaceId}`;

// Fetch all segments with pagination
async function getAllSegments() {
  const limit = 50;
  let offset = 0;
  let allSegments = [];
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await axios.get(`${BASE_URL}?limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const segments = res.data.objects || []; // adjust if API shape differs
      allSegments.push(...segments);

      console.log(`Fetched ${segments.length} segments (offset ${offset})`);

      if (segments.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }

    } catch (err) {
      console.error("❌ Error fetching segments:", err.response?.data || err.message);
      process.exit(1);
    }
  }

  return allSegments;
}

// Delete a single segment
async function deleteSegment(name) {
  try {
    await axios.delete(`${BASE_URL}/${name}`, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`🗑️ Deleted: ${name}`);
  } catch (err) {
    console.error(`❌ Failed to delete ${name}:`, err.response?.data || err.message);
  }
  await sleep(500);
}

// Main
(async () => {
  const segments = await getAllSegments();

  console.log(`\n🚨 Total segments found: ${segments.length}\n`);

  for (const seg of segments) {
    const name = seg.name || seg; // depends on API response shape
    await deleteSegment(name);
  }

  console.log("\n✅ Done deleting all segments");
})();
