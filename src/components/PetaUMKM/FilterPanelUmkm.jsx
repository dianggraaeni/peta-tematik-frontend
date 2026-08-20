import { useState } from "react";

const FilterPanelUmkm = ({ onFilterChange, filteredCount, totalCount, kbliColors, getKbliName }) => {
  const [filters, setFilters] = useState({
    kbliDominan: "",
  });

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
      kbliDominan: "",
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (filter) => filter !== ""
  );

  return (
    <div className="bg-white rounded-b-2xl overflow-hidden w-full">
      {/* Content */}
      <div className="p-4 space-y-4">
        {hasActiveFilters && (
          <div className="flex justify-end mb-2">
            <button
              onClick={clearAllFilters}
              className="text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Reset Filter
            </button>
          </div>
        )}
        {/* Filter Results Summary */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total UMKM:</span>
            <span className="font-bold text-blue-700 text-base">
              {filteredCount} dari {totalCount}
            </span>
          </div>
        </div>

        {/* KBLI Filter Dropdown */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Sektor KBLI Dominan
          </label>
          <select
            value={filters.kbliDominan}
            onChange={(e) => handleFilterChange("kbliDominan", e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">Semua Sektor Dominan</option>
            {Object.entries(kbliColors).map(([kbli, color]) => (
              <option key={kbli} value={kbli}>
                KBLI {kbli} - {getKbliName(kbli)}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="border-t border-gray-200 pt-3 mt-2">
            <h5 className="text-xs font-medium text-gray-500 mb-2">
              Filter Aktif:
            </h5>
            <div className="flex flex-wrap gap-2">
              {filters.kbliDominan && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  {getKbliName(filters.kbliDominan)}
                  <button
                    onClick={() => handleFilterChange("kbliDominan", "")}
                    className="ml-2 text-blue-600 hover:text-blue-900 font-bold"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanelUmkm;
