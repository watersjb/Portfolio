/* Visit and click tracking (GoatCounter). Pop-up opens and outside links are sent as events.
   A ?ref=name on the link (one per application) is kept for the visit and added to each event. */
(function () {
  var ref = null;
  try {
    var m = location.search.match(/[?&]ref=([^&#]+)/);
    if (m) { ref = decodeURIComponent(m[1]); sessionStorage.setItem('jw-ref', ref); }
    else { ref = sessionStorage.getItem('jw-ref'); }
  } catch (e) {}
  function send(path, title) {
    var full = path + (ref ? ' · ' + ref : '');
    var tries = 0;
    (function go() {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: full, title: title || path, event: true });
      } else if (tries++ < 10) { setTimeout(go, 500); }
    })();
  }
  window.jwTrack = send;
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (!/^https?:/i.test(h)) return;
    var host = (a.hostname || '').replace(/^www\./, '');
    send('link: ' + host, (a.textContent || '').trim().slice(0, 80) + ' → ' + h);
  }, true);
})();
