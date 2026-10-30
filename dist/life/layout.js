// Screen space shared by the 3D camera, the map camera and their hit testing.
export function panelStyle(kind) {
  return ['prop','npc','person','room','mirror'].includes(kind) ? 'interaction' : 'reader';
}

export function visibleSceneRect(width,height,{playing=true,mobile=false,overlays=[],panel=null,reader=false}={}) {
  const gap=mobile?14:20;
  const rect={left:gap,top:gap,right:width-gap,bottom:height-gap};
  if(!playing||reader)return rect;
  for(const overlay of overlays){
    if(!overlay||overlay.width<=0||overlay.height<=0)continue;
    if(overlay.top<height*.36)rect.top=Math.max(rect.top,overlay.bottom+gap);
    else if(overlay.bottom>height*.7)rect.bottom=Math.min(rect.bottom,overlay.top-gap);
  }
  if(panel&&panel.width>0&&panel.height>0){
    // Portrait cards dock below the scene; landscape and desktop cards sit beside it.
    if(mobile&&width<=760&&height>520)rect.bottom=Math.min(rect.bottom,panel.top-gap);
    else rect.right=Math.min(rect.right,panel.left-gap);
  }
  rect.left=Math.max(0,Math.min(rect.left,width-80));
  rect.right=Math.max(rect.left+80,Math.min(width,rect.right));
  rect.top=Math.max(0,Math.min(rect.top,height-80));
  rect.bottom=Math.max(rect.top+80,Math.min(height,rect.bottom));
  return rect;
}

export function frustumForAnchor(width,height,half,anchor) {
  const aspect=width/height,x=half*aspect*(1-2*anchor.x/width),y=half*(2*anchor.y/height-1);
  return {left:-half*aspect+x,right:half*aspect+x,top:half+y,bottom:-half+y};
}

export function interactionFocus(player,target=null) {
  if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.z)||Math.hypot(target.x-player.x,target.z-player.z)>8)return {x:player.x,z:player.z};
  return {x:(player.x+target.x)/2,z:(player.z+target.z)/2};
}

// Fit the complete cutaway room in the free part of the screen, at any orbit angle.
export function roomHalfHeight(width,height,rect,offset) {
  const flat=Math.hypot(offset.x,offset.z)||1,len=Math.hypot(offset.x,offset.y,offset.z)||1;
  const right={x:offset.z/flat,z:-offset.x/flat};
  const up={x:-offset.y*offset.x/(len*flat),y:flat/len,z:-offset.y*offset.z/(len*flat)};
  const horizontal=7.4*Math.abs(right.x)+6.5*Math.abs(right.z);
  const vertical=7.4*Math.abs(up.x)+2.8*Math.abs(up.y)+6.5*Math.abs(up.z);
  return Math.max(8.7,horizontal*height/(rect.right-rect.left),vertical*height/(rect.bottom-rect.top))*1.08;
}
