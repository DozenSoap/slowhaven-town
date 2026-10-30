import * as THREE from 'three';
import {SKINS,HAIRS,COATS} from './content.js';
const geo={ball:new THREE.SphereGeometry(1,12,9),box:new THREE.BoxGeometry(1,1,1),body:new THREE.CapsuleGeometry(.22,.3,3,8),cyl:new THREE.CylinderGeometry(1,1,1,10)};
const materials=new Map();
const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.92}));return materials.get(color);};
export function createAvatar(profile={},isPlayer=false){
  const root=new THREE.Group(),model=new THREE.Group();root.add(model);
  const skin=mat(SKINS[profile.skin%SKINS.length]||SKINS[0]),hair=mat(profile.baseAge>=65?'#d8d5c1':HAIRS[profile.hair%HAIRS.length]||HAIRS[0]),coat=mat(profile.occupation==='hospital'?'#eee9d9':COATS[profile.coat%COATS.length]||COATS[0]),dark=mat('#534c43'),cream=mat('#ece2c9'),pink=mat('#d39d91');
  const mesh=(g,type,material,x,y,z,sx,sy=sx,sz=sx)=>{const o=new THREE.Mesh(geo[type],material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
  mesh(model,'body',coat,0,.81,0,1.08,1,1);mesh(model,'ball',skin,0,1.31,0,.29,.3,.265);
  mesh(model,'ball',hair,0,1.45,-.025,.3,.21,.28);mesh(model,'ball',hair,-.13,1.5,.17,.145,.09,.1);mesh(model,'ball',hair,.05,1.51,.19,.13,.07,.08);
  for(const side of [-1,1]){mesh(model,'ball',skin,side*.275,1.3,0,.06,.08,.065);mesh(model,'ball',dark,side*.09,1.32,.249,.019,.024,.013);mesh(model,'ball',pink,side*.16,1.25,.225,.045,.022,.012);}
  mesh(model,'ball',skin,0,1.28,.272,.028,.023,.022);mesh(model,'ball',dark,0,1.225,.25,.027,.009,.008);
  const style=profile.hairstyle||0;
  if(style===1){for(const side of [-1,1])mesh(model,'ball',hair,side*.25,1.18,-.04,.12,.22,.13);mesh(model,'ball',hair,0,1.25,-.2,.24,.28,.1);}
  if(style===2){mesh(model,'ball',hair,0,1.61,-.09,.14,.14,.13);mesh(model,'ball',cream,0,1.64,-.09,.08,.022,.12);}
  const arms=[],legs=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.29,1.04,0);model.add(arm);mesh(arm,'cyl',coat,0,-.16,0,.075,.33,.075);mesh(arm,'ball',skin,0,-.34,.015,.075);arms.push(arm);const leg=new THREE.Group();leg.position.set(side*.11,.55,0);model.add(leg);mesh(leg,'cyl',mat('#7a8276'),0,-.16,0,.075,.34,.075);mesh(leg,'ball',dark,0,-.37,.05,.095,.065,.15);legs.push(leg);}
  mesh(model,'box',cream,.12,.83,.218,.13,.12,.025);for(let i=0;i<3;i++)mesh(model,'ball',cream,-.01,.7+i*.105,.225,.019);
  if(profile.accessory===1){for(const side of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.081,.012,5,14),dark);ring.position.set(side*.1,1.32,.27);model.add(ring);}mesh(model,'box',dark,0,1.32,.276,.04,.014,.016);}
  if(profile.accessory===2){mesh(model,'cyl',cream,0,1.57,0,.4,.04,.34);mesh(model,'cyl',cream,0,1.66,0,.25,.17,.24);mesh(model,'cyl',coat,0,1.61,0,.255,.05,.245);}
  mesh(model,'ball',mat('#ab886c'),0,.85,-.25,.2,.23,.11);for(const side of [-1,1])mesh(model,'box',cream,side*.14,.9,-.05,.025,.4,.025);
  const scale=profile.baseAge<18?.87:1;model.scale.setScalar(scale);
  if(isPlayer){const ring=new THREE.Mesh(new THREE.RingGeometry(.38,.46,40),new THREE.MeshBasicMaterial({color:'#f3d698',transparent:true,opacity:.88,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.15;root.add(ring);root.userData.ring=ring;}
  const batches=[],inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4();
  if(isPlayer){const bins=new Map();model.traverse(part=>{if(!part.isMesh)return;const bin=bins.get(part.geometry.uuid)??{geometry:part.geometry,sources:[]};bin.sources.push(part);bins.set(part.geometry.uuid,bin);part.visible=false;});for(const bin of bins.values()){const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92}),mesh=new THREE.InstancedMesh(bin.geometry,material,bin.sources.length);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bin.sources.forEach((source,i)=>mesh.setColorAt(i,source.material.color));root.add(mesh);batches.push({...bin,mesh});}}
  function updateInstances(){if(!batches.length)return;root.updateMatrixWorld(true);inverse.copy(root.matrixWorld).invert();for(const bin of batches){bin.sources.forEach((source,i)=>bin.mesh.setMatrixAt(i,matrix.multiplyMatrices(inverse,source.matrixWorld)));bin.mesh.instanceMatrix.needsUpdate=true;}}
  let phase=0;
  updateInstances();
  return {root,model,batches,animate(dt,moving=false,waving=false,gesture='idle'){phase+=dt*(moving?9:1.8);model.rotation.y=!moving&&gesture==='look'?Math.sin(phase*.7)*.08:0;model.position.y=moving?Math.abs(Math.sin(phase))*.04:Math.sin(phase)*.009;legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(phase+i*Math.PI)*.45:0);arms.forEach((a,i)=>{a.rotation.x=moving?-Math.sin(phase+i*Math.PI)*.3:gesture==='work'?-.55+Math.sin(phase*2+i)*.13:Math.sin(phase+i)*.04;a.rotation.z=waving&&i===1?-2.4+Math.sin(phase*5)*.15:0;});updateInstances();},dispose(){root.removeFromParent();root.userData.ring?.geometry.dispose();root.userData.ring?.material.dispose();for(const bin of batches){bin.mesh.dispose();bin.mesh.material.dispose();}}};
}
