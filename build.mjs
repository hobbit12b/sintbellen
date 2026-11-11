import {readFileSync,mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8')
 .replace('/* BOARD_STYLE */',readFileSync('board.css','utf8'))
 .replace('<!-- ROOM_ART -->',readFileSync('art/room.svg','utf8'))
 .replace('<!-- PHONE_ART -->',readFileSync('art/telephone.svg','utf8'))
 .replace('<!-- SINT_ART -->',readFileSync('art/sint.svg','utf8'));
const images=Object.fromEntries(['wachten','bellen'].map(pose=>[
 '/art/sint-bureau-'+pose+'-v3.jpg',readFileSync('art/sint-bureau-'+pose+'.jpg').toString('base64')
]));
const source=readFileSync('worker.mjs','utf8').replace('/*HTML*/ ""',JSON.stringify(html)).replace('/*IMAGES*/ {}',JSON.stringify(images));
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js',source);copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log('Built dist/server/index.js');
