import glob
import os

html_files = glob.glob('**/*.html', recursive=True)

for file_path in html_files:
    with open(file_path, 'r') as f:
        html = f.read()
    
    html = html.replace('https://calendly.com/francescagrandi/call-1-1-30-minuti', 'https://form.jotform.com/262775581783068')
    html = html.replace('RICHIEDI UNA CALL GRATUITA', 'COMPILA IL QUESTIONARIO')
    html = html.replace('Richiedi una call gratuita', 'Compila il questionario')
    html = html.replace('Prenota una call di 30 minuti gratuita', 'Compila il questionario')
    html = html.replace('prenota una call di 30 minuti gratuita', 'compila il questionario')
    
    with open(file_path, 'w') as f:
        f.write(html)
