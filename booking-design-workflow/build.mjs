import './regenerate-tokens.mjs';
import {build} from 'esbuild'; import {cp,mkdir,rm} from 'node:fs/promises'; await rm('dist',{recursive:true,force:true}); await mkdir('dist'); await cp('public','dist',{recursive:true}); await build({entryPoints:['src/preview.js'],outfile:'dist/preview.js',bundle:true,format:'esm',define:{'process.env.NODE_ENV':'"production"'}});
