(function () {
    // Questa schermata è raggiungibile solo scegliendo "Al momento non ho questa disponibilità economica."
    var data;
    try { data = JSON.parse(sessionStorage.getItem('consulenza') || 'null'); } catch (e) { data = null; }
    if (!data || !data.nome || !data.email || !data.telefono) { window.location.replace('consulenza.html'); return; }
    if (!data.obiettivo) { window.location.replace('consulenza-2.html'); return; }
    if (!data.esperienza) { window.location.replace('consulenza-3.html'); return; }
    if (data.budget !== 'Al momento non ho questa disponibilità economica.') { window.location.replace('consulenza-4.html'); return; }
})();
