import { apps } from './application-links'
import { familyRequest } from './family-auth'
import type { Universe,Plaque } from '@/src/data/beerRoadData'
import type { MediaResource } from './media-library'
import type { CommunityPost,FamilyEvent } from './family-api'
export type ResourceResult={kind:'media'|'post'|'event';universe:Universe;section:string;title:string;description:string;payload:MediaResource|CommunityPost|FamilyEvent}
export const normalizeSearch=(value:string)=>value.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/œ/g,'o').replace(/æ/g,'a').replace(/[^\p{L}\p{N}\s]/gu,' ')
export function matchesSearch(text:string,query:string){const normalized=normalizeSearch(query).trim();return !!normalized && normalized.split(/\s+/).every(word=>normalizeSearch(text).includes(word))}
export function plaqueSearchText(plaque:Plaque){return [plaque.name,plaque.tagline,plaque.universe,JSON.stringify(plaque.content),plaque.universe==='atelier'?apps.map(a=>`${a.name} ${a.description}`).join(' '):''].join(' ')}
export async function searchResources(query:string,offset=0){
 if(query.trim().length<2)return {items:[] as ResourceResult[],more:false}
 const rows=await familyRequest<ResourceResult[]>('/rest/v1/rpc/search_beer_resources',{method:'POST',body:JSON.stringify({search_query:query.trim().slice(0,160),search_offset:offset})})
 return {items:rows.slice(0,30),more:rows.length>30}
}
