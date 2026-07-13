const fs = require('fs');

// 1. Fix LoginGeneral.jsx
let code = fs.readFileSync('src/pages/LoginGeneral.jsx', 'utf8');
code = code.replace('import Logo from "../../public/pict/logo_dc.png";\n', '');
code = code.replace('src={Logo}', 'src="/pict/logo_dc.png"');
fs.writeFileSync('src/pages/LoginGeneral.jsx', code);

// 2. Delete unused login pages
const unusedFiles = [
  'src/pages/loginGrogol.jsx',
  'src/pages/loginPusat.jsx',
  'src/pages/loginSidokepung.jsx',
  'src/pages/loginSimoanginangin.jsx',
  'src/pages/loginSimoketawang.jsx'
];
unusedFiles.forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('Deleted ' + f);
  }
});
console.log('Fixed LoginGeneral.jsx');
