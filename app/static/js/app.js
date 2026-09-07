
const modal=document.getElementById('searchModal');
const openBtn=document.getElementById('searchOpen');
const closeBtn=document.getElementById('searchClose');
const input=document.getElementById('globalSearch');
const results=document.getElementById('searchResults');

function openSearch(){modal.classList.add('open');setTimeout(()=>input.focus(),50)}
function closeSearch(){modal.classList.remove('open')}
openBtn?.addEventListener('click',openSearch);
closeBtn?.addEventListener('click',closeSearch);
modal?.addEventListener('click',e=>{if(e.target===modal)closeSearch()});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch()}
  if(e.key==='Escape')closeSearch();
});

let timer;
input?.addEventListener('input',()=>{
  clearTimeout(timer);
  timer=setTimeout(async()=>{
    const q=input.value.trim();
    if(!q){results.innerHTML='<div class="search-empty">Search spacecraft and technology.</div>';return;}
    const [or, tr]=await Promise.all([
      fetch('/api/objects?q='+encodeURIComponent(q)).then(r=>r.json()),
      fetch('/api/tech?q='+encodeURIComponent(q)).then(r=>r.json())
    ]);
    const ohtml=or.slice(0,8).map(o=>`<a class="search-result" href="/object/${o.slug}"><div><strong>${o.name}</strong><small>${o.kind}</small></div><span>${o.destination}</span></a>`).join('');
    const thtml=tr.slice(0,8).map(t=>`<a class="search-result" href="/technologies"><div><strong>${t.name}</strong><small>${t.family}</small></div><span>Technology</span></a>`).join('');
    results.innerHTML=(ohtml+thtml)||'<div class="search-empty">No curated match. Use the live orbital catalog for satellite names and NORAD IDs.</div>';
  },100);
});

document.addEventListener("DOMContentLoaded",()=>{
  const sm=document.getElementById("searchModal");
  const so=document.getElementById("searchOpen");
  const sc=document.getElementById("searchClose");
  sm?.classList.add("hidden");
  so?.addEventListener("click",()=>sm?.classList.remove("hidden"));
  sc?.addEventListener("click",()=>sm?.classList.add("hidden"));
  sm?.addEventListener("click",e=>{if(e.target===sm)sm.classList.add("hidden")});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){sm?.classList.add("hidden");document.getElementById("satModal")?.classList.add("hidden");}});
});
