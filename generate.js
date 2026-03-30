const fs = require('fs');

const keys = Array.from({ length: 10000 }, (_, i) => `id${i + 1}`);

const payload = {
  keys,
  comment: "a wacky migrated segment"
};

fs.writeFileSync('segment.json', JSON.stringify(payload, null, 2));

console.log("✅ Generated segment.json with 10,000 keys");
