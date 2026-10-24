document.addEventListener('DOMContentLoaded', () => {
            const mrOpenBtn = document.getElementById('open-mr-btn');
            const mrModal = document.getElementById('mental-reset-modal');
            const mrCloseBtn = document.getElementById('close-mental-reset-btn');
            const mrForm = document.getElementById('mental-reset-form');
            const mrSuccessBox = document.getElementById('mr-success-box');
            const mrSuccessCloseBtn = document.getElementById('mr-success-close-btn');

            function openMrModal() {
                if (mrModal) {
                    mrModal.classList.add('active');
                    mrModal.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                }
            }

            function closeMrModal() {
                if (mrModal) {
                    mrModal.classList.remove('active');
                    mrModal.setAttribute('aria-hidden', 'true');
                    document.body.style.overflow = '';
                }
            }

            if (mrOpenBtn) {
                mrOpenBtn.addEventListener('click', openMrModal);
            }

            if (mrCloseBtn) {
                mrCloseBtn.addEventListener('click', closeMrModal);
            }

            if (mrSuccessCloseBtn) {
                mrSuccessCloseBtn.addEventListener('click', closeMrModal);
            }

            if (mrModal) {
                mrModal.addEventListener('click', (e) => {
                    if (e.target === mrModal) {
                        closeMrModal();
                    }
                });
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && mrModal.classList.contains('active')) {
                        closeMrModal();
                    }
                });
            }

            if (mrForm) {
                mrForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    if (!mrForm.checkValidity()) {
                        mrForm.reportValidity();
                        return;
                    }

                    const submitBtn = document.getElementById('mr-submit-btn');
                    const originalText = submitBtn ? submitBtn.innerText : 'ISCRIVITI ALLA NEWSLETTER';
                    if (submitBtn) {
                        submitBtn.innerText = 'ISCRIZIONE IN CORSO...';
                        submitBtn.disabled = true;
                    }

                    const formData = new FormData(mrForm);
                    const object = Object.fromEntries(formData);
                    const json = JSON.stringify(object);

                    fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: json
                    })
                    .then(async (response) => {
                        const resJson = await response.json();
                        if (response.status === 200 && resJson.success === true) {
                            mrForm.style.display = 'none';
                            if (mrSuccessBox) {
                                mrSuccessBox.style.display = 'block';
                            }
                        } else {
                            alert('Si è verificato un errore durante l\'iscrizione. Riprova tra qualche momento.');
                            if (submitBtn) {
                                submitBtn.innerText = originalText;
                                submitBtn.disabled = false;
                            }
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        alert('Si è verificato un problema di connessione. Riprova tra qualche momento.');
                        if (submitBtn) {
                            submitBtn.innerText = originalText;
                            submitBtn.disabled = false;
                        }
                    });
                });
            }
        });
