// Source-build native offline bridge. Never exposes training intents publicly.
import {createGameServer} from './server.mjs';
import {writeFile} from 'node:fs/promises';
const index=process.argv.indexOf('--address-file'),file=process.argv[index+1];
if(index<0||!file)throw Error('An address file is required.');
const game=createGameServer({host:'127.0.0.1',port:0,training:true});
const url=await game.listen();await writeFile(file,url,'utf8');
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,async()=>{await game.close();process.exit(0);});
