
const admin = require("firebase-admin");

async function main() {
  const secret = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!secret) {
    throw new Error("找不到 FIREBASE_SERVICE_ACCOUNT Secret");
  }

  const serviceAccount = JSON.parse(secret);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      "https://lwopendata-default-rtdb.asia-southeast1.firebasedatabase.app/"
  });

  console.log("Firebase Admin SDK 初始化成功");
  console.log("Firebase 專案：", admin.app().options.projectId);

  // 唯讀測試，不修改任何首領資料
  await admin.database().ref("config/bosses").once("value");

  console.log("Realtime Database 連線成功");
  console.log("FCM 後端環境準備完成，尚未發送通知");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("測試失敗：", error.message);
    process.exit(1);
  });
