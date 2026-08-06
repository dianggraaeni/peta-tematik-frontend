const fs = require('fs');
let raw = fs.readFileSync('original_maps.jsx', 'utf8');
if (raw.startsWith('"')) {
  try {
    raw = JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
}
fs.writeFileSync('original_maps.jsx', raw, 'utf8');
