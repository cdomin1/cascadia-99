import {spawn} from 'node:child_process';
import electron from 'electron';
import {resolve} from 'node:path';
const child=spawn(electron,['.','--smoke-test','--disable-gpu',...(process.platform==='linux'?['--ozone-platform=x11']:[]),...(process.env.PANEL99_HEADLESS==='1'?['--headless']:[])],{
  cwd:new URL('../',import.meta.url),stdio:'inherit',
  env:{...process.env,PANEL99_SMOKE_PROFILE:resolve('.desktop-smoke/profile'),PANEL99_SMOKE_OUTPUT:resolve('.desktop-smoke')}
});
child.on('error',error=>{console.error(error);process.exitCode=1;});
child.on('exit',(code,signal)=>{process.exitCode=code??1;if(signal)console.error(`Desktop exited with ${signal}`);});
const timer=setTimeout(()=>{console.error('Desktop smoke test timed out.');child.kill('SIGTERM');},30000);
child.on('exit',()=>clearTimeout(timer));
