import re

with open('chi-sono.html', 'r') as f:
    chi_sono_content = f.read()

# Extract header (up to the end of <nav>)
header_match = re.search(r'^(.*?</nav>)', chi_sono_content, re.DOTALL)
header = header_match.group(1)

# Fix SEO in header
header = header.replace('<title>Francesca Grandi | Chi Sono e Formazione da Mental Coach</title>', '<title>Risorse Gratuite di Crescita Personale | Francesca Grandi</title>')
header = header.replace('Scopri chi è Francesca Grandi, Mental Coach. La mia storia, la formazione e il mio approccio alla crescita personale e al cambiamento.', 'Scopri le risorse gratuite di Francesca Grandi, Mental Coach. Video YouTube, consigli e approfondimenti dedicati alla crescita personale.')
header = header.replace('<link rel="canonical" href="https://www.francescagrandi.it/chi-sono/" />', '<link rel="canonical" href="https://www.francescagrandi.it/risorse-gratuite/" />')
header = header.replace('https://www.francescagrandi.it/chi-sono/', 'https://www.francescagrandi.it/risorse-gratuite/')
header = header.replace('Francesca Grandi | Chi Sono e Formazione da Mental Coach', 'Risorse Gratuite di Crescita Personale | Francesca Grandi')

# Keep the schema.org stuff if it exists but let's just strip it and make it simple, actually let's just replace the whole body content.

body_content = """
    <!-- HERO SECTION -->
    <section class="fade-in" style="padding-top: 150px; padding-bottom: 80px; text-align: center;">
        <div class="container" style="max-width: 800px;">
            <h2 style="color: var(--color-gold-main); font-size: 1.2rem; font-weight: 500; margin-bottom: 1.5rem; letter-spacing: 1px; text-transform: uppercase;">La tua crescita personale inizia da qui.</h2>
            <p class="lead" style="margin-bottom: 1.5rem; color: var(--color-white); font-size: 1.2rem;">Ho creato uno spazio gratuito in cui condivido riflessioni, strumenti pratici e approfondimenti sulla crescita personale.</p>
            <p class="lead" style="color: var(--color-silver); font-size: 1.1rem;">Contenuti per aiutarti a comprendere meglio te stesso, affrontare i tuoi blocchi e iniziare a costruire il cambiamento che desideri.</p>
        </div>
    </section>

    <!-- YOUTUBE SECTION -->
    <section class="fade-in" style="padding: 6rem 0; background-color: rgba(197, 160, 89, 0.05); border-top: 1px solid rgba(197, 160, 89, 0.1); border-bottom: 1px solid rgba(197, 160, 89, 0.1);">
        <div class="container" style="max-width: 800px; text-align: center;">
            <h2 class="title-large" style="margin-bottom: 2rem;">Scopri il mio canale YouTube</h2>
            <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Sul mio canale YouTube condivido video dedicati alla crescita personale, alla mentalità e ai cambiamenti che affrontiamo quotidianamente.</p>
            <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 3rem;">Troverai approfondimenti sulla paura del giudizio, la procrastinazione, le decisioni e gli ostacoli che spesso ci impediscono di vivere la vita che desideriamo.</p>
            <a href="https://www.youtube.com/channel/UCCeq55lGv98rXe3TZwWAmkA" target="_blank" class="btn btn-primary" style="padding: 1.2rem 2.5rem; font-size: 1.1rem; display: inline-block;">GUARDA I VIDEO GRATUITI</a>
        </div>
    </section>

    <!-- VIDEO PLACEHOLDERS SECTION -->
    <section class="fade-in" style="padding: 8rem 0;">
        <div class="container">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem;">
                
                <!-- Video 1 -->
                <div class="card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column;">
                    <div style="width: 100%; aspect-ratio: 16/9; background-color: var(--color-surface); border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.2);">
                        <span style="color: var(--color-silver); font-size: 0.9rem;">Anteprima Video</span>
                    </div>
                    <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: var(--color-white);">Titolo del video</h3>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin-bottom: 2rem; flex-grow: 1;">Breve descrizione del video. Questo spazio è riservato per una descrizione di 2-3 righe.</p>
                    <a href="https://www.youtube.com/channel/UCCeq55lGv98rXe3TZwWAmkA" target="_blank" class="btn btn-secondary" style="text-align: center;">GUARDA IL VIDEO</a>
                </div>

                <!-- Video 2 -->
                <div class="card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column;">
                    <div style="width: 100%; aspect-ratio: 16/9; background-color: var(--color-surface); border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.2);">
                        <span style="color: var(--color-silver); font-size: 0.9rem;">Anteprima Video</span>
                    </div>
                    <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: var(--color-white);">Titolo del video</h3>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin-bottom: 2rem; flex-grow: 1;">Breve descrizione del video. Questo spazio è riservato per una descrizione di 2-3 righe.</p>
                    <a href="https://www.youtube.com/channel/UCCeq55lGv98rXe3TZwWAmkA" target="_blank" class="btn btn-secondary" style="text-align: center;">GUARDA IL VIDEO</a>
                </div>

                <!-- Video 3 -->
                <div class="card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column;">
                    <div style="width: 100%; aspect-ratio: 16/9; background-color: var(--color-surface); border-radius: 12px; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.2);">
                        <span style="color: var(--color-silver); font-size: 0.9rem;">Anteprima Video</span>
                    </div>
                    <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: var(--color-white);">Titolo del video</h3>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin-bottom: 2rem; flex-grow: 1;">Breve descrizione del video. Questo spazio è riservato per una descrizione di 2-3 righe.</p>
                    <a href="https://www.youtube.com/channel/UCCeq55lGv98rXe3TZwWAmkA" target="_blank" class="btn btn-secondary" style="text-align: center;">GUARDA IL VIDEO</a>
                </div>

            </div>
        </div>
    </section>

    <!-- INTERNAL LINKS (SEO) -->
    <section class="fade-in" style="padding: 4rem 0; border-top: 1px solid var(--color-border);">
        <div class="container" style="text-align: center;">
            <p style="color: var(--color-silver); font-size: 0.95rem;">
                Scopri di più su di me nella pagina <a href="chi-sono.html" style="color: var(--color-gold-main); text-decoration: underline;">Chi Sono</a>, oppure esplora i miei servizi di <a href="index.html#coaching" style="color: var(--color-gold-main); text-decoration: underline;">Mental Coaching</a> e i miei <a href="index.html#percorsi" style="color: var(--color-gold-main); text-decoration: underline;">Percorsi digitali</a>.
            </p>
        </div>
    </section>

    <!-- INVITO FINALE -->
    <section class="fade-in" style="padding: 8rem 0; background-color: var(--color-bg); border-top: 1px solid var(--color-border);">
        <div class="container">
            <div style="max-width: 800px; margin: 0 auto; text-align: center; padding: 4rem 2rem; background: rgba(197, 160, 89, 0.05); border: 1px solid rgba(197, 160, 89, 0.2); border-radius: 24px;">
                <h2 style="color: var(--color-gold-main); font-size: 1rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem;">Vuoi fare un passo in più?</h2>
                <h3 class="title-large" style="margin-bottom: 1.5rem; margin-top: 0; font-size: 2rem;">Se desideri lavorare sui tuoi obiettivi attraverso un percorso personalizzato, possiamo iniziare da una conversazione.</h3>
                
                <a href="https://form.jotform.com/262596026954366" target="_blank" class="btn btn-primary" style="padding: 1.2rem 2.5rem; font-size: 1.1rem; display: inline-block; margin-top: 2rem;">RICHIEDI UNA CALL GRATUITA</a>
            </div>
        </div>
    </section>
"""

# Extract footer
footer_match = re.search(r'(<footer>.*)', chi_sono_content, re.DOTALL)
footer = footer_match.group(1)

# Now, we need to strip any Schema.org from the header that is specific to chi-sono, but it's okay to just leave it out or replace it.
# Actually, the header matching stops at </nav>, so the JSON-LD might be inside the <head>. Let's remove JSON-LD script block from header.
header = re.sub(r'<script type="application/ld\+json">.*?</script>', '', header, flags=re.DOTALL)

with open('risorse-gratuite.html', 'w') as f:
    f.write(header + "\n" + body_content + "\n" + footer)

