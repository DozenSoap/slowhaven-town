import * as THREE from 'three';

const PEOPLE=[
  ['阿禾','面包师','刚送完今天的面包，正沿着河边散步。','#d2a479','baker'],
  ['林叔','园丁','看看花，再看看树，今天的工作就完成了。','#809a76','gardener'],
  ['小满','小画家','带着速写本，找一朵形状特别的云。','#c59a91','artist'],
  ['安安','学生','放学后的小路，总比上学时长一点。','#91aaa7','student'],
  ['余奶奶','花草爱好者','散步的时候，会和每一只猫打招呼。','#b4a48c','elder'],
  ['小周','邮递员','信送到了，惦念也就到了。','#7f9e8f','post'],
  ['米粒','书店店员','刚读到一个好故事，走路都忍不住笑。','#c8b58a','reader'],
  ['陈爷爷','退休钟表匠','钟可以修慢一点，日子也是。','#a3afa1','elder'],
  ['苏苏','花店店主','今天最喜欢的是奶油色的小雏菊。','#c89d9d','florist'],
  ['阿远','旅人','下一班车还早，先去喝杯咖啡。','#94a6b4','traveler'],
  ['糯糯','学生','口袋里装着一颗漂亮的小石头。','#c9b887','balloon'],
  ['木木','陶艺师','一只新杯子，正在家里的窗台晾着。','#93a38d','potter'],
  ['小叶','咖啡师','闻着咖啡香醒来，是件很幸福的事。','#ba9b84','barista'],
  ['南星','音乐爱好者','小镇的脚步声，也是一种节奏。','#9daabe','musician'],
  ['晴晴','邻居','只是出来走走，没有特别的目的。','#c6a2ac','scarf'],
  ['向阳','车站工作人员','列车准点经过，每一趟都值得挥手。','#86a18e','conductor'],
  ['陶陶','孩子','正认真研究喷泉里的彩虹。','#d1b77f','child'],
  ['陆先生','写信的人','一封信的时间，刚好够走遍小镇。','#b0b5a1','letter'],
  ['露露','烘焙学徒','篮子里有一块刚出炉的小饼干。','#cda69b','baker'],
  ['小橙','果农','今天的苹果特别甜，想分你一颗。','#d1b38a','farmer'],
  ['阿森','护林员','知道哪棵树上住着一只爱睡觉的松鼠。','#879c7c','ranger'],
  ['桃子','糕点师','新做的小蛋糕，像一朵可食用的云。','#cdb0ad','baker'],
  ['星野','观星爱好者','白天认云，晚上认星星。','#9da8bf','astronomer'],
  ['许老师','老师','书里夹着孩子们送的小花。','#a5ac93','reader'],
  ['朵朵','花艺学徒','把好心情扎成一束，带回家。','#c7aaa3','florist'],
  ['小鹿','学生','今天想把整座小镇都画下来。','#b5b995','student'],
  ['棠棠','旅行作家','行李很轻，故事装得很满。','#b9a490','traveler'],
  ['阿澈','摄影师','正等一束落在屋檐上的光。','#9aaead','photographer'],
  ['柚子','骑行爱好者','把车停好，步行看看熟悉的街。','#bdaf8c','helmet'],
  ['梅奶奶','编织爱好者','正在给小孙女织一条草莓色围巾。','#b9a4b6','elder'],
  ['小麦','学生','风筝和愿望，今天都想飞高一点。','#d1bb84','balloon'],
  ['青禾','插画师','喜欢给平凡的小事画一圈金边。','#a9b79f','artist'],
];

export function createResidents(ctx){
  const {material,M,box,ball,cylinder,rod,groupAt,dynamicRoot,hitBox,rand,range,pick}=ctx;
  const residents=[],headGeo=new THREE.SphereGeometry(1,12,9),torsoGeo=new THREE.CapsuleGeometry(.18,.24,3,8);
  const skinMats=['#e6bfa0','#d5ac8b','#edcbb0','#be9578'].map((c,i)=>material('skinSoft'+i,c));
  const hairMats=['#716052','#a18a6c','#d9d5bf','#554c43','#927159'].map((c,i)=>material('softHair'+i,c));
  const eyeMat=material('softEyes','#45443e'),cheekMat=material('softCheeks','#d8a397'),buttonMat=material('coatButtons','#dfd7bb');
  const routes=[[[8,10],[8,2],[-3,2],[-3,10],[8,10]],[[12,-10],[23,-10],[23,-1.8],[12,-1.8],[12,-10]],[[8,-10],[-3,-10],[-3,-12],[-19,-12],[-19,-2],[-19,11],[-3,12],[8,12],[8,-10]],[[12,2],[23,2],[23,11],[12,11],[12,2]],[[8,14],[8,11],[-3,11],[-3,14],[8,14]],[[12,-13.3],[12,-10],[23,-10],[23,-13.3],[12,-13.3]]];
  const smoothBall=(parent,r,x,y,z,mat,sx=1,sy=1,sz=1)=>{const mesh=new THREE.Mesh(headGeo,mat);mesh.position.set(x,y,z);mesh.scale.set(r*sx,r*sy,r*sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  function basket(g,x=-.32,y=.63,z=.13){const b=groupAt(g,x,y,z);box(b,.31,.22,.26,0,0,0,M.lightWood);for(let j=0;j<3;j++)box(b,.32,.015,.27,0,-.07+j*.07,0,M.wood);const handle=new THREE.Mesh(new THREE.TorusGeometry(.15,.018,5,12,Math.PI),M.wood);handle.position.y=.09;b.add(handle);return b;}
  function book(g,color=M.roof){box(g,.28,.34,.085,-.31,.65,.19,color);box(g,.24,.29,.09,-.31,.65,.195,M.white);box(g,.28,.015,.1,-.31,.81,.19,color);}
  function hat(g,style,hair){if(style==='baker'){cylinder(g,.22,.1,0,1.48,0,M.white);for(let k=0;k<3;k++)smoothBall(g,.15,(k-1)*.13,1.6,0,M.white,1,.9,1);}else if(['gardener','farmer','ranger'].includes(style)){cylinder(g,.32,.045,0,1.46,0,M.cream);cylinder(g,.21,.15,0,1.53,0,M.cream,.18);cylinder(g,.215,.035,0,1.48,0,M.roof);}else if(style==='artist'){smoothBall(g,.27,0,1.48,0,M.teal,1,.33,.95);smoothBall(g,.035,.03,1.59,0,M.darkWood);}else if(['post','conductor'].includes(style)){smoothBall(g,.235,0,1.46,-.01,M.deepTeal,1,.48,1);box(g,.31,.035,.2,0,1.43,.18,M.deepTeal);ball(g,.037,0,1.49,.2,M.yellow);}else if(style==='helmet'){smoothBall(g,.25,0,1.43,0,M.yellow,1,.68,1);for(const x of [-.12,0,.12])rod(g,[x,1.57,-.12],[x,1.57,.14],.015,M.cream);}else if(style==='elder'){smoothBall(g,.115,-.17,1.38,-.02,hair);smoothBall(g,.115,.17,1.38,-.02,hair);}else if(style==='student'||style==='child'){for(const side of [-1,1]){smoothBall(g,.105,side*.22,1.3,-.07,hair);ball(g,.045,side*.22,1.29,.015,M.rose);}}}
  function glasses(g){for(const side of [-1,1]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.067,.009,4,14),M.darkWood);ring.position.set(side*.085,1.24,.218);g.add(ring);}rod(g,[-.024,1.24,.22],[.024,1.24,.22],.009,M.darkWood);}
  PEOPLE.forEach((data,i)=>{
    const [name,role,description,color,style]=data,g=new THREE.Group(),coat=material('coat'+i,color),pants=material('softPants'+(i%2),i%2?'#8d8d7b':'#777e76');
    const child=['student','child','balloon'].includes(style),elder=style==='elder',scale=child?.8:elder?.95:1.08,skin=skinMats[i%skinMats.length],hair=elder?hairMats[2]:hairMats[i%hairMats.length];
    const body=new THREE.Mesh(torsoGeo,coat);body.position.set(0,.79,0);body.scale.set(1.16,1,.94);body.castShadow=true;g.add(body);
    if(i%5===3){const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.16,.27,.3,10),coat);skirt.position.y=.58;skirt.castShadow=true;g.add(skirt);}
    box(g,.14,.1,.03,.1,.79,.18,M.cream);for(let b=0;b<3;b++)smoothBall(g,.019,0,.66+b*.11,.18,buttonMat);
    smoothBall(g,.232,0,1.23,0,skin,.98,1.03,.9);smoothBall(g,.239,0,1.34,-.018,hair,1,.66,1);
    for(const side of [-1,1]){smoothBall(g,.06,side*.22,1.22,0,skin,.55,1,.8);smoothBall(g,.016,side*.077,1.245,.204,eyeMat,.85,1.15,.65);smoothBall(g,.026,side*.116,1.175,.187,cheekMat,1.2,.6,.35);}
    smoothBall(g,.025,0,1.2,.215,skin,.8,.7,1);smoothBall(g,.055,-.1,1.39,.16,hair,1.2,.6,.6);smoothBall(g,.047,.0,1.405,.174,hair,1.2,.6,.6);
    if(elder||style==='reader'||style==='astronomer')glasses(g);
    hat(g,style,hair);
    const legs=[],arms=[];for(const side of [-1,1]){const leg=groupAt(g,side*.093,.55,0);cylinder(leg,.065,.38,0,-.18,0,pants);smoothBall(leg,.09,0,-.4,.035,M.darkWood,.8,.55,1.4);legs.push(leg);const arm=groupAt(g,side*.242,.99,0);cylinder(arm,.061,.33,0,-.15,0,coat);smoothBall(arm,.065,0,-.34,0,skin);arms.push(arm);}
    if(['baker','potter','barista','florist'].includes(style)){box(g,.28,.4,.04,0,.71,.187,M.cream);rod(g,[-.12,.94,.2],[-.15,.6,.2],.014,M.white);rod(g,[.12,.94,.2],[.15,.6,.2],.014,M.white);}
    if(style==='baker'){const b=basket(g);for(let k=0;k<3;k++){smoothBall(b,.095,(k-1)*.08,.16,0,M.yellow,.7,.55,1.4);}}
    else if(style==='farmer'){const b=basket(g);for(let k=0;k<4;k++)ball(b,.065,(k%2-.5)*.12,.15,-.05+Math.floor(k/2)*.1,M.rose);}
    else if(style==='florist'){rod(g,[-.32,.6,.15],[-.37,.98,.2],.025,M.leafDark);for(let k=0;k<5;k++){ball(g,.063,-.37+Math.sin(k*2.4)*.11,1.03+Math.cos(k*2.4)*.08,.2+(k%2)*.05,pick([M.pink,M.white,M.yellow]));}}
    else if(style==='gardener'){cylinder(g,.11,.19,-.32,.63,.15,M.teal);rod(g,[-.23,.65,.15],[-.13,.73,.23],.022,M.teal);}
    else if(style==='artist'){book(g,M.teal);cylinder(g,.11,.025,.3,.68,.1,M.cream);rod(g,[.31,.65,.15],[.32,.94,.15],.012,M.wood);ball(g,.026,.32,.95,.15,M.rose);}
    else if(['reader','letter','elder'].includes(style)){book(g,style==='letter'?M.cream:M.roof);if(elder)rod(g,[.31,.7,.08],[.31,.08,.1],.025,M.wood);}
    else if(['student','traveler','ranger','astronomer'].includes(style)){smoothBall(g,.2,0,.79,-.23,M.roof,.85,1.25,.5);for(const side of [-1,1])rod(g,[side*.12,.97,-.14],[side*.14,.6,-.1],.022,M.cream);if(style==='astronomer'){for(const side of [-1,1])cylinder(g,.055,.14,side*.07,.86,.24,M.iron);}}
    else if(style==='post'){box(g,.28,.32,.14,-.32,.68,.03,M.lightWood);rod(g,[-.26,.64,.15],[.2,1.05,.13],.021,M.cream);}
    else if(style==='balloon'){rod(g,[-.32,.65,.1],[-.42,1.9,.1],.008,M.cream);smoothBall(g,.22,-.42,2.08,.1,i%2?M.pink:M.yellow,.8,1.1,.8);}
    else if(style==='musician'){smoothBall(g,.17,-.31,.7,.16,M.lightWood,1,1.35,.45);smoothBall(g,.11,-.31,.87,.16,M.lightWood,1,1.1,.55);box(g,.055,.4,.055,-.31,1.1,.16,M.wood);smoothBall(g,.052,-.31,.76,.24,M.darkWood,.8,1,.2);}
    else if(style==='photographer'){box(g,.29,.18,.14,0,.82,.25,M.iron);const lens=cylinder(g,.08,.11,0,.82,.36,M.darkWood);lens.rotation.x=Math.PI/2;rod(g,[-.14,.85,.2],[0,1.01,.1],.013,M.darkWood);}
    else if(style==='barista'){cylinder(g,.15,.035,-.32,.67,.13,M.wood);cylinder(g,.055,.1,-.32,.73,.13,M.white);}
    else if(style==='scarf'){cylinder(g,.16,.07,0,1.05,0,M.rose);box(g,.09,.3,.045,.11,.89,.2,M.rose);}
    else if(style==='potter')cylinder(g,.08,.14,-.31,.68,.12,M.teal);
    g.scale.setScalar(scale);dynamicRoot.add(g);const route=routes[i%routes.length],offset=Math.floor(rand()*(route.length-1)),from=route[offset],to=route[(offset+1)%(route.length-1)],walked=range(.12,.88);g.position.set(THREE.MathUtils.lerp(from[0],to[0],walked)+range(-.18,.18),.42-.1*scale,THREE.MathUtils.lerp(from[1],to[1],walked)+range(-.15,.15));g.rotation.y=Math.atan2(to[0]-from[0],to[1]-from[1]);
    const actor={root:g,legs,arms,route,target:(offset+1)%(route.length-1),speed:range(child?.45:.32,child?.65:.55),wait:rand()*6,phase:rand()*8,index:i,scale,wave:0,data:{type:'resident',name:name+' · '+role,shortName:name,role,description,index:i,action:'和 TA 打个招呼',icon:({baker:'🥐',gardener:'🌱',artist:'🎨',student:'🎒',elder:'🧶',post:'✉️',reader:'📚',florist:'💐',traveler:'🧳',balloon:'🎈',potter:'🏺',barista:'☕',musician:'🎵',conductor:'🚂',child:'🧸',letter:'📝',farmer:'🍎',ranger:'🌲',astronomer:'🔭',photographer:'📷',helmet:'🚲',scarf:'🧣'})[style]}};
    hitBox(g,.75,1.8,.75,actor.data,.9);residents.push(actor);
  });
  return residents;
}
