import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace the "Non sai quale percorso scegliere?" block
html = re.sub(
    r'<div style="margin-top: 2\.5rem; padding: 2rem; border: 1px solid var\(--color-border\); border-radius: 12px; background: rgba\(0,0,0,0\.2\);">.*?</div>',
    '',
    html,
    flags=re.DOTALL
)

# Fix the pricing cards
# We will just replace the whole <div class="pricing-grid">...</div> block
old_grid_pattern = r'<div class="pricing-grid">.*?</div>\s*<!-- NEW SECTION: Come lavoriamo insieme in PRO -->'
new_grid = """<div class="pricing-grid">
                <!-- BASIC -->
                <div class="card" style="display: flex; flex-direction: column;">
                    <div style="flex-grow: 1;">
                        <h3 style="font-size: 1.8rem; margin-bottom: 0.5rem;">BASIC</h3>
                        <div class="price-badge">147 €</div>
                        <p style="color: var(--color-white); font-weight: 500; margin-bottom: 1rem;">Hai una situazione precisa su cui vuoi fare chiarezza?</p>
                        <p style="color: var(--color-silver); margin-bottom: 1.5rem;">Una sessione intensiva di 60 minuti per lavorare su una scelta, un problema specifico o una situazione su cui continui a girare in tondo.</p>
                        <p style="color: var(--color-silver); margin-bottom: 0.5rem; font-weight: 500;">Per chi:</p>
                        <ul style="color: var(--color-silver); margin-bottom: 2rem; padding-left: 1.5rem;">
                            <li style="margin-bottom: 0.5rem;">è davanti a una decisione precisa</li>
                            <li style="margin-bottom: 0.5rem;">vuole un confronto esterno</li>
                            <li style="margin-bottom: 0.5rem;">sente di essere bloccato su una singola situazione</li>
                            <li style="margin-bottom: 0.5rem;">non sente ancora il bisogno di un percorso continuativo</li>
                        </ul>
                    </div>
                    <a href="https://form.jotform.com/262775581783068" target="_blank" class="btn btn-primary" style="text-align: center; width: 100%; margin-top: auto;">COMPILA IL QUESTIONARIO</a>
                </div>

                <!-- PRO -->
                <div class="card" style="display: flex; flex-direction: column; border: 2px solid var(--color-gold-main); transform: scale(1.05); box-shadow: 0 10px 30px rgba(197, 160, 89, 0.15);">
                    <div style="flex-grow: 1;">
                        <div style="background-color: var(--color-gold-main); color: var(--color-bg-deep); font-size: 0.8rem; font-weight: 700; padding: 0.4rem 1rem; border-radius: 980px; align-self: flex-start; margin-bottom: 1rem; display: inline-block;">PERCORSO PRINCIPALE</div>
                        <h3 style="font-size: 1.8rem; margin-bottom: 0.5rem;">PRO</h3>
                        <div class="price-badge">497 €</div>
                        <p style="color: var(--color-white); font-weight: 500; margin-bottom: 1rem;">Continui a girare intorno alla stessa situazione e da solo non riesci ad arrivare a una decisione?</p>
                        <p style="color: var(--color-silver); margin-bottom: 1.5rem;">Per un mese lavoriamo insieme per capire cosa ti sta tenendo fermo, fare chiarezza e trasformare quello che emerge in decisioni e passi concreti.</p>
                        
                        <p style="color: var(--color-gold-main); margin-bottom: 1.5rem; font-weight: 500; font-size: 0.95rem; line-height: 1.5;">
                            4 sessioni individuali da 60 minuti<br>
                            1 sessione a settimana<br>
                            1 mese di lavoro insieme
                        </p>

                        <p style="color: var(--color-silver); margin-bottom: 0.5rem; font-weight: 500;">Per chi:</p>
                        <ul style="color: var(--color-silver); margin-bottom: 2rem; padding-left: 1.5rem;">
                            <li style="margin-bottom: 0.5rem;">sente che il problema non riguarda una sola situazione</li>
                            <li style="margin-bottom: 0.5rem;">continua a ricadere negli stessi pensieri o comportamenti</li>
                            <li style="margin-bottom: 0.5rem;">vuole essere accompagnato mentre inizia a fare cambiamenti concreti</li>
                            <li style="margin-bottom: 0.5rem;">vuole smettere di rimandare e iniziare a prendere decisioni</li>
                        </ul>
                    </div>
                    <a href="https://form.jotform.com/262775581783068" target="_blank" class="btn btn-primary" style="text-align: center; width: 100%; margin-top: auto;">COMPILA IL QUESTIONARIO</a>
                </div>

                <!-- ELITE -->
                <div class="card" style="display: flex; flex-direction: column;">
                    <div style="flex-grow: 1;">
                        <h3 style="font-size: 1.8rem; margin-bottom: 0.5rem;">ELITE</h3>
                        <div class="price-badge" style="font-size: 1.4rem; padding: 0.35rem 0;">Prezzo da definire</div>
                        <p style="color: var(--color-white); font-weight: 500; margin-bottom: 1rem;">Un percorso costruito sulla tua situazione.</p>
                        <p style="color: var(--color-silver); margin-bottom: 1.5rem;">Un accompagnamento personalizzato per chi sente di aver bisogno di un lavoro più profondo e continuativo.</p>
                        <p style="color: var(--color-silver); margin-bottom: 2rem;">Il primo passo è compilare il questionario. Se riterrò che il percorso possa essere adatto alla tua situazione, ti contatterò per definire insieme obiettivi, struttura, durata e investimento.</p>
                    </div>
                    <a href="https://form.jotform.com/262775581783068" target="_blank" class="btn btn-primary" style="text-align: center; width: 100%; margin-top: auto;">COMPILA IL QUESTIONARIO</a>
                </div>
            </div>

            <!-- NEW SECTION: Come lavoriamo insieme in PRO -->"""

html = re.sub(old_grid_pattern, new_grid, html, flags=re.DOTALL)

# Replace any remaining Calendly links
html = html.replace('https://calendly.com/francescagrandi/call-1-1-30-minuti', 'https://form.jotform.com/262775581783068')
# Replace "RICHIEDI UNA CALL GRATUITA" with "COMPILA IL QUESTIONARIO"
html = html.replace('RICHIEDI UNA CALL GRATUITA', 'COMPILA IL QUESTIONARIO')

with open('index.html', 'w') as f:
    f.write(html)
