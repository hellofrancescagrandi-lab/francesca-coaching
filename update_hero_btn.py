import re

with open('new-era-academy/index.html', 'r') as f:
    html = f.read()

# Update hero button text
html = html.replace('>ACCEDI SUBITO A NEW ERA<', '>VOGLIO SBLOCCARE IL MIO POTENZIALE<')

with open('new-era-academy/index.html', 'w') as f:
    f.write(html)
