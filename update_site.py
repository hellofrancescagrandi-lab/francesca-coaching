import re
import glob

# 1. Update navigation in all files
nav_item = '<a href="risorse-gratuite.html">Risorse Gratuite</a>\n            <a href="#contatti">Contatti</a>'

html_files = glob.glob('*.html')
for file in html_files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Replace <a href="#contatti">Contatti</a> with the new item + Contatti
    # Only if not already replaced
    if 'Risorse Gratuite' not in content or 'risorse-gratuite.html' not in content:
        content = re.sub(r'<a href="#contatti">Contatti</a>', nav_item, content)
        with open(file, 'w') as f:
            f.write(content)

