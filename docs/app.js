import * as THREE from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {createTown} from './town.js';

const $=id=>document.getElementById(id);
const STORAGE_KEY='slowhaven-town-v1';
const BUILD_TYPES=['tree','flowers','bench','house','pine','cherry','sunflowers','birdhouse'];
const BUILD_HINTS={tree:'种下一棵树',flowers:'留下一丛花',bench:'放下一张长椅',house:'添一间小屋',pine:'种下一棵小松树',cherry:'留下一树樱花',sunflowers:'种下一小片向日葵',birdhouse:'给小鸟安一个家'};
const state={hour:15.5,weather:'sunny',speed:1,paused:false,day:1,placement:null,follow:null,sound:false,panel:null};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let saved=null;
try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const value=JSON.parse(raw);if(!value||value.version!==1||!Array.isArray(value.placements)||value.placements.length>80||!value.placements.every(p=>p&&BUILD_TYPES.includes(p.type)&&Number.isFinite(p.x)&&Number.isFinite(p.z)))throw new Error('保存的布置格式无效');saved=value;}}
catch(e){console.error('读取小镇布置失败',e);queueMicrotask(()=>toast('之前的布置未能读取，本次会打开初始小镇。'));}

const scene=new THREE.Scene();
const dayBg=new THREE.Color('#e6ecdf'),nightBg=new THREE.Color('#253b48'),rainBg=new THREE.Color('#aebdb7'),snowBg=new THREE.Color('#dce4df');
scene.background=dayBg.clone();scene.fog=new THREE.FogExp2(dayBg,.0038);
const camera=new THREE.OrthographicCamera(-50,50,32,-32,.1,400);
camera.position.set(69,66,80);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});}
catch(e){console.error('3D 渲染初始化失败',e);$('loading-text').textContent='浏览器暂时无法启动 3D 渲染，请开启硬件加速后刷新。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.outputColorSpace=THREE.SRGBColorSpace;
$('world').appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading-screen').classList.remove('done');$('loading-text').textContent='3D 渲染暂时中断，正在等待浏览器恢复…';});
renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.4,0);controls.enableDamping=!reducedMotion;controls.dampingFactor=.065;controls.minZoom=.6;controls.maxZoom=6.2;controls.minPolarAngle=.22;controls.maxPolarAngle=Math.PI*.44;controls.enablePan=true;controls.maxTargetRadius=35;controls.screenSpacePanning=true;controls.update();
const homePosition=camera.position.clone(),homeTarget=controls.target.clone();
let cameraTween=null;
controls.addEventListener('start',()=>{cameraTween=null;if(state.follow!==null){state.follow=null;$('follow-btn').textContent='跟着走一会儿 ↗';}});
const ambient=new THREE.HemisphereLight('#fff6df','#97a28a',2.0);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff0cf',3.1);sun.position.set(-24,48,24);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-47;sun.shadow.camera.right=47;sun.shadow.camera.top=43;sun.shadow.camera.bottom=-43;sun.shadow.camera.near=.5;sun.shadow.camera.far=130;sun.shadow.normalBias=.055;sun.shadow.bias=-.0002;sun.shadow.radius=3;scene.add(sun);
const fill=new THREE.DirectionalLight('#c8e5dc',.65);fill.position.set(25,15,-20);scene.add(fill);
const floorMat=new THREE.MeshStandardMaterial({color:'#e1e8d8',roughness:1});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-3.08;floor.receiveShadow=true;scene.add(floor);

const town=createTown(scene);
$('status-sub').textContent=`${town.residents.length} 位居民 · ${town.entries().animals.length} 位动物伙伴 · 1 趟慢车`;
if(saved){for(const item of saved.placements){if(town.canPlace(item.type,item.x,item.z))town.place(item);else console.warn('忽略与初始场景冲突的已存布置',item);}if(['sunny','rain','snow'].includes(saved.weather))state.weather=saved.weather;if(Number.isFinite(saved.hour)&&saved.hour>=0&&saved.hour<24)state.hour=saved.hour;}

// Weather lives only above the island. A single draw call handles each effect.
const weatherCount=1100,weatherCoords=new Float32Array(weatherCount*3),weatherSeed=[];
let weatherRandom=5731;const weatherRand=()=>{weatherRandom=(weatherRandom*16807)%2147483647;return weatherRandom/2147483647;};
for(let i=0;i<weatherCount;i++){weatherSeed.push({x:(weatherRand()-.5)*61,y:weatherRand()*27,z:(weatherRand()-.5)*46,speed:weatherRand(),phase:weatherRand()*6.28});}
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(weatherCoords,3));
const snowMat=new THREE.PointsMaterial({color:'#ffffff',size:.13,sizeAttenuation:true,transparent:true,opacity:.8,depthWrite:false});const snow=new THREE.Points(snowGeo,snowMat);snow.visible=false;scene.add(snow);
const rainCoords=new Float32Array(weatherCount*6),rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainCoords,3));const rainMat=new THREE.LineBasicMaterial({color:'#cbded8',transparent:true,opacity:.52,depthWrite:false});const rain=new THREE.LineSegments(rainGeo,rainMat);rain.visible=false;scene.add(rain);
const groundSnow=new THREE.Mesh(new THREE.PlaneGeometry(55,40),new THREE.MeshStandardMaterial({color:'#eff1e7',transparent:true,opacity:0,depthWrite:false}));
// Snow settles as small speckles, leaving streets and river readable.
const snowCaps=new THREE.Group();scene.add(snowCaps);const snowCapMat=new THREE.MeshStandardMaterial({color:'#f3f1e8',roughness:1,transparent:true,opacity:0});
for(let i=0;i<160;i++){const x=(weatherRand()-.5)*55,z=(weatherRand()-.5)*39;if(Math.abs(x-town.riverX(z))<3||Math.abs(x-10)<2||Math.abs(z)<2||Math.abs(z+12)<1.5||Math.abs(z-12.3)<1.5)continue;const cap=new THREE.Mesh(new THREE.CircleGeometry(.2+weatherRand()*.45,7),snowCapMat);cap.rotation.x=-Math.PI/2;cap.position.set(x,.33,z);snowCaps.add(cap);}

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.4);
const hoverRing=new THREE.Mesh(new THREE.RingGeometry(.67,.73,40),new THREE.MeshBasicMaterial({color:'#f8efd1',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));hoverRing.rotation.x=-Math.PI/2;hoverRing.visible=false;scene.add(hoverRing);
const placementPreview=new THREE.Group();scene.add(placementPreview);const previewMat=new THREE.MeshBasicMaterial({color:'#7b9c67',transparent:true,opacity:.27,depthWrite:false});const preview=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.06,40),previewMat);preview.position.y=.46;placementPreview.add(preview);placementPreview.visible=false;
let selectedData=null,hovered=null,lastPointer={x:0,y:0},downPointer=null,dragged=false,saveTimer=0,toastTimer=0,followTarget=null;
let soundContext=null,soundBus=null,soundNoise=null,soundGain=null,birdTimer=0;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3400);}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,placements:town.placedRoots.map(p=>p.config),weather:state.weather,hour:state.hour}));$('build-count').textContent=`已保存 ${town.placedRoots.length} 处你的布置`;}catch(e){console.error('保存小镇失败',e);$('build-count').textContent='保存失败：浏览器存储不可用';toast('当前浏览器无法保存布置，请保留页面。');}},350);}
function updateClock(){const mins=Math.floor(state.hour*60)%1440,h=Math.floor(mins/60),m=mins%60,text=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;$('time-text').textContent=text;$('range-time').textContent=text;if(document.activeElement!==$('time-range'))$('time-range').value=mins;$('day-count').textContent=`第 ${state.day} 天`;let title,note;if(h<5){title='万家安眠';note='窗后的故事睡了，星光还醒着。';}else if(h<8){title='晨光初醒';note='第一炉面包的香气，已经出门了。';}else if(h<12){title='日常序曲';note='风吹过树梢，今天也不必着急。';}else if(h<16){title='午后漫游';note='咖啡还温着，云也走得很慢。';}else if(h<19){title='日落之前';note='把影子拉长，让今天再待一会儿。';}else{title='灯火可亲';note='一盏一盏的灯，是小镇温柔的心事。';}if(state.weather==='rain')note='雨声替小镇说话，屋檐替行人等候。';if(state.weather==='snow')note='雪落得很轻，像怕惊动一个好梦。';$('time-name').textContent=title;$('scene-note-text').textContent=note;$('status-main').textContent=state.paused?'小镇暂停在这一刻':state.weather==='rain'?'听，小镇下雨了':state.weather==='snow'?'雪落在小镇的肩上':'小镇正在好好生活';document.body.classList.toggle('night',h<5.5||h>19.2);}
function setWeather(weather,announce=true){if(!['sunny','rain','snow'].includes(weather))throw new Error('不支持的天气');state.weather=weather;rain.visible=weather==='rain';snow.visible=weather==='snow';document.querySelectorAll('[data-weather]').forEach(b=>b.classList.toggle('selected',b.dataset.weather===weather));if(announce)toast(weather==='sunny'?'云散开了，去晒晒太阳吧。':weather==='rain'?'下雨了。小镇替你留了一盏灯。':'第一片雪，落在了屋顶旁。');updateClock();save();}
function setHour(hour){state.hour=((hour%24)+24)%24;updateClock();save();}
function closePanel(){state.panel=null;$('control-panel').hidden=true;$('atmosphere-btn').classList.remove('active');$('build-btn').classList.remove('active');$('journal-btn').classList.remove('active');cancelPlacement();}
function openPanel(name){if(state.panel===name){closePanel();return;}state.panel=name;$('control-panel').hidden=false;$('panel-title').textContent={atmosphere:'光阴与天气',build:'给小镇添点心意',journal:'小镇邻里手记'}[name];$('atmosphere-panel').hidden=name!=='atmosphere';$('build-panel').hidden=name!=='build';$('journal-panel').hidden=name!=='journal';for(const key of ['atmosphere','build','journal'])$(key+'-btn').classList.toggle('active',name===key);if(name!=='build')cancelPlacement();if(name==='journal')renderJournal();if(innerWidth<760)$('resident-card').hidden=true;}
let journalCategory='residents';
function renderJournal(){const entries=town.entries(),list=$('journal-list');list.replaceChildren();for(const data of entries[journalCategory]){const b=document.createElement('button');b.className='journal-item';const icon=document.createElement('span');icon.className='journal-icon';icon.textContent=data.icon??(data.type==='train'?'🚂':journalCategory==='places'?'🏡':'🌿');const text=document.createElement('span'),name=document.createElement('b'),role=document.createElement('small');name.textContent=data.shortName?.split(' · ')[0]??data.name.split(' · ')[0];role.textContent=data.role??(data.type==='train'?'环镇慢车':'小镇的一角');text.appendChild(name);text.appendChild(role);b.appendChild(icon);b.appendChild(text);b.setAttribute('aria-label',data.name);b.onclick=()=>{showStory(data);focusStory(data);};list.appendChild(b);}$('journal-count').textContent=`${entries.residents.length} 位街坊 · ${entries.animals.length} 位小伙伴 · ${entries.places.length} 处小镇角落`;document.querySelectorAll('[data-journal]').forEach(b=>b.classList.toggle('selected',b.dataset.journal===journalCategory));}
function focusStory(data){const p=town.positionFor(data),offset=town.viewDirectionFor(data).multiplyScalar(camera.position.distanceTo(controls.target)),zoom=data.type==='building'?2.2:data.type==='train'?2.8:4.2;state.follow=null;cameraTween={start:performance.now(),from:camera.position.clone(),target:controls.target.clone(),to:p.clone().add(offset),targetTo:p,zoom:camera.zoom,toZoom:zoom};}
function cancelPlacement(){state.placement=null;placementPreview.visible=false;$('placement-hint').hidden=true;renderer.domElement.style.cursor='grab';document.querySelectorAll('[data-build]').forEach(b=>b.classList.remove('selected'));controls.enableRotate=true;}
function startPlacement(type){if(!BUILD_TYPES.includes(type))throw new Error('未知布置类型');state.placement=type;$('placement-hint').hidden=false;$('placement-text').textContent='轻点空地，'+BUILD_HINTS[type];document.querySelectorAll('[data-build]').forEach(b=>b.classList.toggle('selected',b.dataset.build===type));preview.scale.setScalar(type==='house'?2.5:['tree','pine','cherry'].includes(type)?1.1:.7);renderer.domElement.style.cursor='crosshair';if(innerWidth<760)$('control-panel').hidden=true;}
function screenRay(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);}
function groundPoint(event){screenRay(event);return raycaster.ray.intersectPlane(groundPlane,new THREE.Vector3());}
function showStory(data){state.follow=null;selectedData=data;$('resident-name').textContent=data.name;$('resident-description').textContent=data.description;$('resident-category').textContent=data.type==='resident'?'PEOPLE OF SLOWHAVEN':['animal','cat','duck'].includes(data.type)?'SMALL PAWS, SLOW DAYS':data.type==='train'?'A JOURNEY AROUND HOME':'LITTLE TOWN STORIES';$('resident-card').hidden=false;$('follow-btn').hidden=!['resident','train','animal','cat','duck'].includes(data.type);$('follow-btn').textContent=data.type==='train'?'跟着列车兜一圈 ↗':'陪它走一会儿 ↗';$('interact-btn').textContent=data.action??(data.type==='train'?'和慢车打个招呼 ♡':data.name==='栖迟钟楼'?'敲响温柔的钟声 ♡':'轻轻敲敲门 ♡');if(innerWidth<760)closePanel();}
function inspect(event){if(state.placement){const p=groundPoint(event);if(!p)return;if(town.placedRoots.length>=60){toast('小镇已经很热闹了，先撤回一些布置再添加。');return;}p.x=Math.round(p.x*10)/10;p.z=Math.round(p.z*10)/10;if(!town.canPlace(state.placement,p.x,p.z)){toast('这里留给道路、河流或邻居，换一块宽敞的空地吧。');return;}town.place({type:state.placement,x:Math.round(p.x*10)/10,z:Math.round(p.z*10)/10});save();toast('你为小镇'+BUILD_HINTS[state.placement]+'。');return;}screenRay(event);scene.updateMatrixWorld(true);const hit=raycaster.intersectObjects(town.buildingHits,false)[0];if(hit)showStory(hit.object.userData);else{$('resident-card').hidden=true;state.follow=null;selectedData=null;}}
renderer.domElement.addEventListener('pointerdown',e=>{downPointer={x:e.clientX,y:e.clientY,id:e.pointerId};dragged=false;});
renderer.domElement.addEventListener('pointermove',e=>{lastPointer={x:e.clientX,y:e.clientY};if(downPointer&&Math.hypot(e.clientX-downPointer.x,e.clientY-downPointer.y)>6)dragged=true;if(state.placement){const p=groundPoint(e);placementPreview.visible=!!p;if(p){placementPreview.position.set(p.x,0,p.z);previewMat.color.set(town.canPlace(state.placement,p.x,p.z)?'#729765':'#b97a69');}return;}if(e.buttons)return;screenRay(e);const hit=raycaster.intersectObjects(town.buildingHits,false)[0];hovered=hit?.object??null;renderer.domElement.style.cursor=hovered?'pointer':'grab';});
renderer.domElement.addEventListener('pointerup',e=>{if(downPointer&&e.pointerId===downPointer.id&&!dragged)inspect(e);downPointer=null;});
renderer.domElement.addEventListener('pointercancel',()=>{downPointer=null;});
renderer.domElement.addEventListener('pointerleave',()=>{hovered=null;placementPreview.visible=false;});
$('journal-btn').onclick=()=>openPanel('journal');document.querySelectorAll('[data-journal]').forEach(b=>b.onclick=()=>{journalCategory=b.dataset.journal;renderJournal();});
$('atmosphere-btn').onclick=()=>openPanel('atmosphere');$('build-btn').onclick=()=>openPanel('build');$('close-panel').onclick=closePanel;
$('time-range').oninput=e=>setHour(Number(e.target.value)/60);
document.querySelectorAll('[data-hour]').forEach(b=>b.onclick=()=>setHour(Number(b.dataset.hour)));
document.querySelectorAll('[data-weather]').forEach(b=>b.onclick=()=>setWeather(b.dataset.weather));
document.querySelectorAll('[data-speed]').forEach(b=>b.onclick=()=>{state.speed=Number(b.dataset.speed);document.querySelectorAll('[data-speed]').forEach(x=>x.classList.toggle('selected',x===b));});
document.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>startPlacement(b.dataset.build));
$('cancel-placement').onclick=cancelPlacement;
$('undo-build').onclick=()=>{const removed=town.undo();if(removed){selectedData=null;state.follow=null;$('resident-card').hidden=true;save();toast('上一处布置已撤回。');}else toast('还没有添加新的布置。');};
function pause(){state.paused=!state.paused;$('pause-btn').setAttribute('aria-label',state.paused?'继续小镇':'暂停小镇');$('pause-btn').innerHTML=state.paused?'<svg viewBox="0 0 24 24"><path d="m9 5 10 7-10 7Z"/></svg>':'<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';updateClock();}
$('pause-btn').onclick=pause;
$('close-resident').onclick=()=>{$('resident-card').hidden=true;state.follow=null;selectedData=null;};
$('follow-btn').onclick=()=>{if(!selectedData)return;cameraTween=null;state.follow=state.follow===selectedData?null:selectedData;$('follow-btn').textContent=state.follow?'停止跟随 ↗':'陪它走一会儿 ↗';if(state.follow)toast(selectedData.type==='train'?'跟着慢车，绕小镇一圈。':'陪这位小镇朋友，走一小段慢时光。');};
$('interact-btn').onclick=()=>{if(!selectedData)return;const result=town.interact(selectedData);toast(result.message);playActionSound(result.sound);};
$('reset-view-btn').onclick=()=>{state.follow=null;cancelPlacement();cameraTween={start:performance.now(),from:camera.position.clone(),target:controls.target.clone(),to:homePosition.clone(),targetTo:homeTarget.clone(),zoom:camera.zoom,toZoom:1};toast('回到小镇全景。');};
let lastFocus=null;
function openHelp(){lastFocus=document.activeElement;$('help-modal').hidden=false;$('close-help').focus();}
function closeHelp(){$('help-modal').hidden=true;lastFocus?.focus();}
$('help-btn').onclick=openHelp;$('close-help').onclick=closeHelp;$('start-wandering').onclick=closeHelp;$('help-modal').onclick=e=>{if(e.target===$('help-modal'))closeHelp();};
$('help-modal').addEventListener('keydown',e=>{if(e.key!=='Tab')return;const buttons=[...$('help-modal').querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
$('fullscreen-btn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast('当前浏览器不支持全屏，可以试试横屏观看。');}catch(e){console.error('全屏请求失败',e);toast('浏览器未能进入全屏，你仍可以正常游玩。');}};
$('dismiss-hint').onclick=()=>$('orbit-hint').hidden=true;
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(e.key==='Escape'){closeHelp();closePanel();$('resident-card').hidden=true;state.follow=null;document.body.classList.remove('ui-hidden');}else if(e.code==='Space'&&$('help-modal').hidden){e.preventDefault();pause();}else if(e.key.toLowerCase()==='h'&&$('help-modal').hidden){document.body.classList.toggle('ui-hidden');if(document.body.classList.contains('ui-hidden'))toast('界面已隐藏 · 按 H 或 Esc 返回');}});

// Soft procedural ambience: wind, rain and a few distant birds. Nothing autoplays.
function playTone(freq,duration,volume=.03,type='sine'){if(!soundContext||!state.sound)return;const osc=soundContext.createOscillator(),gain=soundContext.createGain(),now=soundContext.currentTime;osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(freq*.82,now+duration);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.025);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain);gain.connect(soundBus);osc.start(now);osc.stop(now+duration+.02);}
async function toggleSound(){try{if(!soundContext){const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext){toast('当前浏览器不支持环境声音。');return;}soundContext=new AudioContext();soundBus=soundContext.createGain();soundBus.gain.value=.65;soundBus.connect(soundContext.destination);const len=soundContext.sampleRate*3,buffer=soundContext.createBuffer(1,len,soundContext.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<len;i++){const white=Math.random()*2-1;brown=(brown+.018*white)/1.018;data[i]=brown*4;}soundNoise=soundContext.createBufferSource();soundNoise.buffer=buffer;soundNoise.loop=true;const filter=soundContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1400;soundGain=soundContext.createGain();soundGain.gain.value=.12;soundNoise.connect(filter);filter.connect(soundGain);soundGain.connect(soundBus);soundNoise.start();}
    await soundContext.resume();state.sound=!state.sound;soundBus.gain.setTargetAtTime(state.sound?.65:0,soundContext.currentTime,.35);$('sound-btn').classList.toggle('sound-on',state.sound);$('sound-btn').classList.toggle('active',state.sound);$('sound-btn').setAttribute('aria-pressed',String(state.sound));$('sound-btn').title=state.sound?'关闭环境声音':'开启环境声音';toast(state.sound?'风声已打开，记得把音量调小一点。':'环境声音已关闭。');
  }catch(e){console.error('环境声音启动失败',e);state.sound=false;toast('环境声音未能启动，请再点一次试试。');}}
$('sound-btn').onclick=toggleSound;
let effectContext=null;
async function playActionSound(kind){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;effectContext??=soundContext??new Audio();await effectContext.resume();const notes={bell:[659,880,988],train:[330,392],hello:[660,830],cat:[540,460],duck:[320,270],frog:[180,230],water:[880,1100]}[kind]??[660,830];for(let i=0;i<notes.length;i++){const osc=effectContext.createOscillator(),gain=effectContext.createGain(),start=effectContext.currentTime+i*.14;osc.type=kind==='train'?'triangle':'sine';osc.frequency.setValueAtTime(notes[i],start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(kind==='train'?.035:.022,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+(kind==='bell'?.9:.3));osc.connect(gain);gain.connect(effectContext.destination);osc.start(start);osc.stop(start+1);}}catch(e){console.error('小镇互动音效播放失败',e);}}
$('photo-btn').onclick=()=>{try{renderer.render(scene,camera);const canvas=document.createElement('canvas');canvas.width=renderer.domElement.width;canvas.height=renderer.domElement.height;const ctx=canvas.getContext('2d');ctx.drawImage(renderer.domElement,0,0);const s=canvas.width/1400;ctx.fillStyle='rgba(250,251,239,.85)';ctx.font=`${Math.round(18*s)}px serif`;ctx.fillText('栖 迟 小 镇  /  S L O W H A V E N',Math.round(40*s),canvas.height-Math.round(35*s));canvas.toBlob(blob=>{if(!blob){toast('照片生成失败，请重试。');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`栖迟小镇-${$('time-text').textContent.replace(':','')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('这一刻，已经装进照片里。');},'image/png');}catch(e){console.error('保存小镇照片失败',e);toast('照片未能保存，请重试。');}};

function resize(){const aspect=innerWidth/innerHeight,frustum=Math.max(57,80/aspect);camera.left=-frustum*aspect/2;camera.right=frustum*aspect/2;camera.top=frustum/2;camera.bottom=-frustum/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
const sky=new THREE.Color(),dayFloor=new THREE.Color('#e1e8d8'),nightFloor=new THREE.Color('#304b52'),lightWarm=new THREE.Color('#ffe5b5'),lightDay=new THREE.Color('#fff2d7'),lightNight=new THREE.Color('#b6d2e6');
let previous=performance.now(),clockAccumulator=0,weatherTime=0,rendered=0,lastAutoSave=0,snowAccumulation=0;
function animate(now){requestAnimationFrame(animate);const realDt=Math.min((now-previous)/1000,.07);previous=now;if(document.hidden)return;const dt=state.paused?0:realDt*state.speed;
  state.hour+=dt*.018;if(state.hour>=24){state.hour%=24;state.day++;}clockAccumulator+=realDt;if(clockAccumulator>.3){updateClock();clockAccumulator=0;}
  const h=state.hour,daylight=THREE.MathUtils.smoothstep(Math.sin((h-6)/24*Math.PI*2),-.16,.35),gold=1-THREE.MathUtils.smoothstep(Math.abs(h-17.4),0,2.4);
  sky.copy(dayBg).lerp(nightBg,1-daylight);if(state.weather==='rain')sky.lerp(rainBg,daylight*.65);if(state.weather==='snow')sky.lerp(snowBg,daylight*.85);scene.background.copy(sky);scene.fog.color.copy(sky);floorMat.color.copy(dayFloor).lerp(nightFloor,1-daylight);if(state.weather==='snow')floorMat.color.lerp(snowBg,.25);
  ambient.intensity=.65+daylight*1.65;sun.intensity=.42+daylight*(state.weather==='sunny'?2.5:1.3);sun.color.copy(lightNight).lerp(lightDay,daylight).lerp(lightWarm,gold*.55);sun.position.x=-26+Math.sin((h-12)*Math.PI/12)*18;sun.position.y=25+daylight*23;sun.position.z=22;fill.intensity=.3+daylight*.25;renderer.toneMappingExposure=1.05+daylight*.16;
  const result=town.update(dt,h,state.weather,camera);
  if(state.follow!==null){const target=town.positionFor(state.follow),desired=target.clone(),shift=desired.clone().sub(controls.target).multiplyScalar(Math.min(realDt*2,1));controls.target.add(shift);camera.position.add(shift);camera.zoom=THREE.MathUtils.lerp(camera.zoom,state.follow.type==='train'?2.8:4.2,realDt*.7);camera.updateProjectionMatrix();}
  if(cameraTween){const t=Math.min((now-cameraTween.start)/1100,1),e=1-(1-t)**3;camera.position.lerpVectors(cameraTween.from,cameraTween.to,e);controls.target.lerpVectors(cameraTween.target,cameraTween.targetTo,e);camera.zoom=THREE.MathUtils.lerp(cameraTween.zoom,cameraTween.toZoom,e);camera.updateProjectionMatrix();if(t===1)cameraTween=null;}
  controls.update();
  if(hovered&&!state.placement){const p=hovered.getWorldPosition(new THREE.Vector3());hoverRing.visible=true;hoverRing.position.set(p.x,.44,p.z);const radius=hovered.userData.type==='building'?2:1;hoverRing.scale.setScalar(radius*(1+Math.sin(now*.002)*.03));}else hoverRing.visible=false;
  weatherTime+=dt;rain.visible=state.weather==='rain';snow.visible=state.weather==='snow';
  if(state.weather==='snow'){for(let i=0;i<weatherCount;i++){const p=weatherSeed[i],idx=i*3;weatherCoords[idx]=p.x+Math.sin(weatherTime*.35+p.phase)*.65;weatherCoords[idx+1]=((p.y-weatherTime*(.7+p.speed*.7))%26+26)%26+.5;weatherCoords[idx+2]=p.z+Math.cos(weatherTime*.25+p.phase)*.3;}snowGeo.attributes.position.needsUpdate=true;}
  if(state.weather==='rain'){for(let i=0;i<weatherCount;i++){const p=weatherSeed[i],idx=i*6,x=p.x+Math.sin(weatherTime*.2)*.7,y=((p.y-weatherTime*(11+p.speed*6))%27+27)%27+.4,z=p.z;rainCoords.set([x,y,z,x+.12,y+.6,z+.04],idx);}rainGeo.attributes.position.needsUpdate=true;}
  snowAccumulation=THREE.MathUtils.lerp(snowAccumulation,state.weather==='snow'?.8:0,realDt*.5);snowCapMat.opacity=snowAccumulation;snowCaps.visible=snowAccumulation>.01;
  if(state.sound&&soundContext){soundGain.gain.setTargetAtTime(state.weather==='rain'?.42:state.weather==='snow'?.08:.12,soundContext.currentTime,.4);birdTimer-=realDt;if(birdTimer<0){birdTimer=4+Math.random()*8;if(state.weather==='sunny'&&daylight>.5){playTone(1500+Math.random()*800,.13,.018);setTimeout(()=>playTone(1900+Math.random()*600,.12,.014),140);}}}
  renderer.render(scene,camera);rendered++;if(rendered===3){$('loading-screen').classList.add('done');setTimeout(()=>$('loading-screen').hidden=true,900);}
  lastAutoSave+=realDt;if(lastAutoSave>30){lastAutoSave=0;save();}
}
setWeather(state.weather,false);updateClock();requestAnimationFrame(animate);
setTimeout(()=>{if(!$('orbit-hint').hidden)$('orbit-hint').style.opacity='.55';},16000);
document.addEventListener('visibilitychange',()=>{previous=performance.now();if(document.hidden){save();if(soundBus&&soundContext)soundBus.gain.setTargetAtTime(0,soundContext.currentTime,.2);}else if(state.sound&&soundBus&&soundContext)soundBus.gain.setTargetAtTime(.65,soundContext.currentTime,.3);});
// A compact read-only diagnostic surface for QA and performance inspection.
window.__slowhaven={getState:()=>({...state,placements:town.placedRoots.length,residents:town.residents.length,animalPartners:town.entries().animals.length,places:town.entries().places.length,instanceBatches:town.actorBatches.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),renderer,scene,camera};
