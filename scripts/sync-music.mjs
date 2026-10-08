// Copy the developer's licensed library into Godot's self-contained project.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {normalizeManifest} from '../music-library.mjs';
const base='assets/audio/music',destination='godot/assets/audio/music';
const manifest=JSON.parse(await readFile(base+'/manifest.json','utf8'));
const tracks=normalizeManifest(manifest);
if(!Array.isArray(manifest.tracks)||Object.keys(tracks).length!==manifest.tracks.length)throw Error('Invalid or duplicate music registry entries');
// Check every source before changing the native manifest. No missing-file placeholders.
for(const track of Object.values(tracks))await readFile(resolve(base,track.path));
for(const track of Object.values(tracks)){const target=resolve(destination,track.path);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(base,track.path),target);}
await mkdir(destination,{recursive:true});await writeFile(destination+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('MUSIC_LIBRARY_SYNCED',Object.keys(tracks).length,'licensed tracks; no music generated');
