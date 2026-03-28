// migrate-segment.js
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const HARNESS_API_KEY = process.env.HARNESS_API_KEY;
const WORKSPACE_ID = process.env.WORKSPACE_ID;
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;
const TRAFFIC_TYPE = process.env.TRAFFIC_TYPE;

if (!HARNESS_API_KEY || !WORKSPACE_ID || !ENVIRONMENT_ID || !TRAFFIC_TYPE) {
  console.error(
    `Missing required environment variables: HARNESS_API_KEY: ${HARNESS_API_KEY} WORKSPACE_ID ${WORKSPACE_ID}, ENVIRONMENT_ID ${ENVIRONMENT_ID}, TRAFFIC_TYPE ${TRAFFIC_TYPE}`
  );
  process.exit(1);
}

// --- CLI ARG (MANDATORY) ---
const SOURCE_DIR = process.argv[2];

if (!SOURCE_DIR) {
  console.error("❌ Missing required argument: source directory");
  console.error("Usage: node migrate-segment.js <source-directory>");
  process.exit(1);
}

if (!fs.existsSync(SOURCE_DIR)) {
  console.error(`❌ Source directory does not exist: ${SOURCE_DIR}`);
  process.exit(1);
}

const BASE_URL = "https://api.split.io/internal/api/v2";

// --- Axios instance ---
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-api-key": HARNESS_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// --- Helpers ---
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isValidSchema(obj) {
  return (
    obj &&
    Array.isArray(obj.keys) &&
    obj.keys.every(k => typeof k === "string") &&
    typeof obj.comment === "string"
  );
}

function loadSourceFiles(dir) {
  const files = fs.readdirSync(dir);
  const validSources = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (!file.endsWith(".json")) continue;

    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const parsed = JSON.parse(raw);

      if (!isValidSchema(parsed)) {
        console.log(`⚠️ Skipping invalid schema: ${file}`);
        continue;
      }

      const segmentName = path.basename(file, ".json");

      validSources.push({
        segmentName,
        data: parsed,
      });

    } catch (err) {
      console.log(`⚠️ Skipping invalid JSON file: ${file}`);
    }
  }

  if (validSources.length === 0) {
    console.error("❌ No valid source files found in directory");
    process.exit(1);
  }

  return validSources;
}

async function loggedRequest(method, url, data) {
  console.log("➡️ REQUEST", method, url);
  // if (data) console.log("Payload:", JSON.stringify(data, null, 2));

  try {
    const res = await api.request({ method, url, data });
    console.log("⬅️ RESPONSE", res.status);
    return res;
  } catch (error) {
    console.log("⬅️ RESPONSE ERROR", error.response?.status);
    console.log("Data:", JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

// --- API calls ---
async function deleteSegment(segmentName) {
  console.log('✅ 1 delete ' + segmentName);

  let config = {
    method: 'delete',
    url: `${BASE_URL}/segments/ws/${WORKSPACE_ID}/${segmentName}`,
    headers: {
      'x-api-key': HARNESS_API_KEY,
      'Content-Type': 'application/json'
    },
    data: {
      name: segmentName,
      description: 'burning existing segmentName'
    }
  };

  try {
    await axios.request(config);
    console.log(`✅  deleteSegment success: ${segmentName}`);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`no segment to delete: ${segmentName}`);
    } else {
      console.log('error delete:', error.message);
    }
  }

  await sleep(1000);
}

async function createSegment(segmentName) {
  await deleteSegment(segmentName);
  console.log('✅ 2 - createSegment start: ' + segmentName);

  try {
    const res = await loggedRequest(
      "post",
      `/segments/ws/${WORKSPACE_ID}/trafficTypes/${TRAFFIC_TYPE}`,
      {
        name: segmentName,
        description: "Migrated segment",
        owners: [{ id: "_project_all_users", type: "Team", name: "All Users" }]
      }
    );

    return res.data.id || res.data.segment?.id;

  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️ segment already exists: ${segmentName}`);
    } else {
      console.log('error create:', error.message);
    }
  }

  await sleep(500);
}

 async function enableSegmentInEnvironment(segmentName) {
    console.log('✅ 3 - enableSegmentInEnvironment: ' + segmentName);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://api.split.io/internal/api/v2/segments/${ENVIRONMENT_ID}/${segmentName}`,
      headers: { 
        'x-api-key': HARNESS_API_KEY, 
        'Content-Type': 'application/json'
      },
      data : {}
    };
    await axios.request(config)
    .then((response) => {
      console.log(`enableSegmentInEnvironment segment: ${segmentName}`);
    })
    .catch((error) => {
    console.log('🚫 enableSegmentInEnvironment ' + error?.response?.data?.code);  
    });
  }

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));l
}

async function uploadKeys(segmentName, payload, retry) {
    console.log('✅ 4 - uploadKeys: ' + segmentName);

        const url = `${BASE_URL}/segments/${ENVIRONMENT_ID}/${segmentName}/uploadKeys?replace=true`;

        // console.log('payload', payload);

        const updateConfig = {
            method: 'put',
            url: url,
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': HARNESS_API_KEY,
            },
            data: payload 
        }

        await axios(updateConfig)
        .then(function (response) {
          console.log('✅ keys: ' + segmentName);
        })
        .catch(function(error) {
          console.log('🚫 keys updated to segment: ' + segmentName);
          // console.log(error);
          // retry
          // if(retry) {
          //   //await sleep(1000);
            
          //   uploadKeys(segmentName, payload, false);

          // }
        });
}

// --- Main ---
async function main() {
  console.log('✅ main');

  const sources = loadSourceFiles(SOURCE_DIR);
  let i = 1;
  for (const src of sources) {
    // console.log('segment handled ' + i++ + ' ' + JSON.stringify(sources, null, 2));
    const segmentName = src.segmentName;

    console.log(`\n🚀 Processing: ${segmentName}`);

    // delete first in createSegment
    await createSegment(segmentName);
    await enableSegmentInEnvironment(segmentName);
    await uploadKeys(segmentName, src.data, true);

    await sleep(5000);
    console.log('======================');
  }

  console.log("🎉 All done.");
}

// --- Run ---
main().catch((err) => {
  console.error("❌ Script Error:", err.message);
  process.exit(1);
});