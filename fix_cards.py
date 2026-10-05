import re

with open('new-era-academy/index.html', 'r') as f:
    html = f.read()

# Fix Card 1
old_card_1 = """                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <img loading="lazy" src="../new_era_journal.jpg" alt="New Era Journal" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    <h4 style="color: var(--color-gold-main); margin-bottom: 1rem; font-size: 1.3rem;">INIZIA DA QUI:<br>La tua Bussola</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Prima di partire, mettiamo ordine. Avrai a disposizione la tua Road Map e il New Era JOURNAL per tracciare i tuoi progressi fin dal primo giorno.</p>
                </div>"""

new_card_1 = """                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; color: var(--color-gold-main); margin-bottom: 1rem;">✦</div>
                    <h4 style="color: var(--color-white); margin-bottom: 1rem; font-size: 1.3rem;">INIZIA DA QUI: La tua Bussola</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Prima di partire, mettiamo ordine. Avrai a disposizione la tua Road Map e il New Era JOURNAL per tracciare i tuoi progressi fin dal primo giorno.</p>
                </div>"""

html = html.replace(old_card_1, new_card_1)

# Fix Card 90
old_card_90 = """                <div class="card" style="background-color: var(--color-gold-main); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; color: var(--color-bg); margin-bottom: 1rem; font-weight: bold;">90</div>
                    <h4 style="color: var(--color-bg); margin-bottom: 1rem; font-size: 1.3rem;">NEW ERA 90: La Trasformazione</h4>
                    <p style="color: rgba(0,0,0,0.8); font-size: 0.95rem; margin: 0; font-weight: 500;">Una sfida pratica di 90 giorni per consolidare tutto ciò che hai imparato e trasformare la teoria in una nuova e potente realtà quotidiana.</p>
                </div>"""

new_card_90 = """                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid var(--color-gold-main);">
                    <div style="font-size: 2rem; color: var(--color-gold-main); margin-bottom: 1rem;">90</div>
                    <h4 style="color: var(--color-white); margin-bottom: 1rem; font-size: 1.3rem;">NEW ERA 90: La Trasformazione</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Una sfida pratica di 90 giorni per consolidare tutto ciò che hai imparato e trasformare la teoria in una nuova e potente realtà quotidiana.</p>
                </div>"""

html = html.replace(old_card_90, new_card_90)

with open('new-era-academy/index.html', 'w') as f:
    f.write(html)

