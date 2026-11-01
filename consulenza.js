(function () {
    var form = document.getElementById('consulenza-form');
    var msg = document.getElementById('msg');
    function show(t) { msg.textContent = t; msg.hidden = false; }

    // se la persona torna indietro, ripopola i campi
    try {
        var saved = JSON.parse(sessionStorage.getItem('consulenza') || '{}');
        ['nome', 'cognome', 'email', 'telefono'].forEach(function (k) {
            if (saved[k] && form.elements[k]) form.elements[k].value = saved[k];
        });
    } catch (e) {}

    var RULES = {
        nome:     { test: function (v) { return v.length >= 2; }, err: 'Inserisci il tuo nome.' },
        cognome:  { test: function (v) { return v.length >= 2; }, err: 'Inserisci il tuo cognome.' },
        email:    { test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }, err: 'Inserisci un\'email valida.' },
        telefono: { test: function (v) { return /^[0-9+()\s.\-]{6,25}$/.test(v) && v.replace(/\D/g, '').length >= 6; }, err: 'Inserisci un numero di cellulare valido.' }
    };
    var KEYS = Object.keys(RULES);

    // messaggio di errore sotto ogni campo
    KEYS.forEach(function (k) {
        var p = document.createElement('p');
        p.className = 'err';
        p.id = 'err-' + k;
        form.elements[k].closest('.field').appendChild(p);
        form.elements[k].setAttribute('aria-describedby', p.id);
        form.elements[k].addEventListener('input', function () { form.elements[k].closest('.field').classList.remove('bad'); });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.hidden = true;
        var firstBad = null;
        KEYS.forEach(function (k) {
            var el = form.elements[k], field = el.closest('.field');
            var ok = RULES[k].test(el.value.trim());
            field.classList.toggle('bad', !ok);
            document.getElementById('err-' + k).textContent = ok ? '' : (el.value.trim() ? RULES[k].err : 'Campo obbligatorio.');
            if (!ok && !firstBad) firstBad = el;
        });
        var priv = form.elements.privacy;
        if (!priv.checked && !firstBad) firstBad = priv;
        if (firstBad) {
            show(firstBad === priv ? 'Per proseguire devi accettare la privacy policy.' : 'Compila correttamente tutti i campi per proseguire.');
            firstBad.focus();
            return;
        }

        var data = {};
        KEYS.forEach(function (k) { data[k] = form.elements[k].value.trim(); });
        sessionStorage.setItem('consulenza', JSON.stringify(data));
        window.location.href = 'consulenza-2.html';
    });
})();
