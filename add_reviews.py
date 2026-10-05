import re

with open('new-era-academy/index.html', 'r') as f:
    html = f.read()

reviews_html = """
    <!-- REVIEWS SECTION -->
    <section style="padding: 6rem 0; background-color: var(--color-bg);">
        <div class="container fade-in">
            <div class="text-center" style="max-width: 800px; margin: 0 auto; margin-bottom: 4rem;">
                <h3 style="color: var(--color-gold-main); font-size: 1.8rem; text-transform: uppercase; letter-spacing: 1px;">Dicono di NEW ERA</h3>
                <h2 class="title-large" style="margin-top: 1rem;">Le storie di chi ha già fatto il primo passo</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; align-items: start;">
                <div>
                    <img loading="lazy" src="../claudia.png" alt="Recensione Claudia" style="width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                </div>
                <div>
                    <img loading="lazy" src="../gloria.png" alt="Recensione Gloria" style="width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                </div>
                <div>
                    <img loading="lazy" src="../samantha.png" alt="Recensione Samantha" style="width: 100%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                </div>
            </div>
        </div>
    </section>
"""

# Insert right before <!-- FAQ SECTION -->
target_str = "<!-- FAQ SECTION -->"
html = html.replace(target_str, reviews_html + "\n    " + target_str)

with open('new-era-academy/index.html', 'w') as f:
    f.write(html)
