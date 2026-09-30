import glob
import re

css_code = """
/* Floating Google Profile Button */
#floating-google-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: var(--color-white);
    color: var(--color-bg);
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    z-index: 9999;
    transition: all 0.3s ease;
    border: 2px solid var(--color-white);
    display: flex;
    align-items: center;
    gap: 8px;
}
#floating-google-btn:hover {
    background-color: var(--color-gold-main);
    color: var(--color-white);
    border-color: var(--color-gold-main);
}
@media (max-width: 768px) {
    #floating-google-btn {
        bottom: 15px;
        right: 15px;
        padding: 10px 15px;
        font-size: 0.75rem;
    }
}
"""

with open('style.css', 'a') as f:
    f.write(css_code)

html_snippet = '    <a href="https://share.google/EH0CUMEuRCuS2VYOT" target="_blank" id="floating-google-btn">Profilo Google</a>\n'

def add_to_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            
        if 'id="floating-google-btn"' not in content:
            content = content.replace('</body>', html_snippet + '</body>')
            with open(filepath, 'w') as f:
                f.write(content)
    except FileNotFoundError:
        pass

html_files = glob.glob('*.html') + glob.glob('*/index.html')
for file in html_files:
    add_to_file(file)

