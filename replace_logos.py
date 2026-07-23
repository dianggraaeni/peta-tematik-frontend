import os
import re

directory = 'src'
logo_sidoarjo = 'logo_sidoarjo.png'
logo_dc = 'logo_dc.png'
logo_bps = 'logo_bps.png'

new_sidoarjo = 'petis-darjo.png'
new_dc = 'des-can.png'

count = 0
for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.jsx'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            
            content = content.replace(logo_sidoarjo, new_sidoarjo)
            content = content.replace(logo_dc, new_dc)
            content = re.sub(r'<img[^>]*src=[\"\']/pict/logo_bps\.png[\"\'][^>]*>', '', content)
            
            if original != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                print(f'Updated {file_path}')

print(f'Total files updated: {count}')
