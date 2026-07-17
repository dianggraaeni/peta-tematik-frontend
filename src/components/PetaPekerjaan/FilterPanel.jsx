import { useState } from "react";

const FilterPanel = ({ onFilterChange, filteredCount, totalCount }) => {
  const [filters, setFilters] = useState({
    gender: "",
    ageGroup: "",
    employment: "",
    workField: "",
  });

  const [isMinimized, setIsMinimized] = useState(false);

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      gender: "",
      ageGroup: "",
      employment: "",
      workField: "",
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (filter) => filter !== ""
  );

  const genderOptions = [
    { value: "", label: "Semua Jenis Kelamin" },
    { value: "laki-laki", label: "Laki-laki" },
    { value: "perempuan", label: "Perempuan" },
  ];

  const ageOptions = [
    { value: "", label: "Semua Umur" },
    { value: "< 17", label: "< 17 tahun" },
    { value: "17-25", label: "17-25 tahun" },
    { value: "26-35", label: "26-35 tahun" },
    { value: "36-45", label: "36-45 tahun" },
    { value: "46-55", label: "46-55 tahun" },
    { value: "> 55", label: "> 55 tahun" },
  ];

  const employmentOptions = [
    { value: "", label: "Semua Status Pekerjaan" },
    { value: "tidak bekerja", label: "Tidak Bekerja" },
    {
      value: "buruh/karyawan/pegawai/pekerja bebas",
      label: "Buruh/Karyawan/Pegawai/Pekerja Bebas",
    },
    { value: "berusaha sendiri", label: "Berusaha Sendiri" },
    { value: "pekerja keluarga", label: "Pekerja Keluarga" },
  ];

  const workFieldOptions = [
    { value: "", label: "Semua Bidang Pekerjaan" },
    {
      value: "Pertanian, Kehutanan dan Perikanan",
      label: "A - Pertanian, Kehutanan dan Perikanan",
    },
    {
      value: "Pertambangan dan Penggalian",
      label: "B - Pertambangan dan Penggalian",
    },
    { value: "Industri Pengolahan", label: "C - Industri Pengolahan" },
    {
      value: "Pengadaan Listrik, Gas, Uap dan AC",
      label: "D - Pengadaan Listrik, Gas, Uap dan AC",
    },
    {
      value: "Pengadaan Air, Pengelolaan Sampah dan Daur Ulang",
      label: "E - Pengadaan Air, Pengelolaan Sampah dan Daur Ulang",
    },
    { value: "Konstruksi", label: "F - Konstruksi" },
    {
      value:
        "Perdagangan Besar dan Eceran, Reparasi dan Perawatan Mobil dan Motor",
      label:
        "G - Perdagangan Besar dan Eceran, Reparasi dan Perawatan Mobil dan Motor",
    },
    {
      value: "Transportasi dan Pergudangan",
      label: "H - Transportasi dan Pergudangan",
    },
    {
      value: "Penyediaan Akomodasi dan Penyediaan Makan Minum",
      label: "I - Penyediaan Akomodasi dan Penyediaan Makan Minum",
    },
    {
      value: "Informasi dan Komunikasi",
      label: "J - Informasi dan Komunikasi",
    },
    {
      value: "Jasa Keuangan dan Asuransi",
      label: "K - Jasa Keuangan dan Asuransi",
    },
    { value: "Real Estat", label: "L - Real Estat" },
    {
      value: "Jasa Profesional, Ilmiah dan Teknis",
      label: "M - Jasa Profesional, Ilmiah dan Teknis",
    },
    {
      value:
        "Jasa Persewaan Dan Sewa Guna Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya",
      label:
        "N - Jasa Persewaan Dan Sewa Guna Tanpa Hak Opsi, Ketenagakerjaan, Agen Perjalanan dan Penunjang Usaha Lainnya",
    },
    {
      value: "Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial",
      label: "O - Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial",
    },
    { value: "Jasa Pendidikan", label: "P - Jasa Pendidikan" },
    {
      value: "Jasa Kesehatan dan Kegiatan Sosial",
      label: "Q - Jasa Kesehatan dan Kegiatan Sosial",
    },
    {
      value: "Kesenian, Hiburan dan Rekreasi",
      label: "R - Kesenian, Hiburan dan Rekreasi",
    },
    { value: "Jasa lainnya", label: "S - Jasa lainnya" },
    {
      value: "Jasa Perorangan yang Melayani Rumah Tangga",
      label: "T - Jasa Perorangan yang Melayani Rumah Tangga",
    },
    {
      value: "Kegiatan Badan Internasional dan Badan Ekstra Internasional",
      label: "U - Kegiatan Badan Internasional dan Badan Ekstra Internasional",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden max-w-xs">
      {/* Header with toggle button */}
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2 flex justify-between items-center cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-colors"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <h3 className="font-semibold text-sm flex items-center">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filter Data
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && !isMinimized && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded font-medium transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="text-white hover:bg-blue-800 p-1 rounded text-sm transition-colors duration-200"
          >
            {isMinimized ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-300 ${
          isMinimized ? "h-0 overflow-hidden" : "max-h-[40vh] overflow-y-auto custom-scrollbar"
        }`}
      >
        <div className="p-3 space-y-3">
          {/* Filter Results Summary */}
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Total:</span>
              <span className="font-bold text-blue-600 text-sm">
                {filteredCount} dari {totalCount}
              </span>
            </div>
            {hasActiveFilters && (
              <div className="text-xs text-gray-500 mt-1">
                {
                  Object.entries(filters).filter(([_, value]) => value !== "")
                    .length
                }{" "}
                filter aktif
              </div>
            )}
          </div>

          {/* Gender Filter Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Jenis Kelamin
            </label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Age Group Filter Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Kelompok Umur
            </label>
            <select
              value={filters.ageGroup}
              onChange={(e) => handleFilterChange("ageGroup", e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              {ageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Status Filter Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status Pekerjaan
            </label>
            <select
              value={filters.employment}
              onChange={(e) => handleFilterChange("employment", e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              {employmentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Work Field Filter Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Bidang Pekerjaan
            </label>
            <select
              value={filters.workField}
              onChange={(e) => handleFilterChange("workField", e.target.value)}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
            >
              {workFieldOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="border-t border-gray-200 pt-2">
              <h5 className="text-xs font-medium text-gray-600 mb-1">
                Filter Aktif:
              </h5>
              <div className="flex flex-wrap gap-1">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;

                  let displayValue = value;
                  if (key === "gender") {
                    displayValue =
                      genderOptions.find((opt) => opt.value === value)?.label ||
                      value;
                  } else if (key === "ageGroup") {
                    displayValue =
                      ageOptions.find((opt) => opt.value === value)?.label ||
                      value;
                  } else if (key === "employment") {
                    displayValue =
                      employmentOptions.find((opt) => opt.value === value)
                        ?.label || value;
                  } else if (key === "workField") {
                    displayValue =
                      workFieldOptions.find((opt) => opt.value === value)
                        ?.label || value;
                  }

                  return (
                    <span
                      key={key}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {displayValue}
                      <button
                        onClick={() => handleFilterChange(key, "")}
                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimized state indicator */}
      {isMinimized && hasActiveFilters && (
        <div className="px-3 pb-2">
          <div className="text-xs text-blue-600 font-medium">
            {
              Object.entries(filters).filter(([_, value]) => value !== "")
                .length
            }{" "}
            filter aktif
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
