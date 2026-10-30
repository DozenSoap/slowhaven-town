import {BUILDINGS,furnitureFor} from './content.js';
const riverX=z=>-8.2+2.1*Math.sin(z*.16)+.8*Math.sin(z*.37);
export function walkable(area,x,z,inside=null){
  if(!Number.isFinite(x)||!Number.isFinite(z))return false;
  if(inside){if(Math.abs(x)>=6.8||Math.abs(z)>=5.6)return false;return !furnitureFor(inside).some(f=>{const sizes={sleep:[1.1,1.55],cook:[1.35,.7],mirror:[.22,.75],diary:[1.1,.65],study:[1.1,.65],work:[1.1,.65],paint:[1.1,.65],bath:[1.45,.85],counter:[4.6,.7],treatment:[1.1,1.55],rest:[1.1,.65]},size=sizes[f.kind];return size&&Math.abs(x-f.x)<size[0]+.15&&Math.abs(z-f.z)<size[1]+.15;});}
  if(Math.abs(x)>28||Math.abs(z)>21)return false;
  if(area==='center'){
    if(Math.abs(x)>25&&Math.abs(z)>17.8)return false;
    if(Math.abs(x-riverX(z))<2.65&&Math.abs(z+12)>.95&&Math.abs(z-12.3)>.95)return false;
    if(Math.abs(x-3.2)<1.6&&Math.abs(z+1.5)<1.6)return false;
    if(Math.hypot(x-3.8,z-5.4)<1.85)return false;
    if(Math.hypot(x-15.2,z-9.2)<2)return false;
  }
  if(area==='coast'&&z>7&&!(x>12.8&&x<17.2&&z<14))return false;
  return !BUILDINGS.some(b=>b.area===area&&Math.abs(x-b.x)<b.w/2+.35&&Math.abs(z-b.z)<b.d/2+.35);
}
export function nearestWalkable(area,x,z,inside=null){
  if(walkable(area,x,z,inside))return [x,z];
  for(let r=.5;r<8;r+=.5)for(let a=0;a<16;a++){const nx=x+Math.cos(a*Math.PI/8)*r,nz=z+Math.sin(a*Math.PI/8)*r;if(walkable(area,nx,nz,inside))return [nx,nz];}
  return null;
}
// A compact fixed grid is only searched when a destination changes.
function searchPath(area,from,to,inside=null){
  const target=nearestWalkable(area,to[0],to[1],inside);if(!target)return [];
  const step=.75,key=(x,z)=>x+','+z,start=[Math.round(from[0]/step),Math.round(from[1]/step)],end=[Math.round(target[0]/step),Math.round(target[1]/step)];
  if(Math.hypot(from[0]-target[0],from[1]-target[1])<.4)return [target];
  const open=[{x:start[0],z:start[1],g:0,f:0}],nodes=new Map([[key(...start),open[0]]]),closed=new Set();let best=null;
  const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
  for(let iter=0;open.length&&iter<6800;iter++){
    let min=0;for(let i=1;i<open.length;i++)if(open[i].f<open[min].f)min=i;
    const n=open.splice(min,1)[0],nk=key(n.x,n.z);if(closed.has(nk))continue;closed.add(nk);
    if(Math.abs(n.x-end[0])<=1&&Math.abs(n.z-end[1])<=1){best=n;break;}
    for(const [dx,dz] of dirs){const x=n.x+dx,z=n.z+dz,k=key(x,z);if(closed.has(k)||!walkable(area,x*step,z*step,inside))continue;if(dx&&dz&&(!walkable(area,n.x*step,z*step,inside)||!walkable(area,x*step,n.z*step,inside)))continue;
      const g=n.g+(dx&&dz?1.414:1);let next=nodes.get(k);if(!next){next={x,z,g,f:g+Math.hypot(x-end[0],z-end[1]),parent:n};nodes.set(k,next);open.push(next);}else if(g<next.g){next.g=g;next.f=g+Math.hypot(x-end[0],z-end[1]);next.parent=n;}
    }
  }
  if(!best)return [];
  const result=[];while(best.parent){result.push([best.x*step,best.z*step]);best=best.parent;}result.reverse();if(walkable(area,...target,inside))result.push(target);return result;
}
export function moveAlong(pos,path,distance){let walked=0;while(path.length&&distance>0){const [x,z]=path[0],dx=x-pos.x,dz=z-pos.z,d=Math.hypot(dx,dz);if(d<.04){path.shift();continue;}const n=Math.min(distance,d);pos.x+=dx/d*n;pos.z+=dz/d*n;pos.facing=Math.atan2(dx,dz);distance-=n;walked+=n;if(n>=d-.001)path.shift();}return walked;}
const pathCache=new Map();
export function findPath(area,from,to,inside=null){const key=[area,inside,...from.map(v=>Math.round(v/.75)),...to.map(v=>Math.round(v*10))].join(':');let route=pathCache.get(key);if(!route){route=searchPath(area,from,to,inside);if(pathCache.size>=400)pathCache.delete(pathCache.keys().next().value);pathCache.set(key,route);}return route.map(p=>[...p]);}
