const canvas=document.getElementById("game"), ctx=canvas.getContext("2d"), W=canvas.width, H=canvas.height;

const runnerSprite=new Image();runnerSprite.src="runnerSprite.png";

const keys={};

const state={
             x:130,
             y:570,
             w:20,
             h:44,
             vx:0,
             vy:0,
             onGround:false,
             stamina:100,
             hp:100,
             stress:0,
             momentum:0,
             credits:250,
             grapples:3,
             sliding:false,
             facing:1,
             complete:false,
             cameraX:0
            };

const platforms=[
  {x:0,y:650,w:900,h:70,type:"street"},
  {x:900,y:650,w:700,h:70,type:"street"},
  {x:40,y:510,w:260,h:140,type:"building"},
  {x:75,y:420,w:225,h:90,type:"building"},
  {x:105,y:330,w:195,h:90,type:"building"},
  {x:135,y:240,w:165,h:90,type:"building"},
  {x:340,y:565,w:150,h:85,type:"building"},
  {x:390,y:475,w:150,h:90,type:"building"},
  {x:440,y:385,w:145,h:90,type:"building"},
  {x:610,y:500,w:230,h:150,type:"building"},
  {x:650,y:410,w:190,h:90,type:"building"},
  {x:690,y:320,w:150,h:90,type:"building"},
  {x:730,y:230,w:110,h:90,type:"building"},
  {x:930,y:540,w:260,h:110,type:"building"},
  {x:950,y:450,w:240,h:90,type:"building"},
  {x:980,y:360,w:210,h:90,type:"building"},
  {x:1010,y:270,w:180,h:90,type:"building"},
  {x:1040,y:180,w:150,h:90,type:"building"},
  {x:300,y:530,w:60,h:12,type:"metal"},
  {x:540,y:435,w:70,h:12,type:"metal"},
  {x:840,y:355,w:100,h:12,type:"metal"},
  {x:900,y:270,w:110,h:12,type:"metal"},
  {x:1090,y:105,w:150,h:75,type:"roof"}
];

const windows=[];
  for(const p of platforms)
    if(p.type==="building")
    for(let x=p.x+18;x<p.x+p.w-20;x+=42)
    if(p.y<620)windows.push({x,y:p.y+24,w:18,h:25});

const hazards=[{x:560, y:620, w:30, h:30},
               {x:875, y:620, w:30, h:30}
              ];

const beacon={x:1150, y:55, w:28, h:50};

function reset(){
  Object.assign(state,{
    x:130,
    y:570,
    vx:0,
    vy:0,
    onGround:false,
    stamina:100,
    hp:100,
    stress:0,
    momentum:0,
    credits:250,
    grapples:3,
    sliding:false,
    facing:1,
    complete:false,
    cameraX:0
  }
);
  
  document.getElementById("objective").textContent="Reach the rooftop relay beacon."}

function clamp(v,a,b){ return Math.max( a,Math.min(b,v) ) }

function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}

function jump(){if(!state.onGround||state.stamina<12)return;
                state.vy=-475;
                state.onGround=false;state.stamina-=12;state.momentum=clamp(state.momentum+1,0,5)
               }

function grapple(){
  if(state.grapples<=0)return;
  const d=state.facing,
    c=platforms
    .filter(p=>p.y+p.h<state.y+20)
    .filter(p=>d>0?p.x>state.x:p.x+p.w<state.x)
    .filter(p=>Math.abs(p.x+p.w/2-(state.x+state.w/2))<300)
    .sort((a,b)=>Math.abs(a.y-state.y)-Math.abs(b.y-state.y));
  if(!c.length)return;const p=c[0];
  state.x=clamp(p.x+p.w/2-state.w/2,
                p.x,p.x+p.w-state.w
               );
  state.y=p.y-state.h-1;
  state.vx=d*80;
  state.vy=0;
  state.onGround=true;
  state.grapples--;
  state.momentum=clamp(state.momentum+1,0,5)
}

function update(dt){
  const l=keys.a||keys.arrowleft,r=keys.d||keys.arrowright;
  
  if(l){state.vx-=1450*dt;state.facing=-1}
  if(r){state.vx+=1450*dt;state.facing=1}
  if(!l&&!r)state.vx*=Math.pow(.8,dt*60);
  
  state.vx=clamp(state.vx,-285,285);
  
  if(keys.shift&&state.onGround&&Math.abs(state.vx)>80&&!state.sliding)
  {state.sliding=true;state.h=34;state.y+=20}if(!keys.shift&&state.sliding)
  {state.sliding=false;state.y-=20;state.h=54}
  
  state.stamina=clamp(state.stamina+(keys.shift?2:10)*dt,0,100);
  
const prev=state.y;state.vy+=1100*dt;state.x+=state.vx*dt;state.y+=state.vy*dt;state.onGround=false;
  
  for(const p of platforms){if(state.vy>=0&&prev+state.h<=p.y+4&&state.y+state.h>=p.y&&state.x+state.w>p.x&&state.x<p.x+p.w){state.y=p.y-state.h;state.vy=0;state.onGround=true;break}}
  for(const p of platforms)if(overlap(state,p)){if(state.vx>0)state.x=p.x-state.w;else if(state.vx<0)state.x=p.x+p.w;state.vx=0}
  
  state.x=clamp(state.x,0,1530-state.w);
  
  if(state.onGround&&Math.abs(state.vx)>170)state.momentum=clamp(state.momentum+dt*.6,0,5);else if(!state.onGround)state.momentum=clamp(state.momentum-dt*.15,0,5);
  for(const h of hazards)if(overlap(state,h)){state.hp=clamp(state.hp-15*dt,0,100);state.stress=clamp(state.stress+10*dt,0,100);state.vx*=.75}
  if(state.stress>=100){state.stress=70;state.momentum=0;state.stamina=30}
  if(overlap(state,beacon)){state.complete=true;state.credits+=180;document.getElementById("objective").textContent="Route complete — +180 credits."}
  if(state.y>H+100){state.hp-=25;state.x=130;state.y=570;state.vx=state.vy=0;state.stress=clamp(state.stress+10,0,100)}

  const target=clamp(state.x-420,0,400);state.cameraX+=(target-state.cameraX)*Math.min(1,dt*6);
  
}

function background(){
  
  const g=ctx.createLinearGradient(0,0,0,H);
  
  g.addColorStop(0,"#0a2027");
  g.addColorStop(.6,"#16272b");
  g.addColorStop(1,"#0b1518");
  
  ctx.fillStyle=g;ctx.
    fillRect(0,0,W,H);ctx.save();
  
  ctx.translate(-state.cameraX*.25,0);
  ctx.fillStyle="#10252a";
  
  for(let x=-100;x<1800;x+=120){
    let h=120+(((x*17)%170)+170)%170;ctx.fillRect(x,650-h,85,h)
  }
  
  ctx.restore()
}

function drawMap(){
  const cam=state.cameraX;
  for(const p of platforms){
    if(p.type==="building"||p.type==="roof"){
      
      ctx.fillStyle=p.type==="roof"?"#243b40":"#1b3035";ctx.fillRect(p.x-cam,p.y,p.w,p.h);
      ctx.fillStyle="#28474b";ctx.fillRect(p.x-cam,p.y,p.w,6)}else if(p.type==="street"){
      ctx.fillStyle="#121e22";ctx.fillRect(p.x-cam,p.y,p.w,p.h);ctx.fillStyle="#345258";
      ctx.fillRect(p.x-cam,p.y,p.w,5)
    }
      
    else if(p.type==="metal"){
      ctx.fillStyle="#647b7d";
      ctx.fillRect(p.x-cam,p.y,p.w,p.h);
      ctx.fillStyle="#a4c2c1";
      ctx.fillRect(p.x-cam,p.y,p.w,2)
    }
  }
  

  for(const w of windows){
    
    ctx.fillStyle="#6aa6a5";
    ctx.fillRect(w.x-cam,w.y,w.w,w.h);
    ctx.fillStyle="#102327";
    ctx.fillRect(w.x-cam+3,w.y+3,w.w-6,w.h-6)
}

  for(const h of hazards){
    ctx.fillStyle="#8b7250";
    ctx.fillRect(h.x-cam,h.y,h.w,h.h)
  }
  ctx.fillStyle="#4d686a";[ [175,205,38,35], [710,195,34,35], [1090,150,38,30] ]
    .forEach(p=>ctx.fillRect(p[0]-cam,p[1],p[2],p[3]));
ctx.strokeStyle="#71898b";ctx.lineWidth=4;[505,415,325].forEach(y=>{ctx.beginPath();ctx.moveTo(292-cam,y);ctx.lineTo(325-cam,y);ctx.lineTo(325-cam,y+80);ctx.stroke()});
}

function drawBeacon(){
  const x=beacon.x-state.cameraX;
  ctx.fillStyle="#233f42";
  ctx.fillRect(x-12,beacon.y+18,52,10);
  ctx.fillStyle=state.complete?"#8ee8c4":"#62d9d1";
  ctx.fillRect(x,beacon.y,beacon.w,beacon.h);
  ctx.fillStyle="#d8ffff";ctx.font="12px Arial";
  ctx.fillText("ROOFTOP RELAY",x-35,beacon.y-28)
}

function drawRunner(){
  
  const x=state
    .x-state.cameraX,
    y=state.y;
  
  if(runnerSprite.complete&&runnerSprite.naturalWidth){
    
    const sw=state.sliding?41:45,
      sh=state.sliding?36:66;
    ctx.save();
    
    if(state.facing<0){
      
      ctx.translate(x+state.w,0);
      ctx.scale(-1,1);
      ctx.drawImage(runnerSprite, -8,y+state.h-sh,sw, sh)
    
    }
    
    else ctx.drawImage(runnerSprite,x-8,y+state.h-sh,sw,sh);ctx.restore()}
  
  else{ctx.fillStyle="#d7eceb";
       ctx.fillRect(x+7,y+8,13,17);
       ctx.fillStyle="#69e3c4";
       ctx.fillRect(x+5,y+4,17,9);
       ctx.fillStyle="#c4ffff";
       ctx.fillRect(x+8,y,11,8);
       ctx.fillStyle="#69e3c4";
       ctx.fillRect(x+4,y+25,7,17);
       ctx.fillRect(x+15,y+25,7,17)
      }
}

function hud(){
  ctx.fillStyle="rgba(4,12,15,.75)";
  ctx.fillRect(18,18,280,122);
  ctx.fillStyle="#d9f7f5";
  ctx.font="bold 14px Arial";
  ctx.fillText("RUNNER STATUS",32,42);[
    ["HP",state.hp],
    ["STAMINA",state.stamina],
    ["STRESS",state.stress],
    ["MOMENTUM",state.momentum*20]
  ]
    .forEach((b,i)=>{let y=58+i*19;ctx.fillStyle="#1d3539";ctx.fillRect(32,y,170,10);ctx.fillStyle="#7fe4db";
                     ctx.fillRect(32,y,170*clamp(b[1],0,100)/100,10);
                     ctx.fillStyle="#9fb8b8";
                     ctx.font="10px Arial";
                     ctx.fillText(b[0]+" "+Math.round(b[1]),210,y+9)
                    }
            );
  
  ctx.fillStyle="#d9f7f5";
  ctx.font="12px Arial";
  ctx.fillText("Credits: "+state.credits,32,137);
  ctx.fillText("Grapples: "+state.grapples,145,137)
}

function draw(){
  background();
  drawMap();
  drawBeacon();
  drawRunner();
  hud();
  
  if(state.complete){
    ctx.fillStyle="rgba(4,13,15,.78)";
    ctx.fillRect(0,0,W,H);
    ctx.textAlign="center";
    ctx.fillStyle="#8ee8c4";
    ctx.font="bold 34px Arial";
    ctx.fillText("ROUTE COMPLETE",W/2,H/2-25);
    ctx.fillStyle="#d9f7f5";
    ctx.font="16px Arial";
    ctx.fillText("+180 CREDITS",W/2,H/2+12);
    ctx.fillText("Press R to run again.",W/2,H/2+44);
    ctx.textAlign="left"}
}

addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;
                               if([" ","arrowup","arrowdown","arrowleft","arrowright"]
                                  .includes(e.key.toLowerCase()))e.preventDefault();
                               if([" ","w","arrowup"]
                                  .includes(e.key.toLowerCase()))jump();
                               if(e.key.toLowerCase()==="f")grapple();
                               if(e.key.toLowerCase()==="r")reset()});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);

let last=performance.now();function loop(now){let dt=Math.min((now-last)/1000,.033);last=now;update(dt);draw();requestAnimationFrame(loop)}reset();requestAnimationFrame(loop);
