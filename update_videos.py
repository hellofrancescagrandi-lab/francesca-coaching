import re

with open('risorse-gratuite/index.html', 'r') as f:
    content = f.read()

video_section_html = """                <!-- Video 1 -->
                <div class="card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; padding: 0;">
                    <div style="width: 100%; aspect-ratio: 16/9; background-color: var(--color-surface); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <img src="../yt_thumb_1.png" alt="Cosa fare quando ti senti persa nella vita" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="padding: 0 1.5rem 1.5rem 1.5rem; display: flex; flex-direction: column; flex-grow: 1;">
                        <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: var(--color-white);">Cosa fare quando ti senti persa nella vita</h3>
                        <p style="color: var(--color-silver); font-size: 0.95rem; margin-bottom: 2rem; flex-grow: 1;">Una riflessione pratica per capire da dove ripartire quando ti sembra di aver perso la bussola.</p>
                        <a href="https://www.youtube.com/watch?v=D_AQXDXnLh4" target="_blank" class="btn btn-secondary" style="text-align: center;">GUARDA IL VIDEO</a>
                    </div>
                </div>

                <!-- Video 2 -->
                <div class="card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; padding: 0;">
                    <div style="width: 100%; aspect-ratio: 16/9; background-color: var(--color-surface); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <img src="../yt_thumb_2.png" alt="Se fallisci, non significa che sei un fallimento" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="padding: 0 1.5rem 1.5rem 1.5rem; display: flex; flex-direction: column; flex-grow: 1;">
                        <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: var(--color-white);">Se fallisci, non significa che sei un fallimento</h3>
                        <p style="color: var(--color-silver); font-size: 0.95rem; margin-bottom: 2rem; flex-grow: 1;">Come sganciare la tua identità e il tuo valore dai risultati che ottieni e dagli errori che commetti.</p>
                        <a href="https://www.youtube.com/watch?v=JqoS_LvnuXY" target="_blank" class="btn btn-secondary" style="text-align: center;">GUARDA IL VIDEO</a>
                    </div>
                </div>

                <!-- Video 3 -->
                <div class="card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column; overflow: hidden; padding: 0;">
                    <div style="width: 100%; aspect-ratio: 16/9; background-color: var(--color-surface); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center;">
                        <img src="../yt_thumb_3.png" alt="Se la tua vita fosse un film, cosa faresti adesso?" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="padding: 0 1.5rem 1.5rem 1.5rem; display: flex; flex-direction: column; flex-grow: 1;">
                        <h3 style="font-size: 1.3rem; margin-bottom: 1rem; color: var(--color-white);">Se la tua vita fosse un film, cosa faresti adesso?</h3>
                        <p style="color: var(--color-silver); font-size: 0.95rem; margin-bottom: 2rem; flex-grow: 1;">Un cambio di prospettiva radicale per smettere di essere comparsa e diventare protagonista della tua storia.</p>
                        <a href="https://www.youtube.com/watch?v=3EXnINjL5Bk" target="_blank" class="btn btn-secondary" style="text-align: center;">GUARDA IL VIDEO</a>
                    </div>
                </div>"""

# Find the start and end of the video grid
# The grid starts after <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem;">
# And ends before </div>\n        </div>\n    </section>\n\n    <!-- INTERNAL LINKS (SEO) -->
pattern = r'(<div style="display: grid; grid-template-columns: repeat\(auto-fit, minmax\(300px, 1fr\)\); gap: 3rem;">).*?(</div>\s*</div>\s*</section>\s*<!-- INTERNAL LINKS \(SEO\) -->)'

new_content = re.sub(pattern, r'\1\n' + video_section_html + r'\n\2', content, flags=re.DOTALL)

with open('risorse-gratuite/index.html', 'w') as f:
    f.write(new_content)

