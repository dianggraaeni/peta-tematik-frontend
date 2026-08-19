import geopandas as gpd
import json

# Balongbendo
gdf1 = gpd.read_file(r'data detail kecamatan\balongbendo\Admin Desa.shp')
gdf1 = gdf1.to_crs(epsg=4326)
print('=== BALONGBENDO ===')
print('Kolom:', list(gdf1.columns))
print('Jumlah desa:', len(gdf1))
print('Sample data:')
print(gdf1.drop(columns='geometry').to_string())
print()

# Buduran
gdf2 = gpd.read_file(r'data detail kecamatan\buduran\Admin_Dese.shp')
gdf2 = gdf2.to_crs(epsg=4326)
print('=== BUDURAN ===')
print('Kolom:', list(gdf2.columns))
print('Jumlah desa:', len(gdf2))
print('Sample data:')
print(gdf2.drop(columns='geometry').to_string())

# Save as GeoJSON
gdf1.to_file('data detail kecamatan/balongbendo.geojson', driver='GeoJSON')
gdf2.to_file('data detail kecamatan/buduran.geojson', driver='GeoJSON')
print('\nGeoJSON berhasil dibuat!')
