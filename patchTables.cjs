const fs = require('fs');

function updateTable(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Update Table header style
  // First, find the <Table> tag
  code = code.replace(/<Table\s+([^>]*?)>/, (match, p1) => {
    // If it already has classNames, we might need to merge, but let's just replace classNames
    if (p1.includes('classNames=')) {
      p1 = p1.replace(/classNames=\{[\s\S]*?\}/, `classNames={{ th: "bg-[#1f2937] text-white font-semibold text-sm border-none", wrapper: "shadow-none p-0" }}`);
    } else {
      p1 += `\n        classNames={{ th: "bg-[#1f2937] text-white font-semibold text-sm border-none", wrapper: "shadow-none p-0" }}`;
    }
    return `<Table ${p1}>`;
  });

  // Remove flat variant from Edit/Delete buttons to make them solid
  code = code.replace(/<Button([\s\S]*?)variant="flat"([\s\S]*?)onClick=\{\(\) => onEdit/g, '<Button$1$2onClick={() => onEdit');
  code = code.replace(/<Button([\s\S]*?)variant="flat"([\s\S]*?)onClick=\{\(\) => onDelete/g, '<Button$1$2onClick={() => onDelete');
  
  // Try matching with handleEdit / handleDelete if they use that
  code = code.replace(/<Button([\s\S]*?)variant="flat"([\s\S]*?)onClick=\{\(\) => handleEdit/g, '<Button$1$2onClick={() => handleEdit');
  code = code.replace(/<Button([\s\S]*?)variant="flat"([\s\S]*?)onClick=\{\(\) => handleDelete/g, '<Button$1$2onClick={() => handleDelete');

  // Find Aksi cell with Tooltip and Edit/Delete (like in Grogol/Ruta/Simoketawang)
  code = code.replace(/<Button\s+isIconOnly\s+size="sm"\s+variant="light"\s+color="primary"/g, '<Button isIconOnly size="sm" color="primary"');
  code = code.replace(/<Button\s+isIconOnly\s+size="sm"\s+variant="light"\s+color="danger"/g, '<Button isIconOnly size="sm" color="danger"');
  code = code.replace(/<Button\s+isIconOnly\s+size="sm"\s+variant="flat"\s+color="primary"/g, '<Button isIconOnly size="sm" color="primary"');
  code = code.replace(/<Button\s+isIconOnly\s+size="sm"\s+variant="flat"\s+color="danger"/g, '<Button isIconOnly size="sm" color="danger"');

  fs.writeFileSync(filePath, code);
  console.log('Updated ' + filePath);
}

const files = [
  'src/components/SidokepungTable/DataTable.jsx',
  'src/components/GrogolUsahaTable/index.jsx',
  'src/components/RutaTable/index.jsx',
  'src/components/SimoketawangUsahaTable/index.jsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    updateTable(f);
  } else {
    console.log('File not found: ' + f);
  }
});
