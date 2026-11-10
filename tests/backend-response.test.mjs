import test from 'node:test';
import assert from 'node:assert/strict';
import {readBackendResponse} from '../src/backend-response.js';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
test('direct and DigitalOcean JSON-wrapped status responses connect identically',async()=>{
 const status={live:true,model:'test-model',sizes:false};
 assert.deepEqual(await readBackendResponse(json(status),'status'),status);
 assert.deepEqual(await readBackendResponse(json({statusCode:200,body:status}),'status'),status);
});
test('transport success cannot hide function authorization or inference failures',async()=>{
 for(const statusCode of [401,502,503]){
  await assert.rejects(readBackendResponse(json({statusCode,body:{error:'Actionable function error.'}}),'analyze'),/Actionable function error/);
 }
});
test('routing and gateway pages explain the next diagnostic step',async()=>{
 await assert.rejects(readBackendResponse(new Response('<Error>InvalidRequest</Error>',{status:400}),'status'),/did not reach the AI backend/);
 await assert.rejects(readBackendResponse(new Response('Gateway timeout',{status:504}),'analyze'),/runtime logs/);
});
test('unrelated JSON cannot produce a false connected state',async()=>{
 await assert.rejects(readBackendResponse(json({ok:true}),'status'),/did not return the AI backend status/);
});
