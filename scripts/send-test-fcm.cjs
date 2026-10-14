const admin=require('firebase-admin');
async function main(){
  const serviceAccount=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT||'null');
  const uid=process.env.TEST_FCM_UID;
  if(!serviceAccount||!uid||!/^[A-Za-z0-9_-]{8,128}$/.test(uid))throw Error('請設定 FIREBASE_SERVICE_ACCOUNT 和有效的 TEST_FCM_UID');
  admin.initializeApp({credential:admin.credential.cert(serviceAccount),databaseURL:'https://lwopendata-default-rtdb.asia-southeast1.firebasedatabase.app/'});
  const snap=await admin.database().ref('pushSubscriptions/'+uid).once('value');
  const entry=snap.val();
  if(!entry?.token||entry.enabled!==true)throw Error('找不到已啟用的測試手機 FCM Token');
  const result=await admin.messaging().send({token:entry.token,data:{title:'天堂W FCM 背景推播測試',body:'這是 GitHub Actions 發出的真正背景通知',tag:'lw-fcm-single-test',url:'https://borishyc.github.io/lineage-w/'},webpush:{headers:{Urgency:'high',TTL:'300'}}});
  console.log('已送出單機 FCM 測試，訊息 ID：'+result);
}
main()
  .catch(e => {
    console.error('FCM 測試失敗：' + e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.all(
      admin.apps.map(app => app.delete())
    );
  });

