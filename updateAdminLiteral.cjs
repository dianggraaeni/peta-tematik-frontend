const fs = require('fs');
let code = fs.readFileSync('src/pages/adminSidokepung.jsx', 'utf8');

// 1. Add AdminLayout import
code = code.replace(
  'import { downloadTemplate } from "../components/SidokepungTable/fileUtils";\nimport {',
  'import { downloadTemplate } from "../components/SidokepungTable/fileUtils";\nimport AdminLayout from "../components/AdminLayout";\nimport {'
);

// 2. Remove Header and replace top wrapper with AdminLayout
const headerStr = `<div className="min-h-screen bg-slate-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between p-6 mb-6 bg-white shadow-md rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1f2937]">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Ketenagakerjaan Desa Sidokepung
            </p>
            <p className="text-xs text-gray-500">Selamat datang, {username}</p>
            {debugInfo && <p className="text-xs text-blue-600">{debugInfo}</p>}
          </div>
        </div>
        <Button
          color="danger"
          variant="flat"
          startContent={<AiOutlineLogout />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>

      {/* Messages */}`;

code = code.replace(headerStr, `    <AdminLayout>\n      <div className="min-h-screen bg-slate-50 p-4">\n        {/* Messages */}`);

// 3. Update Controls Section layout and button colors
const controlsStr = `{/* Controls */}
      <div className="flex flex-col gap-4 p-6 mb-6 bg-white shadow-md rounded-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Cari berdasarkan nama, status pekerjaan, atau bidang pekerjaan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<AiOutlineSearch className="text-gray-400" />}
            className="w-full sm:w-80"
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              color="primary"
              startContent={<AiOutlinePlus />}
              onClick={handleAdd}
              className="bg-green-600"
            >
              Tambah Data
            </Button>
            <Button
              color="secondary"
              variant="flat"
              startContent={<AiOutlineUpload />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV/JSON
            </Button>
            <Button
              color="default"
              variant="flat"
              startContent={<AiOutlineDownload />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </div>
        </div>

        {/* Upload Info Card */}`;

code = code.replace(controlsStr, `{/* Controls */}
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

// 4. Remove the extra closing div
const extraDivStr = `        />
      </div>

      {/* Data Table */}`;

code = code.replace(extraDivStr, `        />

      {/* Data Table */}`);

// 5. Update closing tags
const endingStr = `    </div>
  );
};

export default AdminSidokepung;`;

code = code.replace(endingStr, `      </div>\n    </AdminLayout>\n  );\n};\n\nexport default AdminSidokepung;`);

fs.writeFileSync('src/pages/adminSidokepung.jsx', code);
console.log('Successfully updated adminSidokepung.jsx with literal replace');
