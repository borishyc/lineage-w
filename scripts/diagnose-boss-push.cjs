'use strict';
const admin = require('firebase-admin');
async function main() {
  const raw=process.env.FIREBASE_SERVICE_ACCOUNT;
  const uid=process.env.TEST_FCM_UID;
  if (!raw || !uid) throw Error('Missing FIREBASE_SERVICE_ACCOUNT or TEST_FCM_UID');
  admin.initializeApp({credential:admin.credential.cert(JSON.parse(raw)),databaseURL:'https://lwopendata-default-rtdb.asia-southeast1.firebasedatabase.app/'});
  const sub=(await admin.database().ref(`pushSubscriptions/${uid}`).once('value')).val();
  if(!sub?.token || sub.enabled!==true) throw Error('Test phone subscription missing or disabled');
  const id=Date.now().toString();
  const data={title:'天堂W 首領即將重生【診斷】',body:'海賊｜預計 19:30 重生，約剩 5 分鐘（模擬通知）',tag:`lw-diagnostic-${id}`,url:'https://borishyc.github.io/lineage-w/'};
  const result=await admin.messaging().send({token:sub.token,data,webpush:{headers:{Urgency:'high',TTL:'300'}}});
  console.log('Diagnostic boss-format FCM accepted:',result);
  console.log('No boss times or notificationDedupe records were modified.');
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await Promise.all(admin.apps.map(a=>a.delete()))});
