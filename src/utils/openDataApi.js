// src/utils/openDataApi.js

const API_BASE = "https://opendata.sidoarjokab.go.id/api/3/action";

/**
 * Normalizes village name and extracts stats
 * @param {Object} record A datastore record
 * @returns {Object} normalized data { desa: string, L: number, P: number, total: number }
 */
const normalizeRecord = (record) => {
  const desaRaw = record.nama_desa || record.kecamatan_desa_kelurahan || record.desa || "";
  let desaName = desaRaw.toLowerCase().replace(/desa/g, "").replace(/kelurahan/g, "").trim();
  
  return {
    desa: desaName,
    L: parseInt(record.laki_laki || record.l || 0, 10),
    P: parseInt(record.perempuan || record.p || 0, 10),
    total: parseInt(record.jumlah || record.total || 0, 10)
  };
};

/**
 * Fetches village-level demographic data for a specific district (Kecamatan)
 * from the Sidoarjo Open Data CKAN API.
 * 
 * @param {string} kecamatanName Name of the district (e.g. "Balongbendo")
 * @returns {Promise<Array>} Array of normalized village data
 */
export const fetchVillageDataForKecamatan = async (kecamatanName) => {
  try {
    const q = `penduduk jenis kelamin kecamatan ${kecamatanName.toLowerCase()}`;
    const searchUrl = `${API_BASE}/package_search?q=${encodeURIComponent(q)}&rows=3`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    
    if (!searchData.success || searchData.result.results.length === 0) {
      throw new Error(`Dataset not found for Kecamatan ${kecamatanName}`);
    }

    // Find the first dataset that has an active datastore resource
    let datastoreResId = null;
    for (const pkg of searchData.result.results) {
      const activeResource = pkg.resources.find(r => r.datastore_active);
      if (activeResource) {
        datastoreResId = activeResource.id;
        break;
      }
    }

    if (!datastoreResId) {
      throw new Error(`No datastore-active resource found for Kecamatan ${kecamatanName}`);
    }

    // Fetch the actual tabular data
    const dsUrl = `${API_BASE}/datastore_search?resource_id=${datastoreResId}&limit=100`;
    const dsRes = await fetch(dsUrl);
    const dsData = await dsRes.json();

    if (!dsData.success) {
      throw new Error(`Failed to fetch datastore for resource ${datastoreResId}`);
    }

    // Normalize records
    const normalized = dsData.result.records.map(normalizeRecord).filter(r => r.desa && r.desa.toLowerCase() !== 'jumlah');
    
    return normalized;

  } catch (error) {
    console.error("Open Data API Error:", error);
    // Return null so the component can fallback to dummy data if API fails
    return null;
  }
};

/**
 * Fetches aggregate demographic data for all districts (Kecamatan) in Kabupaten Sidoarjo.
 * Uses a known resource ID that contains the comprehensive list.
 * 
 * @returns {Promise<Array>} Array of normalized district data
 */
export const fetchKabupatenData = async () => {
  try {
    // Known resource ID that contains population per kecamatan 2023
    const resourceId = "7634d83d-c895-4fe8-8fef-4d95a3c7372b";
    const dsUrl = `${API_BASE}/datastore_search?resource_id=${resourceId}&limit=50`;
    
    const dsRes = await fetch(dsUrl);
    const dsData = await dsRes.json();

    if (!dsData.success) {
      throw new Error(`Failed to fetch datastore for resource ${resourceId}`);
    }

    return dsData.result.records.map(record => ({
      kecamatan: record.kecamatan.toUpperCase().trim(),
      L: parseInt(record.laki_laki || 0, 10),
      P: parseInt(record.perempuan || 0, 10),
      total: parseInt(record.jumlah || 0, 10)
    }));
  } catch (error) {
    console.error("Open Data API Error (Kabupaten):", error);
    return null;
  }
};
