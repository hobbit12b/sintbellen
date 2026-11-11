import http from 'node:http';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import worker from './dist/server/index.js';
const data=new Map();
const BUCKET={async get(k){const v=data.get(k);return v?{json:async()=>JSON.parse(v)}:null;},async put(k,v){data.set(k,v);}};
http.createServer(async(req,res)=>{try{const request=new Request('http://localhost:4173'+req.url,{method:req.method,headers:req.headers});const response=await worker.fetch(request,{BUCKET});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());}catch(e){res.writeHead(500);res.end(String(e));}}).listen(4173,'127.0.0.1',()=>console.log('http://localhost:4173'));
