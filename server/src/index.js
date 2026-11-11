import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z, ZodError } from 'zod';
import multer from 'multer';
import sanitizeHtml from 'sanitize-html';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const app=express(),db=new PrismaClient(),__dirname=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||4000),prod=process.env.NODE_ENV==='production';
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32||process.env.JWT_SECRET.includes('REPLACE_WITH'))throw Error('JWT_SECRET must be at least 32 characters. Configure server/.env');
app.disable('x-powered-by');app.set('trust proxy',prod?1:false);
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'},contentSecurityPolicy:false}));
app.use(cors({origin:process.env.CLIENT_ORIGIN||'http://localhost:5173',credentials:true}));
app.use(express.json({limit:'1mb'}));app.use(cookieParser());
const safeBody=sanitize=>sanitizeHtml(sanitize||'',{allowedTags:['p','br','h1','h2','h3','h4','strong','em','b','i','u','ul','ol','li','blockquote','a','hr','table','thead','tbody','tr','td','th'],allowedAttributes:{a:['href','target','rel']},allowedSchemes:['http','https','mailto']});
const originCheck=(req,res,next)=>{if(['POST','PUT','PATCH','DELETE'].includes(req.method)&&req.headers.origin&&req.headers.origin!==process.env.CLIENT_ORIGIN){return res.status(403).json({error:'Origin not allowed'})}next()};
app.use(originCheck);
const loginLimiter=rateLimit({windowMs:15*60*1000,limit:15,standardHeaders:'draft-7',legacyHeaders:false});
const inquiryLimiter=rateLimit({windowMs:60*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false});
const publicLimiter=rateLimit({windowMs:60*1000,limit:120,standardHeaders:'draft-7',legacyHeaders:false});
function csrf(req,res,next){if(!['POST','PUT','PATCH','DELETE'].includes(req.method)||req.path==='/api/auth/login'||req.path==='/api/public/contact'||req.path==='/api/public/visit')return next();const cookie=req.cookies['cssr_csrf'],header=req.get('x-csrf-token');if(!cookie||!header||cookie.length!==header.length||!crypto.timingSafeEqual(Buffer.from(cookie),Buffer.from(header)))return res.status(403).json({error:'Invalid security token. Refresh the page.'});next()}
app.use(csrf);
const cookieOptions={httpOnly:true,sameSite:'lax',secure:prod||process.env.COOKIE_SECURE==='true',path:'/'};
const session=(req,res,next)=>{try{const token=req.cookies.cssr_session;if(!token)return res.status(401).json({error:'Please sign in'});req.claim=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']});next()}catch{return res.status(401).json({error:'Session expired. Please sign in again.'})}};
const permissionsOf=user=>(user?.roles||[]).flatMap(x=>x.role.permissions.map(r=>r.permission.key));
async function current(req,res,next){const user=await db.user.findUnique({where:{id:req.claim.sub},include:{roles:{include:{role:{include:{permissions:{include:{permission:true}}}}}}}});if(!user||!user.active)return res.status(401).json({error:'Account disabled'});req.user=user;req.perms=new Set(permissionsOf(user));next()}
const requirePermission=key=>(req,res,next)=>req.perms.has(key)?next():res.status(403).json({error:`Permission required: ${key}`});
const protect=[session,current];
const asyncRoute=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const pageInclude={translations:true};const blogInclude={translations:true};
const tr=(item,lang)=>item?.translations?.find(t=>t.locale===lang)||item?.translations?.find(t=>t.locale==='en')||item?.translations?.[0]||{};
const fmt=(item,lang)=>({...item,...tr(item,lang),translations:undefined});
const menuTree=(items,parent=null,seen=new Set())=>items.filter(x=>(x.parentId||null)===parent&&!seen.has(x.id)).sort((a,b)=>a.sortOrder-b.sortOrder).map(x=>({...x,children:menuTree(items,x.id,new Set([...seen,x.id]))}));
const getSettings=async()=>Object.fromEntries((await db.siteSetting.findMany()).map(x=>[x.key,x.value]));
async function audit(req,action,entity,entityId){await db.auditLog.create({data:{userId:req.user.id,action,entity,entityId:String(entityId||'')}})}
app.get('/api/health',async(_req,res)=>{
  try{
    await db.$queryRaw`SELECT 1`;
    res.json({ok:true,service:'cssr-api',database:'connected'});
  }catch(error){
    console.error('Database health check failed:',error);
    res.status(503).json({ok:false,service:'cssr-api',database:'unavailable'});
  }
});
app.get('/api/auth/csrf',(_req,res)=>{const key=crypto.randomBytes(32).toString('hex');res.cookie('cssr_csrf',key,{httpOnly:false,sameSite:'lax',secure:prod||process.env.COOKIE_SECURE==='true',path:'/'}).json({csrf:key})});
app.post('/api/auth/login',loginLimiter,asyncRoute(async(req,res)=>{
  const {email,password}=z.object({email:z.string().email(),password:z.string().min(1)}).parse(req.body);
  const user=await db.user.findUnique({where:{email:email.trim().toLowerCase()},include:{roles:{include:{role:{include:{permissions:{include:{permission:true}}}}}}}});
  if(!user||!user.active||!(await bcrypt.compare(password,user.passwordHash)))return res.status(401).json({error:'Invalid email or password'});
  const token=jwt.sign({sub:user.id},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:'8h'});
  res.cookie('cssr_session',token,{...cookieOptions,maxAge:8*3600*1000}).json({id:user.id,name:user.name,email:user.email,permissions:permissionsOf(user),roles:user.roles.map(r=>r.role.name)});
}));
app.get('/api/auth/me',protect,asyncRoute(async(req,res)=>res.json({id:req.user.id,name:req.user.name,email:req.user.email,roles:req.user.roles.map(r=>r.role.name),permissions:[...req.perms]})));
app.post('/api/auth/logout',(_req,res)=>{res.clearCookie('cssr_session',cookieOptions).json({ok:true})});
app.use('/api/public',publicLimiter);
app.get('/api/public/site',asyncRoute(async(_req,res)=>res.json({settings:await getSettings(),menus:menuTree(await db.menuItem.findMany({where:{visible:true}})),slides:await db.homeSlide.findMany({where:{active:true},orderBy:{sortOrder:'asc'}})})));
app.get('/api/public/pages',asyncRoute(async(req,res)=>res.json((await db.page.findMany({where:{status:'PUBLISHED'},include:pageInclude,orderBy:{sortOrder:'asc'}})).map(x=>fmt(x,req.query.lang||'en')))));
app.get('/api/public/page/*',asyncRoute(async(req,res)=>{const slug=req.params[0];const p=await db.page.findUnique({where:{slug,status:'PUBLISHED'},include:pageInclude});if(!p)return res.status(404).json({error:'Page not found or not published'});res.json(fmt(p,req.query.lang||'en'))}));
app.get('/api/public/blogs',asyncRoute(async(req,res)=>{const items=await db.blog.findMany({where:{status:'PUBLISHED'},include:blogInclude,orderBy:{publishedAt:'desc'}});res.json(items.map(x=>fmt(x,req.query.lang||'en')))}));
app.get('/api/public/blog/:slug',asyncRoute(async(req,res)=>{const x=await db.blog.findUnique({where:{slug:req.params.slug,status:'PUBLISHED'},include:blogInclude});if(!x)return res.status(404).json({error:'Article not found'});res.json(fmt(x,req.query.lang||'en'))}));
app.get('/api/public/search',asyncRoute(async(req,res)=>{const q=String(req.query.q||'').trim().slice(0,80);if(q.length<2)return res.json([]);const [pages,blogs]=await Promise.all([db.page.findMany({where:{status:'PUBLISHED',OR:[{slug:{contains:q}},{translations:{some:{title:{contains:q}}}}]},include:pageInclude,take:20}),db.blog.findMany({where:{status:'PUBLISHED',OR:[{slug:{contains:q}},{translations:{some:{title:{contains:q}}}}]},include:blogInclude,take:20})]);res.json([...pages.map(p=>({title:tr(p,req.query.lang).title,url:`/${p.slug}`,type:'Page'})),...blogs.map(p=>({title:tr(p,req.query.lang).title,url:`/blog/${p.slug}`,type:'Blog'}))])}));
app.post('/api/public/contact',inquiryLimiter,asyncRoute(async(req,res)=>{const d=z.object({name:z.string().trim().min(2).max(100),email:z.string().trim().email().max(200),subject:z.string().trim().min(3).max(180),message:z.string().trim().min(10).max(5000),website:z.string().optional()}).parse(req.body);if(d.website)return res.status(200).json({ok:true});await db.inquiry.create({data:{name:d.name,email:d.email,subject:d.subject,message:d.message}});res.status(201).json({ok:true,message:'Your message has been received.'})}));
app.post('/api/public/visit',asyncRoute(async(_req,res)=>{const d=new Date();const date=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));await db.dailyVisit.upsert({where:{date},create:{date,views:1},update:{views:{increment:1}}});res.json({ok:true})}));
app.get('/api/admin/dashboard',...protect,requirePermission('dashboard.read'),asyncRoute(async(_req,res)=>{const [pages,blogs,inquiries,users,visits,logs]=await Promise.all([db.page.count(),db.blog.count(),db.inquiry.count(),db.user.count(),db.dailyVisit.findMany({orderBy:{date:'desc'},take:30}),db.auditLog.findMany({orderBy:{createdAt:'desc'},take:8,include:{user:{select:{name:true}}}})]);res.json({stats:{pages,blogs,inquiries,users},visits:visits.reverse(),logs})}));
app.get('/api/admin/reports',...protect,requirePermission('reports.read'),asyncRoute(async(_req,res)=>{const [views,content,inquiryStatuses]=await Promise.all([db.dailyVisit.findMany({orderBy:{date:'desc'},take:90}),db.page.groupBy({by:['status'],_count:{_all:true}}),db.inquiry.groupBy({by:['status'],_count:{_all:true}})]);res.json({views,content,inquiryStatuses})}));
const collection={pages:{model:'page',include:pageInclude,read:'pages.read',write:'pages.write'},blogs:{model:'blog',include:blogInclude,read:'blogs.read',write:'blogs.write'},menus:{model:'menuItem',read:'menus.read',write:'menus.write'},slides:{model:'homeSlide',read:'slides.read',write:'slides.write'},inquiries:{model:'inquiry',read:'inquiries.read',write:'inquiries.write'},media:{model:'media',read:'media.read',write:'media.write'},permissions:{model:'permission',read:'permissions.read',write:'permissions.write'},settings:{model:'siteSetting',read:'settings.read',write:'settings.write'},users:{model:'user',read:'users.read',write:'users.write'},roles:{model:'role',read:'roles.read',write:'roles.write'}};
const userSelect={id:true,name:true,email:true,active:true,createdAt:true,roles:{include:{role:true}}};
const roleInclude={permissions:{include:{permission:true}},users:true};
function normalize(resName,raw){const d={...raw};delete d.id;delete d.createdAt;delete d.updatedAt;
  const fields={pages:['slug','section','status','imageUrl','sortOrder'],blogs:['slug','category','status','imageUrl','publishedAt'],menus:['label','href','parentId','sortOrder','visible'],slides:['title','subtitle','imageUrl','buttonText','buttonHref','sortOrder','active'],inquiries:['status'],permissions:['key','description'],settings:['key','value'],users:['name','email','active'],roles:['name','description']};
  const obj=Object.fromEntries(fields[resName].filter(k=>d[k]!==undefined).map(k=>[k,d[k]]));
  if(obj.slug)obj.slug=z.string().regex(/^[a-z0-9][a-z0-9/_-]*$/).max(160).parse(obj.slug);
  if(obj.email)obj.email=z.string().email().max(200).parse(obj.email.trim().toLowerCase());
  if(obj.publishedAt)obj.publishedAt=new Date(obj.publishedAt);
  if(obj.sortOrder!==undefined)obj.sortOrder=Number(obj.sortOrder)||0;
  for(let key of ['active','visible'])if(obj[key]!==undefined)obj[key]=Boolean(obj[key]);
  if(obj.status && !['DRAFT','PUBLISHED','ARCHIVED','NEW','READ','RESOLVED'].includes(obj.status))throw Error('Invalid status');
  if(resName==='menus'&&obj.parentId==='')obj.parentId=null;
  return obj;
}
app.get('/api/admin/:resource',...protect,asyncRoute(async(req,res)=>{const {resource}=req.params,r=collection[resource];if(!r)return res.status(404).json({error:'Unknown resource'});if(!req.perms.has(r.read))return res.status(403).json({error:'Insufficient permission'});
  const orderByField=resource==='inquiries'||resource==='media'?'createdAt':resource==='pages'?'sortOrder':resource==='blogs'?'createdAt':'sortOrder';
  let data=await db[r.model].findMany({...(r.include?{include:r.include}:{}),...(resource==='users'?{select:userSelect}:{}),...(resource==='roles'?{include:roleInclude}:{}),...(!['permissions','settings','roles','users'].includes(resource)?{orderBy:{[orderByField]:'asc'}}:{})});
  res.json(data);
}));
app.post('/api/admin/:resource',...protect,asyncRoute(async(req,res)=>{const {resource}=req.params,r=collection[resource];if(!r)return res.status(404).json({error:'Unknown resource'});if(!req.perms.has(r.write))return res.status(403).json({error:'Insufficient permission'});
  if(['inquiries','media'].includes(resource))return res.status(405).json({error:'Creation not allowed here'});
  let d=normalize(resource,req.body),item;
  if(['pages','blogs'].includes(resource)){
    const t=req.body.translations?.length?req.body.translations:[{locale:'en',title:req.body.title||d.slug,body:req.body.body||'',summary:req.body.summary||'',excerpt:req.body.excerpt||''}];
    const translations=t.map(x=>({locale:String(x.locale||'en').slice(0,8),title:String(x.title||'').slice(0,300),...(resource==='pages'?{summary:String(x.summary||''),body:safeBody(x.body)}:{excerpt:String(x.excerpt||''),body:safeBody(x.body)})}));
    item=await db[r.model].create({data:{...d,translations:{create:translations}},include:r.include});
  }else if(resource==='users'){
    const password=z.string().min(12).max(128).parse(req.body.password);
    const roleIds=z.array(z.string()).default([]).parse(req.body.roleIds||[]);
    item=await db.user.create({data:{...d,passwordHash:await bcrypt.hash(password,12),roles:{create:roleIds.map(roleId=>({role:{connect:{id:roleId}}}))}},select:userSelect});
  }else if(resource==='roles'){item=await db.role.create({data:{...d,permissions:{create:(req.body.permissionIds||[]).map(permissionId=>({permission:{connect:{id:permissionId}}}))}},include:roleInclude});}
  else item=await db[r.model].create({data:d});
  await audit(req,'create',resource,item.id||item.key);res.status(201).json(item);
}));
app.put('/api/admin/:resource/:id',...protect,asyncRoute(async(req,res)=>{const {resource,id}=req.params,r=collection[resource];if(!r)return res.status(404).json({error:'Unknown resource'});if(!req.perms.has(r.write))return res.status(403).json({error:'Insufficient permission'});
  let d=normalize(resource,req.body),item;
  const where=resource==='settings'?{key:id}:resource==='permissions'?{id}: {id};
  if(['pages','blogs'].includes(resource)){
    if(req.body.translations){d.translations={deleteMany:{},create:req.body.translations.map(x=>({...resource==='pages'?{summary:String(x.summary||'')}: {excerpt:String(x.excerpt||'')},locale:String(x.locale||'en'),title:String(x.title||''),body:safeBody(x.body)}))}};
    item=await db[r.model].update({where,data:d,include:r.include});
  }else if(resource==='users'){
    if(req.body.password){d.passwordHash=await bcrypt.hash(z.string().min(12).parse(req.body.password),12)}
    if(req.body.roleIds){d.roles={deleteMany:{},create:req.body.roleIds.map(roleId=>({role:{connect:{id:roleId}}}))}}
    item=await db.user.update({where,data:d,select:userSelect});
  }else if(resource==='roles'){
    if(req.body.permissionIds)d.permissions={deleteMany:{},create:req.body.permissionIds.map(permissionId=>({permission:{connect:{id:permissionId}}}))};
    item=await db.role.update({where,data:d,include:roleInclude});
  }else item=await db[r.model].update({where,data:d});
  await audit(req,'update',resource,id);res.json(item);
}));
app.delete('/api/admin/:resource/:id',...protect,asyncRoute(async(req,res)=>{const {resource,id}=req.params,r=collection[resource];if(!r)return res.status(404).json({error:'Unknown resource'});const k=resource+'.delete';if(!req.perms.has(k))return res.status(403).json({error:`Permission required: ${k}`});if(resource==='users'&&id===req.user.id)return res.status(400).json({error:'Cannot delete your own account'});
  await db[r.model].delete({where:resource==='settings'?{key:id}:{id}});await audit(req,'delete',resource,id);res.json({ok:true});
}));
// Store media locally. Deployment should use durable object storage for multiple replicas.
const uploadDir=path.resolve(__dirname,'../uploads');fs.mkdirSync(uploadDir,{recursive:true});
const upload=multer({storage:multer.diskStorage({destination:uploadDir,filename:(_req,file,cb)=>cb(null,crypto.randomUUID()+path.extname(file.originalname).toLowerCase())}),limits:{fileSize:5*1024*1024,files:1},fileFilter:(_req,file,cb)=>cb(null,['image/jpeg','image/png','image/webp','application/pdf'].includes(file.mimetype))});
app.use('/uploads',express.static(uploadDir,{index:false,maxAge:'1d',setHeaders:(res,file)=>{if(file.endsWith('.pdf'))res.setHeader('Content-Disposition','attachment')}}));
app.post('/api/admin/media/upload',...protect,requirePermission('media.write'),upload.single('file'),asyncRoute(async(req,res)=>{if(!req.file)return res.status(400).json({error:'Please choose a PNG, JPG, WEBP or PDF under 5 MB'});const x=await db.media.create({data:{filename:req.file.originalname,url:'/uploads/'+req.file.filename,mime:req.file.mimetype,size:req.file.size}});await audit(req,'upload','media',x.id);res.status(201).json(x)}));
// API error handler with sanitized messages
app.use((err,req,res,_next)=>{console.error('API error:',err);if(err instanceof ZodError)return res.status(400).json({error:err.issues.map(x=>x.path.join('.')+': '+x.message).join('; ')});if(err.code==='P2002')return res.status(409).json({error:'This value already exists.'});if(err.code==='P2025')return res.status(404).json({error:'Record not found'});if(err instanceof multer.MulterError)return res.status(400).json({error:err.message});if(err.message==='Invalid status')return res.status(400).json({error:err.message});return res.status(500).json({error:'The request could not be completed.'})});
app.listen(port,()=>console.log(`CSSR API available at http://localhost:${port}`));
