import glob
import re

new_footer_html = """    <footer style="padding: 4rem 0; background-color: var(--color-bg); border-top: 1px solid var(--color-border);">
        <div class="container" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 2rem;">
            <div style="flex: 1; min-width: 250px;">
                <p style="margin-bottom: 1rem; color: var(--color-silver);">&copy; 2026 Francesca Grandi.<br>Tutti i diritti riservati.</p>
                <div class="social-links" style="display: flex; gap: 1.5rem;">
                    <a href="https://www.instagram.com/grandiefrancesca/" target="_blank" style="color: var(--color-white); text-decoration: none; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px;">Instagram</a>
                    <a href="https://www.youtube.com/channel/UCCeq55lGv98rXe3TZwWAmkA" target="_blank" style="color: var(--color-white); text-decoration: none; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px;">YouTube</a>
                    <a href="#" target="_blank" style="color: var(--color-white); text-decoration: none; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 1px;">Privacy</a>
                </div>
            </div>
            
            <div style="flex: 0 0 auto; display: flex; justify-content: flex-end;">
                <a href="https://share.google/hwRPIXZczyIJTfIeq" target="_blank" style="display: block; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    <img src="{prefix}google_business_card.png" alt="Francesca Grandi - Profilo Google" style="max-width: 320px; width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);">
                </a>
            </div>
        </div>
    </footer>"""

html_files = glob.glob('*.html') + glob.glob('*/index.html')

for file in html_files:
    try:
        with open(file, 'r') as f:
            html = f.read()
            
        # 1. Remove the floating button
        html = re.sub(r'<a href="https://share\.google/EH0CUMEuRCuS2VYOT".*?id="floating-google-btn">.*?</a>', '', html, flags=re.DOTALL)
        
        # Determine prefix for image path based on directory depth
        prefix = '../' if '/' in file else ''
        
        # 2. Replace the old footer with the new layout
        # The old footer is:
        # <footer>
        #     <div class="container">
        #         <p style="margin-bottom: 0;">&copy; 2026 Francesca Grandi. Tutti i diritti riservati.</p>
        #         <div class="social-links">
        #             <a href="https://www.instagram.com/grandiefrancesca/" target="_blank">Instagram</a>
        #             <a href="https://www.youtube.com/channel/UCCeq55lGv98rXe3TZwWAmkA" target="_blank">YouTube</a>
        #             <a href="#" target="_blank">Privacy Policy</a>
        #         </div>
        #     </div>
        # </footer>
        
        html = re.sub(r'<footer>.*?</footer>', new_footer_html.replace('{prefix}', prefix), html, flags=re.DOTALL)
        
        with open(file, 'w') as f:
            f.write(html)
            
    except Exception as e:
        print(f"Error processing {file}: {e}")

