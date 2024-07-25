const o={fajr:"الفجر",dhuhr:"الظهر",asr:"العصر",maghrib:"المغرب",isha:"العشاء"};let n;async function l(){const e=chrome.runtime.getURL("offscreen.html");(await chrome.runtime.getContexts({contextTypes:["OFFSCREEN_DOCUMENT"],documentUrls:[e]})).length>0||(n?await n:(n=chrome.offscreen.createDocument({url:"offscreen.html",reasons:["AUDIO_PLAYBACK"],justification:"testing"}),await n,n=null))}const c=async(e,t)=>{await l(),chrome.runtime.sendMessage({target:"offscreen",type:e,data:t})},a=()=>c("stop-adhan"),m=(e,t)=>e?t==="ar"?`حان الان موعد أذان ${o[e]} 🕌`:`It's ${e} time 🕌`:t==="ar"?"حان وقت الصلاة 🕌":"It's prayer time 🕌",f=e=>{const t=new Date(e).getTime(),s=new Date().getTime(),r=5*60*1e3;return s-t<=r},h=(e,t)=>{chrome.notifications.create("setPrayerAlarms",{type:"basic",title:"Quran Tab",message:e,requireInteraction:t,iconUrl:"icon.png"},()=>{console.log("Notification created")})},i=()=>{chrome.alarms.clearAll()},g=e=>{const t={...e.prayerTimesObject};t&&(i(),delete t.sunrise,Object.entries(t).forEach(s=>{chrome.alarms.create(`${s[0]}-${e.settings.selectedLanguageKey}`,{when:s[1].timeValue})}))},u=e=>{c("play-adhan",e);const t=e.name.split("-")[0],s=e.name.split("-")[1],r=m(t,s);f(e.scheduledTime)&&h(r,!0)},d=async({name:e,userData:t})=>{switch(e){case"setPrayerAlarms":t&&t.settings.prayerTimesFlag!==!1&&g(t);break;case"clearPrayerAlarms":i();break;case"stopAdhan":await a();break;default:console.log("Unknown message type",e)}};chrome.runtime.onMessage.addListener(d);chrome.alarms.onAlarm.addListener(u);chrome.notifications.onClicked.addListener(a);chrome.notifications.onClosed.addListener(a);chrome.runtime.setUninstallURL("https://quran-uninstall.vercel.app/");