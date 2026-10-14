'use strict';
// Lineage W boss reminders — Firebase Admin / GitHub Actions, Asia/Taipei.
const admin = require('firebase-admin');
const DB_URL = 'https://lwopendata-default-rtdb.asia-southeast1.firebasedatabase.app/';
const SITE_URL = 'https://borishyc.github.io/lineage-w/';
const TZ = 'Asia/Taipei';
const MAX_LATE_MS = 10 * 60 * 1000; // Grace period after desired reminder time.
const MAX_MESSAGES = 2000;
const now = Date.now();
const pad = n => String(n).padStart(2, '0');
const fmt = ms => new Intl.DateTimeFormat('zh-TW', {timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(new Date(ms));
const parts = ms => Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone: TZ, year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(new Date(ms)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const weekday = {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
const dateKey = p => `${p.year}-${p.month}-${p.day}`;
const digest = x => require('crypto').createHash('sha256').update(x).digest('hex').slice(0,32);
const validMinutes = x => Number.isInteger(Number(x)) && Number(x)>=0 && Number(x)<=1440;
const validToken = x => typeof x==='string' && x.length>20;
function fixedOccurrences(schedules) {
  const result=[];
  // Check today and tomorrow; tomorrow matters for up-to-24h reminders.
  for (let d=0;d<=1;d++) {
    const dayMs=now+d*86400000;
    const p=parts(dayMs);
    const wd=weekday[p.weekday];
    for (const [id,s] of Object.entries(schedules||{})) {
      if (!s || s.enabled===false || Number(s.weekday)!==wd || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(s.time))) continue;
      const [h,m]=s.time.split(':').map(Number);
      // Taiwan does not observe DST: UTC+8.
      const target=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),h-8,m);
      if (target<=now) continue;
      result.push({id:`fixed:${id}:${dateKey(p)}:${s.time}`, name:String(s.bossName||'固定首領'),target,kind:'fixed'});
    }
  }
  return result;
}
function fieldOccurrences(bosses,states) {
  const result=[];
  for (const [id,s] of Object.entries(states||{})) {
    const b=bosses?.[id];
    if (!b || b.enabled===false || !s) continue;
    const target=Number(s.respawnAt);
    if (!Number.isFinite(target) || target<=now || target>now+48*3600000) continue;
    result.push({id:`field:${id}:${target}`,name:String(b.name||id),target,kind:'field'});
  }
  return result;
}
async function main() {
  const json=process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT secret');
  admin.initializeApp({credential:admin.credential.cert(JSON.parse(json)),databaseURL:DB_URL});
  const db=admin.database();
  const [bSnap,sSnap,fSnap,uSnap]=await Promise.all([
    db.ref('config/bosses').once('value'),db.ref('bossStates').once('value'),
    db.ref('config/fixedSchedules').once('value'),db.ref('pushSubscriptions').once('value')
  ]);
  const occurrences=[...fieldOccurrences(bSnap.val()||{},sSnap.val()||{}),...fixedOccurrences(fSnap.val()||{})];
  const subs=uSnap.val()||{};
  let candidates=0,sent=0,skipped=0,failed=0;
  const testUid=process.env.TEST_FCM_UID||'';
  const testSub=subs[testUid];
  console.log(JSON.stringify({diagnostic:'subscription-check',totalSubscriptions:Object.keys(subs).length,testUidConfigured:!!testUid,testUidFound:!!testSub,testUidEnabled:testSub?.enabled===true,testUidHasToken:validToken(testSub?.token),testUidMinutes:testSub?.reminderMinutes??null,occurrences:occurrences.length}));
  const perDevice={};
  let testDeviceDetail=null;
  for (const [uid,sub] of Object.entries(subs)) {
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(uid) || sub?.enabled!==true || !validToken(sub.token) || !validMinutes(sub.reminderMinutes)) continue;
    const advance=Number(sub.reminderMinutes);
    const isTestDevice=uid===testUid;
    const stats={candidates:0,sent:0,skipped:0,failed:0};
    perDevice[digest(uid).slice(0,8)+(isTestDevice?'-TEST':'')] = stats;
    const reasons={tooEarly:0,spawnPassed:0,over10MinutesLate:0,inWindow:0};
    const upcoming=[];
    if(isTestDevice) testDeviceDetail={advanceMinutes:advance,reasons,upcoming};
    for (const boss of occurrences) {
      const desired=boss.target-advance*60000;
      // Don't send before desired time; allow late checks, but never after spawn.
      if (isTestDevice) {
        const minutesUntilSpawn=Math.round((boss.target-now)/60000);
        const minutesUntilReminder=Math.round((desired-now)/60000);
        const reason=now<desired?'tooEarly':now>=boss.target?'spawnPassed':now-desired>MAX_LATE_MS?'over10MinutesLate':'inWindow';
        reasons[reason]++;
        if (upcoming.length<8 && (reason==='inWindow'||minutesUntilSpawn<=120)) upcoming.push({boss:boss.name,kind:boss.kind,spawnTime:fmt(boss.target),minutesUntilSpawn,minutesUntilReminder,reason});
      }
      if (now<desired || now>=boss.target || now-desired>MAX_LATE_MS) continue;
      candidates++;stats.candidates++;
      if (candidates>MAX_MESSAGES) throw new Error(`Safety cap exceeded (${MAX_MESSAGES})`);
      const ref=db.ref(`notificationDedupe/${uid}/${digest(boss.id)}`);
      const reservation=now;
      const tx=await ref.transaction(old=>{
        if (old?.status==='sent') return;
        if (old?.status==='sending' && Number(old.reservedAt)>now-10*60000) return;
        return {status:'sending',reservedAt:reservation,occurrence:boss.id,expiresAt:boss.target};
      },undefined,false);
      if (!tx.committed){skipped++;stats.skipped++;continue;}
      const remain=Math.max(1,Math.ceil((boss.target-now)/60000));
      const title='天堂W 首領即將重生';
      const body=`${boss.name}｜${fmt(boss.target)} 重生，約剩 ${remain} 分鐘（設定提前 ${advance} 分鐘）`;
      try {
        await admin.messaging().send({token:sub.token,data:{title,body,tag:`lw-${digest(boss.id)}`,url:SITE_URL},webpush:{headers:{Urgency:'high',TTL:'300'}}});
        await ref.set({status:'sent',sentAt:admin.database.ServerValue.TIMESTAMP,occurrence:boss.id,expiresAt:boss.target});
        sent++;stats.sent++;
        console.log(`Sent ${boss.kind} ${boss.name} -> ${uid.slice(0,5)}***${isTestDevice?' [TEST_FCM_UID]':''} (${fmt(boss.target)})`);
      } catch (e) {
        failed++;stats.failed++;
        console.error(`Send failed (${boss.name}): ${e.code||e.message}`);
        // Release only our own reservation; don't erase another run's status.
        await ref.transaction(old=>old?.status==='sending'&&old.reservedAt===reservation?null:undefined,undefined,false);
        if (['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(e.code)) {
          await db.ref(`pushSubscriptions/${uid}/enabled`).set(false);
          break;
        }
      }
    }
  }
  console.log(JSON.stringify({at:new Date(now).toISOString(),occurrences:occurrences.length,candidates,sent,skipped,failed,perDevice,testDeviceDetail}));
  if (failed) process.exitCode=1;
}
main().catch(e=>{console.error('Boss notify failed:',e);process.exitCode=1;}).finally(async()=>{await Promise.all(admin.apps.map(app=>app.delete()));});
