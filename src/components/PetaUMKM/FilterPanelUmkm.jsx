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
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden w-80">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 flex justify-between items-center pr-10">
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
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
            />
          </svg>
          Filter Data
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs bg-white text-blue-600 hover:bg-gray-100 px-2 py-1 rounded font-medium transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
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
