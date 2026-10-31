import { familyRequest } from './family-auth'
export const apps=[{slug:'cookiwiki',name:'CookiWiki',description:'Nos recettes.'},{slug:'frosti',name:'Frosti',description:'Frigos et congélateurs.'},{slug:'cellio',name:'Cellio',description:'Placards et celliers.'},{slug:'mealio',name:'Mealio',description:'Menus, courses et stocks.'}]
export type ApplicationLink={slug:string;open_url:string|null;download_url:string|null}
export const listApplicationLinks=()=>familyRequest<ApplicationLink[]>('/rest/v1/application_links?select=slug,open_url,download_url')
export function safeAppUrl(value:string){
 if(!value.trim())return null
 const url=new URL(value.trim())
 if(url.protocol!=='https:'||url.username||url.password)throw new Error('Utilise une adresse HTTPS sans identifiants.')
 return url.href
}
export async function saveApplicationLinks(row:ApplicationLink){
 const data={open_url:safeAppUrl(row.open_url||''),download_url:safeAppUrl(row.download_url||'')}
 const rows=await familyRequest<ApplicationLink[]>(`/rest/v1/application_links?slug=eq.${encodeURIComponent(row.slug)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(data)})
 if(!rows[0])throw new Error('Modification refusée ou application absente.')
 return rows[0]
}
