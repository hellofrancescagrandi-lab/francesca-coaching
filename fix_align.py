import re

with open('index.html', 'r') as f:
    html = f.read()

# Add align-items: start; to .pricing-grid
html = html.replace(
    '.pricing-grid {\n            display: grid;',
    '.pricing-grid {\n            display: grid;\n            align-items: start;'
)

# Remove flex-grow: 1; from the text wrapper div in cards
html = html.replace('<div style="flex-grow: 1;">', '<div>')

# Remove margin-top: auto; from the buttons in the cards so they hug the text
html = html.replace('margin-top: auto;', 'margin-top: 2rem;')

with open('index.html', 'w') as f:
    f.write(html)
