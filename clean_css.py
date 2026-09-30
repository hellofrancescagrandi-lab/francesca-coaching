with open('style.css', 'r') as f:
    css = f.read()

import re
css = re.sub(r'/\* Floating Google Profile Button \*/.*?#floating-google-btn \{.*?\}\s*\}', '', css, flags=re.DOTALL)
# The regex might miss the @media block if not matched carefully. Let's just do a rough split.
if '/* Floating Google Profile Button */' in css:
    css = css.split('/* Floating Google Profile Button */')[0]

with open('style.css', 'w') as f:
    f.write(css)
