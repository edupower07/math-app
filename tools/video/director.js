/* 画面録画用ディレクター: ズーム / カーソル / テロップ / カード を実ページに合成 */
window.DIR = {
  _s:1,_tx:0,_ty:0,wrap:null,
  init(){
    const w=document.createElement('div'); w.id='dzoom';
    w.style.cssText='transform-origin:0 0;will-change:transform;transition:transform .9s cubic-bezier(.4,0,.2,1);';
    while(document.body.firstChild) w.appendChild(document.body.firstChild);
    document.body.appendChild(w); this.wrap=w;
    document.documentElement.style.overflow='hidden';
    const L=document.createElement('div'); L.id='dlayer';
    L.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none;'+
      'font-family:"Hiragino Maru Gothic ProN","Noto Sans JP","Hiragino Sans",sans-serif;';
    L.innerHTML=`
      <svg id="dcursor" viewBox="0 0 24 24" style="position:absolute;width:54px;height:54px;left:960px;top:700px;
        filter:drop-shadow(2px 3px 5px rgba(0,0,0,.65));transition:left .01s,top .01s;z-index:20">
        <path d="M5.5 3.2 L5.5 20.5 L9.7 16.6 L12.2 22 L15 20.7 L12.5 15.4 L18.2 15 Z"
          fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>
      <div id="dring" style="position:absolute;display:none;border:7px solid #ff5252;border-radius:16px;
        box-shadow:0 0 0 5px rgba(255,82,82,.25),0 0 34px rgba(255,82,82,.55);z-index:15"></div>
      <div id="dbrand" style="position:absolute;right:40px;top:34px;color:#e8d5a8;font-size:30px;font-weight:800;
        background:rgba(26,19,11,.62);padding:9px 22px;border-radius:999px">🔎 名探偵！かずのひみつ</div>
      <div id="dchip" style="position:absolute;left:44px;top:34px;display:none;background:rgba(26,19,11,.86);
        border:2px solid rgba(214,175,95,.6);color:#f0e0bd;font-size:34px;font-weight:800;padding:10px 26px;border-radius:999px"></div>
      <div id="dtelop" style="position:absolute;left:0;right:0;bottom:46px;text-align:center;opacity:0;
        transition:opacity .25s,transform .25s;transform:translateY(18px)"></div>
      <div id="dcard" style="position:absolute;inset:0;display:none;flex-direction:column;align-items:center;
        justify-content:center;text-align:center;opacity:0;transition:opacity .4s;
        background:radial-gradient(1200px 700px at 50% 35%,#2d2417 0%,#14100a 100%)"></div>`;
    document.body.appendChild(L);
  },
  apply(dur){ this.wrap.style.transitionDuration=(dur==null?0.9:dur)+'s';
    this.wrap.style.transform=`translate(${this._tx}px,${this._ty}px) scale(${this._s})`; },
  pageRect(el){ const r=el.getBoundingClientRect();
    return {x:(r.left-this._tx)/this._s, y:(r.top-this._ty)/this._s, w:r.width/this._s, h:r.height/this._s}; },
  zoom(sel,pad,dur){ const el=document.querySelector(sel); if(!el) return false;
    const r=this.pageRect(el); const px=r.w*(pad==null?.05:pad), py=r.h*(pad==null?.05:pad);
    const R={x:r.x-px,y:r.y-py,w:r.w+px*2,h:r.h+py*2};
    const s=Math.min(innerWidth/R.w, innerHeight/R.h);
    this._s=s; this._tx=innerWidth/2-(R.x+R.w/2)*s; this._ty=innerHeight/2-(R.y+R.h/2)*s;
    this.apply(dur); return true; },
  zoomRect(x,y,w,h,dur){ const s=Math.min(innerWidth/w, innerHeight/h);
    this._s=s; this._tx=innerWidth/2-(x+w/2)*s; this._ty=innerHeight/2-(y+h/2)*s; this.apply(dur); },
  reset(dur){ this._s=1;this._tx=0;this._ty=0; this.apply(dur); },
  /* 画面座標(クリック用) */
  at(sel){ const el=document.querySelector(sel); if(!el) return null;
    const r=el.getBoundingClientRect(); return {x:r.left+r.width/2, y:r.top+r.height/2, w:r.width, h:r.height}; },
  cursor(x,y,ms){ const c=document.getElementById('dcursor');
    c.style.transition=`left ${ms/1000}s cubic-bezier(.3,0,.2,1), top ${ms/1000}s cubic-bezier(.3,0,.2,1)`;
    c.style.left=(x-10)+'px'; c.style.top=(y-8)+'px'; },
  pulse(x,y){ const d=document.createElement('div');
    d.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:0;height:0;border:6px solid #ffca28;
      border-radius:50%;z-index:18;transform:translate(-50%,-50%);opacity:1;transition:all .55s ease-out`;
    document.getElementById('dlayer').appendChild(d);
    requestAnimationFrame(()=>{d.style.width='150px';d.style.height='150px';d.style.opacity='0';});
    setTimeout(()=>d.remove(),650); },
  ring(sel){ const el=document.querySelector(sel); const g=document.getElementById('dring');
    if(!el){g.style.display='none';return;} const r=el.getBoundingClientRect(); const p=16;
    g.style.display='block'; g.style.left=(r.left-p)+'px'; g.style.top=(r.top-p)+'px';
    g.style.width=(r.width+p*2)+'px'; g.style.height=(r.height+p*2)+'px'; },
  ringOff(){ document.getElementById('dring').style.display='none'; },
  telop(html,step){ const t=document.getElementById('dtelop');
    if(!html){ t.style.opacity=0; t.style.transform='translateY(18px)'; return; }
    const b=step?`<span style="display:inline-block;background:#b03a2e;color:#fff;border-radius:10px;
      font-size:44px;padding:2px 20px;margin-right:16px;vertical-align:4px">${step}</span>`:'';
    t.innerHTML=`<span style="display:inline-block;background:rgba(26,19,11,.9);color:#fff;font-size:56px;
      font-weight:800;line-height:1.32;padding:16px 46px;border-radius:14px;border:2px solid rgba(214,175,95,.65);
      box-shadow:0 10px 30px rgba(0,0,0,.45)">${b}${html}</span>`;
    t.style.opacity=1; t.style.transform='translateY(0)'; },
  chip(txt){ const c=document.getElementById('dchip');
    if(!txt){c.style.display='none';return;} c.style.display='block'; c.textContent=txt; },
  card(o){ const c=document.getElementById('dcard');
    if(!o){ c.style.opacity=0; setTimeout(()=>{if(c.style.opacity==='0')c.style.display='none';},420); return; }
    let h='';
    if(o.stamp) h+=`<div style="position:absolute;top:70px;right:90px;transform:rotate(11deg);border:6px double #b03a2e;
      color:#b03a2e;border-radius:10px;font-size:46px;font-weight:900;letter-spacing:6px;padding:8px 30px;opacity:.75">${o.stamp}</div>`;
    h+=`<div style="font-size:100px;font-weight:900;color:#f2e4c6;line-height:1.28;text-shadow:2px 4px 0 rgba(0,0,0,.4)">${o.main}</div>`;
    if(o.sub) h+=`<div style="margin-top:26px;font-size:42px;color:#d6c096;font-weight:700">${o.sub}</div>`;
    if(o.list){ h+='<div style="margin-top:34px;text-align:left">'+o.list.map((x,i)=>
      `<div class="dli" data-i="${i}" style="display:flex;align-items:center;gap:22px;font-size:46px;font-weight:800;
        color:#6b5c44;margin:14px 0;opacity:.35"><span class="dck" style="width:56px;height:56px;flex:none;border-radius:50%;
        border:4px solid #6b5c44;display:flex;align-items:center;justify-content:center;font-size:34px;color:transparent">✔</span>${x}</div>`).join('')+'</div>'; }
    else h+=`<div style="margin-top:40px;display:flex;gap:8px">
      <span style="width:70px;height:12px;border-radius:3px;background:#2f6f8f"></span>
      <span style="width:70px;height:12px;border-radius:3px;background:#5f7a34"></span>
      <span style="width:70px;height:12px;border-radius:3px;background:#b03a2e"></span>
      <span style="width:70px;height:12px;border-radius:3px;background:#c47a24"></span></div>`;
    c.innerHTML=h; c.style.display='flex'; requestAnimationFrame(()=>{c.style.opacity=1;}); },
  checkItem(i){ const el=document.querySelector(`.dli[data-i="${i}"]`); if(!el) return;
    el.style.color='#f2e4c6'; el.style.opacity='1';
    const ck=el.querySelector('.dck'); ck.style.background='#5f7a34'; ck.style.borderColor='#5f7a34'; ck.style.color='#fff'; },
  hideUI(h){ document.getElementById('dbrand').style.display=h?'none':'block';
    if(h) document.getElementById('dchip').style.display='none'; }
};
