const s=io();let me="",host=false;
const $=x=>document.querySelector(x);
function show(x){["home","lobby","game"].forEach(id=>$( "#"+id).classList.add("hidden"));$("#"+x).classList.remove("hidden")}
$("#create").onclick=()=>{me=$("#name").value.trim()||"Spieler";s.emit("create",me)};
$("#join").onclick=()=>{me=$("#name").value.trim()||"Spieler";s.emit("join",{code:$("#code").value.trim(),name:me})};
$("#start").onclick=()=>s.emit("start");$("#reset").onclick=()=>s.emit("reset");
s.on("errorMsg",m=>$("#err").textContent=m);
s.on("state",r=>{
 show(r.started?"game":"lobby"); $("#lobbyCode").textContent=r.code;
 host=r.host===s.id; $("#start").style.display=(!r.started&&host)?"block":"none";
 $("#players").innerHTML=r.players.map(p=>`<div class="player">${p.name}${p.id===r.host?" 👑":""}${p.role?` — ${p.role==="Sucher"?"🔎 Sucher":"🫣 Verstecker"}`:""}</div>`).join("");
 const p=r.players.find(x=>x.id===s.id); if(p) $("#role").textContent=p.role==="Sucher"?"🔎 DU BIST DER SUCHER":"🫣 DU BIST EIN VERSTECKER";
 $("#status").textContent=r.started?"Die Runde läuft!":"Warte auf den Start…"; tick(r.seconds);
});
s.on("tick",tick);
function tick(sec){$("#timer").textContent=`${String(Math.max(0,Math.floor(sec/60))).padStart(2,"0")}:${String(Math.max(0,sec%60)).padStart(2,"0")}`}
