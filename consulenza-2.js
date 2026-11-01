(function () {
    var form = document.getElementById('obiettivo-form');
    var msg = document.getElementById('msg');
    var area = form.elements.obiettivo;

    // senza i dati del passo 1 non si può proseguire
    var data;
    try { data = JSON.parse(sessionStorage.getItem('consulenza') || 'null'); } catch (e) { data = null; }
    if (!data || !data.nome || !data.cognome || !data.email || !data.telefono) {
        window.location.replace('consulenza.html');
        return;
    }
    if (data.obiettivo) area.value = data.obiettivo;

    var field = area.closest('.field');
    var err = document.createElement('p');
    err.className = 'err';
    err.id = 'err-obiettivo';
    field.appendChild(err);
    area.setAttribute('aria-describedby', err.id);
    area.addEventListener('input', function () { field.classList.remove('bad'); });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        msg.hidden = true;
        var v = area.value.trim();
        if (v.length < 10) {
            field.classList.add('bad');
            err.textContent = v ? 'Descrivi il tuo obiettivo in almeno 10 caratteri.' : 'Campo obbligatorio.';
            msg.textContent = 'Rispondi alla domanda per proseguire.';
            msg.hidden = false;
            area.focus();
            return;
        }
        data.obiettivo = v;
        sessionStorage.setItem('consulenza', JSON.stringify(data));
        window.location.href = 'consulenza-3.html';
    });
})();
