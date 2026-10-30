import * as THREE from 'three';

export function enrichNeighborhood(ctx){
  const {scene,staticRoot,dynamicRoot,M,material,box,ball,cylinder,rod,groupAt,hitBox,tree,flowers,bench,sign,rand,range,pick,riverX}=ctx;
  const creamPink=material('blossomCream','#e1c4be'),blossomPink=material('blossomPink','#d8aaa9'),coral=material('coral','#c89678'),pondMat=material('pond','#7ea99c',{roughness:.25,transparent:true,opacity:.84,depthWrite:false});
  const glass=material('greenhouseGlass','#c5dacc',{transparent:true,opacity:.23,roughness:.22,depthWrite:false}),frameMat=material('greenhouseFrame','#80958b');
  const attractions=[],animals=[],hangingGlows=[];
  const reserve=[];
  function attraction(root,w,h,d,name,description,action,icon){const p=root.getWorldPosition(new THREE.Vector3());const data={type:'building',name,description,action,icon,position:p};hitBox(root,w,h,d,data,h/2);attractions.push(data);return data;}
  // A little glass conservatory with real plants, benches and frame details inside.
  const greenhouse=groupAt(staticRoot,-16.2,.35,-15.2);box(greenhouse,4.1,.16,2.85,0,0,0,M.paleStone);box(greenhouse,3.8,1.85,2.5,0,1,0,glass);
  for(const x of [-1.9,0,1.9])for(const z of [-1.25,1.25])rod(greenhouse,[x,0,z],[x,2,z],.035,frameMat);
  for(const z of [-1.25,1.25]){rod(greenhouse,[-1.9,2,z],[0,2.9,z],.045,frameMat);rod(greenhouse,[0,2.9,z],[1.9,2,z],.045,frameMat);rod(greenhouse,[-1.9,1.05,z],[1.9,1.05,z],.026,frameMat);}
  for(const x of [-1.9,0,1.9])rod(greenhouse,[x,x===0?2.9:2,-1.35],[x,x===0?2.9:2,1.35],.04,frameMat);
  const roofG=new THREE.BufferGeometry();roofG.setAttribute('position',new THREE.Float32BufferAttribute([-1.9,2,1.25,0,2.9,1.25,-1.9,2,-1.25,0,2.9,1.25,0,2.9,-1.25,-1.9,2,-1.25,0,2.9,1.25,1.9,2,1.25,0,2.9,-1.25,1.9,2,1.25,1.9,2,-1.25,0,2.9,-1.25],3));roofG.computeVertexNormals();greenhouse.add(new THREE.Mesh(roofG,glass));
  for(const x of [-1.25,1.25]){box(greenhouse,.75,.5,2, x,.4,0,M.wood);box(greenhouse,.6,.05,1.85,x,.67,0,M.soil);for(let k=0;k<5;k++){const z=-.75+k*.38;ball(greenhouse,.24,x,.9,z,M.leaf,1,1.4,1);ball(greenhouse,.08,x+.05,1.18,z,pick([M.pink,M.yellow,M.rose]));}}
  sign(greenhouse,'植物的慢时光',0,2.04,1.29,2.1,.32,'#e8e1c7','#688072');box(greenhouse,.7,1.65,.06,0,.9,1.29,frameMat);box(greenhouse,.57,1.5,.07,0,.92,1.33,glass);ball(greenhouse,.04,.19,.85,1.4,M.yellow);
  attraction(greenhouse,4.2,3.1,3,'玻璃温室','这里收藏了十二种绿意。\n一壶水，一点阳光，植物就会报以温柔。','给植物浇点水','🪴');reserve.push({x:-16.2,z:-15.2,r:3});
  // Lily pond and its small timber walkway.
  const pond=groupAt(staticRoot,-15.7,.35,-.3);const shore=cylinder(pond,2.9,.06,0,0,0,M.paleStone);shore.scale.z=.8;const water=cylinder(pond,2.65,.035,0,.065,0,pondMat);water.scale.z=.78;
  const lilyPositions=[];for(let i=0;i<9;i++){const a=i*2.4,r=range(.45,2.25),x=Math.cos(a)*r,z=Math.sin(a)*r*.66;const leaf=cylinder(pond,range(.18,.28),.015,x,.105,z,M.leafDark);leaf.rotation.y=a;lilyPositions.push(new THREE.Vector3(x-15.7,.48,z-.3));if(i%3===0){for(let p=0;p<5;p++)ball(pond,.075,x+Math.cos(p*1.25)*.07,.16,z+Math.sin(p*1.25)*.07,creamPink,1,.6,.5);ball(pond,.04,x,.19,z,M.yellow);}}
  for(let i=0;i<20;i++){const a=i/20*6.28,x=Math.cos(a)*2.9,z=Math.sin(a)*2.3;if(z< -1.6)continue;ball(pond,range(.1,.23),x,.08,z,M.stone,1.25,.7,1);if(i%2===0)for(let j=0;j<3;j++)rod(pond,[x+j*.08,.05,z],[x+.15+j*.08,range(.45,.8),z+.03],.02,M.leafDark);}
  for(let i=0;i<19;i++)box(pond,.25,.08,1,-2.45+i*.27,.18,-1.95,M.lightWood);for(const x of [-2.6,0,2.6]){cylinder(pond,.055,.67,x,.38,-2.35,M.wood);cylinder(pond,.055,.67,x,.38,-1.5,M.wood);}rod(pond,[-2.6,.65,-2.35],[2.6,.65,-2.35],.025,M.wood);
  bench(staticRoot,-12.3,.9,Math.PI/2);attraction(pond,6,.8,5,'睡莲池','睡莲把水面折成一封封绿色的信。\n锦鲤和小青蛙，是这里最悠闲的住户。','喂一小把鱼食','🪷');reserve.push({x:-15.7,z:-.3,r:3.2});
  const stepping=[];for(let i=0;i<9;i++){const x=-20+ i*.45,z=-3.4+Math.sin(i*.6)*.3;const s=cylinder(staticRoot,.2,.04,x,.37,z,M.paleStone);s.scale.z=.7;stepping.push(s);}
  // Orchard and a patchwork picnic blanket on the quiet bank.
  for(const [x,z] of [[-24.6,2.4],[-24.5,6.4],[-23.2,9.1],[-22.8,2.3]]){const g=groupAt(staticRoot,x,.33,z);cylinder(g,.1,1.85,0,.9,0,M.wood);for(let k=0;k<3;k++)ball(g,.7,Math.cos(k*2.1)*.35,2.02+Math.sin(k)*.1,Math.sin(k*2.1)*.3,M.leafLight,1,.95,1);for(let k=0;k<9;k++){const a=k*2.4;ball(g,.095,Math.cos(a)*.8,1.7+(k%3)*.24,Math.sin(a)*.7,k%3===0?M.yellow:M.rose);}}
  const orchard=groupAt(staticRoot,-23.7,.36,6.2);attraction(orchard,4,3,8,'慢熟果园','苹果在枝头晒太阳。\n果园的规矩很简单：熟了，就分给邻居。','摘一颗熟苹果','🍎');reserve.push({x:-23.8,z:5.5,r:4});
  const picnic=groupAt(staticRoot,-23.4,.36,-5.4);for(let x=0;x<5;x++)for(let z=0;z<5;z++)box(picnic,.36,.018,.36,(x-2)*.36,.02,(z-2)*.36,(x+z)%2?M.cream:creamPink);cylinder(picnic,.17,.22,.28,.16,.1,M.teal);cylinder(picnic,.09,.09,-.21,.1,.2,M.white);cylinder(picnic,.09,.09,.05,.1,-.32,M.white);box(picnic,.55,.26,.35,-.4,.16,-.3,M.lightWood);ball(picnic,.16,.45,.1,-.32,M.yellow,1.7,.6,.7);
  attraction(picnic,2.5,1,2.5,'野餐角落','茶还温着，小饼干也还有。\n草地把这一下午，留给了所有路过的人。','在这里歇一会儿','🧺');reserve.push({x:-23.4,z:-5.4,r:1.8});
  // The old vegetable bed moves to the orchard bank, keeping the pond clear.
  box(staticRoot,2.8,.08,2.5,-24,.36,-.3,M.soil);for(let row=0;row<4;row++)for(let col=0;col<5;col++){const x=-25+col*.5,z=-1.3+row*.6;ball(staticRoot,.17,x,.55,z,M.leafDark,1,.65,1);if((row+col)%3===0)ball(staticRoot,.12,x,.56,z,coral,1,.7,1);}
  for(let i=0;i<65;i++){const x=range(-25.4,-22),z=range(-11,-8.5),h=range(.25,.55);rod(staticRoot,[x,.34,z],[x,.34+h,z],.015,M.leafDark);for(let p=0;p<4;p++)ball(staticRoot,.06,x+Math.cos(p*1.57)*.06,.35+h,z+Math.sin(p*1.57)*.06,pick([M.yellow,M.pink,creamPink,M.white]),1,.6,1);}
  const meadow=groupAt(staticRoot,-23.7,.35,-9.7);attraction(meadow,4,1.6,3,'风里的小花田','雏菊、郁金香和野花挤在一起。\n蝴蝶路过的时候，会多停一小会儿。','送一阵温柔的风','🌷');reserve.push({x:-23.7,z:-9.7,r:2.4});
  // Two flowering trees, mushrooms and a tiny garden gate.
  for(const [x,z] of [[-2.6,15.8],[23.8,10.2]]){const g=groupAt(staticRoot,x,.33,z);cylinder(g,.13,2.5,0,1.2,0,M.wood,.08);for(let i=0;i<6;i++){const a=i*2.4;ball(g,.7,Math.cos(a)*.68,2.7+(i%2)*.35,Math.sin(a)*.6,i%2?creamPink:blossomPink,1,.8,1);}}
  for(let i=0;i<22;i++){const x=range(-25,-22),z=range(11,16);cylinder(staticRoot,.025,.16,x,.42,z,M.cream);const cap=ball(staticRoot,.09,x,.54,z,i%2?M.roof:coral,1,.55,1);ball(staticRoot,.015,x+.03,.58,z+.02,M.white);}
  const bookShelf=groupAt(staticRoot,23.5,.36,8.1);box(bookShelf,1.35,1.8,.4,0,.9,0,M.wood);for(const y of [.15,.75,1.35]){box(bookShelf,1.25,.07,.45,0,y,0,M.lightWood);for(let j=0;j<6;j++)box(bookShelf,.13,.4+rand()*.13,.24,-.51+j*.2,y+.25,.1,pick([M.teal,M.roof,M.cream,M.rose]));}sign(bookShelf,'借一本书 · 留一个故事',0,1.95,.04,1.9,.28,'#e7ddbf','#63765b');
  // A visible cascade continues down the edge of the physical island.
  const wx=riverX(23),cascade=groupAt(staticRoot,wx,0,23.65);box(cascade,3.7,.025,.9,0,.36,-.38,M.water);box(cascade,3.65,2.75,.035,0,-1.02,0,material('cascade','#94c6b6',{transparent:true,opacity:.68,roughness:.3}));for(let i=0;i<15;i++)box(cascade,.025,range(1.5,2.6),.02,-1.65+i*.23,-1,.03,M.waterGlint);const pool=cylinder(staticRoot,2.3,.03,wx,-3.03,24.0,M.water);pool.scale.z=.57;for(let i=0;i<8;i++)ball(staticRoot,.15,wx+range(-1.8,1.8),-2.35,23.8+range(-.15,.3),M.white,1.2,.45,1);
  // Catenary lights are real geometry; their little glow cards appear at dusk.
  for(const [x1,z1,x2,z2] of [[-2,1.35,7.4,1.35],[12.3,10.1,23.7,10.1]]){for(const [x,z] of [[x1,z1],[x2,z2]])rod(staticRoot,[x,.4,z],[x,3.6,z],.045,M.wood);let prev=null;for(let k=0;k<=16;k++){const t=k/16,p=[THREE.MathUtils.lerp(x1,x2,t),3.52-Math.sin(t*Math.PI)*.55,THREE.MathUtils.lerp(z1,z2,t)];if(prev)rod(staticRoot,prev,p,.013,M.darkWood);prev=p;if(k%2===0){rod(staticRoot,p,[p[0],p[1]-.15,p[2]],.012,M.darkWood);ball(staticRoot,.075,p[0],p[1]-.21,p[2],M.lamp);}}}
  const starArray=new Float32Array(110*3);for(let i=0;i<110;i++)starArray.set([range(-48,48),range(17,34),range(-40,35)],i*3);const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(starArray,3));const starMat=new THREE.PointsMaterial({color:'#fff2c7',size:.12,transparent:true,opacity:0,depthWrite:false}),stars=new THREE.Points(starGeo,starMat);dynamicRoot.add(stars);
  const fireflyArray=new Float32Array(35*3),fireGeo=new THREE.BufferGeometry();fireGeo.setAttribute('position',new THREE.BufferAttribute(fireflyArray,3));const fireMat=new THREE.PointsMaterial({color:'#dfe9a8',size:.13,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),fireflies=new THREE.Points(fireGeo,fireMat);dynamicRoot.add(fireflies);const fireSeed=Array.from({length:35},()=>({x:range(-19,-12),z:range(-3,3),phase:rand()*6.28}));
  const petals=[];for(let i=0;i<18;i++){const p=ball(dynamicRoot,.035,-2.6,2,15.8,creamPink,1,.3,.7);p.castShadow=false;petals.push({root:p,phase:rand()*6.28});}
  const animalLife=createAnimals({...ctx,lilyPositions,pondMat});animals.push(...animalLife.animals);
  let elapsed=0;
  function update(dt,night,weather){elapsed+=dt;starMat.opacity=night*.8;stars.visible=night>.15;fireMat.opacity=night*(.4+Math.sin(elapsed*.7)*.15);fireflies.visible=night>.2&&weather!=='snow';for(let i=0;i<fireSeed.length;i++){const f=fireSeed[i];fireflyArray.set([f.x+Math.sin(elapsed*.35+f.phase)*.6,1+Math.sin(elapsed*.6+f.phase)*.6,f.z+Math.cos(elapsed*.3+f.phase)*.5],i*3);}fireGeo.attributes.position.needsUpdate=true;for(const p of petals){const t=(elapsed*.12+p.phase)%1;p.root.position.set(-2.6+Math.sin(p.phase+t*2)*1.1,3.4-t*3,15.8+Math.cos(p.phase)*.7+t*.8);p.root.visible=weather==='sunny'&&night<.5;}animalLife.update(dt,elapsed);}
  return {animals,attractions,reserve,update,interact:animalLife.interact};
}

function createAnimals(ctx){
  const {M,material,box,ball,cylinder,rod,groupAt,hitBox,dynamicRoot,rand,range,pick,lilyPositions}=ctx;
  const animals=[];
  // Each family gets its own silhouette, face, ears and tail, rather than a color swap.
  function addAnimal(kind,name,x,z,scale=1){
    const g=groupAt(dynamicRoot,x,.37,z),cream=material('animalCream','#e9ddbf'),cocoa=material('animalCocoa','#97775d'),noseMat=material('animalNose','#65554b'),fur=kind==='fox'?material('foxFur','#c69571'):kind==='rabbit'?cream:kind==='frog'?material('frogSkin','#94aa78'):kind==='deer'?material('deerFur','#bfa17b'):kind==='goose'?M.white:kind==='hedgehog'?cocoa:kind==='squirrel'?material('squirrelFur','#ac8a64'):kind==='koi'?M.white:material('corgiFur','#c8a16f');
    const body=ball(g,.27,0,.3,0,fur,.95,.9,1.4),head=ball(g,.22,0,.58,.27,fur,1,.92,.9),ears=[],legs=[];
    const faceParts=[];
    for(const side of [-1,1]){faceParts.push(ball(g,.026,side*.09,.61,.45,noseMat));if(kind!=='frog'&&kind!=='koi')faceParts.push(ball(g,.06,side*.06,.51,.45,cream,1.1,.7,.65));}
    faceParts.push(ball(g,.03,0,.53,.495,kind==='frog'?fur:noseMat,1,.7,.7));
    if(kind==='rabbit'){for(const side of [-1,1]){const ear=ball(g,.11,side*.11,.87,.24,fur,.65,2.4,.6);ball(g,.067,side*.11,.91,.29,M.pink,.7,2,.25);ears.push(ear);}ball(g,.12,0,.36,-.42,M.white);}
    else if(kind==='fox'||kind==='corgi'){for(const side of [-1,1]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.11,.26,5),fur);ear.position.set(side*.16,.8,.24);g.add(ear);ears.push(ear);}const tail=ball(g,.2,kind==='fox'?.05:0,.4,-.47,fur,.7,.7,kind==='fox'?1.9:.65);if(kind==='fox')ball(g,.13,.05,.4,-.76,cream,.7,.75,1.2);if(kind==='corgi'){ball(g,.13,0,.62,.42,cream,.4,1.2,.4);const scarf=box(g,.31,.1,.12,0,.4,.3,M.teal);}}
    else if(kind==='squirrel'){const tail=ball(g,.24,0,.62,-.33,fur,.85,1.7,.8);for(const side of [-1,1])ears.push(ball(g,.08,side*.13,.8,.25,fur,.7,1.25,.7));ball(g,.1,0,.35,.28,M.lightWood,.7,.8,.8);}
    else if(kind==='hedgehog'){body.scale.set(.34,.24,.44);head.scale.setScalar(.16);for(let k=0;k<14;k++){const a=k*2.4;const sp=new THREE.Mesh(new THREE.ConeGeometry(.055,.18,4),noseMat);sp.position.set(Math.cos(a)*.24,.42+(k%3)*.05,Math.sin(a)*.27-.08);sp.rotation.z=Math.cos(a)*.5;g.add(sp);}}
    else if(kind==='deer'){head.position.y=.83;head.position.z=.24;body.position.y=.56;for(const side of [-1,1]){ears.push(ball(g,.115,side*.18,1.01,.2,fur,1,.7,.5));rod(g,[side*.1,.98,.14],[side*.17,1.23,.12],.02,M.wood);rod(g,[side*.17,1.14,.12],[side*.25,1.2,.13],.016,M.wood);}for(let k=0;k<7;k++)ball(g,.035,Math.sin(k*2.4)*.25,.6+(k%2)*.12,Math.cos(k*2.4)*.25,M.cream);}
    else if(kind==='frog'){body.scale.set(.32,.15,.3);head.position.set(0,.37,.17);head.scale.set(.25,.15,.18);for(const side of [-1,1]){ball(g,.09,side*.14,.51,.27,fur);ball(g,.035,side*.14,.52,.345,noseMat);ball(g,.1,side*.28,.12,.02,fur,1.4,.45,1.1);}}
    else if(kind==='goose'){body.scale.set(.28,.27,.42);head.position.set(0,.88,.26);head.scale.set(.16,.18,.16);cylinder(g,.065,.45,0,.63,.22,M.white);box(g,.12,.065,.2,0,.86,.44,M.yellow);for(const side of [-1,1])ball(g,.04,side*.08,.92,.38,noseMat);}
    else if(kind==='koi'){body.scale.set(.14,.07,.33);head.scale.set(.1,.065,.12);head.position.set(0,.3,.24);body.position.y=.3;for(const side of [-1,1]){ball(g,.095,side*.12,.3,-.32,M.roof,.8,.25,1.2);ball(g,.055,side*.08,.34,0,M.roof,1,.3,1.5);}ball(g,.075,0,.35,.1,M.roof,1.3,.3,1.4);}
    if(['frog','koi','goose'].includes(kind))faceParts.forEach(p=>p.removeFromParent());else{const offset=head.position.clone().sub(new THREE.Vector3(0,.58,.27));faceParts.forEach(p=>p.position.add(offset));}
    if(kind==='koi')for(const side of [-1,1])ball(g,.017,side*.065,.34,.31,noseMat);
    if(!['frog','koi','goose'].includes(kind))for(const side of [-1,1])for(const zz of [-.19,.2]){const leg=groupAt(g,side*.16,kind==='deer'?.45:.2,zz);cylinder(leg,.045,kind==='deer'?.4:.2,0,-.1,0,fur);legs.push(leg);}
    if(kind==='koi')g.position.y=.2;if(kind==='frog')g.position.y=.4;
    g.scale.setScalar(scale);const index=animals.length,descriptions={rabbit:'耳朵动了动，似乎在听草长高的声音。',corgi:'短短的腿，装着长长的快乐。',fox:'它住在树影里，今天愿意和你做朋友。',squirrel:'正抱着一颗松果，认真考虑藏在哪里。',hedgehog:'慢慢地走，身上的小刺也很温柔。',deer:'眼睛像清晨的池水，脚步轻得像风。',frog:'它的舞台是一片睡莲叶，观众是锦鲤。',goose:'昂首巡视池塘，偶尔也会偷偷打个盹。',koi:'尾巴一摆，把水面的光揉成了碎金。'};
    const data={type:'animal',name,shortName:name,role:{rabbit:'垂耳兔',corgi:'柯基',fox:'小狐狸',squirrel:'松鼠',hedgehog:'刺猬',deer:'小鹿',frog:'青蛙',goose:'白鹅',koi:'锦鲤'}[kind],description:descriptions[kind]+'\n'+(kind==='koi'?'要不要给它一点鱼食？':'你可以和它打个招呼。'),icon:{rabbit:'🐰',corgi:'🐶',fox:'🦊',squirrel:'🐿️',hedgehog:'🦔',deer:'🦌',frog:'🐸',goose:'🪿',koi:'🐟'}[kind],action:kind==='koi'?'喂一小把鱼食':kind==='frog'?'听它唱一小句':'和它亲近一下',animalIndex:index};
    const actor={root:g,body,head,ears,legs,kind,data,base:g.position.clone(),phase:rand()*6.28,pace:range(.13,.24),greet:0};animals.push(actor);hitBox(g,kind==='deer'?1:.8,kind==='deer'?1.5:1,.95,data,kind==='deer'?.65:.45);return actor;
  }
  addAnimal('corgi','栗子 · 街角的小柯基',12,8,.95);
  addAnimal('rabbit','糯米 · 花田白兔',-23.2,-8.5,.9);addAnimal('rabbit','豆包 · 果园小兔',-23,5.3,.75);addAnimal('rabbit','团团 · 爱睡觉的小兔',-24.4,12,.8);
  addAnimal('fox','琥珀 · 林间小狐狸',-23,15.5,.95);
  addAnimal('squirrel','松果 · 果园管理员',-24,3.3,.72);addAnimal('squirrel','榛子 · 树影里的邻居',-13,9.5,.65);
  addAnimal('hedgehog','芝麻 · 慢慢走的小刺猬',-22.5,13.4,.7);addAnimal('hedgehog','小栗 · 草地探险家',-2,13.8,.65);
  addAnimal('deer','棉花 · 林间小鹿',-23.1,10.5,1.05);addAnimal('deer','浅浅 · 安静的小鹿',-24.5,15.1,.8);
  addAnimal('goose','棉朵 · 睡莲池白鹅',-18.2,1.8,.8);
  for(let i=0;i<3;i++){const p=lilyPositions[(i*3+1)%lilyPositions.length],a=addAnimal('frog',['绿豆 · 睡莲歌手','抹茶 · 池塘守望者','青团 · 小小跳水员'][i],p.x,p.z,.55);a.base.y=.46;a.root.position.y=.46;}
  for(let i=0;i<6;i++){const a=addAnimal('koi',['赤豆','金盏','点点','云朵','游游','小满'][i]+' · 睡莲池锦鲤',-15.7+Math.sin(i)*1.3,-.3+Math.cos(i)*.9,.75);a.base.y=.2;a.root.position.y=.2;}
  let elapsed=0;
  function update(dt,time){elapsed=time;for(const a of animals){a.greet=Math.max(0,a.greet-dt);const t=elapsed*a.pace+a.phase,swim=a.kind==='koi';let x=a.base.x+Math.sin(t)*(swim?.65:.35),z=a.base.z+Math.cos(t*.8)*(swim?.45:.25),y=a.base.y;if(a.kind==='frog'){x=a.base.x;z=a.base.z;y+=Math.max(0,Math.sin(t*2.7))**8*.24;}else if(a.kind==='rabbit')y+=Math.max(0,Math.sin(t*4))*.1;if(a.greet>0){if(swim){const toward=Math.min(1,(3-a.greet)*1.5);x=THREE.MathUtils.lerp(a.base.x,-15.7+Math.sin(elapsed+a.phase)*.35,toward);z=THREE.MathUtils.lerp(a.base.z,-.3+Math.cos(elapsed+a.phase)*.3,toward);}else{x=a.base.x;z=a.base.z;}y+=Math.sin((3-a.greet)*4)*.03;a.head.rotation.z=Math.sin(elapsed*3)*.12;}else a.head.rotation.z*=.96;a.root.position.set(x,y,z);a.root.rotation.y=Math.atan2(Math.cos(t),-Math.sin(t*.8));for(let i=0;i<a.legs.length;i++)a.legs[i].rotation.x=Math.sin(t*5+i*Math.PI)*.13;for(let i=0;i<a.ears.length;i++)a.ears[i].rotation.z=Math.sin(elapsed*1.2+a.phase+i)*.07;}}
  function interact(index){const a=animals[index];if(a)a.greet=3;}
  return {animals,update,interact};
}
