import re

with open('new-era-academy/index.html', 'r') as f:
    html = f.read()

html = html.replace('<title>Risorse Gratuite di Crescita Personale | Francesca Grandi</title>', '<title>NEW ERA Academy | Francesca Grandi</title>')
html = html.replace('Scopri le risorse gratuite di Francesca Grandi, Mental Coach. Video YouTube, consigli e approfondimenti dedicati alla crescita personale.', 'Entra nella NEW ERA Academy. Sblocca il tuo potenziale e riprendi in mano la tua vita.')
html = html.replace('Risorse Gratuite di Crescita Personale | Francesca Grandi', 'NEW ERA Academy | Francesca Grandi')

with open('new-era-academy/index.html', 'w') as f:
    f.write(html)
