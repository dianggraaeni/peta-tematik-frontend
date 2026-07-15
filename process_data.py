import pandas as pd
import json

df = pd.read_excel('D:/Documents/Internship/BPS Sidoarjo/desa-cantik/data-mentor/Data Penduduk 2024.xlsx', header=2)

result = {}
for index, row in df.iterrows():
    if pd.notna(row['iddesa']):
        iddesa_str = str(int(row['iddesa'])) if isinstance(row['iddesa'], float) else str(row['iddesa']).strip()
        result[iddesa_str] = {
            'Kecamatan': str(row['Kecamatan']).strip(),
            'nmdesa': str(row['nmdesa']).strip(),
            'L': int(row['L']) if pd.notna(row['L']) else 0,
            'P': int(row['P']) if pd.notna(row['P']) else 0,
            'total_penduduk': int(row['total']) if pd.notna(row['total']) else 0,
            'KK_L': int(row['KK_L']) if pd.notna(row['KK_L']) else 0,
            'KK_P': int(row['KK_P']) if pd.notna(row['KK_P']) else 0,
            'total_kk': int(row['total.1']) if pd.notna(row['total.1']) else 0
        }

with open('public/data/penduduk.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f'Successfully wrote {len(result)} records to penduduk.json')

