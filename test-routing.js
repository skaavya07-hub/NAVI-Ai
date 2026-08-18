import { PORTS } from './src/ports.js';
import { computeRoute, benchmarkAlgorithms } from './src/routingEngine.js';
const v={name:'Container Ship',calmSpeedKnots:16,baseFuelTph:2.4,maxPreferredWaveM:5.5};
const o={name:'Balanced',timeWeight:.3,fuelWeight:.3,safetyWeight:.4};
const c={gridStepDeg:1,forecastStartHour:0,hardWaveLimitM:8,hardWindLimitKn:52,safetyRiskLimit:.92,heuristicWeight:1};
const r=computeRoute(PORTS['Mumbai, India'],PORTS['Colombo, Sri Lanka'],v,o,c);
if(!r.success||r.coordinates.length<2) throw new Error('Routing test failed');
console.log('PASS route', {waypoints:r.coordinates.length,days:(r.metrics.timeHours/24).toFixed(2),fuel:r.metrics.fuelTonnes.toFixed(1)});
console.table(benchmarkAlgorithms(PORTS['Mumbai, India'],PORTS['Colombo, Sri Lanka'],v,o,c).map(x=>({algorithm:x.algorithm,runtimeMs:x.runtimeMs.toFixed(1),visited:x.visitedNodes})));
