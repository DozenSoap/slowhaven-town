import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';

// GitHub Pages' branch mode accepts / or /docs. The game remains authored in dist.
const root=resolve(fileURLToPath(new URL('..',import.meta.url))),source=join(root,'dist'),target=join(root,'docs');
await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
await cp(source,target,{recursive:true,filter:path=>!path.split(/[\\/]/).includes('__qa__')});
await writeFile(join(target,'.nojekyll'),'');
console.log('GitHub Pages static files prepared in docs/ (no saves or credentials).');
