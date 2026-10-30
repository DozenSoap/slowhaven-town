import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three.module.min.js';
import {panelStyle,visibleSceneRect,frustumForAnchor,interactionFocus,roomHalfHeight} from '../dist/life/layout.js';
import {MapView} from '../dist/life/map-view.js';

test('portrait cards reserve the scene above them and landscape cards reserve the scene beside them',()=>{
  for(const [width,height] of [[320,568],[375,640],[390,642],[430,932]]){
    const panel={left:10,right:width-10,top:height-190,bottom:height-10,width:width-20,height:180};
    const r=visibleSceneRect(width,height,{mobile:true,panel});
    assert.ok(r.bottom<panel.top);assert.ok(r.bottom-r.top>=height*.5);assert.ok(r.left>=0&&r.right<=width);
  }
  for(const [width,height] of [[844,390],[667,375],[568,320],[1280,800]]){
    const panel={left:width-360,top:10,width:350,height:height-20};
    const r=visibleSceneRect(width,height,{mobile:height<=520,panel});assert.ok(r.right<panel.left);assert.ok(r.bottom<=height);
  }
  assert.equal(panelStyle('prop'),'interaction');assert.equal(panelStyle('room'),'interaction');assert.equal(panelStyle('settings'),'reader');
});

test('the real orthographic projection puts the player and nearby target inside the unoccluded scene',()=>{
  for(const [width,height] of [[320,568],[390,642],[844,390],[1280,800]]){
    const mobile=width<=760||height<=520,panel=width<=760&&height>520?{left:10,top:height-200,width:width-20,height:190}:{left:width-350,top:10,width:340,height:height-20};
    const r=visibleSceneRect(width,height,{mobile,panel}),anchor={x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};
    const player={x:7,z:1.6},target={x:7,z:3},focus=interactionFocus(player,target),f=frustumForAnchor(width,height,13.5,anchor);
    const camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,250);camera.position.set(focus.x+25,33,focus.z+36);camera.lookAt(focus.x,1,focus.z);camera.updateMatrixWorld();
    for(const point of [player,target])for(const y of [0,2]){const q=new THREE.Vector3(point.x,y,point.z).project(camera),x=(q.x+1)*width/2,sy=(1-q.y)*height/2;assert.ok(x>r.left&&x<r.right,`${width}: x ${x}`);assert.ok(sy>r.top&&sy<r.bottom,`${width}: y ${sy}`);}
    const q=new THREE.Vector3(focus.x,1,focus.z).project(camera);assert.ok(Math.abs((q.x+1)*width/2-anchor.x)<1e-6);assert.ok(Math.abs((1-q.y)*height/2-anchor.y)<1e-6);
  }
});

test('map picking remains the inverse of drawing after reframing and resizing',()=>{
  const view=Object.assign(Object.create(MapView.prototype),{width:390,height:642,anchor:{x:195,y:205},cx:7,cz:2,scale:16});
  for(const [x,z] of [[7,3],[-8,-12],[23,18]]){const q=view.screen(x,z),p=view.ground(q.x,q.y);assert.ok(Math.abs(p[0]-x)<1e-9&&Math.abs(p[1]-z)<1e-9);}
  Object.assign(view,{width:844,height:390,anchor:{x:220,y:195},scale:23});const q=view.screen(7,3);assert.deepEqual(view.ground(q.x,q.y),[7,3]);
  assert.deepEqual(interactionFocus({x:0,z:0},{x:100,z:100}),{x:0,z:0});assert.deepEqual(interactionFocus({x:0,z:0},{x:NaN,z:0}),{x:0,z:0});
});

test('the whole interior, including the exit, fits around the HUD in portrait and short landscape',()=>{
  for(const [width,height] of [[320,568],[390,642],[568,320],[844,390]])for(const offset of [{x:25,y:32,z:36},{x:-30,y:24,z:17}]){
    const r={left:14,top:125,right:width-14,bottom:height-94},anchor={x:(r.left+r.right)/2,y:(r.top+r.bottom)/2},half=roomHalfHeight(width,height,r,offset),f=frustumForAnchor(width,height,half,anchor);
    const camera=new THREE.OrthographicCamera(f.left,f.right,f.top,f.bottom,.1,250);camera.position.set(offset.x,offset.y+1,offset.z);camera.lookAt(0,1,0);camera.updateMatrixWorld();
    for(const x of [-7.4,7.4])for(const y of [0,3.8])for(const z of [-6.5,6.5]){const p=new THREE.Vector3(x,y,z).project(camera),sx=(p.x+1)*width/2,sy=(1-p.y)*height/2;assert.ok(sx>r.left&&sx<r.right);assert.ok(sy>r.top&&sy<r.bottom);}
  }
});
