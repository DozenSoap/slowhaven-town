import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createLife,advance,validationError} from '../dist/life/simulation.js';
import {npcPose} from '../dist/life/routines.js';
import {RuntimeClock} from '../dist/life/runtime-clock.js';
import {walkable} from '../dist/life/navigation.js';
import {WorldView} from '../dist/life/world.js';
const noop=()=>{};globalThis.document={createElement:()=>({width:512,height:128,getContext:()=>({fillRect:noop,strokeRect:noop,fillText:noop,createRadialGradient:()=>({addColorStop:noop})})})};

test('residents keep living after reaching their scheduled destination, including existing schema-2 lives',()=>{
  const s=createLife({},412587);s.weather='sunny';advance(s,120);
  // This was the exact regression: after arrival all 32 positions stayed unchanged.
  const initial=s.npcs.map(n=>npcPose(s,n));advance(s,30);
  assert.equal(s.npcs.filter((n,i)=>{const p=npcPose(s,n);return Math.hypot(p.x-initial[i].x,p.z-initial[i].z)>.01;}).length,32);
  const restored=JSON.parse(JSON.stringify(s));advance(s,2.7);advance(restored,2.7);assert.deepEqual(restored,s);assert.equal(validationError(restored),null);
});

test('indoor motion follows walkable paths, stays continuous, and uses the same position for drawing and interaction',()=>{
  const s=createLife({},412587);s.day=3;s.minute=600;s.weather='sunny';advance(s,40);const inside=s.npcs.filter(n=>n.inside),before=inside.map(n=>npcPose(s,n));assert.ok(inside.length>10);
  for(let step=0;step<180;step++){const old=inside.map(n=>npcPose(s,n));advance(s,.15);for(let i=0;i<inside.length;i++){const n=inside[i],p=npcPose(s,n);assert.ok(walkable(n.area,p.x,p.z,n.inside),n.id);assert.ok(Math.hypot(p.x-old[i].x,p.z-old[i].z)<.7,n.id+' teleported');}}
  assert.ok(inside.some((n,i)=>{const p=npcPose(s,n);return Math.hypot(p.x-before[i].x,p.z-before[i].z)>1;}));
  const person=inside[0];Object.assign(s.player,{area:person.area,inside:person.inside});const scene=new THREE.Scene(),world=new WorldView(scene),camera=new THREE.PerspectiveCamera();world.load(person.area,person.inside);world.update(s,1,camera);
  const entity=world.entities(s).find(e=>e.id===person.id),pose=npcPose(s,person),root=world.avatars.get(person.id).root;assert.equal(entity.x,pose.x);assert.equal(entity.z,pose.z);assert.ok(Math.hypot(root.position.x-entity.x,root.position.z-entity.z)<.02);world.dispose();
});

test('one-FPS, variable-FPS and sixty-FPS rendering advance the same amount of life',()=>{
  const seed=412587,run=times=>{const s=createLife({},seed),clock=new RuntimeClock();clock.sample(0,true);for(const t of times)for(let i=clock.sample(t,true);i>0;i--)advance(s,.15);return {minute:s.minute,fraction:s.clockFraction,npcs:s.npcs};};
  const fast=run(Array.from({length:1200},(_,i)=>(i+1)*1000/60)),slow=run(Array.from({length:20},(_,i)=>(i+1)*1000));assert.deepEqual(slow,fast);assert.equal(slow.minute,510);
  const mixed=[];let t=0;for(let i=0;t<20000;i++){t=Math.min(20000,t+[17,33,250,1000,1500][i%5]);mixed.push(t);}assert.deepEqual(run(mixed),fast);
});

test('menus, manual pause and a background resume never charge their elapsed time to the player',()=>{
  const clock=new RuntimeClock();clock.sample(0,true);assert.equal(clock.sample(1000,true),10);assert.equal(clock.sample(2000,false),0);assert.equal(clock.sample(300000,false),0);assert.equal(clock.sample(301000,true),0);assert.equal(clock.sample(302000,true),10);
  clock.reset(600000);assert.equal(clock.sample(601000,true),0);assert.equal(clock.sample(602000,true),10);assert.equal(clock.sample(700000,true),20);assert.throws(()=>clock.sample(NaN,true));
});

test('every new district has moving environmental batches; pause freezes them and the draw count stays bounded',()=>{
  const scene=new THREE.Scene(),world=new WorldView(scene),s=createLife({},84),camera=new THREE.PerspectiveCamera();
  for(const area of ['farm','civic','woods','coast']){Object.assign(s.player,{area,inside:null});s.weather='sunny';world.load(area,null);world.update(s,.1,camera);const bins=world.active.builder.motionBatches;assert.ok(bins.length>0&&bins.length<=6,area);
    const before=bins.map(b=>Array.from(b.mesh.instanceMatrix.array));world.update(s,.5,camera);assert.ok(bins.some((b,i)=>b.mesh.instanceMatrix.array.some((v,j)=>Math.abs(v-before[i][j])>.001)),area);
    const stopped=bins.map(b=>Array.from(b.mesh.instanceMatrix.array));world.update(s,0,camera);for(let i=0;i<bins.length;i++){assert.deepEqual(Array.from(bins[i].mesh.instanceMatrix.array),stopped[i]);assert.ok([...bins[i].mesh.instanceMatrix.array].every(Number.isFinite));}assert.ok(world.cache.size<=2);
  }world.dispose();
});
