const fs = require('fs');

let code = fs.readFileSync('src/pages/adminSidokepung.jsx', 'utf8');

// 1. Import AdminLayout
code = code.replace(
  'import { downloadTemplate } from "../components/SidokepungTable/fileUtils";\nimport {',
  'import { downloadTemplate } from "../components/SidokepungTable/fileUtils";\nimport AdminLayout from "../components/AdminLayout";\nimport {'
);

// 2. Remove Header and replace top wrapper with AdminLayout
const returnRegex = /return \([\s\S]*?\{\/\* Header \*\/\}\s*[\s\S]*?<\/Button>\s*<\/div>\s*\{\/\* Messages \*\/\}/;

code = code.replace(returnRegex, 
`return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 p-4">
        {/* Messages */}`);

// 3. Update Controls Section layout and button colors
const controlsRegex = /\{\/\* Controls \*\/\}\s*<div className="flex flex-col gap-4 p-6 mb-6 bg-white shadow-md rounded-xl">\s*<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">\s*<Input[\s\S]*?\/>\s*<div className="flex gap-2 flex-wrap">\s*<Button[\s\S]*?<\/Button>\s*<\/div>\s*<\/div>\s*\{\/\* Upload Info Card \*\/\}/;

code = code.replace(controlsRegex, 
`{/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              isClearable
              className="w-full sm:max-w-[400px]"
              placeholder="Cari berdasarkan RT, RW, atau Nama..."
              startContent={<AiOutlineSearch className="text-gray-400" />}
              value={searchTerm}
              onClear={() => setSearchTerm("")}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              color="primary"
              startContent={<AiOutlinePlus />}
              onClick={handleAdd}
              className="bg-[#2563eb]"
            >
              Tambah Data
            </Button>
            <Button
              color="primary"
              variant="flat"
              startContent={<AiOutlineUpload />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV/JSON
            </Button>
            <Button
              color="primary"
              variant="flat"
              startContent={<AiOutlineDownload />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </div>
        </div>

        {/* Upload Info Card */}`);

// 4. Update closing tags
code = code.replace(/<\/div>\s*\);\s*}\s*;\s*export default AdminSidokepung;/, `  </div>\n    </AdminLayout>\n  );\n};\n\nexport default AdminSidokepung;`);

fs.writeFileSync('src/pages/adminSidokepung.jsx', code);
console.log('Successfully updated adminSidokepung.jsx');
