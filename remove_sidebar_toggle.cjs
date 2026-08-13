const fs = require('fs');

// 1. Update RightSidebar.jsx
let sidebarCode = fs.readFileSync('src/components/RightSidebar.jsx', 'utf8');
// Remove props
sidebarCode = sidebarCode.replace(/\s*isOpen,\s*/, '\n  ');
sidebarCode = sidebarCode.replace(/\s*setIsOpen,\s*/, '\n  ');
// Remove toggle button
sidebarCode = sidebarCode.replace(/\{\/\* Toggle Button when Closed \*\/\}[\s\S]*?\{\/\* Sidebar Container \*\/\}/, '{/* Sidebar Container */}');
// Change container classes and style
sidebarCode = sidebarCode.replace(
  /className=\{`transition-all.*?`\}/s,
  'className="transition-all duration-300 ease-in-out bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.05)] z-[1020] flex flex-col h-full border-l border-gray-200 shrink-0 w-[320px] sm:w-[380px] relative"'
);
sidebarCode = sidebarCode.replace(/style=\{\{\s*position:\s*isOpen\s*\?\s*'relative'\s*:\s*'absolute'\s*\}\}/, '');
// Remove close button
sidebarCode = sidebarCode.replace(/<button[^>]*onClick=\{\(\) => setIsOpen\(false\)\}[\s\S]*?<\/button>/, '');
fs.writeFileSync('src/components/RightSidebar.jsx', sidebarCode);

// 2. Update usage files
const files = [
  'src/pages/BerandaSidoarjo.jsx',
  'src/pages/DetailWaung.jsx',
  'src/components/PetaPekerjaan/index.jsx',
  'src/components/PetaSayuran/index.jsx',
  'src/components/PetaUMKM/index.jsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Remove state
  content = content.replace(/const\s+\[isSidebarOpen,\s*setIsSidebarOpen\]\s*=\s*useState\(true\);\s*/g, '');
  // Remove toggle button
  content = content.replace(/\{!isSidebarOpen\s*&&\s*\([\s\S]*?<\/button>\s*\)\}\s*/g, '');
  // Remove props
  content = content.replace(/\s*isOpen=\{isSidebarOpen\}/g, '');
  content = content.replace(/\s*setIsOpen=\{setIsSidebarOpen\}/g, '');
  fs.writeFileSync(file, content);
}
console.log('Update complete!');
