import {validationError} from './simulation.js';
let connection;
export class SaveConflict extends Error{constructor(){super('这个人生已在另一个页面保存。为保留两边进度，当前页面已暂停自动保存。');this.name='SaveConflict';}}
function trimBackups(store,id){const r=store.index('lifeId').getAll(id);r.onsuccess=()=>{for(const row of r.result.sort((a,b)=>b.revision-a.revision).slice(3))store.delete(row.key);};}
export function openDatabase(){if(connection)return connection;connection=new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(new Error('当前浏览器无法使用本地存档，请导出人生文件保留进度。'));return;}
  const req=indexedDB.open('slowhaven-lives',2);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('lives'))db.createObjectStore('lives',{keyPath:'id'});if(!db.objectStoreNames.contains('backups')){const st=db.createObjectStore('backups',{keyPath:'key'});st.createIndex('lifeId','lifeId');}};
  req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};req.onerror=()=>{connection=null;reject(req.error);};req.onblocked=()=>{connection=null;reject(new Error('请关闭另一个旧版小镇页面，再重新打开。'));};
});return connection;}
export async function listLives(){const db=await openDatabase();return new Promise((resolve,reject)=>{const req=db.transaction('lives').objectStore('lives').getAll();req.onsuccess=()=>resolve(req.result.map(r=>({id:r.id,name:r.state.player.name,day:r.state.day,age:r.state.player.baseAge,identity:r.state.player.identity,coat:r.state.player.coat,skin:r.state.player.skin,updatedAt:r.updatedAt,revision:r.revision})).sort((a,b)=>b.updatedAt-a.updatedAt));req.onerror=()=>reject(req.error);});}
export async function loadLife(id){const db=await openDatabase();return new Promise((resolve,reject)=>{const r=db.transaction('lives').objectStore('lives').get(id);r.onsuccess=()=>{if(!r.result){reject(new Error('这个人生没有找到。'));return;}const state=r.result.state,e=validationError(state);if(e){reject(new Error(e+'。可以从备份恢复。'));return;}resolve(structuredClone(state));};r.onerror=()=>reject(r.error);});}
export async function saveLife(state){const error=validationError(state);if(error)throw new Error(error);const db=await openDatabase(),snapshot=structuredClone(state),expected=state.revision;
  return new Promise((resolve,reject)=>{const tx=db.transaction(['lives','backups'],'readwrite'),lives=tx.objectStore('lives'),backups=tx.objectStore('backups');let failure=null;const r=lives.get(state.id);
    r.onsuccess=()=>{const previous=r.result;if(previous&&previous.revision!==expected||!previous&&expected!==0){failure=new SaveConflict();tx.abort();return;}
      if(previous)backups.put({key:state.id+':'+previous.revision,lifeId:state.id,revision:previous.revision,state:previous.state,updatedAt:previous.updatedAt});
      snapshot.revision=expected+1;lives.put({id:state.id,revision:snapshot.revision,updatedAt:Date.now(),state:snapshot});
      const old=backups.index('lifeId').getAll(state.id);old.onsuccess=()=>{const rows=old.result.sort((a,b)=>b.revision-a.revision);for(const row of rows.slice(3))backups.delete(row.key);};
    };tx.oncomplete=()=>resolve(snapshot.revision);tx.onerror=()=>reject(failure||tx.error||new Error('存档失败'));tx.onabort=()=>reject(failure||tx.error||new Error('存档未完成，上一次存档仍然保留。'));
  });
}
export async function listBackups(id){const db=await openDatabase();return new Promise((resolve,reject)=>{const r=db.transaction('backups').objectStore('backups').index('lifeId').getAll(id);r.onsuccess=()=>resolve(r.result.sort((a,b)=>b.revision-a.revision));r.onerror=()=>reject(r.error);});}
export async function restoreBackup(id,key,currentState=null){
  if(currentState){const e=validationError(currentState);if(e||currentState.id!==id)throw new Error(e||'人生标识不一致');}
  const db=await openDatabase();return new Promise((resolve,reject)=>{
    const tx=db.transaction(['lives','backups'],'readwrite'),backups=tx.objectStore('backups'),lives=tx.objectStore('lives'),r=backups.get(key);let restored,error;
    r.onsuccess=()=>{
      if(!r.result||r.result.lifeId!==id){error=new Error('没有找到这份备份。');tx.abort();return;}
      restored=structuredClone(r.result.state);const e=validationError(restored);if(e){error=new Error(e);tx.abort();return;}
      const current=lives.get(id);current.onsuccess=()=>{
        if(currentState&&current.result?.revision!==currentState.revision){error=new SaveConflict();tx.abort();return;}
        if(current.result)backups.put({key:id+':'+current.result.revision,lifeId:id,revision:current.result.revision,state:currentState?structuredClone(currentState):current.result.state,updatedAt:Date.now()});
        restored.revision=(current.result?.revision||0)+1;lives.put({id,revision:restored.revision,state:restored,updatedAt:Date.now()});trimBackups(backups,id);
      };
    };
    tx.oncomplete=()=>resolve(restored);tx.onabort=()=>reject(error||tx.error);tx.onerror=()=>reject(error||tx.error);
  });
}
export async function removeLife(id){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(['lives','backups'],'readwrite');tx.objectStore('lives').delete(id);const r=tx.objectStore('backups').index('lifeId').getAllKeys(id);r.onsuccess=()=>r.result.forEach(k=>tx.objectStore('backups').delete(k));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
export async function importLife(text){if(text.length>2_000_000)throw new Error('存档文件过大。');let data;try{data=JSON.parse(text);}catch{throw new Error('这不是有效的存档文件。');}const s=data?.state??data,error=validationError(s);if(error)throw new Error(error);s.id=globalThis.crypto?.randomUUID?.()??'life-import-'+Date.now();s.revision=0;await saveLife(s);return s.id;}
export function exportLife(s){return JSON.stringify({game:'栖迟小镇',format:2,exportedAt:new Date().toISOString(),state:s},null,2);}
