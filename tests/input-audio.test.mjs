import test from 'node:test';
import assert from 'node:assert/strict';
import {TownAudio,readAudioPreferences} from '../dist/life/audio.js';
import {joystickVector,bindJoystick} from '../dist/life/joystick.js';

class Param{constructor(value=0){this.value=value;this.events=[];}cancelScheduledValues(){}setValueAtTime(v){this.value=v;this.events.push(v);}setTargetAtTime(v){this.value=v;this.events.push(v);}exponentialRampToValueAtTime(v){this.value=v;this.events.push(v);}linearRampToValueAtTime(v){this.value=v;this.events.push(v);}}
class Node{constructor(){this.gain=new Param();this.frequency=new Param();this.Q=new Param();this.threshold=new Param();this.ratio=new Param();this.connections=[];}connect(n){this.connections.push(n);}disconnect(){this.connections=[];}start(){this.started=true;}stop(){this.stopped=true;}}
class Context{constructor(){this.sampleRate=8000;this.currentTime=1;this.state='suspended';this.destination=new Node();this.nodes=[];}node(){const n=new Node();this.nodes.push(n);return n;}createGain(){return this.node();}createDynamicsCompressor(){return this.node();}createBiquadFilter(){return this.node();}createBufferSource(){return this.node();}createOscillator(){return this.node();}createBuffer(n,length){const samples=new Float32Array(length);return {getChannelData:()=>samples};}async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}}
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};

test('audio starts only after an input gesture, keeps volume channels and stops when hidden',async()=>{
  const storage=memory(),context=new Context(),audio=new TownAudio({storage,createContext:()=>context});assert.equal(audio.ctx,null);audio.play('water');assert.equal(context.nodes.length,0);
  await audio.unlock();assert.equal(audio.ready,true);assert.equal(Object.keys(audio.layers).length,4);assert.ok([...audio.noise.getChannelData(0)].every(Number.isFinite));
  audio.setVolume('music',.4);assert.equal(audio.musicBus.gain.value,.4);assert.equal(readAudioPreferences(storage).music,.4);assert.throws(()=>audio.setVolume('master',3));
  const state={minute:600,weather:'sunny',player:{area:'farm',inside:null,x:0,z:0}};audio.update(state);assert.equal(audio.layers.waves.gain.gain.value,0);context.currentTime=2;state.player.area='coast';audio.update(state);assert.ok(audio.layers.waves.gain.gain.value>0);
  const n=audio.voices.size;await audio.setHidden(true);audio.play('harvest');assert.equal(audio.voices.size,n);assert.equal(context.state,'suspended');await audio.setHidden(false);assert.equal(context.state,'running');await audio.toggle();assert.equal(context.state,'suspended');assert.equal(audio.enabled,false);await audio.toggle();assert.equal(audio.enabled,true);assert.equal(context.state,'running');await audio.dispose();assert.equal(context.state,'closed');
});

test('rapid interaction sounds cannot create an unbounded audio graph',async()=>{const context=new Context(),audio=new TownAudio({createContext:()=>context});await audio.unlock();for(let i=0;i<300;i++)audio.play(['plant','water','harvest','chat','enter'][i%5]);assert.ok(audio.voices.size<=28);const count=audio.voices.size;for(const voice of [...audio.voices])voice.onended();assert.equal(audio.voices.size,0);assert.ok(count>0);await audio.dispose();});

test('corrupt audio preferences are reported explicitly and begin muted',()=>{const errors=[],audio=new TownAudio({storage:{getItem:()=>'{"version":1,"enabled":true,"master":"loud"}'},onError:e=>errors.push(e.message)});assert.equal(errors.length,1);assert.equal(audio.enabled,false);});

test('the joystick has a deadzone, proportional speed and a bounded thumb',()=>{assert.equal(joystickVector(1,1).x,0);const diagonal=joystickVector(100,100);assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-8);assert.ok(Math.hypot(diagonal.thumbX,diagonal.thumbY)<=39.0001);const half=joystickVector(19.5,0);assert.ok(half.x>0&&half.x<1);assert.equal(half.z,0);assert.throws(()=>joystickVector(NaN,0));});

test('pointer cancellation, release and leaving the game all clear held movement',()=>{const handlers={},values=[],thumb={style:{}},element={classList:{add(){},remove(){}},getBoundingClientRect:()=>({left:0,top:0,width:112,height:112}),setPointerCapture(){},addEventListener:(n,fn)=>handlers[n]=fn};const control=bindJoystick(element,thumb,v=>values.push(v));const e={pointerId:3,clientX:90,clientY:56,preventDefault(){}};handlers.pointerdown(e);assert.ok(values.at(-1).x>0);handlers.pointercancel(e);assert.deepEqual(values.at(-1),{x:0,z:0});handlers.pointerdown(e);handlers.pointerup(e);assert.deepEqual(values.at(-1),{x:0,z:0});handlers.pointerdown(e);control.reset();assert.deepEqual(values.at(-1),{x:0,z:0});});
