import {NPCS,ITEMS,QUESTS,building,calendar,pathBetweenAreas,IDENTITIES} from './content.js';
import {findPath,moveAlong,nearestWalkable} from './navigation.js';
import {outdoorTarget} from './routines.js';
export const SCHEMA=2;
export const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
export function hash(seed,n){let x=(seed^Math.imul(n+1,374761393))>>>0;x=Math.imul(x^(x>>>13),1274126177);return (x^(x>>>16))>>>0;}
export function weatherFor(seed,day){const c=calendar(day),r=hash(seed,day)/4294967296;if(c.season===3)return r<.42?'snow':r<.76?'cloudy':'sunny';return r<([.25,.34,.28][c.season])?'rain':r<.48?'cloudy':'sunny';}
export function createLife(profile={},seed=(Date.now()^Math.floor(Math.random()*1e9))>>>0){
  const identity=Object.hasOwn(IDENTITIES,profile.identity)?profile.identity:'newcomer';
  const p={name:String(profile.name||'小迟').trim().slice(0,14)||'小迟',gender:['女','男','自由表达'].includes(profile.gender)?profile.gender:'女',baseAge:clamp(Math.round(Number(profile.age)||24),12,80),identity,skin:clamp(Number(profile.skin)||0,0,3),hair:clamp(Number(profile.hair)||0,0,4),coat:clamp(Number(profile.coat)||0,0,5),hairstyle:clamp(Number(profile.hairstyle)||0,0,2),accessory:clamp(Number(profile.accessory)||0,0,2),area:'farm',inside:null,x:-9,z:0,facing:0,energy:100,hunger:90,mood:82,health:100,stress:0,coins:IDENTITIES[identity].coins,skills:{gardening:0,knowledge:0,career:0,creativity:0,fishing:0},inventory:{seed:identity==='gardener'?12:6,bread:3,flower:1},steps:0,habits:{activeDays:0,lateNights:0}};
  if(IDENTITIES[identity].skill)p.skills[IDENTITIES[identity].skill]=24;
  const s={schema:SCHEMA,id:globalThis.crypto?.randomUUID?.()??'life-'+Date.now().toString(36)+'-'+seed,revision:0,seed,day:1,minute:480,clockFraction:0,weather:weatherFor(seed,1),player:p,plots:Array.from({length:8},()=>({crop:null,growth:0,watered:false})),relations:Object.fromEntries(NPCS.map(n=>[n.id,{trust:0,affinity:0,stage:'陌生人',lastChat:0,lastGift:0,lastHelp:0,lastInvite:0,memory:[],promise:null}])),npcs:[],daily:{forage:[],work:0,study:0,paint:0,rest:0,pet:[],fish:0},flags:{},claimed:[],journal:[],lastSleep:null,event:null};
  s.npcs=NPCS.map(n=>{const home=building(n.home);return {id:n.id,area:home.area,x:home.door[0],z:home.door[1],inside:n.home,task:'准备出门',target:null,path:[],transit:null,facing:0};});
  initializeNPCs(s);log(s,'你搬进了风眠小屋。新生活，从今天开始。');return s;
}
export function ageOf(s,base=s.player.baseAge){return base+Math.floor((s.day-1)/56);}
export function log(s,text){s.journal.unshift({day:s.day,minute:s.minute,text});if(s.journal.length>80)s.journal.length=80;}
export function relationship(r){return r.stage==='恋人'?'恋人':r.trust>=40?'知心朋友':r.trust>=12?'朋友':r.trust>=4?'熟悉的邻居':'陌生人';}
export function scheduleFor(s,n){
  const h=s.minute/60,c=calendar(s.day),weekend=c.weekday===0||c.weekday===6;
  const promise=s.relations[n.id]?.promise;if(promise?.day===s.day&&!promise.done&&h>=17&&h<19.5)return {place:'cafe',task:'赴今天傍晚的约定'};
  if(h<7||h>=21)return {place:n.home,task:h<7?'还在休息':'回家休息'};
  if((s.day+n.index*3)%17===0&&h>=14&&h<17)return {place:'coast',task:'偶尔给自己放个假'};
  if(h<8)return {place:'bakery',task:'买一份早餐'};
  if(h>=12&&h<13)return {place:n.index%2?'market':'cafe',task:'午间休息'};
  const retired=n.baseAge>=65;
  if((!weekend||['hospital','station','bakery','cafe','market'].includes(n.work))&&!retired&&h<17&&(n.baseAge>=18||h<15))return {place:n.work,task:n.baseAge<18?'在学校上课':n.role.includes('老师')?'在学园教课':n.role.includes('医生')||n.role.includes('护士')?'照顾来诊的居民':'在'+building(n.work).name+'工作'};
  if(s.weather==='rain'||s.weather==='snow')return {place:n.index%3?'books':'cafe',task:s.weather==='snow'?'在屋里躲一会儿雪':'在屋檐下等雨停'};
  if(h>=18&&h<20)return {place:n.index%2?'cafe':n.home,task:'吃晚饭'};
  if(retired||n.index%3===0)return {place:'center',task:'沿着河畔散步'};
  return {place:n.index%3===1?'woods':'farm',task:n.index%3===1?'在树林里找一点灵感':'在农庄的花间走走'};
}
function initializeNPCs(s){
  for(const npc of s.npcs){const profile=NPCS.find(n=>n.id===npc.id),goal=scheduleFor(s,profile),b=building(goal.place),area=b?.area??goal.place,point=b?.door??outdoorTarget(s,profile,area,-1);Object.assign(npc,{area,x:point[0],z:point[1],inside:b?.id??null,task:goal.task,target:goal.place,path:[],transit:null});}
  updateNPCs(s,0);
}
function updateNPCs(s,dt){
  for(const npc of s.npcs){const n=NPCS.find(n=>n.id===npc.id),goal=scheduleFor(s,n),b=building(goal.place),area=b?.area??goal.place,point=b?.door??outdoorTarget(s,n,area);npc.task=goal.task;
    if(npc.target!==goal.place){npc.target=goal.place;npc.inside=null;npc.path=[];if(npc.area!==area){npc.transit={area,place:goal.place,remaining:8+pathBetweenAreas(npc.area,area).length*12};}else{npc.transit=null;npc.path=findPath(area,[npc.x,npc.z],point);}}
    if(npc.transit){npc.transit.remaining=Math.max(0,npc.transit.remaining-dt);if(npc.transit.remaining===0){npc.area=area;const p=b?.door??outdoorTarget(s,n,area,-1);npc.x=p[0];npc.z=p[1];npc.transit=null;npc.inside=b?.id??null;npc.path=[];}continue;}
    if(npc.area!==area||npc.inside)continue;
    if(!b){const end=npc.path.at(-1);if((!end||Math.hypot(end[0]-point[0],end[1]-point[1])>.1)&&Math.hypot(npc.x-point[0],npc.z-point[1])>.1)npc.path=findPath(area,[npc.x,npc.z],point);}
    if(npc.path.length)moveAlong(npc,npc.path,dt*(n.baseAge>=65?.82:n.baseAge<18?1.45:1.18));
    if(b&&!npc.path.length&&Math.hypot(npc.x-point[0],npc.z-point[1])<2)npc.inside=b.id;
  }
}
export function advance(s,minutes){
  if(!Number.isFinite(minutes)||minutes<0||minutes>43200)throw new Error('时间跨度无效');
  let remaining=minutes;
  while(remaining>1e-9){
    const step=Math.min(remaining,1-s.clockFraction);updateNPCs(s,step);s.clockFraction+=step;remaining-=step;
    if(s.clockFraction<1-1e-9)continue;s.clockFraction=0;s.minute++;
    const p=s.player;p.hunger=clamp(p.hunger-.025);p.energy=clamp(p.energy-(s.minute>1320?.04:.012));
    if(p.hunger<18){p.energy=clamp(p.energy-.045);p.mood=clamp(p.mood-.018);}
    if(p.energy<12){p.stress=clamp(p.stress+.035);p.health=clamp(p.health-.012,15,100);}
    if(p.mood>75&&p.hunger>40)p.stress=clamp(p.stress-.005);
    if(s.minute>=1440)finishDay(s,true);
  }
}
function reward(s,id){s.flags[id]=true;}
function itemCount(s,id){return s.player.inventory[id]||0;}
function addItem(s,id,n=1){s.player.inventory[id]=(s.player.inventory[id]||0)+n;if(s.player.inventory[id]<=0)delete s.player.inventory[id];}
function finishDay(s,forced=false){
  const p=s.player,wasRain=s.weather==='rain',grown=[];
  s.plots.forEach((plot,i)=>{if(plot.crop&&(plot.watered||wasRain)){plot.growth=Math.min(3,plot.growth+1);if(plot.growth===3)grown.push(i+1);}plot.watered=false;});
  const summary={day:s.day,forced,coins:p.coins,grown,energyBefore:Math.round(p.energy),note:forced?'你在困意中被邻居送回了家。熬夜让身体有些疲惫。':'你合上日记，把今天留在了枕边。'};
  if(forced||s.minute>1380){p.habits.lateNights++;p.health=clamp(p.health-(forced?7:2),15,100);p.stress=clamp(p.stress+4);}else{p.health=clamp(p.health+(p.hunger>35?4:1),15,100);p.stress=clamp(p.stress-8);}
  if(p.steps>180){p.habits.activeDays++;p.health=clamp(p.health+1,15,100);}p.steps=0;
  for(const r of Object.values(s.relations)){if(r.promise&&r.promise.day===s.day&&!r.promise.done){r.trust=clamp(r.trust-3);r.memory.unshift('约好的见面没有等到你');r.memory.length=Math.min(r.memory.length,5);}r.stage=relationship(r);}
  s.day++;s.minute=420;s.clockFraction=0;s.weather=weatherFor(s.seed,s.day);p.energy=forced?60:clamp(70+p.health*.3);p.hunger=clamp(p.hunger-8,20,100);p.mood=clamp(p.mood+(forced?-6:4));p.area='farm';p.inside='home';p.x=-3.5;p.z=-1;
  s.daily={forage:[],work:0,study:0,paint:0,rest:0,pet:[],fish:0};s.lastSleep=summary;
  const cal=calendar(s.day);if(cal.date===1){log(s,`新的${['春','夏','秋','冬'][cal.season]}季到了。`);if(cal.season===0&&s.day>1){log(s,`今天，你 ${ageOf(s)} 岁了。新的一年，好好照顾自己。`);p.health=clamp(p.health-(ageOf(s)>60?2:0),15,100);}}
  s.event=hash(s.seed,s.day+91)%5===0?{type:'market',text:'今日邻里集市：农庄收货箱的农产品收购价提高 20%。'}:hash(s.seed,s.day+23)%7===0?{type:'letter',text:'一位老邻居给新来的你留了两颗苹果。',claimed:false}:null;
  log(s,'睡了一个'+(forced?'有点仓促':'安稳')+'的觉。'+(grown.length?'菜畦里的萝卜已经成熟了。':''));updateNPCs(s,0);
}
export function isOpen(s,b){const h=s.minute/60;return h>=b.open&&h<b.close;}
const ok=(message,extra={})=>({ok:true,message,...extra}),fail=message=>({ok:false,message});
export function act(s,action,data={}){
  const p=s.player,inv=p.inventory;
  const cost=(mins,energy=0,coins=0)=>{if(s.minute+mins>=1440)return '太晚了，先回家休息，明天再来。';if(p.energy<energy)return '有点累了，吃点东西或坐下歇歇吧。';if(p.coins<coins)return '小镇币还不够，可以先做一点委托或卖些收获。';p.energy-=energy;p.coins-=coins;advance(s,mins);return null;};
  if(action==='enter'){const b=building(data.id);if(!b||b.area!==p.area||p.inside)return fail('先来到这栋建筑门前。');if(Math.hypot(p.x-b.door[0],p.z-b.door[1])>2.5)return fail('再走近门口一点吧。');if(!isOpen(s,b))return fail(`${b.name}已经打烊，营业时间 ${b.open}:00—${b.close}:00。`);p.inside=b.id;p.x=0;p.z=3.7;return ok('推开门，来到了'+b.name+'。');}
  if(action==='exit'){const b=building(p.inside);if(!b)return fail('已经在室外了。');p.area=b.area;p.inside=null;[p.x,p.z]=b.door;return ok('回到街上，风轻轻吹过。');}
  if(action==='sleep'){if(p.inside!=='home')return fail('回到自己的小屋，才能安心入睡。');finishDay(s);return ok('早安，新的一天已经在窗外等你。',{slept:true});}
  if(action==='eat'){const item=ITEMS[data.item];if(!item?.food||!itemCount(s,data.item))return fail('背包里没有这份食物。');const e=cost(2);if(e)return fail(e);addItem(s,data.item,-1);p.hunger=clamp(p.hunger+item.food);p.energy=clamp(p.energy+(item.energy||4));p.health=clamp(p.health+(item.health||0),15,100);p.mood=clamp(p.mood+2);return ok('慢慢吃完了'+item.name+'，身体暖了一点。');}
  if(action==='buy'){const b=building(p.inside),stock=b?({bakery:['bread'],cafe:['coffee','bread'],flowers:['flower'],market:['seed','bread','apple','flower'],greenhouse:['seed'],books:[]})[b.kind]:null;if(!stock?.includes(data.item))return fail('这里没有出售这件物品。');if(!isOpen(s,b))return fail('柜台已经休息了，明天再来。');const item=ITEMS[data.item],e=cost(1,0,item.price);if(e)return fail(e);addItem(s,data.item);return ok('买到了'+item.name+'。');}
  if(action==='sell'){if(p.area!=='farm'||p.inside||Math.hypot(p.x+5,p.z-3)>2.5)return fail('走近农庄的收货木箱再出售。');if(!['turnip','fish','mushroom','apple','shell','flower'].includes(data.item)||!itemCount(s,data.item))return fail('背包里没有可出售的这件物品。');const n=Math.min(itemCount(s,data.item),data.all?999:1),price=Math.round(ITEMS[data.item].price*(s.event?.type==='market'&&['turnip','apple','flower'].includes(data.item)?1.2:1));addItem(s,data.item,-n);p.coins+=price*n;log(s,`出售了 ${n} 份${ITEMS[data.item].name}，收入 ${price*n} 币。`);return ok(`卖出 ${n} 份${ITEMS[data.item].name}，收入 ${price*n} 币。`);}
  if(action==='plant'||action==='water'||action==='harvest'){const i=Number(data.plot),plot=s.plots[i];if(!plot||p.area!=='farm'||p.inside||Math.hypot(p.x-(7+i%4*2.1),p.z-(3+Math.floor(i/4)*2.1))>2.6)return fail('先走到自己的菜畦旁。');
    if(action==='plant'){if(plot.crop)return fail('这里已经种下了萝卜。');if(!itemCount(s,'seed'))return fail('种子用完了，去杂货铺或温室买一点吧。');const e=cost(5,3);if(e)return fail(e);addItem(s,'seed',-1);Object.assign(plot,{crop:'turnip',growth:0,watered:s.weather==='rain'});p.skills.gardening+=3;if(s.weather==='rain')reward(s,'firstplant');return ok('把种子轻轻放进土里。记得每天浇水。');}
    if(action==='water'){if(!plot.crop)return fail('先播一颗种子吧。');if(plot.watered||s.weather==='rain')return fail(s.weather==='rain'?'今天有雨，天空已经替你浇过水了。':'今天已经浇过水了。');const e=cost(3,2);if(e)return fail(e);plot.watered=true;p.skills.gardening++;reward(s,'firstplant');return ok('土壤润了，种子也有了精神。');}
    if(plot.growth<3)return fail('还没有成熟，再照料几天吧。');const e=cost(4,2);if(e)return fail(e);const count=calendar(s.day).season===3?1:2;addItem(s,'turnip',count);Object.assign(plot,{crop:null,growth:0,watered:false});p.skills.gardening+=8;p.mood=clamp(p.mood+5);reward(s,'firstharvest');log(s,'收获了亲手种的白萝卜。');return ok('收获了 '+count+' 颗白萝卜。');
  }
  if(action==='fish'){if(p.inside||!((p.area==='coast'&&Math.hypot(p.x-15,p.z-10)<3)||(p.area==='center'&&Math.hypot(p.x+4,p.z-8.5)<3)))return fail('去水边的钓点，先把自己安顿下来。');const e=cost(25,7);if(e)return fail(e);const chance=hash(s.seed,s.day*10000+s.daily.fish++*97+s.minute)%100;if(chance<73+Math.min(20,p.skills.fishing/10)){addItem(s,'fish');p.skills.fishing+=6;p.mood=clamp(p.mood+3);return ok('浮标轻轻动了，你钓起了一尾月湾小鱼。');}p.skills.fishing+=2;return ok('鱼没有上钩，不过你听完了一阵风。');}
  if(action==='forage'){const id=data.id,spots={woodfruit:['woods',10,-6,'mushroom'],woodapple:['woods',-8,7,'apple'],woodflower:['woods',16,8,'flower'],shell:['coast',-5,11,'shell']},spot=spots[id];if(!spot||p.area!==spot[0]||p.inside||Math.hypot(p.x-spot[1],p.z-spot[2])>3)return fail('先走近那份林间小礼物。');if(s.daily.forage.includes(id))return fail('今天已经采过了，给自然一点时间吧。');const e=cost(8,3);if(e)return fail(e);s.daily.forage.push(id);addItem(s,spot[3],spot[3]==='flower'?1:2);return ok('收好了'+ITEMS[spot[3]].name+'。明天路过时再看看。');}
  if(['chat','gift','help','invite','meet','romance'].includes(action)){
    const n=NPCS.find(n=>n.id===data.npc),npc=s.npcs.find(n=>n.id===data.npc);if(!n||!npc||npc.transit||npc.area!==p.area||npc.inside!==p.inside||Math.hypot(p.x-npc.x,p.z-npc.z)>3.3&&!p.inside)return fail('先走到 TA 身边吧。');
    const r=s.relations[n.id];let message;
    if(action==='chat'){if(r.lastChat===s.day)return ok('“今天和你聊过了，剩下的故事留到明天吧。”');const e=cost(8,1);if(e)return fail(e);r.lastChat=s.day;r.trust=clamp(r.trust+2);p.mood=clamp(p.mood+3);reward(s,'firsthello');const lines=[`“${s.weather==='rain'?'下雨也有下雨的好，屋檐下总能多聊两句。':'你有没有发现，今天的风闻起来有一点甜？'}”`,`“我喜欢${n.hobby}。下次有机会，一起走走吧。”`,`“${r.trust>=12?'看见熟悉的人，普通的一天也会亮一点。':'新搬来的日子还习惯吗？有事可以来找我。'}”`];message=lines[(s.day+n.index)%lines.length];}
    if(action==='gift'){if(r.lastGift===s.day)return fail('今天已经送过礼物了，心意不用堆得太满。');if(!ITEMS[data.item]||!itemCount(s,data.item))return fail('背包里没有这份礼物。');const e=cost(3);if(e)return fail(e);addItem(s,data.item,-1);r.lastGift=s.day;const loved=data.item===n.likes;r.trust=clamp(r.trust+(loved?5:2));r.affinity=clamp(r.affinity+(loved?4:1));message=loved?'“这是我喜欢的！你还记得，谢谢你。”':'“谢谢你的心意，我会好好收着。”';r.memory.unshift('收到了你送的'+ITEMS[data.item].name);}
    if(action==='help'){if(r.lastHelp===s.day)return fail('今天已经帮过忙了，给自己也留一点时间。');const e=cost(30,8);if(e)return fail(e);r.lastHelp=s.day;r.trust=clamp(r.trust+3);p.coins+=24;p.skills.career+=3;message='你帮忙整理了一些东西，获得 24 币，也多了一点默契。';r.memory.unshift('你花时间帮忙，TA 记在心里');}
    if(action==='invite'){if(r.trust<12)return fail('还不够熟悉，多聊几天再邀请吧。');if(s.minute>=1050)return fail('今天有点晚了，明天早点邀请吧。');if(r.lastInvite===s.day)return fail('今天已经发出过邀请了。');r.lastInvite=s.day;r.promise={day:s.day,time:1080,done:false};message='“好呀，今天 18:00 在慢慢咖啡馆见。”';log(s,'与'+n.name+'约好今天 18:00 在慢慢咖啡馆见面。');}
    if(action==='meet'){if(!r.promise||r.promise.day!==s.day||r.promise.done||p.inside!=='cafe'||s.minute<1050||s.minute>1170)return fail('约定是今天 18:00，在慢慢咖啡馆，前后半小时都可以。');const e=cost(30,2);if(e)return fail(e);r.promise.done=true;r.trust=clamp(r.trust+6);r.affinity=clamp(r.affinity+5);message='你们一起喝了热饮，聊了很多无关紧要却很开心的事。';r.memory.unshift('在慢慢咖啡馆一起度过傍晚');}
    if(action==='romance'){if(ageOf(s)<18||ageOf(s,n.baseAge)<18)return fail('你们可以成为很好的朋友。');if(r.trust<40||r.affinity<25)return fail('这份感情还需要更多相处与了解。');if(r.stage==='恋人')return fail('你们已经相互表达过心意了。');r.stage='恋人';message='你认真说出了心意，TA 轻轻握住了你的手。';r.memory.unshift('你们开始认真地走进彼此的生活');log(s,'你与'+n.name+'开始交往。');}
    if(r.stage!=='恋人')r.stage=relationship(r);if(r.trust>=12)reward(s,'firstfriend');r.memory.length=Math.min(r.memory.length,5);return ok(message,{speaker:n.name});
  }
  if(action==='rest'){if(s.daily.rest>=4)return fail('今天已经歇得很充分了，做点喜欢的事吧。');const e=cost(20);if(e)return fail(e);s.daily.rest++;p.energy=clamp(p.energy+15);p.stress=clamp(p.stress-8);p.mood=clamp(p.mood+4);return ok('什么都不赶，坐着听了一会儿风。');}
  if(action==='work'){if(p.inside!=='office')return fail('去银杏事务所的工位再开始吧。');if(ageOf(s)<18)return fail('还在求学的年纪，可以先去学园学习。');if(s.daily.work>=2)return fail('今天已经忙过两段时间了，给生活留一点空隙。');if(s.minute<540||s.minute+120>1080)return fail('工作时段为 9:00—18:00，一次需要 2 小时。');const e=cost(120,22);if(e)return fail(e);s.daily.work++;const pay=95+Math.floor(p.skills.career/12)*7;p.coins+=pay;p.skills.career+=12;p.stress=clamp(p.stress+12);reward(s,'firststudy');log(s,'完成一段工作，收入 '+pay+' 币。');return ok('认真完成一段工作，收入 '+pay+' 币，职业经验 +12。');}
  if(action==='study'){if(!['school','books','home'].includes(p.inside))return fail('找一张安静的书桌或去书屋吧。');if(s.daily.study>=2)return fail('今天学得够多了，让新知识慢慢沉淀。');const e=cost(60,10);if(e)return fail(e);s.daily.study++;p.skills.knowledge+=12;p.stress=clamp(p.stress+3);reward(s,'firststudy');return ok('安静读了一小时。知识经验 +12。');}
  if(action==='paint'){if(!['atelier','pottery','home'].includes(p.inside))return fail('到工作室，或在自己的书桌前创作吧。');if(s.daily.paint>=2)return fail('今天的灵感已经收好了，明天再画吧。');const e=cost(60,12);if(e)return fail(e);s.daily.paint++;p.skills.creativity+=12;p.mood=clamp(p.mood+9);p.stress=clamp(p.stress-5);const pay=38+Math.floor(p.skills.creativity/15)*5;p.coins+=pay;return ok('完成一张小画，创作经验 +12，收到 '+pay+' 币稿酬。');}
  if(action==='heal'){if(p.inside!=='hospital')return fail('去医院让医生看看吧。');if(p.health>=98&&p.stress<10)return fail('医生说你现在身体不错，记得按时吃饭休息。');const price=Math.min(55,p.coins),e=cost(40,0,price);if(e)return fail(e);p.health=clamp(p.health+35,15,100);p.stress=clamp(p.stress-15);return ok('医生仔细检查后给了你照料。健康 +35，花费 '+price+' 币。');}
  if(action==='bath'){if(p.inside!=='home')return fail('回家泡个热水澡吧。');const e=cost(25,0,5);if(e)return fail(e);p.health=clamp(p.health+2,15,100);p.stress=clamp(p.stress-12);p.mood=clamp(p.mood+5);return ok('热水把一天的紧绷慢慢泡开了。');}
  if(action==='cook'){if(p.inside!=='home')return fail('先回到自己的小厨房。');if(itemCount(s,'turnip')<1||itemCount(s,'mushroom')<1)return fail('蔬菜浓汤需要 1 颗萝卜和 1 份蘑菇。');const e=cost(20,3);if(e)return fail(e);addItem(s,'turnip',-1);addItem(s,'mushroom',-1);addItem(s,'soup');return ok('煮好了一碗蔬菜浓汤，香气慢慢填满小屋。');}
  if(action==='claim'){const q=QUESTS.find(q=>q.id===data.id);if(!q||!s.flags[q.id]||s.claimed.includes(q.id))return fail('这份心愿还没有完成，或已经领过了。');s.claimed.push(q.id);p.coins+=q.reward;return ok('小心愿完成，收到 '+q.reward+' 币安家礼。');}
  if(action==='letter'){if(s.event?.type!=='letter'||s.event.claimed)return fail('今天没有未领取的来信。');addItem(s,'apple',2);s.event.claimed=true;return ok('收好了邻居送来的两颗苹果。');}
  if(action==='pet'){if(s.daily.pet.includes(data.id))return ok('小伙伴已经认得今天的你了。');const e=cost(3,1);if(e)return fail(e);s.daily.pet.push(String(data.id).slice(0,40));p.mood=clamp(p.mood+4);p.stress=clamp(p.stress-3);return ok('它轻轻靠过来，把一点安心分给了你。');}
  return fail('这件事暂时还做不了。');
}
function validateState(s){
  if(!s||s.schema!==SCHEMA||typeof s.id!=='string'||s.id.length>100)return '存档版本或标识不受支持';
  if(!Number.isInteger(s.day)||s.day<1||s.day>100000||!Number.isInteger(s.minute)||s.minute<0||s.minute>=1440||!Number.isFinite(s.clockFraction)||s.clockFraction<0||s.clockFraction>=1)return '存档时间无效';
  if(!Number.isInteger(s.seed)||s.seed<0||s.seed>4294967295||!Number.isInteger(s.revision)||s.revision<0)return '存档状态无效';
  const p=s.player;if(!p||typeof p.name!=='string'||p.name.length>14||!['farm','center','civic','woods','coast'].includes(p.area)||!Number.isFinite(p.x)||!Number.isFinite(p.z)||Math.abs(p.x)>35||Math.abs(p.z)>30||!Number.isInteger(p.baseAge)||p.baseAge<12||p.baseAge>80)return '人物数据无效';
  if(!Object.hasOwn(IDENTITIES,p.identity)||!['女','男','自由表达'].includes(p.gender)||!Number.isFinite(p.facing)||!Number.isFinite(p.steps)||p.steps<0||!p.habits||['activeDays','lateNights'].some(k=>!Number.isInteger(p.habits[k])||p.habits[k]<0))return '人物经历无效';
  for(const [k,max]of[['skin',3],['hair',4],['coat',5],['hairstyle',2],['accessory',2]])if(!Number.isInteger(p[k])||p[k]<0||p[k]>max)return '外貌数据无效';
  if(!['sunny','cloudy','rain','snow'].includes(s.weather))return '天气数据无效';
  if(p.inside!==null&&(!building(p.inside)||building(p.inside).area!==p.area))return '人物所在建筑无效';
  for(const key of ['energy','hunger','health','mood','stress'])if(!Number.isFinite(p[key])||p[key]<0||p[key]>100)return '生活状态无效';
  if(!Number.isInteger(p.coins)||p.coins<0||p.coins>1e8||!p.inventory||Array.isArray(p.inventory)||Object.entries(p.inventory).some(([id,n])=>!ITEMS[id]||!Number.isInteger(n)||n<0||n>100000))return '背包数据无效';
  if(!p.skills||Object.keys(p.skills).length!==5||['gardening','knowledge','career','creativity','fishing'].some(k=>!Number.isFinite(p.skills[k])||p.skills[k]<0||p.skills[k]>1e8))return '成长数据无效';
  if(!Array.isArray(s.plots)||s.plots.length!==8||s.plots.some(p=>!p||p.crop!==null&&p.crop!=='turnip'||!Number.isInteger(p.growth)||p.growth<0||p.growth>3||typeof p.watered!=='boolean'))return '菜畦数据无效';
  if(!Array.isArray(s.npcs)||s.npcs.length!==NPCS.length||new Set(s.npcs.map(n=>n.id)).size!==NPCS.length||s.npcs.some(n=>!NPCS.some(p=>p.id===n.id)||!['farm','center','civic','woods','coast'].includes(n.area)||!Number.isFinite(n.x)||!Number.isFinite(n.z)||!Array.isArray(n.path)||n.path.length>1000||n.path.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)))))return '居民数据无效';
  if(s.npcs.some(n=>!Number.isFinite(n.facing)||Math.abs(n.x)>35||Math.abs(n.z)>30||n.inside!==null&&(!building(n.inside)||building(n.inside).area!==n.area)||n.transit!==null&&(!n.transit||!['farm','center','civic','woods','coast'].includes(n.transit.area)||!Number.isFinite(n.transit.remaining)||n.transit.remaining<0||n.transit.remaining>100)||n.target!==null&&!building(n.target)&&!['farm','center','civic','woods','coast'].includes(n.target)))return '居民行程无效';
  if(!s.relations||NPCS.some(n=>{const r=s.relations[n.id];return !r||!Number.isFinite(r.trust)||r.trust<0||r.trust>100||!Number.isFinite(r.affinity)||r.affinity<0||r.affinity>100||!Array.isArray(r.memory)||r.memory.length>8;}))return '关系数据无效';
  if(NPCS.some(n=>{const r=s.relations[n.id];return !['陌生人','熟悉的邻居','朋友','知心朋友','恋人'].includes(r.stage)||r.memory.some(t=>typeof t!=='string'||t.length>300)||['lastChat','lastGift','lastHelp','lastInvite'].some(k=>!Number.isInteger(r[k])||r[k]<0||r[k]>s.day)||r.promise!==null&&(!Number.isInteger(r.promise.day)||r.promise.day>s.day||r.promise.day<1||typeof r.promise.done!=='boolean'||!Number.isFinite(r.promise.time));}))return '相处记录无效';
  if(!Array.isArray(s.journal)||s.journal.length>80||!s.flags||!Array.isArray(s.claimed)||!s.daily||!Array.isArray(s.daily.forage)||!Array.isArray(s.daily.pet))return '日常记录无效';
  if(s.journal.some(j=>!j||typeof j.text!=='string'||j.text.length>1000||!Number.isInteger(j.day)||!Number.isFinite(j.minute))||s.daily.forage.length>20||s.daily.pet.length>100||s.daily.pet.some(id=>typeof id!=='string'||id.length>60)||['work','study','paint','rest','fish'].some(k=>!Number.isInteger(s.daily[k])||s.daily[k]<0||s.daily[k]>10000)||Object.keys(s.flags).length>64||s.claimed.some(id=>!QUESTS.some(q=>q.id===id)))return '日常记录格式无效';
  return null;
}

export function validationError(s){try{return validateState(s);}catch{return '存档格式不完整或字段类型无效';}}
