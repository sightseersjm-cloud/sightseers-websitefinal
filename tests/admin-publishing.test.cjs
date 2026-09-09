const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Module=require('node:module');
const {Readable}=require('node:stream');
process.env.JWT_SECRET='unit-test-only-signing-secret';
const auth=require('../api/_lib/auth');
function storage(){const map=new Map();return{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
function bridge(fetch){
 const localStorage=storage(),events=[];
 const ctx={localStorage,fetch,console,Promise,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail;}},document:{addEventListener(){},dispatchEvent:e=>events.push(e)}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../public/bridge.js'),'utf8'),ctx);
 return {ctx,events,ss:ctx.SS,localStorage};
}
function response(data,status=200){return {ok:status<300,status,json:async()=>data};}
test('customer session cannot publish; explicit passcode exchange replaces it',async()=>{
 let role='customer',writes=0,saved={};
 const b=bridge(async(url,opts={})=>{
  const body=opts.body?JSON.parse(opts.body):{};
  if(url==='/api/auth'&&body.action==='passcode'){role='editor';return response({token:'test-editor',user:{role}});}
  if(url==='/api/auth')return response({user:{role}});
  if(opts.method==='POST'){writes++;saved=body.batch;return response({ok:true});}
  return response(saved);
 });
 b.localStorage.setItem('ss_auth_token','customer');
 await assert.rejects(b.ss.publishSettings({ss_site_settings:{heroTitle:'New title'}}),/cannot publish/);
 assert.equal(writes,0);
 await b.ss.passcodeLogin('test fixture only');
 assert.equal((await b.ss.publishSettings({ss_site_settings:{heroTitle:'New title'}})).ok,true);
 assert.equal(writes,1);
 const fresh=bridge(async()=>response(saved));await fresh.ss.syncFromServer();
 assert.equal(JSON.parse(fresh.localStorage.getItem('ss_site_settings')).heroTitle,'New title');
});
test('expired session, null token, failed write and mismatched readback never report success',async()=>{
 const expired=bridge(async()=>response({error:'Sign in required'},401));expired.localStorage.setItem('ss_auth_token','expired');
 await assert.rejects(expired.ss.publishSettings({ss_ga4_id:'G-TEST'}),/Sign in required/);
 const noToken=bridge(async()=>response({token:null,user:{role:'editor'}}));await assert.rejects(noToken.ss.passcodeLogin('fixture'),/did not create/);
 let failWrite=true;
 const b=bridge(async(url,opts={})=>url==='/api/auth'?response({user:{role:'editor'}}):opts.method==='POST'?response({error:'storage unavailable'},failWrite?503:200):response({}));
 b.localStorage.setItem('ss_auth_token','editor');
 await assert.rejects(b.ss.publishSettings({ss_ga4_id:'G-TEST'}),/storage unavailable/);
 failWrite=false;await assert.rejects(b.ss.publishSettings({ss_ga4_id:'G-TEST'}),/does not match/);
});
test('local drafts make no network requests; queued saves retain call order',async()=>{
 let writes=[],stored={},active=0,max=0;
 const b=bridge(async(url,opts={})=>{
  if(url==='/api/auth')return response({user:{role:'editor'}});
  if(opts.method==='POST'){active++;max=Math.max(max,active);await new Promise(r=>setImmediate(r));stored=JSON.parse(opts.body).batch;writes.push(stored.ss_ga4_id);active--;return response({ok:true});}
  return response(stored);
 });
 b.localStorage.setItem('ss_site_settings','{"heroTitle":"draft"}');assert.equal(writes.length,0);
 b.localStorage.setItem('ss_auth_token','editor');
 await Promise.all([b.ss.publishSettings({ss_ga4_id:'first'}),b.ss.publishSettings({ss_ga4_id:'second'})]);
 assert.deepEqual(writes,['first','second']);assert.equal(max,1);
});
test('settings endpoint keeps existing data, rejects unauthorized writes, and never overwrites after failed reads',async()=>{
 class NotFound extends Error{};class Conflict extends Error{};
 let data={ss_ga4_id:'G-KEEP'},etag='v1',writes=0,failRead=false,conflict=false;
 const mock={BlobNotFoundError:NotFound,BlobPreconditionFailedError:Conflict,
  get:async()=>{if(failRead)throw Error('storage offline');return{stream:Readable.toWeb(Readable.from([Buffer.from(JSON.stringify(data))])),blob:{etag}};},
  put:async(path,body,opts)=>{assert.equal(opts.ifMatch,etag);if(conflict){conflict=false;data.ss_destination_packages_v2={preserved:true};etag='v2';throw new Conflict();}writes++;data=JSON.parse(body);etag='v3';}
 };
 const original=Module._load;Module._load=function(id,...rest){if(id==='@vercel/blob')return mock;return original.call(this,id,...rest);};
 delete require.cache[require.resolve('../api/_handlers/settings')];const handler=require('../api/_handlers/settings');Module._load=original;
 async function call(method,body,role){const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(d){this.data=d;return this;},end(){return this;}};
  await handler({method,body,headers:role?{authorization:'Bearer '+auth.createToken({role})}:{}},res);return res;}
 assert.equal((await call('POST',{key:'ss_ga4_id',value:'x'})).code,401);
 assert.equal((await call('POST',{key:'ss_ga4_id',value:'x'},'customer')).code,403);
 assert.equal((await call('POST',{key:'__proto__',value:{}},'editor')).code,400);
 conflict=true;assert.equal((await call('POST',{batch:{ss_site_settings:{heroTitle:'Published'}}},'editor')).code,200);
 assert.equal(data.ss_ga4_id,'G-KEEP');assert.equal(data.ss_destination_packages_v2.preserved,true);
 const before=JSON.stringify(data);failRead=true;
 assert.equal((await call('GET')).code,503);
 assert.equal((await call('POST',{key:'ss_ga4_id',value:'bad'},'editor')).code,503);
 assert.equal(JSON.stringify(data),before);assert.equal(writes,1);
});
test('only the newest portal owns save/unlock; field bindings and settings keys stay aligned',()=>{
 const html=fs.readFileSync(require.resolve('../Design_Reference.html'),'utf8');
 assert.doesNotMatch(html,/window\.(saveAdminPortal|unlockAdminPortal)\s*=\s*(function|wrapped)/);
 assert.doesNotMatch(html,/<script id="ss-admin-portal-(clean-final-repair|failsafe-patch|deduped-stability-patch)"/);
 assert.match(html,/window.PAGE_EDITOR_BINDINGS = PAGE_EDITOR_BINDINGS/);
 const b=bridge(async()=>response({}));
 assert.deepEqual(Array.from(b.ss.settingsKeys),require('../api/_lib/settings-keys.json'));
});
