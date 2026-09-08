const canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d");
const W=canvas.width,H=canvas.height;
const keys={}; let state, last=performance.now(), won=false;

const platforms=[
 {x:0,y:430,w:210,h:70},{x:265,y:365,w:150,h:18},{x:470,y:300,w:135,h:18},
 {x:650,y:390,w:120,h:18},{x:820,y:330,w:80,h:18},{x:785,y:430,w:115,h:70}
];
const hazards=[{x:210,y:430,w:55,h:70},{x:415,y:365,w:55,h:65},{x:605,y:300,w:45,h:130},{x:770,y:390,w:50,h:110}];
const beacon={x:845,y:270,w:24,h:60};

function reset(){
 state={x:55,y:370,vx:0,vy:0,w:24,h:42,onGround:false,stamina:100,hp:100,stress:0,momentum:0,
 credits:250,grapples:3,deliver:true,slide:0,grace:0};
 won=false; document.getElementById("overlay").classList.add("hidden"); log("RUN STARTED. Package secured.");
}
function log(s){const el=document.getElementById("log");el.innerHTML=`<div class="log-line"><b>›</b> ${s}</div>`+el.innerHTML}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function collideRect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function jump(){if(state.onGround&&state.stamina>=12){state.vy=-440;state.stamina-=12;state.onGround=false;log("Jump.")}
}
function grapple(){
 if(state.grapples<=0)return log("No grappler charges left.");
 // A short teleport-like pull toward the next upper platform.
 const target=platforms.find(p=>p.x>state.x+30 && p.y<state.y+20);
 if(!target)return log("No reachable grapple anchor.");
 state.x=clamp(target.x-34,0,W-state.w);state.y=target.y-state.h-3;state.vy=0;
 state.grapples--;state.momentum=clamp(state.momentum+1,0,5);log("Grapple deployed. Momentum +1.");
}
function interact(){
 if(state.x+state.w>beacon.x-20&&state.x<beacon.x+beacon.w+20&&state.y<beacon.y+70){
   if(!won){won=true;state.credits+=180;showOverlay("✓","DELIVERY COMPLETE","Relay Station 04 received the medical package. Reward: ¢180. Your first route is officially complete.");}
 } else log("Nothing to interact with here.");
}
function showOverlay(icon,title,text){document.getElementById("overlayIcon").textContent=icon;document.getElementById("overlayTitle").textContent=title;document.getElementById("overlayText").textContent=text;document.getElementById("overlay").classList.remove("hidden")}

addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.code==="Space"){e.preventDefault();jump()}if(e.key.toLowerCase()==="f")grapple();if(e.key.toLowerCase()==="e")interact()});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
document.getElementById("restartBtn").onclick=reset;
document.getElementById("continueBtn").onclick=()=>{document.getElementById("overlay").classList.add("hidden");log("Route complete. More Skyline routes await.");};

function update(dt){
 if(won)return;
 const left=keys.a||keys.arrowleft,right=keys.d||keys.arrowright,sliding=keys.shift;
 let dir=(right?1:0)-(left?1:0);
 const speed=sliding?190:250;
 if(dir!==0){state.vx += (dir*speed-state.vx)*Math.min(1,dt*10);state.stamina-=dt*(sliding?8:3)}
 else state.vx*=Math.pow(.001,dt);
 if(sliding&&state.onGround)state.slide=.25; else state.slide=Math.max(0,state.slide-dt);
 if(state.onGround&&state.stamina<100)state.stamina+=dt*17;
 state.stamina=clamp(state.stamina,0,100);

 state.vy+=980*dt; state.x+=state.vx*dt;state.y+=state.vy*dt;
 state.onGround=false;

 for(const p of platforms){
   if(state.x+state.w>p.x&&state.x<p.x+p.w&&state.y+state.h>=p.y&&state.y+state.h<=p.y+Math.max(22,state.vy*dt+10)&&state.vy>=0){
     state.y=p.y-state.h;state.vy=0;state.onGround=true;
   }
 }
 state.x=clamp(state.x,0,W-state.w);

 // Fall / Pale exposure.
 if(state.y>H+80){state.hp-=20;state.stress+=8;state.momentum=0;state.x=55;state.y=360;state.vy=0;log("You missed the route. Pale exposure +8 Stress.");}
 // Hazard zones.
 const foot={x:state.x+4,y:state.y+state.h-3,w:state.w-8,h:8};
 if(hazards.some(h=>collideRect(foot,h))){state.hp-=dt*10;state.stress+=dt*2.5;state.momentum=0}
 // Momentum from sustained movement.
 if(Math.abs(state.vx)>180&&state.onGround){state.grace+=dt;if(state.grace>2.2){state.momentum=clamp(state.momentum+1,0,5);state.grace=0;log("Clean route chain. Momentum +1.")}}
 else state.grace=0;
 // Pale slowly increases in lower route.
 state.stress=clamp(state.stress,0,100);
 if(state.stress>=100){state.stress=72;state.momentum=0;state.stamina=35;log("BREAKING POINT. You lose your rhythm and recover.");}
 if(state.hp<=0){state.hp=100;state.stress=55;state.x=55;state.y=360;state.momentum=0;log("Run failed. The Guild sends a recovery team.");}
 updateUI();
}
function updateUI(){
 const pct=(v,max)=>`${clamp(v/max*100,0,100)}%`;
 hpBar.style.width=pct(state.hp,100);staminaBar.style.width=pct(state.stamina,100);stressBar.style.width=pct(state.stress,100);
 hpText.textContent=`${Math.ceil(state.hp)}/100`;staminaText.textContent=`${Math.ceil(state.stamina)}/100`;stressText.textContent=`${Math.ceil(state.stress)}/100`;
 credits.textContent=state.credits;grappleText.textContent=`${state.grapples}/3`;
 momentumDots.textContent=[0,1,2,3,4].map(i=>i<state.momentum?"●":"○").join(" ");
 flowText.textContent=["Stalled","Moving","Rhythm","Flow","Locked In","Flow State"][state.momentum];
 paleStatus.textContent=state.stress>65?"Moderate":state.stress>30?"Light / shifting":"Light";
}
function draw(){
 ctx.clearRect(0,0,W,H);
 // sky and skyline
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#102a33");g.addColorStop(1,"#071116");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.fillStyle="#132a32";
 for(let x=0;x<W;x+=70){let h=80+((x*17)%150);ctx.fillRect(x,430-h,48,h)}
 ctx.fillStyle="rgba(190,240,230,.035)";for(let i=0;i<18;i++){ctx.fillRect(0,i*29,W,1)}
 // pale fog
 const fog=ctx.createLinearGradient(0,220,0,500);fog.addColorStop(0,"rgba(210,235,232,0)");fog.addColorStop(1,"rgba(185,220,215,.09)");ctx.fillStyle=fog;ctx.fillRect(0,0,W,H);
 for(const h of hazards){ctx.fillStyle="#3b262d";ctx.fillRect(h.x,h.y,h.w,h.h);ctx.fillStyle="#8b4855";for(let x=h.x+7;x<h.x+h.w;x+=13)ctx.fillRect(x,h.y+8,5,5)}
 for(const p of platforms){ctx.fillStyle="#29444c";ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle="#5d858c";ctx.fillRect(p.x,p.y,p.w,3)}
 // beacon
 ctx.fillStyle="#69e3c4";ctx.fillRect(beacon.x,beacon.y,beacon.w,beacon.h);ctx.fillStyle="rgba(105,227,196,.15)";ctx.fillRect(beacon.x-25,beacon.y-25,75,110);
 ctx.fillStyle="#c4fff1";ctx.font="bold 11px Arial";ctx.fillText("RELAY 04",beacon.x-8,beacon.y-10);
 // runner
 ctx.save();ctx.translate(state.x,state.y);
 ctx.fillStyle="#d7eceb";ctx.fillRect(7,8,13,17);ctx.fillStyle="#69e3c4";ctx.fillRect(5,4,17,9);
 ctx.fillStyle="#c4fff1";ctx.fillRect(8,0,11,8);ctx.fillStyle="#69e3c4";ctx.fillRect(4,25,7,17);ctx.fillRect(15,25,7,17);
 ctx.fillStyle="#29444c";ctx.fillRect(2,39,10,3);ctx.fillRect(15,39,10,3);
 ctx.restore();
}
function loop(t){const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);draw();requestAnimationFrame(loop)}
reset();requestAnimationFrame(loop);
