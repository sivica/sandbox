import {readFile,writeFile} from 'node:fs/promises';
const themes=JSON.parse(await readFile('design-tokens.json','utf8'));let header='/* Generated from booking-design-workflow/design-tokens.json. */\n';for(const [name,t]of Object.entries(themes)){header+=`:root[data-design="${name}"] {`+Object.entries(t).filter(([k])=>k!=='heading').map(([k,v])=>`--${k}:${v};`).join('')+`--heading:${t.heading};background:var(--canvas);}\n`;}
const current=await readFile('public/design.css','utf8');await writeFile('public/design.css',header+current.slice(current.indexOf('\n.brand')));
