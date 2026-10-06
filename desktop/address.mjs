export function serverAddress(value){
  let url;
  try{url=new URL(String(value).trim());}catch{throw new Error('Enter a full game server address, such as http://192.168.1.20:3000.');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Use an http:// or https:// game server address without a path, password, or query.');
  return url.origin;
}
