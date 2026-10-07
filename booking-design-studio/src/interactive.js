import { screenHTML, validateDesign } from "./design.js";
// Fixed trusted script; generated strings appear only in escaped template markup.
export const previewScript = `
let step = Number(document.body.dataset.start || 0), slot = '10:15';
const root = document.getElementById('booking-root');
function render(){
 root.replaceChildren(document.getElementById('screen-'+step).content.cloneNode(true));
 const action=root.querySelector('.action');
 if(step===2){
  root.querySelectorAll('.slots span').forEach(el=>{
   const b=document.createElement('button');b.type='button';b.textContent=el.textContent;b.setAttribute('aria-pressed',String(el.textContent===slot));
   b.addEventListener('click',()=>{slot=b.textContent;root.querySelectorAll('.slots button').forEach(item=>item.setAttribute('aria-pressed',String(item.textContent===slot)))});el.replaceWith(b);
  });
 }
 if(step===4){const p=document.createElement('p');p.textContent='Synthetic booking complete · illustrative weekday '+slot+' · no reservation created';p.setAttribute('role','status');root.querySelector('.card').append(p);}
 action.addEventListener('click',()=>{step=(step+1)%5;render();root.querySelector('h1').focus();});
 const heading=root.querySelector('h1');heading.tabIndex=-1;
 if(step>0 && step<4){const back=document.createElement('button');back.textContent='Back';back.type='button';back.addEventListener('click',()=>{step--;render();root.querySelector('h1').focus();});root.append(back);}
}
render();`;
export function bookingHTML(design, start = 0) {
  const d = validateDesign(design);
  const first = screenHTML(d, 0);
  const css = first.match(/<style>([\s\S]*?)<\/style>/)[1];
  const templates = d.screens
    .map(
      (_, i) =>
        '<template id="screen-' +
        i +
        '">' +
        screenHTML(d, i).match(/<body[^>]*>([\s\S]*?)<\/body>/)[1] +
        "</template>",
    )
    .join("");
  return (
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'nonce-kindred-trusted-preview\'; form-action \'none\'; base-uri \'none\'"><style>' +
    css +
    " button{font:inherit;cursor:pointer;border:1px solid " + d.tokens.accent + "}.action{width:100%;display:block}.slots button{padding:13px;border-radius:10px}.slots button[aria-pressed=true]{outline:3px solid " +
    d.tokens.accent +
    '}</style></head><body data-start="' +
    Math.max(0, Math.min(4, start)) +
    '"><main id="booking-root"></main>' +
    templates +
    '<script nonce="kindred-trusted-preview">' +
    previewScript +
    "</script></body></html>"
  );
}
