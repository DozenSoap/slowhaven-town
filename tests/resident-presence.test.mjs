import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLife,advance,synchronizeResidents,scheduleFor,validationError} from '../dist/life/simulation.js';
import {NPCS,building} from '../dist/life/content.js';
import {npcPose} from '../dist/life/routines.js';
import {WorldView} from '../dist/life/world.js';
const noop=()=>{};
globalThis.document={createElement:()=>({width:512,height:128,getContext:()=>({fillRect:noop,strokeRect:noop,fillText:noop,createRadialGradient:()=>({addColorStop:noop})})})};

test('a newcomer can meet real neighbours outside the front door in sunny and rainy lives',()=>{
  for(const seed of [2,412587]){
    const s=createLife({},seed),near=s.npcs.filter(n=>!n.inside&&!n.transit&&n.area==='farm'&&Math.hypot(n.x-s.player.x,n.z-s.player.z)<8);
    assert.ok(near.length>=2,s.weather);assert.equal(validationError(s),null);
    const before=near.map(n=>[n.x,n.z]);advance(s,10);
    assert.ok(near.some((n,i)=>Math.hypot(n.x-before[i][0],n.z-before[i][1])>.5));
  }
});

test('gardeners, the postman and the ranger have outdoor occupations while essential indoor staff remain at work',()=>{
  const s=createLife({},2);s.day=3;s.minute=600;s.weather='sunny';
  assert.ok(NPCS.filter(n=>n.work==='greenhouse').some(n=>scheduleFor(s,n).place==='farm'));
  assert.equal(scheduleFor(s,NPCS[5]).place,'farm');assert.equal(scheduleFor(s,NPCS[20]).place,'woods');
  assert.equal(scheduleFor(s,NPCS[26]).place,'hospital');assert.equal(scheduleFor(s,NPCS[23]).place,'school');
  s.weather='rain';assert.equal(scheduleFor(s,NPCS[5]).place,'farm');
  for(const n of NPCS.filter(n=>n.work==='greenhouse'))assert.equal(scheduleFor(s,n).place,'greenhouse');
});

test('schema-2 indoor and abstract-travel saves resume without resetting the life or teleporting residents',()=>{
  const s=createLife({name:'原来的人生'},412587),n=s.npcs[5],door=building('post').door;
  Object.assign(n,{area:'center',inside:null,x:door[0],z:door[1],path:[],target:'farm',transit:{area:'farm',place:'farm',remaining:20}});
  s.relations.v5.trust=31;const before=structuredClone(s);
  synchronizeResidents(s);
  assert.equal(n.transit,null);assert.ok(n.path.length);assert.deepEqual([n.x,n.z],[before.npcs[5].x,before.npcs[5].z]);
  for(const key of ['id','revision','seed','day','minute','clockFraction','player','relations','plots','journal'])assert.deepEqual(s[key],before[key],key);
  assert.equal(validationError(s),null);
});

test('commuters remain visible and walk through district gates before entering their destination',()=>{
  const s=createLife({},2);s.day=3;s.minute=600;s.weather='sunny';
  const n=s.npcs[0];Object.assign(n,{area:'farm',inside:null,x:25,z:1,target:'farm',path:[],transit:null});
  const world=new WorldView(new THREE.Scene());let moved=0;
  for(let i=0;i<300&&n.inside!=='bakery';i++){
    const before=[n.area,n.x,n.z];advance(s,.25);assert.equal(n.transit,null);
    Object.assign(s.player,{area:n.area,inside:n.inside});
    assert.ok(world.entities(s).some(e=>e.id===n.id),'resident disappeared in transit');
    if(before[0]===n.area){const distance=Math.hypot(n.x-before[1],n.z-before[2]);assert.ok(distance<.4,'resident teleported');if(distance>.01)moved++;}
    assert.equal(validationError(s),null);
  }
  assert.equal(n.inside,'bakery');assert.ok(moved>20);world.dispose();
});

test('zero-delta first frames place visible 3D residents at their interaction positions, including cached scenes',()=>{
  const s=createLife({},412587),world=new WorldView(new THREE.Scene()),camera=new THREE.PerspectiveCamera();
  const check=()=>{
    world.load(s.player.area,s.player.inside);world.update(s,0,camera);
    for(const e of world.entities(s).filter(e=>e.type==='npc')){
      const profile=NPCS.find(n=>n.id===e.id),root=world.active.town?world.active.town.residents[profile.index].root:world.avatars.get(e.id).root;
      assert.ok(root.visible,e.id);assert.ok(Math.hypot(root.position.x-e.x,root.position.z-e.z)<1e-6,e.id+' misplaced on first frame');
    }
  };
  const room=s.npcs.find(n=>n.inside==='cafe');Object.assign(s.player,{area:room.area,inside:room.inside});check();
  for(const area of ['farm','center','civic','woods','coast','farm','center']){
    const n=s.npcs[0];Object.assign(n,{area,inside:null,transit:null,x:4,z:1,path:[]});Object.assign(s.player,{area,inside:null});check();
    if(!world.active.town){assert.ok(world.avatarBatchRoot.visible);const bins=world.avatarBatches.filter(b=>b.sources.some(source=>source.root===world.avatars.get(n.id).root));assert.ok(bins.length);for(const bin of bins){const index=bin.sources.findIndex(source=>source.root===world.avatars.get(n.id).root),matrix=new THREE.Matrix4();bin.mesh.getMatrixAt(index,matrix);assert.ok(Math.abs(matrix.determinant())>1e-9,'visible person has hidden instances');}}
  }
  world.dispose();
});
