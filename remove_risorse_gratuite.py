import glob
import re
import os
import shutil

# 1. Remove navigation link in all HTML files
html_files = glob.glob('**/*.html', recursive=True)

for file_path in html_files:
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r') as f:
        html = f.read()
    
    html = re.sub(r'<a href="/risorse-gratuite/">Risorse Gratuite</a>\s*', '', html)
    
    with open(file_path, 'w') as f:
        f.write(html)
    print(f"Updated nav in {file_path}")

# 2. Update sitemap.xml
if os.path.exists('sitemap.xml'):
    with open('sitemap.xml', 'r') as f:
        sitemap = f.read()
    
    # regex to remove the <url> block for risorse-gratuite
    sitemap = re.sub(r'<url>\s*<loc>https://www.francescagrandi.it/risorse-gratuite/</loc>.*?Priority>.*?</url>\s*', '', sitemap, flags=re.IGNORECASE|re.DOTALL)
    
    with open('sitemap.xml', 'w') as f:
        f.write(sitemap)
    print("Updated sitemap.xml")

