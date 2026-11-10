import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/main.jsx'],bundle:true,format:'esm',minify:true,sourcemap:false,outfile:'dist/app.js',define:{'process.env.NODE_ENV':'"production"'},loader:{'.js':'jsx'}});
await copyFile('index.html','dist/index.html');
console.log('Built static app in dist/');
