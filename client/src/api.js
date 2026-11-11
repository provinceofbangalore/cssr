let csrfToken='';
export async function api(endpoint,options={}){
 const method=options.method||'GET';
 if(method!=='GET'&&!csrfToken){const response=await fetch('/api/auth/csrf',{credentials:'include'});if(response.ok)csrfToken=(await response.json()).csrf;}
 const headers={...(options.body instanceof FormData?{}:{'Content-Type':'application/json'}),...(method!=='GET'?{'X-CSRF-Token':csrfToken}:{}),...(options.headers||{})};
 let response=await fetch(`/api${endpoint}`,{...options,credentials:'include',headers,body:options.body instanceof FormData?options.body:(options.body!==undefined?JSON.stringify(options.body):undefined)});
 if(response.status===403 && method!=='GET'){const text=await response.clone().json().catch(()=>({}));if((text.error||'').includes('security token')){csrfToken='';const r=await fetch('/api/auth/csrf',{credentials:'include'});csrfToken=(await r.json()).csrf;response=await fetch(`/api${endpoint}`,{...options,credentials:'include',headers:{...headers,'X-CSRF-Token':csrfToken},body:options.body instanceof FormData?options.body:(options.body!==undefined?JSON.stringify(options.body):undefined)})}}
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Request failed (${response.status})`);return data;
}
export const asset=url=>url||'/assets/images/church-hero.jpg';
export const slugify=s=>s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-');
