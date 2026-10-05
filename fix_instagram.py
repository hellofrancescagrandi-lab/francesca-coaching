import os
import glob

# Find all HTML files in the project
html_files = glob.glob('**/*.html', recursive=True)

old_link = 'https://www.instagram.com/grandiefrancesca/'
new_link = 'https://www.instagram.com/francescagrandicoach/'

for file_path in html_files:
    with open(file_path, 'r') as f:
        content = f.read()
    
    if old_link in content:
        content = content.replace(old_link, new_link)
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")

