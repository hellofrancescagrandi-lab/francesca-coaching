import re

with open('script.js', 'r') as f:
    content = f.read()

# I will rewrite the handleWeb3Form function entirely to match requirements.
new_handler = """
    // 6. Web3Forms AJAX Submission Logic
    function handleWeb3Form(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic validation check
            if(!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = new FormData(form);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'INVIO IN CORSO...';
            btn.disabled = true;

            const resultDiv = form.nextElementSibling && form.nextElementSibling.id === 'form-result-message' 
                              ? form.nextElementSibling 
                              : document.getElementById('form-result-message');

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let resJson = await response.json();
                if (response.status == 200 && resJson.success === true) {
                    form.style.display = 'none';
                    if (resultDiv) {
                        resultDiv.style.display = 'block';
                        resultDiv.style.borderColor = 'var(--color-gold-main)';
                        resultDiv.querySelector('h3').innerText = 'Inviato!';
                        resultDiv.querySelector('h3').style.color = 'var(--color-gold-main)';
                        resultDiv.querySelector('p').innerText = 'Grazie! La tua richiesta è stata inviata correttamente. Ti risponderò il prima possibile.';
                    } else {
                        alert('Grazie! La tua richiesta è stata inviata correttamente. Ti risponderò il prima possibile.');
                    }
                } else {
                    console.log(response);
                    if (resultDiv) {
                        resultDiv.style.display = 'block';
                        resultDiv.style.borderColor = '#FF1678';
                        resultDiv.querySelector('h3').innerText = 'Errore';
                        resultDiv.querySelector('h3').style.color = '#FF1678';
                        resultDiv.querySelector('p').innerText = 'Si è verificato un problema durante l\'invio. Riprova tra qualche momento.';
                    } else {
                        alert('Si è verificato un problema durante l\'invio. Riprova tra qualche momento.');
                    }
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            })
            .catch(error => {
                console.log(error);
                if (resultDiv) {
                    resultDiv.style.display = 'block';
                    resultDiv.style.borderColor = '#FF1678';
                    resultDiv.querySelector('h3').innerText = 'Errore di connessione';
                    resultDiv.querySelector('h3').style.color = '#FF1678';
                    resultDiv.querySelector('p').innerText = 'Si è verificato un problema durante l\'invio. Riprova tra qualche momento.';
                } else {
                    alert('Si è verificato un problema durante l\'invio. Riprova tra qualche momento.');
                }
                btn.innerHTML = originalText;
                btn.disabled = false;
            });
        });
    }

    handleWeb3Form('individual-form');
"""

# Find the start of 6. Web3Forms AJAX Submission Logic and replace everything till the end of the file except the very last '});'
pattern = r'// 6\. Web3Forms AJAX Submission Logic.*'

content = re.sub(pattern, new_handler + '\n});', content, flags=re.DOTALL)

with open('script.js', 'w') as f:
    f.write(content)

