/* Admin roles and permissions: runs the real API handlers against an in-memory store.
   Run with:  npm run test:admin   (needs no network and no environment variables) */
const Module=require('module');const crypto=require('crypto');
const store=new Map();
const blob={put:async(p,b)=>{store.set(p,Buffer.from(b));return{}},get:async p=>store.has(p)?{statusCode:200,stream:new Response(store.get(p)).body}:{statusCode:404},del:async p=>{store.delete(p)},list:async()=>({blobs:[]})};
const o=Module._load;Module._load=function(r,...a){return r==='@vercel/blob'?blob:o.call(this,r,...a)};
process.env.BLOB_READ_WRITE_TOKEN='x';process.env.JWT_SECRET='test-secret-test-secret-test-secret-12345';process.env.ADMIN_PASSCODE='TestCode123!';
process.env.OWNER_EMAIL='owner@example.com';process.env.OWNER_PASSWORD='OwnerPass123!';
const root=require('path').resolve(__dirname,'..')+'/';
const H={auth:require(root+'api/_handlers/auth'),inbox:require(root+'api/_handlers/inbox'),content:require(root+'api/_handlers/content'),stays:require(root+'api/_handlers/stays'),bookings:require(root+'api/_handlers/bookings')};
function call(h,method,url,body,token,ip){return new Promise(r=>{const res={headers:{},status(c){this.code=c;return this},json(x){r({code:this.code,body:x})},end(x){r({code:this.code,body:x})},setHeader(){}};
 H[h]({method,url,headers:{host:'www.sightseerscaribbean.com','x-forwarded-for':ip||'9.9.9.9',...(token?{authorization:'Bearer '+token}:{})},body:body||{},query:{}},res);});}
function totp(secret,t){const B='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret)bits+=B.indexOf(c).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));
 const msg=Buffer.alloc(8);msg.writeBigUInt64BE(BigInt(Math.floor((t||Date.now())/30000)));const h=crypto.createHmac('sha1',Buffer.from(bytes)).update(msg).digest();const off=h[h.length-1]&15;
 return String((((h[off]&127)<<24)|(h[off+1]<<16)|(h[off+2]<<8)|h[off+3])%1000000).padStart(6,'0');}
let fails=0;const ok=(name,cond,extra)=>{console.log((cond?'PASS ':'FAIL ')+name+(extra?'  '+extra:''));if(!cond)fails++;};
(async()=>{
 // owner signs in with the owner login
 let r=await call('auth','POST','/api/auth',{action:'signin',email:'owner@example.com',password:'OwnerPass123!'});const owner=r.body.token;ok('owner signs in',r.code===200&&r.body.user.role==='admin');
 ok('owner reaches inbox',(await call('inbox','GET','/api/inbox',{},owner)).code!==403);
 // invite a content editor
 r=await call('auth','POST','/api/auth',{action:'team-invite',name:'Marcus Hill',email:'marcus@example.com',preset:'content'},owner);ok('owner invites a content editor',r.code===200&&r.body.link.includes('invite=marcus%40example.com'),r.body.error||'');
 const code=new URL(r.body.link).searchParams.get('code');
 // staff cannot sign in before setting a password (random password), then sets one through the invite code
 r=await call('auth','POST','/api/auth',{action:'reset-password',email:'marcus@example.com',code,newPassword:'Marcus12345!'});ok('invited person sets a password',r.code===200&&r.body.user.role==='staff',r.body.error||'');
 const staff=r.body.token;
 ok('invite code stops working after use',(await call('auth','POST','/api/auth',{action:'reset-password',email:'marcus@example.com',code,newPassword:'Another12345!'})).code===400);
 // what a content editor can and cannot reach
 ok('content editor CAN reach pages (content)',(await call('content','POST','/api/content',{},staff)).code!==403);
 ok('content editor CAN reach catalog (stays)',(await call('stays','POST','/api/stays',{},staff)).code!==403);
 ok('content editor CANNOT read the inbox',(await call('inbox','GET','/api/inbox',{},staff)).code===403);
 ok('content editor CANNOT read all bookings',(await call('bookings','GET','/api/bookings',{},staff)).body.bookings!==undefined&&(await call('bookings','GET','/api/bookings',{},staff)).body.bookings.length===0);
 ok('content editor CANNOT manage the team',(await call('auth','POST','/api/auth',{action:'team-list'},staff)).code===403);
 ok('content editor CANNOT list accounts',(await call('auth','GET','/api/auth',{},staff)).code===403);
 // trips manager
 r=await call('auth','POST','/api/auth',{action:'team-invite',name:'Kim',email:'kim@example.com',preset:'trips'},owner);const kc=new URL(r.body.link).searchParams.get('code');
 r=await call('auth','POST','/api/auth',{action:'reset-password',email:'kim@example.com',code:kc,newPassword:'Kim12345678!'});const kim=r.body.token;
 ok('trips manager CAN read the inbox',(await call('inbox','GET','/api/inbox',{},kim)).code!==403);
 ok('trips manager CANNOT edit page content',(await call('content','POST','/api/content',{},kim)).code===403);
 // legacy passcode editor
 r=await call('auth','POST','/api/auth',{action:'passcode',passcode:'TestCode123!'});const pass=r.body.token;
 ok('old passcode still edits content',(await call('content','POST','/api/content',{},pass)).code!==403);
 ok('old passcode still cannot read the inbox',(await call('inbox','GET','/api/inbox',{},pass)).code===403);
 // a normal member
 r=await call('auth','POST','/api/auth',{action:'signup',name:'Guest',email:'g@example.com',password:'Guest12345!',adminCode:'TestCode123!'});const guest=r.body.token;
 ok('signup never makes an admin',r.body.user.role==='guest');
 ok('member cannot read the inbox',(await call('inbox','GET','/api/inbox',{},guest)).code===403);
 // switch a person off, change a role, remove
 const team=(await call('auth','POST','/api/auth',{action:'team-list'},owner)).body;ok('team list shows owner and 2 team members',team.team.length===3,JSON.stringify(team.team.map(t=>t.email+':'+t.role)));
 const marcusId=team.team.find(t=>t.email==='marcus@example.com').id;
 await call('auth','POST','/api/auth',{action:'team-update',id:marcusId,disabled:true},owner);
 ok('switched-off person is locked out at once',(await call('content','POST','/api/content',{},staff)).code===403);
 ok('switched-off person cannot sign in',(await call('auth','POST','/api/auth',{action:'signin',email:'marcus@example.com',password:'Marcus12345!'})).code===403);
 await call('auth','POST','/api/auth',{action:'team-update',id:marcusId,disabled:false,preset:'blog'},owner);
 ok('role change takes effect at once (blog writer loses pages)',(await call('content','POST','/api/content',{},staff)).code===403);
 await call('auth','POST','/api/auth',{action:'team-remove',id:marcusId},owner);
 ok('removed person has no access',(await call('stays','POST','/api/stays',{},staff)).code===403);
 // sign out everywhere (owner)
 r=await call('auth','POST','/api/auth',{action:'signout-all'},owner);const owner2=r.body.token;
 ok('old owner sign-in ends after "sign out everywhere"',(await call('inbox','GET','/api/inbox',{},owner)).code===403);
 ok('the new sign-in works',(await call('inbox','GET','/api/inbox',{},owner2)).code!==403);
 // two-step sign-in
 r=await call('auth','POST','/api/auth',{action:'2fa-setup'},owner2);const secret=r.body.secret;ok('2fa setup gives a secret',!!secret&&r.body.otpauth.startsWith('otpauth://totp/'));
 ok('2fa enable rejects a wrong code',(await call('auth','POST','/api/auth',{action:'2fa-enable',code:'000000'},owner2)).code===400);
 ok('2fa enable accepts the right code',(await call('auth','POST','/api/auth',{action:'2fa-enable',code:totp(secret)},owner2)).code===200);
 r=await call('auth','POST','/api/auth',{action:'signin',email:'owner@example.com',password:'OwnerPass123!'});ok('sign-in now asks for the code',r.code===401&&r.body.need2fa===true);
 r=await call('auth','POST','/api/auth',{action:'signin',email:'owner@example.com',password:'OwnerPass123!',code:'123456'});ok('wrong code is refused',r.code===401);
 r=await call('auth','POST','/api/auth',{action:'signin',email:'owner@example.com',password:'OwnerPass123!',code:totp(secret)});ok('right code signs in',r.code===200&&!!r.body.token);
 ok('the secret never leaves the server',!JSON.stringify(r.body).includes(secret)&&!('totpSecret' in r.body.user));
 const me=await call('auth','POST','/api/auth',{action:'me'},r.body.token);ok('me lists what the person may do',me.body.user.perms.length===5&&me.body.user.totpEnabled===true);
 console.log(fails?('\n'+fails+' FAILED'):'\nALL PASSED');
})().catch(e=>console.log('TEST ERROR',e.stack.split('\n').slice(0,5).join('\n')));
