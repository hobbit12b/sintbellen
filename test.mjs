import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const origin='https://sint.test';
function setup(){const data=new Map();const env={BUCKET:{async get(k){const v=data.get(k);return v?{json:async()=>JSON.parse(v)}:null;},async put(k,v){data.set(k,v);}}};return {data,async call(path='',method='GET',headers={Origin:origin}){const r=await worker.fetch(new Request(origin+'/api/room'+path,{method,headers}),env);return {status:r.status,body:await r.json()};}};}
test('Bellen, wachten, vragen, 1–12, herhaalde vraag en reset',async()=>{const x=setup();const created=await x.call('','POST');assert.equal(created.status,200);const code=created.body.code;assert.match(code,/^\d{6}$/);assert.equal((await x.call('/'+code)).body.phase,'ready');assert.equal((await x.call('/'+code+'/ask','POST')).status,409);await x.call('/'+code+'/call','POST');assert.equal((await x.call('/'+code+'/ask','POST')).status,409);for(let i=0;i<60;i++){await x.call('/'+code+'/call','POST');const value=JSON.parse(x.data.get('room/'+code));value.at-=5000;x.data.set('room/'+code,JSON.stringify(value));const answer=await x.call('/'+code+'/ask','POST');assert.equal(answer.status,200);assert.ok(Number.isInteger(answer.body.number)&&answer.body.number>=1&&answer.body.number<=12);assert.equal((await x.call('/'+code+'/ask','POST')).status,409);}assert.equal((await x.call('/'+code+'/reset','POST')).body.phase,'ready');});
test('Ongeldig nummer, verlopen nummer, verkeerde herkomst',async()=>{const x=setup();assert.equal((await x.call('/123')).status,404);assert.equal((await x.call('/123456')).status,404);assert.equal((await x.call('','POST',{Origin:'https://other.test'})).status,403);const {body:r}=await x.call('','POST');r.created-=4*60*60*1000;x.data.set('room/'+r.code,JSON.stringify(r));assert.equal((await x.call('/'+r.code)).status,410);});
test('Onafhankelijke klassen en opnieuw lezen vanaf tweede apparaat',async()=>{const x=setup();const a=(await x.call('','POST')).body,b=(await x.call('','POST')).body;assert.notEqual(a.code,b.code);await x.call('/'+a.code+'/call','POST');assert.equal((await x.call('/'+a.code)).body.phase,'called');assert.equal((await x.call('/'+b.code)).body.phase,'ready');});
test('Browser-JavaScript heeft geldige syntax',()=>{const html=readFileSync('index.html','utf8');new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);});
test('Hoorn gaat na het rinkelen naar de hand en blijft daar tot de reset',()=>{
 const html=readFileSync('index.html','utf8');
 const fn=html.slice(html.indexOf('function boardRender()'),html.indexOf('async function poll()'));
 const nodes=new Map();
 const get=id=>{if(!nodes.has(id))nodes.set(id,{classes:new Set(),classList:{toggle(name,on){on?get(id).classes.add(name):get(id).classes.delete(name);}},querySelector(){return {setAttribute(){}};}});return nodes.get(id);};
 const context=vm.createContext({$:get,room:{phase:'called',at:0,event:'one'},active:true,lastStage:'',Date:{now:()=>1000},window:{speechSynthesis:{cancel(){}}},ring(){},speak(){},words:['','een','twee','drie']});
 vm.runInContext(fn+';boardRender();',context);assert.equal(get('telephone').classes.has('ringing'),true);assert.equal(get('sint').classes.has('holding-receiver'),false);
 context.Date.now=()=>3200;vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),true);assert.equal(get('telephone').classes.has('ringing'),false);
 context.Date.now=()=>4000;vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),true);
 context.room={phase:'answer',at:4000,event:'two',number:3};context.Date.now=()=>4500;vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),true);
 context.Date.now=()=>6500;vm.runInContext('boardRender()',context);assert.equal(get('bubble').textContent,'3');assert.equal(get('sint').classes.has('holding-receiver'),true);
 context.room={phase:'ready',at:7000,event:'three'};vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),false);
});
