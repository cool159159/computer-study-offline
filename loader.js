const DB_NAME='computer-study-private-v1';
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function savedPack(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('files');const r=tx.objectStore('files').get('pack');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
async function storePack(pack){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put(pack,'pack');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);});}
function validatePack(p){
 if(!p||p.format!=='computer-study-private-pack'||p.version!==1||!p.banks||!p.pages)throw Error('이 앱용 개인학습자료 JSON을 선택하세요. 풀이 기록 백업과는 다른 파일입니다.');
 const ids=new Set();let total=0;
 for(const key of ['practice','mock']){const b=p.banks[key];if(!b||!Array.isArray(b.questions)||!b.questions.length||b.questions.length>2000)throw Error('문제은행 형식이 올바르지 않습니다.');for(const q of b.questions){if(typeof q.id!=='string'||ids.has(q.id)||typeof q.stem!=='string'||!Array.isArray(q.options)||typeof q.explanation!=='string')throw Error('문항 형식 또는 중복 ID를 확인하세요.');ids.add(q.id);total++;if(q.options.length&&(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length))throw Error('정답 형식이 올바르지 않습니다.');const c=p.catalog?.[q.id];if(!c||c.answer!==q.answer||c.count!==q.options.length)throw Error('문항과 기록용 색인이 일치하지 않습니다.');if(key==='mock'&&(!Number.isInteger(q.round)||q.round<1||q.round>5))throw Error('모의고사 회차가 잘못되었습니다.');}}
 if(typeof p.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(p.fingerprint))throw Error('자료 식별 정보가 없습니다.');
 if(p.compatible_catalogs!==undefined&&(!Array.isArray(p.compatible_catalogs)||p.compatible_catalogs.length>50||p.compatible_catalogs.some(x=>typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x))))throw Error('이전 자료 호환 정보가 올바르지 않습니다.');
 for(const name of ['필기후기_분석보고서.html','학습자료_색인.html'])if(typeof p.pages[name]!=='string')throw Error('분석 보고서 또는 교재 색인이 누락되었습니다.');
 return total;
}
function compatibleCatalogs(pack){return [...new Set([pack.fingerprint,...(pack.compatible_catalogs||[])])];}
function isAppendOnlyPack(oldPack,newPack){
 // Compare complete old questions: an unchanged ID must never acquire new answers or meaning.
 if(!oldPack||!newPack||oldPack.format!==newPack.format||oldPack.version!==newPack.version)return false;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(!same(oldPack.banks.mock,newPack.banks.mock))return false;
 const before=oldPack.banks.practice.questions,after=newPack.banks.practice.questions;
 if(after.length<=before.length)return false;
 const byId=new Map(after.map(q=>[q.id,q]));
 return before.every(q=>same(q,byId.get(q.id)))&&Object.entries(oldPack.catalog).every(([id,q])=>same(q,newPack.catalog[id]));
}
function registerOffline(){if('serviceWorker' in navigator)return navigator.serviceWorker.register('./sw.js',{scope:'./'});return Promise.reject(Error('이 브라우저에서는 오프라인 설치를 지원하지 않습니다.'));}
window.studyFiles={savedPack,storePack,validatePack,registerOffline,compatibleCatalogs,isAppendOnlyPack};
(async()=>{
 await registerOffline().catch(()=>{});
 const name=decodeURIComponent(location.pathname.split('/').pop());if(name==='index.html'||!name)return;
 try{const pack=await savedPack();if(!pack){location.replace('./index.html');return;}validatePack(pack);let html;
 const key=name==='필기후기_연습시험.html'?'practice':name==='전산_모의고사.html'?'mock':null;
 if(key){const response=await fetch('./'+key+'.template.json');if(!response.ok)throw Error('앱 파일을 불러올 수 없습니다.');html=JSON.parse(await response.text());const safe=v=>JSON.stringify(v).replace(/<\//g,'<\\/');html=html.replace('__PRIVATE_BANK__',()=>safe(pack.banks[key])).replace('__PRIVATE_CATALOG__',()=>safe(pack.catalog)).replace('__PRIVATE_FINGERPRINT__',()=>safe(pack.fingerprint)).replace('__PRIVATE_COMPATIBLE_FINGERPRINTS__',()=>safe(compatibleCatalogs(pack)));
 }else{html=pack.pages[name];if(!html)throw Error('등록되지 않은 페이지입니다.');html=html.replace('<main>','<main><p><a href="index.html">← 내 학습자료 관리</a></p>');}
 window.studyBookManifest=pack.book_manifest||[];
 window.exportPrivateBank=()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(pack.banks[key],null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=u;a.download=key+'-문제은행.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);};
 html=html.replace(/<\/style>/i,'</style><link rel="stylesheet" href="study-ui.css">');html=html.replace(/<\/html>/i,'<script src="pdf-library.js"></script><script src="study-ui.js"></script></html>');
 document.open();document.write(html);document.close();
 }catch(e){document.body.textContent='학습자료를 열지 못했습니다: '+e.message;const a=document.createElement('a');a.href='./index.html';a.textContent=' 자료 관리로 이동';document.body.appendChild(a);}
})();

