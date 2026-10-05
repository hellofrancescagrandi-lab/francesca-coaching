import re

with open('new-era-academy/index.html', 'r') as f:
    html = f.read()

# Define the new logos block
new_logos = """<div style="margin-top: 1.5rem; display: flex; justify-content: center; align-items: center; gap: 1.2rem; flex-wrap: wrap;">
    <!-- Visa -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="55" height="34" style="background: white; border-radius: 6px; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <path fill="#1434CB" d="M11.66 21.68l2.25-14.28h3.61l-2.25 14.28h-3.61zm18.3-13.98c-1-0.45-2.58-0.89-4.32-0.89-3.52 0-6 1.83-6.03 4.46-0.03 1.94 1.8 3.01 3.17 3.66 1.41 0.67 1.89 1.1 1.89 1.7-0.01 0.92-1.13 1.34-2.18 1.34-1.45 0-2.25-0.22-3.46-0.75l-0.49-0.23-0.51 3.12c0.86 0.38 2.45 0.71 4.12 0.73 3.73 0 6.18-1.79 6.22-4.57 0.02-1.53-0.93-2.69-3.03-3.67-1.25-0.62-2.02-1.04-2.02-1.68 0-0.58 0.66-1.18 2.08-1.18 1.16-0.02 1.99 0.25 2.66 0.53l0.32 0.14 0.54-3.19zm-16.7 8.97c0.05-0.14 0.81-2.11 0.81-2.11s0.13-0.34 0.21-0.53l1.08 4.9h-2.1zm2.34-9.39h-2.78c-0.67 0-1.21 0.38-1.5 0.98l-5.32 12.39h3.8s0.62-1.68 0.76-2.05h4.64c0.11 0.49 0.44 2.05 0.44 2.05h3.35l-3.39-13.37zm14.33 0h-2.91l-3.6 14.28h3.6l3.6-14.28h-0.69z"/>
    </svg>
    <!-- Mastercard -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="55" height="34" style="background: white; border-radius: 6px; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <circle cx="11.5" cy="16" r="9" fill="#EB001B"/>
        <circle cx="20.5" cy="16" r="9" fill="#F79E1B"/>
        <path d="M16 23.95c1.94-1.84 3.14-4.52 3.14-7.95 0-3.43-1.2-6.11-3.14-7.95-1.94 1.84-3.14 4.52-3.14 7.95 0 3.43 1.2 6.11 3.14 7.95z" fill="#FF5F00"/>
    </svg>
    <!-- Apple Pay -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 24" width="70" height="34" style="background: white; border-radius: 6px; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <path d="M7.7 9.8c0-2.3 1.9-3.4 2-3.5-1-1.5-2.7-1.7-3.2-1.8-1.4-0.1-2.8 0.9-3.5 0.9-0.7 0-1.8-0.8-3-0.8-1.5 0-2.9 0.9-3.7 2.3-1.6 2.8-0.4 6.8 1.1 9 0.7 1.1 1.6 2.3 2.8 2.2 1.1-0.1 1.6-0.8 2.9-0.8 1.3 0 1.7 0.8 2.9 0.8 1.2 0 2-1 2.7-2.1 0.8-1.2 1.2-2.4 1.2-2.4s-2.1-0.8-2.1-3.3z" fill="black"/>
        <path d="M6 3c0.6-0.7 1-1.8 0.9-2.8-0.9 0-2.1 0.6-2.7 1.3-0.5 0.6-1 1.7-0.9 2.7 1 0.1 2.1-0.5 2.7-1.2z" fill="black"/>
        <path d="M19.1 5h3.9c1.8 0 3.1 0.4 4 1.3 0.8 0.9 1.3 2.2 1.3 3.8 0 1.6-0.4 2.9-1.3 3.8-0.9 0.9-2.2 1.3-4 1.3h-2v6h-2v-16zm2 8.4h1.7c1.2 0 2.1-0.3 2.7-0.8s0.9-1.3 0.9-2.4-0.3-1.9-0.9-2.4-1.5-0.8-2.7-0.8h-1.7v6.4z" fill="black"/>
        <path d="M33.6 21c-0.4 0-0.8-0.1-1.2-0.3-0.4-0.2-0.7-0.6-0.8-1.1l-0.2-1-1.3 0.1-0.4 0.1c-1.1 0-2-0.4-2.7-1.1s-1-1.6-1-2.7c0-1.2 0.4-2.2 1.3-2.9 0.9-0.8 2.1-1.1 3.5-1.1 0.6 0 1.2 0.1 1.7 0.2 0.4 0.1 0.8 0.3 1.1 0.5V11c0-1.1-0.3-2-0.9-2.5-0.7-0.5-1.6-0.8-2.9-0.8-0.7 0-1.4 0.2-2.1 0.5-0.7 0.3-1.2 0.8-1.5 1.3l-1.3-1.1c0.5-0.8 1.3-1.5 2.3-2 1-0.5 2.2-0.8 3.5-0.8 1.7 0 3 0.4 3.7 1.3s1.1 2.3 1.1 4v6.7c0 1 0.3 1.6 0.7 1.6 0.1 0 0.3 0 0.5-0.2l0.4 1.6c-0.3 0.3-0.7 0.4-1.2 0.5s-0.8 0.1-1.2 0.1zm-3-3.7c0.6 0 1.2-0.1 1.7-0.4s0.8-0.7 0.8-1.2V13c-0.3-0.2-0.6-0.3-1-0.5s-0.9-0.2-1.4-0.2c-0.9 0-1.6 0.2-2.1 0.6-0.5 0.4-0.7 1-0.7 1.7 0 0.7 0.2 1.3 0.7 1.7 0.5 0.4 1.2 0.6 2 0.6z" fill="black"/>
        <path d="M46.7 5.6l-3.2 7.2-3.1-7.2h-2.1l4.3 9.3-1.7 3.5h-2.2l5.9-12.8h2.1z" fill="black"/>
    </svg>
    <!-- Klarna -->
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 34" width="70" height="34" style="background: #FFB3C7; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        <text x="35" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="bold" fill="black" text-anchor="middle">Klarna.</text>
    </svg>
</div>"""

# Replace the old opacity block
html = re.sub(
    r'<div style="margin-top: 1\.5rem; display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap; opacity: 0\.7;">.*?</div>',
    new_logos,
    html,
    flags=re.DOTALL
)

with open('new-era-academy/index.html', 'w') as f:
    f.write(html)
