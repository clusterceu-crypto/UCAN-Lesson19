(() => {
'use strict';
const C=window.UCAN_L19;
const K='ucan-l19-v1-first-functional:';
const key={route:K+'route',note:K+'portfolio-note',answers:K+'answers',checked:K+'checked',formative:K+'formative'};
const by=id=>document.getElementById(id);
const routes=[...document.querySelectorAll('.route')];
const routeMap=by('route-map-list'),note=by('portfolio-note'),saveStatus=by('save-status'),result=by('quiz-result');
const announce=(msg)=>{by('global-status').textContent='';requestAnimationFrame(()=>by('global-status').textContent=msg)};
let storeAvailable=true;
function read(k,fallback){try{const v=localStorage.getItem(k);return v===null?fallback:JSON.parse(v)}catch(e){storeAvailable=false;return fallback}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){storeAvailable=false;return false}}
function rm(k){try{localStorage.removeItem(k);return true}catch(e){storeAvailable=false;return false}}
let page=read(key.route,0);if(!Number.isInteger(page)||page<0||page>7)page=0;
let checked=read(key.checked,false)===true;
let answers=read(key.answers,{});if(typeof answers!=='object'||!answers)answers={};
let formative=read(key.formative,{});if(typeof formative!=='object'||!formative)formative={};
let validPass=false;
const answerValues=()=>Array.from({length:5},(_,i)=>document.querySelector(`input[name="q${i+1}"]:checked`)?.value||null);
function answersCorrect(){const values=answerValues();return values.every((x,i)=>x===C.keys[i]);}
function pass(){return checked&&answersCorrect();}
function setSaveMessage(t,error=false){saveStatus.textContent=t;saveStatus.classList.toggle('error',error)}
function persistNote(){if(save(key.note,note.value))setSaveMessage('Нотатку збережено на цьому пристрої.');else setSaveMessage('Не вдалося зберегти нотатку в браузері. Текст залишається тут, доки сторінку відкрито; завантажте PDF для резервної копії.',true)}
const n=read(key.note,'');note.value=typeof n==='string'?n:'';if(note.value)setSaveMessage(storeAvailable?'Нотатку відновлено з цього пристрою.':'Не вдалося отримати локально збережену нотатку.',!storeAvailable);
note.addEventListener('input',persistNote);
for(let i=1;i<=5;i++){
 const val=answers['q'+i];if(val){const el=document.querySelector(`input[name="q${i}"][value="${val}"]`);if(el)el.checked=true;}
}
// Source-controlled button set: initial/selected/checked/retry/PASS. Edits always revoke prior checked status.
function clearFeedback(){for(let i=1;i<=5;i++){const f=by('feedback-'+i);f.hidden=true;f.textContent='';f.className='item-feedback';}result.textContent='Відповідайте на всі п’ять запитань і перевірте результат.';result.className='quiz-result';}
function redrawFeedback(){
 const vals=answerValues();if(!checked){clearFeedback();return;}
 let score=0;
 vals.forEach((v,i)=>{
  const f=by('feedback-'+(i+1));f.hidden=false;
  const correct=(v===C.keys[i]);if(correct)score++;
  f.className='item-feedback '+(correct?'correct':'incorrect');
  f.textContent=correct?'Правильно. '+C.correctFeedback[i]:v?'Спробуйте ще раз. '+C.wrongFeedback[i]:'Відповідь не вибрано. '+C.wrongFeedback[i];
 });
 validPass=(score===5&&vals.every(Boolean));
 result.textContent=validPass?'5 із 5. Фінальну перевірку пройдено. Можна перейти до завершення.':`Результат: ${score} із 5. Для завершення потрібно 5 із 5; спроби необмежені.`;
 result.className='quiz-result '+(validPass?'passed':'not-passed');
}
function assessmentChanged(){
 const before=validPass;
 checked=false;validPass=false;rm(key.checked);
 answers={};answerValues().forEach((v,i)=>{if(v)answers['q'+(i+1)]=v});save(key.answers,answers);clearFeedback();
 if(page===7)go(6,{force:true});
 refreshMap();
 if(before)announce('Відповідь змінено. Попереднє проходження скасовано; перевірте поточні відповіді повторно.');
}
for(const radio of document.querySelectorAll('.answer input'))radio.addEventListener('change',assessmentChanged);
by('check-answers').addEventListener('click',()=>{checked=true;save(key.checked,true);redrawFeedback();refreshMap();});
if(checked)redrawFeedback();else clearFeedback();validPass=pass();
for(const button of document.querySelectorAll('.formative-trigger')){
 const id=button.dataset.formative;const target=by('formative-'+id);const initial=!!formative[id];target.hidden=!initial;button.setAttribute('aria-expanded',String(initial));button.textContent=initial?'Приховати орієнтир для самоперевірки':'Показати орієнтир для самоперевірки';
 button.addEventListener('click',()=>{const showing=target.hidden;target.hidden=!showing;formative[id]=showing;save(key.formative,formative);button.setAttribute('aria-expanded',String(showing));button.textContent=showing?'Приховати орієнтир для самоперевірки':'Показати орієнтир для самоперевірки';});
}
function refreshMap(){
 const currentPass=pass();for(const b of routeMap.querySelectorAll('button')){const i=Number(b.dataset.page);b.setAttribute('aria-current',i===page?'step':'false');b.setAttribute('aria-disabled',i===7&&!currentPass?'true':'false');}
}
function go(i,{force=false,restore=false}={}){
 if(i<0||i>=routes.length)return;
 if(i===7&&!pass()&&!force){announce('Для завершення потрібно отримати 5 із 5 у фінальній перевірці.');return;}
 page=i;
 routes.forEach((el,j)=>{el.hidden=(i!==j)});
 const label=C.routeLabels[i];by('header-route-label').textContent=label;
 const n=i+1,percent=Math.round(100*n/8);
 by('page-indicator').textContent=`Сторінка ${n} з 8`;by('sticky-page').textContent=`Сторінка ${n} з 8`;by('progress-percent').textContent=`${percent}%`;by('progress-fill').style.width=percent+'%';by('progressbar').setAttribute('aria-valuenow',percent);
 by('back-button').disabled=i===0;
 by('next-button').textContent=i===7?'Наступне заняття →':'Далі →';
 by('next-button').setAttribute('aria-label',i===7?'Наступне заняття — наразі недоступне':'Далі — '+(C.routeLabels[i+1]||''));
 refreshMap();save(key.route,i);
 if(!restore){window.scrollTo({top:0,behavior:'instant'});by('lesson-main').focus({preventScroll:true});announce(`Розділ ${n} із 8: ${label}.`)}
}
C.routeLabels.forEach((label,i)=>{
 const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.dataset.page=i;b.textContent=label;b.addEventListener('click',()=>go(i));li.appendChild(b);routeMap.appendChild(li);
});
by('back-button').addEventListener('click',()=>go(page-1));
by('next-button').addEventListener('click',()=>{
 if(page===7){announce('Перехід до наступного заняття наразі не налаштовано. Ваша нотатка і прогрес залишаються на пристрої.');return;}
 go(page+1);
});
by('reset-lesson').addEventListener('click',()=>{
 if(!confirm('Почати заняття спочатку? Прогрес маршруту, самоперевірки та фінальні відповіді буде скинуто. Ваша нотатка «Портфеля мера» залишиться збереженою.'))return;
 for(const k of [key.route,key.answers,key.checked,key.formative])rm(k);
 answers={};checked=false;validPass=false;formative={};document.querySelectorAll('.answer input').forEach(e=>e.checked=false);clearFeedback();
 document.querySelectorAll('.formative-trigger').forEach(b=>{const e=by('formative-'+b.dataset.formative);e.hidden=true;b.textContent='Показати орієнтир для самоперевірки';b.setAttribute('aria-expanded','false')});
 go(0);announce('Прогрес заняття і відповіді скинуто. Нотатку «Портфеля мера» збережено.');
});
by('delete-note').addEventListener('click',()=>{
 if(!confirm('Безповоротно видалити тільки Вашу нотатку «Портфеля мера» з цього пристрою? Прогрес і відповіді не зміняться.'))return;
 note.value='';if(rm(key.note))setSaveMessage('Нотатку видалено з цього пристрою.');else setSaveMessage('Не вдалося підтвердити видалення нотатки зі сховища.',true);
 announce('Нотатку видалено за Вашим підтвердженням.');
});
// Local Unicode PDF: device canvas glyphs rendered as a searchable/selectable Type3 font.
// No font files are packaged or redistributed. No network, printing, or data upload.
// Browser-native, offline PDF writer. Uses local canvas glyph rendering to build
// Unicode-mapped PDF Type3 glyphs, without bundling or distributing font files.
// Browser-native, offline PDF writer. Uses local canvas glyph rendering to build
// Unicode-mapped PDF Type3 glyphs, without bundling or distributing font files.
function makePdf(text){
 const pageW=595.28,pageH=841.89,margin=48;
 const fontPx=92,fontScale=1000/fontPx;
 const measureCanvas=document.createElement('canvas'),m=measureCanvas.getContext('2d');
 if(!m)throw new Error('Canvas unavailable');
 m.font=`${fontPx}px Arial, Aptos, sans-serif`;
 const advance=new Map();
 const widthOf=(ch)=>{if(!advance.has(ch))advance.set(ch,Math.max(1,m.measureText(ch).width)/fontPx*1000);return advance.get(ch)};
 const textWidth=(s,size)=>[...s].reduce((a,c)=>a+widthOf(c)*size/1000,0);
 const pages=[];let current=[],cursor=pageH-margin;
 function newPage(){if(current.length)pages.push(current);current=[];cursor=pageH-margin;}
 function addLine(s,size,lead){if(cursor-lead<margin){newPage()}cursor-=lead;current.push({text:s,y:cursor,x:margin,size});}
 function wrapParagraph(raw,size,lead,after){
   if(!raw.trim()){cursor-=lead*.65;if(cursor<margin)newPage();return;}
   let line='';const max=pageW-2*margin;
   for(const ch of [...raw]){
    const trial=line+ch;
    if(line&&textWidth(trial,size)>max){addLine(line.trimEnd(),size,lead);line=ch.trimStart();}else line=trial;
   }
   if(line)addLine(line.trimEnd(),size,lead);cursor-=after;if(cursor<margin)newPage();
 }
 wrapParagraph('\u041f\u043e\u0440\u0442\u0444\u0435\u043b\u044c \u043c\u0435\u0440\u0430',16.5,23,12);
 wrapParagraph(window.UCAN_L19.artifactTitle,15,22,13);
 wrapParagraph('\u041e\u0441\u043e\u0431\u0438\u0441\u0442\u0430 \u0440\u043e\u0431\u043e\u0447\u0430 \u043d\u043e\u0442\u0430\u0442\u043a\u0430',10.5,17,17);
 for(const p of text.replace(/\r\n?/g,'\n').split('\n'))wrapParagraph(p,11.5,17.8,6);
 if(current.length)pages.push(current);
 const unique=[...new Set(pages.flatMap(p=>p.flatMap(l=>[...l.text])))];
 const groupCount=Math.ceil(unique.length/240);if(groupCount>100)throw new Error('Excessive glyph diversity');
 const glyphs=new Map();unique.forEach((ch,i)=>glyphs.set(ch,{bank:Math.floor(i/240),code:1+i%240}));
 const te=new TextEncoder(),asBytes=(s)=>te.encode(s);
 const objects=[null];const alloc=()=>{objects.push(null);return objects.length-1};const put=(id,v)=>objects[id]=v;
 const stream=(data,header)=>{
  const b=typeof data==='string'?asBytes(data):data;
  return join([asBytes(`<< ${header||''} /Length ${b.length} >>\nstream\n`),b,asBytes('\nendstream')]);
 };
 const join=(chunks)=>{const out=new Uint8Array(chunks.reduce((a,b)=>a+b.length,0));let x=0;for(const b of chunks){out.set(b,x);x+=b.length}return out};
 const hex=(v,n=2)=>v.toString(16).toUpperCase().padStart(n,'0');
 const utf16=(s)=>{let out='';for(let i=0;i<s.length;i++)out+=hex(s.charCodeAt(i),4);return out};
 const catalog=alloc(),pagesId=alloc(),fontIds=[],imgObjects=[],charObjects=[];
 for(let bank=0;bank<groupCount;bank++){
  const fId=alloc(),cmapId=alloc(),resEntries=[],encoding=[],widths=[],chars=[];fontIds.push(fId);
  const glyphList=unique.slice(bank*240,(bank+1)*240);
  for(let gi=0;gi<glyphList.length;gi++){
   const ch=glyphList[gi],code=gi+1,adv=widthOf(ch),proc=alloc();chars.push(`/g${code} ${proc} 0 R`);encoding.push(`/g${code}`);widths.push(String(Math.round(adv)));
   const gw=Math.max(4,Math.ceil(m.measureText(ch).width)+8),gh=130;
   const can=document.createElement('canvas');can.width=gw;can.height=gh;
   const ctx=can.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Canvas glyph context unavailable');
   ctx.clearRect(0,0,gw,gh);ctx.font=`${fontPx}px Arial, Aptos, sans-serif`;ctx.textBaseline='alphabetic';ctx.fillStyle='#000';ctx.fillText(ch,2,100);
   const rgba=ctx.getImageData(0,0,gw,gh).data;
   const packed=new Uint8Array(Math.ceil(gw/8)*gh);let hasInk=false;
   for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)if(rgba[(y*gw+x)*4+3]>48){packed[y*Math.ceil(gw/8)+(x>>3)]|=128>>(x&7);hasInk=true}
   const w=Math.round(gw*fontScale),h=Math.round(gh*fontScale),xx=-Math.round(2*fontScale),yy=-Math.round((gh-100)*fontScale);
   const d1=`${Math.round(adv)} 0 -40 -400 ${w+50} 1130 d1`;
   if(hasInk){const imId=alloc();resEntries.push(`/im${code} ${imId} 0 R`);
    put(imId,stream(packed,`/Type /XObject /Subtype /Image /Width ${gw} /Height ${gh} /ImageMask true /BitsPerComponent 1 /Decode [1 0]`));
    put(proc,stream(`${d1}\nq ${w} 0 0 ${h} ${xx} ${yy} cm /im${code} Do Q`));
   }else put(proc,stream(d1));
  }
  const records=glyphList.map((ch,i)=>`<${hex(i+1)}> <${utf16(ch)}>`);
  const cmapParts=[];for(let i=0;i<records.length;i+=90)cmapParts.push(`${Math.min(90,records.length-i)} beginbfchar\n${records.slice(i,i+90).join('\n')}\nendbfchar`);
  const cmap=`/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /UCAN-Unicode def\n/CMapType 2 def\n1 begincodespacerange\n<01> <F0>\nendcodespacerange\n${cmapParts.join('\n')}\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
  put(cmapId,stream(cmap));
  put(fId,asBytes(`<< /Type /Font /Subtype /Type3 /Name /F${bank+1} /FontBBox [-40 -400 2000 1150] /FontMatrix [0.001 0 0 0.001 0 0] /CharProcs << ${chars.join(' ')} >> /Encoding << /Type /Encoding /Differences [1 ${encoding.join(' ')}] >> /FirstChar 1 /LastChar ${glyphList.length} /Widths [${widths.join(' ')}] /Resources << /XObject << ${resEntries.join(' ')} >> >> /ToUnicode ${cmapId} 0 R >>`));
 }
 const pids=[];for(const page of pages){const pid=alloc(),cid=alloc();pids.push(pid);
  let commands=['0 0 0 rg'];
  for(const l of page){let x=l.x,runStart=x;let run='',lastBank=null;const flush=()=>{if(!run)return;commands.push(`BT /F${lastBank+1} ${l.size} Tf 1 0 0 1 ${runStart.toFixed(2)} ${l.y.toFixed(2)} Tm <${run}> Tj ET`);run=''};
   for(const ch of [...l.text]){const g=glyphs.get(ch);if(g.bank!==lastBank){flush();lastBank=g.bank;runStart=x;}
    run+=hex(g.code);x+=widthOf(ch)*l.size/1000;
   }
   flush();
  }
  put(cid,stream(commands.join('\n')));
  put(pid,asBytes(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << ${fontIds.map((id,i)=>`/F${i+1} ${id} 0 R`).join(' ')} >> >> /Contents ${cid} 0 R >>`));
 }
 put(catalog,asBytes(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`));put(pagesId,asBytes(`<< /Type /Pages /Count ${pids.length} /Kids [${pids.map(n=>n+' 0 R').join(' ')}] >>`));
 const chunks=[asBytes('%PDF-1.4\n')],offsets=[0];let pos=chunks[0].length;
 for(let id=1;id<objects.length;id++){const block=join([asBytes(`${id} 0 obj\n`),objects[id],asBytes('\nendobj\n')]);offsets[id]=pos;chunks.push(block);pos+=block.length;}
 const start=pos;chunks.push(asBytes(`xref\n0 ${objects.length}\n0000000000 65535 f \n`));for(let id=1;id<objects.length;id++)chunks.push(asBytes(String(offsets[id]).padStart(10,'0')+' 00000 n \n'));
 chunks.push(asBytes(`trailer\n<< /Root ${catalog} 0 R /Size ${objects.length} >>\nstartxref\n${start}\n%%EOF\n`));
 return new Blob(chunks,{type:'application/pdf'});
}
by('download-pdf').addEventListener('click',()=>{
 const s=note.value.trim();if(!s){setSaveMessage('Нотатка порожня. Напишіть хоча б один рядок перед завантаженням PDF.',true);note.focus();return;}
 try{const pdf=makePdf(s);const u=URL.createObjectURL(pdf);const a=document.createElement('a');a.href=u;a.download='UCAN_Лідерська_рамка_кліматичної_візії_міста_Громада.pdf';a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);announce('PDF створено локально. Перевірте теку завантажень.');setSaveMessage('PDF сформовано на Вашому пристрої. Нотатка залишається доступною.');}catch(e){setSaveMessage('Не вдалося створити PDF. Скопіюйте нотатку в локальний документ і збережіть її вручну.',true);announce('Помилка формування PDF.');}
});
// Never allow an old stored completion to unlock the final route after answer edits.
if(page===7&&!pass())page=6;
go(page,{restore:true});
})();
