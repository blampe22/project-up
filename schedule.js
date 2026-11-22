(() => {
  const DAY=86400000;
  const baseline={
    revision:'Preliminary Baseline — Rev. 0', dataDate:'2026-11-22', start:'2026-11-22', finish:'2027-01-17',
    family:[],
    project:[
      {id:'2.1',name:'Design & Feasibility',start:'2026-11-22',finish:'2026-12-04',inProgress:true,kind:'design'},
      {id:'2.2',name:'Owner Design Approval',date:'2026-11-27',kind:'milestone'},
      {id:'2.3',name:'Procurement — Family Subcontractors',start:'2026-11-22',finish:'2026-12-18',kind:'procurement'},
      {id:'2.4',name:'Procurement — Materials',start:'2026-11-30',finish:'2026-12-19',kind:'procurement',assumed:true},
      {id:'2.5',name:'Panel Fabrication',start:'2026-12-05',finish:'2026-12-19',kind:'construction',assumed:true},
      {id:'2.6',name:'Family Painting',start:'2026-12-20',finish:'2027-01-03',kind:'construction'},
      {id:'2.7',name:'Installation',note:'TBD — Dependent on Approved Permitting',authority:'Permitting Authority: The Owner'},
      {id:'2.8',name:'Closeout & Family Keepsakes'},
    ],
  };
  const stamp=iso=>Date.parse(iso+'T00:00:00Z');
  const end=stamp(baseline.finish);
  const first=stamp(baseline.start);
  const count=(end-first)/DAY+1;
  const span=(a,b)=>(stamp(b)-stamp(a))/DAY+1;
  const offset=iso=>(stamp(iso)-first)/DAY;
  const percent=units=>(units/count*100).toFixed(6)+'%';
  const short=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
  const dated=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
  const monthName=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  const iso=ms=>new Date(ms).toISOString().slice(0,10);
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const weeks=[];
  for(let day=first;day<=end;day+=7*DAY)weeks.push(iso(day));

  function timelineHeader(){
    const months=[];
    for(let day=first;day<=end;){
      const d=new Date(day);
      const next=Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1);
      months.push('<span data-left="'+percent((day-first)/DAY)+'" data-width="'+percent((Math.min(next,end+DAY)-day)/DAY)+'">'+monthName.format(day)+'</span>');
      day=next;
    }
    return '<div class="gantt-months">'+months.join('')+'</div><div class="gantt-weeks">'+weeks.map((day,i)=>{
      const left=offset(day),width=Math.min(7,count-left);
      return '<span data-left="'+percent(left)+'" data-width="'+percent(width)+'"'+(i===weeks.length-1?' class="last-week"':'')+'>'+short.format(stamp(day))+'</span>';
    }).join('')+'</div>';
  }
  const guides=weeks.slice(1).map(day=>'<i class="gantt-week-line" data-left="'+percent(offset(day))+'" aria-hidden="true"></i>').join('')+
    '<i class="gantt-data-line" data-left="'+percent(offset(baseline.dataDate)+.5)+'" aria-hidden="true"></i>';
  function marker(event){
    const kind=event.target?'delivery':event.kind==='milestone'?'milestone':'medical';
    const label=event.target?'Mid-January planning target (Jan 15 plotted for illustration)':dated.format(stamp(event.date));
    return '<span class="gantt-marker '+kind+'" data-date="'+event.date+'" data-left="'+percent(offset(event.date)+.5)+'" title="'+escape(label+' · '+event.name)+'" role="img" aria-label="'+escape(label+' · '+event.name)+'">'+(kind==='medical'?'+':kind==='delivery'?'♥':'')+'</span>';
  }
  function bar(activity){
    const left=offset(activity.start);
    const width=span(activity.start,activity.finish);
    return '<span class="gantt-bar '+activity.kind+(activity.inProgress?' in-progress':'')+'" data-start="'+activity.start+'" data-finish="'+activity.finish+'" data-days="'+width+'" data-left="'+percent(left)+'" data-width="'+percent(width)+'"></span>';
  }
  function track(content){return '<td class="gantt-time"><div class="gantt-track">'+guides+content+'</div></td>';}
  function meta(start,finish,duration){return '<td>'+escape(start)+'</td><td>'+escape(finish)+'</td><td>'+escape(duration)+'</td>';}
  function activityRow(item,group){
    const due=item.date?short.format(stamp(item.date)):'TBD';
    const start=item.start?(item.inProgress?'In progress':short.format(stamp(item.start))):item.date?'—':'TBD';
    const finish=item.finish?short.format(stamp(item.finish)):(item.target?'Mid-Jan':due);
    const duration=item.start?span(item.start,item.finish)+(item.inProgress?' visible':''):item.date?'0':'—';
    const details=item.note?'<small>'+escape(item.note)+'</small><small>'+escape(item.authority)+'</small>':item.assumed?'<small>Finish is a planning assumption</small>':'';
    const type=item.date?'milestone':item.start?'activity':'unscheduled';
    const label=item.id?'<span class="gantt-code">'+item.id+'</span> ':'';
    const attributes=' class="gantt-child '+type+'" data-wbs="'+group+'"'+(item.id?' data-activity="'+item.id+'"':'')+(group==='1.0'?' hidden':'');
    return '<tr'+attributes+'><th scope="row">'+label+escape(item.name)+details+'</th>'+meta(start,finish,duration)+track(item.date?marker(item):item.start?bar(item):'')+'</tr>';
  }
  function summary(id,name,expanded,visual){
    return '<tr class="gantt-summary" data-summary="'+id+'"><th scope="row"><button type="button" data-toggle-wbs="'+id+'" aria-expanded="'+expanded+'" aria-controls="gantt-wbs-'+id.replace('.','-')+'"><span class="gantt-chevron" aria-hidden="true"></span><span>'+id+' '+escape(name)+'</span></button></th>'+meta('—','—','—')+track(visual)+'</tr>';
  }
  const familyDates=baseline.family.filter(e=>!e.target).map(e=>short.format(stamp(e.date))).join(' · ');
  for(const root of document.querySelectorAll('[data-project-schedule]')){
    const summaryFamily=bar({start:baseline.start,finish:baseline.finish,kind:'family'})+baseline.family.map(marker).join('');
    const summaryProject=bar({start:baseline.start,finish:baseline.project.find(a=>a.id==='2.6').finish,kind:'summary'});
    root.innerHTML='<p class="gantt-revision">'+baseline.revision+' · Data date '+dated.format(stamp(baseline.dataDate))+
      ' · Horizon '+dated.format(first)+' – '+dated.format(end)+'</p>'+
      '<p>Two projects. One growing family. And a Project Architect who apparently cannot resist creating a construction schedule.</p>'+
      '<div class="gantt-scroll" role="region" aria-label="Master project timeline, scroll horizontally to see all weeks" tabindex="0">'+
      '<table class="gantt-table"><colgroup><col class="gantt-activity-col"><col class="gantt-meta-col" span="3"><col></colgroup>'+
      '<thead><tr><th scope="col">WBS / Activity</th><th scope="col">Start</th><th scope="col">Finish</th><th scope="col">Days</th><th scope="col" class="gantt-time">'+timelineHeader()+'</th></tr></thead>'+
      '<tbody>'+summary('1.0','Auggie & Theo',false,summaryFamily)+'</tbody><tbody id="gantt-wbs-1-0">'+baseline.family.map(a=>activityRow(a,'1.0')).join('')+'</tbody>'+
      '<tbody>'+summary('2.0','Project UP',true,summaryProject)+'</tbody><tbody id="gantt-wbs-2-0">'+baseline.project.map(a=>activityRow(a,'2.0')).join('')+'</tbody></table></div>'+
      '<ul class="gantt-legend" aria-label="Schedule legend"><li class="family">Auggie &amp; Theo</li><li class="design">Design</li><li class="procurement">Procurement</li><li class="construction">Construction</li><li>◆ Milestone</li><li>+ Checkup</li><li>♥ Delivery target</li><li class="legend-data">Data date</li></ul>'+
      '<div class="gantt-notes"><p><strong>Auggie &amp; Theo come first.</strong> The family schedule takes priority. Personal appointment and delivery dates are held privately.</p>'+
      '<p>All Project UP activities are subject to family availability, Owner direction, and the arrival of the boys. Durations are inclusive calendar days. Design was in progress at the data date. Its bar and visible days begin at the horizon. The project summary covers dated work only. Owner Design Approval is a target milestone. Material procurement and fabrication finish dates are planning assumptions. Installation will proceed only following approved permitting.</p></div>';
    for(const item of root.querySelectorAll('[data-left]')){
      item.style.left=item.dataset.left;
      if(item.dataset.width)item.style.width=item.dataset.width;
    }
    for(const button of root.querySelectorAll('[data-toggle-wbs]')){
      button.onclick=()=>{
        const expanded=button.getAttribute('aria-expanded')==='true';
        button.setAttribute('aria-expanded',String(!expanded));
        for(const row of root.querySelectorAll('[data-wbs="'+button.dataset.toggleWbs+'"]'))row.hidden=expanded;
      };
    }
  }
})();

