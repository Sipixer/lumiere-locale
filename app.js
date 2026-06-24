/* ============================================================
   CINÉMATCH — le jeu : programme ta semaine de cinéma
   ============================================================ */
const IMG = (id,w=500)=>`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

/* ---------- DONNÉES ---------- */
const FILMS = [
  { id:"lampions",   title:"Sous les lampions",    genre:"Drame",        dur:"1h32", badge:"Long", img:IMG("1533174072545-7a4b6ad7a6c3"), tags:["auteur","adulte","engage"] },
  { id:"herbes",     title:"Les mauvaises herbes", genre:"Comédie",      dur:"1h48", badge:"Long", img:IMG("1444930694458-01babf71870c"), tags:["famille","feelgood","grandpublic"] },
  { id:"echappees",  title:"Les échappées",        genre:"Documentaire", dur:"22min",badge:"Court",img:IMG("1469854523086-cc02fe5d8800"), tags:["auteur","curieux","engage","court"] },
  { id:"contrejour", title:"À contre-jour",        genre:"Thriller",     dur:"1h27", badge:"Long", img:IMG("1509248961158-e54f6934749c"), tags:["adulte","moderne","engage"] },
  { id:"vagues",     title:"Le bruit des vagues",  genre:"Romance",      dur:"18min",badge:"Court",img:IMG("1505118380757-91f5f5632de0"), tags:["famille","jeune","moderne","feelgood","court"] },
];
const film = id => FILMS.find(f=>f.id===id);

// Les salles : goûts (likes) + jours qui marchent pour leur public + capacité (jauge d'audience).
const SALLES = [
  { id:"rex",      name:"Le Rex",      sub:"Salle art & essai",  icon:"i-film",     likes:["auteur","engage","curieux","adulte"], bestDays:["jeu","ven","sam"], seats:650,
    say:["J'aime les films ",{t:"auteur",w:"d'auteur"}," et ",{t:"engage",w:"engagés"},", pour un public ",{t:"adulte",w:"adulte"}," & ",{t:"curieux",w:"curieux"},"."] },
  { id:"melies",   name:"Ciné Méliès", sub:"Jeune public & famille", icon:"i-building", likes:["famille","feelgood","grandpublic"], bestDays:["mer","sam","dim"], seats:820,
    say:["Ici on rit en ",{t:"famille",w:"famille"}," : des films ",{t:"feelgood",w:"feel-good"}," pour le ",{t:"grandpublic",w:"grand public"},"."] },
  { id:"entracte", name:"L'Entracte",  sub:"Cinéma de quartier", icon:"i-sparkles", likes:["jeune","moderne","court","engage"], bestDays:["ven","sam"], seats:430,
    say:["On veut des films ",{t:"court",w:"courts"},", ",{t:"moderne",w:"modernes"}," et ",{t:"engage",w:"engagés"},", pour un public ",{t:"jeune",w:"jeune"},"."] },
];
const salle = id => SALLES.find(s=>s.id===id);
const DAYS = [{k:"lun",l:"Lun"},{k:"mar",l:"Mar"},{k:"mer",l:"Mer"},{k:"jeu",l:"Jeu"},{k:"ven",l:"Ven"},{k:"sam",l:"Sam"},{k:"dim",l:"Dim"}];
const isWeekend = d => d==="sam"||d==="dim";

const TAG_LABELS = {auteur:"Auteur",adulte:"Adulte",engage:"Engagé",famille:"Famille",feelgood:"Feel-good",grandpublic:"Grand public",curieux:"Curieux",court:"Court",moderne:"Moderne",jeune:"Jeune"};
const tagLabel = t => TAG_LABELS[t]||t;

const GOAL = 5;           // nombre de séances à programmer pour finir la semaine
const TIERS = [{name:"Apprenti·e programmateur·rice",min:0},{name:"Programmateur·rice confirmé·e",min:1000},{name:"Chef·fe de prog",min:2500},{name:"Maestro de la prog",min:5000}];

// Badges : 3 de la maquette + 3 bonus. `test(ctx)` => débloqué ou non sur la partie jouée.
const BADGES = [
  { id:"parfait",   name:"Match Parfait",        ico:"i-star",     desc:"Toutes tes séances collent au public.",       test:c=>c.sessions.length>=GOAL && c.perfectCount===c.sessions.length },
  { id:"jeune",     name:"Spécialiste Jeune Public", ico:"i-sparkles", desc:"L'Entracte rempli avec le bon public jeune.", test:c=>c.bySalle.entracte && c.bySalle.entracte.some(x=>x.good) },
  { id:"maestro",   name:"Maestro de la Prog",   ico:"i-trophy",   desc:"Plus de 2500 spectateurs sur la semaine.",     test:c=>c.audience>=2500 },
  { id:"weekend",   name:"Roi·ne du Week-end",   ico:"i-bolt",     desc:"3 bonnes séances posées le week-end.",         test:c=>c.sessions.filter(x=>x.good && isWeekend(x.day)).length>=3 },
  { id:"coeur",     name:"Coup de cœur Public",  ico:"i-heart",    desc:"Une salle affiche complet (audience max).",    test:c=>c.sessions.some(x=>x.fillPct>=0.95) },
  { id:"complet",   name:"Semaine Bouclée",      ico:"i-check",    desc:"Les 5 séances de la semaine programmées.",     test:c=>c.sessions.length>=GOAL },
];

/* ---------- ÉTAT ---------- */
const STORE_KEY="lumiere-locale-v4";
// grid[salleId][dayKey] = filmId   (une séance = une case remplie)
// played : la projection de la semaine est lancée et FIGÉE (plus rejouable tant qu'on n'a pas vidé la grille)
const state={ points:0, grid:{}, lastPlay:null, played:false };
SALLES.forEach(s=>state.grid[s.id]={});
function monthKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`}
function save(){try{localStorage.setItem(STORE_KEY,JSON.stringify({points:state.points,lastPlay:state.lastPlay,grid:state.grid,played:state.played}))}catch(e){}}
function load(){try{const r=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");
  if(typeof r.points==="number")state.points=r.points;
  if(r.lastPlay)state.lastPlay=r.lastPlay;
  if(r.grid){SALLES.forEach(s=>{state.grid[s.id]=r.grid[s.id]||{}})}   // restaure la grille jouée
  if(r.played){state.played=true;revealed=true}                        // semaine déjà projetée → résultat figé
}catch(e){}}

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function currentTier(){let t=TIERS[0];for(const x of TIERS)if(state.points>=x.min)t=x;return t}
function nextTier(){return TIERS.find(x=>x.min>state.points)||null}

/* ---------- MOTEUR DE JEU : audience & qualité d'une séance ---------- */
// Pour une séance (salle, jour, film) → combien de spectateurs et est-ce "bon" ?
function sessionStats(sid,day,fid){
  const s=salle(sid), f=film(fid);
  const overlap = f.tags.filter(t=>s.likes.includes(t)).length;   // 0..n correspondances de goût
  const tagFit  = Math.min(1, overlap/2);                          // 0, .5, 1
  const dayFit  = s.bestDays.includes(day) ? 1 : (isWeekend(day)?0.55:0.35);
  const fill    = Math.max(0.18, 0.45*tagFit + 0.55*dayFit);       // taux de remplissage 0.18..1
  const audience= Math.round(s.seats*fill);
  const good    = overlap>0 && s.bestDays.includes(day);           // séance "réussie"
  return { audience, fill, good, overlap, tagFit, dayFit };
}
function countSessions(){let n=0;for(const sid in state.grid)n+=Object.keys(state.grid[sid]).length;return n}
function liveAudience(){let a=0;for(const sid in state.grid)for(const day in state.grid[sid])a+=sessionStats(sid,day,state.grid[sid][day]).audience;return a}

/* ---------- RENDER : catalogue ---------- */
function renderCatalogue(){
  $("#catalogue").innerHTML=FILMS.map(f=>`
    <article class="film ${f.id===selectedId?'selected':''}" draggable="true" data-id="${f.id}" tabindex="0" role="button" aria-pressed="${f.id===selectedId}" aria-label="${f.title}, ${f.genre}. Sélectionne puis place sur la grille.">
      <div class="poster" style="background-image:url('${f.img}')">
        <span class="badge">${f.badge}</span>
        <div class="ov">
          <div class="title">${f.title}</div>
          <div class="meta">${f.genre} · ${f.dur}</div>
          <div class="tags">${f.tags.map(t=>`<span class="tag" data-tag="${t}">${tagLabel(t)}</span>`).join("")}</div>
        </div>
      </div>
    </article>`).join("");
  wireFilms();
  highlightMatchingTags();
}
// quand un film est sélectionné, on surligne en vert les salles dont il matche les goûts
function highlightMatchingTags(){
  const f=selectedId?film(selectedId):null;
  $$(".salle-head").forEach(h=>{
    const s=salle(h.dataset.salle);
    $$(".say .kw",h).forEach(kw=>{
      const ok = f && f.tags.includes(kw.dataset.t);
      kw.classList.toggle("match",!!ok);
    });
    h.classList.toggle("target", !!(f && f.tags.some(t=>s.likes.includes(t))));
  });
}

/* ---------- RENDER : grille hebdo ---------- */
function renderGrid(){
  $("#grid").innerHTML = `
    <div class="grid-corner"></div>
    ${DAYS.map(d=>`<div class="grid-day ${isWeekend(d.k)?'we':''}">${d.l}</div>`).join("")}
    ${SALLES.map(s=>`
      <div class="salle-head" data-salle="${s.id}">
        <div class="sh-top"><svg><use href="#${s.icon}"/></svg><div><div class="sh-name">${s.name}</div><div class="sh-sub">${s.sub}</div></div></div>
        <p class="say">${s.say.map(p=>typeof p==="string"?p:`<span class="kw" data-t="${p.t}">${p.w}</span>`).join("")}</p>
      </div>
      ${DAYS.map(d=>{
        const fid=state.grid[s.id][d.k];
        const placed=fid?film(fid):null;
        if(placed){
          // AVANT projection : on montre juste l'affiche, PAS le score (sinon le joueur optimise sans réfléchir).
          // APRÈS projection (revealed) : on révèle l'audience et la couleur de qualité.
          const st=sessionStats(s.id,d.k,fid);
          const q = revealed ? (st.good?'good':(st.overlap>0?'mid':'bad')) : '';
          return `<button class="cell filled ${q}" data-cell="${s.id}:${d.k}" title="${placed.title}">
              <span class="cell-img" style="background-image:url('${placed.img}')"></span>
              <span class="cell-rm" data-rm="${s.id}:${d.k}" role="button" aria-label="Retirer"><svg><use href="#i-x"/></svg></span>
              ${revealed?`<span class="cell-aud"><svg><use href="#i-users"/></svg>${st.audience}</span>`:''}
            </button>`;
        }
        return `<button class="cell empty" data-cell="${s.id}:${d.k}" aria-label="${s.name}, ${d.l}, vide">
            <span class="cell-plus">+</span>
          </button>`;
      }).join("")}
    `).join("")}`;
  wireGrid();
  highlightMatchingTags();
  updateHud();
}

/* ---------- HUD de partie (audience / séances / objectif) ---------- */
function updateHud(){
  const n=countSessions();
  // L'audience reste cachée tant que la projection n'est pas lancée : suspense + vraie réflexion.
  if(revealed){const aud=liveAudience();animateNumber($("#audTotal"),+$("#audTotal").dataset.v||0,aud,500);$("#audTotal").dataset.v=aud;}
  else {$("#audTotal").textContent="?";$("#audTotal").dataset.v=0;}
  $("#sessCount").textContent=`${n}/${GOAL}`;
  $("#weekProg").style.width=Math.min(100,(n/GOAL)*100)+"%";
  if(state.played){
    $("#playBtn").disabled=true;
    $("#playBtn").innerHTML='<svg><use href="#i-check"/></svg> Semaine projetée';
    $("#playHint").textContent="Cette semaine est jouée. Vide la grille pour programmer une nouvelle semaine.";
  } else {
    $("#playBtn").disabled = n<GOAL;
    $("#playBtn").innerHTML='<svg><use href="#i-bolt"/></svg> Lancer la projection';
    $("#playHint").textContent = n<GOAL ? `Place encore ${GOAL-n} séance${GOAL-n>1?'s':''} pour lancer ta semaine` : "Ta semaine est prête — lance la projection !";
  }
}

/* ---------- INTERACTION : sélection film + pose sur grille ---------- */
let selectedId=null, dragId=null, revealed=false;   // revealed = la projection a été lancée (scores visibles)
function selectFilm(id){selectedId=(selectedId===id)?null:id;closePicker();renderCatalogue();renderGrid()}
function placeAt(sid,day,fid){ if(state.played)return; closePicker(); revealed=false; state.grid[sid][day]=fid; save(); hideResult(); renderGrid(); }
function clearAt(sid,day){ if(state.played)return; closePicker(); revealed=false; delete state.grid[sid][day]; save(); hideResult(); renderGrid(); }

function wireFilms(){$$(".film").forEach(el=>{const id=el.dataset.id;
  el.addEventListener("click",()=>selectFilm(id));
  el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectFilm(id)}});
  el.addEventListener("dragstart",e=>{dragId=id;el.classList.add("dragging");e.dataTransfer.setData("text/plain",id);e.dataTransfer.effectAllowed="copy"});
  el.addEventListener("dragend",()=>{el.classList.remove("dragging");dragId=null});
})}
function wireGrid(){
  $$(".cell").forEach(c=>{
    const [sid,day]=c.dataset.cell.split(":");
    c.addEventListener("dragover",e=>{e.preventDefault();c.classList.add("over")});
    c.addEventListener("dragleave",()=>c.classList.remove("over"));
    c.addEventListener("drop",e=>{e.preventDefault();c.classList.remove("over");const id=dragId||e.dataTransfer.getData("text/plain");if(id)placeAt(sid,day,id)});
    c.addEventListener("click",e=>{
      if(state.played){toast("Semaine déjà projetée · vide la grille pour rejouer");return}
      if(e.target.closest("[data-rm]"))return;
      if(state.grid[sid][day]){           // case pleine : on la vide
        clearAt(sid,day);
      } else if(selectedId){              // un film est déjà sélectionné en haut → on le pose direct
        placeAt(sid,day,selectedId);
      } else {                            // sinon : ouvre le choix de film juste à côté de la case
        openPicker(sid,day,c);
      }
    });
  });
  $$("[data-rm]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const[sid,day]=b.dataset.rm.split(":");clearAt(sid,day)}));
}

/* ---------- POPOVER : choisir un film directement depuis une case ---------- */
function closePicker(){const p=$("#picker");if(p)p.remove()}
function pickerKey(e){if(e.key==="Escape"){closePicker()}}
// Un SEUL gestionnaire global, posé une fois. Sur mousedown hors du popover, on ferme.
// mousedown se déclenche AVANT le click → si on clique une autre case, elle peut rouvrir un popover frais.
document.addEventListener("mousedown",e=>{
  if($("#picker") && !e.target.closest("#picker") && !e.target.closest(".cell")) closePicker();
},true);
document.addEventListener("keydown",pickerKey,true);
function openPicker(sid,day,cellEl){
  closePicker();
  const s=salle(sid), dLabel=(DAYS.find(d=>d.k===day)||{}).l;
  const pop=document.createElement("div");
  pop.id="picker";pop.className="picker";pop.setAttribute("role","dialog");pop.setAttribute("aria-label",`Choisir un film pour ${s.name}, ${dLabel}`);
  // On NE montre PAS l'audience/le score : au joueur de deviner le bon film d'après les goûts de la salle.
  // On affiche les tags du film (info neutre) + le rappel des goûts de la salle pour qu'il raisonne.
  pop.innerHTML=`
    <div class="pk-head">
      <div><div class="pk-title">${s.name} · ${dLabel}</div>
      <div class="pk-sub">À toi de choisir le film qui plaira à son public</div></div>
      <button class="pk-close" aria-label="Fermer"><svg><use href="#i-x"/></svg></button>
    </div>
    <div class="pk-list">
      ${FILMS.map(f=>`
        <button class="pk-item" data-pick="${f.id}">
          <span class="pk-poster" style="background-image:url('${f.img}')"></span>
          <span class="pk-main">
            <span class="pk-name">${f.title}</span>
            <span class="pk-meta">${f.genre} · ${f.dur}</span>
            <span class="pk-tags">${f.tags.map(t=>`<span class="pk-tag">${tagLabel(t)}</span>`).join("")}</span>
          </span>
        </button>`).join("")}
    </div>`;
  document.body.appendChild(pop);
  // si la case est hors de l'écran, on la recentre d'abord puis on positionne le popover
  const cr=cellEl.getBoundingClientRect();
  if(cr.top<70||cr.bottom>window.innerHeight-20){
    cellEl.scrollIntoView({block:"center",behavior:"auto"});
    requestAnimationFrame(()=>positionPicker(pop,cellEl));
  } else {
    positionPicker(pop,cellEl);
  }
  pop.querySelector(".pk-close").addEventListener("click",closePicker);
  $$(".pk-item",pop).forEach(b=>b.addEventListener("click",()=>placeAt(sid,day,b.dataset.pick)));
}
function positionPicker(pop,cellEl){
  const r=cellEl.getBoundingClientRect(), pw=Math.min(300,window.innerWidth-20), ph=pop.offsetHeight;
  pop.style.width=pw+"px";
  // horizontal : à droite de la case, sinon à gauche, sinon centré
  let left=r.right+10+window.scrollX;
  if(left+pw>window.scrollX+window.innerWidth-10) left=r.left+window.scrollX-pw-10;
  if(left<window.scrollX+10) left=window.scrollX+(window.innerWidth-pw)/2;
  // vertical : aligné sur la case, mais ne déborde ni en haut ni en bas du viewport
  let top=r.top+window.scrollY-6;
  const minTop=window.scrollY+10, maxTop=window.scrollY+window.innerHeight-ph-12;
  top=Math.min(Math.max(top,minTop),Math.max(minTop,maxTop));
  pop.style.left=left+"px";pop.style.top=top+"px";
}

/* ---------- VALIDATION : score, étoiles, badges ---------- */
let resultShown=false;
function buildContext(){
  const sessions=[]; const bySalle={};
  for(const sid in state.grid)for(const day in state.grid[sid]){
    const fid=state.grid[sid][day], st=sessionStats(sid,day,fid);
    const item={sid,day,fid,...st,fillPct:st.fill};
    sessions.push(item);(bySalle[sid]=bySalle[sid]||[]).push(item);
  }
  const audience=sessions.reduce((a,x)=>a+x.audience,0);
  const perfectCount=sessions.filter(x=>x.good).length;
  return {sessions,bySalle,audience,perfectCount};
}
function starsFor(score){const full=Math.round(score/20);return "★★★★★☆☆☆☆☆".slice(5-full,10-full)} // 5 étoiles pleines/vides
function verdictFor(score){if(score>=85)return "Excellent programme ! Ton public t'adore.";if(score>=65)return "Très bonne semaine — les salles sont bien remplies.";if(score>=45)return "Correct, mais quelques séances tournent à vide.";return "Semaine difficile : revois tes films et tes jours."}

// Affiche le panneau de résultat (commun au 1er lancement et à la restauration au rechargement).
function renderResult(ctx,score,unlocked,creditMsg,capped,animate){
  $("#result").classList.add("show");
  $("#rStars").textContent=starsFor(score);
  $("#rVerdict").textContent=verdictFor(score);
  $("#rAudience").textContent=ctx.audience.toLocaleString("fr-FR");
  if(animate)animateNumber($("#rScore"),0,score,900); else $("#rScore").textContent=score;
  $("#rBadges").innerHTML = BADGES.map(b=>{
    const on=unlocked.includes(b);
    return `<div class="badge-chip ${on?'on':''}" title="${b.desc}">
      <span class="bc-ic"><svg><use href="#${on?b.ico:'i-lock'}"/></svg></span>
      <span class="bc-name">${b.name}</span></div>`;
  }).join("");
  const wrap=$("#rPtsWrap"), pEl=$("#rPts");
  wrap.classList.toggle("capped",capped); pEl.textContent=creditMsg;
  resultShown=true;
}
function scoreOf(ctx){const maxAud=ctx.sessions.reduce((a,x)=>a+salle(x.sid).seats,0)||1;return Math.round(Math.min(100,(ctx.audience/maxAud)*100))}

function play(){
  if(state.played || countSessions()<GOAL) return;   // pas de relance d'une semaine déjà projetée
  closePicker();
  revealed=true; state.played=true;     // on FIGE la semaine
  renderGrid();                         // on révèle audiences & couleurs sur la grille
  const ctx=buildContext(), score=scoreOf(ctx), unlocked=BADGES.filter(b=>b.test(ctx));

  // points : crédités 1×/mois (anti-farming)
  const playedThisMonth = state.lastPlay===monthKey();
  const gained = playedThisMonth ? 0 : 150 + Math.round(score*1.5) + unlocked.length*100;
  const msg = playedThisMonth ? "Score enregistré · bonus mensuel déjà pris" : `+${gained} points fidélité`;
  renderResult(ctx,score,unlocked,msg,playedThisMonth,true);

  if(gained>0){ state.lastPlay=monthKey(); addPoints(gained,false); } else save();
  if(score>=70||unlocked.length>=3) burstConfetti();
  $("#result").scrollIntoView({behavior:"smooth",block:"center"});
  showSticky();
}
// Au rechargement d'une semaine déjà projetée : on ré-affiche le résultat figé, SANS recréditer.
function restoreResult(){
  const ctx=buildContext(); if(!ctx.sessions.length)return;
  const score=scoreOf(ctx), unlocked=BADGES.filter(b=>b.test(ctx));
  renderResult(ctx,score,unlocked,"Semaine projetée · résultat enregistré",true,false);
}
function hideResult(){if(!resultShown)return;$("#result").classList.remove("show");resultShown=false}

/* ---------- POINTS / NIVEAU ---------- */
function addPoints(n,silent){const before=currentTier().name;state.points+=n;save();renderHud();if(!silent)toast(`+${n} points`);const after=currentTier().name;if(after!==before)setTimeout(()=>{toast(`🏆 Niveau : ${after}`);burstConfetti()},700)}
function renderHud(){const tier=currentTier(),next=nextTier();
  $("#tierName").textContent=tier.name;$("#ptsNow").textContent=state.points.toLocaleString("fr-FR");$("#hudMiniPts").textContent=state.points.toLocaleString("fr-FR");
  let pct,to;
  if(next){const span=next.min-tier.min;pct=Math.max(0,Math.min(100,((state.points-tier.min)/span)*100));to=`${(next.min-state.points).toLocaleString("fr-FR")} pts → ${next.name}`}
  else{pct=100;to="Niveau max ✦"}
  $("#lvlBar").style.width=pct+"%";$("#lvlTo").textContent=to;
}

/* ---------- CONTACT MODAL ---------- */
let lastFocus=null;
function openModal(){lastFocus=document.activeElement;$("#modalBack").classList.add("show");$("#modalLive").style.display="";$("#formDone").style.display="none";setTimeout(()=>$("#f-name").focus(),80)}
function closeModal(){$("#modalBack").classList.remove("show");if(lastFocus)lastFocus.focus()}
function wireContact(){
  ["navCta","stickyBtn","convertBtn"].forEach(id=>{const el=$("#"+id);if(el)el.addEventListener("click",openModal)});
  $("#modalClose").addEventListener("click",closeModal);
  $("#modalBack").addEventListener("click",e=>{if(e.target===$("#modalBack"))closeModal()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#modalBack").classList.contains("show"))closeModal()});
  $("#contactForm").addEventListener("submit",e=>{e.preventDefault();
    const name=$("#f-name").value.trim(),email=$("#f-email").value.trim();
    if(!name){$("#f-name").focus();return}
    if(!email||!/^\S+@\S+\.\S+$/.test(email)){$("#f-email").focus();return}
    $("#modalLive").style.display="none";$("#formDone").style.display="";
    addPoints(100,true);toast("+100 points · coordonnées enregistrées");burstConfetti();
  })}

/* ---------- STICKY ---------- */
let stickyShown=false;
function showSticky(){if(stickyShown)return;stickyShown=true;$("#stickyCta").classList.add("show")}
window.addEventListener("scroll",()=>{if(window.scrollY>620)showSticky()},{passive:true});

/* ---------- RESET DÉMO (?reset=1 ou appui long sur le logo) ---------- */
function demoReset(viaUrl){
  state.points=0;state.lastPlay=null;state.played=false;SALLES.forEach(s=>state.grid[s.id]={});selectedId=null;revealed=false;closePicker();
  try{localStorage.removeItem(STORE_KEY)}catch(e){}
  save();hideResult();renderCatalogue();renderGrid();renderHud();toast("🔄 Démo réinitialisée");
  if(viaUrl){const u=new URL(location.href);u.searchParams.delete("reset");history.replaceState(null,"",u)}
}
function wireDemoReset(){
  if(new URLSearchParams(location.search).get("reset")==="1")demoReset(true);
  const logo=$("#logoBtn");if(logo){let t;
    const start=()=>{t=setTimeout(()=>demoReset(false),1200)};const stop=()=>clearTimeout(t);
    logo.addEventListener("mousedown",start);logo.addEventListener("touchstart",start,{passive:true});
    ["mouseup","mouseleave","touchend","touchcancel"].forEach(ev=>logo.addEventListener(ev,stop));
  }
}

/* ---------- FX ---------- */
let toastTimer;
function toast(m){$("#toastTxt").textContent=m;$("#toast").classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("#toast").classList.remove("show"),2600)}
function animateNumber(el,from,to,dur){const start=performance.now();function step(now){const p=Math.min(1,(now-start)/dur);const e=1-Math.pow(1-p,3);el.textContent=Math.round(from+(to-from)*e).toLocaleString("fr-FR");if(p<1)requestAnimationFrame(step)}requestAnimationFrame(step)}
function pulseAudience(){const el=$("#audCard");if(!el)return;el.classList.remove("pulse");void el.offsetWidth;el.classList.add("pulse")}
function burstConfetti(){const c=["#ffc83d","#ffe6a3","#46e0a8","#8a9bff","#ff5d7a","#b06bff"];for(let i=0;i<34;i++){const d=document.createElement("div");d.className="confetti";d.style.left=(45+Math.random()*10)+"vw";d.style.background=c[i%c.length];document.body.appendChild(d);const dx=(Math.random()-.5)*60,dy=60+Math.random()*40,rot=Math.random()*720;d.animate([{transform:"translate(0,0) rotate(0)",opacity:1},{transform:`translate(${dx}vw,${dy}vh) rotate(${rot}deg)`,opacity:0}],{duration:1400+Math.random()*700,easing:"cubic-bezier(.2,.7,.3,1)"});setTimeout(()=>d.remove(),2200)}}

/* ---------- INIT ---------- */
function init(){
  load();renderCatalogue();renderGrid();renderHud();wireContact();wireDemoReset();
  if(state.played) restoreResult();      // semaine déjà jouée → on ré-affiche le résultat figé
  $("#playBtn").addEventListener("click",play);
  $("#clearBtn").addEventListener("click",()=>{
    closePicker();SALLES.forEach(s=>state.grid[s.id]={});
    selectedId=null;revealed=false;state.played=false;   // on déverrouille pour une nouvelle semaine
    save();hideResult();renderCatalogue();renderGrid();toast("Nouvelle semaine — à toi de jouer !");
  });
}
init();
