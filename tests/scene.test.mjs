import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createTown} from '../dist/town.js';

// Canvas is used only to create label textures; these checks do not rasterize them.
const noop=()=>{};
globalThis.document={createElement:()=>({width:512,height:128,getContext:()=>({fillRect:noop,strokeRect:noop,fillText:noop,createRadialGradient:()=>({addColorStop:noop})})})};

test('the town builds finite geometry and continues across time and weather',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera();
  camera.position.set(69,66,80);
  const town=createTown(scene);
  assert.equal(town.residents.length,32);
  assert.equal(town.trainCars.length,3);
  assert.equal(town.entries().animals.length,29);
  assert.equal(new Set(town.entries().animals.map(a=>a.role)).size,11);
  scene.traverse(o=>{if(o.isMesh)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});
  for(const weather of ['sunny','rain','snow'])for(const hour of [0,7,13,18,22])for(let frame=0;frame<20;frame++)town.update(.1,hour,weather,camera);
  for(const r of town.residents)assert.ok(r.root.position.toArray().every(Number.isFinite));
  for(const car of town.trainCars)assert.ok(car.position.length()<40);
  assert.ok(town.materials.window.emissiveIntensity>0);
  for(const batch of town.actorBatches){
    assert.ok(batch.sources.every(s=>s.visible===false));
    assert.ok([...batch.mesh.instanceMatrix.array].every(Number.isFinite));
  }
});

test('greetings animate the selected resident and all attraction actions remain valid',()=>{
  const town=createTown(new THREE.Scene()),camera=new THREE.PerspectiveCamera();
  const list=town.entries();
  town.interact(list.residents[0]);
  town.update(.1,14,'sunny',camera);
  assert.ok(town.residents[0].wave>0);
  assert.ok(town.residents[0].arms[1].rotation.z< -1);
  for(const type of ['cat','duck','animal']){
    const animal=list.animals.find(a=>a.type===type);
    assert.ok(town.interact(animal).message.length>0);
    assert.ok(town.positionFor(animal).toArray().every(Number.isFinite));
  }
  for(const name of ['睡莲池','风的磨坊','栖迟钟楼','栖迟慢车']){
    const place=list.places.find(p=>p.name===name);
    assert.ok(place,`journal contains ${name}`);
    assert.ok(town.interact(place).message.length>0);
  }
  for(let i=0;i<40;i++)town.update(.1,14,'sunny',camera);
  assert.equal(town.residents[0].wave,0);
});

test('all eight decoration types can be added and removed safely',()=>{
  const town=createTown(new THREE.Scene()),initial=town.buildingHits.length;
  for(const type of ['tree','flowers','bench','house','pine','cherry','sunflowers','birdhouse']){
    let target=null;
    for(let x=-24;x<24&&!target;x+=.9)for(let z=-17;z<17&&!target;z+=.9)if(town.canPlace(type,x,z))target={type,x,z};
    assert.ok(target,type);
    town.place(target);
    assert.equal(town.undo().type,type);
    assert.equal(town.buildingHits.length,initial);
  }
});

test('placement protects roads and river, and undo removes stale hit targets',()=>{
  const town=createTown(new THREE.Scene()),initialHits=town.buildingHits.length;
  assert.equal(town.canPlace('house',10,0),false);
  assert.equal(town.canPlace('tree',town.riverX(6),6),false);
  for(const type of ['tree','flowers','bench','house']){
    let placed=false;
    for(let x=-24;x<24&&!placed;x+=1.1)for(let z=-17;z<17&&!placed;z+=1.1)if(town.canPlace(type,x,z)){town.place({type,x,z});placed=true;}
    assert.ok(placed,`available space for ${type}`);
  }
  assert.equal(town.placedRoots.length,4);
  assert.equal(town.buildingHits.length,initialHits+1);
  for(let i=0;i<4;i++)assert.ok(town.undo());
  assert.equal(town.placedRoots.length,0);
  assert.equal(town.buildingHits.length,initialHits);
  assert.equal(town.undo(),null);
});
