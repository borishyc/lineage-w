/* FCM-only service worker; intentionally separate from the existing PWA sw.js. */
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');
firebase.initializeApp({"apiKey": "AIzaSyDBeZoh8YPH1laR9uK3mnbb0jAvBUxqFzQ", "authDomain": "lwopendata.firebaseapp.com", "databaseURL": "https://lwopendata-default-rtdb.asia-southeast1.firebasedatabase.app/", "projectId": "lwopendata", "storageBucket": "lwopendata.firebasestorage.app", "messagingSenderId": "133221637621", "appId": "1:133221637621:web:623bf5e1da065071f194bc"});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const data=payload.data||{};
    title: "",
    body: `${boss.name}｜${fmt(boss.target)}\n距離出現還有 ${remain} 分鐘，請準備！`,
    icon:'../icons/icon-192.png',
    badge:'../icons/icon-192.png',
    tag:data.tag||'lineagew-fcm-test',
    data:{url:data.url||'../'}
  });
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=new URL(event.notification.data?.url||'../',self.registration.scope).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{
    for(const client of windows){if(client.url.startsWith(new URL('../',self.registration.scope).href)){await client.focus();return;}}
    return clients.openWindow(url);
  }));
});
