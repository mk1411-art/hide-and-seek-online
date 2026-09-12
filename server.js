const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const lobbies = new Map();

app.use(express.static("."));

function makeCode() {
  let c;
  do c = String(Math.floor(1000 + Math.random() * 9000));
  while (lobbies.has(c));
  return c;
}

function state(room) {
  return {
    code: room.code,
    host: room.host,
    started: room.started,
    seconds: room.seconds,
    players: [...room.players.values()].map(p => ({
      id: p.id, name: p.name, role: room.started ? p.role : null
    }))
  };
}

io.on("connection", socket => {
  socket.on("create", name => {
    const code = makeCode();
    const room = {code, host: socket.id, started:false, seconds:600, players:new Map(), timer:null};
    room.players.set(socket.id, {id:socket.id, name:(name||"Spieler").slice(0,20), role:null});
    lobbies.set(code, room);
    socket.join(code);
    socket.data.room = code;
    io.to(code).emit("state", state(room));
  });

  socket.on("join", ({code,name}) => {
    const room = lobbies.get(String(code||"").trim());
    if (!room || room.started) return socket.emit("errorMsg","Lobby nicht gefunden oder Runde läuft schon.");
    room.players.set(socket.id,{id:socket.id,name:(name||"Spieler").slice(0,20),role:null});
    socket.join(room.code);
    socket.data.room=room.code;
    io.to(room.code).emit("state",state(room));
  });

  socket.on("start", () => {
    const room=lobbies.get(socket.data.room);
    if (!room || room.host!==socket.id || room.players.size<2) return;
    const players=[...room.players.values()];
    players.forEach(p=>p.role="Verstecker");
    players[Math.floor(Math.random()*players.length)].role="Sucher";
    room.started=true; room.seconds=600;
    io.to(room.code).emit("state",state(room));
    clearInterval(room.timer);
    room.timer=setInterval(()=>{
      room.seconds--;
      io.to(room.code).emit("tick",room.seconds);
      if(room.seconds<=0){clearInterval(room.timer);room.timer=null;}
    },1000);
  });

  socket.on("reset",()=>{
    const room=lobbies.get(socket.data.room);
    if(!room || room.host!==socket.id) return;
    clearInterval(room.timer);
    room.started=false; room.seconds=600;
    room.players.forEach(p=>p.role=null);
    io.to(room.code).emit("state",state(room));
  });

  socket.on("disconnect",()=>{
    const room=lobbies.get(socket.data.room);
    if(!room) return;
    room.players.delete(socket.id);
    if(room.host===socket.id){
      clearInterval(room.timer);
      if(room.players.size) room.host=room.players.keys().next().value;
      else {lobbies.delete(room.code);return;}
    }
    io.to(room.code).emit("state",state(room));
  });
});

app.get("/",(req,res)=>res.sendFile(__dirname+"/index.html"));
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Hide & Seek läuft auf Port ${PORT}`));
