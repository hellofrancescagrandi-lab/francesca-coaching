import os
import glob

files = [
    'index.html',
    'chi-sono/index.html',
    'risorse-gratuite/index.html',
    'new-era-academy/index.html',
    'training.html',
    'lista-attesa.html'
]

for file_path in files:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r') as f:
        html = f.read()
        
    # Standardize and replace
    if '<a href="/new-era-academy/">New Era Academy</a>' not in html:
        # For inner pages, the link is /#percorsi or #percorsi depending on the file
        html = html.replace('<a href="#percorsi">Percorsi digitali</a>', '<a href="#percorsi">Percorsi digitali</a>\n            <a href="/new-era-academy/">New Era Academy</a>')
        html = html.replace('<a href="/#percorsi">Percorsi digitali</a>', '<a href="/#percorsi">Percorsi digitali</a>\n            <a href="/new-era-academy/">New Era Academy</a>')
        
    with open(file_path, 'w') as f:
        f.write(html)
