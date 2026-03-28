const axios = require('axios');

// Get command line argument
const segmentName = process.argv[2];

// Get environment variable
const workspaceId = process.env.WORKSPACE_ID;

if (!segmentName) {
  console.error("❌ Please provide a segment name as a command line argument.");
  process.exit(1);
}

if (!workspaceId) {
  console.error("❌ Please set WORKSPACE_ID environment variable.");
  process.exit(1);
}

let data = JSON.stringify({
  name: segmentName,
  description: "burning existing segmentName"
});

let config = { 
  method: 'delete',
  maxBodyLength: Infinity,
  url: `https://api.split.io/internal/api/v2/segments/ws/${workspaceId}/${segmentName}`,
  headers: { 
    'x-api-key': process.env.HARNESS_API_KEY, // 🔐 better practice
    'Content-Type': 'application/json'
  },  
  data: data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.error(error.response?.data || error.message);
});
