module.exports=[50141,76257,99596,41912,e=>{"use strict";var t=e.i(26754),r=e.i(29567);let n=`【角色圣经\xb7核心摘要（写手与审核共用）】

■ 李弈（主角）：外在装逼金句+反问句收尾，内在疯狂吐槽+感叹号。
  金手指V3.0：商业亏损=0，科研亏损1:2转化，连续3月盈利扣图纸碎片。
  当前状态：504厂发布会现场。

■ 魏莱：职业化汇报，崩溃时急促吐槽。迪化严格事后合理化，禁止提前猜透李弈意图。
  当前状态：504厂发布会后台。

■ 赵光：直来直去带脏字，人字拖+鸡窝头+重度黑眼圈。
  当前状态：72小时爆肝后补觉，刚被吵醒。

■ 刘大爷：老西北口音，短句，"小兔崽子"口头禅，旱烟袋指人。八级钳工，手搓透镜。
  【暗线】帕金森仅写伏笔（藏手、吃药、虎口微颤），未收到作者引爆指令前严禁揭开。
  当前状态：504厂。

■ 王代码：社恐宅男，二次元T恤，能动手绝不废话。口头禅"得嘞老板！"
  当前状态：504厂算力调度中心。

■ 灰衣人：优雅冷漠，标志性红酒杯+曼哈顿夜景。信奉算力霸权。
  当前状态：纽约WCA总部，已砸500亿进V1.0过时产线。

■ 陈默：已于123-124章叛逃至纽约WCA，不可出现在国内场景。
  极度理性利己，语气平静带优越感。

■ 张德全：红星表厂原厂长，老实人，易流泪。第三卷后出场减少，不主动安排。

■ 李半城：李弈父亲，海城首富。当前未出场，不得擅自安排其出场或对话，需作者手动授权。

【关键设定】
芯片名称：光子芯片V2.0（禁止使用"龙芯"等其他名称）
V1.0数据被盗70%，但手搓透镜工艺未泄露
504厂=大西北废弃核基地，苏式工业废土风
核聚变图纸碎片进度1/10

【已废弃设定】
5000万一个月期限→已取消。系统V1.0的1:1转化→已升级为V3.0。红星=表厂→已扩展为集团。

【章末板块铁律】
总字数≤150字。格式必须为：
【下集预告】
（1-2句画面/台词钩子）

1句干练互动引导（单独一行，禁止用括号包裹）
严禁章节序号、章节名、角色小剧场、作者抒情、剧情概括。`;var a=e.i(51857),o=e.i(81916);function l(e){return{id:String(e.id??""),name:String(e.name??""),ageAppearance:String(e.age_appearance??""),background:String(e.background??""),personality:String(e.personality??""),speakingStyle:String(e.speaking_style??""),catchphrase:String(e.catchphrase??""),currentLocation:String(e.current_location??""),currentStatus:String(e.current_status??""),defaultInject:Number(e.default_inject??0),locked:Number(e.locked??0),createdAt:String(e.created_at??""),updatedAt:String(e.updated_at??"")}}function s(e){return{id:String(e.id??""),name:String(e.name??""),description:String(e.description??""),status:String(e.status??""),createdAt:String(e.created_at??""),updatedAt:String(e.updated_at??"")}}function i(e){return{id:String(e.id??""),name:String(e.name??""),rule:String(e.rule??""),trigger:String(e.trigger??""),status:"triggered"===e.status?"triggered":"untriggered",createdAt:String(e.created_at??""),updatedAt:String(e.updated_at??"")}}function c(e){return{id:String(e.id??""),name:String(e.name??""),content:String(e.content??""),reason:String(e.reason??""),createdAt:String(e.created_at??""),updatedAt:String(e.updated_at??"")}}async function u(e){if(e)try{let t=(0,o.getAllCharacters)(e);if(t.length>0){let e=["【角色圣经·核心摘要】"];for(let r of t){let t=`${r.name}：${r.personality||""}`.trimEnd();r.speechStyle&&(t+=`，${r.speechStyle}`),r.currentState&&(t+=`，${r.currentState}`),e.push(t.replace(/，+/g,"，").replace(/：，/g,"：").trim())}return e.join("\n")}}catch{}try{let e=await (0,a.getDb)(),t=e.prepare("SELECT * FROM characters;").all().map(l),r=e.prepare("SELECT * FROM settings;").all().map(s),o=e.prepare("SELECT * FROM plotlines;").all().map(i),u=e.prepare("SELECT * FROM deprecated;").all().map(c);if(!(t.length>0||r.length>0||o.length>0||u.length>0)||1===t.length&&t[0]?.id==="li_yi"&&0===r.length&&0===o.length&&0===u.length)return n;return function(e){let{characters:t,settings:r,plotlines:n,deprecated:a}=e,o=t.filter(e=>1===e.defaultInject).sort((e,t)=>e.name.localeCompare(t.name,"zh")),l=n.filter(e=>"untriggered"===e.status).sort((e,t)=>e.name.localeCompare(t.name,"zh")),s=[];if(s.push("【角色圣经·核心摘要】"),0===o.length)s.push("（暂无默认注入角色）");else for(let e of o){let t=[`${e.name}：${e.personality||""}`.trimEnd(),e.speakingStyle?`，${e.speakingStyle}`:"",e.catchphrase?`，口头禅"${e.catchphrase}"`:"",e.currentLocation?`，${e.currentLocation}`:"",e.currentStatus?`，${e.currentStatus}`:""].join("");s.push(t.replace(/，+/g,"，").replace(/：，/g,"：").trim())}if(s.push(""),s.push("【关键设定】"),0===r.length)s.push("（暂无）");else for(let e of r){let t=[e.description,e.status].filter(Boolean).join("，");s.push(`${e.name}：${t||""}`.trim())}if(s.push(""),s.push("【暗线约束】"),0===l.length)s.push("（暂无）");else for(let e of l)s.push(`${e.name}：${e.rule}`.trim());if(s.push(""),s.push("【废弃设定】"),0===a.length)s.push("（暂无）");else for(let e of a)s.push(`${e.name}：已废弃，${e.reason}`.trim());return s.join("\n")}({characters:t,settings:r,plotlines:o,deprecated:u})}catch{return n}}e.s(["getBibleCoreSummary",()=>u],76257);var h=e.i(77141),p=e.i(2157),f=e.i(50227),g=e.i(62118);let m={秦刃:"男/他",林桐:"男/他",郑维:"男/他",陆鸣远:"男/他",方远:"男/他",周翰:"男/他",沈明哲:"男/他",王建国:"男/他",陈律师:"男/他",林正阳:"男/他",苏可:"女/她",赵谦:"女/她","M-0":"AI/它","M-0系统":"AI/它"},d={秦刃:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},林桐:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},郑维:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},陆鸣远:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},方远:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},周翰:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},沈明哲:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},王建国:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},陈律师:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},林正阳:{expectedPronoun:"他",wrongPronouns:["她","它"],genderLabel:"男"},苏可:{expectedPronoun:"她",wrongPronouns:["他","它"],genderLabel:"女"},赵谦:{expectedPronoun:"她",wrongPronouns:["他","它"],genderLabel:"女"},"M-0":{expectedPronoun:"它",wrongPronouns:["他","她"],genderLabel:"AI系统"},"M-0系统":{expectedPronoun:"它",wrongPronouns:["他","她"],genderLabel:"AI系统"}};function S(e){return m[e]||""}function y(e){return d[e]}function $(e){return{name:"string"==typeof e?.name&&e.name.trim()?e.name.trim():"未明确提及",currentLocation:"string"==typeof e?.currentLocation&&e.currentLocation.trim()?e.currentLocation.trim():"未明确提及",knownInformation:Array.isArray(e?.knownInformation)?e.knownInformation.map(e=>String(e)).filter(Boolean):["未明确提及"],relationshipUpdates:Array.isArray(e?.relationshipUpdates)?e.relationshipUpdates.map(e=>String(e)).filter(Boolean):["未明确提及"],emotionalState:"string"==typeof e?.emotionalState&&e.emotionalState.trim()?e.emotionalState.trim():"未明确提及"}}function w(e,t){return{chapterNo:"number"==typeof t?.chapterNo?t.chapterNo:e,timestamp:"string"==typeof t?.timestamp&&t.timestamp.trim()?t.timestamp:new Date().toISOString(),characters:Array.isArray(t?.characters)?t.characters.map($):[],unresolvedClues:Array.isArray(t?.unresolvedClues)?t.unresolvedClues.map(e=>String(e)).filter(Boolean):[],resolvedClues:Array.isArray(t?.resolvedClues)?t.resolvedClues.map(e=>String(e)).filter(Boolean):[],keyItemLocations:t?.keyItemLocations&&"object"==typeof t.keyItemLocations&&!Array.isArray(t.keyItemLocations)?Object.fromEntries(Object.entries(t.keyItemLocations).map(([e,t])=>[String(e),String(t)])):{}}}async function N(e,t,r,n){let a=`你是一个小说状态追踪器。根据以下章节正文和细纲，提取本章结束时的世界状态。

【章节正文】
${t}

【章节细纲】
${r}

请严格按以下 JSON 格式输出，不要添加任何其他文字：
{
  "chapterNo": <章节号>,
  "characters": [
    {
      "name": "角色名",
      "currentLocation": "章末时该角色所在的具体地点",
      "knownInformation": ["该角色在本章结束时已经掌握的所有关键信息"],
      "relationshipUpdates": ["本章中该角色与其他角色之间发生的关系变化"],
      "emotionalState": "本章结束时该角色的情绪状态"
    }
  ],
  "unresolvedClues": ["本章提出但未解答的悬念或线索"],
  "resolvedClues": ["本章解决或回答的之前遗留的线索"],
  "keyItemLocations": {"物品名": "当前持有者或所在位置"}
}

注意：
1. 只提取正文中实际出场的角色
2. currentLocation 必须基于正文最后一次提到该角色时的位置
3. knownInformation 是累积的——包含之前章节已知的加上本章新获取的
4. 如果正文未明确某个字段，填"未明确提及"`;try{let t=await n(a);try{return w(e,JSON.parse(t))}catch{let r,n=(r=t.match(/\{[\s\S]*\}/))?r[0]:null;if(n)return w(e,JSON.parse(n));throw Error("未找到可解析 JSON")}}catch(t){return console.warn("[chapterStateManager] 章节状态提取失败，使用空状态兜底:",t),{chapterNo:e,timestamp:new Date().toISOString(),characters:[],unresolvedClues:[],resolvedClues:[],keyItemLocations:{}}}}function b(e,t){let r=(0,g.getProjectDataPath)(e,"knowledge","chapterStates.json"),n=f.default.dirname(r);p.default.mkdirSync(n,{recursive:!0});let a=[];if(p.default.existsSync(r))try{let e=p.default.readFileSync(r,"utf-8"),t=JSON.parse(e);Array.isArray(t)&&(a=t)}catch(e){console.warn("[chapterStateManager] 读取 chapterStates.json 失败，将重建文件:",e)}let o=w(t.chapterNo,{...t,timestamp:t.timestamp||new Date().toISOString()}),l=a.findIndex(e=>e.chapterNo===o.chapterNo);l>=0?a[l]=o:a.push(o),a.sort((e,t)=>e.chapterNo-t.chapterNo),p.default.writeFileSync(r,JSON.stringify(a,null,2),"utf-8")}function P(e,t,r=3){let n=(0,g.getProjectDataPath)(e,"knowledge","chapterStates.json");if(!p.default.existsSync(n))return[];try{let e=p.default.readFileSync(n,"utf-8"),a=JSON.parse(e);if(!Array.isArray(a))return[];let o=a.filter(e=>"number"==typeof e?.chapterNo&&e.chapterNo<t).sort((e,t)=>t.chapterNo-e.chapterNo).slice(0,r).sort((e,t)=>e.chapterNo-t.chapterNo),l=new Map;for(let e of o)for(let t of Array.isArray(e?.characters)?e.characters:[]){let e=$(t);l.set(e.name,e)}return Array.from(l.values())}catch(e){return console.warn("[chapterStateManager] 加载角色状态失败:",e),[]}}function j(e){let t=["【角色当前状态（基于前文，不可违背）】"];for(let r of e){let e=S(r.name),n=r.knownInformation?.length?r.knownInformation.join("、"):"未明确提及";t.push(`● ${r.name}${e?`（${e}）`:""} | 位置：${r.currentLocation||"未明确提及"} | 情绪：${r.emotionalState||"未明确提及"} | 已知信息：${n}`)}return t.push("（如果本章需要角色出现在与上述不同的地点，必须在正文中描写移动过程或使用远程通信方式）"),t.join("\n")}e.s(["getGenderLabel",()=>S,"getPronounRule",()=>y],99596),e.s(["extractChapterState",()=>N,"formatStateForInjection",()=>j,"loadLatestStates",()=>P,"saveChapterState",()=>b],41912);var C=e.i(94341);async function k(e){let{projectId:n,chapterDirection:a,chapterNo:o,maxTokenBudget:l=6e3}=e,{lockSection:s,injectedItems:i}=function(e,t){let r=[],n="";if(!t)return{lockSection:"",injectedItems:[]};try{let a=(0,g.getProjectDataPath)(e,"knowledge","outline.json");if(!p.default.existsSync(a))return{lockSection:"",injectedItems:[]};let o=JSON.parse(p.default.readFileSync(a,"utf-8"));if(!o.volumes)return{lockSection:"",injectedItems:[]};let l=null,s=null,i=null,c=[];o.globalConstraints&&Array.isArray(o.globalConstraints)&&(c=o.globalConstraints.filter(e=>e&&e.trim()));let u=o.volumes.flatMap(e=>e.chapters||[]),h=u.findIndex(e=>e.chapterNum===t);if(h>=0&&(l=u[h],s=h>0?u[h-1]:null,i=h<u.length-1?u[h+1]:null),!l)return{lockSection:"",injectedItems:[]};if(n+=`=== 📌 章节写作锁定指令（最高优先级，违反即为失败） ===

【当前章节】第${l.chapterNum}章：${l.title}

【本章细纲（必须严格遵循）】
`,l.rawContent?n+=l.rawContent+"\n":l.plotSummary&&(n+=l.plotSummary+"\n"),n+=`
【硬性边界规则】
1. 你只能写第${l.chapterNum}章的内容，严禁涉及后续章节的情节
2. 本章必须覆盖细纲中列出的所有"主要情节"点
3. 本章的"章末钩子"必须作为最后的收束场景，不得在此之后继续推进剧情
4. 如果细纲中有"SOP对标"信息，参考对应SOP的节奏但不要照搬
5. 禁止提前揭示、暗示、或展开任何属于第${l.chapterNum+1}章及之后的情节

【上一章概要（用于衔接）】
`,s){let e=s.rawContent||s.plotSummary||"";n+=`第${s.chapterNum}章 ${s.title}：${e.slice(0,200)}...
`}else n+="无\n";if(n+="\n",s){n+=`【前一章情绪收束状态】
基于第${s.chapterNum}章"${s.title}"的结尾，当前各角色/场景的情绪状态：
- 请从前一章尾部内容中推断并延续以下状态：
1. 团队整体士气/氛围
2. 主角李弈的心理状态
3. 尚未解决的悬念/冲突
4. 本章开篇必须自然承接的情绪基调
`;try{let t=(0,g.getProjectDataPath)(e,"chapters",`${s.chapterNum}.json`);if(p.default.existsSync(t)){let e=JSON.parse(p.default.readFileSync(t,"utf-8")).content||"";if(e){let t=e.slice(-3e3);n+=`
【上一章结尾片段（请注意其中的未解决悬念和叙事承诺）】
${t}

【重要】如果上述结尾中存在悬念（如某人到来、未揭晓的信息、紧张场景中断等），本章必须在开头段落中予以回应或交代。
`}}}catch(e){console.error("获取前一章情绪状态失败:",e)}n+="\n";try{let t=function(e,t){try{let r=(0,g.getProjectDataPath)(e,"chapters",`${t}.json`);if(!p.default.existsSync(r))return null;let n=JSON.parse(p.default.readFileSync(r,"utf-8")),a=n.content||"",o=n.title||`第${t}章`;if(!a)return null;return{title:o,content:a}}catch{return null}}(e,s.chapterNum),r=t?function(e){let t=e;for(let e of[/求.*?五星.*?好评/g,/求.*?追读/g,/求.*?月票/g,/求.*?推荐票/g,/求.*?打赏/g,/求.*?收藏/g,/稳定.*?日更.*?不断更/g,/日更.*?不断/g,/感谢.*?支持/g,/跪求.*?支持/g,/各位.*?给个.*?[票赏藏读评]/g,/新书.*?求.*?[票赏藏读评]/g])t=t.replace(e,"");return t=t.replace(/\n{3,}/g,"\n\n").trim()}(function(e){if(!e)return"";let t=-1;for(let r of["【下集预告】","【下章预告】","下集预告","下章预告","预告"]){let n=e.lastIndexOf(r);-1!==n&&n>t&&(t=n)}return -1===t?"":e.slice(t).trim()}(t.content)):"";r&&r&&r.replace(/【下集预告】|【下章预告】|下集预告|下章预告/g,"").replace(/[\p{P}\p{S}\s]/gu,"").trim().length>0&&(n+=`【上一章下集预告】
${r}

【衔接要求】本章开头必须在前500字内回应上述预告中的核心场景和人物。如果本章大纲方向与预告存在冲突，优先在开头回应预告承诺，再过渡到本章主线。

`)}catch(e){console.error("提取上一章下集预告失败:",e)}}if(n+="【下一章预告（仅用于铺垫语气，禁止展开）】\n",i){let e=i.rawContent||i.plotSummary||"";n+=`第${i.chapterNum}章 ${i.title}：${e.slice(0,100)}...
`}else n+="无\n";return n+="\n=== 锁定指令结束 ===\n\n",c.length>0&&(n+="=== 全局约束 ===\n",c.forEach(e=>{n+=`- ${e}
`}),n+="=== 全局约束结束 ===\n\n"),r.push(`章节锁定：第${l.chapterNum}章`),c.length>0&&r.push(`全局约束（${c.length}条）`),{lockSection:n,injectedItems:r}}catch(e){return console.error("加载章节锁定模块失败:",e),{lockSection:"",injectedItems:[]}}}(n,o),c=[...i],f=s;try{let e=(0,g.getProjectDataPath)(n,"knowledge","outline.json");if(p.default.existsSync(e)&&o){let t=JSON.parse(p.default.readFileSync(e,"utf-8")),r=null,n=null;for(let e of t.volumes||[])for(let t of e.chapters||[])t.chapterNum===o&&(n=t),t.chapterNum===o+1&&(r=t);let a=[];if(r){if(a.push(`以下内容属于第${o+1}章"${r.title||""}"，本章绝对不得提前揭露或暗示：`),r.plotPoints&&r.plotPoints.length>0)for(let e of r.plotPoints.slice(0,3))a.push(`- 禁止涉及：${"string"==typeof e?e.substring(0,80):String(e).substring(0,80)}`);r.endHook&&a.push(`- 禁止提前揭露下章悬念：${String(r.endHook).substring(0,80)}`)}n&&n.keyCharacters&&n.keyCharacters.length>0&&(a.push(""),a.push(`【角色出场铁律】本章允许出场的角色仅限：${n.keyCharacters.join("、")}。`),a.push("除上述角色外，任何其他角色都不得在本章出现。不得有台词、不得有动作描写、不得有视角段落、不得有内心独白。"),a.push("即便前文中已经出现的常驻角色（如团队成员），如果不在上述名单中，本章也绝对不可让其出场或说话。"),a.push("如果剧情需要表达分析或推理，全部由keyCharacters中的角色独自完成，不得借用未授权角色之口。")),a.length>0&&(f+="=== 本章禁区（绝对不可违反） ===\n\n",f+=a.join("\n"),f+="\n\n=== 本章禁区结束 ===\n\n",c.push("本章禁区"))}}catch(e){console.error("构建本章禁区失败:",e),c.push("本章禁区: 构建失败")}try{if(o){let e=P(n,o,3);if(e.length>0){let t=j(e);f+="\n\n"+t,c.push(`角色状态追踪(${e.length}个角色)`)}}}catch(e){console.warn("[知识注入] 角色状态加载失败，跳过:",e)}try{let e=(0,r.getProjectMetaPath)(n),t=JSON.parse(p.default.readFileSync(e,"utf-8"));f+=`=== 作品设定 ===
作品简介：${t.synopsis||"无"}
文风要求：${t.styleDescription||"无"}

`,c.push("作品设定")}catch{c.push("作品设定: 获取失败")}try{let e=function(e,t){let{characters:r,globalRules:n,worldSettings:a}=function(e){let t=(0,g.getProjectDataPath)(e,"knowledge","bible.sqlite");if(!p.default.existsSync(t))return{characters:[],globalRules:[],worldSettings:[]};try{let e=new C.default(t,{readonly:!0}),r=e.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(e=>e.name),n={characters:[],globalRules:[],worldSettings:[]};return r.includes("characters")&&(n.characters=e.prepare("SELECT * FROM characters ORDER BY createdAt DESC").all()),r.includes("global_rules")&&(n.globalRules=e.prepare("SELECT * FROM global_rules ORDER BY priority DESC").all()),r.includes("world_settings")&&(n.worldSettings=e.prepare("SELECT * FROM world_settings ORDER BY createdAt DESC").all()),e.close(),n}catch(e){return console.error("读取项目圣经数据失败:",e),{characters:[],globalRules:[],worldSettings:[]}}}(e),o="";if(r.length>0){o+="=== 角色圣经（项目数据库） ===\n\n";let e=r.filter(e=>t.includes(e.name)||"主角"===e.role);for(let t of e.length>0?e:r.slice(0,3))o+=`【${t.name}】
`,t.aliases&&(o+=`- 别名: ${t.aliases}
`),(t.gender||S(t.name))&&(o+=`- 性别: ${t.gender||S(t.name)}
`),t.role&&(o+=`- 角色: ${t.role}
`),t.appearance&&(o+=`- 外貌: ${t.appearance}
`),t.background&&(o+=`- 背景: ${t.background}
`),t.personality&&(o+=`- 性格: ${t.personality}
`),t.speechStyle&&(o+=`- 语言风格: ${t.speechStyle}
`),t.behaviorRules&&(o+=`- 行为铁律: ${t.behaviorRules}
`),t.growthArc&&(o+=`- 成长弧光: ${t.growthArc}
`),t.currentStatus&&(o+=`- 当前状态: ${t.currentStatus}
`),t.sampleDialogue&&(o+=`- 典型对话: ${t.sampleDialogue}
`),t.keyEvents&&(o+=`- 关键事件: ${t.keyEvents}
`),o+="\n"}if(n.length>0)for(let e of(o+="=== 全局规则（必须遵守） ===\n\n",n))o+=`【${e.title}】
${e.content}

`;if(a.length>0)for(let e of(o+="=== 世界设定 ===\n\n",a))o+=`【${e.name}】
`,e.category&&(o+=`- 类别: ${e.category}
`),e.volume&&(o+=`- 卷册: ${e.volume}
`),e.description&&(o+=`- 描述: ${e.description}
`),e.currentStatus&&(o+=`- 当前状态: ${e.currentStatus}
`),o+="\n";return o}(n,a);if(e)f+=`${e}

`,c.push("角色圣经(项目数据库)");else{let e=await u();e&&!e.includes("【角色圣经·核心摘要（写手与审核共用）】")&&(f+=`${e}

`,c.push("角色圣经(全局)"))}}catch(e){console.error("获取角色圣经失败:",e);try{let e=(0,t.loadCharacters)(n);if(e.characters&&e.characters.length>0){let t=e.characters.filter(e=>a.includes(e.name));t.length>0&&(f+="=== 角色圣经 ===\n",t.forEach(e=>{f+=`${e.name} | 性格：${e.personality||"无"} | 语言习惯：${e.speakingStyle||"无"} | 当前状态：${e.currentStatus||"无"}
`}),f+="\n",c.push("角色圣经(项目级)"))}}catch{c.push("角色圣经: 获取失败")}}try{let e=await (0,h.loadFacts)(n);if(e){e.plotRules&&e.plotRules.length>0&&(f+="=== 创作铁律（违反则本章作废） ===\n\n",e.plotRules.forEach((e,t)=>{f+=`${t+1}. ${e}
`}),f+="\n",c.push(`创作铁律（${e.plotRules.length}条）`));let t=e.majorEvents.filter(e=>e.irreversible);t.length>0&&(f+="=== 不可逆事件（已发生，不可撤回） ===\n\n",t.forEach(e=>{f+=`- 卷${e.volume}第${e.chapter}章：${e.event}
`,e.affectedCharacters&&e.affectedCharacters.length>0&&(f+=`  影响角色：${e.affectedCharacters.join("、")}
`)}),f+="\n",c.push(`不可逆事件（${t.length}条）`)),e.revealedInfo&&e.revealedInfo.length>0&&(f+="=== 已揭示信息（读者已知，不可矛盾） ===\n\n",e.revealedInfo.forEach(e=>{f+=`- 卷${e.volume}第${e.chapter}章：${e.info}
`,e.note&&(f+=`  备注：${e.note}
`)}),f+="\n",c.push(`已揭示信息（${e.revealedInfo.length}条）`))}}catch(e){console.error("获取 facts.json 失败:",e),c.push("facts.json: 获取失败")}try{let e=(0,t.loadWorldbuilding)(n),r=Object.entries(e).filter(([e,t])=>!["updatedAt","blocksUpdatedAt"].includes(e)&&t&&"string"==typeof t&&""!==t.trim());r.length>0&&(f+="=== 世界观 ===\n",r.forEach(([e,t])=>{f+=`${({worldBackground:"世界背景",powerSystem:"力量体系",factions:"势力分布",locations:"地点设定",items:"物品设定",rulesAndTaboos:"规则与禁忌"})[e]||e}：${t}
`}),f+="\n",c.push(`世界观（${r.length}个字段）`))}catch(e){console.error("获取世界观失败:",e),c.push("世界观: 获取失败")}if(o&&o>1)try{let e=[];for(let t=Math.max(1,o-5);t<o;t++){let r=function(e,t){try{let r=(0,g.getProjectDataPath)(e,"chapters",`${t}.json`);if(!p.default.existsSync(r))return null;let n=JSON.parse(p.default.readFileSync(r,"utf-8")),a=n.content||"",o=n.title||`第${t}章`;if(!a)return null;return{title:o,ending:a.slice(-3e3)}}catch{return null}}(n,t);r&&e.push({chapterNum:t,title:r.title,ending:r.ending})}if(e.sort((e,t)=>e.chapterNum-t.chapterNum),e.length>0){for(let t of(f+="=== 前文衔接（用于保持风格和剧情连贯） ===\n\n",e))f+=`【第${t.chapterNum}章 ${t.title}】（尾部摘录）
`,f+=`${t.ending}

`;f+="=== 前文衔接结束 ===\n\n",c.push(`前文衔接（${e.length}章）`)}}catch(e){console.error("获取前文上下文失败:",e),c.push("前文衔接: 获取失败")}if(Math.floor(1.5*f.length)>l){let e=[],t=f.match(/(=== 📌 章节写作锁定指令[\s\S]*?=== 锁定指令结束 ===\n\n)/),r=t?t[1]:"",n=f.match(/(=== 全局约束 ===[\s\S]*?=== 全局约束结束 ===\n\n)/),a=n?n[1]:"",o=f.match(/(=== 创作铁律（违反则本章作废） ===[\s\S]*?\n\n)/),s=o?o[1]:"",i=f.match(/(=== 作品设定 ===[\s\S]*?\n\n)/),u=i?i[1]:"",h=f.match(/(=== 不可逆事件（已发生，不可撤回） ===[\s\S]*?\n\n)/),p=h?h[1]:"",g=f.match(/(=== 已揭示信息（读者已知，不可矛盾） ===[\s\S]*?\n\n)/),m=g?g[1]:"",d=f.match(/(=== 角色圣经[\s\S]*?\n\n(?==== |$))/),S=d?d[1]:"",y=f.match(/(=== 世界观 ===[\s\S]*?\n\n)/),$=y?y[1]:"",w=f.match(/(=== 前文衔接（用于保持风格和剧情连贯） ===[\s\S]*?=== 前文衔接结束 ===\n\n)/),N=w?w[1]:"";r&&e.push({content:r,priority:1,name:"章节锁定"}),a&&e.push({content:a,priority:1,name:"全局约束"}),s&&e.push({content:s,priority:1,name:"创作铁律"}),u&&e.push({content:u,priority:2,name:"作品设定"}),p&&e.push({content:p,priority:2,name:"不可逆事件"}),m&&e.push({content:m,priority:2,name:"已揭示信息"}),S&&e.push({content:S,priority:3,name:"角色圣经"}),$&&e.push({content:$,priority:3,name:"世界观"}),N&&e.push({content:N,priority:4,name:"前文衔接"}),e.sort((e,t)=>e.priority-t.priority);let b="",P=0,j=[];for(let t of e){let e=Math.floor(1.5*t.content.length);if(P+e<=l)b+=t.content,P+=e;else if(1===t.priority)b+=t.content,P+=e;else{let e=l-P;if(e>500){let r=Math.floor(e/1.5),n=t.content.split("\n"),a=n.slice(0,Math.floor(n.length*r/t.content.length)).join("\n")+"\n\n";b+=a,P+=Math.floor(1.5*a.length),j.push(`${t.name}(部分)`)}else j.push(t.name)}}f=b,j.length>0&&c.push(`(已裁剪: ${j.join("、")})`)}return{systemPromptAddition:f,injectedItems:c}}let A=new Set(["的","了","在","是","和","与","或","但","也","都","就","会","能","要","把","被","让","给","从","到","对","向","为","以","而","又","却","这","那","之","其","及","于","则","乃","至","若","如","等","着","吗","呢","吧","啊","呀","哦","嗯","哈","啦","嘛","个","们","中","里","上","下"]);async function L(e,t,r,n){let a="";try{a=await (0,h.formatFactsAsConstraints)(e)}catch(e){console.warn("[StoryGuard] Layer 1 获取失败:",e)}[].push(a);let o=18e3-a.length;if(o<=0)return a;let l=Math.min(3e3,Math.floor(.25*o)),s="";try{let t=(0,g.getProjectDataPath)(e,"knowledge","bible.sqlite");if(p.default.existsSync(t)){let e=new C.default(t,{readonly:!0});if(e.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().some(e=>"characters"===e.name)){let t=e.prepare("SELECT name, role, personality, currentStatus FROM characters ORDER BY createdAt").all();if(t.length>0){let e=["■ 角色快照"];for(let r of t){let t=`  ${r.name}(${r.role})：${(r.personality||"").slice(0,60)}｜${(r.currentStatus||"").slice(0,40)}`;e.push(t)}(s=e.join("\n")).length>l&&(s=s.slice(0,l))}}e.close()}}catch(e){console.warn("[StoryGuard] Layer 3 获取失败:",e)}let i=Math.min(2e3,Math.floor(.15*(o-=s.length))),c="";try{let n=["■ 套路检测警告"],a=!1,o=(0,g.getProjectDataPath)(e,"knowledge","outline.json");if(p.default.existsSync(o)){let l=JSON.parse(p.default.readFileSync(o,"utf-8")),s=[];for(let e of l.volumes||[])if(e.volumeNum===t)for(let t of e.chapters||[])t.chapterNum<r&&t.rawContent&&s.push({chapterNumber:t.chapterNum,chapterNum:t.chapterNum,rawContent:t.rawContent});let i=await (0,h.loadFacts)(e);if(i&&i.patternKeywords&&Object.keys(i.patternKeywords).length>0){let e={};for(let[t,r]of Object.entries(i.patternKeywords))try{let n=RegExp(t,"g"),a=[];for(let e of s){let t=e.rawContent.match(n);t&&t.length>0&&a.push(e.chapterNum)}a.length>0&&(e[r]={count:a.length,chapters:a})}catch{}let t=Object.entries(e).filter(([,e])=>e.count>2);if(t.length>0)for(let[e,r]of(a=!0,t)){let t=r.chapters.slice(0,5).join("、");n.push(`  [关键词匹配] "${e}" 模式已在本卷出现 ${r.count} 次（第${t}章${r.chapters.length>5?"等":""}），请避免继续使用`)}}if(s.length>=2){let e=function(e,t=.4){let r=[];if(e.length<2)return r;let n=e.map(e=>{var t;return{chapterNumber:e.chapterNumber,elements:(t=e.rawContent)?new Set(t.replace(/[，。！？；：、""''（）《》【】\s]+/g," ").split(" ").filter(e=>e.length>=2).filter(e=>!A.has(e))):new Set}});for(let e=0;e<n.length;e++)for(let a=e+1;a<n.length;a++){let o=n[e].elements,l=n[a].elements,s=function(e,t){if(0===e.size&&0===t.size)return 0;let r=new Set([...e].filter(e=>t.has(e))),n=new Set([...e,...t]);return r.size/n.size}(o,l);if(s>=t){let t=[...o].filter(e=>l.has(e)).slice(0,5);r.push({chapterA:n[e].chapterNumber,chapterB:n[a].chapterNumber,similarity:s,sharedElements:t})}}return r.sort((e,t)=>t.similarity-e.similarity),r}(s,.4);if(e.length>0)for(let t of(a=!0,e.slice(0,3))){let e=(100*t.similarity).toFixed(0),r=t.sharedElements.join("、");n.push(`  [结构雷同] 第${t.chapterA}章与第${t.chapterB}章情节相似度 ${e}%（共有要素：${r}），建议差异化处理`)}}}a&&(c=n.join("\n")).length>i&&(c=c.slice(0,i))}catch(e){console.warn("[StoryGuard] Layer 4 获取失败:",e)}o-=c.length;let u="";try{let n=(0,g.getProjectDataPath)(e,"knowledge","outline.json");if(p.default.existsSync(n)){let e=JSON.parse(p.default.readFileSync(n,"utf-8")),a=["■ 剧情摘要"];for(let r of e.volumes||[])if(r.volumeNum===t-1){let e=(r.chapters||[]).sort((e,t)=>e.chapterNum-t.chapterNum).slice(-5);if(e.length>0)for(let t of(a.push(`  [前卷末尾]`),e)){let e=t.plotSummary||t.rawContent?.slice(0,80)||"";a.push(`  第${t.chapterNum}章 ${t.title}：${e.slice(0,80)}`)}}for(let n of e.volumes||[]){if(n.volumeNum!==t)continue;let e=(n.chapters||[]).filter(e=>e.chapterNum<r).sort((e,t)=>e.chapterNum-t.chapterNum);if(e.length>0)for(let t of(a.push(`  [本卷已有章节]`),e)){let e=t.rawContent||t.plotSummary||"";a.push(`  第${t.chapterNum}章 ${t.title}：${e.slice(0,100)}`)}}(u=a.join("\n")).length>o&&(u=u.slice(0,Math.max(0,o)))}}catch(e){console.warn("[StoryGuard] Layer 2 获取失败:",e)}return[a,s,c,u].filter(Boolean).join("\n\n")}e.s(["assembleStoryGuardContext",()=>L,"buildKnowledgeContext",()=>k],50141)}];

//# sourceMappingURL=novel-workshop_app_lib_knowledgeInjector_ts_e767c0a5._.js.map