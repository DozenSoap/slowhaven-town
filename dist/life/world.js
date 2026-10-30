import * as THREE from 'three';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {createTown} from '../town.js';
import {BUILDINGS,GATES,PROPS,AREAS,NPCS,furnitureFor,calendar,building} from './content.js';
import {createAvatar} from './avatar.js';
import {npcPose} from './routines.js';

const boxGeo=new THREE.BoxGeometry(1,1,1),ballGeo=new THREE.SphereGeometry(1,10,7),cylGeo=new THREE.CylinderGeometry(1,1,1,10),coneGeo=new THREE.ConeGeometry(1,1,9);
const palette={grass:'#86bf64',base:'#c9c5ae',path:'#ead6a7',edge:'#ddd7c3',wood:'#a88863',dark:'#655644',cream:'#eee2c6',wall:'#f2e6c5',roof:'#cf825c',teal:'#439c88',leaf:'#67a856',leafDark:'#4e8851',leafLight:'#a4cb69',water:'#60b9c9',white:'#f4eee0',pink:'#e79c9a',yellow:'#efcc63',blue:'#73bad0',window:'#9ab3ab',iron:'#5b7066',soil:'#9a7b5d'};
function builder(root){
  const mats={},merged=[],motions=[],dynamicParts=new Set(),motionBatches=[];let ambientTime=0,windCount=0;for(const [k,c]of Object.entries(palette))mats[k]=new THREE.MeshStandardMaterial({color:c,roughness:.9});
  mats.window=new THREE.MeshStandardMaterial({color:'#8fa7a0',roughness:.35,emissive:'#f8d7a3',emissiveIntensity:.12});
  mats.glass=new THREE.MeshStandardMaterial({color:'#b7d8c5',roughness:.3,transparent:true,opacity:.42,depthWrite:false});
  const add=(type,x,y,z,sx,sy,sz,mat='cream',parent=root)=>{const o=new THREE.Mesh({box:boxGeo,ball:ballGeo,cyl:cylGeo,cone:coneGeo}[type],mats[mat]??mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const box=(x,y,z,w,h,d,m,p)=>add('box',x,y,z,w,h,d,m,p);
  const ball=(x,y,z,r,m,sx=1,sy=1,sz=1,p)=>add('ball',x,y,z,r*sx,r*sy,r*sz,m,p);
  const cyl=(x,y,z,r,h,m,p)=>add('cyl',x,y,z,r,h,r,m,p);
  const rod=(a,b,r,m='wood',p=root)=>{const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...b),delta=bb.clone().sub(aa),mid=aa.clone().add(bb).multiplyScalar(.5),o=cyl(mid.x,mid.y,mid.z,r,delta.length(),m,p);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;};
  function slab(w,d,h,r,y,m){const shape=new THREE.Shape(),x=-w/2,z=-d/2;shape.moveTo(x+r,z);shape.lineTo(x+w-r,z);shape.quadraticCurveTo(x+w,z,x+w,z+r);shape.lineTo(x+w,z+d-r);shape.quadraticCurveTo(x+w,z+d,x+w-r,z+d);shape.lineTo(x+r,z+d);shape.quadraticCurveTo(x,z+d,x,z+d-r);shape.lineTo(x,z+r);shape.quadraticCurveTo(x,z,x+r,z);const geometry=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:2,bevelSize:.1,bevelThickness:.07,curveSegments:5,steps:1});geometry.rotateX(-Math.PI/2);const mesh=new THREE.Mesh(geometry,mats[m]);mesh.position.y=y;mesh.receiveShadow=true;root.add(mesh);return mesh;}
  function sign(text,x,y,z,w=3,h=.65,bg='#697e66',fg='#f5eddb'){
    const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle='rgba(245,237,219,.5)';ctx.lineWidth=4;ctx.strokeRect(12,12,744,168);ctx.font=`500 ${text.length>12?45:58}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;ctx.fillText(text,384,99,710);
    const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshStandardMaterial({map:texture,roughness:1}),m=box(x,y,z,w,h,.06,material);return m;
  }
  function motion(object,animate){object.traverse(o=>{if(o.isMesh)dynamicParts.add(o);});motions.push(animate);}
  function tree(x,z,scale=1,pine=false){
    cyl(x,1.3,z,.16,2,'wood');const crown=new THREE.Group();crown.position.set(x,0,z);root.add(crown);
    if(pine){for(let j=0;j<3;j++)add('cone',0,2.1+j*.8,0,(1.3-j*.2)*scale,2*scale,(1.3-j*.2)*scale,'leafDark',crown);}
    else{ball(0,3.2*scale,0,1.3*scale,'leaf',1,1.05,1,crown);ball(-.6*scale,2.8*scale,.3,1*scale,'leafLight',1,1,1,crown);ball(.65*scale,2.95*scale,-.2,.85*scale,'leafDark',1,1,1,crown);}
    if(windCount++<16)motion(crown,t=>{crown.rotation.z=Math.sin(t*1.3+x)*.026;crown.rotation.x=Math.sin(t*.9+z)*.018;});
  }
  function flower(x,z,color='pink',h=.65){rod([x,.4,z],[x,h+.4,z],.025,'leafDark');for(let a=0;a<5;a++)ball(x+Math.cos(a*1.26)*.11,h+.4+Math.sin(a*1.26)*.1,z,.075,color,1,1,.55);ball(x,h+.4,z+.055,.05,'yellow');}
  function pot(x,z){cyl(x,.64,z,.28,.44,'roof');ball(x,.92,z,.38,'leaf');flower(x,z,'pink',.65);}
  function bench(x,z){box(x,1,z,2,.13,.7,'wood');for(const xx of[-.8,.8]){box(x+xx,.7,z,.12,.65,.5,'iron');box(x+xx,1.4,z-.3,.1,.9,.1,'iron');}for(let i=0;i<3;i++)box(x,1.25+i*.16,z-.35,2,.1,.08,'wood');}
  function lamp(x,z){cyl(x,1.8,z,.055,2.8,'iron');box(x,3.3,z,.35,.55,.35,'cream');add('cone',x,3.7,z,.34,.35,.34,'iron');}
  function fence(x,z,w){for(let xx=-w/2;xx<=w/2;xx+=1){box(x+xx,.95,z,.12,1.1,.12,'cream');add('cone',x+xx,1.56,z,.09,.16,.09,'cream');}for(let y of[.8,1.2])box(x,y,z,w,.1,.08,'cream');}
  function house(b){const {x,z,w,d}=b,h=b.kind==='school'?5.3:b.kind==='office'?6.2:3.7;
    const wall=b.kind==='greenhouse'?'glass':b.kind==='hospital'?'white':b.kind==='market'?'cream':'wall',roof=b.kind==='greenhouse'?'glass':b.kind==='hospital'||b.kind==='office'?'teal':'roof';box(x,.53,z,w+.5,.28,d+.5,'edge');box(x,h/2+.65,z,w,h,d,wall);
    if(b.kind==='office'){box(x,h+.9,z,w+.6,.45,d+.5,'teal');for(let f=0;f<2;f++)for(let j=0;j<3;j++)box(x+(j-1)*w*.27,2+f*2.5,z+d/2+.04,w*.2,1.6,.1,'window');}
    else{for(const side of[-1,1]){const roofPiece=box(x+side*w*.25,h+.8+w*.14,z,w*.61,.17,d+.75,roof);roofPiece.rotation.z=-side*Math.PI*.18;}box(x+w*.27,h+1.3,z-d*.25,.5,1.3,.5,'roof');}
    const glass=b.kind==='greenhouse';if(glass){box(x,2.6,z,w+.06,3.1,d+.08,'glass');for(let xx=x-w/2;xx<x+w/2;xx+=1.2)box(xx,2.7,z+d/2+.09,.07,3.3,.08,'cream');}
    box(x,1.5,z+d/2+.06,.95,1.9,.15,'dark');box(x,1.5,z+d/2+.16,.8,1.75,.1,'teal');box(x,1.85,z+d/2+.23,.5,.65,.08,'window');ball(x+.27,1.3,z+d/2+.3,.045,'yellow');
    for(const side of[-1,1]){const xx=x+side*w*.3;box(xx,2.35,z+d/2+.06,w*.22,1.5,.13,'cream');box(xx,2.35,z+d/2+.15,w*.19,1.3,.08,'window');box(xx,2.35,z+d/2+.21,.06,1.3,.06,'cream');box(xx,2.35,z+d/2+.21,w*.2,.06,.06,'cream');box(xx,1.55,z+d/2+.2,w*.22,.22,.35,'wood');for(let j=-1;j<=1;j++)flower(xx+j*.22,z+d/2+.22,j%2?'yellow':'pink',1.22);}
    sign(b.name,x,3.5,z+d/2+.25,Math.min(w*.85,6),.55,b.kind==='hospital'?'#819f96':'#7b8469');pot(x-w/2-.6,z+d/2);pot(x+w/2+.6,z+d/2);
    if(b.kind==='hospital'){box(x,h+.5,z+d/2+.1,.35,1.25,.15,'pink');box(x,h+.5,z+d/2+.12,1.25,.35,.15,'pink');}
    if(b.kind==='school'){const clock=cyl(x,4.9,z+d/2+.13,.5,.1,'white');clock.rotation.x=Math.PI/2;box(x,4.97,z+d/2+.22,.035,.37,.03,'dark');box(x+.09,4.85,z+d/2+.23,.25,.03,.03,'dark');rod([x+w/2+1,.4,z],[x+w/2+1,5.7,z],.04);box(x+w/2+1.5,5.35,z,1,.5,.04,'pink');}
  }
  function addAmbient(area){
    mats.cloud=new THREE.MeshStandardMaterial({color:'#f2f4e7',roughness:1});
    for(let i=0;i<4;i++){const g=new THREE.Group(),base=-22+i*14;root.add(g);for(let j=0;j<3;j++){const part=ball((j-1)*1.2,0,0,1,'cloud',1.7,.4,1,g);part.castShadow=false;}motion(g,(t,weather)=>{g.position.set((base+t*.23+35)%70-35,11+i*1.4,-10+i*6);g.visible=weather!=='snow';});}
    for(let i=0;i<6;i++){const g=new THREE.Group();root.add(g);const wings=[ball(-.12,0,0,.16,i%2?'yellow':'pink',1,.18,.7,g),ball(.12,0,0,.16,i%2?'yellow':'pink',1,.18,.7,g)];const body=ball(0,0,0,.06,'dark',.5,.5,1.5,g);for(const part of [...wings,body])part.castShadow=false;motion(g,(t,weather)=>{g.visible=weather==='sunny';g.position.set(-7+i*3.7+Math.sin(t*.6+i)*1.4,1.1+Math.sin(t*1.1+i)*.3,4+Math.cos(t*.8+i*2)*2.5);g.rotation.y=t*.35+i;wings[0].rotation.z=Math.sin(t*13+i)*1.1;wings[1].rotation.z=-wings[0].rotation.z;});}
    const water=area==='farm'?{x:-21,z:3,r:1.6}:area==='woods'?{x:17,z:-12,r:4.5}:area==='coast'?{x:0,z:16,r:23}:null;
    if(water)for(let i=0;i<8;i++){const q=box(0,.73,0,area==='coast'?2.6:.6,.015,.035,'white');q.castShadow=false;motion(q,t=>{q.position.x=water.x+Math.sin(i*2.4+t*.12)*water.r;q.position.z=water.z+(area==='coast'?Math.cos(i*1.8)*6+Math.sin(t+i)*.3:Math.cos(i*2.4)*water.r*.65);q.scale.x=(area==='coast'?2.6:.6)*(.7+Math.sin(t+i)*.2);});}
  }
  function updateAmbient(dt,weather='sunny'){
    ambientTime+=dt;for(const animate of motions)animate(ambientTime,weather);mats.cloud?.color.set(weather==='rain'?'#c8d4cf':'#f2f4e7');root.updateMatrixWorld(true);
    const inverse=root.matrixWorld.clone().invert(),matrix=new THREE.Matrix4(),hidden=new THREE.Matrix4().makeScale(0,0,0);
    for(const bin of motionBatches){for(let i=0;i<bin.parts.length;i++){const part=bin.parts[i];let visible=true;for(let parent=part.parent;parent&&parent!==root;parent=parent.parent)if(!parent.visible)visible=false;bin.mesh.setMatrixAt(i,visible?matrix.multiplyMatrices(inverse,part.matrixWorld):hidden);bin.mesh.setColorAt(i,part.material.color);}bin.mesh.instanceMatrix.needsUpdate=true;bin.mesh.instanceColor.needsUpdate=true;}
  }
  function batch(){
    root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),bins=new Map(),remove=[];
    root.traverse(o=>{if(!o.isMesh||o.userData.dynamic||dynamicParts.has(o)||Array.isArray(o.material))return;const bin=bins.get(o.material.uuid)??{mat:o.material,geos:[]};let g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));bin.geos.push(g);bins.set(o.material.uuid,bin);remove.push(o);});
    remove.forEach(o=>o.removeFromParent());for(const bin of bins.values()){const geometry=mergeGeometries(bin.geos);if(!geometry)throw new Error('场景合并失败');const m=new THREE.Mesh(geometry,bin.mat);m.castShadow=!bin.mat.transparent;m.receiveShadow=true;root.add(m);merged.push(geometry);bin.geos.forEach(g=>g.dispose());}
    const dynamicBins=new Map();for(const part of dynamicParts){const key=part.geometry.uuid+':'+part.castShadow;const bin=dynamicBins.get(key)??{geometry:part.geometry,parts:[],shadow:part.castShadow};bin.parts.push(part);part.visible=false;dynamicBins.set(key,bin);}
    for(const bin of dynamicBins.values()){const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92}),mesh=new THREE.InstancedMesh(bin.geometry,material,bin.parts.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=bin.shadow;mesh.receiveShadow=true;root.add(mesh);motionBatches.push({...bin,mesh});}updateAmbient(0);
  }
  return {mats,box,ball,cyl,rod,slab,sign,tree,flower,pot,bench,lamp,fence,house,batch,motion,addAmbient,updateAmbient,motionBatches};
}
function makeDistrict(area){
  const root=new THREE.Group(),b=builder(root),{box,ball,cyl,rod,sign,tree,flower,pot,bench,lamp,fence,house}=b;
  b.slab(61,46,1.65,5.5,-1.32,'base');b.slab(60.8,45.8,.18,5.4,.17,area==='coast'?'cream':'grass');box(0,.4,0,54,.06,2.7,'path');box(0,.4,0,2.7,.06,42,'path');
  for(const bd of BUILDINGS.filter(x=>x.area===area)){house(bd);box(bd.x,.39,(bd.door[1]+0)/2,2,.08,Math.abs(bd.door[1]),'path');}
  let seed=area.split('').reduce((a,c)=>a+c.charCodeAt(0),122);const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const count=area==='woods'?95:area==='coast'?26:43;
  for(let i=0;i<count;i++){const x=(rand()-.5)*54,z=(rand()-.5)*37;if(Math.abs(x)<3.2||Math.abs(z)<3||area==='coast'&&z>4||BUILDINGS.some(b=>b.area===area&&Math.abs(x-b.x)<b.w/2+2.5&&Math.abs(z-b.z)<b.d/2+2.5)||PROPS.some(p=>p.area===area&&Math.hypot(p.x-x,p.z-z)<3.2))continue;tree(x,z,.7+rand()*.4,area==='woods'&&i%3!==0);if(i%2===0)for(let j=0;j<4;j++)flower(x+(rand()-.5)*2,z+(rand()-.5)*2,i%3?'white':'yellow');}
  for(const p of PROPS.filter(x=>x.area===area)){
    if(p.kind==='rest'){bench(p.x,p.z);pot(p.x-1.6,p.z);}
    if(p.kind==='shipping'){box(p.x,.9,p.z,1.8,1,1.3,'wood');for(let y of[.7,1.05,1.35])box(p.x,y,p.z+.67,1.85,.04,.03,'dark');box(p.x,1.45,p.z,1.9,.09,1.4,'dark');sign('今日收货',p.x,1,p.z+.7,1.4,.4);}
    if(p.kind==='forage'){if(p.item==='apple'){tree(p.x,p.z,1.1);for(let j=0;j<7;j++)ball(p.x+Math.sin(j*2.4),3+Math.cos(j),p.z+Math.cos(j*2.4),.14,'pink');}else if(p.item==='mushroom'){for(let j=0;j<5;j++){const x=p.x+(j%3)*.27,z=p.z+Math.floor(j/3)*.35;cyl(x,.6,z,.06,.4,'cream');ball(x,.8,z,.22,'roof',1,.5,1);ball(x+.07,.88,z+.06,.04,'cream');}}else if(p.item==='flower'){for(let j=0;j<8;j++)flower(p.x+Math.sin(j*2.4)*.6,p.z+Math.cos(j*2.4)*.6,j%2?'white':'pink');}else{for(let j=0;j<4;j++)ball(p.x+j*.22,.51,p.z+Math.sin(j)*.3,.18,'white',1,.4,.8);}}
  }
  if(area==='farm'){
    fence(-12,-12,19);fence(-16,11,18);fence(12,9,13);for(let j=0;j<5;j++){const x=-22+j*4;tree(x,15,.8);for(let k=0;k<4;k++)ball(x+Math.sin(k*2.4)*.6,2.6+Math.cos(k)*.4,15+Math.cos(k*2.4)*.5,.13,'pink');}
    rod([-17,2.8,-1],[-7,2.8,-1],.018);for(let j=0;j<5;j++){const cloth=box(-16+j*1.8,2.3,-1,.8,1,.025,j%2?'white':'pink');b.motion(cloth,t=>{cloth.rotation.x=Math.sin(t*1.5+j)*.12;cloth.rotation.z=Math.sin(t+j)*.04;});ball(-16+j*1.8,2.85,-1,.04,'wood');}
    cyl(-21,.55,3,2.3,.13,'edge');cyl(-21,.65,3,2,.06,'water');for(let j=0;j<5;j++)ball(-21+Math.cos(j)*1.7,.7,3+Math.sin(j)*1.7,.2,'leaf',1,.2,1);
    sign('风眠农庄 · 今天也好好生活',-4,2.7,17,7,.6);rod([-7,.4,17],[-7,3.1,17],.07);rod([-1,.4,17],[-1,3.1,17],.07);
    for(let i=0;i<8;i++){const x=7+i%4*2.1,z=3+Math.floor(i/4)*2.1;box(x,.43,z,1.8,.15,1.8,'soil');for(let a=-1;a<=1;a++)box(x+a*.45,.52,z,.045,.02,1.6,'dark');}
    box(12,.45,-10,5,.12,3,'soil');for(let j=0;j<9;j++)pot(10+(j%3)*2,-11+Math.floor(j/3));
    // Small domestic details make the owned land feel tended, rather than empty.
    for(let j=0;j<60;j++){const x=4+rand()*14,z=12+rand()*5;flower(x,z,j%3===0?'yellow':j%3===1?'white':'pink',.35+rand()*.25);}
    for(let j=0;j<28;j++){const x=-22+rand()*17,z=-17+rand()*3;flower(x,z,j%2?'yellow':'white',.4+rand()*.3);}
    for(const x of[6,16])rod([x,.4,10],[x,3.4,10],.065);rod([6,3.4,10],[16,3.4,10],.025);for(let i=0;i<11;i++){ball(6+i,3.2-Math.sin(i/10*Math.PI)*.25,10,.07,i%2?'cream':'yellow');}
    for(let i=0;i<5;i++){cyl(-4+i%2*.8,.8,5+Math.floor(i/2)*.8,.32,.7,'wood');for(const y of[.6,1])cyl(-4+i%2*.8,y,5+Math.floor(i/2)*.8,.33,.055,'iron');}
    const scareX=5.2,scareZ=5.2;rod([scareX,.4,scareZ],[scareX,2.1,scareZ],.06);rod([scareX-.65,1.6,scareZ],[scareX+.65,1.6,scareZ],.04);box(scareX,1.65,scareZ,.55,.65,.22,'teal');ball(scareX,2.16,scareZ,.24,'cream');cyl(scareX,2.36,scareZ,.4,.05,'wood');cyl(scareX,2.45,scareZ,.24,.18,'wood');
    box(-6,1.2,-1,.7,.5,.5,'teal');rod([-6,.4,-1],[-6,1.2,-1],.06);box(-6,1.22,-.73,.4,.035,.03,'dark');
    for(let j=0;j<10;j++){const x=-18+j*.75;ball(x,.45,3.5,.28,'edge',1.3,.2,1);}
  }
  if(area==='civic'){
    for(let x=-23;x<25;x+=5){lamp(x,2.2);box(x,.48,3.6,2,.35,1,'edge');for(let j=0;j<5;j++)flower(x-.7+j*.35,3.6,'yellow');}
    box(19,.48,-1,10,.15,7,'cream');for(let i=0;i<4;i++){box(17+i*.8,.58,-1,.4,.03,3,'white');}
    for(const x of[19,23])rod([x,.4,-4],[x,3.4,-4],.09);rod([19,3.4,-4],[23,3.4,-4],.09);for(const x of[20,22]){rod([x,3.3,-4],[x,1.2,-4],.018,'iron');box(x,1.15,-4,.65,.1,.5,'wood');}
    bench(-23,8);bench(21,13);sign('慢行 · 前面是学校',8,2.1,-2,3,.5);
    const busx=-21;box(busx,1.8,-15,5,.12,2.2,'teal');for(const x of[busx-2,busx+2])rod([x,.4,-15],[x,1.8,-15],.06);bench(busx,-15);sign('银杏街',busx,2.15,-15,2,.45);
  }
  if(area==='woods'){
    cyl(17,.43,-12,6,.08,'edge');cyl(17,.5,-12,5.5,.06,'water');for(let j=0;j<12;j++)ball(17+Math.cos(j*.524)*5.7,.7,-12+Math.sin(j*.524)*5.7,.6,'edge',1,.6,1);
    for(let j=0;j<13;j++){const x=-20+j*3.4,z=-16;ball(x,.6,z,.6,'edge',1,.5,1);flower(x+.7,z,'yellow');}
    for(let i=0;i<15;i++){const x=(rand()-.5)*38,z=(rand()-.5)*30;if(Math.abs(x)<4||Math.abs(z)<4)continue;ball(x,.6,z,.3+rand()*.4,'edge',1.3,.6,1);}
    sign('请把安静留给森林',0,2.1,16,4,.5);
  }
  if(area==='coast'){
    box(0,.34,16,60,.14,17,'water');box(15,.67,10.5,3,.2,12,'wood');for(let j=0;j<25;j++)box(15,.79,5.1+j*.46,3.1,.05,.06,'cream');for(let side of[-1,1])for(let j=0;j<5;j++){cyl(15+side*1.6,1.05,6+j*2,.08,1.3,'wood');if(j<4)rod([15+side*1.6,1.7,6+j*2],[15+side*1.6,1.7,8+j*2],.025);}
    for(let i=0;i<12;i++)ball(-23+i*3.3,.56,6+Math.sin(i)*.8,.45,'white',1.3,.35,1);
    for(const x of[-20,-9,4]){rod([x,.4,3],[x,3.3,3],.04);const o=new THREE.Mesh(new THREE.ConeGeometry(1.7,.65,10),b.mats.pink);o.position.set(x,3.3,3);root.add(o);bench(x,3);}
    sign('月湾 · 风经过的地方',-4,2.4,-15,5,.6);
  }
  for(const gate of GATES.filter(g=>g.area===area)){sign(gate.label,gate.x,2.15,gate.z,3,.55);rod([gate.x,.4,gate.z],[gate.x,2.45,gate.z],.06);}
  b.addAmbient(area);b.batch();return {root,builder:b,town:null};
}
function makeInterior(id){
  const root=new THREE.Group(),b=builder(root),{box,ball,cyl,rod,sign,pot}=b,bd=building(id),kind=bd.kind;
  box(0,.26,0,14.6,.35,12.6,'wood');box(0,.48,0,14,.08,12,'cream');
  for(let i=0;i<18;i++)box(-6.8+i*.8,.53,0,.025,.01,12,'wood');for(let z=-5.7;z<6;z+=2)box(0,.53,z,14,.01,.015,'wood');
  box(0,2,-6.1,14.5,3.2,.2,'wall');box(-7.1,2,0,.2,3.2,12,'wall');box(7.1,.75,0,.15,.5,12,'wall');box(0,.75,6.1,14,.5,.15,'wall');
  box(1,2.5,-5.95,3.5,1.7,.1,'cream');box(1,2.5,-5.83,3.15,1.4,.08,'window');for(const x of[-.6,2.6])box(x,2.6,-5.65,.55,2,.12,'pink');box(1,2.5,-5.73,.05,1.5,.06,'cream');box(1,2.5,-5.72,3.2,.05,.06,'cream');
  pot(-6,-4.8);pot(5.8,-4.8);pot(-6,4.5);sign(bd.name,0,3.4,-5.85,5,.45,'#999d80');box(0,.55,2.5,5,.025,3.5,kind==='home'?'teal':'pink');
  // All rooms have a readable exit and a few lived-in details.
  box(0,.56,5.5,1.7,.04,.8,'teal');sign('出口',0,1,6,1,.33);cyl(5.9,1.6,2,.05,2.2,'wood');cyl(5.9,2.8,2,.42,.55,'cream');
  for(const f of furnitureFor(id)){
    if(f.kind==='sleep'){box(f.x,.85,f.z,2, .6,3,'wood');box(f.x,1.2,f.z,1.9,.25,2.8,'white');box(f.x,1.4,f.z+.35,1.95,.2,1.9,'teal');box(f.x,1.5,f.z-1,1.4,.25,.5,'cream');box(f.x,1.55,f.z-1.5,2,.9,.12,'wood');box(f.x+1.7,1,f.z-1,.9,1,.8,'wood');ball(f.x+1.7,1.75,f.z-1,.25,'yellow');}
    if(f.kind==='cook'){box(f.x,1,f.z,2.5,1,1.1,'white');box(f.x,1.55,f.z,2.6,.12,1.2,'wood');for(const x of[-.65,.65])cyl(f.x+x,1.64,f.z,.35,.04,'iron');cyl(f.x+.65,1.9,f.z,.26,.4,'teal');box(f.x-.75,1.4,f.z+.58,.65,.5,.06,'window');for(let j=0;j<3;j++)box(f.x-1+j*.8,2.8,f.z-.4,.7,.8,.45,'cream');}
    if(f.kind==='mirror'){box(f.x,1.7,f.z,.18,2,1.4,'wood');box(f.x+.11,1.7,f.z,.08,1.8,1.15,'window');}
    if(f.kind==='diary'||f.kind==='study'||f.kind==='work'||f.kind==='paint'){box(f.x,1.35,f.z,2,.12,1.1,'wood');for(const x of[-.8,.8])for(const z of[-.4,.4])box(f.x+x,.9,f.z+z,.09,.85,.09,'wood');box(f.x,.95,f.z+1.05,.8,.12,.8,'teal');box(f.x,1.35,f.z+1.4,.8,.9,.1,'teal');for(let i=0;i<3;i++)box(f.x+.4,1.5+i*.08,f.z,.5,.06,.65,i%2?'teal':'pink');box(f.x-.4,1.47,f.z,.6,.02,.4,'white');
      if(f.kind==='work'){box(f.x,1.95,f.z-.2,1.1,.7,.1,'iron');box(f.x,1.95,f.z-.12,.95,.55,.03,'window');box(f.x,1.5,f.z+.15,.8,.04,.25,'cream');}
      if(f.kind==='paint'){box(f.x,2.1,f.z-.5,1.5,1.35,.08,'cream');for(let j=0;j<3;j++)ball(f.x-.4+j*.4,2.1+Math.sin(j)*.25,f.z-.43,.25,j%2?'teal':'pink',1,1,.1);}
    }
    if(f.kind==='bath'){box(f.x,.9,f.z,2.7,.75,1.5,'white');box(f.x,1.29,f.z,2.3,.04,1.1,'water');rod([f.x+1,.6,f.z-.6],[f.x+1,1.7,f.z-.6],.04,'iron');ball(f.x-1,1.4,f.z,.16,'white');}
    if(f.kind==='counter'){box(0,1.2,-1.7,9,1.5,1.2,'wood');box(0,2,-1.7,9.3,.15,1.35,'cream');for(let j=0;j<9;j++){if(kind==='flowers'){pot(-3.2+j*.8,-3.7);}else if(kind==='books'){for(let k=0;k<4;k++)box(-3.3+j*.8,1.2+k*.45,-4.8,.5,.35,.25,k%2?'teal':'pink');}else{ball(-3.2+j*.8,2.2,-1.65,.17,kind==='market'?'pink':'yellow',1,.6,1.1);}}box(3.5,2.25,-1.7,.6,.4,.6,'iron');}
    if(f.kind==='treatment'){box(f.x,.9,f.z,2,.7,3,'white');box(f.x,1.33,f.z,1.9,.2,2.8,'teal');box(f.x,1.5,f.z-1,1.3,.22,.5,'white');box(2,1.4,-4,3,2,.7,'cream');box(2,1.5,-3.6,.25,1,.04,'pink');box(2,1.5,-3.56,1,.25,.04,'pink');}
    if(f.kind==='rest'){box(f.x,1,f.z,2,.8,1.1,'teal');box(f.x,1.5,f.z-.45,2,1,.25,'teal');for(const side of[-1,1])box(f.x+side*.95,1.3,f.z,.2,.7,1.2,'teal');box(f.x,1.6,f.z-.2,.7,.5,.2,'cream');}
  }
  if(kind==='school'){for(const x of[1,3.4]){box(x,1.3,-1.5,1.7,.12,1,'wood');for(const side of[-1,1])box(x+side*.65,.9,-1.5,.1,.8,.7,'wood');box(x,1,-.3,.7,.8,.7,'teal');}box(-3,2.7,-5.85,4.5,1.6,.1,'teal');sign('今天也有新的发现',-3,2.7,-5.74,3.8,.65,'#708e7e');}
  if(kind==='home'){box(-6.8,2,2.9,.25,2.6,2,'wood');for(let j=0;j<8;j++)box(-6.5,1.2+(j%3)*.6,2.2+Math.floor(j/3)*.5,.25,.42,.25,j%2?'pink':'teal');}
  b.batch();return {root,builder:b,town:null};
}
function disposeScene(world){const geos=new Set(),mats=new Set(),textures=new Set();world.root.traverse(o=>{if(!o.isMesh&&!o.isSprite)return;if(o.isInstancedMesh)o.dispose();if(![boxGeo,ballGeo,cylGeo,coneGeo].includes(o.geometry)&&o.geometry)geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m)continue;mats.add(m);if(m.map)textures.add(m.map);}});geos.forEach(x=>x.dispose());mats.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());}
export class WorldView{
  constructor(scene){this.scene=scene;this.cache=new Map();this.active=null;this.key=null;this.avatars=new Map();this.avatarBatchRoot=new THREE.Group();scene.add(this.avatarBatchRoot);this.avatarBatches=[];this.avatarBatchesDirty=false;this.crops=new THREE.Group();scene.add(this.crops);this.cropSignature='';this.selection=new THREE.Mesh(new THREE.RingGeometry(.65,.72,40),new THREE.MeshBasicMaterial({color:'#f2dab3',transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));this.selection.rotation.x=-Math.PI/2;this.selection.visible=false;scene.add(this.selection);}
  load(area,inside){const key=inside?'room:'+inside:area;if(this.key===key)return;this.active?.root.removeFromParent();let world=this.cache.get(key);if(!world){if(inside)world=makeInterior(inside);else if(area==='center'){const root=new THREE.Group(),town=createTown(root,{life:true});world={root,town,builder:null};}else world=makeDistrict(area);this.cache.set(key,world);}this.cache.delete(key);this.cache.set(key,world);this.active=world;this.key=key;this.snapResidents=true;this.avatarBatchRoot.visible=!world.town;this.scene.add(world.root);this.cropSignature='';this.selection.visible=false;
    while(this.cache.size>2){const [oldKey,old]=this.cache.entries().next().value;this.cache.delete(oldKey);disposeScene(old);}for(const a of this.avatars.values())a.root.visible=false;
  }
  height(area,x,z,inside){return !inside&&area==='center'&&Math.abs(x-(-8.2+2.1*Math.sin(z*.16)+.8*Math.sin(z*.37)))<3.4&&(Math.abs(z+12)<1.4||Math.abs(z-12.3)<1.4)?.69:inside?.41:.31;}
  entities(s){if(s.player.inside){const room=s.player.inside;return [...furnitureFor(room).map(f=>({...f,type:'furniture'})),...s.npcs.filter(n=>!n.transit&&n.inside===room).map(n=>({...n,...npcPose(s,n),type:'npc'}))];}
    const area=s.player.area,list=[...BUILDINGS.filter(b=>b.area===area).map(b=>({...b,type:'building',x:b.door[0],z:b.door[1]})),...GATES.filter(g=>g.area===area).map(g=>({...g,type:'gate',name:g.label})),...PROPS.filter(p=>p.area===area).map(p=>({...p,type:'prop'})),...s.npcs.filter(n=>!n.transit&&!n.inside&&n.area===area).map(n=>({...n,type:'npc'}))];
    if(area==='center'&&this.active?.town)for(const a of this.active.town.entries().animals){const pos=this.active.town.positionFor(a);if(pos.y<4)list.push({id:a.name,name:a.shortName??a.name,x:pos.x,z:pos.z,type:'animal',data:a});}return list;
  }
  update(s,dt,camera){const p=s.player,cal=calendar(s.day),night=s.minute<360||s.minute>1150;
    if(this.active.builder){const m=this.active.builder.mats;m.grass.color.set(['#86bf64','#76b85c','#d1b267','#dde9d3'][cal.season]);m.leaf.color.set(['#75b45c','#599b4d','#c7a653','#a0b6a0'][cal.season]);m.leafLight.color.set(['#a7cf73','#92bd60','#e0bc65','#d0ddc7'][cal.season]);m.window.emissiveIntensity=night?.75:.12;this.active.builder.updateAmbient(dt,s.weather);}
    const visible=s.npcs.filter(n=>!n.transit&&n.area===p.area&&n.inside===p.inside),ids=new Set(visible.map(n=>n.id));
    if(this.active.town){const tm=this.active.town.materials;tm.grass.color.set(['#87bc63','#76af59','#c8ad68','#d5e4cf'][cal.season]);tm.leaf.color.set(['#6ba54f','#589446','#bd9c4f','#97ad96'][cal.season]);tm.leafLight.color.set(['#9bc867','#8cbb57','#d9b959','#c4d5bb'][cal.season]);for(const r of this.active.town.residents){const n=s.npcs[r.index];r.root.visible=ids.has(n.id);if(!r.root.visible)r.lifePlaced=false;if(r.root.visible){if(this.snapResidents||!r.lifePlaced||dt===0){r.root.position.x=n.x;r.root.position.z=n.z;}else{const alpha=1-Math.exp(-dt*6);r.root.position.x=THREE.MathUtils.lerp(r.root.position.x,n.x,alpha);r.root.position.z=THREE.MathUtils.lerp(r.root.position.z,n.z,alpha);}r.lifePlaced=true;r.root.rotation.y=n.facing;r.lifeMoving=n.path.length>0;}}this.active.town.update(dt,s.minute/60,s.weather==='cloudy'?'sunny':s.weather,camera);for(const a of this.avatars.values())a.root.visible=false;}
    else {for(const [id,a]of this.avatars){a.root.visible=ids.has(id);if(!a.root.visible)a.lifePlaced=false;}for(const n of visible){let a=this.avatars.get(n.id);const index=Number(n.id.slice(1));if(!a||a.yearCreated!==cal.year){a?.dispose();a=createAvatar({skin:index%4,hair:index%5,coat:index%6,hairstyle:index%3,accessory:index%7===0?1:0,baseAge:NPCS[index].baseAge+cal.year-1,occupation:NPCS[index].work==='hospital'?'hospital':null});a.yearCreated=cal.year;this.avatars.set(n.id,a);this.scene.add(a.root);this.avatarBatchesDirty=true;}a.root.visible=true;const pose=npcPose(s,n),x=pose.x,z=pose.z,y=p.inside?.41:.31;if(this.snapResidents||!a.lifePlaced||dt===0||a.root.position.distanceTo(new THREE.Vector3(x,y,z))>15)a.root.position.set(x,y,z);else{a.root.position.x=THREE.MathUtils.lerp(a.root.position.x,x,1-Math.exp(-dt*9));a.root.position.z=THREE.MathUtils.lerp(a.root.position.z,z,1-Math.exp(-dt*9));a.root.position.y=y;}a.lifePlaced=true;a.root.rotation.y=pose.facing;a.animate(dt,pose.moving,false,pose.gesture);}}
    this.updateAvatarBatches();this.snapResidents=false;this.crops.visible=p.area==='farm'&&!p.inside;if(this.crops.visible){const signature=JSON.stringify(s.plots);if(signature!==this.cropSignature){this.cropSignature=signature;disposeScene({root:this.crops});while(this.crops.children.length){const c=this.crops.children.pop();c.parent=null;}const cb=builder(this.crops);s.plots.forEach((plot,i)=>{const x=7+i%4*2.1,z=3+Math.floor(i/4)*2.1;if(plot.watered)cb.box(x,.53,z,1.65,.025,1.65,'dark');if(!plot.crop)return;for(const off of[-.4,.4]){if(plot.growth>=3)cb.ball(x+off,.7,z,.24,'white',1,1.2,1);for(let j=0;j<3;j++){const leaf=cb.ball(x+off+Math.cos(j*2.1)*.13,.75+plot.growth*.09,z+Math.sin(j*2.1)*.13,.17+plot.growth*.045,'leafDark',.5,1.4,.55);leaf.rotation.z=j-.9;}}});cb.batch();}}
  }
  updateAvatarBatches(){
    if(this.avatarBatchesDirty){for(const bin of this.avatarBatches){bin.mesh.removeFromParent();bin.mesh.dispose();bin.material.dispose();}this.avatarBatches=[];const bins=new Map();for(const avatar of this.avatars.values())avatar.root.traverse(part=>{if(!part.isMesh)return;part.visible=false;const key=part.geometry.uuid,bin=bins.get(key)??{geometry:part.geometry,material:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92}),sources:[]};bin.sources.push({part,root:avatar.root});bins.set(key,bin);});for(const bin of bins.values()){const mesh=new THREE.InstancedMesh(bin.geometry,bin.material,bin.sources.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);bin.sources.forEach((source,i)=>mesh.setColorAt(i,source.part.material.color));mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;this.avatarBatchRoot.add(mesh);this.avatarBatches.push({...bin,mesh});}this.avatarBatchesDirty=false;}
    if(!this.avatarBatchRoot.visible)return;const hidden=new THREE.Matrix4().makeScale(0,0,0);for(const a of this.avatars.values())a.root.updateMatrixWorld(true);for(const bin of this.avatarBatches){for(let i=0;i<bin.sources.length;i++){const source=bin.sources[i];bin.mesh.setMatrixAt(i,source.root.visible?source.part.matrixWorld:hidden);}bin.mesh.instanceMatrix.needsUpdate=true;}
  }
  highlight(entity){this.selection.visible=!!entity;if(entity)this.selection.position.set(entity.x,.59,entity.z);}
  dispose(){for(const world of this.cache.values())disposeScene(world);for(const a of this.avatars.values())a.dispose();for(const bin of this.avatarBatches){bin.mesh.dispose();bin.material.dispose();}disposeScene({root:this.crops});this.cache.clear();}
}
