import re

with open('new-era-academy/index.html', 'r') as f:
    html = f.read()

# Replace canonical
html = html.replace('href="https://www.francescagrandi.it/risorse-gratuite/"', 'href="https://www.francescagrandi.it/new-era-academy/"')
html = html.replace('<title>Risorse Gratuite | Francesca Grandi</title>', '<title>NEW ERA Academy | Francesca Grandi</title>')

nav_end = html.find('</nav>') + 6
footer_start = html.find('<footer')

new_content = """
    <!-- HERO SECTION NEW ERA -->
    <section class="hero" style="min-height: 80vh; padding-top: 150px; display: flex; align-items: center; position: relative; overflow: hidden;">
        <div class="container hero-grid" style="display: grid; grid-template-columns: 1fr; gap: 4rem; align-items: center;">
            <div class="hero-content fade-in">
                <h3 style="color: var(--color-gold-main); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1rem; font-size: 1rem;">NEW ERA Academy</h3>
                <h1 class="title-massive" style="font-size: 3.5rem; line-height: 1.1; margin-bottom: 2rem;">Sai di avere un potenziale enorme, ma ti senti <span style="color: var(--color-gold-main);">completamente bloccata</span> mentre il resto del mondo va avanti?</h1>
                <p class="lead" style="font-size: 1.3rem; margin-bottom: 2.5rem; max-width: 600px;">
                    Fermati un attimo e fai un respiro profondo. Se sei qui, probabilmente ti riconosci in queste situazioni.
                </p>
                <a href="https://corsi.francescagrandi.it/neweraacademy" class="btn btn-primary" style="padding: 1.2rem 2.5rem; display: inline-block; font-size: 1.1rem; box-shadow: 0 10px 30px rgba(201,167,93,0.3);">ACCEDI SUBITO A NEW ERA</a>
            </div>
        </div>
    </section>

    <!-- THE PROBLEM SECTION -->
    <section style="padding: 6rem 0; background-color: var(--color-surface);">
        <div class="container">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 4rem; align-items: center;">
                <div class="fade-in">
                    <img loading="lazy" src="../stressed.jpg" alt="Donna pensierosa" style="width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                </div>
                <div class="fade-in">
                    <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 1.5rem;">
                        <li style="display: flex; gap: 1rem; align-items: flex-start;">
                            <span style="color: var(--color-gold-main); font-size: 1.5rem;">✦</span>
                            <p style="margin: 0;"><strong>Hai la sensazione di avere tanto da dare, ma non sai quale direzione prendere.</strong> E questa paralisi è incredibilmente frustrante, perché ti fa sentire intrappolata in un vicolo cieco.</p>
                        </li>
                        <li style="display: flex; gap: 1rem; align-items: flex-start;">
                            <span style="color: var(--color-gold-main); font-size: 1.5rem;">✦</span>
                            <p style="margin: 0;"><strong>Ci metti tutta te stessa, ma ti sembra di correre su un tapis roulant.</strong> Ti impegni, ma ti senti comunque ferma al punto di partenza. Sei letteralmente sfinita dal dare l'anima senza vedere il traguardo.</p>
                        </li>
                        <li style="display: flex; gap: 1rem; align-items: flex-start;">
                            <span style="color: var(--color-gold-main); font-size: 1.5rem;">✦</span>
                            <p style="margin: 0;"><strong>Da mesi hai il pensiero fisso di voler cambiare vita o lavoro.</strong> E la cosa peggiore è il senso di colpa: ti ripeti che in fondo "non ti manca niente", ma questo sfinimento mentale ti sta togliendo l'ossigeno.</p>
                        </li>
                        <li style="display: flex; gap: 1rem; align-items: flex-start;">
                            <span style="color: var(--color-gold-main); font-size: 1.5rem;">✦</span>
                            <p style="margin: 0;"><strong>Sai di meritare di più, ma le insicurezze sono un freno a mano.</strong> Hai il terrore di sbagliare, o peggio... di sentirti ormai "troppo vecchia" per cambiare rotta.</p>
                        </li>
                        <li style="display: flex; gap: 1rem; align-items: flex-start;">
                            <span style="color: var(--color-gold-main); font-size: 1.5rem;">✦</span>
                            <p style="margin: 0;"><strong>Sei così stanca che a volte dubiti perfino di averlo, questo potenziale.</strong> Vorresti solo mettere la tua vita "in pausa" da tutto e da tutti.</p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- EMPATHY SECTION -->
    <section style="padding: 6rem 0;">
        <div class="container fade-in text-center" style="max-width: 800px; margin: 0 auto;">
            <p class="lead" style="font-size: 1.4rem; font-style: italic; color: var(--color-silver);">
                "Ti capisco benissimo. Leggo parole come queste ogni giorno.<br>E so quanto sia pesante quella voragine che si crea tra la maschera di donna forte e impeccabile che mostri al mondo, e la sensazione di vuoto, insicurezza e confusione che provi dentro di te quando sei sola."
            </p>
            <h2 class="title-large" style="margin: 3rem 0 1.5rem; font-size: 2.5rem; color: var(--color-white);">Non è colpa tua.</h2>
            <p style="font-size: 1.1rem; color: var(--color-silver); margin-bottom: 1.5rem;">
                Non sei "sbagliata". Il tuo corpo e la tua mente si sono semplicemente abituati a vivere in modalità sopravvivenza. Hai investito così tante energie nel cercare di non crollare, che ora non te ne restano più per <strong>creare</strong> la vita che desideri davvero.
            </p>
            <p style="font-size: 1.2rem; color: var(--color-gold-main); font-weight: 600;">
                Ma non devi per forza continuare a vivere così. Puoi smettere di sopravvivere.
            </p>
        </div>
    </section>

    <!-- THE SOLUTION / ACADEMY -->
    <section style="padding: 6rem 0; background-color: var(--color-surface); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div class="container fade-in">
            <div style="text-center" style="text-align: center; margin-bottom: 4rem;">
                <h2 class="title-large" style="margin-bottom: 1rem;">Benvenuta in NEW ERA Academy</h2>
                <p class="lead" style="max-width: 700px; margin: 0 auto;">NEW ERA è il percorso che ti prende per mano e ti aiuta a smettere di rimandare, riconoscere cosa ti blocca per davvero e iniziare a costruire — un giorno alla volta — la versione di te che vuoi diventare.</p>
                <p style="color: var(--color-silver); margin-top: 1.5rem;">Non troverai frasi fatte o pacche sulle spalle. Troverai un metodo pratico per scendere da quel tapis roulant, spegnere l'ansia e riprendere fiato.</p>
            </div>
            
            <h3 style="text-align: center; color: var(--color-gold-main); margin-bottom: 3rem; font-size: 1.8rem;">Cosa faremo insieme, passo dopo passo:</h3>
            <p style="text-align: center; margin-bottom: 4rem; color: var(--color-silver);">Il percorso è diviso in moduli accessibili fin da subito, così puoi seguirli con i tuoi ritmi, senza ansia o scadenze.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
                
                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <img loading="lazy" src="../new_era_journal.jpg" alt="New Era Journal" style="width: 100%; border-radius: 8px; margin-bottom: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    <h4 style="color: var(--color-gold-main); margin-bottom: 1rem; font-size: 1.3rem;">INIZIA DA QUI:<br>La tua Bussola</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Prima di partire, mettiamo ordine. Avrai a disposizione la tua Road Map e il New Era JOURNAL per tracciare i tuoi progressi fin dal primo giorno.</p>
                </div>
                
                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; color: var(--color-gold-main); margin-bottom: 1rem;">01</div>
                    <h4 style="color: var(--color-white); margin-bottom: 1rem; font-size: 1.3rem;">Dove sei e cosa ti frena davvero</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Smettiamo di navigare a vista. Capiremo esattamente dove ti trovi ora, individueremo i blocchi invisibili che ti tengono ferma e faremo una promessa solenne a te stessa.</p>
                </div>

                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; color: var(--color-gold-main); margin-bottom: 1rem;">02</div>
                    <h4 style="color: var(--color-white); margin-bottom: 1rem; font-size: 1.3rem;">Disinnesca il passato e l'autosabotaggio</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Andremo a smantellare quelle convinzioni che ti fanno sentire "troppo vecchia" o "inadeguata". Imparerai a riconoscere i tuoi trigger emotivi, i pensieri automatici e a interrompere i pattern distruttivi che ti fanno girare a vuoto.</p>
                </div>

                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; color: var(--color-gold-main); margin-bottom: 1rem;">03</div>
                    <h4 style="color: var(--color-white); margin-bottom: 1rem; font-size: 1.3rem;">Il tuo kit di pronto soccorso emotivo</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Quando l'ansia sale e i dubbi ti assalgono, avrai strumenti pratici per ritrovare la calma. Scoprirai il potere del respiro consapevole, della mindfulness, delle frasi mantra e del journaling guidato.</p>
                </div>

                <div class="card" style="background-color: var(--color-bg); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; color: var(--color-gold-main); margin-bottom: 1rem;">04</div>
                    <h4 style="color: var(--color-white); margin-bottom: 1rem; font-size: 1.3rem;">Crea la tua nuova direzione</h4>
                    <p style="color: var(--color-silver); font-size: 0.95rem; margin: 0;">Ora che abbiamo fatto spazio, è il momento di decidere chi vuoi essere. Lavoreremo sulle tue azioni, sulle tue priorità e sulle abitudini giornaliere per costruire il tuo nuovo futuro, senza più farti condizionare dalla paura.</p>
                </div>

                <div class="card" style="background-color: var(--color-gold-main); padding: 2.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                    <div style="font-size: 2rem; color: var(--color-bg); margin-bottom: 1rem; font-weight: bold;">90</div>
                    <h4 style="color: var(--color-bg); margin-bottom: 1rem; font-size: 1.3rem;">NEW ERA 90: La Trasformazione</h4>
                    <p style="color: rgba(0,0,0,0.8); font-size: 0.95rem; margin: 0; font-weight: 500;">Una sfida pratica di 90 giorni per consolidare tutto ciò che hai imparato e trasformare la teoria in una nuova e potente realtà quotidiana.</p>
                </div>

            </div>
        </div>
    </section>

    <!-- CALL TO ACTION -->
    <section style="padding: 8rem 0; text-align: center;">
        <div class="container fade-in" style="max-width: 800px; margin: 0 auto;">
            <h2 class="title-large" style="margin-bottom: 2rem;">Quanto vale la tua serenità?</h2>
            <p class="lead" style="margin-bottom: 2rem;">
                Oggi puoi scegliere di continuare a convivere con quel senso di insicurezza e immobilità, sentendoti svuotata. Oppure puoi decidere di abbassare la maschera e darti il permesso di sbloccare tutto il potenziale che tieni chiuso dentro.
            </p>
            <div style="margin: 3rem 0; padding: 2rem; border: 1px solid var(--color-gold-main); border-radius: 12px; display: inline-block;">
                <p style="font-size: 1.2rem; color: var(--color-silver); margin-bottom: 0.5rem;">L'accesso completo a NEW ERA Academy richiede un investimento di</p>
                <p style="font-size: 3rem; color: var(--color-white); font-weight: 700; margin: 0;">297,00 € <span style="font-size: 1rem; color: var(--color-silver); font-weight: normal;">(IVA inclusa)</span></p>
            </div>
            <div>
                <a href="https://corsi.francescagrandi.it/neweraacademy" class="btn btn-primary" style="padding: 1.5rem 3rem; font-size: 1.2rem; display: inline-block; box-shadow: 0 10px 30px rgba(201,167,93,0.3);">ACCEDI SUBITO A NEW ERA</a>
            </div>
        </div>
    </section>
"""

new_html = html[:nav_end] + new_content + html[footer_start:]

with open('new-era-academy/index.html', 'w') as f:
    f.write(new_html)

