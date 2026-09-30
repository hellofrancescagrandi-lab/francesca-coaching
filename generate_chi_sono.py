import re

# Read index.html to get head, nav, footer
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract head up to </head>
head_match = re.search(r'(.*?)</head>', content, re.DOTALL)
head = head_match.group(1) + '</head>'

# Extract nav
nav_match = re.search(r'(<nav class="navbar">.*?</nav>)', content, re.DOTALL)
nav = nav_match.group(1)

# Modify nav links to be absolute (or root relative) so they work anywhere, or leave as is if we stay in root
# We will just change hrefs to point to /#... or index.html#...
nav = nav.replace('href="#', 'href="index.html#')
nav = nav.replace('href="index.html#aiuto"', 'href="index.html#coaching"') # just in case

# Extract footer
footer_match = re.search(r'(<footer>.*?</footer>)', content, re.DOTALL)
footer = footer_match.group(1)

# Extract scripts at the bottom
script_match = re.search(r'(<script>.*?</script>.*?</body>)', content, re.DOTALL)
if script_match:
    scripts = script_match.group(1)
else:
    scripts = '<script src="script.js"></script>\n</body>'

# Now modify the HEAD for chi-sono
head = re.sub(r'<title>.*?</title>', '<title>Francesca Grandi | Chi Sono e Formazione da Mental Coach</title>', head)
head = re.sub(r'<meta name="description" content=".*?">', '<meta name="description" content="Scopri chi è Francesca Grandi, Mental Coach. La mia storia, la formazione e il mio approccio alla crescita personale e al cambiamento.">', head)
head = re.sub(r'<link rel="canonical" href=".*?" />', '<link rel="canonical" href="https://www.francescagrandi.it/chi-sono/" />', head)

# Update Open Graph & Twitter
head = re.sub(r'<meta property="og:title" content=".*?" />', '<meta property="og:title" content="Francesca Grandi | Chi Sono e Formazione da Mental Coach" />', head)
head = re.sub(r'<meta property="og:description" content=".*?" />', '<meta property="og:description" content="Scopri chi è Francesca Grandi, Mental Coach. La mia storia, la formazione e il mio approccio alla crescita personale e al cambiamento." />', head)
head = re.sub(r'<meta property="og:url" content=".*?" />', '<meta property="og:url" content="https://www.francescagrandi.it/chi-sono/" />', head)

head = re.sub(r'<meta property="twitter:title" content=".*?" />', '<meta property="twitter:title" content="Francesca Grandi | Chi Sono e Formazione da Mental Coach" />', head)
head = re.sub(r'<meta property="twitter:description" content=".*?" />', '<meta property="twitter:description" content="Scopri chi è Francesca Grandi, Mental Coach. La mia storia, la formazione e il mio approccio alla crescita personale e al cambiamento." />', head)
head = re.sub(r'<meta property="twitter:url" content=".*?" />', '<meta property="twitter:url" content="https://www.francescagrandi.it/chi-sono/" />', head)

# JSON-LD update for ProfilePage / Person
json_ld = '''<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": "https://www.francescagrandi.it/chi-sono/#webpage",
      "url": "https://www.francescagrandi.it/chi-sono/",
      "name": "Francesca Grandi | Chi Sono e Formazione da Mental Coach",
      "isPartOf": {
        "@id": "https://www.francescagrandi.it/#website"
      },
      "about": {
        "@id": "https://www.francescagrandi.it/#person"
      }
    },
    {
      "@type": "Person",
      "@id": "https://www.francescagrandi.it/#person",
      "name": "Francesca Grandi",
      "jobTitle": "Mental Coach",
      "url": "https://www.francescagrandi.it/",
      "sameAs": [
        "https://www.instagram.com/grandiefrancesca/",
        "https://www.youtube.com/channel/UCCeq55lGv98rXe3TZwWAmkA"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.francescagrandi.it/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Chi Sono"
        }
      ]
    }
  ]
}
</script>'''

# Replace JSON-LD
head = re.sub(r'<script type="application/ld\+json">.*?</script>', json_ld, head, flags=re.DOTALL)

body_content = f"""
<body>
    {nav}

    <!-- HERO SECTION -->
    <section class="hero fade-in" style="padding-top: 120px; padding-bottom: 80px;">
        <div class="container" style="display: grid; grid-template-columns: 1fr; gap: 4rem; align-items: center;">
            <div class="hero-content">
                <h2 style="color: var(--color-gold-main); font-size: 1.2rem; font-weight: 500; margin-bottom: 1rem; letter-spacing: 1px; text-transform: uppercase;">Francesca Grandi | Mental Coach</h2>
                <h1 class="title-xl" style="margin-bottom: 2rem;">Prima di aiutare gli altri a trovare la propria direzione, cercavo la mia.</h1>
                <p class="lead" style="margin-bottom: 1.5rem; color: var(--color-silver);">Credo che ognuno debba avere la possibilità di costruire una vita che lo rappresenti davvero, senza sentirsi costantemente in competizione con gli altri.</p>
                <p class="lead" style="color: var(--color-silver);">Oggi, attraverso il mental coaching, accompagno le persone che desiderano smettere di vivere con il pilota automatico, comprendere i propri blocchi e iniziare a prendere decisioni consapevoli.</p>
            </div>
            <div class="hero-image" style="display: flex; justify-content: center;">
                <div style="width: 100%; aspect-ratio: 4/5; background-color: var(--color-surface); border: 2px dashed var(--color-border); border-radius: 24px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: var(--color-silver); font-size: 1.2rem; font-weight: 500;">Spazio per Fotografia</span>
                </div>
            </div>
        </div>
    </section>

    <!-- LA MIA STORIA -->
    <section style="padding: 8rem 0; background-color: var(--color-surface);">
        <div class="container fade-in">
            <div style="max-width: 800px; margin: 0 auto;">
                <h2 class="title-large" style="margin-bottom: 3rem;">NON HO SEMPRE SAPUTO COSA VOLESSI FARE NELLA VITA.</h2>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">C'è stato un periodo in cui guardavo le persone intorno a me andare avanti, prendere decisioni e costruire il proprio futuro.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Io, invece, mi sentivo costantemente indietro.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Alla domanda:<br><strong style="color: var(--color-white); font-size: 1.2rem; display: block; margin: 1rem 0;">"Cosa vuoi fare da grande?"</strong></p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Non avevo una risposta.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Avevo soltanto tanta confusione, frustrazione e la sensazione di non sapere quale direzione prendere.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 3rem;">Così ho iniziato a cercare delle risposte, avvicinandomi autonomamente al mondo della crescita personale.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 2rem;">A un certo punto ho compreso qualcosa che ha cambiato il mio modo di vedere le cose:</p>
                
                <div style="padding: 2rem; border-left: 4px solid var(--color-gold-main); background: rgba(197, 160, 89, 0.05); margin-bottom: 3rem; border-radius: 0 12px 12px 0;">
                    <p style="color: var(--color-white); font-size: 1.4rem; font-weight: 600; line-height: 1.5; margin: 0;">La mia vita dipendeva dalle mie scelte e non dovevo essere in competizione con nessuno.</p>
                </div>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8;">Da quel momento ho iniziato a concentrarmi sul mio percorso, anziché confrontarlo continuamente con quello degli altri.</p>
            </div>
        </div>
    </section>

    <!-- PERCHE SONO DIVENTATA MENTAL COACH -->
    <section style="padding: 8rem 0;">
        <div class="container fade-in">
            <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                <h2 class="title-large" style="margin-bottom: 3rem;">VOLEVO DIVENTARE LA PERSONA DI CUI <span style="color: var(--color-gold-main);">AVREI AVUTO BISOGNO IO ANNI FA.</span></h2>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Questa frase rappresenta il motivo per cui ho deciso di trasformare il mio interesse per la crescita personale in una professione.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Volevo aiutare le persone che si sentono confuse, bloccate o insoddisfatte a ritrovare una direzione.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8;">Non dicendo loro quali decisioni prendere, ma accompagnandole nella ricerca delle proprie risposte.</p>
            </div>
        </div>
    </section>

    <!-- IL MIO APPROCCIO -->
    <section style="padding: 8rem 0; background-color: var(--color-surface);">
        <div class="container fade-in">
            <div style="max-width: 800px; margin: 0 auto;">
                <h2 class="title-large" style="margin-bottom: 3rem;">NON SONO QUI PER DIRTI QUELLO CHE VUOI SENTIRTI DIRE.</h2>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 3rem;">Sono qui per ascoltarti, comprendere la tua situazione e farti anche quelle domande che, forse, hai sempre evitato di porti.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Il mio lavoro parte da una domanda fondamentale:</p>
                
                <div style="padding: 2rem; border: 1px solid var(--color-gold-main); background: rgba(197, 160, 89, 0.05); margin-bottom: 3rem; border-radius: 12px; text-align: center;">
                    <p style="color: var(--color-gold-main); font-size: 1.6rem; font-weight: 700; line-height: 1.5; margin: 0;">"Perché senti il bisogno di cambiare?"</p>
                </div>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Da qui, lavoriamo insieme per comprendere cosa desideri realmente, individuare gli ostacoli e costruire un piano d'azione personalizzato.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8;">Non credo nelle soluzioni universali, perché ogni persona ha una storia, delle esigenze e degli obiettivi differenti.</p>
            </div>
        </div>
    </section>

    <!-- LA MIA FORMAZIONE -->
    <section style="padding: 8rem 0;">
        <div class="container fade-in">
            <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                <h2 class="title-large" style="margin-bottom: 3rem;">LA MIA FORMAZIONE</h2>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Ho scelto di trasformare la mia passione per la crescita personale in una professione, completando la mia formazione presso Metodo G.R.I.P. Coaching Academy.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 1.5rem;">Ho conseguito il diploma di Mental Coach l'8 settembre 2026.</p>
                
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 4rem;">La mia formazione mi ha fornito strumenti e conoscenze che oggi utilizzo per accompagnare le persone nei loro percorsi di crescita personale.</p>
                
                <div style="margin-top: 2rem;">
                    <a href="Diploma_Francesca_Grandi_per_sito.jpg" target="_blank" style="display: block;">
                        <img src="Diploma_Francesca_Grandi_per_sito.jpg" alt="Diploma Mental Coach Francesca Grandi" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid var(--color-border); cursor: zoom-in;" onerror="this.onerror=null; this.parentNode.innerHTML='<div style=\'width: 100%; aspect-ratio: 1.414/1; background-color: var(--color-surface); border: 2px dashed var(--color-border); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem;\'><span style=\'color: var(--color-silver); font-size: 1.2rem; font-weight: 500;\'>Spazio per Attestato Diploma</span><span style=\'color: var(--color-gray); font-size: 0.9rem;\'>Caricare: Diploma_Francesca_Grandi_per_sito.jpg</span></div>'">
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- CALL GRATUITA -->
    <section style="padding: 8rem 0; background-color: var(--color-bg); border-top: 1px solid var(--color-border);">
        <div class="container fade-in">
            <div style="max-width: 800px; margin: 0 auto; text-align: center; padding: 4rem 2rem; background: rgba(197, 160, 89, 0.05); border: 1px solid rgba(197, 160, 89, 0.2); border-radius: 24px;">
                <h2 class="title-large" style="margin-bottom: 1.5rem;">IL CAMBIAMENTO CHE CERCHI PUÒ INIZIARE DA UNA CONVERSAZIONE.</h2>
                <p style="color: var(--color-silver); font-size: 1.1rem; line-height: 1.8; margin-bottom: 3rem;">Se senti che qualcosa nella tua vita non ti soddisfa più, possiamo iniziare a fare chiarezza insieme.</p>
                
                <a href="https://form.jotform.com/262596026954366" target="_blank" class="btn btn-primary" style="padding: 1.2rem 2.5rem; font-size: 1.1rem; display: inline-block;">RICHIEDI UNA CALL GRATUITA</a>
            </div>
        </div>
    </section>

    {footer}
    {scripts}
"""

# Apply media query directly for the hero layout
body_content = body_content.replace('</head>', '''
    <style>
        @media (min-width: 768px) {
            .hero > .container {
                grid-template-columns: 1.2fr 0.8fr !important;
            }
        }
        /* Update nav links for the requested internal links */
    </style>
</head>''')

# Modify nav to have the requested links: HOME, MENTAL COACHING, PERCORSI, NEW ERA, CONTATTI
new_nav_links = """
        <div class="nav-links">
            <a href="index.html">Home</a>
            <a href="index.html#coaching">Mental Coaching</a>
            <a href="index.html#percorsi">Percorsi</a>
            <a href="https://corsi.francescagrandi.it/neweraacademy" target="_blank">New Era</a>
            <a href="index.html#contatti">Contatti</a>
        </div>
"""
body_content = re.sub(r'<div class="nav-links">.*?</div>', new_nav_links, body_content, flags=re.DOTALL)

with open('chi-sono.html', 'w', encoding='utf-8') as f:
    f.write(head + '\n' + body_content)
