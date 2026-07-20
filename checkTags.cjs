const fs = require('fs');

function checkBalance(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let openDivs = (content.match(/<div[^>]*>/g) || []).length;
  // Account for self-closing divs if any (rare)
  let selfClosing = (content.match(/<div[^>]*\\/>/g) || []).length;
  openDivs -= selfClosing;
  let closeDivs = (content.match(/<\\/div>/g) || []).length;

  console.log(`${filePath}:`);
  console.log(`Open <div>: ${openDivs}`);
  console.log(`Close </div>: ${closeDivs}`);
  console.log(`Difference (Open - Close): ${openDivs - closeDivs}`);
}

checkBalance('src/components/PetaPekerjaan/index.jsx');
checkBalance('src/components/PetaUMKM/index.jsx');
