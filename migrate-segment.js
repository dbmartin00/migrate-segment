// migrate-segment.js
const axios = require("axios");

const HARNESS_API_KEY = process.env.HARNESS_API_KEY;
const WORKSPACE_ID = process.env.WORKSPACE_ID;
const ENVIRONMENT_ID = process.env.ENVIRONMENT_ID;
const TRAFFIC_TYPE = process.env.TRAFFIC_TYPE;
  
if (!HARNESS_API_KEY || !WORKSPACE_ID || !ENVIRONMENT_ID || !TRAFFIC_TYPE) {
  console.error(
    `Missing required environment variables: ${HARNESS_API_KEY}, ${WORKSPACE_ID}, ${ENVIRONMENT_ID}, ${TRAFFIC_TYPE}`
  );
  process.exit(1);
}

const BASE_URL = "https://api.split.io/internal/api/v2";

// --- Input keys to migrate ---
const allKeys = ["user_1", "user_2", "user_3"]; // add more as needed

let i = 1;

// --- Config ---
const SEGMENT_PREFIX = "gorgias";

// --- Axios instance ---
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "x-api-key": HARNESS_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

async function loggedRequest(method, url, data) {
  console.log("➡️ REQUEST", method, url);
  if (data) console.log("Payload:", JSON.stringify(data));

  try {
    const res = await api.request({ method, url, data });
    console.log("⬅️ RESPONSE", res.status);
    return res;
  } catch (error) {
    console.log("⬅️ RESPONSE ERROR", error.response?.status);
    console.log("Data:", JSON.stringify(error.response?.data));
    throw error;
  }
}

// --- Create a segment with owners ---
async function createSegment(segmentName) {
  console.log('createSegment');
  console.log('segmentName', segmentName);

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

    console.log("Segment creation response:", JSON.stringify(res.data));
k
    // Adjust this depending on the actual response
    return res.data.id || res.data.segment?.id; 
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️ segment already exists: ${segmentName}`);
    } else {
      // throw error;
      console.log('error segment creation');
    }



  }
  await sleep(500);
}

// --- Upload keys to a segment ---

 async function uploadKeys(segmentName, keys) {

        const url = `${BASE_URL}/segments/${ENVIRONMENT_ID}/${segmentName}/uploadKeys?replace=false`;

        const updateConfig = {
            method: 'put',
            url: url,
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': HARNESS_API_KEY,
            },
            data: {"keys":["id1", "id2", "id3"], "comment":"a migrated segment"}
            // data: 
            //   {keys: ["id1", "id2", "id3"], comment: "a migrated segment"}
            // }
        }

        await axios(updateConfig)
        .then(function (response) {
          console.log('keys updated to segment: ' + segmentName);
        })
        .catch(function(error) {
          console.log('zero keys updated to segment: ' + segmentName);
        });
}


 // async function deactivateSegment(segmentName) {
 //    console.log('enableSegment');

 //    let config = {
 //      method: 'delete',
 //      maxBodyLength: Infinity,
 //      url: `https://api.split.io/internal/api/v2/segments/${ENVIRONMENT_ID}/${segmentName}`,
 //      headers: { 
 //        'x-api-key': HARNESS_API_KEY, 
 //        'Content-Type': 'application/json'
 //      },
 //      data : {}
 //    };

 //    axios.request(config)
 //    .then((response) => {
 //      console.log('deactivateSegment success');
 //    })
 //    .catch((error) => {
 //      console.log(error);
 //    });

// }

 async function enableSegment(segmentName) {
    console.log('enableSegment');

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.split.io/internal/api/v2/segments/' + segmentName,
      headers: { 
        'x-api-key': HARNESS_API_KEY, 
        'Content-Type': 'application/json'
      },
      data : {}
    };
    axios.request(config)
    .then((response) => {
      console.log('enableSegment success');
    })
    .catch((error) => {
      console.log(`⚠️ Segment enableSegment already exists: ${segmentName}`);
    });

}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));l
}

// --- Main process ---
async function main() {

  const length = 1;

  for (let i = 0; i < length; i++) {
    console.log('i', i);
    segmentName = `${SEGMENT_PREFIX}_${i + 1}`;
    await createSegment(segmentName);
    console.log('main');
    console.log('main segmentName', segmentName);
    const keys = {keys: allKeys, comment:"migrated segment"};
    await enableSegment(segmentName);
    await uploadKeys(segmentName, keys);
  }

  console.log("🎉 All done.");
}

// --- Run ---
main().catch((err) => {
  console.error("❌ Script Error:", err.message);
  process.exit(1);
});
