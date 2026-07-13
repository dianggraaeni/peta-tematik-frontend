const fs = require('fs');
for (let i = 1; i <= 6; i++) {
  const filename = i === 1 ? 'api.js' : 'api' + i + '.js';
  let content = fs.readFileSync('src/utils/' + filename, 'utf8');
  content = content.replace(/(const token = localStorage\.getItem\("[^"]+"\));/, '$1 || localStorage.getItem("token-pusat");');
  fs.writeFileSync('src/utils/' + filename, content);
}
console.log('Patched all API clients');
