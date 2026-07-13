const fs = require('fs');

// 1. Update all api files
for (let i = 1; i <= 6; i++) {
  const filename = i === 1 ? 'api.js' : 'api' + i + '.js';
  const path = 'src/utils/' + filename;
  if (fs.existsSync(path)) {
    let code = fs.readFileSync(path, 'utf8');
    // Replace baseURL: "https://..." with baseURL: "http://localhost:5003"
    code = code.replace(/baseURL:\s*"https:\/\/[^"]+"/, 'baseURL: "http://localhost:5003"');
    fs.writeFileSync(path, code);
    console.log('Updated ' + path);
  }
}

// 2. Update LoginGeneral text
let loginCode = fs.readFileSync('src/pages/LoginGeneral.jsx', 'utf8');
loginCode = loginCode.replace(
  /<p className="text-lg italic font-bold font-inter text-\[#1f2937\] md:text-xl">\s*PETA TEMATIK\s*<\/p>\s*<p className="text-sm text-gray-600 font-inter">\s*BPS KABUPATEN SIDOARJO\s*<\/p>/g,
  '<p className="text-lg font-bold font-inter text-[#1f2937] md:text-xl mt-2">ADMIN PETA TEMATIK</p>'
);
fs.writeFileSync('src/pages/LoginGeneral.jsx', loginCode);
console.log('Updated LoginGeneral.jsx text');
