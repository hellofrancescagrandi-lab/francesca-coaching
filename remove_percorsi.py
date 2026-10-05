import os
import glob
import re

html_files = glob.glob('**/*.html', recursive=True)

for file_path in html_files:
    with open(file_path, 'r') as f:
        html = f.read()
    
    # 1. Remove navigation links
    # Sometimes it has spaces around it, sometimes newlines.
    html = re.sub(r'<a href="/?#percorsi">Percorsi digitali</a>\s*', '', html)

    # 2. Remove the section entirely from index.html
    if file_path == 'index.html':
        start_tag = '<section id="percorsi"'
        end_tag = '</section>'
        
        start_idx = html.find(start_tag)
        if start_idx != -1:
            # Find the matching closing tag
            # Since HTML might have nested sections, but in this case we know the structure.
            # Let's find the first </section> after the start_idx
            end_idx = html.find(end_tag, start_idx)
            if end_idx != -1:
                end_idx += len(end_tag)
                # Ensure we removed the correct one by checking if it contains 'NEW ERA'
                removed_content = html[start_idx:end_idx]
                if 'NEW ERA' in removed_content:
                    html = html[:start_idx] + html[end_idx:]

    with open(file_path, 'w') as f:
        f.write(html)
        
    print(f"Updated {file_path}")

