import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const origin='https://sint.test';
function setup(){const data=new Map();const env={BUCKET:{async get(k){const v=data.get(k);return v?{json:async()=>JSON.parse(v)}:null;},async put(k,v){data.set(k,v);}}};return {data,async call(path='',method='GET',headers={Origin:origin}){const r=await worker.fetch(new Request(origin+'/api/room'+path,{method,headers}),env);return {status:r.status,body:await r.json()};}};}
test('Bellen, wachten, vragen, 5–15, herhaalde vraag en reset',async()=>{const x=setup();const created=await x.call('','POST');assert.equal(created.status,200);const code=created.body.code;assert.match(code,/^\d{6}$/);assert.equal((await x.call('/'+code)).body.phase,'ready');assert.equal((await x.call('/'+code+'/ask','POST')).status,409);await x.call('/'+code+'/call','POST');assert.equal((await x.call('/'+code+'/ask','POST')).status,409);for(let i=0;i<60;i++){await x.call('/'+code+'/call','POST');const value=JSON.parse(x.data.get('room/'+code));value.at-=5000;x.data.set('room/'+code,JSON.stringify(value));const answer=await x.call('/'+code+'/ask','POST');assert.equal(answer.status,200);assert.ok(Number.isInteger(answer.body.number)&&answer.body.number>=5&&answer.body.number<=15);assert.equal((await x.call('/'+code+'/ask','POST')).status,409);}assert.equal((await x.call('/'+code+'/reset','POST')).body.phase,'ready');});
test('Ongeldig nummer, verlopen nummer, verkeerde herkomst',async()=>{const x=setup();assert.equal((await x.call('/123')).status,404);assert.equal((await x.call('/123456')).status,404);assert.equal((await x.call('','POST',{Origin:'https://other.test'})).status,403);const {body:r}=await x.call('','POST');r.created-=4*60*60*1000;x.data.set('room/'+r.code,JSON.stringify(r));assert.equal((await x.call('/'+r.code)).status,410);});
test('Onafhankelijke klassen en opnieuw lezen vanaf tweede apparaat',async()=>{const x=setup();const a=(await x.call('','POST')).body,b=(await x.call('','POST')).body;assert.notEqual(a.code,b.code);await x.call('/'+a.code+'/call','POST');assert.equal((await x.call('/'+a.code)).body.phase,'called');assert.equal((await x.call('/'+b.code)).body.phase,'ready');});
test('Browser-JavaScript heeft geldige syntax',()=>{const html=readFileSync('index.html','utf8');new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);});
test('Ogen zijn standaard open; willekeurige pauze en slechts 130 ms knipperen',()=>{
 const html=readFileSync('index.html','utf8');const fn=html.slice(html.indexOf('function startBlinking('),html.indexOf('let artReady='));
 const classes=new Set(['blinking']),queue=[],events={};let random=.1;
 const element={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}};
 const context=vm.createContext({element,document:{hidden:false,addEventListener:(e,cb)=>events[e]=cb},Math:{random:()=>random},setTimeout:(cb,ms)=>queue.push({cb,ms})});
 vm.runInContext(fn+';startBlinking(element)',context);assert.equal(classes.has('blinking'),false);assert.equal(queue[0].ms,5500);
 queue.shift().cb();assert.equal(classes.has('blinking'),true);assert.equal(queue[0].ms,130);
 random=.8;queue.shift().cb();assert.equal(classes.has('blinking'),false);assert.equal(queue[0].ms,9000);
 context.document.hidden=true;queue.shift().cb();assert.equal(classes.has('blinking'),false);
});
test('Hoorn wordt opgenomen en blijft vast tijdens de opdracht',()=>{
 const html=readFileSync('index.html','utf8');
 const fn=html.slice(html.indexOf('function boardRender()'),html.indexOf('async function poll()'));
 const nodes=new Map();
 const get=id=>{if(!nodes.has(id))nodes.set(id,{classes:new Set(),classList:{toggle(name,on){on?get(id).classes.add(name):get(id).classes.delete(name);}},querySelector(){return {setAttribute(){}};}});return nodes.get(id);};
 const context=vm.createContext({$:get,room:{phase:'called',at:0,event:'one'},active:true,lastStage:'',hungUpEvent:null,Date:{now:()=>1000},window:{speechSynthesis:{cancel(){}}},ring(){},stopSpeech(){},speak(){},setReceiver(on){get('sint').classList.toggle('holding-receiver',on);},words:['','een','twee','drie']});
 vm.runInContext(fn+';boardRender();',context);assert.equal(get('telephone').classes.has('ringing'),true);assert.equal(get('sint').classes.has('holding-receiver'),false);
 context.Date.now=()=>3200;vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),true);assert.equal(get('telephone').classes.has('ringing'),false);
 context.Date.now=()=>4000;vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),true);
 context.room={phase:'answer',at:4000,event:'two',number:3};context.Date.now=()=>4500;vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),true);
 context.Date.now=()=>6500;vm.runInContext('boardRender()',context);assert.equal(get('bubble').textContent,'3');assert.equal(get('sint').classes.has('holding-receiver'),true);
 context.room={phase:'ready',at:7000,event:'three'};vm.runInContext('boardRender()',context);assert.equal(get('sint').classes.has('holding-receiver'),false);
});
test('Mond volgt spraak; na opdracht ophangen met getal behouden; oude callbacks genegeerd',()=>{
 const html=readFileSync('index.html','utf8');
 const code=html.slice(html.indexOf('let speechSerial='),html.indexOf('function ring()'));
 const nodes=new Map();const get=id=>{if(!nodes.has(id)){const classes=new Set();nodes.set(id,{classes,classList:{add:n=>classes.add(n),remove:n=>classes.delete(n),toggle(n,on){on?classes.add(n):classes.delete(n);}},querySelector(){return {setAttribute(){}};}});}return nodes.get(id);};
 const synth={getVoices:()=>[],cancel(){this.speaking=false;},speaking:false,paused:false,pending:false,speak(u){this.utterance=u;}};
 const ctx=vm.createContext({$:get,room:{event:'answer-6',phase:'answer',number:6},window:{speechSynthesis:synth},speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},setInterval:()=>1,clearInterval(){},status(){},Date});
 vm.runInContext(code+";setReceiver(true);speak('Leg zes blokjes neer.',()=>finishAnswer('answer-6'));",ctx);
 assert.equal(get('sint').classes.has('speaking'),false);
 synth.speaking=true;synth.utterance.onstart();assert.equal(get('sint').classes.has('speaking'),true);
 synth.utterance.onpause();assert.equal(get('sint').classes.has('speaking'),false);
 synth.utterance.onresume();assert.equal(get('sint').classes.has('speaking'),true);
 synth.speaking=false;synth.utterance.onend();assert.equal(get('sint').classes.has('speaking'),false);assert.equal(get('sint').classes.has('holding-receiver'),false);assert.equal(ctx.room.number,6);
 const old=synth.utterance;ctx.room={event:'new-call',phase:'called'};vm.runInContext("setReceiver(true);speak('Hallo');",ctx);old.onend();assert.equal(get('sint').classes.has('holding-receiver'),true);
 synth.utterance.onstart();vm.runInContext('stopSpeech()',ctx);assert.equal(get('sint').classes.has('speaking'),false);
});
