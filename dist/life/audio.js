const DEFAULTS=Object.freeze({version:1,enabled:true,master:.65,music:.24,ambience:.42,effects:.65});
const KEY='slowhaven-audio-v1';
export function readAudioPreferences(storage){
  const raw=storage?.getItem(KEY);if(raw===null||raw===undefined)return {...DEFAULTS};
  const p=JSON.parse(raw);if(!p||p.version!==1||typeof p.enabled!=='boolean'||['master','music','ambience','effects'].some(k=>typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<0||p[k]>1))throw new Error('声音设置格式无效，请在声音面板重新设置。');
  return {version:1,enabled:p.enabled,master:p.master,music:p.music,ambience:p.ambience,effects:p.effects};
}
const midi=n=>440*Math.pow(2,(n-69)/12);
const MELODY=[67,71,74,76,74,71,69,null,67,69,71,74,71,69,64,null,64,67,69,71,74,71,67,null,69,71,74,76,74,69,67,null];
export class TownAudio{
  constructor({storage=null,createContext=null,onError=()=>{}}={}){
    this.storage=storage;this.createContext=createContext;this.onError=onError;this.ctx=null;this.voices=new Set();this.layers={};this.hidden=false;this.unlockPending=null;this.nextNote=0;this.noteIndex=0;this.effectStep=0;this.footDistance=0;this.nextBird=0;this.ducked=false;this.lastUpdate=0;this.failed=false;
    try{this.preferences=readAudioPreferences(storage);}catch(e){this.preferences={...DEFAULTS,enabled:false};this.onError(e);}
  }
  get enabled(){return this.preferences.enabled;}
  get ready(){return !!this.ctx&&this.ctx.state==='running'&&this.enabled&&!this.hidden;}
  savePreferences(){try{this.storage?.setItem(KEY,JSON.stringify(this.preferences));}catch(e){this.onError(new Error('声音设置未能保存：'+e.message));}}
  async unlock(){
    if(!this.enabled||this.hidden||this.failed)return false;if(this.ctx?.state==='running')return true;
    if(this.unlockPending)return this.unlockPending;
    this.unlockPending=(async()=>{try{
      if(!this.ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!this.createContext&&!Audio)throw new Error('当前浏览器不支持游戏音频。');this.ctx=this.createContext?this.createContext():new Audio({latencyHint:'interactive'});this.buildGraph();}
      await this.ctx.resume();this.nextNote=this.ctx.currentTime+.2;this.applyVolumes();return this.ctx.state==='running';
    }catch(e){this.failed=true;this.onError(new Error('声音未能启动：'+e.message));return false;}finally{this.unlockPending=null;}})();return this.unlockPending;
  }
  buildGraph(){
    const c=this.ctx;this.master=c.createGain();this.master.gain.value=0;const compressor=c.createDynamicsCompressor();compressor.threshold.value=-16;compressor.ratio.value=5;this.master.connect(compressor);compressor.connect(c.destination);
    for(const name of['music','ambience','effects']){const g=c.createGain();g.connect(this.master);this[name+'Bus']=g;}
    const count=c.sampleRate*6;this.noise=c.createBuffer(1,count,c.sampleRate);const data=this.noise.getChannelData(0);let brown=0,seed=17341;for(let i=0;i<count;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;brown=(brown+.025*white)/1.025;data[i]=brown*3+white*.22;}
    this.makeLayer('wind','lowpass',550,.7);this.makeLayer('rain','highpass',1100,.9);this.makeLayer('water','bandpass',800,1.4);this.makeLayer('waves','lowpass',360,.7);
    this.applyVolumes();
  }
  makeLayer(name,type,frequency,q){const c=this.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=this.noise;source.loop=true;filter.type=type;filter.frequency.value=frequency;filter.Q.value=q;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(this.ambienceBus);source.start(0,Object.keys(this.layers).length*.7);this.layers[name]={source,filter,gain};}
  ramp(param,value,seconds=.15){const now=this.ctx.currentTime;param.cancelScheduledValues(now);param.setTargetAtTime(value,now,seconds);}
  applyVolumes(){if(!this.ctx)return;const p=this.preferences;this.ramp(this.master.gain,p.enabled&&!this.hidden?p.master:0,.035);this.ramp(this.musicBus.gain,p.music*(this.ducked?.45:1));this.ramp(this.ambienceBus.gain,p.ambience*(this.ducked?.65:1));this.ramp(this.effectsBus.gain,p.effects,.035);}
  async toggle(){this.preferences.enabled=!this.enabled;this.savePreferences();if(this.enabled)await this.unlock();this.applyVolumes();if(!this.enabled&&this.ctx)await this.ctx.suspend();return this.enabled;}
  setVolume(name,value){if(!['master','music','ambience','effects'].includes(name)||!Number.isFinite(value)||value<0||value>1)throw new Error('音量应在 0 到 1 之间。');this.preferences[name]=value;this.savePreferences();this.applyVolumes();}
  async setHidden(hidden){this.hidden=hidden;if(!this.ctx)return;this.applyVolumes();if(hidden)await this.ctx.suspend();else if(this.enabled){try{await this.ctx.resume();this.nextNote=this.ctx.currentTime+.3;}catch(e){this.onError(new Error('声音恢复失败：'+e.message));}}}
  tone(freq,duration=.3,volume=.08,type='sine',offset=0,bus='effects',endFrequency=null){
    if(!this.ready||this.voices.size>=28)return;const c=this.ctx,start=c.currentTime+offset,osc=c.createOscillator(),gain=c.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,start);if(endFrequency)osc.frequency.exponentialRampToValueAtTime(endFrequency,start+duration*.8);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.001,volume),start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(this[bus+'Bus']);this.voices.add(osc);osc.onended=()=>{this.voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.03);
  }
  rustle(duration=.16,volume=.08,frequency=1100){if(!this.ready||this.voices.size>=28)return;const c=this.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),now=c.currentTime;source.buffer=this.noise;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(volume,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);source.connect(filter);filter.connect(gain);gain.connect(this.effectsBus);this.voices.add(source);source.onended=()=>{this.voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(now,(this.effectStep++*.371)%4);source.stop(now+duration+.02);}
  play(kind){if(!this.ready)return;
    const chord=(notes,gap=.1,volume=.08)=>notes.forEach((n,i)=>this.tone(midi(n),.55,volume,'sine',i*gap));
    switch(kind){
      case 'ui':this.tone(690,.055,.025,'triangle',0,'effects',470);break;
      case 'enter':case 'exit':this.rustle(.18,.12,650);this.tone(185,.19,.045,'triangle',.025,'effects',125);break;
      case 'plant':this.rustle(.22,.16,410);this.tone(260,.09,.025);break;
      case 'water':this.rustle(.6,.25,1550);this.tone(680,.22,.035,'sine',.12,'effects',370);this.tone(950,.18,.025,'sine',.28,'effects',610);break;
      case 'harvest':chord([67,71,74],.09,.07);this.rustle(.17,.1,950);break;
      case 'buy':case 'sell':case 'claim':chord([79,86],.065,.065);break;
      case 'chat':case 'gift':case 'help':case 'invite':case 'meet':case 'romance':chord(kind==='romance'?[67,71,74,79]:[72,76],.09,.055);break;
      case 'fish':this.rustle(.38,.18,1700);chord([74,79],.16,.05);break;
      case 'forage':chord([76,79],.08,.04);this.rustle(.13,.08,1200);break;
      case 'eat':this.rustle(.15,.075,1400);this.tone(380,.15,.025);break;
      case 'cook':case 'bath':this.rustle(.65,.2,1100);chord([64,67],.22,.03);break;
      case 'study':case 'paint':case 'work':this.rustle(.24,.12,1550);chord([69,74],.14,.035);break;
      case 'heal':case 'rest':chord([64,71,74],.15,.04);break;
      case 'sleep':chord([74,71,67,64],.25,.045);break;
      case 'morning':chord([67,71,74,79],.15,.05);break;
      case 'cat':this.tone(620,.32,.055,'sine',0,'effects',390);this.tone(625,.23,.025,'triangle',.07,'effects',460);break;
      case 'duck':this.tone(310,.12,.04,'triangle',0,'effects',245);this.tone(290,.12,.035,'triangle',.15,'effects',220);break;
      case 'pet':chord([76,81],.12,.04);break;
      case 'fail':this.tone(260,.1,.025,'triangle',0,'effects',220);break;
      default:break;
    }
  }
  footsteps(distance,surface='grass'){if(!this.ready||distance<=0)return;this.footDistance+=distance;if(this.footDistance<.95)return;this.footDistance%=.95;this.rustle(.07,surface==='wood'?.11:.075,surface==='wood'?440:surface==='path'?790:1300);if(surface==='wood')this.tone(155,.065,.035,'triangle');}
  update(s,{ducked=false}={}){if(!this.ready)return;const c=this.ctx,now=c.currentTime;if(this.ducked!==ducked){this.ducked=ducked;this.applyVolumes();}if(now-this.lastUpdate<.2)return;this.lastUpdate=now;
    const p=s.player,night=s.minute<360||s.minute>=1140,inside=!!p.inside,rain=s.weather==='rain',sea=p.area==='coast',river=p.area==='center'&&Math.abs(p.x-(-8.2+2.1*Math.sin(p.z*.16)+.8*Math.sin(p.z*.37)))<7;
    this.ramp(this.layers.wind.gain.gain,inside?.008:rain?.025:.065,.7);this.ramp(this.layers.rain.gain.gain,rain?(inside?.035:.17):0,.6);this.ramp(this.layers.water.gain.gain,!inside&&river?.12:!inside&&p.area==='farm'&&Math.hypot(p.x+21,p.z-3)<9?.06:0,.6);this.ramp(this.layers.waves.gain.gain,sea&&!inside?.14+Math.sin(now*.6)*.055:0,.8);
    if(now>=this.nextBird){this.nextBird=now+(night?9:7)+(this.effectStep++%6);if(!inside&&!rain){if(night){this.tone(2600,.055,.008,'sine');this.tone(2700,.055,.007,'sine',.12);}else if(!sea){this.tone(1600,.11,.023,'sine',0,'effects',2200);this.tone(2300,.1,.016,'sine',.14,'effects',1800);}}}
    if(this.nextNote<now-.5)this.nextNote=now+.2;
    if(now+.25>=this.nextNote){const note=MELODY[this.noteIndex%MELODY.length];if(note!==null){const transpose=night?-12:0;this.tone(midi(note+transpose),1.9,.10,'sine',Math.max(0,this.nextNote-now),'music');this.tone(midi(note+12+transpose),.8,.012,'sine',Math.max(0,this.nextNote-now),'music');if(this.noteIndex%8===0)this.tone(midi(43+transpose),3.1,.075,'sine',Math.max(0,this.nextNote-now),'music');}this.noteIndex++;this.nextNote+=.94;}
  }
  async dispose(){for(const source of this.voices){try{source.stop();}catch{}}this.voices.clear();for(const layer of Object.values(this.layers))layer.source.stop();this.swell?.stop();await this.ctx?.close();this.ctx=null;}
}
