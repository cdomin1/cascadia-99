// One registry for developer-supplied, licensed recordings. An empty library is valid.
export const CATEGORIES=Object.freeze(['menu','gameplay','results','stems']);
export function normalizeManifest(manifest){
 const tracks=Object.create(null);
 for(const item of Array.isArray(manifest?.tracks)?manifest.tracks:[]){
  if(!item||typeof item.id!=='string'||! /^[a-zA-Z0-9_-]+$/.test(item.id)||Object.hasOwn(tracks,item.id)||typeof item.title!=='string'||!item.title.trim()||(item.loop!==undefined&&typeof item.loop!=='boolean')||!CATEGORIES.includes(item.category))continue;
  const path=item.path;
  if(typeof path!=='string'||! /^(menu|gameplay|results|stems)\/[a-zA-Z0-9_./ -]+\.(ogg|mp3|wav)$/i.test(path)||path.includes('..')||path.includes('//'))continue;
  const start=item.loopStart??0,end=item.loopEnd??null;
  if(!Number.isFinite(start)||start<0||(end!==null&&(!Number.isFinite(end)||end<=start)))continue;
  tracks[item.id]={id:item.id,title:item.title,path,category:item.category,loop:item.loop===true,loopStart:start,loopEnd:end,artist:typeof item.artist==='string'?item.artist:'',credit:typeof item.credit==='string'?item.credit:''};
 }
 return tracks;
}
