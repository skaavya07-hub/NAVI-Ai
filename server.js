import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTS, isIndianOceanPort } from './src/ports.js';
import { computeCandidateRoutes, directReference, benchmarkAlgorithms, rerouteFromProgress } from './src/routingEngine.js';
import { chooseLiveAwareCandidate } from './src/liveEnvironment.js';
import { pipeAisToSse } from './src/aisService.js';

const app=express(), __dirname=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:'1mb'})); app.use(express.static(path.join(__dirname,'public')));

const defaults={
  vessel:{name:'Container Ship',calmSpeedKnots:16,baseFuelTph:2.4,maxPreferredWaveM:5.5},
  opt:{name:'Balanced',timeWeight:.3,fuelWeight:.3,safetyWeight:.4},
  cfg:{gridStepDeg:1,forecastStartHour:0,hardWaveLimitM:8,hardWindLimitKn:52,safetyRiskLimit:.92,heuristicWeight:1}
};
const resolvePort=x=>Array.isArray(x)?x:PORTS[x];

app.get('/api/ports',(req,res)=>res.json(Object.entries(PORTS).map(([name,coordinates])=>({name,coordinates,routeSupported:isIndianOceanPort(coordinates)}))));
app.get('/api/status',(req,res)=>res.json({ok:true,stack:'Full JavaScript (Node.js + browser JS)',liveMarine:'Open-Meteo',radar:'RainViewer',aisConfigured:!!process.env.AISSTREAM_API_KEY}));

app.post('/api/route',async(req,res)=>{
  try{
    const start=resolvePort(req.body.origin),goal=resolvePort(req.body.destination); if(!start||!goal) return res.status(400).json({error:'Unknown origin/destination port.'});
    if(!isIndianOceanPort(start)||!isIndianOceanPort(goal)) return res.status(400).json({error:'The SIH optimizer is currently constrained to the Indian Ocean region. Global ports remain visible for world-map context.'});
    const vessel={...defaults.vessel,...req.body.vessel}, opt={...defaults.opt,...req.body.optimization}, cfg={...defaults.cfg,...req.body.config};
    const candidates=computeCandidateRoutes(start,goal,vessel,cfg,opt);
    const selection=req.body.useLiveData===false ? {chosenName:'Selected',chosenRoute:candidates.Selected,all:candidates,liveDataUsed:false} : await chooseLiveAwareCandidate(candidates,vessel,cfg,opt);
    if(!selection.chosenRoute?.success) return res.status(422).json(selection.chosenRoute||{error:'No feasible route'});
    const direct=directReference(start,goal,vessel,cfg);
    res.json({...selection,origin:req.body.origin,destination:req.body.destination,direct,vessel,optimization:opt,config:cfg});
  }catch(e){console.error(e);res.status(500).json({error:e.message});}
});

app.post('/api/benchmark',(req,res)=>{
  try{const start=resolvePort(req.body.origin),goal=resolvePort(req.body.destination);const v={...defaults.vessel,...req.body.vessel},o={...defaults.opt,...req.body.optimization},c={...defaults.cfg,...req.body.config};res.json(benchmarkAlgorithms(start,goal,v,o,c));}
  catch(e){res.status(500).json({error:e.message});}
});

app.post('/api/reroute',(req,res)=>{
  try{const goal=resolvePort(req.body.destination);const v={...defaults.vessel,...req.body.vessel},o={...defaults.opt,...req.body.optimization},c={...defaults.cfg,...req.body.config};res.json(rerouteFromProgress(req.body.route,Number(req.body.progress||.35),Number(req.body.shiftHours||24),v,o,c,goal));}
  catch(e){res.status(500).json({error:e.message});}
});

app.get('/api/radar',(req,res)=>res.redirect('https://api.rainviewer.com/public/weather-maps.json'));
app.get('/api/ais/stream',(req,res)=>{
  const bounds={minLat:Number(req.query.minLat??-40),minLon:Number(req.query.minLon??28),maxLat:Number(req.query.maxLat??32),maxLon:Number(req.query.maxLon??115)};
  pipeAisToSse(req,res,bounds,process.env.AISSTREAM_API_KEY);
});

app.use((req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const port=Number(process.env.PORT||3000); app.listen(port,()=>console.log(`NAVI-AI running on http://localhost:${port}`));
