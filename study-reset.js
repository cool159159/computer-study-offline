(()=>{'use strict';
const PRACTICE='cafe-practice-v2',MOCK='computer-mock-five-v1',COACH='computer-study-coach-v1',UNDO='computer-study-reset-undo-v1';
function plan(scope,storage){
 if(!['practice','mock','all'].includes(scope))throw Error('초기화 범위를 선택하세요.');
 const writes={};
 if(scope!=='mock'){
  const old=JSON.parse(storage.getItem(PRACTICE)||'null');
  writes[PRACTICE]=JSON.stringify({history:{},stars:Array.isArray(old?.stars)?old.stars:[],session:null});
  const coach=JSON.parse(storage.getItem(COACH)||'null');
  if(coach){const items={};for(const [id,item]of Object.entries(coach.items||{}))if(typeof item?.note==='string'&&item.note)items[id]={note:item.note};writes[COACH]=JSON.stringify({version:1,items});}
 }
 if(scope!=='practice')writes[MOCK]=JSON.stringify({version:1,sessions:{},history:[]});
 return writes;
}
function apply(writes,storage){const before={};for(const key of Object.keys(writes))before[key]=storage.getItem(key);try{for(const [key,value]of Object.entries(writes)){if(value===null)storage.removeItem(key);else storage.setItem(key,value);}}catch(error){for(const [key,value]of Object.entries(before)){if(value===null)storage.removeItem(key);else storage.setItem(key,value);}throw error;}}
function reset(scope,storage=localStorage){const writes=plan(scope,storage),before={};for(const key of Object.keys(writes))before[key]=storage.getItem(key);apply({...writes,[UNDO]:JSON.stringify({version:1,at:Date.now(),scope,before})},storage);}
function undo(storage=localStorage){const snapshot=JSON.parse(storage.getItem(UNDO)||'null');if(snapshot?.version!==1||!snapshot.before||!Object.keys(snapshot.before).length)throw Error('되돌릴 초기화 기록이 없습니다.');for(const [key,value]of Object.entries(snapshot.before))if(![PRACTICE,MOCK,COACH].includes(key)||(value!==null&&typeof value!=='string'))throw Error('초기화 복원 정보가 올바르지 않습니다.');apply({...snapshot.before,[UNDO]:null},storage);}
window.studyReset={plan,reset,undo};
function init(){const main=document.querySelector('main');if(!main)return;const p=document.createElement('details');p.id='studyResetPanel';p.className='study-panel';p.style.marginTop='20px';p.innerHTML='<summary style="font-weight:700">학습 기록 초기화</summary><p>테스트 채점으로 쌓인 오답과 점수를 정리할 수 있습니다. 선택한 범위의 채점·진행 중 답안을 초기화합니다.</p><p class="study-helper">문제 JSON·교재 PDF·내 메모·복습 표시는 유지됩니다. 연습 기록을 초기화하면 자동 복습 예약도 함께 비웁니다.</p><label for="studyResetScope">초기화 범위</label> <select id="studyResetScope"><option value="practice">연습 기록만</option><option value="mock">모의고사 기록만</option><option value="all">연습 + 모의고사 기록</option></select><div class="study-actions" style="margin-top:12px"><button id="studyResetStart" type="button">선택한 기록 초기화</button><button id="studyResetUndo" type="button">마지막 초기화 되돌리기</button></div><p id="studyResetStatus" class="study-helper" role="status"></p><p class="study-helper">마지막 초기화 직전 상태를 이 기기에 한 번 보관합니다. 되돌리면 초기화 후 새로 푼 기록은 초기화 직전 기록으로 대체됩니다.</p>';
 const home=document.querySelector('.home-data-actions')?.parentElement;if(home)home.after(p);else main.appendChild(p);
 const status=p.querySelector('#studyResetStatus'),undoButton=p.querySelector('#studyResetUndo');
 try{undoButton.disabled=!localStorage.getItem(UNDO);}catch{undoButton.disabled=true;}
 const confirmBox=document.createElement('div');confirmBox.hidden=true;confirmBox.className='reference-note';confirmBox.innerHTML='<p id=studyResetConfirmText></p><div class=study-actions><button type=button id=studyResetConfirm>확인하고 진행</button><button type=button id=studyResetCancel>취소</button></div>';p.appendChild(confirmBox);let pending=null;const ask=(message,action)=>{confirmBox.hidden=false;confirmBox.querySelector('p').textContent=message;pending=action;confirmBox.querySelector('#studyResetCancel').focus();};confirmBox.querySelector('#studyResetCancel').onclick=()=>{pending=null;confirmBox.hidden=true;};confirmBox.querySelector('#studyResetConfirm').onclick=()=>{const action=pending;pending=null;confirmBox.hidden=true;action?.();};
 const reopen=()=>{history.replaceState(null,'',location.pathname+location.search+'#studyResetPanel');location.reload();};
 p.querySelector('#studyResetStart').onclick=()=>{const scope=p.querySelector('select').value,label=p.querySelector('select').selectedOptions[0].textContent;ask(label+'을 초기화합니다. 문제·PDF·메모·복습 표시는 유지합니다.',()=>{try{reset(scope);reopen();}catch(error){status.textContent='초기화하지 못했습니다: '+error.message;}});};
 undoButton.onclick=()=>ask('마지막 초기화 직전 기록으로 되돌립니다. 초기화 후 새로 푼 기록은 대체됩니다.',()=>{try{undo();reopen();}catch(error){status.textContent='되돌리지 못했습니다: '+error.message;}});
 if(location.hash==='#studyResetPanel'){p.open=true;status.textContent=undoButton.disabled?'초기화할 기록의 범위를 선택하세요.':'마지막 초기화 직전 기록이 보관되어 있습니다. 필요하면 되돌릴 수 있습니다.';}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
