const artwork=new URL('./art.png',import.meta.url).href;
function tag(name,text='',css=''){
  const el=document.createElement(name);el.textContent=text;el.className=css;return el;
}
function frame(){
  const el=tag('div','','mural-frame'),image=tag('img');
  image.alt='Mural concept showing the floating house, balloons, mountains, waterfall and approved adventure-map border direction';
  const fallback=tag('p','Mural concept unavailable. Panel coordinates follow the approved 8 × 5 grid.');
  fallback.hidden=true;
  image.onerror=()=>{image.hidden=true;fallback.hidden=false;};
  image.src=artwork;
  el.append(image,fallback);return el;
}
const title="THE ADVENTURE WE'RE BUILDING";
function enlarge(){
  const dialog=tag('dialog','','mural-dialog'),heading=tag('h2',title);
  heading.id='enlarged-mural-title';dialog.setAttribute('aria-labelledby',heading.id);
  const close=tag('button','Close','outline');close.type='button';close.onclick=()=>dialog.close();
  const art=frame(),grid=tag('div','','mural-layer mural-guide');
  grid.hidden=true;grid.setAttribute('aria-hidden','true');
  for(let i=0;i<40;i++)grid.append(tag('span'));
  art.append(grid);
  const toggle=tag('input');toggle.type='checkbox';toggle.onchange=()=>{grid.hidden=!toggle.checked;};
  const label=tag('label',' Show 8 × 5 panel grid','check');label.prepend(toggle);
  const bar=tag('div','','dialog-heading');bar.append(heading,close);
  dialog.append(bar,art,label);dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  document.body.append(dialog);dialog.showModal();
}
export function mountMural(host){
  const type=host.dataset.mural,art=frame(),board=host.querySelector('.board');
  if(board)art.append(board);
  const layer=tag('div','','mural-layer mural-markers');
  if(['status','requests','exhibit'].includes(type))art.append(layer);
  if(type==='exhibit')layer.classList.add('exhibit-grid');
  const action=tag('button','Enlarge mural','outline');action.type='button';action.onclick=enlarge;
  const caption=type==='requests'?'Numbered tiles are ranked requests. Confirmed assignments are coordinated separately.':'Complete mural · Approved design direction. Centerpiece · Approved. Adventure-map border · Approved design direction.';
  host.replaceChildren(tag('p',title,'eyebrow mural-title'),art,tag('figcaption',caption),action);
  if(type==='exhibit'){
    const toggle=tag('input');toggle.type='checkbox';toggle.checked=true;
    toggle.onchange=()=>layer.classList.toggle('boundaries-hidden',!toggle.checked);
    const label=tag('label',' Show 8 × 5 production boundaries','check');label.prepend(toggle);host.append(label);
  }
  return {update(panels,requests=[]){
    layer.replaceChildren();
    for(const panel of [...panels].sort((a,b)=>a.row-b.row||a.column-b.column)){
      const rank=requests.indexOf(panel.id),mark=tag('span','','mural-marker');
      mark.dataset.panel=panel.id;
      if(type==='status'){
        mark.classList.add(panel.status.toLowerCase());mark.dataset.status=panel.status;
        mark.append(tag('b','','mural-marker-dot'));mark.title=panel.id+' · '+panel.status;
      }else if(type==='exhibit'){
        mark.setAttribute('aria-hidden','true');
        if(rank>=0){mark.classList.add('exhibit-selected');mark.title=panel.id;}
      }else if(rank>=0){
        mark.classList.add('mural-requested');mark.append(tag('b',String(rank+1),'mural-marker-dot'));
        mark.title=panel.id+' · Request '+(rank+1);
      }
      layer.append(mark);
    }
  }};
}
export function positionCrop(el,panel){
  el.style.backgroundImage='url('+artwork+')';
  el.style.backgroundPosition=((panel.column-1)/7*100)+'% '+((panel.row-1)/4*100)+'%';
}

