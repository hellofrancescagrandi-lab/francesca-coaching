import re

with open('script.js', 'r') as f:
    js = f.read()

# I will inject a rate limiting check inside the form submit listener.
# Looking for: form.addEventListener('submit', function(e) {

rate_limit_code = """
        // --- SECURITY HARDENING: Rate Limiting ---
        const lastSubmit = localStorage.getItem('lastFormSubmit');
        const now = Date.now();
        if (lastSubmit && now - parseInt(lastSubmit) < 60000) { // 60 seconds cooldown
            e.preventDefault();
            formMessage.innerHTML = 'Stai inviando troppe richieste. Riprova tra un minuto.';
            formMessage.className = 'form-message error';
            formMessage.style.display = 'block';
            return;
        }
        localStorage.setItem('lastFormSubmit', now.toString());
        // -----------------------------------------
"""

if "localStorage.getItem('lastFormSubmit')" not in js:
    # find the line: e.preventDefault(); inside form submit
    insert_pos = js.find('e.preventDefault();')
    if insert_pos != -1:
        # insert right after e.preventDefault();
        js = js[:insert_pos+19] + rate_limit_code + js[insert_pos+19:]
        with open('script.js', 'w') as f:
            f.write(js)
