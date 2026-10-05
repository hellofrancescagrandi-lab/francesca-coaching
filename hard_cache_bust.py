import glob
import os

html_files = glob.glob('**/*.html', recursive=True)

for file_path in html_files:
    with open(file_path, 'r') as f:
        html = f.read()
    
    # We want to replace style.css and script.js with versioned ones to bust cache.
    # We will just append a timestamp-like version.
    html = html.replace('href="style.css"', 'href="style.css?v=10052202"')
    html = html.replace('href="../style.css"', 'href="../style.css?v=10052202"')
    
    html = html.replace('src="script.js"', 'src="script.js?v=10052202"')
    html = html.replace('src="../script.js"', 'src="../script.js?v=10052202"')
    
    with open(file_path, 'w') as f:
        f.write(html)
