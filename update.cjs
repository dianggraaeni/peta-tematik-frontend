const fs = require('fs');
const files = [
  'src/pages/loginSidokepung.jsx',
  'src/pages/loginGrogol.jsx',
  'src/pages/loginSimoanginangin.jsx',
  'src/pages/loginSimoketawang.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Ellipses
  content = content.replace(/<div className="size-\[100px\] rounded-full bg-gradient-to-r[^"]+"><\/div>/g, '<div className="size-[100px] rounded-full bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"></div>');
  content = content.replace(/<div className="size-\[100px\] rounded-full bg-[^"]+"><\/div>/g, '<div className="size-[100px] rounded-full bg-[#bfdbfe]"></div>');
  
  // Layout
  content = content.replace(/min-h-screen bg-\[[^\]]+\]/g, 'min-h-screen bg-slate-50');
  content = content.replace(/bg-white shadow-md rounded-xl/g, 'bg-white shadow-2xl rounded-2xl border border-gray-100');
  
  // Texts
  content = content.replace(/text-black/g, 'text-[#1f2937]');
  content = content.replace(/text-pdarkblue/g, 'text-[#1f2937]');
  content = content.replace(/text-pgreen/g, 'text-[#1f2937]');
  
  // Buttons
  content = content.replace(/bg-\[#[0-9A-Fa-f]+\]|bg-pdarkblue|bg-pgreen/g, 'bg-[#2563eb] hover:bg-[#1d4ed8] shadow-md transition-colors');
  
  fs.writeFileSync(file, content);
});
console.log('Login pages updated.');
