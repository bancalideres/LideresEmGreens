const ORIGIN = "https://bancalideres.github.io";
const REPO = "bancalideres/LideresEmGreens";
const BRANCH = "main";

function json(data,status=200,headers={}) {
  return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers}});
}
function cors(request) {
  const origin=request.headers.get("Origin")||"";
  if(origin!==ORIGIN) return {};
  return {"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Methods":"GET,POST,PUT,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Authorization","Vary":"Origin"};
}
async function sign(payload,secret) {
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const sig=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function tokenFor(user,secret) {
  const payload=btoa(JSON.stringify({sub:user,exp:Date.now()+8*60*60*1000})).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  return payload+"."+await sign(payload,secret);
}
async function authorized(request,env) {
  const raw=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  const [payload,sig]=raw.split(".");
  if(!payload||!sig||sig!==await sign(payload,env.SESSION_SECRET))return false;
  try {const data=JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));return data.sub===env.ADMIN_USER&&data.exp>Date.now()}catch{return false}
}
async function github(path,env,method="GET",body) {
  const url="https://api.github.com/repos/"+REPO+"/contents/"+path;
  const r=await fetch(url,{method,headers:{"Authorization":"Bearer "+env.GITHUB_TOKEN,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"LideresEmGreens-Admin","Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error("GitHub "+r.status+": "+(data.message||"falha ao salvar"));
  return data;
}
async function readData(env) {
  const r=await fetch("https://raw.githubusercontent.com/"+REPO+"/"+BRANCH+"/dados.json?cache="+Date.now());
  if(!r.ok)throw new Error("Não foi possível ler dados.json");
  return await r.json();
}
async function writeFile(path,content,env,message) {
  let sha;
  try {sha=(await github(path,env)).sha}catch(e){if(!String(e).includes("404"))throw e}
  return await github(path,env,"PUT",{message,content,branch:BRANCH,...(sha?{sha}:{})});
}
export default {
 async fetch(request,env) {
  const headers=cors(request);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
  const url=new URL(request.url);
  try {
   if(url.pathname==="/api/login"&&request.method==="POST"){
    const body=await request.json();
    if(body.username!==env.ADMIN_USER||body.password!==env.ADMIN_PASSWORD)return json({error:"Usuário ou senha incorretos."},401,headers);
    return json({token:await tokenFor(env.ADMIN_USER,env.SESSION_SECRET)},200,headers);
   }
   if(url.pathname==="/api/data"&&request.method==="GET"){
    if(!await authorized(request,env))return json({error:"Não autorizado."},401,headers);
    return json(await readData(env),200,headers);
   }
   if(url.pathname==="/api/data"&&request.method==="PUT"){
    if(!await authorized(request,env))return json({error:"Não autorizado."},401,headers);
    const data=await request.json();
    if(!Array.isArray(data.galleries)||data.galleries.length>5) return json({error:"A galeria aceita até cinco publicações."},400,headers);
    await writeFile("dados.json",btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2)+"\n"))),env,"Atualizar conteúdo da central");
    return json({ok:true},200,headers);
   }
   if(url.pathname==="/api/image"&&request.method==="POST"){
    if(!await authorized(request,env))return json({error:"Não autorizado."},401,headers);
    const body=await request.json();
    if(typeof body.base64!=="string"||body.base64.length>7_000_000)return json({error:"Imagem inválida ou maior que o limite."},400,headers);
    const mime=String(body.mime||"image/jpeg");
    if(!["image/jpeg","image/png","image/webp"].includes(mime))return json({error:"Formato não permitido."},400,headers);
    const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[mime];
    const path="imagens/"+Date.now()+"."+ext;
    await writeFile(path,body.base64.replace(/^data:[^,]+,/,""),env,"Adicionar imagem de palpite");
    return json({ok:true,path},200,headers);
   }
   return json({error:"Rota não encontrada."},404,headers);
  } catch(e){return json({error:e.message||"Erro interno."},500,headers)}
 }
};