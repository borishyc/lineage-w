/* RC3.3: read-only, per-team icon presentation. No auth or Boss writes. */
(function () {
  'use strict';
  const src = document.currentScript?.src || location.href;
  const team = /(?:boss-beta|team-b)\.html/i.test(location.pathname) ? 'B' : 'A';
  const allowed = new Set(['red','orange','gold','green','teal','ice','blue','purple','pink','silver']);
  const fallback = team === 'A' ? 'red' : 'green';
  const endpoint = 'https://lineage-w-admin-test.boris-shi.workers.dev/api/public/icon';
  const folder = new URL('./icons/glow/', src);
  let current = null;
  function setImage(color) {
    if (color === current) return;
    current = color;
    const url = new URL('bell-' + color + '.png', folder);
    const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
    link.rel = 'icon'; link.type = 'image/png'; link.href = url.href;
    if (!link.isConnected) document.head.appendChild(link);
    // iOS Safari uses apple-touch-icon when adding a website to the Home Screen.
    // Updating it after the public color API resolves may be honored on fresh installs;
    // iOS may cache or snapshot an earlier value, so this is not guaranteed.
    const apple = document.querySelector('link[rel="apple-touch-icon"]') || document.createElement('link');
    apple.rel = 'apple-touch-icon';
    apple.href = url.href + '?team=' + team + '&color=' + color + '&v=2033';
    if (!apple.isConnected) document.head.appendChild(apple);
    const inline = document.querySelectorAll('[data-team-bell-icon]');
    inline.forEach(el => { if (el instanceof HTMLImageElement) el.src = url.href; });
  }
  async function update() {
    try {
      const response = await fetch(endpoint, {mode:'cors',cache:'no-store'});
      if (!response.ok) throw new Error('icon endpoint: ' + response.status);
      const palette = await response.json();
      setImage(allowed.has(palette[team]) ? palette[team] : fallback);
    } catch (error) {
      console.warn('[RC3.3] cannot read team icon, retain current / fallback', error);
      if (!current) setImage(fallback);
    }
  }
  // Prefer the saved choice over briefly exposing a fallback icon.
  update();
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', () => {if(!document.hidden)update();});
  // Poll only while the web page is open, so admin edits can appear without redeployment.
  setInterval(() => {if(!document.hidden)update();}, 60000);
})();
