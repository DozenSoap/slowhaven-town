import {NPCS,building} from './content.js';
import {nearestWalkable,findPath} from './navigation.js';

const routes={
  farm:[[-8,1],[-3,0],[3,0],[6,1.5],[6,6],[2,8],[-3,7],[-8,5]],
  center:[[8,2],[10,8],[16,12.3],[10,0],[2,0],[-3,0],[-3,-12],[-18,-12],[-20.8,0],[-18,12.3],[-3,12.3],[8,10]],
  civic:[[-12,0],[-4,0],[0,-5],[3,0],[9,0],[9,5],[2,8],[-2,3]],
  woods:[[2,5],[6,1],[9,-3],[12,-6],[8,8],[0,5],[-3,0]],
  coast:[[8,3],[2,1],[-5,2],[-13,1],[12,5],[15,8],[15,12],[15,4]]
};
const safePoints=new Map(),indoorRoutes=new Map();
const minutes=s=>(s.day-1)*1440+s.minute+s.clockFraction;
function safePoint(area,point,inside=null){const key=[area,inside,...point].join(':');if(!safePoints.has(key)){const p=nearestWalkable(area,...point,inside);if(!p)throw new Error('居民路线没有可行走的地点：'+key);safePoints.set(key,p);}return safePoints.get(key);}
export function outdoorTarget(s,profile,area,offset=0){const welcoming=area==='farm'&&s.day===1&&s.minute>=480&&s.minute<630&&profile.work==='greenhouse';const route=welcoming?[[-11,1],[-8,1],[-5,1],[-8,3]]:routes[area];if(!route)throw new Error('未知的居民街区：'+area);const period=12+(profile.index*7)%13,slot=Math.floor((minutes(s)+profile.index*3.7+s.seed%17)/period)+profile.index+offset;return safePoint(area,route[((slot%route.length)+route.length)%route.length]);}

function indoorRoute(profile,inside){
  const key=inside+':'+profile.id;if(indoorRoutes.has(key))return indoorRoutes.get(key);
  const b=building(inside),working=profile.work===inside&&['bakery','cafe','market','flowers','books'].includes(b.kind);
  const candidates=working?[[-3.3,-3.7],[0,-3.7],[3.3,-3.7],[0,-4.7]]:[[-4.7,.7],[-2.5,2.4],[1.4,3.3],[4.7,2.4]];
  const points=candidates.map(p=>safePoint(b.area,p,inside)),segments=points.map((p,i)=>{
    const path=[p,...findPath(b.area,p,points[(i+1)%points.length],inside)];let length=0;for(let j=1;j<path.length;j++)length+=Math.hypot(path[j][0]-path[j-1][0],path[j][1]-path[j-1][1]);return {path,length};
  });
  const route={points,segments,working};if(indoorRoutes.size>=96)indoorRoutes.delete(indoorRoutes.keys().next().value);indoorRoutes.set(key,route);return route;
}
function along(path,distance){for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(distance<=d&&d>0)return {x:a[0]+(b[0]-a[0])*distance/d,z:a[1]+(b[1]-a[1])*distance/d,facing:Math.atan2(b[0]-a[0],b[1]-a[1])};distance-=d;}const p=path.at(-1),from=path.at(-2)??p;return {x:p[0],z:p[1],facing:Math.atan2(p[0]-from[0],p[1]-from[1])};}

// Interior positions are derived from the saved time and identity. Schema-2 saves
// keep their outdoor door coordinates; every renderer and hit target uses this pose.
export function npcPose(s,npc){
  if(!npc.inside)return {x:npc.x,z:npc.z,facing:npc.facing,moving:npc.path.length>0,gesture:'idle'};
  const profile=NPCS.find(n=>n.id===npc.id);if(!profile)throw new Error('未知的居民：'+npc.id);
  const route=indoorRoute(profile,npc.inside),period=14+(profile.index%3)*3,t=minutes(s)+profile.index*7+s.seed%11,slot=Math.floor(t/period),phase=t-slot*period,segment=route.segments[slot%route.segments.length];
  const asleep=s.minute<420||s.minute>=1260;if(asleep){const p=route.points[profile.index%route.points.length];return {x:p[0],z:p[1],facing:0,moving:false,gesture:'rest'};}
  const progress=Math.min(1,phase/(period*.65)),pose=along(segment.path,segment.length*progress);
  return {...pose,moving:progress<1&&segment.length>.1,gesture:route.working?'work':'look'};
}
