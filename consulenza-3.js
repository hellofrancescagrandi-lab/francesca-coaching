(function () {
    var form = document.getElementById('esperienza-form');
    var msg = document.getElementById('msg');
    var wrap = document.getElementById('dettagli-wrap');
    var area = document.getElementById('dettagli');
    var errExp = document.getElementById('err-esperienza');
    var errDet = document.getElementById('err-dettagli');
    var options = document.getElementById('options');

    // senza i passi 1 e 2 non si può proseguire
    var data;
    try { data = JSON.parse(sessionStorage.getItem('consulenza') || 'null'); } catch (e) { data = null; }
    if (!data || !data.nome || !data.cognome || !data.email || !data.telefono) {
        window.location.replace('consulenza.html');
        return;
    }
    if (!data.obiettivo) {
        window.location.replace('consulenza-2.html');
        return;
    }

    function isYes() { var c = form.querySelector('input[name="esperienza"]:checked'); return c && c.value.indexOf('Sì') === 0; }
    function sync() {
        var yes = isYes();
        wrap.hidden = !yes;
        area.required = yes;
        if (!yes) { area.value = ''; wrap.classList.remove('bad'); }
        options.classList.remove('bad');
        errExp.textContent = '';
    }
    form.querySelectorAll('input[name="esperienza"]').forEach(function (r) { r.addEventListener('change', function () { sync(); if (isYes()) area.focus(); }); });
    area.addEventListener('input', function () { wrap.classList.remove('bad'); });

    // ripopola se si torna indietro
    if (data.esperienza) {
        var r = Array.prototype.find.call(form.querySelectorAll('input[name="esperienza"]'), function (x) { return x.value === data.esperienza; });
        if (r) { r.checked = true; sync(); area.value = data.dettagli_esperienza || ''; }
    }

    function show(t) { msg.textContent = t; msg.hidden = false; }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.hidden = true;
        var chosen = form.querySelector('input[name="esperienza"]:checked');
        if (!chosen) {
            options.classList.add('bad');
            errExp.textContent = 'Seleziona una risposta.';
            show('Rispondi alla domanda per proseguire.');
            form.querySelector('input[name="esperienza"]').focus();
            return;
        }
        var details = area.value.trim();
        if (isYes() && details.length < 10) {
            wrap.classList.add('bad');
            errDet.textContent = details ? 'Racconta qualcosa in più (almeno 10 caratteri).' : 'Campo obbligatorio.';
            show('Racconta la tua esperienza per proseguire.');
            area.focus();
            return;
        }

        data.esperienza = chosen.value;
        data.dettagli_esperienza = isYes() ? details : '—';
        sessionStorage.setItem('consulenza', JSON.stringify(data));
        window.location.href = 'consulenza-4.html';
    });
})();
