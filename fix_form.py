import re

def update_html(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Access key
    content = re.sub(
        r'<input type="hidden" name="access_key" value="ab894fa2-b613-4630-860a-3ef183ba9eaa">',
        '<input type="hidden" name="access_key" value="eafc21eb-6115-41ca-b86d-e1d693fabb91">',
        content
    )
    
    # Subject
    content = re.sub(
        r'<input type="hidden" name="subject" value="Richiesta Informazioni / Servizi">',
        '<input type="hidden" name="subject" value="Nuova richiesta dal sito Francesca Grandi">',
        content
    )

    # Names
    content = content.replace('name="nome"', 'name="name"')
    content = content.replace('name="cognome"', 'name="surname"')
    content = content.replace('name="servizio"', 'name="service"')
    content = content.replace('name="domanda"', 'name="message"')

    # Ensure botcheck is exactly as requested
    content = re.sub(
        r'<input type="checkbox" name="botcheck" class="hidden" style="display: none;">',
        '<input type="checkbox" name="botcheck" style="display:none">',
        content
    )

    # Add result message div after the form
    result_div = """                </form>
                <div id="form-result-message" style="display: none; padding: 2rem; background-color: rgba(197, 160, 89, 0.1); border: 1px solid var(--color-gold-main); border-radius: 12px; text-align: center; margin-top: 2rem;">
                    <h3 style="color: var(--color-gold-main); font-size: 1.5rem; margin-bottom: 1rem;"></h3>
                    <p style="color: var(--color-white); font-size: 1.1rem; line-height: 1.6;"></p>
                </div>"""
                
    if 'id="form-result-message"' not in content:
        content = content.replace('</form>', result_div)

    with open(file_path, 'w') as f:
        f.write(content)

update_html('index.html')
update_html('chi-sono/index.html')

