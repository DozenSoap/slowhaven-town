export const SEASONS=['春','夏','秋','冬'];
export const WEEKDAYS=['日','一','二','三','四','五','六'];
export const WEATHER={sunny:'晴',cloudy:'多云',rain:'雨',snow:'雪'};
export const AREAS={
  farm:{name:'风眠农庄',subtitle:'有自己的屋檐，也有一小块可以慢慢种的地。',color:'#9aab7d',icon:'⌂'},
  center:{name:'河畔老街',subtitle:'面包香、慢火车，和逐渐熟悉的街坊。',color:'#c39780',icon:'♧'},
  civic:{name:'银杏新街',subtitle:'学校、医院与办公室，都有各自亮灯的时刻。',color:'#93aba5',icon:'▥'},
  woods:{name:'萤光森林',subtitle:'蘑菇长在树根旁，偶尔会遇见一位老朋友。',color:'#7b9777',icon:'♠'},
  coast:{name:'月湾海岸',subtitle:'把钓竿放下来，听一阵不赶时间的浪。',color:'#9abbb8',icon:'≈'},
};
export const IDENTITIES={newcomer:{name:'重新出发的人',note:'带着 500 枚小镇币，给生活留一点空白。',coins:500,skill:null},gardener:{name:'园艺爱好者',note:'多一袋种子，也更懂得照料植物。',coins:420,skill:'gardening'},student:{name:'求学的居民',note:'在学校学习，慢慢找到自己喜欢的方向。',coins:350,skill:'knowledge'},office:{name:'新来的职员',note:'从银杏事务所开始，按自己的节奏积累经验。',coins:650,skill:'career'},artist:{name:'自由创作者',note:'在写生与手作中找灵感。',coins:450,skill:'creativity'},retired:{name:'悠闲的邻居',note:'拥有更多日常经验，给新生活种一点花。',coins:700,skill:'gardening'}};
export const SKINS=['#edcbb0','#d5ac8b','#be9578','#956c53'];
export const HAIRS=['#55473d','#8c6951','#c5a16d','#d8d5c1','#4b5760'];
export const COATS=['#68a383','#aa91c8','#df9b6f','#66aabb','#d78197','#dcc16c'];
export const ITEMS={
  seed:{name:'萝卜种子',icon:'✦',price:12,note:'浇水三天后收获。'},turnip:{name:'白萝卜',icon:'♧',price:46,food:18},
  bread:{name:'热面包',icon:'◒',price:24,food:28},coffee:{name:'热咖啡',icon:'☕',price:28,food:8,energy:16},
  flower:{name:'一束雏菊',icon:'❀',price:20},apple:{name:'苹果',icon:'●',price:14,food:16},
  fish:{name:'月湾小鱼',icon:'⋈',price:36,food:10},mushroom:{name:'林间蘑菇',icon:'♠',price:18,food:8},
  soup:{name:'蔬菜浓汤',icon:'♨',price:42,food:48,health:5},shell:{name:'月白贝壳',icon:'◡',price:22},
};
const b=(id,name,area,x,z,w,d,kind,open=0,close=24,extra={})=>({id,name,area,x,z,w,d,kind,open,close,door:[x,z+d/2+1.2],...extra});
export const BUILDINGS=[
  b('home','我的风眠小屋','farm',-10,-6,7,5.5,'home'),
  b('greenhouse','四季温室','farm',12,-10,7,5,'greenhouse',6,22),
  b('bakery','麦香面包房','center',2.2,-6.5,4.1,3.8,'bakery',7,19),
  b('cafe','慢慢咖啡馆','center',15.1,5.4,4.5,4,'cafe',8,22,{door:[18,7.9]}),
  b('flowers','风信子花店','center',20.8,-6.2,4,4,'flowers',8,19),
  b('letters','写信人的家','center',15,-6.6,3.4,3.6,'neighbor',9,20),
  b('books','时光书屋','center',21.5,5.7,3.8,3.7,'books',8,20),
  b('riverside','河畔小屋','center',1.3,7.1,3.7,3.5,'neighbor',9,20),
  b('atelier','小画家的阁楼','center',1.4,-15.4,3.5,3.2,'studio',9,20),
  b('post','栖迟邮局','center',16,-15.5,4,3,'post',8,18),
  b('clockhome','钟表匠的家','center',21,-15.1,3,3,'neighbor',9,20),
  b('station','小镇车站','center',15.2,15.7,4.2,2.9,'station',6,23),
  b('gardenhome','园丁的小屋','center',-17,-6.2,3.6,3.8,'neighbor',9,20,{door:[-13.8,-6.2]}),
  b('pottery','陶艺工作室','center',-16.2,5.7,4,3.5,'studio',9,20,{door:[-12.9,5.7]}),
  b('hospital','银杏社区医院','civic',-13,-8,9,7,'hospital'),
  b('school','栖迟学园','civic',9,-10,11,7,'school',7,20),
  b('office','银杏事务所','civic',11,8,9,6,'office',8,19),
  b('market','四季杂货铺','civic',-12,8,8,6,'market',7,22),
  b('cabin','护林小屋','woods',-13,-10,6,5,'neighbor',8,21),
  b('seahouse','月湾茶亭','coast',-12,-7,6,5,'cafe',8,22),
];
export const building=id=>BUILDINGS.find(x=>x.id===id);
export const GATES=[
  {id:'farm-center',area:'farm',x:26,z:1,to:'center',spawn:[-24,12.3],label:'河畔老街 →'},
  {id:'center-farm',area:'center',x:-25,z:12.3,to:'farm',spawn:[24,1],label:'← 风眠农庄'},
  {id:'center-civic',area:'center',x:25,z:0,to:'civic',spawn:[-25,0],label:'银杏新街 →'},
  {id:'civic-center',area:'civic',x:-26,z:0,to:'center',spawn:[23,0],label:'← 河畔老街'},
  {id:'farm-woods',area:'farm',x:0,z:-20,to:'woods',spawn:[0,18],label:'↑ 萤光森林'},
  {id:'woods-farm',area:'woods',x:0,z:20,to:'farm',spawn:[0,-18],label:'↓ 风眠农庄'},
  {id:'civic-coast',area:'civic',x:0,z:20,to:'coast',spawn:[0,-18],label:'↓ 月湾海岸'},
  {id:'coast-civic',area:'coast',x:0,z:-20,to:'civic',spawn:[0,18],label:'↑ 银杏新街'},
];
export const PROPS=[
  ...Array.from({length:8},(_,i)=>({id:'plot'+i,area:'farm',x:7+(i%4)*2.1,z:3+Math.floor(i/4)*2.1,kind:'plot',name:'菜畦 '+(i+1),index:i})),
  {id:'shipping',area:'farm',x:-5,z:3,kind:'shipping',name:'收货木箱'},
  {id:'farmbench',area:'farm',x:-15,z:7,kind:'rest',name:'树荫下的长椅'},
  {id:'board',area:'center',x:8,z:3,kind:'board',name:'小镇留言板'},
  {id:'fountain',area:'center',x:3.8,z:5.4,kind:'rest',name:'喷泉边的座位'},
  {id:'riverfish',area:'center',x:-4,z:8.5,kind:'fish',name:'河边钓点'},
  {id:'woodfruit',area:'woods',x:10,z:-6,kind:'forage',item:'mushroom',name:'树根旁的蘑菇'},
  {id:'woodapple',area:'woods',x:-8,z:7,kind:'forage',item:'apple',name:'一棵野苹果树'},
  {id:'woodflower',area:'woods',x:16,z:8,kind:'forage',item:'flower',name:'林间野花'},
  {id:'woodbench',area:'woods',x:6,z:1,kind:'rest',name:'苔石长椅'},
  {id:'coastfish',area:'coast',x:15,z:10,kind:'fish',name:'月湾栈桥'},
  {id:'shell',area:'coast',x:-5,z:11,kind:'forage',item:'shell',name:'潮线边的贝壳'},
  {id:'coastbench',area:'coast',x:2,z:1,kind:'rest',name:'听海长椅'},
];
export const FURNITURE={
  bed:{name:'柔软的床',x:-5,z:-3,kind:'sleep'},kitchen:{name:'小厨房',x:4.6,z:-4,kind:'cook'},
  mirror:{name:'穿衣镜',x:-5.6,z:1,kind:'mirror'},diary:{name:'窗边书桌',x:4.6,z:0,kind:'diary'},
  bath:{name:'热水浴缸',x:4.6,z:3.4,kind:'bath'},counter:{name:'柜台',x:0,z:-1.7,kind:'counter'},
  desk:{name:'学习桌',x:-3,z:-1.5,kind:'study'},workdesk:{name:'我的工位',x:-3,z:-1.5,kind:'work'},
  treatment:{name:'诊疗床',x:-4,z:-2,kind:'treatment'},canvas:{name:'窗边画架',x:-3,z:-2,kind:'paint'},
  chair:{name:'窗边座位',x:4,z:1,kind:'rest'},exit:{name:'出门',x:0,z:5.2,kind:'exit'},
};
export function furnitureFor(id){const kind=building(id)?.kind;return (kind==='home'?['bed','kitchen','mirror','diary','bath']:kind==='hospital'?['treatment','chair']:kind==='school'?['desk','chair']:kind==='office'?['workdesk','chair']:kind==='studio'?['canvas','chair']:kind==='neighbor'?['diary','chair']:['counter','chair']).concat('exit').map(key=>({id:key,...FURNITURE[key]}));}
const names=['阿禾','林叔','小满','安安','余奶奶','小周','米粒','陈爷爷','苏苏','阿远','糯糯','木木','小叶','南星','晴晴','向阳','陶陶','陆先生','露露','小橙','阿森','桃子','星野','许老师','朵朵','小鹿','棠棠','阿澈','柚子','梅奶奶','小麦','青禾'];
const roles=['面包师','园丁','小画家','学生','退休居民','邮递员','书店店员','退休钟表匠','花店店主','旅人','学生','陶艺师','咖啡师','音乐爱好者','杂货店店主','车站工作人员','孩子','事务所职员','烘焙学徒','果农','护林员','糕点师','观星爱好者','老师','花艺学徒','学生','社区医生','摄影师','社区护士','编织爱好者','学生','插画师'];
const workplaces=['bakery','greenhouse','atelier','school','riverside','post','books','clockhome','flowers','cafe','school','pottery','cafe','atelier','market','station','school','office','bakery','greenhouse','cabin','bakery','books','school','flowers','school','hospital','atelier','hospital','riverside','school','atelier'];
const ages=[29,51,22,15,68,25,24,72,28,31,13,34,26,23,36,42,10,39,20,27,33,30,24,45,21,16,32,29,28,70,14,25];
export const NPCS=names.map((name,i)=>({id:'v'+i,index:i,name,role:roles[i],baseAge:ages[i],work:workplaces[i],home:['riverside','letters','gardenhome','clockhome'][i%4],likes:['bread','flower','apple','coffee','mushroom','shell'][i%6],birthday:(i*7+5)%56+1,personality:['温柔','好奇','慢热','开朗'][i%4],hobby:['河畔散步','照顾花草','看书','写生'][i%4]}));
export const QUESTS=[
  {id:'firsthello',name:'和一位邻居打招呼',note:'走近居民，聊聊天。',reward:35},
  {id:'firstplant',name:'种下第一颗种子',note:'去农庄菜畦，播种并浇水。',reward:45},
  {id:'firststudy',name:'给自己一点新知识',note:'去学校、书屋或办公室体验一次。',reward:50},
  {id:'firstharvest',name:'收获土地的第一份礼物',note:'浇水照料三天，收一颗萝卜。',reward:70},
  {id:'firstfriend',name:'在小镇有一位朋友',note:'与一位邻居的信任达到 12。',reward:80},
];
export function calendar(day){const y=Math.floor((day-1)/56)+1,d=(day-1)%56;return {year:y,season:Math.floor(d/14),date:d%14+1,weekday:(day-1)%7};}
export const level=x=>Math.floor(Math.sqrt(Math.max(0,x)/12))+1;
export function pathBetweenAreas(from,to){if(from===to)return [];const q=[[from,[]]],seen=new Set([from]);while(q.length){const [a,steps]=q.shift();for(const gate of GATES.filter(g=>g.area===a)){if(gate.to===to)return [...steps,gate];if(!seen.has(gate.to)){seen.add(gate.to);q.push([gate.to,[...steps,gate]]);}}}return [];}
