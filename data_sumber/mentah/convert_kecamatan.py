import geopandas as gpd
import json

configs = [
    {
        'name': 'balongbendo',
        'shp': r'data detail kecamatan\balongbendo\Admin Desa.shp',
        'kecamatan': 'Balongbendo'
    },
    {
        'name': 'buduran',
        'shp': r'data detail kecamatan\buduran\Admin_Dese.shp',
        'kecamatan': 'Buduran'
    },
]

for cfg in configs:
    gdf = gpd.read_file(cfg['shp'])
    gdf = gdf.to_crs(epsg=4326)
    
    # Keep only useful columns
    gdf_clean = gdf[['WADMKD', 'WADMKC', 'SHAPE_Area', 'geometry']].copy()
    gdf_clean.columns = ['nama_desa', 'nama_kecamatan', 'luas', 'geometry']
    
    # Remove duplicates / zero-area entries
    gdf_clean = gdf_clean[gdf_clean['luas'] > 0].drop_duplicates(subset='nama_desa')
    
    out_path = f'peta-tematik-frontend/public/data/kecamatan_{cfg["name"]}.geojson'
    gdf_clean.to_file(out_path, driver='GeoJSON')
    
    print(f'[OK] {cfg["name"]}: {len(gdf_clean)} desa -> {out_path}')
    desas = gdf_clean['nama_desa'].tolist()
    print(f'     Desa: {desas}')
    print()

print('Semua GeoJSON kecamatan berhasil dibuat!')
