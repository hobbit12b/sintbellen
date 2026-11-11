import {readFileSync,mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
const source=readFileSync('worker.mjs','utf8').replace('/*HTML*/ ""',JSON.stringify(html));
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js',source);copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built dist/server/index.js');
