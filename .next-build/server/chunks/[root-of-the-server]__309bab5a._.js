module.exports=[2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},50227,(e,t,r)=>{t.exports=e.x("node:path",()=>require("node:path"))},44376,(e,t,r)=>{t.exports=e.x("node:module",()=>require("node:module"))},51857,e=>{"use strict";var t=e.i(2157),r=e.i(50227),a=e.i(44376);let n=null,i=`
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age_appearance TEXT NOT NULL DEFAULT '',
  background TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT '',
  speaking_style TEXT NOT NULL DEFAULT '',
  catchphrase TEXT NOT NULL DEFAULT '',
  current_location TEXT NOT NULL DEFAULT '',
  current_status TEXT NOT NULL DEFAULT '',
  default_inject INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_name ON characters(name);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plotlines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rule TEXT NOT NULL DEFAULT '',
  trigger TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'untriggered',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deprecated (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;async function s(){var e;if(n)return n;let s=r.default.join(process.cwd(),"data","bible.sqlite");e=r.default.dirname(s),t.default.existsSync(e)||t.default.mkdirSync(e,{recursive:!0});let{DatabaseSync:o}=(0,a.createRequire)(r.default.join(process.cwd(),"package.json"))("node:sqlite"),d=new o(s);d.exec("PRAGMA journal_mode = WAL;"),d.exec("PRAGMA foreign_keys = ON;"),d.exec(i);let l=new Date().toISOString();return d.prepare(`INSERT OR IGNORE INTO characters(id,name,default_inject,locked,created_at,updated_at)
     VALUES('li_yi','李弈',1,1,?,?);`).run(l,l),d.prepare("UPDATE characters SET default_inject=1, locked=1, updated_at=? WHERE id='li_yi';").run(l),n=d,d}e.s(["getDb",()=>s])},28096,e=>{"use strict";function t(e,t){return Response.json(e,{headers:{"Cache-Control":"no-store"},...t})}function r(e){return new URL(e).searchParams.get("id")}let a=e.i(78747).z.string().min(1);e.s(["IdSchema",0,a,"getIdFromUrl",()=>r,"json",()=>t])},56714,e=>{"use strict";var t=e.i(46821),r=e.i(73489),a=e.i(62184),n=e.i(14679),i=e.i(18903),s=e.i(22196),o=e.i(24e3),d=e.i(49439),l=e.i(10138),u=e.i(372),c=e.i(11032),p=e.i(9628),T=e.i(38596),E=e.i(21036),N=e.i(51298),L=e.i(93695);e.i(40077);var R=e.i(60191),h=e.i(78747),g=e.i(51857),U=e.i(28096);function x(e){return{id:String(e.id??""),name:String(e.name??""),content:String(e.content??""),reason:String(e.reason??""),createdAt:String(e.created_at??""),updatedAt:String(e.updated_at??"")}}let A=h.z.object({id:h.z.string().min(1).optional(),name:h.z.string().min(1),content:h.z.string().optional().default(""),reason:h.z.string().optional().default("")});async function O(){let e=(await (0,g.getDb)()).prepare("SELECT * FROM deprecated ORDER BY name ASC;").all();return(0,U.json)({data:e.map(x)})}async function m(e){let t=await e.json().catch(()=>null),r=A.safeParse(t);if(!r.success)return(0,U.json)({error:"Bad Request",details:r.error.flatten()},{status:400});let a=new Date().toISOString(),n=r.data,i=n.id||`d_${crypto.randomUUID()}`,s=await (0,g.getDb)();s.prepare(`INSERT INTO deprecated(id,name,content,reason,created_at,updated_at)
     VALUES(?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       content=excluded.content,
       reason=excluded.reason,
       updated_at=excluded.updated_at;`).run(i,n.name,n.content,n.reason,a,a);let o=s.prepare("SELECT * FROM deprecated WHERE id=?").get(i);return(0,U.json)({data:o?x(o):null})}async function f(e){let t=(0,U.getIdFromUrl)(e.url),r=U.IdSchema.safeParse(t);return r.success?((await (0,g.getDb)()).prepare("DELETE FROM deprecated WHERE id=?;").run(r.data),(0,U.json)({ok:!0})):(0,U.json)({error:"Missing id"},{status:400})}e.s(["DELETE",()=>f,"GET",()=>O,"POST",()=>m,"runtime",0,"nodejs"],30125);var v=e.i(30125);let S=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/bible/deprecated/route",pathname:"/api/bible/deprecated",filename:"route",bundlePath:""},distDir:".next-build",relativeProjectDir:"",resolvedPagePath:"[project]/novel-workshop/app/api/bible/deprecated/route.ts",nextConfigOutput:"",userland:v}),{workAsyncStorage:w,workUnitAsyncStorage:_,serverHooks:C}=S;function I(){return(0,a.patchFetch)({workAsyncStorage:w,workUnitAsyncStorage:_})}async function b(e,t,a){S.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let h="/api/bible/deprecated/route";h=h.replace(/\/index$/,"")||"/";let g=await S.prepare(e,t,{srcPage:h,multiZoneDraftMode:!1});if(!g)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:U,params:x,nextConfig:A,parsedUrl:O,isDraftMode:m,prerenderManifest:f,routerServerContext:v,isOnDemandRevalidate:w,revalidateOnlyGenerated:_,resolvedPathname:C,clientReferenceManifest:I,serverActionsManifest:b}=g,D=(0,o.normalizeAppPath)(h),y=!!(f.dynamicRoutes[D]||f.routes[C]),X=async()=>((null==v?void 0:v.render404)?await v.render404(e,t,O,!1):t.end("This page could not be found"),null);if(y&&!m){let e=!!f.routes[C],t=f.dynamicRoutes[D];if(t&&!1===t.fallback&&!e){if(A.experimental.adapterPath)return await X();throw new L.NoFallbackError}}let F=null;!y||S.isDev||m||(F="/index"===(F=C)?"/":F);let P=!0===S.isDev||!y,j=y&&!P;b&&I&&(0,s.setManifestsSingleton)({page:h,clientReferenceManifest:I,serverActionsManifest:b});let k=e.method||"GET",q=(0,i.getTracer)(),M=q.getActiveScopeSpan(),H={params:x,prerenderManifest:f,renderOpts:{experimental:{authInterrupts:!!A.experimental.authInterrupts},cacheComponents:!!A.cacheComponents,supportsDynamicResponse:P,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:A.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>S.onRequestError(e,t,a,n,v)},sharedContext:{buildId:U}},K=new d.NodeNextRequest(e),B=new d.NodeNextResponse(t),$=l.NextRequestAdapter.fromNodeNextRequest(K,(0,l.signalFromNodeResponse)(t));try{let s=async e=>S.handle($,H).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=q.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${k} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${k} ${h}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),d=async n=>{var i,d;let l=async({previousCacheEntry:r})=>{try{if(!o&&w&&_&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(n);e.fetchMetrics=H.renderOpts.fetchMetrics;let d=H.renderOpts.pendingWaitUntil;d&&a.waitUntil&&(a.waitUntil(d),d=void 0);let l=H.renderOpts.collectedTags;if(!y)return await (0,p.sendResponse)(K,B,i,H.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,T.toNodeOutgoingHttpHeaders)(i.headers);l&&(t[N.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==H.renderOpts.collectedRevalidate&&!(H.renderOpts.collectedRevalidate>=N.INFINITE_CACHE)&&H.renderOpts.collectedRevalidate,a=void 0===H.renderOpts.collectedExpire||H.renderOpts.collectedExpire>=N.INFINITE_CACHE?void 0:H.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await S.onRequestError(e,t,{routerKind:"App Router",routePath:h,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:w})},!1,v),t}},u=await S.handleResponse({req:e,nextConfig:A,cacheKey:F,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:f,isRoutePPREnabled:!1,isOnDemandRevalidate:w,revalidateOnlyGenerated:_,responseGenerator:l,waitUntil:a.waitUntil,isMinimalMode:o});if(!y)return null;if((null==u||null==(i=u.value)?void 0:i.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(d=u.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",w?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),m&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let L=(0,T.fromNodeOutgoingHttpHeaders)(u.value.headers);return o&&y||L.delete(N.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||L.get("Cache-Control")||L.set("Cache-Control",(0,E.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(K,B,new Response(u.value.body,{headers:L,status:u.value.status||200})),null};M?await d(M):await q.withPropagatedContext(e.headers,()=>q.trace(u.BaseServerSpan.handleRequest,{spanName:`${k} ${h}`,kind:i.SpanKind.SERVER,attributes:{"http.method":k,"http.target":e.url}},d))}catch(t){if(t instanceof L.NoFallbackError||await S.onRequestError(e,t,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:j,isOnDemandRevalidate:w})},!1,v),y)throw t;return await (0,p.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>b,"patchFetch",()=>I,"routeModule",()=>S,"serverHooks",()=>C,"workAsyncStorage",()=>w,"workUnitAsyncStorage",()=>_],56714)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__309bab5a._.js.map