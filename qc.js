// ===== QC — Margin & Clear Space (1080×1350) =====

// ---------- DOM ----------
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const upload = document.getElementById('upload');
const framePalette = document.getElementById('framePalette');

const headerBand = document.getElementById('headerBand'), hVal = document.getElementById('hVal');
const margin = document.getElementById('margin'), mVal = document.getElementById('mVal');

const gMargin = document.getElementById('gMargin');
const gGrid   = document.getElementById('gGrid');
const gSquare = document.getElementById('gSquare');
const gHeader = document.getElementById('gHeader');
const gLogo   = document.getElementById('gLogo');
const gClear  = document.getElementById('gClear');
const gHeat   = document.getElementById('gHeat');
const toggleAllBtn = document.getElementById('toggleAll');

const drawBtn   = document.getElementById('draw');
const clearRange = document.getElementById('clear'), cVal = document.getElementById('cVal');

const saveBtn = document.getElementById('save');
const saveCleanBtn = document.getElementById('saveClean');

const kpiA = document.getElementById('kpiA'), kpiB = document.getElementById('kpiB');
const kpiAh = document.getElementById('kpiAh'), kpiBh = document.getElementById('kpiBh');

// ---------- STATE ----------
let userImg = null;
let frameImg = null;
let tintCache = {};
let tintVar = '__none';   // default: tanpa tint
let logoRect = null;      // {x,y,w,h}
let drawing = false;
let startPt = null;

// ---------- PALET WARNA ----------
const COLOR_VARS = [
  {var:'__none',           name:'No Tint'},
  {var:'--goldenrod',       name:'Goldenrod'},
  {var:'--deep-teal',       name:'Deep Teal'},
  {var:'--lava-black',      name:'Lava Black'},
  {var:'--soft-beige',      name:'Soft Beige'},
  {var:'--olive-gold',      name:'Olive Gold'},
  {var:'--burnt-orange',    name:'Burnt Orange'},
  {var:'--sage-green',      name:'Sage Green'},
  {var:'--deep-mulberry',   name:'Deep Mulberry'},
  {var:'--warm-sunlight',   name:'Warm Sunlight'},
  {var:'--deep-olive',      name:'Deep Olive'},
  {var:'--soft-teal',       name:'Soft Teal'},
  {var:'--soft-clay',       name:'Soft Clay'},
  {var:'--vintage-crimson', name:'Vintage Crimson'},
  {var:'--deep-goldenrod',  name:'Deep Goldenrod'},
  {var:'--dusty-rosewood',  name:'Dusty Rosewood'},
  {var:'--midnight-blue',   name:'Midnight Blue'},
  {var:'--deep-teracotta',  name:'Deep Teracotta'},
  {var:'--dusty-pink',      name:'Dusty Pink'},
  {var:'--dark-crimson',    name:'Dark Crimson'},
];

// ---------- HELPERS ----------
function cssVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function loadImage(src){
  return new Promise((res,rej)=>{ const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=rej; im.src=src; });
}
function coverDraw(image){
  if(!image) return;
  const cw=cv.width, ch=cv.height, iw=image.width, ih=image.height;
  const cr=cw/ch, ir=iw/ih; let sx,sy,sw,sh;
  if(ir>cr){ sh=ih; sw=sh*cr; sx=(iw-sw)/2; sy=0; }
  else { sw=iw; sh=sw/cr; sx=0; sy=(ih-sh)/2; }
  ctx.drawImage(image, sx,sy,sw,sh, 0,0,cw,ch);
}
function getTintedFrame(colorVar){
  if(!frameImg) return null;
  if(colorVar==='__none') return frameImg;
  const col = cssVar(colorVar) || '#ffffff';
  const key = colorVar + '@' + cv.width + 'x' + cv.height;
  if(tintCache[key]) return tintCache[key];
  const off = document.createElement('canvas'); off.width=cv.width; off.height=cv.height;
  const octx = off.getContext('2d');
  octx.drawImage(frameImg,0,0,off.width,off.height);
  octx.globalCompositeOperation='source-in';
  octx.fillStyle = col; octx.fillRect(0,0,off.width,off.height);
  octx.globalCompositeOperation='source-over';
  tintCache[key]=off; return off;
}
function xy(e){
  const r=cv.getBoundingClientRect();
  const x=(e.clientX-r.left)*(cv.width/r.width);
  const y=(e.clientY-r.top)*(cv.height/r.height);
  return {x:Math.max(0,Math.min(cv.width,x)), y:Math.max(0,Math.min(cv.height,y))};
}

// ---------- PALETTE UI ----------
function renderFramePalette(){
  framePalette.innerHTML = '';
  COLOR_VARS.forEach(({var: v, name})=>{
    const sw = document.createElement('button');
    sw.type='button';
    sw.className = 'sw' + (v===tintVar ? ' is-active' : '') + (v==='__none' ? ' none' : '');
    if(v!=='__none') sw.style.setProperty('--col', cssVar(v) || '#777');
    sw.dataset.var = v; sw.setAttribute('data-name', name);
    framePalette.appendChild(sw);
  });
}
framePalette.addEventListener('click', (e)=>{
  const sw = e.target.closest('.sw'); if(!sw) return;
  tintVar = sw.dataset.var;
  framePalette.querySelectorAll('.sw').forEach(el => el.classList.toggle('is-active', el===sw));
  redraw();
});

// ---------- DRAW ----------
function redraw(){
  // BG
  ctx.fillStyle='#000'; ctx.fillRect(0,0,cv.width,cv.height);

  // desain
  coverDraw(userImg);

  // frame
  const f = getTintedFrame(tintVar);
  if(f) ctx.drawImage(f,0,0,cv.width,cv.height);

  // guides sesuai checklist
  drawGuides();
  if(gHeader.checked) drawHeaderBand();
  if(gLogo.checked || gClear.checked) drawLogo();
}

function drawGuides(){
  const pad = +margin.value || 80;
  ctx.save();

  if(gMargin.checked){
    ctx.strokeStyle='rgba(95,180,255,.9)'; ctx.setLineDash([8,6]); ctx.lineWidth=2;
    ctx.strokeRect(pad,pad,cv.width-2*pad,cv.height-2*pad);
  }

  if(gGrid.checked){
    ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.setLineDash([]); ctx.lineWidth=1;
    for(let x=pad;x<=cv.width-pad;x+=8){ ctx.beginPath(); ctx.moveTo(x,pad); ctx.lineTo(x,cv.height-pad); ctx.stroke(); }
    for(let y=pad;y<=cv.height-pad;y+=8){ ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(cv.width-pad,y); ctx.stroke(); }
  }

  if(gSquare.checked){
    const sq=1080, cx=(cv.width-sq)/2, cy=(cv.height-sq)/2;
    ctx.strokeStyle='rgba(34,197,94,.9)'; ctx.setLineDash([12,6]); ctx.lineWidth=2;
    ctx.strokeRect(cx,cy,sq,sq);
  }

  ctx.restore();
  mVal.textContent = pad + ' px';
}

function edgeDensity(rect, heat=false){
  const img = ctx.getImageData(rect.x, rect.y, rect.w, rect.h);
  const {data,width:w,height:h} = img;
  const step=2, th=60; let cnt=0, strong=0;
  const ov = heat? new Uint8ClampedArray(data.length) : null;

  for(let y=1;y<h-1;y+=step){
    for(let x=1;x<w-1;x+=step){
      const i=(y*w+x)*4;
      const l = 0.2126*data[i]+0.7152*data[i+1]+0.0722*data[i+2];
      const r = 0.2126*data[i+4]+0.7152*data[i+5]+0.0722*data[i+6];
      const b = 0.2126*data[i+4*w]+0.7152*data[i+4*w+1]+0.0722*data[i+4*w+2];
      const mag = Math.abs(r-l)+Math.abs(b-l);
      cnt++; if(mag>th){ strong++;
        if(heat){ for(let dy=0;dy<step;dy++){for(let dx=0;dx<step;dx++){const ix=((y+dy)*w+(x+dx))*4; ov[ix]=255; ov[ix+1]=80; ov[ix+2]=80; ov[ix+3]=220;}} }
      }
    }
  }
  if(heat){
    const im = new ImageData(ov,w,h); ctx.save(); ctx.globalAlpha=.35; ctx.putImageData(im, rect.x, rect.y); ctx.restore();
  }
  return strong/Math.max(1,cnt);
}

function drawHeaderBand(){
  const H = +headerBand.value || 180;
  const pad = +margin.value || 80;
  const region = { x:pad, y:pad, w:cv.width-2*pad, h:Math.max(0, H-pad) };
  if(region.h<=0) return;

  const density = edgeDensity(region, false);
  let col='rgba(34,197,94,1)', label='Header OK';
  if(density>0.045){ col='rgba(239,68,68,1)'; label='Header Crowded'; }
  else if(density>0.025){ col='rgba(245,158,11,1)'; label='Header Borderline'; }

  ctx.save();
  ctx.strokeStyle=col; ctx.setLineDash([14,6]); ctx.lineWidth=3;
  ctx.strokeRect(region.x, region.y, region.w, region.h);
  ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(region.x+8, region.y+8, 230, 28);
  ctx.fillStyle=col; ctx.font='bold 14px system-ui,Segoe UI';
  ctx.fillText(`${label} — edge ${(density*100).toFixed(1)}%`, region.x+14, region.y+28);
  ctx.restore();
}

function drawLogo(){
  if(!logoRect) return;
  const pad = +margin.value || 80;

  // kotak logo
  if(gLogo.checked){
    const inside = (logoRect.x>=pad && logoRect.y>=pad && logoRect.x+logoRect.w<=cv.width-pad && logoRect.y+logoRect.h<=cv.height-pad);
    ctx.save(); ctx.strokeStyle = inside? 'rgba(34,197,94,1)':'rgba(239,68,68,1)'; ctx.lineWidth=3; ctx.setLineDash([]);
    ctx.strokeRect(logoRect.x,logoRect.y,logoRect.w,logoRect.h); ctx.restore();
    kpiA.querySelector('b').className = inside? 'ok' : 'ng';
    kpiA.querySelector('b').textContent = inside? 'OK' : 'Too close';
    kpiAh.textContent = inside? `Logo di dalam margin ≥ ${pad}px` : `Jarak logo ke tepi harus ≥ ${pad}px`;
  }

  // clear space
  const factor = +clearRange.value || 1.0; cVal.textContent = factor.toFixed(1)+'×';
  const ext = Math.round(logoRect.h * factor);
  const clearRect = { x:logoRect.x-ext, y:logoRect.y-ext, w:logoRect.w+2*ext, h:logoRect.h+2*ext };
  clearRect.x=Math.max(0,clearRect.x); clearRect.y=Math.max(0,clearRect.y);
  if(clearRect.x+clearRect.w>cv.width) clearRect.w=cv.width-clearRect.x;
  if(clearRect.y+clearRect.h>cv.height) clearRect.h=cv.height-clearRect.y;

  const d = edgeDensity(clearRect, gHeat.checked);

  if(gClear.checked){
    let col='rgba(34,197,94,1)', cls='ok', label='OK';
    if(d>0.04){ col='rgba(239,68,68,1)'; cls='ng'; label='Crowded'; }
    else if(d>0.02){ col='rgba(245,158,11,1)'; cls='warn'; label='Borderline'; }
    ctx.save(); ctx.strokeStyle=col; ctx.setLineDash([10,6]); ctx.lineWidth=2;
    ctx.strokeRect(clearRect.x, clearRect.y, clearRect.w, clearRect.h); ctx.restore();
    kpiB.querySelector('b').className = cls;
    kpiB.querySelector('b').textContent = label;
    kpiBh.textContent = `Edge density di clear space: ${(d*100).toFixed(1)}%`;
  }
}

// ---------- EVENTS ----------
upload.addEventListener('change', e=>{
  const f = e.target.files?.[0]; if(!f) return;
  const url = URL.createObjectURL(f);
  const im = new Image();
  im.onload = ()=>{ URL.revokeObjectURL(url); userImg = im; redraw(); };
  im.src = url;
});

headerBand.addEventListener('input', redraw);
margin.addEventListener('input', ()=>{ mVal.textContent = (margin.value||80)+' px'; redraw(); });

[gMargin,gGrid,gSquare,gHeader,gLogo,gClear,gHeat].forEach(cb=>{
  cb.addEventListener('change', redraw);
});

toggleAllBtn.addEventListener('click', ()=>{
  const items=[gMargin,gGrid,gSquare,gHeader,gLogo,gClear,gHeat];
  const onCount = items.filter(i=>i.checked).length;
  const toState = onCount > items.length/2 ? false : true;
  items.forEach(i=> i.checked = toState);
  toggleAllBtn.textContent = `Semua Guide: ${toState ? 'OFF' : 'ON'}`;
  redraw();
});

drawBtn.addEventListener('click', ()=>{ logoRect=null; drawing=true; startPt=null; });

cv.addEventListener('mousedown', e=>{ if(!drawing) return; startPt = xy(e); });
cv.addEventListener('mousemove', e=>{
  if(!drawing || !startPt) return;
  const p = xy(e);
  logoRect = { x:Math.min(startPt.x,p.x), y:Math.min(startPt.y,p.y),
               w:Math.abs(p.x-startPt.x), h:Math.abs(p.y-startPt.y) };
  redraw();
});
cv.addEventListener('mouseup', ()=>{ drawing=false; startPt=null; redraw(); });

saveBtn.addEventListener('click', ()=>{
  const a=document.createElement('a'); a.href=cv.toDataURL('image/png'); a.download='qc-annotated.png'; a.click();
});

saveCleanBtn.addEventListener('click', ()=>{
  const off=document.createElement('canvas'); off.width=cv.width; off.height=cv.height;
  const octx=off.getContext('2d');
  octx.fillStyle='#000'; octx.fillRect(0,0,off.width,off.height);
  if(userImg){
    const iw=userImg.width, ih=userImg.height, cw=off.width, ch=off.height, cr=cw/ch, ir=iw/ih;
    let sx,sy,sw,sh;
    if(ir>cr){ sh=ih; sw=sh*cr; sx=(iw-sw)/2; sy=0; } else { sw=iw; sh=sw/cr; sx=0; sy=(ih-sh)/2; }
    octx.drawImage(userImg, sx,sy,sw,sh, 0,0,cw,ch);
  }
  const fr=getTintedFrame(tintVar); if(fr) octx.drawImage(fr,0,0,off.width,off.height);
  const a=document.createElement('a'); a.href=off.toDataURL('image/png'); a.download='qc-clean.png'; a.click();
});

// ---------- BOOT ----------
(async function boot(){
  // set nilai awal
  mVal.textContent = (margin.value||80)+' px';
  // ⬇️ PATH FRAME untuk setup file di ROOT
  frameImg = await loadImage('./frame-default.png');
  renderFramePalette();
  redraw(); // tampilkan margin/grid/safe sejak awal
})();
