(function () {
    var form = document.getElementById('budget-form');
    var msg = document.getElementById('msg');
    var btn = document.getElementById('go');
    var options = document.getElementById('options');
    var err = document.getElementById('err-budget');
    // Link di prenotazione esistente (invariato)
    var CALENDLY = 'https://calendly.com/francescagrandi/call-1-1-30-minuti';
    var ALT_PAGE = 'consulenza-alternativa.html';

    // senza i passi 1, 2 e 3 non si può proseguire
    var data;
    try { data = JSON.parse(sessionStorage.getItem('consulenza') || 'null'); } catch (e) { data = null; }
    if (!data || !data.nome || !data.cognome || !data.email || !data.telefono) { window.location.replace('consulenza.html'); return; }
    if (!data.obiettivo) { window.location.replace('consulenza-2.html'); return; }
    if (!data.esperienza) { window.location.replace('consulenza-3.html'); return; }

    function show(t) { msg.textContent = t; msg.hidden = false; }
    function save() { sessionStorage.setItem('consulenza', JSON.stringify(data)); }

    var radios = form.querySelectorAll('input[name="budget"]');
    radios.forEach(function (r) {
        if (data.budget === r.value) r.checked = true;
        r.addEventListener('change', function () { options.classList.remove('bad'); err.textContent = ''; });
    });

    function go(flow) {
        if (flow === 'alt') {
            window.location.href = ALT_PAGE;
        } else {
            var q = '?name=' + encodeURIComponent(data.nome + ' ' + data.cognome) + '&email=' + encodeURIComponent(data.email);
            window.location.href = CALENDLY + q;
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.hidden = true;
        var chosen = form.querySelector('input[name="budget"]:checked');
        if (!chosen) {
            options.classList.add('bad');
            err.textContent = 'Seleziona una risposta.';
            show('Rispondi alla domanda per proseguire.');
            radios[0].focus();
            return;
        }
        var flow = chosen.getAttribute('data-flow');

        // stessa risposta già inviata (es. refresh o ritorno indietro): nessun nuovo invio
        if (data.sentBudget === chosen.value) { data.budget = chosen.value; save(); go(flow); return; }

        // limite anti-spam solo al primo invio della sessione
        if (!data.sentBudget) {
            var last = parseInt(localStorage.getItem('lastConsulenzaSubmit') || '0', 10);
            if (Date.now() - last < 60000) { show('Hai già inviato una richiesta da poco. Riprova tra un minuto.'); return; }
        }

        var base = Object.fromEntries(new FormData(form));
        delete base.budget;
        var payload = Object.assign({}, base, {
            nome: data.nome, cognome: data.cognome, email: data.email, telefono: data.telefono,
            obiettivo: data.obiettivo,
            esperienza: data.esperienza,
            dettagli_esperienza: data.dettagli_esperienza || '—',
            disponibilita_investimento: chosen.value
        });
        if (data.sentBudget) payload.subject = 'AGGIORNAMENTO risposta - consulenza gratuita';

        var label = btn.innerHTML;
        btn.disabled = true;
        btn.textContent = 'INVIO IN CORSO...';

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function (r) { return r.json().then(function (j) { return r.status === 200 && j.success === true; }); })
        .then(function (ok) {
            if (!ok) throw new Error('send');
            localStorage.setItem('lastConsulenzaSubmit', String(Date.now()));
            data.budget = chosen.value;
            data.sentBudget = chosen.value;
            save();
            go(flow);
        })
        .catch(function () {
            show('Si è verificato un problema durante l\'invio. Riprova tra qualche momento.');
            btn.disabled = false;
            btn.innerHTML = label;
        });
    });
})();
