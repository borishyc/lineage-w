/* V20 RC3: presentation only; never grants group access or writes Firebase. */
(function(){
 const team=/boss-beta|team-b|[?&]team=B/i.test(location.pathname+location.search)?'B':'A';
 const colors=new Set(['red','orange','gold','green','teal','ice','blue','purple','pink','silver']);
 const fallback=team==='A'?'red':'green';
 const publicApi='https://lineage-w-admin-test.boris-shi.workers.dev/api/public/icon';
 const base=new URL('icons/glow/',document.currentScript?.src||location.href).href;
 async function apply(){
   let color=fallback;
   try{let r=await fetch(publicApi,{cache:'no-store'});
     if(r.ok){let v=await r.json();if(colors.has(v[team]))color=v[team];}
   }catch(e){console.warn('Icon setting unavailable; defaulting to original color')}
   let href=base+'bell-'+color+'.png';
   let fav=document.querySelector('link[rel="icon"]');if(!fav){fav=document.createElement('link');fav.rel='icon';document.head.appendChild(fav)}fav.href=href;
   let el=document.getElementById('team-bell-icon');if(el)el.src=href;
 }
 apply();
})();
