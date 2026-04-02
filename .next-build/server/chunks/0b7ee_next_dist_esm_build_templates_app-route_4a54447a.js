module.exports=[76855,e=>{"use strict";var t=e.i(46821),r=e.i(73489),a=e.i(62184),n=e.i(14679),o=e.i(18903),s=e.i(22196),i=e.i(24e3),l=e.i(49439),c=e.i(10138),u=e.i(372),d=e.i(11032),p=e.i(9628),h=e.i(38596),f=e.i(21036),m=e.i(51298),v=e.i(93695);e.i(40077);var g=e.i(60191),w=e.i(75179),R=e.i(2157);e.i(22523);var E=e.i(80567),y=e.i(77141),x=e.i(79904),C=e.i(75702),b=e.i(62118);async function S(t,r,a){let n=new Date().toISOString(),o=function(e,t){try{let r=(0,b.getProjectDataPath)(e,"knowledge","outline.json");if(!R.default.existsSync(r))return"";let a=JSON.parse(R.default.readFileSync(r,"utf-8")),n=a.volumes?.find(e=>e.volumeNum===t);if(!n||!n.chapters)return"";return n.chapters.sort((e,t)=>e.chapterNum-t.chapterNum).map(e=>{let t=e.rawContent||"";return`第${e.chapterNum}章《${e.title}》
${t}`}).join("\n\n---\n\n")}catch(e){return console.error("[factsExtractor] 读取卷章节失败:",e),""}}(t,r);if(!o)return{extractedFacts:{characters:{},techLines:{},factions:{},majorEvents:[],revealedInfo:[]},confidence:"high",warnings:["指定卷没有章节数据"],sourceVolume:r,timestamp:n};let s=function(t){try{let r=(0,b.getProjectDataPath)(t,"knowledge","bible.sqlite");if(!R.default.existsSync(r))return"";let a=new(e.r(94341))(r,{readonly:!0});if(!a.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().some(e=>"characters"===e.name))return a.close(),"";let n=a.prepare("SELECT * FROM characters ORDER BY createdAt").all();if(a.close(),0===n.length)return"";let o=["角色数据库："];for(let e of n)o.push(`【${e.name}】`),e.role&&o.push(`  角色：${e.role}`),e.currentStatus&&o.push(`  当前状态：${e.currentStatus}`),e.behaviorRules&&o.push(`  行为铁律：${e.behaviorRules}`);return o.join("\n")}catch(e){return console.error("[factsExtractor] 读取角色圣经失败:",e),""}}(t),i=function(e){try{let t=(0,b.getProjectDataPath)(e,"knowledge","worldbuilding.json");if(!R.default.existsSync(t))return"";let r=JSON.parse(R.default.readFileSync(t,"utf-8")),a=["世界观设定："];for(let e of[{key:"worldBackground",label:"世界背景"},{key:"powerSystem",label:"力量体系"},{key:"factions",label:"势力分布"},{key:"locations",label:"地点设定"},{key:"items",label:"物品设定"},{key:"rulesAndTaboos",label:"规则与禁忌"}]){let t=r[e.key];t&&"string"==typeof t&&t.trim()&&a.push(`${e.label}：${t.slice(0,200)}`)}return a.join("\n")}catch(e){return console.error("[factsExtractor] 读取世界观失败:",e),""}}(t),l=function(e){if(!e)return"（无现有事实）";let t=[],r=Object.entries(e.characters);if(r.length>0)for(let[e,a]of(t.push("已记录角色状态："),r))t.push(`  ${e}：${a.status}（卷${a.lastSeenVolume}第${a.lastSeenChapter}章）`);let a=Object.entries(e.techLines);if(a.length>0)for(let[e,r]of(t.push("已记录技术线："),a))t.push(`  ${e}：${r.currentVersion}（卷${r.asOfVolume}第${r.asOfChapter}章）`);if(e.majorEvents.length>0)for(let r of(t.push("已记录不可逆事件："),e.majorEvents))t.push(`  卷${r.volume}第${r.chapter}章：${r.event}`);if(e.revealedInfo.length>0)for(let r of(t.push("已记录揭示信息："),e.revealedInfo))t.push(`  卷${r.volume}第${r.chapter}章：${r.info}`);return t.join("\n")}(await (0,y.loadFacts)(t)),c=`你是一位严谨的小说编辑助手，负责从章节细纲中提取已确立的事实。

## 现有事实（已确认，不要重复提取）
${l}

## 本卷章节细纲（第${r}卷）
${o}

## 角色数据库
${s||"（无角色数据）"}

## 世界观设定
${i||"（无世界观数据）"}

## 任务

请从以上第${r}卷的细纲中，提取所有**新增的**已确立事实。只提取本卷新产生的事实，不要重复现有事实。

提取规则：
1. **角色状态变化**：只提取本卷中状态发生变化的角色（退场、死亡、被捕、身份变化等）。未变化的角色不要提取。
2. **技术线进展**：只提取本卷中版本有更新的技术线。未变化的不要提取。
3. **新增不可逆事件**：只提取本卷中发生的、不可撤销的重大事件。
4. **新增已揭示信息**：只提取本卷中首次向读者揭示的重要信息，这些信息在后续卷中不应再被当作伏笔处理。
5. **不确定的事实**：如果某个事实无法从细纲中明确判断（如不确定角色是否永久退场），在 warnings 中标注，不要猜测。

输出严格 JSON 格式（不要输出 markdown 代码块标记，不要输出任何解释文字）：
{
  "characters": {
    "角色名": {
      "status": "active/eliminated/exited/imprisoned/unknown",
      "lastSeenVolume": 数字,
      "lastSeenChapter": 数字,
      "exitReason": "原因或null",
      "cannotAppear": true/false,
      "knownConditions": ["条件1"],
      "note": "说明"
    }
  },
  "techLines": {
    "技术名": {
      "currentVersion": "版本",
      "asOfVolume": 数字,
      "asOfChapter": 数字,
      "progression": ["新增版本记录"],
      "rule": "规则"
    }
  },
  "factions": {},
  "majorEvents": [
    {
      "event": "事件描述",
      "volume": 数字,
      "chapter": 数字,
      "irreversible": true/false,
      "affectedCharacters": ["角色名"]
    }
  ],
  "revealedInfo": [
    {
      "info": "信息描述",
      "volume": 数字,
      "chapter": 数字,
      "note": "说明"
    }
  ],
  "confidence": "high/medium/low",
  "warnings": ["不确定项1", "不确定项2"]
}

如果本卷没有任何新增事实，输出空结构：{"characters":{},"techLines":{},"factions":{},"majorEvents":[],"revealedInfo":[],"confidence":"high","warnings":[]}`;try{let e=(0,x.getModelConfig)("事实提取"),t=a?.model||e.model,o=e.apiKey,s=e.baseUrl,i=new E.default({apiKey:o,baseURL:s}),l=await i.chat.completions.create({model:t,messages:[{role:"user",content:c}],temperature:.2,max_tokens:4e3}),u=l.choices[0]?.message?.content||"",d=(0,C.safeParseAuditJSON)(u);if(!d)return{extractedFacts:{characters:{},techLines:{},factions:{},majorEvents:[],revealedInfo:[]},confidence:"low",warnings:["LLM 返回的 JSON 解析失败，请检查模型输出"],sourceVolume:r,timestamp:n};let p={characters:d.characters||{},techLines:d.techLines||{},factions:d.factions||{},majorEvents:Array.isArray(d.majorEvents)?d.majorEvents:[],revealedInfo:Array.isArray(d.revealedInfo)?d.revealedInfo:[]},h=d.confidence||"medium",f=Array.isArray(d.warnings)?d.warnings:[];return{extractedFacts:p,confidence:h,warnings:f,sourceVolume:r,timestamp:n}}catch(e){return console.error("[factsExtractor] 提取失败:",e),{extractedFacts:{characters:{},techLines:{},factions:{},majorEvents:[],revealedInfo:[]},confidence:"low",warnings:[`提取失败：${e instanceof Error?e.message:"未知错误"}`],sourceVolume:r,timestamp:n}}}async function A(e,{params:t}){try{let{id:r}=await t,{volumeNumber:a}=await e.json();if(!a||"number"!=typeof a)return w.NextResponse.json({error:"缺少 volumeNumber 参数"},{status:400});let n=await S(r,a);return w.NextResponse.json(n)}catch(e){return console.error("[API] 事实提取失败:",e),w.NextResponse.json({error:e instanceof Error?e.message:"事实提取失败"},{status:500})}}e.s(["POST",()=>A],37564);var $=e.i(37564);let O=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/projects/[id]/knowledge/facts/extract/route",pathname:"/api/projects/[id]/knowledge/facts/extract",filename:"route",bundlePath:""},distDir:".next-build",relativeProjectDir:"",resolvedPagePath:"[project]/novel-workshop/app/api/projects/[id]/knowledge/facts/extract/route.ts",nextConfigOutput:"",userland:$}),{workAsyncStorage:j,workUnitAsyncStorage:N,serverHooks:k}=O;function P(){return(0,a.patchFetch)({workAsyncStorage:j,workUnitAsyncStorage:N})}async function T(e,t,a){O.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let w="/api/projects/[id]/knowledge/facts/extract/route";w=w.replace(/\/index$/,"")||"/";let R=await O.prepare(e,t,{srcPage:w,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:E,params:y,nextConfig:x,parsedUrl:C,isDraftMode:b,prerenderManifest:S,routerServerContext:A,isOnDemandRevalidate:$,revalidateOnlyGenerated:j,resolvedPathname:N,clientReferenceManifest:k,serverActionsManifest:P}=R,T=(0,i.normalizeAppPath)(w),I=!!(S.dynamicRoutes[T]||S.routes[N]),_=async()=>((null==A?void 0:A.render404)?await A.render404(e,t,C,!1):t.end("This page could not be found"),null);if(I&&!b){let e=!!S.routes[N],t=S.dynamicRoutes[T];if(t&&!1===t.fallback&&!e){if(x.experimental.adapterPath)return await _();throw new v.NoFallbackError}}let D=null;!I||O.isDev||b||(D="/index"===(D=N)?"/":D);let H=!0===O.isDev||!I,L=I&&!H;P&&k&&(0,s.setManifestsSingleton)({page:w,clientReferenceManifest:k,serverActionsManifest:P});let U=e.method||"GET",q=(0,o.getTracer)(),F=q.getActiveScopeSpan(),M={params:y,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!x.experimental.authInterrupts},cacheComponents:!!x.cacheComponents,supportsDynamicResponse:H,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:x.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>O.onRequestError(e,t,a,n,A)},sharedContext:{buildId:E}},V=new l.NodeNextRequest(e),K=new l.NodeNextResponse(t),B=c.NextRequestAdapter.fromNodeNextRequest(V,(0,c.signalFromNodeResponse)(t));try{let s=async e=>O.handle(B,M).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=q.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${U} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${U} ${w}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var o,l;let c=async({previousCacheEntry:r})=>{try{if(!i&&$&&j&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await s(n);e.fetchMetrics=M.renderOpts.fetchMetrics;let l=M.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let c=M.renderOpts.collectedTags;if(!I)return await (0,p.sendResponse)(V,K,o,M.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);c&&(t[m.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,a=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await O.onRequestError(e,t,{routerKind:"App Router",routePath:w,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:$})},!1,A),t}},u=await O.handleResponse({req:e,nextConfig:x,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:$,revalidateOnlyGenerated:j,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:i});if(!I)return null;if((null==u||null==(o=u.value)?void 0:o.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",$?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),b&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let v=(0,h.fromNodeOutgoingHttpHeaders)(u.value.headers);return i&&I||v.delete(m.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||v.get("Cache-Control")||v.set("Cache-Control",(0,f.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(V,K,new Response(u.value.body,{headers:v,status:u.value.status||200})),null};F?await l(F):await q.withPropagatedContext(e.headers,()=>q.trace(u.BaseServerSpan.handleRequest,{spanName:`${U} ${w}`,kind:o.SpanKind.SERVER,attributes:{"http.method":U,"http.target":e.url}},l))}catch(t){if(t instanceof v.NoFallbackError||await O.onRequestError(e,t,{routerKind:"App Router",routePath:T,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:$})},!1,A),I)throw t;return await (0,p.sendResponse)(V,K,new Response(null,{status:500})),null}}e.s(["handler",()=>T,"patchFetch",()=>P,"routeModule",()=>O,"serverHooks",()=>k,"workAsyncStorage",()=>j,"workUnitAsyncStorage",()=>N],76855)}];

//# sourceMappingURL=0b7ee_next_dist_esm_build_templates_app-route_4a54447a.js.map