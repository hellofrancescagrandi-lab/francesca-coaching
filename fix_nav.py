import re
import glob

html_files = glob.glob('*.html')
for file in html_files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Remove any existing incorrectly added "Risorse Gratuite" links to be safe
    # Actually wait, the previous script added it in index.html, let's remove it first
    content = re.sub(r'<a href="risorse-gratuite\.html">Risorse Gratuite</a>\s*', '', content)

    # Now add it correctly before the Contatti link
    # Match both <a href="#contatti">Contatti</a> and <a href="index.html#contatti">Contatti</a>
    content = re.sub(r'(<a href="(?:index\.html)?#contatti">Contatti</a>)', r'<a href="risorse-gratuite.html">Risorse Gratuite</a>\n            \1', content)
    
    with open(file, 'w') as f:
        f.write(content)

