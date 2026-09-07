
document.addEventListener("DOMContentLoaded", () => {
  const tabs=[...document.querySelectorAll(".dbtab")];
  const profiles=document.getElementById("profilesTab");
  const catalog=document.getElementById("catalogTab");

  function showTab(name){
    const showProfiles=name==="profiles";
    profiles.classList.toggle("hidden",!showProfiles);
    catalog.classList.toggle("hidden",showProfiles);
    tabs.forEach(t=>t.classList.toggle("active",t.dataset.tab===name));
    if(!showProfiles && !window.__catalogInitialized){
      window.__catalogInitialized=true;
      loadCatalog();
    }
  }

  tabs.forEach(tab=>{
    tab.addEventListener("click",event=>{
      event.preventDefault();
      event.stopPropagation();
      showTab(tab.dataset.tab);
    });
  });

  const cards=[...document.querySelectorAll(".searchable")];
  const ps=document.getElementById("profileSearch");
  const cf=document.getElementById("categoryFilter");
  const df=document.getElementById("destinationFilter");

  const params=new URLSearchParams(location.search);
  if(params.get("category")) cf.value=params.get("category");
  if(params.get("destination")) df.value=params.get("destination");

  function filterProfiles(){
    const q=(ps?.value||"").toLowerCase().trim();
    cards.forEach(card=>{
      const ok=(!q||card.dataset.text.includes(q))
        &&(!cf.value||card.dataset.category===cf.value)
        &&(!df.value||card.dataset.destination===df.value);
      card.style.display=ok?"":"none";
    });
  }
  [ps,cf,df].filter(Boolean).forEach(el=>el.addEventListener("input",filterProfiles));
  filterProfiles();

  const group=document.getElementById("catalogGroup");
  const search=document.getElementById("catalogSearch");
  const count=document.getElementById("catalogCount");
  const table=document.getElementById("catalogTable");
  const notice=document.getElementById("catalogNotice");

  const modal=document.getElementById("satModal");
  const modalClose=document.getElementById("satModalClose");
  modal?.classList.add("hidden");

  const detail={
    name:document.getElementById("satModalName"),
    norad:document.getElementById("satNorad"),
    cospar:document.getElementById("satCospar"),
    inclination:document.getElementById("satInclination"),
    period:document.getElementById("satPeriod"),
    perigee:document.getElementById("satPerigee"),
    apogee:document.getElementById("satApogee"),
    eccentricity:document.getElementById("satEccentricity"),
    epoch:document.getElementById("satEpoch")
  };

  let loaded=[];

  function val(v,suffix=""){
    return v===null||v===undefined||v===""?"—":`${v}${suffix}`;
  }

  function openObject(row){
    detail.name.textContent=row.OBJECT_NAME||"Unnamed orbital object";
    detail.norad.textContent=val(row.NORAD_CAT_ID);
    detail.cospar.textContent=val(row.OBJECT_ID);
    detail.inclination.textContent=val(row.INCLINATION,"°");
    detail.period.textContent=val(row.PERIOD," min");
    detail.perigee.textContent=val(row.PERIAPSIS," km");
    detail.apogee.textContent=val(row.APOAPSIS," km");
    detail.eccentricity.textContent=val(row.ECCENTRICITY);
    detail.epoch.textContent=row.EPOCH?String(row.EPOCH).replace("T"," ").slice(0,19):"—";
    modal.classList.remove("hidden");
  }

  modalClose?.addEventListener("click",(e)=>{e.preventDefault();e.stopPropagation();modal.classList.add("hidden");});
  modal?.addEventListener("click",e=>{if(e.target===modal)modal.classList.add("hidden")});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")modal?.classList.add("hidden")});

  function filteredRows(){
    const q=(search?.value||"").toLowerCase().trim();
    return loaded.filter(row =>
      !q
      ||String(row.OBJECT_NAME||"").toLowerCase().includes(q)
      ||String(row.NORAD_CAT_ID||"").includes(q)
      ||String(row.OBJECT_ID||"").toLowerCase().includes(q)
    );
  }

  function render(){
    const rows=filteredRows();
    if(!rows.length){
      table.innerHTML='<div class="catalog-empty">No matching objects in this group.</div>';
      return;
    }

    table.innerHTML=rows.slice(0,2000).map(row=>{
      const idx=loaded.indexOf(row);
      return `
      <button type="button" class="catalog-row orbital-row" data-index="${idx}">
        <div>
          <strong>${row.OBJECT_NAME||"Unnamed object"}</strong>
          <span>${row.OBJECT_ID||"No COSPAR ID"}</span>
        </div>
        <div><span>NORAD</span><strong>${row.NORAD_CAT_ID??"—"}</strong></div>
        <div><span>INC</span><strong>${row.INCLINATION??"—"}°</strong></div>
        <div><span>PERIGEE</span><strong>${row.PERIAPSIS??"—"} km</strong></div>
        <div><span>APOGEE</span><strong>${row.APOAPSIS??"—"} km</strong></div>
        <div><span></span><strong class="row-open">Inspect ↗</strong></div>
      </button>`;
    }).join("");

    table.querySelectorAll(".orbital-row").forEach(button=>{
      button.addEventListener("click",()=>{
        const row=loaded[Number(button.dataset.index)];
        if(row) openObject(row);
      });
    });
  }

  async function loadCatalog(){
    if(!group) return;
    notice.classList.add("hidden");
    count.textContent="Loading";
    table.innerHTML='<div class="catalog-empty">Loading orbital objects…</div>';

    try{
      const response=await fetch(`/api/satellites?group=${encodeURIComponent(group.value)}&limit=5000`);
      const data=await response.json();

      if(!response.ok) throw new Error(data.detail||"Orbital source unavailable");

      loaded=data.objects||[];
      count.textContent=`${loaded.length.toLocaleString()} objects`;
      render();
    }catch(error){
      loaded=[];
      count.textContent="Unavailable";

      notice.innerHTML=`
        <strong>This source rejected the current request.</strong>
        <span>Choose another group. Stations, science, weather, GPS, Galileo, Starlink, OneWeb, and CubeSats usually require far smaller downloads than the full active catalog.</span>
        <a href="/explore">Open the live interactive maps instead →</a>`;
      notice.classList.remove("hidden");
      table.innerHTML='<div class="catalog-empty">Choose another group from the menu above.</div>';
    }
  }

  group?.addEventListener("change",loadCatalog);
  search?.addEventListener("input",render);

  // expose to showTab
  window.loadCatalog=loadCatalog;
});
