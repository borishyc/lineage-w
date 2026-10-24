/* Six-team icon helper for C-F. Read-only, no auth/Boss writes. */
(()=>{'use strict';
 const colors={C:'purple',D:'blue',E:'gold',F:'teal'};
 const slugToTeam={gamma:'C',delta:'D',epsilon:'E',zeta:'F'};
 const slug=(location.pathname.match(/boss-(gamma|delta|epsilon|zeta)\.html/i)||[])[1]?.toLowerCase();
 const team=slugToTeam[slug]; if(!team)return;
 const all=new Set(['red','orange','gold','green','teal','ice','blue','purple','pink','silver']);
 const endpoint='https://lineage-w-admin-test.boris-shi.workers.dev/api/public/icon';
 const apply=color=>{
  if(!all.has(color))return;
  // Browser tab & web page preview only; installed PWA icons are published static assets.
  const icon=document.querySelector('link[rel="icon"]')||document.createElement('link');
  icon.rel='icon';icon.type='image/png';icon.href='./icons/glow/bell-'+color+'.png';
  if(!icon.isConnected)document.head.appendChild(icon);
  document.querySelectorAll('[data-team-bell-icon]').forEach(el=>{if(el.tagName==='IMG')el.src=icon.href});
 };
 apply(colors[team]);
 fetch(endpoint,{cache:'no-store',mode:'cors'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()})
 .then(data=>{if(all.has(data[team]))apply(data[team])})
 .catch(()=>{/* Admin API may support only A/B until worker is upgraded. */});
})();
