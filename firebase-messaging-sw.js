/* V19.0.7 Firebase background FCM receiver; no credentials. */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
firebase.initializeApp({"apiKey":"AIzaSyDBeZoh8YPH1laR9uK3mnbb0jAvBUxqFzQ","authDomain":"lwopendata.firebaseapp.com","projectId":"lwopendata","messagingSenderId":"133221637621","appId":"1:133221637621:web:623bf5e1da065071f194bc"});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
 const data=payload.data||{};
 const title=String(data.title||'天堂W 首領提醒');
 const body=String(data.body||'');
 const tag=String(data.tag||'lineage-w-alert');
 const team=String(data.team||'');
 if(team!=='A'&&team!=='B')return;
 const url=team==='A'?'../team-a.html':'../team-b.html';
 self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{for(const client of clients)client.postMessage({type:'LW_FCM_BACKGROUND',team});}).catch(()=>{});
 return self.registration.showNotification(title,{body,tag,icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',data:{url}});
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const dest=new URL(event.notification.data?.url||'./',self.location.href).href;
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async list=>{
  for(const client of list){if(client.url===dest){await client.focus();return;}}
  return clients.openWindow(dest);
 }));
});
