import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=express(),PORT=process.env.PORT||3000,TOKEN=process.env.CLASH_ROYALE_TOKEN,BASE="https://api.clashroyale.com/v1";
app.use(express.static(path.join(__dirname,"public")));
const tag=v=>encodeURIComponent((v||"").trim().toUpperCase().replace(/^#/,"#"));
async function cr(p){if(!TOKEN){let e=new Error("CLASH_ROYALE_TOKEN não configurado no servidor.");e.status=503;throw e}const r=await fetch(BASE+p,{headers:{Authorization:"Bearer "+TOKEN,Accept:"application/json"}}),t=await r.text();let d={};try{d=JSON.parse(t)}catch{d={message:t}}if(!r.ok){let e=new Error(d.message||"Erro na API do Clash Royale.");e.status=r.status;throw e}return d}
app.get("/api/health",(q,s)=>s.json({ok:true,configured:Boolean(TOKEN)}));
app.get("/api/player/:tag",async(q,s)=>{try{s.json(await cr("/players/"+tag(q.params.tag)))}catch(e){s.status(e.status||500).json({message:e.message})}});
app.get("/api/player/:tag/battlelog",async(q,s)=>{try{s.json(await cr("/players/"+tag(q.params.tag)+"/battlelog"))}catch(e){s.status(e.status||500).json({message:e.message})}});
app.get("/api/leaderboard",async(q,s)=>{try{s.json(await cr("/locations/global/rankings/players?limit=20"))}catch(e){s.status(e.status||500).json({message:e.message})}});
app.get("/api/tv",async(q,s)=>{try{const r=await cr("/locations/global/rankings/players?limit=12"),sets=await Promise.all((r.items||[]).map(p=>cr("/players/"+encodeURIComponent(p.tag)+"/battlelog").catch(()=>[]))),items=sets.flat();items.sort((a,b)=>new Date(b.battleTime||0)-new Date(a.battleTime||0));s.json({items:items.slice(0,30),generatedAt:new Date().toISOString()})}catch(e){s.status(e.status||500).json({message:e.message})}});
app.get("*splat",(q,s)=>s.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log("ClashTV running on http://localhost:"+PORT));