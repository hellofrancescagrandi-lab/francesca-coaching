import glob
import re

html_files = glob.glob('*.html') + glob.glob('*/index.html')

for file in html_files:
    try:
        with open(file, 'r') as f:
            html = f.read()
            
        # Split into before <body> and after <body>
        if '<body>' in html:
            head, body = html.split('<body>', 1)
        elif '</nav>' in html:
            head, body = html.split('</nav>', 1)
        else:
            continue
            
        # Take the first 3000 characters of the body (enough to cover the hero section)
        body_start = body[:4000]
        body_rest = body[4000:]
        
        # Remove fade-in class from the top section
        body_start = body_start.replace('fade-in', '')
        # Clean up any leftover class="" 
        body_start = body_start.replace('class=" "', 'class=""')
        body_start = body_start.replace('class=" "', 'class=""')
        
        new_html = head + ('<body>' if '<body>' in html else '</nav>') + body_start + body_rest
        
        with open(file, 'w') as f:
            f.write(new_html)
            
    except Exception as e:
        print(f"Error processing {file}: {e}")

