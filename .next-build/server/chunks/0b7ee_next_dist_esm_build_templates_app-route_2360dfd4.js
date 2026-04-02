module.exports=[23618,e=>{"use strict";var t=e.i(46821),n=e.i(73489),o=e.i(62184),r=e.i(14679),a=e.i(18903),s=e.i(22196),l=e.i(24e3),i=e.i(49439),c=e.i(10138),u=e.i(372),p=e.i(11032),d=e.i(9628),h=e.i(38596),g=e.i(21036),f=e.i(51298),m=e.i(93695);e.i(40077);var y=e.i(60191);e.i(22523);var $=e.i(80567),S=e.i(2157),k=e.i(50227),w=e.i(78747),C=e.i(79904);let x=`
任务：以网文读者的视角对提交的小说章节给出真实阅读反馈。

反馈维度：

一、第一印象
- 开头是否吸引你继续读下去
- 读完整章的整体感受（一句话概括）

二、情绪体验
- 哪些段落让你觉得兴奋、紧张、感动或好笑（引用原文）
- 哪些段落让你觉得无聊、跳戏或出戏（引用原文）
- 情绪曲线是否流畅，有没有突然断裂的地方

三、角色感受
- 最喜欢本章哪个角色的表现，为什么
- 有没有角色的行为让你觉得"不对劲"或"不像他/她会做的事"

四、节奏与可读性
- 有没有想跳过不读的段落
- 有没有觉得写得太快、该展开没展开的地方
- 对话是否自然，有没有觉得"没有人会这么说话"的台词

五、追读意愿
- 章末看完后想不想点下一章（1-10分）
- 如果不想，是因为什么

六、结构感受
- 开头是紧接着上一章的感觉，还是好像跳了一段、换了个故事
- 本章最大的悬念/转折是在结尾才揭晓的，还是中间就已经知道了（如果中间就知道了，结尾就没劲了）
- 有没有某个角色突然冒出来，之前完全没铺垫，感觉很突兀

输出要求：
- 用口语化的方式写，像一个真实读者在评论区留言
- 不要用专业术语，不要像编辑一样说话
- 每个维度2-3句话即可，不要太长
- 最后给一个总体评分（1-10分）和一句话总结
`,R=`
任务：对提交的网络小说章节进行文学质量与商业性审核，输出审核报告。

审核维度：

一、情节与逻辑审核
1. 情节逻辑：是否存在前后矛盾、因果不成立、时间线混乱
2. 人物行为合理性：角色的行动和反应是否符合其已建立的性格和动机
3. 细纲覆盖度：对照提供的章节细纲，检查mustInclude条目是否全部体现在正文中，列出已覆盖和未覆盖的条目
4. 数据一致性：金额、时间、人名、地名等细节是否前后一致
5. 时空连贯性：场景转换是否自然，时间流逝是否合理

二、文笔与风格审核
1. 语言质量：是否有病句、错别字、标点错误
2. 中文表达：是否自然流畅，有没有翻译腔或AI味（如"不禁"、"仿佛"、"宛如"过度使用）
3. 叙述节奏：描写与对话的比例是否合理，有没有大段无对话的叙述或大段无描写的对白
4. 重复检测：同一个词语、句式、修辞是否在短距离内反复出现
5. 角色辨识度：不同角色的说话方式是否有区分，能否通过对话判断说话人

三、商业性与可读性审核
1. 爽感节奏：每800-1000字是否至少有一个小转折或情绪波动，有没有超过1500字的平淡段落
2. 爽感类型：本章的爽感类型是什么（如打脸反转、实力碾压、反差萌、情感爆发等），与最近3章是否重复
3. 钩子强度：章末悬念是否足够强，读者看完最后一句是否有"必须点下一章"的冲动
4. 开头吸引力：前200字是否能抓住读者注意力
5. 信息密度：是否有无意义的水字数段落

四、结构合规性审核（一票否决项）
1. 开头承接：正文前300字是否直接承接了上一章结尾的场景/情绪/悬念？是否存在凭空跳转到全新场景的情况？
2. endHook定位：对照细纲中的endHook描述，该内容是否出现在正文最后500字以内（章末板块之前）？如果endHook内容出现在正文中段或开头，这是严重结构错误。
3. 角色出场合规：列出正文中所有拥有台词或独立动作描写的角色名，对照细纲keyCharacters名单，检查是否有未授权角色出场。
4. 信息配额：正文是否揭露了细纲plotPoints和mustInclude之外的重大信息或剧情转折？
5. plotPoints执行顺序：细纲中的plotPoints是否按给定顺序在正文中展开？是否有颠倒或遗漏？

输出格式（三个模块，不可合并）：

1️⃣ 情节与逻辑
- 细纲覆盖：已覆盖 [列出] / 未覆盖 [列出]
- 逻辑问题：[具体描述，无则写"未发现"]
- 人物一致性问题：[具体描述，无则写"未发现"]

2️⃣ 文笔与风格
- 错别字/病句：[原文 → 修改建议，无则写"未发现"]
- AI味/套路化表达：[列出具体例句，无则写"未发现"]
- 重复问题：[列出重复词句，无则写"未发现"]
- 角色辨识度：[评价]

3️⃣ 商业性与可读性
- 爽感节奏：转折点 [X] 个，平淡段落 [位置描述]
- 爽感类型：[类型名称]，是否与近期重复：[是/否]
- 钩子强度：[强/中/弱] — [简评]
- 开头吸引力：[强/中/弱] — [简评]

4️⃣ 结构合规性（一票否决）
- 开头承接：[合规/不合规] — [简评]
- endHook定位：[合规/不合规] — endHook内容出现在正文第___字处（全文共___字），位于全文的___%位置
- 角色出场：正文中有台词/动作的角色 [列出] / 细纲keyCharacters [列出] / 未授权出场角色 [列出，无则写"无"]
- 信息配额：[合规/不合规] — [具体描述]
- plotPoints顺序：[合规/不合规] — [具体描述]

总评：[A/B/C/D] — [一句话总结]

注意：如果4️⃣结构合规性中任何一条为"不合规"，总评不得高于C级，且必须在修改建议第一条标注为"结构性硬伤，必须修改"。

修改建议（如有）：
- [按优先级列出1-3条最重要的修改建议]
`;var v=e.i(76257),P=e.i(81916),O=e.i(50141),N=e.i(77141);async function b(e,t){if(!e.trim())return e;let n=`你是一个小说创作指令优化器。

用户写了以下创作指令，其中可能包含"不要做什么"的否定表述。
请将每一条否定指令转化为具体的正面行为描述，使AI写手更容易精确执行。

转化原则：
1. 把"不要X"变成"要做Y"，Y是X的具体替代行为
2. 保留原始意图，不曲解
3. 越具体越好，具体到可观测的文本特征（如句式、视角、是否包含内心独白等）
4. 对于已经是正面表述的指令，保持原样不改
5. 特别注意：禁止使用"不再像以前一样""她没有像往常那样"等否定对比句式——这种句式本身就是在用否定的方式重复不想要的内容。转化时要明确禁止此类句式。

转化示例：

输入："魏莱不迪化"
输出："魏莱在本章的所有段落中只包含对白和肢体动作描写。不为她书写任何内心独白、心理分析、或对他人动机的推测。她的反应完全通过外在行为呈现。禁止使用'她没有像往常一样''这一次她不再'等否定对比句式。"

输入："严禁旁白直接点明'他变了'"
输出："角色的转变只通过行为差异和对白内容让读者自行感知。叙述视角保持客观外部观察，第三人称叙述中不出现对角色心理变化的总结性陈述。禁止以下句式：'他变了''她意识到''这一刻他不再是从前的他''往常他会……但这次'。"

输入："马修不是脸谱化反派，他有自己的专业信仰"
输出："马修\xb7科尔的开场段落必须展示其专业能力和内在逻辑的自洽性。他真心相信市场机制能最优配置资源，包括粮食。他的台词体现冷静的专业分析，不包含对主角的嘲讽、人身攻击或傲慢的炫耀。他的崩溃来自其世界观被事实击穿（非理性行为突破了模型边界），而非被主角的力量或气势压倒。读者在他崩溃时应感到一丝理解甚至惋惜，而非痛快。"

现在请转化以下指令（保留正面表述，只转化否定表述）：

${e}`;try{let o=await t(n);return`【优化后的创作指令】
${o.trim()}

【原始指令（参考）】
${e}`}catch{return e}}async function A(e,t,n){if(!e.trim())return t;let o=`分析以下章节方向，判断本章是否包含反派、对手、敌方角色的视角或重要戏份。
如果包含，提取这些角色的名字和身份。

只返回 JSON 格式（不要输出其他内容）：
{"has_antagonist": true或false, "characters": [{"name": "角色名", "identity": "身份描述"}]}

章节方向：
${e}`;try{let e=(await n(o)).match(/\{[\s\S]*\}/);if(!e)return t;let r=JSON.parse(e[0]);if(!r.has_antagonist||!Array.isArray(r.characters)||0===r.characters.length)return t;return r.characters.map(e=>`
【${e.name}的角色塑造要求】
${e.name}（${e.identity}）不是用来被打脸的工具人。请遵循以下原则：
- 他/她的开场必须展示专业能力或内在逻辑的自洽性，让读者理解（虽然不认同）他/她的立场
- 他/她的台词体现冷静的专业判断，不包含对主角的嘲讽、人身攻击或夸张的傲慢炫耀
- 如果他/她最终失败/崩溃，原因是其世界观被事实击穿，而非被主角的力量或气势压倒
- 读者在他/她失败时应感到复杂情绪（理解、惋惜、甚至一丝敬意），而非单纯的痛快
- 禁止以下套路：开场嘲讽主角→中间傲慢自信→结尾震惊打脸
- 替代方案：开场专业冷静→中间发现异常数据→逐步意识到对手的非理性→最终信仰体系被击穿`).join("\n").trim()+"\n\n"+t}catch{return t}}var _=e.i(99596);function H(e){let t=e.length;for(let n of[/【?下[集章]预告】?/,/作者有话说/,/求.{0,6}好评/,/求.{0,6}追读/,/求.{0,6}月票/,/求.{0,6}推荐票/,/稳定[日周]更/,/不断更/,/准时更新/,/感谢.{0,10}(?:打赏|支持|订阅)/]){let o=RegExp(n.source,"g"),r=[...e.matchAll(o)];if(0===r.length)continue;let a=r[r.length-1].index??e.length,s=e.lastIndexOf("\n",a-1);for(-1===s&&(s=0);s>0&&"\n"===e[s-1];)s--;s<t&&(t=s)}return t<e.length?e.slice(0,t).trimEnd():e}function I(e,t){let n=[],o=e.length;for(let r of t){let t=r.text.trim().replace(/^["""''【】]|["""''【】]$/g,""),a=e.indexOf(t);if(-1===a&&(a=e.indexOf(r.text.trim())),-1!==a){if("ending"===r.position){let e=a/o;e<.75&&n.push({type:"ANCHOR_WRONG_POSITION",expected_text:r.text,speaker:r.speaker,position:r.position,actual_position_ratio:e,best_match_ratio:1,message:`endHook内容"${t.substring(0,40)}..."出现在正文${Math.round(100*e)}%处，应在75%之后`})}continue}let s=t.length+20,l=0,i=-1;for(let n=0;n<=Math.max(0,e.length-t.length+20);n++){let o=function(e,t){if(0===e.length||0===t.length)return 0;let n=e.length>t.length?e:t,o=e.length>t.length?t:e,r=0;for(let e=0;e<o.length;e++)n.includes(o[e])&&r++;return r/n.length}(t,e.slice(n,n+s));o>l&&(l=o,i=n)}if(l>=.9){if("ending"===r.position&&-1!==i){let e=i/o;e<.75&&n.push({type:"ANCHOR_WRONG_POSITION",expected_text:r.text,speaker:r.speaker,position:r.position,actual_position_ratio:e,best_match_ratio:l,message:`endHook内容"${t.substring(0,40)}..."出现在正文${Math.round(100*e)}%处，应在75%之后`})}}else n.push({type:"ANCHOR_MISSING",expected_text:r.text,speaker:r.speaker,position:r.position,best_match_ratio:l})}return n}let j=new Map;async function T(e,t){if(j.has(e))return j.get(e);let n=`从以下禁止规则中提取所有可能在小说正文中出现的关键词和同义表述。
包括直接提到的词、同义词、关联词、常见变体。

禁止规则：${e}

只返回 JSON 数组，例如：["华尔街", "灰衣人", "四大粮商"]
不要返回任何解释，只返回 JSON 数组。`;try{let o=(await t(n)).match(/\[[\s\S]*\]/),r=o?JSON.parse(o[0]):[];return j.set(e,r),r}catch{return j.set(e,[]),[]}}async function E(e,t,n){let o=[];for(let r of t){let t=(await T(r,n)).filter(t=>e.includes(t));if(0===t.length)continue;let a=`请判断以下小说正文是否违反了这条禁止规则。

【禁止规则】
${r}

【触发关键词】
${t.join("、")}

【小说正文（节选）】
${e.slice(0,3e3)}

请严格按以下 JSON 格式返回（不要输出其他内容）：
{
  "verdict": "违反" 或 "未违反",
  "quoted_text": "引用正文中违反的具体段落（如未违反则为空字符串）",
  "severity": "严重" 或 "轻微"
}`;try{let e=(await n(a)).match(/\{[\s\S]*\}/);if(!e)continue;let t=JSON.parse(e[0]);"违反"===t.verdict&&o.push({rule:r,evidence:t.quoted_text||"",severity:"严重"===t.severity?"严重":"轻微"})}catch{}}return o}function M(e,t,n){let o=[];for(let r of n){if(!r||r.length<2||t.some(e=>e.includes(r)||r.includes(e)))continue;let n=RegExp(r,"g"),a=e.match(n);if(!a)continue;let s=a.length,l=RegExp(`${r}[：:"""]|${r}(?:说|道|问|喊|叫|笑道|冷笑|低声|轻声|大声|嘟囔|嘀咕|回答|反驳|补充|插嘴|开口|接话|吐槽)`,"g").test(e);o.push({name:r,count:s,hasDialogue:l,severity:l?"hard":"soft"})}return o}function q(e,t,n=.8){let o=e.replace(/【下集预告】[\s\S]*$/,"").replace(/求五星好评[\s\S]*$/,"").replace(/求追读[\s\S]*$/,"").trim().length,r=Math.floor(t*n);return{pass:o>=r,actual:o,minimum:r,ratio:o/t}}function z(e,t,n=""){Array.isArray(t)||(t=[]);let o=[];for(let r of t){if(!r||r.length<2)continue;let t=RegExp(r,"g"),a=e.match(t),s=a?a.length:0,l=n.length>0&&t.test(n);(s>=2||s>=1&&l)&&o.push({pattern:r,countInCurrent:s,foundInPrevious:l,suggestion:s>=2?`"${r}"在本章出现${s}次，建议保留不超过1次`:`"${r}"在前文已出现过，本章再次使用会造成跨章重复`})}return o}function J(e){let t=I(e.manuscript,e.anchors),n=M(e.manuscript,e.keyCharacters,e.allKnownCharacters),o=q(e.manuscript,e.suggestedWordCount),r=Array.isArray(e.patternKeywords)?e.patternKeywords:[],a=z(e.manuscript,r,e.previousChaptersText||""),s=function(e,t){let n=[];for(let o of t.filter(e=>!!(0,_.getPronounRule)(e))){let t=(0,_.getPronounRule)(o);if(t)for(let r of t.wrongPronouns){let a=RegExp(`${o}[，。！？；：、“”"'\\s]{0,12}${r}|${r}[，。！？；：、“”"'\\s]{0,12}${o}`,"g"),s=RegExp(`(?:${o}).{0,20}[说想看盯望听问道喊叫答]?[，。！？；：、“”"'\\s]{0,6}${r}`,"g"),l=[...e.match(a)||[],...e.match(s)||[]].length;l>0&&n.push({character:o,expectedPronoun:t.expectedPronoun,wrongPronoun:r,count:l})}}return n}(e.manuscript,e.keyCharacters),l=[];t.forEach(e=>{("ANCHOR_MISSING"===e.type||"ANCHOR_WRONG_POSITION"===e.type)&&l.push(`endHook_${e.type}: ${e.message||""}`)}),n.filter(e=>"hard"===e.severity).forEach(e=>{l.push(`未授权角色"${e.name}"有对话(${e.count}次)`)}),o.pass||l.push(`字数不足:${o.actual}/${o.minimum}`),s.filter(e=>e.count>=2).forEach(e=>{l.push(`性别代词错误:${e.character}/${e.wrongPronoun}->${e.expectedPronoun}(${e.count}次)`)});let i=0===l.length,c=[];c.push(`endHook:${t.every(e=>"ANCHOR_MISSING"!==e.type&&"ANCHOR_WRONG_POSITION"!==e.type)?"✓":"✗"}`);let u=n.filter(e=>"hard"===e.severity);return c.push(`角色:${0===u.length?"✓":"✗ "+u.map(e=>e.name).join(",")}`),c.push(`性别:${0===s.filter(e=>e.count>=2).length?"✓":"✗ "+s.filter(e=>e.count>=2).map(e=>`${e.character}:${e.wrongPronoun}`).join(",")}`),c.push(`字数:${o.pass?"✓":"✗"} ${o.actual}/${e.suggestedWordCount}`),c.push(`重复:${0===a.length?"✓":"⚠ "+a.map(e=>e.pattern).join(",")}`),{anchorCheck:t,unauthorizedCharacters:n,wordCount:o,patternRepetition:a,genderViolations:s,overallPass:i,summary:`[硬约束] ${i?"PASS":"FAIL"} | ${c.join(" | ")}`}}var K=e.i(41912);let D=w.z.object({text:w.z.string(),speaker:w.z.string().default(""),position:w.z.string().default("")}),U=`【场景描写禁令】
以下场景组合已在近期章节中过度使用，本章严禁出现：
- 反派站在落地窗前俯瞰城市天际线
- 反派端着酒杯（威士忌/波本/红酒/清水）发表冷漠独白
- "纽约/曼哈顿/华尔街"作为反派场景的开头定位词
- "钢铁丛林""冷漠地俯瞰"等固定搭配

反派出场时必须使用差异化场景，例如：会议室内的数据投影、通勤路上的电话指令、健身房里的决策、深夜厨房独处、机场贵宾厅等日常化场景。反派的危险感应通过行为和决策体现，而非通过"高处俯瞰+酒杯"的视觉符号。`,X=w.z.object({step:w.z.coerce.number().int().min(1).max(5).default(1),direction:w.z.string().optional().default(""),outlineContent:w.z.string().optional().default(""),extra:w.z.string().optional().default(""),tab1:w.z.string().optional().default(""),tab2:w.z.string().optional().default(""),tab3:w.z.string().optional().default(""),tab4:w.z.string().optional().default(""),background:w.z.string().optional().default(""),chapterNo:w.z.string().optional().default(""),last3ShuangTypes:w.z.string().optional().default(""),anchorsJson:w.z.string().optional().default(""),forbiddenRules:w.z.string().optional().default(""),projectId:w.z.string().optional().default("")});function G(e,t=800){return e.length<=t?e:`${e.slice(0,t)}
...<截断，原始长度 ${e.length} 字符>`}async function F(t){var n,o,r;let a,s,l,i=await t.json().catch(()=>null),c=X.safeParse(i);if(!c.success)return Response.json({error:"Bad Request",details:c.error.flatten()},{status:400});let{step:u,direction:p,outlineContent:d,extra:h,tab1:g,tab2:f,tab3:m,tab4:y,background:w,chapterNo:j,last3ShuangTypes:T,anchorsJson:F,forbiddenRules:W,projectId:B}=c.data,{model:L,apiKey:V,baseUrl:Y}=(0,C.getModelConfig)(1===u?"初稿":2===u?"读者反馈":3===u?"二稿":4===u?"审核报告":"终稿");if(!V)return Response.json({error:"Missing API Key",hint:"请在 .env.local 中配置对应的 API Key（参考 .env.local.example）后重启 dev server。"},{status:500});let Z=new $.default({apiKey:V,baseURL:Y||"https://api.kuai.host/v1"}),Q=[];if(F)try{let e=JSON.parse(F);Array.isArray(e)&&(Q=e.map(e=>D.safeParse(e)).filter(e=>e.success).map(e=>e.data))}catch{}let ee=W?W.split("\n").map(e=>e.trim()).filter(e=>e.length>0):[],et=await (0,v.getBibleCoreSummary)(B||void 0),en="主角";if(B)try{let e=(0,P.getAllCharacters)(B).find(e=>"主角"===e.role);e?.name&&(en=e.name)}catch{}async function eo(e){let t=await Z.chat.completions.create({model:L,messages:[{role:"user",content:e}],temperature:.3,stream:!0}),n="";for await(let e of t){let t=e.choices[0]?.delta?.content;t&&(n+=t)}return n}async function er(e,t){let n=(0,C.getModelConfig)(t),o=new $.default({apiKey:n.apiKey,baseURL:n.baseUrl||"https://api.kuai.host/v1"}),r=await o.chat.completions.create({model:n.model,messages:[{role:"user",content:e}],temperature:{初稿:.8,读者反馈:.3,二稿:.8,审核报告:.3,终稿:.7}[t],max_tokens:{初稿:8e3,读者反馈:2e3,二稿:8e3,审核报告:3e3,终稿:8e3}[t],stream:!1});return r.choices[0]?.message?.content||""}let ea=`你是一位网文职业写手。你的任务是根据用户给定的"章节方向"，写出可直接发布的小说章节正文。

写作要求：
- 中文输出
- 叙事清晰、节奏快、对话自然
- 每200~400字给出一个推进点（信息/冲突/反转/爽点/悬念）
- 只输出正文，不要输出提纲或解释


${et}

【章节结构铁律（违反任何一条则本章作废）】

1. 开头300字必须直接承接上一章结尾的场景、情绪或悬念，不得凭空开启全新场景。如果上下文中提供了"上一章结尾摘录"或"上一章下集预告"，开头必须与之呼应。
2. 细纲中的endHook内容必须出现在正文最后500字以内（章末板块之前）。endHook是本章的最后一个叙事动作，绝对不得提前到章节中段或开头使用。章末板块之前的最后一段文字，必须是endHook描述的场景或台词。
3. 细纲中的plotPoints必须按给定顺序展开，不得颠倒先后顺序。第一条plotPoint对应章节前段，最后一条plotPoint对应章节后段。
4. 角色出场硬性限制——只有细纲keyCharacters中明确列出的角色才能在本章拥有以下任何一项：台词（直接引语或间接引语）、动作描写、视角段落、内心独白。未列入keyCharacters的角色在本章中完全不可出场。即使你认为某个角色出现会让情节更丰富，也绝对不可以让其出场。这是与endHook定位同等优先级的铁律。
5. 不得在本章正文中揭露或暗示细纲plotPoints和mustInclude之外的重大信息或剧情转折。如果你的推理能力让你预判到了后续剧情发展，也不要写入本章。严格只写细纲给定的内容。
6. 如果上下文中提供了"本章禁区"信息，其中列出的内容绝对不可在本章出现。
8. 【字数下限】每章正文字数不得低于细纲建议字数的 85%。如果细纲建议 3000 字，则正文至少 2550 字。宁可多写不可少写。当你感觉"写完了"时，检查是否每个情节点都有足够的场景细节、对话和心理活动，如果某个情节点只用了一两句话带过，必须展开。
9. 【情感弧线展开】细纲中标注的情绪弧线每个阶段至少需要 1-2 段文字来呈现。不可跳过任何情绪转折点。特别是"动摇"、"犹豫"、"恐惧"等内向情绪，必须通过内心独白或具体生理反应（如呼吸加快、手指停顿、视线回避）来表现，不可用旁白式总结一笔带过。
10. 【角色性别一致性】严格遵守角色的性别设定。男性角色使用"他"，女性角色使用"她"。以下是核心角色性别表，不得违反：
- 秦刃（男/他）、林桐（男/他）、郑维（男/他）、陆鸣远（男/他）、方远（男/他）、周翰（男/他）、沈明哲（男/他）、王建国（男/他）、陈律师（男/他）、林正阳（男/他）
- 苏可（女/她）、赵谦（女/她）
- M-0（AI系统/它）
如果不确定角色性别，使用角色名而非代词。绝对不允许在同一章中对同一角色混用"他"和"她"。

【章末板块必须严格按模板输出】
- 章末板块必须放在全文最后。
- 总字数≤150字。
- 不得出现章节序号、章节名、角色小剧场、作者抒情。
- 不可省略标签，不可改写标签，不可合并为一段。
- 互动引导不得使用括号包裹。

章末板块必须严格使用以下格式输出，不可省略标签，不可合并为一段（括号内提示不要原样输出，要替换为真实内容；换行与空行必须一字不差）：

【下集预告】
（1-2句画面/台词钩子）

（1句互动引导，不要用括号包裹）

【章末板块示例】
正确示范：
【下集预告】
魏莱建议定价一万。李弈摇了摇头，说出了一个让全场心脏骤停的数字。

求五星好评、求追读，稳定日更不断更。

错误示范（禁止）：
- 与本章剧情无关的悬疑句
- 用括号包裹互动引导
- 超过150字
- 出现章节名或章节序号

你必须严格按"正确示范"的结构输出章末板块：
1）只出现一次"【下集预告】"标签；
2）预告=1~2句与本章强相关的具体画面/台词钩子；
3）互动引导=单独一行、无括号、简短有力。`;function es(e,t){if(!e||0===e.trim().length)throw Error(t);return e}function el(e){let t=[/【章末钩子】\s*\n([^\n【]+(?:\n(?!【|\n)[^\n【]+)*)/,/【章末钩子】\s*[:：]?\s*([^\n]+)/,/endHook\s*[:："“”']\s*([^\n"”']+)/i];for(let n=0;n<t.length;n++){let o=t[n],r=e.match(o);if(!r||!r[1])continue;let a=r[1].trim();if(a.length>10&&!/^[（(].*不要|^不得|^禁止|^请勿|不要提前/.test(a))return{text:a,source:`正则#${n+1}`}}return{text:"",source:""}}let ei=null,ec="",eu="",ep=!1,ed=3e3,eh="",eg={1:.8,2:.3,3:.8,4:.3,5:.7}[u]??.8,ef={1:8e3,2:2e3,3:8e3,4:3e3,5:8e3}[u]??8e3,em=j&&parseInt(String(j).replace(/[^0-9]/g,""),10)||void 0;if(1===u){let t="";try{let e=B||"";if(e&&em){let n=await (0,N.getVolumeByChapter)(e,em);null!==n&&(t=await (0,O.assembleStoryGuardContext)(e,n,em,em))}}catch(e){console.warn("[write] StoryGuard 上下文获取失败，跳过:",e)}let n="";try{let e=await (0,O.buildKnowledgeContext)({projectId:B||"",chapterDirection:p||"",chapterNo:em});n=e.systemPromptAddition,ei=e}catch(e){console.error("知识库注入失败:",e)}let o=[t,n].filter(Boolean).join("\n\n---以下是知识库参考信息---\n\n");ec=ea+(o?`

${o}`:"");let r=h||"";if(r.trim()&&(r=await b(r,eo)),r=await A(p,r,eo),d&&d.trim()){let t="",n="",o="";try{console.log("[Step1细纲诊断] 尝试JSON解析，outlineContent前200字:",d.substring(0,200));let e=JSON.parse(d);eh=e.endHook||"",t=e.connectionToPrev||"",Array.isArray(e.keyCharacters)&&(n=e.keyCharacters.join("、")),Array.isArray(e.plotPoints)&&(o=e.plotPoints.map((e,t)=>`${t+1}. ${e}`).join("\n"))}catch{console.log("[Step1细纲诊断] JSON解析失败，尝试正则提取。outlineContent前200字:",d.substring(0,200));let r=el(d);r.text?(eh=r.text,console.log("[Step1细纲诊断] endHook提取成功，来源:"+r.source+"，内容:",eh.substring(0,80))):console.log("[Step1细纲诊断] endHook正则提取失败");let a=d.match(/【与上一章(?:的)?衔接】\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/)||d.match(/connectionToPrev["""：:]\s*(.+?)(?:\n|$)/i);a&&(t=a[1].trim());let s=d.match(/【关键角色】\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/);s&&!n&&(n=s[1].trim());let l=d.match(/【(?:关键)?情节点】\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/);if(l&&!o&&(o=l[1].trim()),(!eh||eh.length<10)&&j)try{let t=await e.A(23970),n=await e.A(89793),o=n.join(process.cwd(),"data","projects");if("string"==typeof B&&B){let e=parseInt(String(j).replace(/[^0-9]/g,""),10),r=n.join(o,B,"knowledge","outline.json");if(t.existsSync(r))for(let n of JSON.parse(t.readFileSync(r,"utf-8")).volumes||[])for(let t of n.chapters||[])t.chapterNum===e&&t.endHook&&(eh=t.endHook,console.log("[endHook兜底] 从outline.json成功读取endHook:",eh.substring(0,60)))}}catch(e){console.log("[endHook兜底] 读取outline.json失败:",e)}}let a=d.match(/(?:字数建议|suggestedWordCount|建议字数)[""":：]*\s*(\d+)/i);a&&(ed=parseInt(a[1],10));let s=ed-300-500,l=o?o.split(/\n/).filter(e=>e.trim().length>0):[],i=l.length>0?Math.floor(s/l.length):s,c=`

【正文骨架（严格按以下结构和顺序输出，禁止调换段落顺序，禁止合并或跳过任何段落）】
`;c+=`
=== 第一段：开头承接（约300字）===
承接内容：${t||"自然承接上章结尾"}
要求：直接从上章结尾的场景或情绪切入，不要时间跳跃，不要用"X天后"开头。
`,l.length>0&&l.forEach((e,t)=>{let n=e.replace(/^\d+[.、)\]]\s*/,"").trim();n&&(c+=`
=== 第${t+2}段：${n}（约${i}字）===
要求：完整展开此情节点。必须包含以下至少两项：具体的场景描写（环境、光线、声音）、至少一轮对话、一段内心独白、角色的肢体动作或微表情。不可一两句话带过。
`)}),c+=`
=== 最后一段：章末收束（约500字，必须包含 endHook）===
endHook 原文：${eh||"按细纲章末钩子写"}
要求：将 endHook 自然融入叙事，作为本章最后的悬念或转折。endHook 的核心语句必须出现在正文的最后 500 字内。

【总字数目标】${ed}字（允许浮动范围：${Math.floor(.85*ed)}-${Math.ceil(1.1*ed)}字）
`,console.log("[Step1骨架] plotPoints数量:",l.length,"目标字数:",ed,"每段配额:",i),eu=`【本章细纲（必须严格遵循）】
${d}

【结构执行指令（与细纲同等优先级）】

一、开头段（前300字）：
${t?`- 本章承接点：${t}`:"- 请根据细纲中的connectionToPrev自然衔接上一章结尾"}
- 开头第一个场景必须与上一章结尾呼应，不得凭空跳转

二、中段主体：
${c}
- mustInclude中的每一项都必须在正文中体现
- 不要自行添加细纲未提及的重大剧情转折
${n?`- 【铁律】允许出场的角色仅限：${n}。除这些角色外，任何其他角色不得在本章出现、说话或有动作描写。这是不可违反的硬性规定。`:""}

三、结尾段（最后500字，章末板块之前）：
${eh?`- 本章结尾的最后一个叙事动作必须是：
"${eh}"
- 这段内容必须出现在正文最后500字以内，紧接在章末板块之前。不得将此内容提前到中段使用。`:"- 严格按照细纲中的endHook作为本章最后一个叙事动作，出现在正文最后500字以内"}

特殊指令（可选）：
${r||"无"}`}else eu=`章节方向：
${es(p,"Step1：章节方向不能为空")}

【字数目标】请写出至少 2500 字的正文。每个场景至少包含环境描写、对话和心理活动三个要素。不要写完核心情节就停下，要充分展开每个场景。

特殊指令（可选）：
${r||"无"}`;ep=!0}else if(2===u)ec=x,eu=es(g,"Step2：需要Tab1初稿内容作为输入"),ep=!1;else if(3===u)ec=ea,es(g,"Step3：需要Tab1初稿内容作为输入"),es(f,"Step3：需要Tab2读者反馈作为输入"),eu=`【初稿】
${g}

【读者反馈】
${f}

固定指令：
根据读者反馈，重点修改'划走预警'标注的段落。保持其余部分不变。不要重写全文。`,ep=!0;else if(4===u){ec=R,es(m,"Step4：需要Tab3二稿内容作为输入");let e=`小说背景： ${w||"未提供"}
当前章节序号： ${j||"未提供"}
近3章爽感类型： ${T||"未提供"}`,t=`

【额外审核要求】
请检查正文中是否出现以下套路化表达（或其同义变体），如果出现请在审核报告中标记为"套路化表达"类型的问题并建议替换：
瞳孔骤缩、嘴角勾起弧度、倒吸冷气、指节泛白、冷汗浸透衬衫、摇晃高脚杯/红酒杯、声音平静得可怕、目光如炬、全场死寂针落可闻、高深莫测、不容置疑、单独成段的拟声词（如"轰——！"）`,n="";d&&d.trim()?n=`

【本章细纲（审核对照基准）】
${d}`:p&&p.trim()&&(n=`

【章节方向（审核对照基准）】
${p}`),console.log("=== Step 4 细纲注入诊断 ==="),console.log("outlineContent 是否存在:",!!d,"长度:",d?.length||0),console.log("direction 是否存在:",!!p,"长度:",p?.length||0),console.log("outlineBlock 内容:",n?.substring(0,200)||"空"),eu=`请按你的Initialization要求先读元信息，再审稿。

${e}

${et}${n}${t}

【正文（二稿）】
${m}`,ep=!1}else 5===u&&(ec=ea,es(m,"Step5：需要Tab3二稿内容作为输入"),es(y,"Step5：需要Tab4审核报告作为输入"),eu=`【二稿】
${m}

【审核报告】
${y}

固定指令：
根据审核报告做最终修正。红线问题必改，逻辑硬伤必改，润色建议参考执行。不要改动审核未标记的段落。不要重写全文。`,ep=!0);(1===u||3===u||5===u)&&(ec+="\n\n【字数要求】本章正文2000-3500字。情节紧凑推进，不要为凑字数而添加无关描写。每个情节点自然展开即可，重点场景可以多写细节和对话，过渡场景简洁处理。",ec+="\n\n【风格约束（必须严格遵守）】\n1. 对话简洁：单段对话不超过3行，信息密度高但措辞精炼，避免角色长篇大论式的独白\n2. 留白优先：情感高潮用动作和沉默表达，少用形容词直接描述情绪。角色的力量感来自沉默和克制，而非外在描写\n3. 章末留悬念：最后一个场景只揭示问题或制造悬念，不给出解决方案，让读者带着好奇心等待下一章\n4. 修辞克制：每段最多一个比喻，避免连续堆叠形容词和修饰语。宁可少写一个华丽的句子，也不要让文字显得臃肿\n5. 节奏感：场景切换要干脆，过渡场景一笔带过，重点场景才展开细节。保持网文的快节奏阅读体验",ec+=`

【番茄网文风格铁律（最高优先级）】
1. 段落长度：每段不超过3行（手机屏幕可见范围内），禁止出现超过5行的'大砖块'段落
2. 对话密度：每500字中至少包含2-3组对话，用对话推动剧情而非大段叙述
3. 内心OS：主角${en}的内心独白必须频繁出现，用（括号）或独立短段呈现，体现'表面装逼/内心狂喜'的反差喜感
4. 情绪直给：读者的爽点、笑点、泪点必须在3行之内引爆，不要铺垫过长
5. 节奏公式：每800字必须有一个小高潮（一个反转/一句金句/一个爽点），每2000字必须有一个大高潮
6. 章末钩子：最后一段必须制造强烈悬念或情绪冲击，让读者忍不住点'下一章'
7. 禁止事项：禁止学术化长句、禁止连续超过3段的纯描写无对话、禁止文青式抒情散文腔`,ec+="\n\n【禁用表达清单（绝对不允许出现以下词句或同义变体）】\n- 瞳孔骤缩 / 瞳孔骤然收缩 / 瞳孔猛地一缩\n- 嘴角勾起一抹XX的弧度 / 嘴角微微上扬勾出一抹XX\n- 倒吸一口冷气\n- 指节泛白 / 握紧的指节泛白\n- 冷汗浸透了衬衫 / 冷汗顺着脊背滑落\n- 摇晃高脚杯 / 猩红的液体在杯中旋转 / 端着红酒杯看着落地窗\n- 声音平静得可怕\n- 目光如炬\n- 全场死寂，针落可闻\n- 高深莫测的笑意 / 高深莫测的表情\n- 不容置疑的语气 / 不容置疑的疯狂\n- 轰——！（单独成段的拟声词）\n- 连续使用'XX顿了顿'超过1次/章\n- 面无表情，XX却暴露了内心的XX\n- 如同坠崖般 / 如同XX般（连续比喻超过2个）\n\n用动作、对话、节奏变化来表达情绪，而不是依赖以上模板化描写。例如：用'他放下茶杯，手指在桌面敲了三下'代替'他的目光如炬'；用'魏莱没说话，转身走向控制台'代替'魏莱的瞳孔骤然收缩'。",(1===u||3===u)&&(ec+=`

${U}`));let ey=[{role:"system",content:ec},{role:"user",content:eu}],e$=4===u,eS=`${ec}

${eu}`.length,ek=Math.ceil(1.5*`${ec}

${eu}`.length),ew=L.includes("gemini")&&4===u?4096:ef;e$&&(console.log("=== Step 4 审核报告诊断：Prompt 模板核心信息 ==="),console.log({systemPromptPreview:G(ec,1500),userPromptPreview:G(eu,2500),promptChars:eS,estimatedPromptTokens:ek,model:L,temperature:eg,configuredMaxTokens:ef,effectiveMaxTokens:ew,geminiThinkingBudget:L.includes("gemini")?1024:void 0}));try{if(L.includes("gemini")){let e={model:L,messages:ey,temperature:eg,stream:!0,max_completion_tokens:4===u?4096:ef};4===u&&(e.thinking_budget=1024),a=await Z.chat.completions.create(e)}else a=await Z.chat.completions.create({model:L,messages:ey,temperature:eg,max_tokens:ef,stream:!0})}catch(e){throw e$&&(console.error("=== Step 4 审核报告诊断：create 调用失败 ==="),console.error({model:L,temperature:eg,configuredMaxTokens:ef,effectiveMaxTokens:ew,promptChars:eS,estimatedPromptTokens:ek,error:e})),e}if(ep){let e=[],t=new TextEncoder,n=new ReadableStream({async start(n){try{var o;let r="";for await(let e of a){let o=e.choices[0]?.delta?.content;o&&(r+=o,n.enqueue(t.encode(o)))}let s=(function(e){let t="【下集预告】",n='门缝里滑出一张纸，只有一句话："别回头。"',o="觉得灰衣人下一步会怎么做？评论区留个预测。",r=(e,t)=>`

【下集预告】
${e}

${t}`,a=Math.max(0,t.length-1),s="before",l="",i="";function c(e){return e.replace(/\r/g,"").replace(/\n/g,"").trim()}function u(e,t){let n=e.trim();return n.length<=t?n:n.slice(0,t).trim()}return e.pipeThrough(new TransformStream({transform(e,n){if("after"===s){i+=e;return}let o=l+e,r=o.indexOf(t);if(-1===r){if(o.length<=a){l=o;return}let e=o.slice(0,o.length-a);l=o.slice(-a),n.enqueue(e);return}let c=o.slice(0,r);n.enqueue(c),s="after",l="",i=o.slice(r+t.length)},flush(e){if("before"===s){l&&e.enqueue(l),e.enqueue(r(n,o));return}let{hook:t,cta:a}=function(e){let t,r=e.replace(/\r/g,"").split("\n"),a=e=>{let t=e.trim();return!!(!t||/^(PS|P\.S\.|ps|p\.s\.)[:：]?/i.test(t)||/^附加指令回显[:：]?/.test(t))},s=0;for(;s<r.length&&a(r[s]);)s++;let l=[];for(;s<r.length;){let e=r[s],t=e.trim();if(!t||(a(e)||l.push(t),s++,l.length>=2))break}let i=u(c(l.join("")),120);for(;s<r.length&&""!==r[s].trim();)s++;for(;s<r.length&&""===r[s].trim();)s++;let p="";for(;s<r.length;){let e=r[s],t=e.trim();if(!t||a(e)){s++;continue}p=t;break}return{hook:i||n,cta:(p=u(c((t=p.trim()).startsWith("（")&&t.endsWith("）")&&t.length>=2?t.slice(1,-1).trim():t),120))||o}}(i);e.enqueue(r(t,a))}}))})((o=r,new ReadableStream({start(e){e.enqueue(o),e.close()}}))).getReader(),l="";for(;;){let{value:e,done:t}=await s.read();if(t)break;l+=e}let i=H(l);if(i.length<l.length?(e.push({check:"尾部硬切",status:"已执行",detail:`删除了 ${l.length-i.length} 个字符的尾部样板文字`}),l=i):e.push({check:"尾部硬切",status:"无需处理",detail:"未检测到尾部样板"}),5===u&&m&&l){let t=l.trim().length,n=m.trim().length;n>1e3&&t<.5*n?(console.warn(`[截断检测] Step5 疑似被截断: Step5=${t}字, Step3=${n}字 (${Math.round(t/n*100)}%). 回退到 Step3 二稿。`),e.push({check:"Step5截断检测",status:"已回退到二稿",detail:`Step5=${t}字, Step3=${n}字, 比例=${Math.round(t/n*100)}%`}),l=m):e.push({check:"Step5截断检测",status:"通过",detail:`Step5=${t}字, Step3=${n}字`})}if(Q.length>0){let t=I(l,Q);0===t.length?e.push({check:"锚定文本",status:"全部命中",detail:`共 ${Q.length} 条锚定文本全部存在`}):e.push({check:"锚定文本",status:"存在缺失",detail:t.map(e=>`缺失：${e.expected_text}（说话人：${e.speaker}，位置：${e.position}，最高相似度：${((e.best_match_ratio??0)*100).toFixed(0)}%）`).join("\n")})}else e.push({check:"锚定文本",status:"已跳过",detail:"未配置锚定文本"});let c=null;try{if(d&&d.trim()){console.log("[结构门控细纲诊断] 尝试JSON解析，outlineContent前200字:",d?.substring(0,200));let e=JSON.parse(d);e.endHook&&(c={text:e.endHook,position:"ending"})}}catch{console.log("[结构门控细纲诊断] JSON解析失败，尝试正则。outlineContent前200字:",d?.substring(0,200));let e=el(d);e.text&&(c={text:e.text,position:"ending"},console.log("[结构门控] endHook提取成功，来源:"+e.source+"，内容:",e.text.substring(0,80)))}if((!c||c.text&&c.text.length<10)&&j)try{let e=k.default.join(process.cwd(),"data","projects");if("string"==typeof B&&B){let t=parseInt(String(j).replace(/[^0-9]/g,""),10),n=k.default.join(e,B,"knowledge","outline.json");if(S.default.existsSync(n)){for(let e of JSON.parse(S.default.readFileSync(n,"utf-8")).volumes||[])for(let n of e.chapters||[])if(n.chapterNum===t&&n.endHook){let e=n.endHook;c={text:e,position:"ending"},console.log("[endHook兜底] 从outline.json成功读取endHook:",e.substring(0,60))}}}}catch(e){console.log("[endHook兜底] 读取outline.json失败:",e)}let p=[];try{if(B){let e=(0,P.getAllCharacters)(B);if(Array.isArray(e)&&e.length>0&&(p=e.map(e=>e.name?.trim()||"").filter(e=>e.length>=2),console.log("[硬约束] 角色库来源: getAllCharacters/bible.sqlite")),0===p.length){let e=k.default.join(process.cwd(),"data","projects",B,"knowledge","characters.json");if(S.default.existsSync(e)){let t=S.default.readFileSync(e,"utf-8"),n=JSON.parse(t);Array.isArray(n)?p=n.map(e=>e.name||e.角色名||e.characterName||"").filter(e=>e.length>=2):"object"==typeof n&&null!==n&&(p=Object.values(n).map(e=>e.name||e.角色名||e.characterName||"").filter(e=>e.length>=2)),console.log("[硬约束] 角色库来源: characters.json")}}}console.log("[硬约束] 角色库加载:",p.length,"个角色")}catch(e){console.warn("[硬约束] 角色库读取失败，跳过角色检测:",e)}let h=[];try{if(B){let e=k.default.join(process.cwd(),"data","projects",B,"knowledge","facts.json");if(S.default.existsSync(e)){let t=S.default.readFileSync(e,"utf-8"),n=JSON.parse(t),o=n.patternKeywords||n.pattern_keywords||[];h=Array.isArray(o)?o:o&&"object"==typeof o?Object.keys(o):[],h=Array.isArray(h)?h:[]}}console.log("[硬约束] patternKeywords 加载:",h.length,"条")}catch(e){console.warn("[硬约束] patternKeywords 读取失败，跳过重复检测:",e)}let g="";try{if(B&&em){let e=k.default.join(process.cwd(),"data","projects",B,"chapters");if(S.default.existsSync(e)){for(let t of[em-2,em-1].filter(e=>e>0))for(let n of[k.default.join(e,`${t}.json`),k.default.join(e,`chapter-${t}.json`),k.default.join(e,`ch${t}.json`)])if(S.default.existsSync(n)){let e=JSON.parse(S.default.readFileSync(n,"utf-8"));g+=(e.content||e.manuscript||e.text||e.finalText||"")+"\n";break}}}console.log("[硬约束] 前章文本加载:",g.length,"字")}catch(e){console.warn("[硬约束] 前章读取失败，跳过跨章检测:",e)}let f=[];try{let e=d.match(/(?:【关键角色】|keyCharacters)["""：:]*\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/);e&&(f=e[1].split(/[,，、\n]/).map(e=>e.trim()).filter(e=>e.length>=2)),console.log("[硬约束] keyCharacters:",f)}catch(e){console.warn("[硬约束] keyCharacters 提取失败:",e)}let $=J({manuscript:l,anchors:c?[c]:[],keyCharacters:f,allKnownCharacters:p,suggestedWordCount:ed||3e3,patternKeywords:h,previousChaptersText:g});console.log($.summary),console.log("[硬约束] 单项统计",{unauthorizedHardCount:M(l,f,p).filter(e=>"hard"===e.severity).length,wordCountPass:q(l,ed||3e3).pass,repetitionCount:z(l,h,g).length,genderViolationCount:$.genderViolations.filter(e=>e.count>=2).length}),$.unauthorizedCharacters.length>0&&console.log("[硬约束-角色详情]",JSON.stringify($.unauthorizedCharacters)),$.patternRepetition.length>0&&console.log("[硬约束-重复表达]",JSON.stringify($.patternRepetition)),$.genderViolations.length>0&&console.log("[硬约束-性别代词]",JSON.stringify($.genderViolations)),$.wordCount.pass||console.log("[硬约束-字数]",JSON.stringify($.wordCount));let w=$;if(5===u){let t=0;for(;!w.overallPass&&t<2;){t+=1;let e=w.anchorCheck.filter(e=>"ANCHOR_MISSING"===e.type||"ANCHOR_WRONG_POSITION"===e.type),n=w.unauthorizedCharacters.filter(e=>"hard"===e.severity),o=w.patternRepetition,r=(w.genderViolations||[]).filter(e=>e.count>=2),a=w.wordCount.pass?"":`- 字数不足：当前 ${w.wordCount.actual} 字，目标至少 ${w.wordCount.minimum} 字。需要在不偏离细纲的前提下补足内容。`,s=[...e.map(e=>`- endHook 问题：${e.message||`${e.type} / ${e.expected_text}`}`),...n.map(e=>`- 未授权角色：${e.name}（出现 ${e.count} 次${e.hasDialogue?"，含对话":""}）`),...r.map(e=>{let t=(0,_.getPronounRule)(e.character),n=t?.genderLabel||("她"===e.expectedPronoun?"女":"他"===e.expectedPronoun?"男":"AI系统");return`- 角色性别错误：角色"${e.character}"是${n}，必须使用"${e.expectedPronoun}"作为代词，当前错误使用了"${e.wrongPronoun}"共${e.count}处`}),...o.map(e=>`- 重复表达：${e.pattern}（本章 ${e.countInCurrent} 次${e.foundInPrevious?"，且前章也出现":""}）`),...a?[a]:[]],i=`你现在正在执行 Step5 的自动定向修复。请基于“当前终稿”做最小必要修改，只修复下列硬约束问题，不要重写全文，不要改动未被点名的问题段落。

【当前终稿】
${l}

【本章细纲】
${d||"无"}

【审核报告】
${y||"无"}

【必须修复的问题】
${s.length>0?s.join("\n"):"- 存在未通过的硬约束，请按细纲与审核报告进行最小修复。"}

【硬性修复要求】
1. 必须保留当前终稿已成立的剧情、段落结构与大部分原文，仅对必要位置做局部修改。
2. 如果存在 endHook 问题，必须让以下章末钩子出现在正文最后 500 字以内，且成为章末板块之前的最后一个叙事动作：${eh||c?.text||"按细纲 endHook 执行"}
3. 如果存在未授权角色，必须删除其台词、动作、视角或改写为细纲允许出场的角色。
4. 如果字数不足，只能补写细纲中已有情节点的场景、对话、心理活动，不得新增细纲之外的重大转折。
5. 如果存在重复表达，必须改写为不同表述，避免套话。
6. 如果存在角色性别错误，必须逐一修正对应代词。男性角色只能使用“他”，女性角色只能使用“她”，M-0 只能使用“它”；只修改错误代词及其紧邻必要语句，不得借机改写其他内容。
7. 必须保留并正确输出章末板块。

只输出修复后的完整正文，不要解释。`;console.log(`[自动修复] 第 ${t} 次尝试开始`,{overallPass:w.overallPass,anchorIssues:e.length,unauthorizedHardIssues:n.length,repetitionIssues:o.length,wordCountPass:w.wordCount.pass});let u=l,m=(await er(i,"终稿")).trim();if(!m){console.warn(`[自动修复] 第 ${t} 次尝试返回空文本，停止重试`);break}let $=t;if(m.length<500){console.warn(`[自动修复] 第 ${$} 次修复后文本过短(${m.length})，放弃此次修复`);break}if(m.length<.5*u.length){console.warn(`[自动修复] 第 ${$} 次修复后文本反而大幅缩短(${m.length} < ${u.length}*0.5)，放弃此次修复`);break}l=H(m),w=J({manuscript:l,anchors:c?[c]:[],keyCharacters:f,allKnownCharacters:p,suggestedWordCount:ed||3e3,patternKeywords:h,previousChaptersText:g}),console.log(`[自动修复] 第 ${t} 次尝试后结果`,{overallPass:w.overallPass,summary:w.summary})}e.push({check:"自动修复",status:w.overallPass?"完成":"仍有未通过项",detail:w.summary})}if(c&&l){let t=w.anchorCheck.filter(e=>"ANCHOR_MISSING"===e.type||"ANCHOR_WRONG_POSITION"===e.type);t.length>0?(console.log("[结构门控] 发现endHook问题:",JSON.stringify(t,null,2)),e.push({check:"结构门控",status:"发现endHook问题",detail:t.map(e=>e.message||`type=${e.type}，target=${e.expected_text}`).join("\n")})):w.overallPass?(console.log("[结构门控] endHook位置检查通过"),e.push({check:"结构门控",status:"通过",detail:w.summary})):(console.log("[结构门控] 全量硬约束未通过:",w.summary),e.push({check:"结构门控",status:"全量硬约束未通过",detail:w.summary}))}else e.push({check:"结构门控",status:"已跳过",detail:"endHook锚点缺失或正文为空"});try{if(B&&em){let e=await (0,K.extractChapterState)(em,l,d,async e=>er(e,"审核报告"));(0,K.saveChapterState)(B,e),console.log("[状态追踪] 章节状态已保存:",JSON.stringify(e).substring(0,200))}}catch(e){console.warn("[状态追踪] 提取失败，不影响主流程:",e)}if(ee.length>0){let t=await E(l,ee,eo);0===t.length?e.push({check:"禁止项",status:"无违规",detail:`共检查 ${ee.length} 条规则，均未违反`}):e.push({check:"禁止项",status:"发现违规",detail:t.map(e=>`[${e.severity}] 规则：${e.rule}
证据：${e.evidence}`).join("\n---\n")})}else e.push({check:"禁止项",status:"已跳过",detail:"未配置禁止规则"});let C=["","─────────────────────────────────","【硬约束执行报告】",...e.map(e=>`✦ ${e.check}：${e.status}
  ${e.detail.replace(/\n/g,"\n  ")}`),"─────────────────────────────────"];1===u&&ei&&ei.injectedItems.length>0&&C.push("","─────────────────────────────────","【知识库注入报告】",`- 注入内容：${ei.injectedItems.join(", ")}`,`- 预估token消耗：约${Math.floor(1.5*ei.systemPromptAddition.length)} tokens`,"─────────────────────────────────");let x=C.join("\n");console.log(x),n.close()}catch(e){n.error(e)}}});return new Response(n,{headers:{"Content-Type":"text/plain; charset=utf-8","Transfer-Encoding":"chunked"}})}let eC=e$?(n=a,o={model:L,temperature:eg,maxTokens:ef,effectiveMaxTokens:ew,promptChars:eS,estimatedPromptTokens:ek,systemChars:ec.length,userPromptChars:eu.length},s=new TextEncoder,new ReadableStream({async start(e){let t=Date.now(),r=0,a=0,l="",i="",c="";console.log("=== Step 4 审核报告诊断：请求摘要 ==="),console.log({model:o.model,temperature:o.temperature,configuredMaxTokens:o.maxTokens,effectiveMaxTokens:o.effectiveMaxTokens,promptChars:o.promptChars,estimatedPromptTokens:o.estimatedPromptTokens,systemChars:o.systemChars,userPromptChars:o.userPromptChars});try{for await(let t of n){r+=1;let n=t.choices[0]?.delta?.content;n&&(a+=1,l+=n,i||(i=n),c=n,e.enqueue(s.encode(n)))}let o=Date.now()-t;console.log("=== Step 4 审核报告诊断：流式返回摘要 ==="),console.log({durationMs:o,chunkCount:r,contentChunkCount:a,outputChars:l.length,isEmptyOutput:0===l.length,firstContentSample:G(i,200),lastContentSample:G(c,200)}),console.log("=== Step 4 审核报告诊断：AI 原始返回（截断）==="),console.log(G(l,4e3)),e.close()}catch(o){let n=Date.now()-t;console.error("=== Step 4 审核报告诊断：流式调用异常 ==="),console.error({durationMs:n,chunkCount:r,contentChunkCount:a,outputChars:l.length,error:o}),console.error("=== Step 4 审核报告诊断：异常前 AI 原始返回（截断）==="),console.error(G(l,4e3)),e.error(o)}}})):(r=a,l=new TextEncoder,new ReadableStream({async start(e){try{for await(let t of r){let n=t.choices[0]?.delta?.content;n&&e.enqueue(l.encode(n))}e.close()}catch(t){e.error(t)}}}));return new Response(eC,{headers:{"Content-Type":"text/plain; charset=utf-8","Transfer-Encoding":"chunked"}})}e.s(["POST",()=>F,"runtime",0,"nodejs"],39930);var W=e.i(39930);let B=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/write/route",pathname:"/api/write",filename:"route",bundlePath:""},distDir:".next-build",relativeProjectDir:"",resolvedPagePath:"[project]/novel-workshop/app/api/write/route.ts",nextConfigOutput:"",userland:W}),{workAsyncStorage:L,workUnitAsyncStorage:V,serverHooks:Y}=B;function Z(){return(0,o.patchFetch)({workAsyncStorage:L,workUnitAsyncStorage:V})}async function Q(e,t,o){B.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let $="/api/write/route";$=$.replace(/\/index$/,"")||"/";let S=await B.prepare(e,t,{srcPage:$,multiZoneDraftMode:!1});if(!S)return t.statusCode=400,t.end("Bad Request"),null==o.waitUntil||o.waitUntil.call(o,Promise.resolve()),null;let{buildId:k,params:w,nextConfig:C,parsedUrl:x,isDraftMode:R,prerenderManifest:v,routerServerContext:P,isOnDemandRevalidate:O,revalidateOnlyGenerated:N,resolvedPathname:b,clientReferenceManifest:A,serverActionsManifest:_}=S,H=(0,l.normalizeAppPath)($),I=!!(v.dynamicRoutes[H]||v.routes[b]),j=async()=>((null==P?void 0:P.render404)?await P.render404(e,t,x,!1):t.end("This page could not be found"),null);if(I&&!R){let e=!!v.routes[b],t=v.dynamicRoutes[H];if(t&&!1===t.fallback&&!e){if(C.experimental.adapterPath)return await j();throw new m.NoFallbackError}}let T=null;!I||B.isDev||R||(T="/index"===(T=b)?"/":T);let E=!0===B.isDev||!I,M=I&&!E;_&&A&&(0,s.setManifestsSingleton)({page:$,clientReferenceManifest:A,serverActionsManifest:_});let q=e.method||"GET",z=(0,a.getTracer)(),J=z.getActiveScopeSpan(),K={params:w,prerenderManifest:v,renderOpts:{experimental:{authInterrupts:!!C.experimental.authInterrupts},cacheComponents:!!C.cacheComponents,supportsDynamicResponse:E,incrementalCache:(0,r.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:C.cacheLife,waitUntil:o.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,o,r)=>B.onRequestError(e,t,o,r,P)},sharedContext:{buildId:k}},D=new i.NodeNextRequest(e),U=new i.NodeNextResponse(t),X=c.NextRequestAdapter.fromNodeNextRequest(D,(0,c.signalFromNodeResponse)(t));try{let s=async e=>B.handle(X,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=z.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let o=n.get("next.route");if(o){let t=`${q} ${o}`;e.setAttributes({"next.route":o,"http.route":o,"next.span_name":t}),e.updateName(t)}else e.updateName(`${q} ${$}`)}),l=!!(0,r.getRequestMeta)(e,"minimalMode"),i=async r=>{var a,i;let c=async({previousCacheEntry:n})=>{try{if(!l&&O&&N&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let a=await s(r);e.fetchMetrics=K.renderOpts.fetchMetrics;let i=K.renderOpts.pendingWaitUntil;i&&o.waitUntil&&(o.waitUntil(i),i=void 0);let c=K.renderOpts.collectedTags;if(!I)return await (0,d.sendResponse)(D,U,a,K.renderOpts.pendingWaitUntil),null;{let e=await a.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(a.headers);c&&(t[f.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,o=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:a.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:o}}}}catch(t){throw(null==n?void 0:n.isStale)&&await B.onRequestError(e,t,{routerKind:"App Router",routePath:$,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:O})},!1,P),t}},u=await B.handleResponse({req:e,nextConfig:C,cacheKey:T,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:v,isRoutePPREnabled:!1,isOnDemandRevalidate:O,revalidateOnlyGenerated:N,responseGenerator:c,waitUntil:o.waitUntil,isMinimalMode:l});if(!I)return null;if((null==u||null==(a=u.value)?void 0:a.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(i=u.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});l||t.setHeader("x-nextjs-cache",O?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),R&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,h.fromNodeOutgoingHttpHeaders)(u.value.headers);return l&&I||m.delete(f.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,g.getCacheControlHeader)(u.cacheControl)),await (0,d.sendResponse)(D,U,new Response(u.value.body,{headers:m,status:u.value.status||200})),null};J?await i(J):await z.withPropagatedContext(e.headers,()=>z.trace(u.BaseServerSpan.handleRequest,{spanName:`${q} ${$}`,kind:a.SpanKind.SERVER,attributes:{"http.method":q,"http.target":e.url}},i))}catch(t){if(t instanceof m.NoFallbackError||await B.onRequestError(e,t,{routerKind:"App Router",routePath:H,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:O})},!1,P),I)throw t;return await (0,d.sendResponse)(D,U,new Response(null,{status:500})),null}}e.s(["handler",()=>Q,"patchFetch",()=>Z,"routeModule",()=>B,"serverHooks",()=>Y,"workAsyncStorage",()=>L,"workUnitAsyncStorage",()=>V],23618)}];

//# sourceMappingURL=0b7ee_next_dist_esm_build_templates_app-route_2360dfd4.js.map