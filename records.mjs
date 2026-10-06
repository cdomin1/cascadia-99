const KEY='cascadia99-records';
const valid=n=>Number.isSafeInteger(n)&&n>=0?n:0;
export class PersonalRecords {
  constructor(storage=null){this.storage=storage;this.data={score:0,chain:0,wins:0,matches:0};try{const saved=JSON.parse(storage?.getItem(KEY)||'{}');for(const key of Object.keys(this.data))this.data[key]=valid(saved[key]);}catch{}}
  observe(score,chain){const old=JSON.stringify(this.data);this.data.score=Math.max(this.data.score,valid(score));this.data.chain=Math.max(this.data.chain,valid(chain));if(old!==JSON.stringify(this.data))this.save();}
  finish(won){this.data.matches++;if(won)this.data.wins++;this.save();}
  save(){try{this.storage?.setItem(KEY,JSON.stringify(this.data));}catch{}}
}
