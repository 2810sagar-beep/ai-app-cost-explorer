import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {main as backend} from '../functions/packages/explorer/api/index.js';
import {FUNCTION_PATH} from '../src/deployment.js';
const portArg=process.argv.indexOf('--port');
const port=Number(process.env.PORT||(portArg>=0?process.argv[portArg+1]:3000));
createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/_responsive'){
   res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html lang="en"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mobile layout QA</title><body style="margin:0;background:#e5eaf2;font:14px system-ui;padding:20px"><p>Mobile viewport · 390 × 844</p><iframe title="Mobile app preview" src="/" width="390" height="844" style="border:1px solid #ccd5e3;border-radius:8px;background:white"></iframe></body></html>');return;
  }
  if([FUNCTION_PATH,FUNCTION_PATH+'/', '/api','/api/'].includes(url.pathname)){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>16000){res.writeHead(413);res.end();return;}}
   let args={};try{args=body?JSON.parse(body):{};}catch{res.writeHead(400);res.end('Invalid JSON');return;}
   const result=await backend({...args,__ow_method:req.method.toLowerCase(),__ow_headers:req.headers});
   res.writeHead(result.statusCode,result.headers);res.end(typeof result.body==='string'?result.body:JSON.stringify(result.body));return;
  }
  if(url.pathname==='/app.js'||url.pathname==='/app.css'){
   const output=await build({entryPoints:['src/main.jsx'],bundle:true,format:'esm',write:false,outfile:'app.js',define:{'process.env.NODE_ENV':'"development"'},loader:{'.js':'jsx'}});
   const file=output.outputFiles.find(f=>f.path.endsWith(url.pathname));
   res.writeHead(200,{'Content-Type':url.pathname.endsWith('css')?'text/css':'text/javascript'});res.end(file.contents);return;
  }
  if(url.pathname!=='/'){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':'text/html'});res.end(await readFile('index.html'));
 }catch(e){console.error(e.message);res.writeHead(500);res.end('Preview error');}
}).listen(port,'0.0.0.0',()=>console.log(`Preview on port ${port}`));
