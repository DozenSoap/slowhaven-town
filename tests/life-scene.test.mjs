import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {WorldView} from '../dist/life/world.js';
import {createLife} from '../dist/life/simulation.js';
import {BUILDINGS} from '../dist/life/content.js';
import {createAvatar} from '../dist/life/avatar.js';
const noop=()=>{};globalThis.document={createElement:()=>({width:512,height:128,getContext:()=>({fillRect:noop,strokeRect:noop,fillText:noop,createRadialGradient:()=>({addColorStop:noop})})})};

test('five districts and every interior build finite models with a bounded scene cache',()=>{
  const scene=new THREE.Scene(),world=new WorldView(scene),s=createLife({},84),camera=new THREE.PerspectiveCamera();camera.position.set(25,32,36);
  for(const area of ['farm','center','civic','woods','coast']){s.player.area=area;s.player.inside=null;world.load(area,null);world.update(s,.016,camera);let triangles=0;world.active.root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position.array;for(const v of a)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});assert.ok(triangles>1000);assert.ok(world.cache.size<=2);}
  for(const b of BUILDINGS){s.player.area=b.area;s.player.inside=b.id;world.load(b.area,b.id);world.update(s,.016,camera);assert.ok(world.active.root.children.length>0,b.id);assert.ok(world.entities(s).some(e=>e.kind==='exit'),b.id);assert.ok(world.cache.size<=2);}
  world.dispose();
});

test('32 articulated NPCs share instanced draws while preserving per-part colors',()=>{
  const scene=new THREE.Scene(),world=new WorldView(scene),s=createLife({},84),camera=new THREE.PerspectiveCamera();world.load('farm',null);for(const n of s.npcs){n.area='farm';n.inside=null;n.transit=null;n.x=1;n.z=5;}world.update(s,.1,camera);
  assert.equal(world.avatars.size,32);assert.ok(world.avatarBatches.length<25);assert.ok(world.avatarBatches.every(b=>b.mesh.instanceColor));for(const bin of world.avatarBatches)assert.ok([...bin.mesh.instanceMatrix.array].every(Number.isFinite));
  s.npcs.forEach(n=>n.inside='home');world.update(s,.1,camera);for(const bin of world.avatarBatches)assert.ok([...bin.mesh.instanceMatrix.array].every(v=>v===0||v===1));world.dispose();
});

test('the player retains articulated movement and colors in fewer than ten draw batches',()=>{
  const avatar=createAvatar({skin:2,coat:3,hairstyle:2,accessory:1},true);avatar.root.position.set(8,.41,-4);avatar.root.rotation.y=1.2;avatar.animate(.1,true);
  assert.ok(avatar.batches.length<10);for(const bin of avatar.batches){assert.ok(bin.mesh.instanceColor);assert.ok([...bin.mesh.instanceMatrix.array].every(Number.isFinite));assert.ok(bin.sources.every(s=>s.visible===false));}assert.ok(avatar.root.userData.ring.position.y>.1);avatar.dispose();
});
