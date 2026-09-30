import glob
import re

# 1. Optimize CSS
with open('style.css', 'r') as f:
    css_content = f.read()

css_content = css_content.replace(
    'transform: translateY(20px) scale(0.98);',
    'transform: translateY(15px);'
)
css_content = css_content.replace(
    'transform: translateY(0) scale(1);',
    'transform: translateY(0);'
)
# Make transition a bit faster and simpler for mobile
css_content = css_content.replace(
    'transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1);',
    'transition: opacity 0.6s ease-out, transform 0.6s ease-out;'
)
with open('style.css', 'w') as f:
    f.write(css_content)

# 2. Fix HTML files
html_files = glob.glob('*.html') + glob.glob('*/index.html')

for file in html_files:
    try:
        with open(file, 'r') as f:
            html = f.read()
        
        # Remove fade-in from the first hero section
        # Looking for <section class="hero fade-in"> or <section class="fade-in" style="padding-top: 150px
        html = html.replace('<section id="home" class="hero fade-in">', '<section id="home" class="hero">')
        html = html.replace('<section class="fade-in" style="padding-top: 150px;', '<section style="padding-top: 150px;')
        
        # Add fetchpriority to the hero image
        html = html.replace('src="francesca_hero_new.jpg" alt="Francesca Grandi"', 'src="francesca_hero_new.jpg" alt="Francesca Grandi" fetchpriority="high"')
        html = html.replace('src="../francesca_hero_new.jpg" alt="Francesca Grandi"', 'src="../francesca_hero_new.jpg" alt="Francesca Grandi" fetchpriority="high"')
        
        # Also remove fade-in from hero headers if applied
        # In index.html: <h1 class="fade-in"> -> <h1 class="hero-title"> (if we want, but let's just leave it or remove it)
        # Actually, if the hero section is visible, let's leave the inner fade-in, but since the observer only runs on scroll, 
        # wait! IntersectionObserver runs on page load for elements in viewport. But on mobile, JS can be delayed.
        # It's better to remove fade-in from the hero's internal elements too to make them instant.
        
        # Let's just run a regex to remove 'fade-in' from the first 2000 characters of the body where the hero is.
        # Or specifically, let's find the hero section and remove fade-in from it.
        # Actually, let's inject a script at the top of the body that instantly reveals elements in the viewport if JS is slow,
        # but that doesn't solve JS loading delay.
        # Let's just add this CSS block in <head> to prevent CLS and show hero instantly:
        
        # Wait, the easiest is to remove fade-in from elements inside <section id="home">.
        # I'll just do it manually for known hero elements.
        html = html.replace('<h1 class="title-large fade-in"', '<h1 class="title-large"')
        html = html.replace('<h2 style="color: var(--color-gold-main); font-size: 1.2rem; font-weight: 500; margin-bottom: 1.5rem; letter-spacing: 1px; text-transform: uppercase;" class="fade-in">', '<h2 style="color: var(--color-gold-main); font-size: 1.2rem; font-weight: 500; margin-bottom: 1.5rem; letter-spacing: 1px; text-transform: uppercase;">')

        with open(file, 'w') as f:
            f.write(html)
            
    except Exception as e:
        print(f"Error processing {file}: {e}")

