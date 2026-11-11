import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
const db = new PrismaClient();
const read = n => readFileSync(new URL(`./${n}.txt`,import.meta.url),'utf8').replace(/^###.*\n/gm,'').replace(/^Attachment\.png\s*$/gm,'').trim();
const esc = s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const html = text => text.replaceAll('\\xa0',' ').split(/\n+/).map(s=>s.trim()).filter(Boolean).map(p=>/^[A-Z][A-Z .&:'’-]{5,}$/.test(p)?`<h2>${esc(p)}</h2>`:`<p>${esc(p).replaceAll('\n','<br>')}</p>`).join('\n');
const extract = (src,start,end) => {let a=src.indexOf(start);if(a<0)return '';let b=end?src.indexOf(end,a+start.length):-1;return src.slice(a,b<0?undefined:b).trim()};
const perm = ['dashboard.read','pages.read','pages.write','pages.delete','blogs.read','blogs.write','blogs.delete','menus.read','menus.write','menus.delete','slides.read','slides.write','slides.delete','users.read','users.write','users.delete','roles.read','roles.write','roles.delete','permissions.read','permissions.write','inquiries.read','inquiries.write','inquiries.delete','settings.read','settings.write','media.read','media.write','media.delete','reports.read'];
async function main(){
  for(const key of perm) await db.permission.upsert({where:{key},create:{key,description:key.replace('.',' · ')},update:{}});
  const p=await db.permission.findMany();
  const roleMap={ 'Super Admin':perm, 'Content Editor':['dashboard.read','pages.read','pages.write','blogs.read','blogs.write','menus.read','media.read','media.write','slides.read','slides.write'], 'Blog Author':['dashboard.read','blogs.read','blogs.write','media.read','media.write'], 'Viewer':['dashboard.read','pages.read','blogs.read','inquiries.read','reports.read']};
  for(const [name,keys] of Object.entries(roleMap)){
    const role=await db.role.upsert({where:{name},create:{name,description:`${name} access`},update:{}});
    await db.rolePermission.deleteMany({where:{roleId:role.id}});
    await db.rolePermission.createMany({data:p.filter(x=>keys.includes(x.key)).map(x=>({roleId:role.id,permissionId:x.id}))});
  }
  const email=process.env.ADMIN_EMAIL,pass=process.env.ADMIN_PASSWORD;
  if(!email||!pass||pass.includes('CHANGE_THIS')||pass.length<12){throw Error('Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of 12+ characters in server/.env before seeding.');}
  const admin=await db.user.upsert({where:{email},create:{email,name:'Site Administrator',passwordHash:await bcrypt.hash(pass,12)},update:{}});
  const superRole=await db.role.findUnique({where:{name:'Super Admin'}});
  await db.userRole.upsert({where:{userId_roleId:{userId:admin.id,roleId:superRole.id}},create:{userId:admin.id,roleId:superRole.id},update:{}});
  const content=[
    ['about','About Us','About','Our community and mission.','', 'PUBLISHED'],
    ['about/vision-mission','Vision & Mission','About','The vision and mission of the Redemptorists Bangalore Province.','<p>Content awaiting approved Vision and Mission statement.</p>','DRAFT'],
    ['about/what-we-do','What We Do','About','Apostolic ministry, parish missions, retreats and social service.',html(read('about-what-we-do')),'PUBLISHED'],
    ['about/history','History','About','The origin and growth of the Congregation and Bangalore Province.',html(read('history')),'PUBLISHED'],
    ['saints','Saints & Blesseds','Saints','The saints of the Redemptorist tradition.','<p>Discover the lives and witness of Redemptorist saints.</p>','PUBLISHED'],
    ['saints/st-alphonsus','St. Alphonsus Liguori','Saints','Founder of the Congregation of the Most Holy Redeemer.',html(extract(read('saint'),'St. Alphonsus Liguori','B. St. Gerard Majella')),'PUBLISHED'],
    ['saints/st-gerard','St. Gerard Majella','Saints','Redemptorist brother and patron of mothers.',html(extract(read('saint'),'B. St. Gerard Majella','C. "https://')),'PUBLISHED'],
    ['saints/st-clement','St. Clement Hofbauer','Saints','A missionary who helped spread the Redemptorists across Europe.',html(extract(read('saint'),'C. "https://','D. "https://')),'PUBLISHED'],
    ['saints/st-john-neumann','St. John Neumann','Saints','Redemptorist bishop and missionary.',html(extract(read('saint'),'D. "https://','\nE. ')),'PUBLISHED'],
    ['saints/blesseds','Blesseds','Saints','Blessed members of the Redemptorist tradition.','<p>Approved biographies can be added here from the CMS.</p>','DRAFT'],
    ['parish','Parish','Parish','Parish missions and ministry.','<p>Parish directory pending approved information.</p>','DRAFT'],
    ['communities','Communities','Communities','Our communities and ministries.','<p>Community directory pending approved information.</p>','DRAFT'],
    ['prayer','Prayer','Prayer','Prayer and devotions.','<p>Explore the prayer resources available through this province.</p>','PUBLISHED'],
    ['prayer/st-alphonsus-meditation',"St. Alphonsus’ Meditation",'Prayer','An introduction to prayer and reflection.',html(extract(read('prayer'),"ALPHONSUS' MEDITATION","ST. GERARD'S PRAYERS")),'PUBLISHED'],
    ['prayer/st-gerards-story',"Saint Gerard’s Story & Prayers",'Prayer','Prayers and devotions to Saint Gerard.',html(extract(read('prayer'),"ST. GERARD'S PRAYERS","MOTHER OF PERPETUAL HELP")),'PUBLISHED'],
    ['prayer/mother-of-perpetual-help','Mother of Perpetual Help','Prayer','History and devotions of the icon.',html(extract(read('prayer'),'MOTHER OF PERPETUAL HELP')),'PUBLISHED'],
    ['join-us','Join Us','Join Us','Discover vocation and participation opportunities.',html(read('joinUs')),'PUBLISHED'],
    ['donation','Donation','Donation','Support the mission.','<p>Donation details must be approved before publication. No payment gateway is configured.</p>','DRAFT']
  ];
  for(const [slug,title,section,summary,body,status] of content){
    await db.page.upsert({where:{slug},update:{},create:{slug,section,status,translations:{create:{locale:'en',title,summary,body}}}});
  }
  const menus=[
    ['Home','/',null], ['About','/about',null], ['Saints & Blesseds','/saints',null], ['Parish','/parish',null], ['Communities','/communities',null], ['Prayer','/prayer',null], ['Join Us','/join-us',null], ['Donation','/donation',null], ['Contact','/contact',null], ['Blog','/blog',null]
  ];
  if((await db.menuItem.count())===0){
    const ids={};for(let i=0;i<menus.length;i++){let [label,href]=menus[i]; const x=await db.menuItem.create({data:{label,href,sortOrder:i*10}});ids[label]=x.id;}
    const child=[['About','Vision & Mission','/about/vision-mission'],['About','What We Do','/about/what-we-do'],['About','History','/about/history'],['Saints & Blesseds','St. Alphonsus Liguori','/saints/st-alphonsus'],['Saints & Blesseds','St. Gerard Majella','/saints/st-gerard'],['Saints & Blesseds','St. Clement Hofbauer','/saints/st-clement'],['Saints & Blesseds','St. John Neumann','/saints/st-john-neumann'],['Saints & Blesseds','Blesseds','/saints/blesseds'],['Prayer',"St. Alphonsus’ Meditation",'/prayer/st-alphonsus-meditation'],['Prayer',"Saint Gerard’s Story",'/prayer/st-gerards-story'],['Prayer','Mother of Perpetual Help','/prayer/mother-of-perpetual-help']];
    for(let i=0;i<child.length;i++){let [p,label,href]=child[i];await db.menuItem.create({data:{parentId:ids[p],label,href,sortOrder:i*10}});}
  }
  const settings={brandName:'CSSR.IN',tagline:'Redemptorists Bangalore Province',email:'',phone:'',address:'Bengaluru, Karnataka, India',logoUrl:'/assets/images/cssr-logo.png',mapEmbedUrl:'',footerText:'A community of faith. A mission of hope.',defaultLanguage:'en',enabledLanguages:'en,hi,kn'};
  for(const [key,value] of Object.entries(settings))await db.siteSetting.upsert({where:{key},create:{key,value},update:{}});
  if((await db.homeSlide.count())===0){await db.homeSlide.create({data:{title:'A community of faith.\nA mission of hope.',subtitle:'Discover the missions, communities and people of the Redemptorists Bangalore Province.',imageUrl:'/assets/images/hero-mockup-matched.jpg',sortOrder:0}});await db.homeSlide.create({data:{title:'Rooted in community.\nConnected in mission.',subtitle:'Proclaiming the Good News with compassion, prayer, and service.',imageUrl:'/assets/images/community-original.jpg',sortOrder:1}});}
  console.log(`Seeded ${content.length} pages, ${menus.length} main menus, permissions and admin account.`);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>db.$disconnect());
