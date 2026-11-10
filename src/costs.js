import {CATALOG,DEFAULTS} from './catalog.js';
export const LIMITS={users:[1,1000000],tasks:[0,1000],calls:[1,20],input:[1,32000],output:[1,8000],instances:[1,100],fileMB:[0,100],retention:[1,365],downloads:[0,100],peak:[1,100000],budget:[1,1000000],retry:[0,100],trafficMB:[0,10],inboundGB:[0,100000]};
export function normalize(raw={}){
 const s={...DEFAULTS};
 for(const [k,[min,max]] of Object.entries(LIMITS)){
  const value=Number(raw[k]??s[k]);s[k]=Number.isFinite(value)?Math.min(max,Math.max(min,value)):s[k];
 }
 s.users=Math.round(s.users);s.instances=Math.round(s.instances);
 s.model=Object.hasOwn(CATALOG.models,raw.model)?raw.model:DEFAULTS.model;
 s.hosting=Object.hasOwn(CATALOG.hosting,raw.hosting)?raw.hosting:DEFAULTS.hosting;
 s.storage=typeof raw.storage==='boolean'?raw.storage:DEFAULTS.storage;
 return s;
}
export function calculate(raw,usersOverride,catalog=CATALOG){
 const s=normalize({...raw,...(usersOverride===undefined?{}:{users:usersOverride})});
 const tasks=s.users*s.tasks,calls=tasks*s.calls*(1+s.retry/100),input=calls*s.input,output=calls*s.output;
 // Decimal MB at the input, bytes for workload, and provider-specific GB/GiB at pricing.
 const storedBytes=s.storage?tasks*s.fileMB*1e6*s.retention/30:0;
 const downloadBytes=s.storage?tasks*s.fileMB*1e6*s.downloads:0;
 const webBytes=tasks*s.trafficMB*1e6;
 const storageGB=storedBytes/1e9,storageGiB=storedBytes/(2**30),downloadGB=downloadBytes/1e9,downloadGiB=downloadBytes/(2**30);
 const model=catalog.models[s.model],host=catalog.hosting[s.hosting];
 const providers={};
 for(const id of ['do','aws']){
  const rates=model[id],inference=input/1e6*rates.input+output/1e6*rates.output,hosting=host[id].monthly*s.instances;
  let storage=0,fileTransfer=0,storagePlan='No file storage';
  if(s.storage&&id==='do'){
   const p=catalog.doStorage;storage=p.base+Math.max(0,storageGiB-p.includedGiB)*p.extraGiB;
   fileTransfer=Math.max(0,downloadGiB-p.transferGiB)*p.egressGiB;storagePlan='Spaces Standard';
  }
  if(s.storage&&id==='aws'){
   const p=catalog.awsStorage;
   // Select cheapest published bucket bundle for the identical workload, including overages.
   const options=p.bundles.map(b=>({...b,storage:b.base+Math.max(0,storageGB-b.storageGB)*p.extraGB,transfer:Math.max(0,downloadGB-b.transferGB)*p.egressGB}));
   const b=options.sort((a,b)=>(a.storage+a.transfer)-(b.storage+b.transfer))[0];
   storage=b.storage;fileTransfer=b.transfer;storagePlan=`Lightsail ${b.storageGB} GB bucket`;
  }
  // Inbound + outbound count against Lightsail allowance; only outbound excess is billed.
  const webTransfer=id==='do'?Math.max(0,webBytes/(2**30)-host.do.transferGiB*s.instances)*0.01:Math.min(webBytes/1e9,Math.max(0,webBytes/1e9+s.inboundGB-host.aws.transferGB*s.instances))*0.114;
  const transfer=fileTransfer+webTransfer,total=inference+hosting+storage+transfer;
  providers[id]={inference,hosting,storage,transfer,total,inputCost:input/1e6*rates.input,outputCost:output/1e6*rates.output,fileTransfer,webTransfer,storagePlan,per1000:tasks?total/tasks*1000:0};
 }
 const delta=providers.aws.total-providers.do.total;
 return {s,tasks,calls,input,output,storageGB,storageGiB,downloadGB,downloadGiB,providers,delta,winner:Math.abs(delta)<0.005?'tie':delta>0?'do':'aws'};
}
export function growth(raw,catalog=CATALOG){
 const s=normalize(raw),max=Math.min(1e6,Math.max(10000,s.users*10)),values=new Set([100,1000,10000,s.users,max]);
 for(let i=0;i<31;i++)values.add(Math.round(100*Math.pow(max/100,i/30)));
 return [...values].filter(x=>x<=max).sort((a,b)=>a-b).map(users=>({users,...calculate(s,users,catalog)}));
}
export function budgetLimit(raw,id,catalog=CATALOG){
 const s=normalize(raw);if(calculate(s,1,catalog).providers[id].total>s.budget)return 0;
 if(calculate(s,1000000,catalog).providers[id].total<=s.budget)return null;
 let lo=1,hi=1000000;while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(calculate(s,mid,catalog).providers[id].total<=s.budget)lo=mid;else hi=mid;}return lo;
}
export function insight(result){
 const {providers:p,winner,delta}=result;
 const winnerName=winner==='do'?'DigitalOcean':'AWS',cheaper=winner==='do'?p.do:p.aws;
 if(winner==='tie')return 'Both providers have the same estimated cost for this workload. Compare the included services and operating experience next.';
 const largest=Object.entries({inference:cheaper.inference,hosting:cheaper.hosting,storage:cheaper.storage,'data transfer':cheaper.transfer}).sort((a,b)=>b[1]-a[1])[0];
 return `${winnerName} is approximately $${Math.abs(delta).toFixed(2)} lower per month in this scenario. ${largest[0][0].toUpperCase()+largest[0].slice(1)} is its largest cost component. Change usage or response length to see whether that advantage holds.`;
}
