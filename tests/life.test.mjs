import test from 'node:test';
import assert from 'node:assert/strict';
import {createLife,advance,act,weatherFor,ageOf,validationError,scheduleFor} from '../dist/life/simulation.js';
import {BUILDINGS,GATES,NPCS,calendar,pathBetweenAreas} from '../dist/life/content.js';
import {walkable,findPath,moveAlong} from '../dist/life/navigation.js';
import {exportLife} from '../dist/life/storage.js';

function at(s,area,x,z,inside=null){Object.assign(s.player,{area,x,z,inside});}
function sleep(s){at(s,'farm',-4,-2,'home');assert.ok(act(s,'sleep').ok);}

test('three days of watered growth yields crops, sale and a durable independent life',()=>{
  const s=createLife({name:'阿迟',age:23,identity:'gardener'},12345),other=createLife({name:'小禾'},989);
  at(s,'farm',7,3);assert.ok(act(s,'plant',{plot:0}).ok);if(s.weather!=='rain')assert.ok(act(s,'water',{plot:0}).ok);
  for(let i=0;i<3;i++){sleep(s);if(i<2){at(s,'farm',7,3);if(s.weather!=='rain')assert.ok(act(s,'water',{plot:0}).ok);}}
  at(s,'farm',7,3);assert.equal(s.plots[0].growth,3);assert.ok(act(s,'harvest',{plot:0}).ok);assert.equal(s.player.inventory.turnip,2);assert.ok(!act(s,'harvest',{plot:0}).ok);
  s.event=null;const coins=s.player.coins;at(s,'farm',-5,3);assert.ok(act(s,'sell',{item:'turnip',all:true}).ok);assert.equal(s.player.coins,coins+92);assert.ok(!act(s,'sell',{item:'turnip'}).ok);
  const loaded=JSON.parse(exportLife(s)).state;assert.deepEqual(loaded,s);assert.equal(validationError(loaded),null);assert.equal(other.plots[0].crop,null);assert.equal(other.player.inventory.turnip,undefined);
});

test('unwatered plants wait and seeded weather cannot be rerolled by reloading',()=>{
  const s=createLife({},31337);s.weather='sunny';at(s,'farm',7,3);act(s,'plant',{plot:0});sleep(s);assert.equal(s.plots[0].growth,0);
  const before=structuredClone(s);advance(s,133);const restored=structuredClone(before);advance(restored,133);assert.deepEqual(s,restored);
  for(let day=1;day<120;day++)assert.equal(weatherFor(s.seed,day),weatherFor(restored.seed,day));
  const winter=Array.from({length:14},(_,i)=>weatherFor(91,43+i));assert.ok(winter.includes('snow'));assert.ok(!winter.includes('rain'));
});

test('reward, gift, forage and work limits cannot be repeatedly collected',()=>{
  const s=createLife({},47);s.flags.firsthello=true;const coins=s.player.coins;assert.ok(act(s,'claim',{id:'firsthello'}).ok);assert.ok(!act(s,'claim',{id:'firsthello'}).ok);assert.equal(s.player.coins,coins+35);
  at(s,'woods',10,-6);assert.ok(act(s,'forage',{id:'woodfruit'}).ok);assert.ok(!act(s,'forage',{id:'woodfruit'}).ok);
  at(s,'civic',0,0,'office');s.minute=540;assert.ok(act(s,'work').ok);assert.ok(act(s,'work').ok);assert.ok(!act(s,'work').ok);assert.equal(s.daily.work,2);assert.ok(s.player.stress>0);
  const teen=createLife({age:14},47);at(teen,'civic',0,0,'office');teen.minute=540;assert.ok(!act(teen,'work').ok);
});

test('relationships remember gifts and promises, with age-appropriate interactions',()=>{
  const s=createLife({},92),npc=s.npcs[0];at(s,'center',0,0,'bakery');Object.assign(npc,{area:'center',inside:'bakery',transit:null});
  assert.ok(act(s,'chat',{npc:'v0'}).ok);const trust=s.relations.v0.trust;assert.ok(act(s,'chat',{npc:'v0'}).ok);assert.equal(s.relations.v0.trust,trust);
  assert.ok(act(s,'gift',{npc:'v0',item:'bread'}).ok);assert.ok(!act(s,'gift',{npc:'v0',item:'bread'}).ok);assert.match(s.relations.v0.memory[0],/热面包/);
  s.relations.v0.trust=15;assert.ok(act(s,'invite',{npc:'v0'}).ok);s.minute=1060;assert.equal(scheduleFor(s,NPCS[0]).place,'cafe');const before=s.relations.v0.trust;sleep(s);assert.equal(s.relations.v0.trust,before-3);assert.match(s.relations.v0.memory[0],/没有等到/);
  const t=createLife({age:15},92);at(t,'center',0,0,'bakery');Object.assign(t.npcs[0],{area:'center',inside:'bakery',transit:null});Object.assign(t.relations.v0,{trust:80,affinity:80});assert.ok(!act(t,'romance',{npc:'v0'}).ok);
});

test('a booked cafe meeting succeeds once and cannot duplicate relationship rewards',()=>{
  const s=createLife({},92),n=s.npcs[0];at(s,'center',0,0,'cafe');s.minute=1080;Object.assign(n,{area:'center',inside:'cafe',transit:null});s.relations.v0.promise={day:s.day,time:1080,done:false};
  assert.ok(act(s,'meet',{npc:'v0'}).ok);const trust=s.relations.v0.trust;assert.ok(!act(s,'meet',{npc:'v0'}).ok);assert.equal(s.relations.v0.trust,trust);
});

test('all district gates and building doors have walkable approaches, including the cafe',()=>{
  for(const g of GATES){assert.ok(walkable(g.area,g.x,g.z),g.id);const path=findPath(g.area,[0,0],[g.x,g.z]);assert.ok(path.length,g.id);assert.ok(path.every(p=>walkable(g.area,...p)),g.id);}
  for(const b of BUILDINGS){assert.ok(walkable(b.area,...b.door),b.id);const path=findPath(b.area,b.area==='coast'?[0,-18]:[0,0],b.door);assert.ok(path.length,b.id);const pos={x:path[0][0],z:path[0][1]};moveAlong(pos,path,1000);assert.ok(Math.hypot(pos.x-b.door[0],pos.z-b.door[1])<.1,b.id);}
  assert.equal(pathBetweenAreas('woods','coast').length,4);assert.equal(walkable('center',-8.2,0),false);
  const path=findPath('center',[-20,12.3],[10,12.3]);assert.ok(path.length);assert.ok(path.every(p=>walkable('center',...p)));
});

test('buildings enforce physical proximity and opening hours',()=>{
  const s=createLife({},23),b=BUILDINGS.find(b=>b.id==='bakery');assert.ok(!act(s,'enter',{id:'bakery'}).ok);at(s,b.area,...b.door);s.minute=1300;assert.ok(!act(s,'enter',{id:'bakery'}).ok);s.minute=600;assert.ok(act(s,'enter',{id:'bakery'}).ok);assert.equal(s.player.inside,'bakery');assert.ok(act(s,'buy',{item:'bread'}).ok);assert.ok(!act(s,'buy',{item:'seed'}).ok);assert.ok(act(s,'exit').ok);assert.deepEqual([s.player.x,s.player.z],b.door);
});

test('seasons, birthdays, physical consequences and bounded logs survive a full year',()=>{
  const s=createLife({age:39},42);for(let day=0;day<56;day++){s.minute=1400;sleep(s);}
  assert.equal(s.day,57);assert.equal(ageOf(s),40);assert.equal(calendar(s.day).season,0);assert.equal(s.player.habits.lateNights,56);assert.ok(s.player.health<100);assert.ok(s.journal.length<=80);assert.equal(validationError(s),null);
  const copy=structuredClone(s);copy.day=NaN;assert.ok(validationError(copy));copy.day=s.day;copy.player.inventory.badItem=1;assert.ok(validationError(copy));
});

test('NPC schedules change by time, weather and exceptions without tying rules to rendering',()=>{
  const s=createLife({},21);s.day=3;s.minute=600;s.weather='sunny';assert.equal(scheduleFor(s,NPCS[26]).place,'hospital');assert.equal(scheduleFor(s,NPCS[23]).place,'school');s.minute=1320;assert.equal(scheduleFor(s,NPCS[0]).place,NPCS[0].home);
  s.minute=1050;s.weather='rain';assert.ok(['books','cafe'].includes(scheduleFor(s,NPCS[1]).place));s.day=17-NPCS[0].index*3;s.minute=900;assert.equal(scheduleFor(s,NPCS[0]).place,'coast');
});

test('malformed imports report a validation error without throwing or changing the current life',()=>{
  const good=createLife({},43);for(const bad of [null,[],{},'text',{...good,npcs:Array(32).fill(null)},{...good,relations:{v0:null}},{...good,player:{...good.player,skin:9}},{...good,weather:'hail'},{...good,player:{...good.player,inventory:[]}}])assert.ok(validationError(bad));assert.equal(validationError(good),null);
});
