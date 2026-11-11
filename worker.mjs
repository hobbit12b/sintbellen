const html = /*HTML*/ "";
const images = /*IMAGES*/ {};
const ttl=3*60*60*1000;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(images[url.pathname])return new Response(Uint8Array.from(atob(images[url.pathname]),c=>c.charCodeAt(0)),{headers:{'Content-Type':url.pathname.endsWith('.png')?'image/png':'image/jpeg','Cache-Control':'public, max-age=31536000, immutable'}});
 if(!url.pathname.startsWith('/api/'))return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','Permissions-Policy':'microphone=(self)'}});
 try {
  if(!env.BUCKET)return json({error:'De verbinding is nog niet ingesteld.'},503);
  if(request.method==='POST'&&request.headers.get('Origin')!==url.origin)return json({error:'Ongeldige herkomst.'},403);
  if(url.pathname==='/api/room'&&request.method==='POST'){
   for(let i=0;i<8;i++){
    const code=String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);
    const old=await env.BUCKET.get('room/'+code);
    if(old&&Date.now()-(await old.json()).created<ttl)continue;
    const room={code,created:Date.now(),phase:'ready',event:crypto.randomUUID(),at:Date.now(),number:null};
    await env.BUCKET.put('room/'+code,JSON.stringify(room));return json(room);
   }return json({error:'Probeer nog eens een nieuw belnummer.'},503);
  }
  const match=url.pathname.match(/^\/api\/room\/(\d{6})(?:\/(call|ask|reset))?$/);
  if(!match)return json({error:'Onbekende pagina.'},404);
  const object=await env.BUCKET.get('room/'+match[1]);
  if(!object)return json({error:'Dit belnummer bestaat niet. Controleer het digibord.'},404);
  const room=await object.json();
  if(Date.now()-room.created>ttl)return json({error:'Het belnummer is verlopen. Start een nieuw spel op het digibord.'},410);
  if(request.method==='GET'&&!match[2])return json(room);
  if(request.method!=='POST'||!match[2])return json({error:'Niet toegestaan.'},405);
  const action=match[2];
  if(action==='ask'){
   if(room.phase!=='called')return json({error:'Bel Sinterklaas eerst.'},409);
   if(Date.now()-room.at<4500)return json({error:'Sinterklaas neemt zo op. Wacht nog even.'},409);
   room.phase='answer';room.number=1+crypto.getRandomValues(new Uint32Array(1))[0]%12;
  }else {room.phase=action==='call'?'called':'ready';room.number=null;}
  room.event=crypto.randomUUID();room.at=Date.now();
  await env.BUCKET.put('room/'+room.code,JSON.stringify(room));return json(room);
 }catch{return json({error:'Verbinden lukt even niet. Probeer het opnieuw.'},503);}
}};
