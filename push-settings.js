(function(){
 'use strict';
 const TEAM=document.body.classList.contains('team-a')?'A':'B';
 const storage='lw-v1902-push-url-'+TEAM;
 const $=id=>document.getElementById(id);
 const container=document.querySelector('.boss-tabs');
 if(!container)return;
 const tab=document.createElement('button');tab.type='button';tab.id='bossTabPush';tab.className='boss-tab';tab.textContent='🔔 通知設定';tab.setAttribute('role','tab');tab.setAttribute('aria-selected','false');
 container.append(tab);
 const panel=document.createElement('div');panel.id='bossPanelPush';panel.className='boss-panel';panel.hidden=true;
 panel.innerHTML=`<h3>${TEAM} 隊｜手機通知設定</h3><p class="push-note">本隊獨立訂閱。此測試版本僅註冊手機，不會自動發送通知。請先完成「連線設定」中的本隊 Key 授權。</p>
 <label class="push-label">通知 Worker 網址<input id="pushWorkerUrl" type="url" placeholder="https://你的通知Worker.workers.dev" autocomplete="off"></label>
 <fieldset class="push-fieldset"><legend>出生前提醒</legend><label><input type="checkbox" name="pushMinutes" value="1"> 1 分鐘</label><label><input type="checkbox" name="pushMinutes" value="3" checked> 3 分鐘</label><label><input type="checkbox" name="pushMinutes" value="5" checked> 5 分鐘</label><label><input type="checkbox" name="pushMinutes" value="10"> 10 分鐘</label></fieldset>
 <fieldset class="push-fieldset"><legend>首領類型</legend><label><input type="checkbox" id="pushField" checked> 地圖王</label><label><input type="checkbox" id="pushFixed" checked> 固定王</label><label><input type="checkbox" id="pushSpecial" checked> 萊茵哈德</label></fieldset>
 <div class="push-actions"><button type="button" id="pushEnable" class="primary">啟用／更新本隊通知</button><button type="button" id="pushDisable">取消本隊訂閱</button></div>
 <p id="pushStatus" role="status" aria-live="polite">尚未註冊。需 HTTPS、瀏覽器允許通知及支援 FCM。</p>
 <p class="push-note">iPhone 請先將網站加入主畫面，再從主畫面開啟。若 A、B 都要收到通知，需分別到兩隊頁面授權訂閱。</p>`;
 container.parentNode.insertBefore(panel,container.nextSibling);
 const css=document.createElement('style');css.textContent=`#bossPanelPush{padding:14px 4px}.push-label{display:block;margin:12px 0;font-size:14px}.push-label input{display:block;width:100%;margin-top:7px;padding:11px;border-radius:8px;background:#111b2b;color:white;border:1px solid #52617a}.push-fieldset{border:1px solid #45516b;border-radius:10px;padding:10px;margin:12px 0}.push-fieldset label{display:inline-flex;gap:5px;align-items:center;margin:8px 12px 8px 0;font-size:13px}.push-actions{display:flex;gap:10px;flex-wrap:wrap}.push-actions button{padding:12px;border-radius:8px;background:#45516b;color:white}.push-actions .primary{background:#936b31}.push-note{color:#aeb8c7;font-size:12px;line-height:1.65}#pushStatus{margin:12px 0;color:#e9bb6c;overflow-wrap:anywhere}`;document.head.append(css);
 $('pushWorkerUrl').value=localStorage.getItem(storage)||'';
 const status=message=>$('pushStatus').textContent=message;
 for(const other of container.querySelectorAll('button:not(#bossTabPush)'))other.addEventListener('click',()=>{panel.hidden=true;tab.classList.remove('active');tab.setAttribute('aria-selected','false');});
 tab.addEventListener('click',()=>{container.querySelector('#bossTabConnection')?.click();for(const p of document.querySelectorAll('.boss-manager .boss-panel'))p.hidden=true;container.querySelectorAll('button').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false')});panel.hidden=false;tab.classList.add('active');tab.setAttribute('aria-selected','true')});
 const verify=()=>{
  if(!$('url')||!$('key').value||!/^https:\/\//.test($('url').value.trim()))throw Error('請先在「連線設定」完成本隊 Key 設定');
  const url=$('pushWorkerUrl').value.trim().replace(/\/+$/,'');if(!/^https:\/\/[^/]+/.test(url))throw Error('請輸入有效的 HTTPS 通知 Worker 網址');
  const minutes=[...panel.querySelectorAll('input[name="pushMinutes"]:checked')].map(e=>Number(e.value));if(!minutes.length)throw Error('至少選擇一個提醒分鐘');
  const kinds={field:$('pushField').checked,fixed:$('pushFixed').checked,special:$('pushSpecial').checked};if(!Object.values(kinds).some(Boolean))throw Error('至少選擇一種首領類型');
  localStorage.setItem(storage,url);return{url,minutes,kinds,key:$('key').value};
 };
 function requireSupport(){if(!window.isSecureContext||!('Notification' in window)||!('serviceWorker' in navigator))throw Error('需要 HTTPS 及支援背景通知的瀏覽器；iPhone 請用已加入主畫面的 PWA');if(typeof firebase==='undefined'||!firebase.messaging)throw Error('FCM 函式庫尚未載入，請檢查網路連線');}
 async function getToken(){requireSupport();if(!(await firebase.messaging.isSupported()))throw Error('此裝置不支援 Firebase Messaging');
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
  status(disable?`已取消 ${TEAM} 隊訂閱；另一隊不受影響`:`${TEAM} 隊訂閱成功！目前為測試版，不會自動發送通知。`);
 }catch(e){status('操作失敗：'+e.message)}finally{busy=false;$('pushEnable').disabled=$('pushDisable').disabled=false}}
 $('pushEnable').onclick=()=>act(false);$('pushDisable').onclick=()=>act(true);
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();