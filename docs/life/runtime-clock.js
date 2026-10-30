// Bound catch-up work without coupling the town's clock to its drawing frame rate.
export class RuntimeClock{
  constructor(){this.last=null;this.remainder=0;this.running=false;}
  reset(now){this.last=now;this.remainder=0;this.running=false;}
  sample(now,running){
    if(!Number.isFinite(now))throw new TypeError('运行时间必须是有限数值');
    const elapsed=this.last===null?0:Math.max(0,(now-this.last)/1000);this.last=now;
    if(!running||!this.running){this.remainder=0;this.running=running;return 0;}
    this.remainder+=Math.min(elapsed,2);
    const steps=Math.min(20,Math.floor((this.remainder+1e-9)/.1));
    this.remainder=Math.max(0,this.remainder-steps*.1);return steps;
  }
}
