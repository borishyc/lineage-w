(function(){
 'use strict';
 const TEAM=document.body.classList.contains('team-a')?'A':'B';
 const PUSH_URL='https://lineage-w-push-ab-test.boris-shi.workers.dev';
 const preferencesKey='lw-v1910-push-prefs-'+TEAM;
 const storage='lw-v1902-push-url-'+TEAM;
 const $=id=>document.getElementById(id);
 const container=document.querySelector('.boss-tabs');
 if(!container)return;
 const tab=document.createElement('button');tab.type='button';tab.id='bossTabPush';tab.className='boss-tab';tab.textContent='🔔 通知設定';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');
 container.append(tab);
 const panel=document.createElement('div');panel.id='bossPanelPush';panel.className='boss-panel';panel.hidden=true;
 panel.innerHTML=`<h3>手機通知設定</h3><p class="push-note">本隊獨立訂閱。請先完成「連線設定」中的本隊 Key 授權，再設定正式通知提醒。</p>
 <input id="pushWorkerUrl" type="hidden" value="https://lineage-w-push-ab-test.boris-shi.workers.dev">
 <fieldset class="push-fieldset"><legend>出生前提醒</legend><div class="push-choice-grid"><label class="push-choice"><input type="checkbox" name="pushMinutes" value="1"><span>1 分鐘</span></label><label class="push-choice"><input type="checkbox" name="pushMinutes" value="3" checked><span>3 分鐘</span></label><label class="push-choice"><input type="checkbox" name="pushMinutes" value="5" checked><span>5 分鐘</span></label><label class="push-choice"><input type="checkbox" name="pushMinutes" value="10"><span>10 分鐘</span></label></div></fieldset>
 <fieldset class="push-fieldset"><legend>首領類型</legend><div class="push-choice-grid"><label class="push-choice"><input type="checkbox" id="pushField" checked><span>地圖王</span></label><label class="push-choice"><input type="checkbox" id="pushFixed" checked><span>固定王</span></label><label class="push-choice"><input type="checkbox" id="pushSpecial" checked><span>萊茵哈德</span></label></div></fieldset>
 <div class="push-actions"><button type="button" id="pushEnable" class="primary">啟用／更新本隊通知</button><button type="button" id="pushDisable">取消本隊訂閱</button></div>
 <p id="pushDiagnostic" role="status" aria-live="polite">診斷尚未開始。</p><p id="pushStatus" role="status" aria-live="polite">尚未註冊。需 HTTPS、瀏覽器允許通知及支援 FCM。</p>
 <p class="push-note">iPhone 請先將網站加入主畫面，再從主畫面開啟。若 A、B 都要收到通知，需分別到兩隊頁面授權訂閱。</p>`;
 container.parentNode.insertBefore(panel,container.nextSibling);
 const css=document.createElement('style');css.textContent=`#bossPanelPush{padding:14px 4px}
.push-label{display:block;margin:12px 0;font-size:14px}
.push-label input{display:block;width:100%;margin-top:7px;padding:11px;border-radius:8px;background:#111b2b;color:white;border:1px solid #52617a}
#bossPanelPush .push-fieldset{display:block!important;min-width:0;border:1px solid #45516b;border-radius:10px;padding:12px;margin:14px 0}
#bossPanelPush .push-fieldset legend{padding:0 7px;font-size:15px}
#bossPanelPush .push-choice-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:10px;row-gap:10px;width:100%;min-width:0;align-items:center}
#bossPanelPush .push-choice-grid > label.push-choice{display:grid!important;grid-template-columns:20px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;justify-content:start!important;box-sizing:border-box!important;min-width:0!important;max-width:100%!important;min-height:36px!important;padding:4px 2px!important;margin:0!important;font-size:14px!important;font-weight:500!important;line-height:22px!important;white-space:nowrap!important;cursor:pointer}
#bossPanelPush .push-choice-grid > label.push-choice > input[type=checkbox]{box-sizing:border-box!important;appearance:auto!important;-webkit-appearance:checkbox!important;position:static!important;display:block!important;width:20px!important;min-width:20px!important;max-width:20px!important;height:20px!important;min-height:20px!important;max-height:20px!important;flex:none!important;margin:0!important;padding:0!important;border:0!important;vertical-align:middle!important;accent-color:#6aa6f4;transform:none!important}
#bossPanelPush .push-choice-grid > label.push-choice > span{display:block!important;width:auto!important;min-width:0!important;line-height:22px!important;white-space:nowrap!important}
#bossPanelPush .push-choice-grid input[type=checkbox]:focus-visible{outline:2px solid #f0c46c;outline-offset:3px}
@media(max-width:315px){#bossPanelPush .push-choice-grid{grid-template-columns:1fr}}
.push-actions{display:flex;gap:10px;flex-wrap:wrap}
.push-actions button{padding:12px;border-radius:8px;background:#45516b;color:white}
.push-actions .primary{background:#936b31}
.push-note{color:#aeb8c7;font-size:12px;line-height:1.65}
#pushStatus{margin:12px 0;color:#e9bb6c;overflow-wrap:anywhere}`;document.head.append(css);
 $('pushWorkerUrl').value=PUSH_URL;
 try{const pref=JSON.parse(localStorage.getItem(preferencesKey)||'null');if(pref){
  panel.querySelectorAll('input[name="pushMinutes"]').forEach(x=>x.checked=Array.isArray(pref.minutes)&&pref.minutes.includes(Number(x.value)));
  if(pref.kinds){$('pushField').checked=!!pref.kinds.field;$('pushFixed').checked=!!pref.kinds.fixed;$('pushSpecial').checked=!!pref.kinds.special;}
 }}catch{}
 const status=message=>$('pushStatus').textContent=message;
 const diag=message=>$('pushDiagnostic').textContent='['+new Date().toLocaleTimeString('zh-TW',{hour12:false})+'] '+message;
 // Only handle FCM received by this team. Never display cross-team alerts.
 if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{
  if(e.data?.type==='LW_FCM_BACKGROUND'&&e.data.team===TEAM)diag('背景接收程式已處理【'+TEAM+'隊】FCM 訊息');
 });
 let foregroundHooked=false;
 function attachForegroundDiagnostic(){
  if(foregroundHooked||typeof firebase==='undefined'||!firebase.messaging)return;
  try{firebase.messaging().onMessage(payload=>{
   const data=payload?.data||{};
   if(String(data.team||'')!==TEAM)return;
   diag('網頁前景已收到【'+TEAM+'隊】FCM；正在顯示系統通知');
   // Data-only FCM does not create a system notification while this PWA is foregrounded.
   // The background handler in firebase-messaging-sw.js handles background delivery.
   if(Notification.permission!=='granted'){diag('已收到 FCM，但系統通知權限未允許');return;}
   navigator.serviceWorker.getRegistration('./fcm-push/').then(async reg=>{
    if(!reg)reg=await navigator.serviceWorker.register('./firebase-messaging-sw.js',{scope:'./fcm-push/'});
    const title=String(data.title||'【'+TEAM+'隊】天堂W 首領提醒');
    const body=String(data.body||'');
    const tag=String(data.tag||'lw-'+TEAM+'-foreground-'+Date.now());
    const url='./team-'+TEAM.toLowerCase()+'.html';
    await reg.showNotification(title,{body,tag,icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',data:{url}});
    diag('【'+TEAM+'隊】前景 FCM 已交給系統通知中心');
   }).catch(e=>diag('FCM 已收到，但系統顯示失敗：'+e.message));
  });foregroundHooked=true;}catch(e){diag('前景接收診斷不可用：'+e.message)}
 }

 for(const other of container.querySelectorAll('button:not(#bossTabPush)'))other.addEventListener('click',()=>{panel.hidden=true;tab.classList.remove('active');tab.setAttribute('aria-selected','false');});
 tab.addEventListener('click',()=>{container.querySelector('#bossTabConnection')?.click();for(const p of document.querySelectorAll('.boss-manager .boss-panel'))p.hidden=true;container.querySelectorAll('button').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false')});panel.hidden=false;tab.classList.add('active');tab.setAttribute('aria-selected','true')});
 const verify=()=>{
  if(!$('url')||!$('key').value||!/^https:\/\//.test($('url').value.trim()))throw Error('請先在「連線設定」完成本隊 Key 設定');
  const url=PUSH_URL;if(!/^https:\/\/[^/]+/.test(url))throw Error('請輸入有效的 HTTPS 通知 Worker 網址');
  const minutes=[...panel.querySelectorAll('input[name="pushMinutes"]:checked')].map(e=>Number(e.value));if(!minutes.length)throw Error('至少選擇一個提醒分鐘');
  const kinds={field:$('pushField').checked,fixed:$('pushFixed').checked,special:$('pushSpecial').checked};if(!Object.values(kinds).some(Boolean))throw Error('至少選擇一種首領類型');
  localStorage.setItem(storage,url);return{url,minutes,kinds,key:$('key').value};
 };
 function requireSupport(){if(!window.isSecureContext||!('Notification' in window)||!('serviceWorker' in navigator))throw Error('需要 HTTPS 及支援背景通知的瀏覽器；iPhone 請用已加入主畫面的 PWA');if(typeof firebase==='undefined'||!firebase.messaging)throw Error('FCM 函式庫尚未載入，請檢查網路連線');}
 async function getToken(){requireSupport();attachForegroundDiagnostic();if(!(await firebase.messaging.isSupported()))throw Error('此裝置不支援 Firebase Messaging');
  const registration=await navigator.serviceWorker.register('./firebase-messaging-sw.js',{scope:'./fcm-push/'});
  const app=firebase.apps.find(a=>a.name==='[DEFAULT]')||firebase.initializeApp({"apiKey":"AIzaSyDBeZoh8YPH1laR9uK3mnbb0jAvBUxqFzQ","authDomain":"lwopendata.firebaseapp.com","projectId":"lwopendata","messagingSenderId":"133221637621","appId":"1:133221637621:web:623bf5e1da065071f194bc"});
  const token=await firebase.messaging(app).getToken({vapidKey:'BDIjrDIPJHapfeR1NXp3pRvXu1txkDn2OX3IlgTc4AzQmvGXP87N3wATHRK5JSbibdKVBLw1JOfiS3w30pgPa_0',serviceWorkerRegistration:registration});if(!token)throw Error('Firebase 未傳回裝置 Token');return token;
 }
 async function send(path,values,token){const r=await fetch(values.url+path,{method:'POST',headers:{'Authorization':'Bearer '+values.key,'Content-Type':'application/json'},body:JSON.stringify({team:TEAM,token,...(path==='/subscribe'?{minutes:values.minutes,kinds:values.kinds}:{})})});const j=await r.json().catch(()=>({}));if(!r.ok||!j.success)throw Error('通知 API：'+(j.error||'HTTP '+r.status));return j;}
 let busy=false;
 async function act(disable){if(busy)return;busy=true;$('pushEnable').disabled=$('pushDisable').disabled=true;try{
  const values=verify();requireSupport();
  if(!disable){const p=await Notification.requestPermission();if(p!=='granted')throw Error('通知權限未允許');}
  else if(Notification.permission!=='granted')throw Error('此裝置尚未取得通知權限，無法取得舊 Token；請先啟用通知後再取消');
  status('正在連線 Firebase 並更新本隊訂閱…');const token=await getToken();await send(disable?'/unsubscribe':'/subscribe',values,token);
  if(!disable)localStorage.setItem(preferencesKey,JSON.stringify({minutes:values.minutes,kinds:values.kinds}));
  status(disable?`已取消 ${TEAM} 隊訂閱；另一隊不受影響`:`${TEAM} 隊訂閱成功！提醒選項已儲存，正式推播設定已更新。`);
 }catch(e){status('操作失敗：'+e.message)}finally{busy=false;$('pushEnable').disabled=$('pushDisable').disabled=false}}
 $('pushEnable').onclick=()=>act(false);$('pushDisable').onclick=()=>act(true);
 
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();