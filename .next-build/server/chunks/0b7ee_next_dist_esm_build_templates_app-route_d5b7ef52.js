module.exports=[81574,e=>{"use strict";var t=e.i(46821),r=e.i(73489),n=e.i(62184),a=e.i(14679),o=e.i(18903),i=e.i(22196),s=e.i(24e3),l=e.i(49439),u=e.i(10138),c=e.i(372),p=e.i(11032),d=e.i(9628),h=e.i(38596),m=e.i(21036),f=e.i(51298),g=e.i(93695);e.i(40077);var R=e.i(60191),y=e.i(75179);e.i(22523);var E=e.i(80567),v=e.i(2157),$=e.i(50227),A=e.i(94341),w=e.i(26754),N=e.i(29567),S=e.i(50141);async function x(e,{params:t}){var r;let n,a,o,i,s,l,u,c,{id:p}=await t;try{n=await e.json()}catch{return y.NextResponse.json({error:"Bad Request"},{status:400})}let{volumeNum:d,volumeTitle:h,startChapter:m,endChapter:f,volumeSummary:g,characters:R,constraints:x}=n;if(!d||!h||!m||!f||!g)return y.NextResponse.json({error:"缺少必要参数：volumeNum, volumeTitle, startChapter, endChapter, volumeSummary"},{status:400});let{characters:O,globalRules:C,worldSettings:T}=function(e){let t=$.default.join((0,N.getProjectKnowledgeDir)(e),"bible.sqlite");if(!v.default.existsSync(t))return{characters:[],globalRules:[],worldSettings:[]};let r=new A.default(t,{readonly:!0});try{let e=r.prepare("SELECT name FROM sqlite_master WHERE type='table'").all(),t=new Set(e.map(e=>e.name)),n=t.has("characters")?r.prepare("SELECT * FROM characters").all():[],a=t.has("global_rules")?r.prepare("SELECT * FROM global_rules ORDER BY priority DESC").all():[],o=t.has("world_settings")?r.prepare("SELECT * FROM world_settings ORDER BY createdAt DESC").all():[];return{characters:n,globalRules:a,worldSettings:o}}finally{r.close()}}(p),b=(o=(a=(r=R||[]).length?O.filter(e=>e.name&&r.includes(e.name)):[]).length?a:O.slice(0,8)).length?o.map(e=>[`【${e.name||"未命名"}】`,e.role?`- 身份：${e.role}`:"",e.aliases?`- 别名：${e.aliases}`:"",e.appearance?`- 外貌：${e.appearance}`:"",e.personality?`- 性格：${e.personality}`:"",e.speechStyle?`- 语言风格：${e.speechStyle}`:"",e.behaviorRules?`- 行为铁律：${e.behaviorRules}`:"",e.growthArc?`- 成长弧光：${e.growthArc}`:"",e.background?`- 背景：${e.background}`:"",e.currentStatus?`- 当前状态：${e.currentStatus}`:"",e.sampleDialogue?`- 典型对话：${e.sampleDialogue}`:"",e.keyEvents?`- 关键事件：${e.keyEvents}`:""].filter(Boolean).join("\n")).join("\n\n"):"（无角色数据）",_=C.length?C.map((e,t)=>{let r=e.title||`规则${t+1}`,n="number"==typeof e.priority?`（priority=${e.priority}）`:"";return`【${r}${n}】
${e.content||""}`.trim()}).join("\n\n"):"（无全局规则）",j=T.length?T.map(e=>[`【${e.name||"未命名"}】`,e.category?`- 类别：${e.category}`:"",e.volume?`- 卷册：${e.volume}`:"",e.description?`- 描述：${e.description}`:"",e.currentStatus?`- 当前状态：${e.currentStatus}`:""].filter(Boolean).join("\n")).join("\n\n"):"（无世界设定）",P=function(e,t){try{let r=(0,w.loadOutline)(e),n=(Array.isArray(r?.volumes)?r.volumes.flatMap(e=>Array.isArray(e.chapters)?e.chapters:[]):[]).filter(e=>"number"==typeof e?.chapterNum&&e.chapterNum<t).sort((e,t)=>t.chapterNum-e.chapterNum).slice(0,5).reverse();if(!n.length)return"（无前文摘要）";return n.map(e=>{let t=e.plotSummary||e.summary||"";return`第${e.chapterNum}章《${e.title||""}》：${String(t).slice(0,300)}`}).join("\n")}catch{return"（无前文摘要）"}}(p,m),I=function(e,t,r){try{let n=(0,w.loadOutline)(e),a=Array.isArray(n?.volumes)?n.volumes.find(e=>e?.volumeNum===t):null,o=Array.isArray(a?.chapters)?a.chapters.filter(e=>"number"==typeof e.chapterNum&&e.chapterNum<r).sort((e,t)=>e.chapterNum-t.chapterNum):[];if(!o.length)return"（本卷此前暂无已生成章节）";return o.map(e=>`第${e.chapterNum}章《${e.title||""}》：${function(e,t=120){let r=String(e||"").replace(/\s+/g," ").replace(/^[\-•\d.、\s]+/,"").trim();if(!r)return"";let n=r.match(/^(.+?[。！？!?；;])/);return(n?.[1]||r).slice(0,t).trim()}([e.corePurpose,e.plotSummary,e.summary,Array.isArray(e.plotPoints)?e.plotPoints[0]:""].map(e=>String(e||"").trim()).find(Boolean)||"")||"（无摘要）"}`).join("\n")}catch{return"（本卷此前暂无已生成章节）"}}(p,d,m),D=function(e,t,r,n=2e3){let a=[];for(let r=1;r<=3;r++){let o=t-r;if(o<=0)break;let i=function(e,t){let r=(0,N.getProjectChaptersDir)(e),n=$.default.join(r,`${t}.json`);if(!v.default.existsSync(n))return null;try{let e=JSON.parse(v.default.readFileSync(n,"utf-8"));return{title:e.title||`第${t}章`,content:e.content||""}}catch{return null}}(e,o);i?.content&&a.push(`【第${o}章 ${i.title} 末尾摘录】
${i.content.slice(-n)}`)}return a.reverse().join("\n\n")}(p,m,0,2e3),U="";try{U=await (0,S.assembleStoryGuardContext)(p,d,m,f)}catch(e){console.warn("[generate-outline] StoryGuard 上下文获取失败，跳过:",e)}let M=`你是一位顶级网文策划编辑，擅长设计高留存率、强爽点的章节细纲。
${U?`
${U}

---以下是知识库参考信息---
`:""}

【你的任务】
根据提供的全书背景、角色信息、前文摘要，为本卷生成详细的分章细纲。

【角色圣经】
${b}

【全局规则】
${_}

【世界设定】
${j}

【前文摘要（最近5章）】
${P}

【已完成章节（请勿重复这些内容，从这些章节之后继续推进剧情）】
${I}

【前文情绪衔接（最近3章末尾）】
${D||"（无章节末尾文本）"}

【本卷信息】
- 卷号：${d}
- 卷名：${h}
- 章节范围：第${m}章 - 第${f}章
- 本卷概要：${g}
- 主要角色：${(R||[]).join("、")}
- 特殊约束：${x||"无"}

【当前生成任务】
现在请生成第${m}-${f}章，剧情必须在上述【已完成章节】的基础上继续向前推进，不得重复已有事件。

【输出要求】
生成JSON数组，每个元素代表一章，格式：
{
  "chapterNum": 172,
  "title": "章节标题。【标题风格铁律】：7个章节的标题字数必须各不相同，严禁出现两个标题字数一样的情况。参考以下真实标题的多样性：'史上最贵集结令'(7字)、'光，来了！'(4字带标点)、'铁桶里的锈'(5字)、'一双手，一座山'(6字带逗号)、'你已经不需要我了'(8字)、'以孤为王'(4字)、'当上帝掷下骰子'(7字)、'点火一次，半亿成灰'(8字带逗号)。要求：有的用隐喻(如'铁桶里的锈')，有的用感叹(如'光，来了！')，有的用陈述(如'你已经不需要我了')，有的用对仗(如'一双手，一座山')。绝对禁止全部使用'四字+逗号+四字'的格式。",
  "corePurpose": "本章核心功能（1-2句话，说明这章在全卷中的叙事作用）",
  "plotPoints": [
    "情节点1：具体描述（含角色动作、对话要点、场景）",
    "情节点2：...",
    "情节点3：..."
  ],
  "keyCharacters": ["李弈", "魏莱"],
  "emotionalArc": "情绪弧线描述（从什么情绪到什么情绪）",
  "endHook": "章末钩子。这是写作模型被强制要求放在章节最后500字内的精确叙事内容。因此endHook必须是一个具体的、可直接写入正文的场景动作或角色台词，绝对不能是抽象的叙事指导。正确示例：'秦刃站在地铁站看着手机上Mirror这个词，抬头看向低头盯着手机的人流——镜无处不在。' 错误示例：'留下关于Mirror的悬念'、'为下一章埋下伏笔'",
  "connectionToPrev": "与上一章的衔接点",
  "connectionToNext": "为下一章埋的线",
  "mustInclude": ["必须出现的关键元素"],
  "wordCountGuide": "建议字数（2500-3500）"
}

【质量要求】
1. 每章必须有明确的、不可替代的叙事功能，不允许"过渡章"或"水章"
2. 每5章必须有一个大高潮节点
3. 每章结尾必须有具体的悬念钩子
4. 角色行为必须符合角色圣经中的行为铁律
5. 情节之间必须有因果链，前章的钩子必须在后续章节回收
6. 保持番茄网文的快节奏：每章至少一个小爽点或情感冲击点
7. 对话风格简洁有力，单段对话不超过3行

【重要规则】
- 已完成章节中出现过的事件不得再次出现
- 每章必须推进新的剧情进展
- 如果大纲中的某个事件已在前面章节中完成，直接跳过进入下一个事件
- 不得重新书写主角初次发现异常、被裁、求职受挫、首次接触案件等已经在已完成章节中发生过的内容，除非是作为一句话回顾背景，且不能再次作为本章主体事件

只输出JSON数组，不要任何其他文字。`,{model:k,apiKey:L,baseUrl:H}=function(){let e=process.env.OUTLINE_MODEL||process.env.DEFAULT_MODEL,t=process.env.OUTLINE_API_KEY||process.env.DEFAULT_API_KEY,r=process.env.OUTLINE_BASE_URL||process.env.DEFAULT_BASE_URL;if(!e||!t||!r)throw Error("Missing OUTLINE_* or DEFAULT_* env configuration");return{model:e,apiKey:t,baseUrl:r}}(),q=new E.default({apiKey:L,baseURL:H}),F=await q.chat.completions.create({model:k,messages:[{role:"system",content:M}],temperature:.7,max_tokens:8e3}),B=F.choices[0]?.message?.content||"";console.log("AI raw response:",B);let K=function(e){let t=e.trimStart(),r=e.trimEnd();if(!t.startsWith("[")||r.endsWith("]"))return e;let n=e.lastIndexOf("}");if(-1===n)return e;let a=e.slice(0,n+1);return a.replace(/,\s*$/,"")+"]"}((s=Math.min(-1===(i=(i=B.replace(/```(?:json)?\s*/gi,"").replace(/```\s*/g,"")).replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\u00a0/g," ").trim()).indexOf("[")?1/0:i.indexOf("["),-1===i.indexOf("{")?1/0:i.indexOf("{")),l=Math.max(i.lastIndexOf("]"),i.lastIndexOf("}")),s!==1/0&&-1!==l&&l>s&&(i=i.substring(s,l+1)),i));console.log("AI repaired response:",K);let J=(u=K.indexOf("["),c=K.lastIndexOf("]"),(u<0||c<0||c<=u?null:K.slice(u,c+1))||K);if(!J)return y.NextResponse.json({error:"AI返回内容未包含JSON数组",raw:B.slice(0,4e3)},{status:500});let G=[];try{G=JSON.parse(J)}catch(e){return console.error("AI JSON parse failed. cleaned jsonText:",J),y.NextResponse.json({error:"解析AI JSON失败",raw:J.slice(0,4e3)},{status:500})}if(!Array.isArray(G)||0===G.length)return y.NextResponse.json({error:"生成的章节细纲为空"},{status:500});let W=G.filter(e=>"number"==typeof e?.chapterNum);return y.NextResponse.json({success:!0,chapters:W})}e.s(["POST",()=>x,"runtime",0,"nodejs"],7003);var O=e.i(7003);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/projects/[id]/generate-outline/route",pathname:"/api/projects/[id]/generate-outline",filename:"route",bundlePath:""},distDir:".next-build",relativeProjectDir:"",resolvedPagePath:"[project]/novel-workshop/app/api/projects/[id]/generate-outline/route.ts",nextConfigOutput:"",userland:O}),{workAsyncStorage:T,workUnitAsyncStorage:b,serverHooks:_}=C;function j(){return(0,n.patchFetch)({workAsyncStorage:T,workUnitAsyncStorage:b})}async function P(e,t,n){C.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/projects/[id]/generate-outline/route";y=y.replace(/\/index$/,"")||"/";let E=await C.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!E)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:v,params:$,nextConfig:A,parsedUrl:w,isDraftMode:N,prerenderManifest:S,routerServerContext:x,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,resolvedPathname:b,clientReferenceManifest:_,serverActionsManifest:j}=E,P=(0,s.normalizeAppPath)(y),I=!!(S.dynamicRoutes[P]||S.routes[b]),D=async()=>((null==x?void 0:x.render404)?await x.render404(e,t,w,!1):t.end("This page could not be found"),null);if(I&&!N){let e=!!S.routes[b],t=S.dynamicRoutes[P];if(t&&!1===t.fallback&&!e){if(A.experimental.adapterPath)return await D();throw new g.NoFallbackError}}let U=null;!I||C.isDev||N||(U="/index"===(U=b)?"/":U);let M=!0===C.isDev||!I,k=I&&!M;j&&_&&(0,i.setManifestsSingleton)({page:y,clientReferenceManifest:_,serverActionsManifest:j});let L=e.method||"GET",H=(0,o.getTracer)(),q=H.getActiveScopeSpan(),F={params:$,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!A.experimental.authInterrupts},cacheComponents:!!A.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:A.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,a)=>C.onRequestError(e,t,n,a,x)},sharedContext:{buildId:v}},B=new l.NodeNextRequest(e),K=new l.NodeNextResponse(t),J=u.NextRequestAdapter.fromNodeNextRequest(B,(0,u.signalFromNodeResponse)(t));try{let i=async e=>C.handle(J,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${L} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${L} ${y}`)}),s=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var o,l;let u=async({previousCacheEntry:r})=>{try{if(!s&&O&&T&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(a);e.fetchMetrics=F.renderOpts.fetchMetrics;let l=F.renderOpts.pendingWaitUntil;l&&n.waitUntil&&(n.waitUntil(l),l=void 0);let u=F.renderOpts.collectedTags;if(!I)return await (0,d.sendResponse)(B,K,o,F.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(o.headers);u&&(t[f.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,n=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:R.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:O})},!1,x),t}},c=await C.handleResponse({req:e,nextConfig:A,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:T,responseGenerator:u,waitUntil:n.waitUntil,isMinimalMode:s});if(!I)return null;if((null==c||null==(o=c.value)?void 0:o.kind)!==R.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",O?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),N&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let g=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return s&&I||g.delete(f.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||g.get("Cache-Control")||g.set("Cache-Control",(0,m.getCacheControlHeader)(c.cacheControl)),await (0,d.sendResponse)(B,K,new Response(c.value.body,{headers:g,status:c.value.status||200})),null};q?await l(q):await H.withPropagatedContext(e.headers,()=>H.trace(c.BaseServerSpan.handleRequest,{spanName:`${L} ${y}`,kind:o.SpanKind.SERVER,attributes:{"http.method":L,"http.target":e.url}},l))}catch(t){if(t instanceof g.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:P,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:k,isOnDemandRevalidate:O})},!1,x),I)throw t;return await (0,d.sendResponse)(B,K,new Response(null,{status:500})),null}}e.s(["handler",()=>P,"patchFetch",()=>j,"routeModule",()=>C,"serverHooks",()=>_,"workAsyncStorage",()=>T,"workUnitAsyncStorage",()=>b],81574)}];

//# sourceMappingURL=0b7ee_next_dist_esm_build_templates_app-route_d5b7ef52.js.map