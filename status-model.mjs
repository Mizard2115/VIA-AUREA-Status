export const PUBLIC_KEY='JdQJa7uzGhrQbGQH8Ic8R3V4cZKbnHe2bO+W+zu8KwQ=';
export function validate(value,now){
 if(!value||Object.keys(value).sort().join(',')!=='checked_at,components,schema,version'||value.schema!==1||typeof value.version!=='string'||!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(value.version)||!Number.isSafeInteger(value.checked_at)||value.checked_at<now-120||value.checked_at>now+30)throw Error('invalid_snapshot');
 if(!value.components||Object.keys(value.components).sort().join(',')!=='control,handoff,network'||Object.values(value.components).some(v=>!['ok','down'].includes(v)))throw Error('invalid_components');
 return value;
}
export function display(value,now){
 const fresh=value&&Number.isSafeInteger(value.checked_at)&&now-value.checked_at<=180&&value.checked_at<=now+30;
 const components=fresh?value.components:{control:'unknown',handoff:'unknown',network:'unknown'};
 return {status:!fresh?'unknown':Object.values(components).every(v=>v==='ok')?'ok':'down',checked_at:value?.checked_at||0,components,valid_for_ms:fresh?Math.max(0,180-(now-value.checked_at))*1000:0};
}
export async function signed(raw,signature){
 try{if(typeof signature!=='string'||signature.length!==88)return false;const bytes=v=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));const key=await crypto.subtle.importKey('raw',bytes(PUBLIC_KEY),{name:'Ed25519'},false,['verify']);return await crypto.subtle.verify('Ed25519',key,bytes(signature),raw);}catch{return false;}
}
