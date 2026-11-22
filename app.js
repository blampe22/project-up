import {mountMural,positionCrop} from './mural.js';
import {mountDashboard} from './dashboard.js';
const siteBase='/project-up';
const viewPath=path=>path.slice(siteBase.length).replace(/(?:\/index\.html|\.html|\/)$/g,'')||'/';
const exhibitMural=mountMural(document.querySelector('[data-mural="exhibit"]'));
const examplePanel='P_R02_C03';
const projectViews=new Map([['/','home'],['/panels','panels'],['/our-story','story'],['/schedule','schedule'],['/register','register']]);
const legacyHomes=new Map([['#fabrication-exhibit','/panels'],['#mural-board','/panels'],['#about-project','/our-story'],['#project-schedule','/schedule'],['#registration','/register']]);
function showProjectView({scroll=true}={}){
  const next=projectViews.get(viewPath(location.pathname));
  if(!next)return;
  document.body.dataset.projectView=next;
  if(scroll){
    const anchor=location.hash&&document.getElementById(location.hash.slice(1));
    if(anchor)anchor.scrollIntoView();
    else window.scrollTo(0,0);
  }
}
const legacy=viewPath(location.pathname)==='/'&&legacyHomes.get(location.hash);
if(legacy)history.replaceState(null,'',siteBase+legacy+'.html'+location.search+location.hash);
showProjectView({scroll:Boolean(legacy||location.hash)});
document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
  const url=new URL(link.href);
  if(url.searchParams.has('panel')||url.origin!==location.origin||!url.pathname.startsWith(siteBase+'/')||!projectViews.has(viewPath(url.pathname)))return;
  event.preventDefault();
  if(url.href!==location.href)history.pushState(null,'',url);
  showProjectView();
});
window.addEventListener('popstate',()=>showProjectView());

const receiptMural=mountMural(document.querySelector('[data-mural="requests"]'));
document.querySelectorAll('[data-mural]:not([data-mural="requests"]):not([data-mural="exhibit"])').forEach(mountMural);
const $=selector=>document.querySelector(selector);
const form=$('#registration'), board=$('#board'), detail=$('#detail'), rankings=$('#rankings');
const ranks=['1st Request — My Favorite Panel','2nd Request — My Backup Choice',"3rd Request — Another Panel I'd Love to Paint"];
const requests=[null,null,null];
let panels=[],focused=null;
const open=p=>p.paintingStatus==='Open';
const paintingClass={Open:'available',Claimed:'assigned',Completed:'complete'};
const option=(value,text)=>new Option(text,value);
function element(tag,text,cls){
  const node=document.createElement(tag);node.textContent=text;
  if(cls)node.className=cls;
  return node;
}
const selects=ranks.map((rank,i)=>{
  const label=element('label',rank),select=document.createElement('select');
  select.id='request-'+i;
  select.addEventListener('change',()=>{requests[i]=select.value||null;render();});
  label.append(select);rankings.append(label);return select;
});
function render(){
  const active=document.activeElement?.dataset?.panel;
  board.replaceChildren();
  for(const p of panels){
    const tile=element('button','',`tile ${paintingClass[p.paintingStatus]}`);tile.type='button';
    tile.dataset.panel=p.id;
    tile.setAttribute('aria-label',`${p.id}, ${p.type.toLowerCase()}, ${p.paintingStatus}`);
    tile.setAttribute('aria-pressed',String(focused===p.id));
    tile.title=`${p.id} · ${p.paintingStatus}`;
    const rank=requests.indexOf(p.id);
    if(rank>=0)tile.append(element('span',rank+1,'rank'));
    tile.addEventListener('click',()=>{
      focused=p.id;
      if(open(p)&&!requests.includes(p.id)&&requests.includes(null))requests[requests.indexOf(null)]=p.id;
      render();
    });
    board.append(tile);
  }
  selects.forEach((select,i)=>{
    select.replaceChildren(option('','No preference / clear'));
    for(const p of panels){
      if((!open(p)||requests.includes(p.id))&&requests[i]!==p.id)continue;
      select.add(option(p.id,p.id+(p.description?' · '+p.description:'')));
    }
    select.value=requests[i]||'';
  });
  if(active)board.querySelector(`[data-panel="${active}"]`)?.focus({preventScroll:true});
  const p=panels.find(p=>p.id===focused);
  if(!p)return;
  const rank=requests.indexOf(p.id);
  detail.replaceChildren(element('strong',`${p.id} · ${p.type}`),' ',element('span',p.paintingStatus,`tag ${paintingClass[p.paintingStatus]}`),
    element('p',`Artwork: ${p.description||'Description pending'} · Complexity: ${p.complexity||'Pending'}`),
    element('p',rank>=0?`Selected as request ${rank+1}.`:open(p)?'Use a preference menu below to replace a choice.':'Unavailable for new requests.'));
  const zoom=element('button','Enlarge panel','outline');
  zoom.type='button';zoom.onclick=()=>{
    $('#zoom-title').textContent=p.id;
    positionCrop($('#zoom-image'),p);
    $('#zoom').showModal();
  };
  const crop=element('div','','mural-panel-crop');
  crop.setAttribute('role','img');
  crop.setAttribute('aria-label','Artwork detail for '+p.id);
  positionCrop(crop,p);
  detail.append(crop,zoom);
}
$('#close-zoom').onclick=()=>$('#zoom').close();
const exhibitSelect=$('#exhibit-panel');
function renderExhibit(){
  const panel=panels.find(p=>p.id===exhibitSelect.value);
  if(!panel)return;
  const example=panel.id===examplePanel;
  const ownerPreview=document.body.classList.contains('owner-preview');
  $('#exhibit-fabrication-stage').hidden=ownerPreview&&!example;
  exhibitMural.update(panels,[panel.id]);
  $('#exhibit-panel-id').textContent=panel.id+' · Row '+panel.row+' · Column '+panel.column;
  $('#exhibit-crop').hidden=!example;
  const crop=$('#exhibit-other');
  crop.hidden=example;
  if(!example){
    crop.setAttribute('aria-label','Artwork crop for '+panel.id);
    positionCrop(crop,panel);
  }
  $('#exhibit-crop-caption').textContent=example?'Exact source crop, enlarged from the reference image.':'Exact panel location on the mural concept.';
  $('#exhibit-fabrication').hidden=!example;
  $('#exhibit-fabrication-caption').textContent=example
    ?'P_R02_C03 · Conceptual Fabrication Illustration — Not Final Production Geometry. Traced from this exact crop. No printable STL or physical prototype exists for this panel.'
    :panel.id+' · Fabrication preview pending.';
}
exhibitSelect.onchange=renderExhibit;
async function refresh(){
  const response=await fetch(new URL('./panel-data.json',import.meta.url));
  if(!response.ok)throw Error('Could not load the mural board.');
  const data=await response.json();
  panels=data.panels.sort((a,b)=>a.row-b.row||a.column-b.column);
  const requested=new URLSearchParams(location.search).get('panel');
  if(viewPath(location.pathname)==='/register'&&panels.some(p=>p.id===requested&&open(p))){
    focused=requested;
    requests[0]=requested;
  }
  mountDashboard(document.querySelector('.progress-dashboard'),panels);
  const chosen=exhibitSelect.value||examplePanel;
  exhibitSelect.replaceChildren(...panels.map(p=>option(p.id,p.id+(p.id===examplePanel?' · Fabrication example':''))));
  exhibitSelect.value=chosen;
  renderExhibit();
  render();
}

refresh().catch(error=>{detail.textContent=error.message;document.querySelector('.progress-error').textContent=error.message;});
form.addEventListener('submit',event=>event.preventDefault());



