// Procedural effects: no audio downloads, licensing dependencies, or network.
export class SoundEffects {
  constructor({enabled=true,contextFactory=()=>new (globalThis.AudioContext||globalThis.webkitAudioContext)()}={}){
    this.enabled=enabled;this.contextFactory=contextFactory;this.context=null;this.master=null;this.played=0;this.active=0;
  }
  async unlock(){
    if(!this.enabled)return false;
    try{
      if(!this.context){this.context=this.contextFactory();this.master=this.context.createGain();this.master.gain.value=.22;this.master.connect(this.context.destination);}
      if(this.context.state==='suspended')await this.context.resume();
      return this.context.state==='running';
    }catch{return false;}
  }
  setEnabled(enabled){this.enabled=!!enabled;if(this.master)this.master.gain.value=this.enabled?.22:0;if(this.enabled)this.unlock();}
  get status(){return this.context?.state||'locked';}
  tone(frequency,duration=.1,{delay=0,type='sine',volume=.3,endFrequency=null}={}){
    const context=this.context,start=context.currentTime+delay;
    const osc=context.createOscillator(),gain=context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency,start);
    if(endFrequency)osc.frequency.exponentialRampToValueAtTime(endFrequency,start+duration);
    gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain);gain.connect(this.master);osc.start(start);osc.stop(start+duration+.01);
    this.active++;osc.onended=()=>{this.active--;osc.disconnect();gain.disconnect();};
  }
  noise(duration=.12,volume=.2){
    const context=this.context,length=Math.floor(context.sampleRate*duration),buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.value=1100;gain.gain.value=volume;
    source.connect(filter);filter.connect(gain);gain.connect(this.master);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  play(event,{chain=1,count=3}={}){
    if(!this.enabled||this.context?.state!=='running'||this.active>16)return false;
    switch(event){
      case 'move':this.tone(360,.035,{volume:.09});break;
      case 'swap':this.tone(580,.075,{type:'triangle',volume:.35,endFrequency:280});this.tone(850,.06,{delay:.045,volume:.18});break;
      case 'clear':{
        const base=440*Math.pow(1.15,Math.min(chain-1,6));
        const notes=chain>1?[1,1.25,1.5,2]:count>3?[1,1.25,1.5]:[1,1.25];
        notes.forEach((ratio,i)=>this.tone(base*ratio,.13,{delay:i*.055,type:i%2?'triangle':'square',volume:.18}));break;
      }
      case 'sent':this.tone(320,.18,{type:'triangle',volume:.3,endFrequency:1200});break;
      case 'incoming':this.tone(650,.18,{type:'sawtooth',volume:.14,endFrequency:180});this.tone(180,.12,{delay:.13,volume:.2});break;
      case 'garbage':this.noise(.14,.25);this.tone(110,.16,{type:'triangle',volume:.3,endFrequency:55});this.tone(82,.08,{delay:.032,type:'square',volume:.08});break;
      case 'pulse':[660,880,1320].forEach((f,i)=>this.tone(f,.064,{delay:i*.032,type:i%2?'triangle':'square',volume:.16}));this.noise(.048,.1);break;
      case 'shift':[660,440,220].forEach((f,i)=>this.tone(f,.064,{delay:i*.032,type:'triangle',volume:.18}));this.noise(.064,.14);break;
      case 'surge':[440,554,660,880].forEach((f,i)=>this.tone(f,.096,{delay:i*.048,type:'square',volume:.12}));break;
      case 'overdrive':[220,440,554,660,880,1320].forEach((f,i)=>this.tone(f,.128,{delay:i*.032,type:i%2?'triangle':'square',volume:.16}));this.noise(.096,.18);break;
      case 'countdown':this.tone(600,.09,{volume:.25});break;
      case 'go':this.tone(880,.22,{type:'triangle',volume:.3});this.tone(1320,.17,{delay:.06,volume:.16});break;
      case 'danger':this.tone(220,.1,{type:'square',volume:.1});this.tone(330,.1,{delay:.15,type:'square',volume:.1});break;
      case 'win':[523.25,659.25,783.99,1046.5].forEach((note,i)=>this.tone(note,i===3?.5:.18,{delay:i*.13,type:'triangle',volume:.28}));break;
      case 'lose':[330,261.63,196,130.81].forEach((note,i)=>this.tone(note,.25,{delay:i*.13,type:'triangle',volume:.25}));break;
      default:return false;
    }
    this.played++;return true;
  }
}
export const effects=new SoundEffects();
