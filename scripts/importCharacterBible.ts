import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const dbPath = path.join(__dirname, '..', 'data', 'projects', 'd0ca5fae-df9e-48f1-96b0-566087c5cd94', 'knowledge', 'bible.sqlite');

// 连接数据库
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

console.log('🔄 正在重建角色圣经数据库...\n');

// 删除旧表（如果存在）
console.log('🗑️  删除旧表...');
db.exec(`DROP TABLE IF EXISTS characters;`);
db.exec(`DROP TABLE IF EXISTS world_settings;`);
db.exec(`DROP TABLE IF EXISTS global_rules;`);
console.log('✅ 旧表已删除\n');

// 创建新表
console.log('📋 创建新表...');

db.exec(`
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    aliases TEXT,
    role TEXT NOT NULL,
    appearance TEXT,
    background TEXT,
    personality TEXT,
    speechStyle TEXT,
    behaviorRules TEXT,
    growthArc TEXT,
    currentStatus TEXT,
    sampleDialogue TEXT,
    keyEvents TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS world_settings (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    volume TEXT,
    description TEXT,
    currentStatus TEXT,
    createdAt TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS global_rules (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    createdAt TEXT
  );
`);

console.log('✅ 新表已创建\n');

// 准备插入语句
const insertCharacter = db.prepare(`
  INSERT INTO characters (id, name, aliases, role, appearance, background, personality, speechStyle, behaviorRules, growthArc, currentStatus, sampleDialogue, keyEvents, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`);

const insertWorldSetting = db.prepare(`
  INSERT INTO world_settings (id, category, name, volume, description, currentStatus, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?);
`);

const insertGlobalRule = db.prepare(`
  INSERT INTO global_rules (id, category, title, content, priority, createdAt)
  VALUES (?, ?, ?, ?, ?, ?);
`);

const now = new Date().toISOString();

console.log('📥 插入角色数据...\n');

// 角色1 - 李弈
insertCharacter.run(
  uuidv4(),
  '李弈',
  '李总,老板',
  '主角',
  '二十出头，英俊过分，标志性装备为定制西装（前两卷）或满是沙土的军大衣（第三卷大西北基地场景）',
  '前世：华尔街顶级量化交易员，30岁猝死在工位上。今世：海城首富李半城的小儿子，超级富二代，外界认知从"废物败家子"逐渐迪化为"深不可测的商业教父"',
  '外在：装逼如风，高深莫测，喜欢用反问句降维打击。内在：疯狂吐槽，一心败家，视利润为仇寇。角色弧光（第三卷觉醒）：原本只想自私地刷钱回家，但在看到大西北的贫苦、刘大爷的老茧后，逐渐觉醒了大国情怀。嘴上喊着亏钱，身体却扛起了科技霸权的脊梁。',
  '对外霸总："大家都去抢的风口，那叫红海！我李弈只投无底洞！" 对内吐槽：（系统你大爷！怎么又赚钱了？！）',
  '【李弈行为铁律——AI生成时必须遵守】\n1. 核心驱动力：系统要求他败光资产，所以他表面看起来越败家，内心越开心\n2. 遇到困境时的标准反应：不是痛苦，而是"太好了，又有理由花钱/搞砸了"的窃喜\n3. 表演模式：对外永远是"冷酷霸道/运筹帷幄"的人设，对内（内心OS）是"卧槽这也行/系统你是我爹"的吐槽\n4. 禁止写法：禁止把李弈写成苦情/纠结/痛苦的传统男主，即使面对最艰难的抉择，他的内心也必须有一个"败家子滤镜"在运作\n5. 唯一例外：只有涉及刘大爷等至亲的生死时，才允许短暂流露真实情感，但必须快速切回"强者姿态"\n6. 金手指（System V3.0）：普通商业亏损转化率归零；科研/重工/民生项目亏损1:2.0转化；亏损达标掉落【黑科技图纸碎片】',
  '第一卷：纯粹败家子，只想完成系统任务。第二卷：开始享受商战博弈的快感。第三卷：觉醒大国情怀，嘴上喊亏钱身体扛起科技霸权脊梁',
  '在504厂召开V2.0发布会，用"丑陋的砖头"和100个《黑神话》窗口开启算力屠杀',
  '对外："大家都去抢的风口，那叫红海！我李弈只投无底洞！"\n对内：（系统你大爷！怎么又赚钱了？！）',
  '第一卷：5000万创业试炼起点\n第二卷：建立红星商业帝国\n第三卷：入驻504厂，启动光子芯片和核聚变项目\n第129章：V2.0发布会算力屠杀',
  now,
  now
);
console.log('✅ 插入角色: 李弈');

// 角色2 - 魏莱
insertCharacter.run(
  uuidv4(),
  '魏莱',
  '魏总,大管家',
  '主要配角',
  '25岁左右，职业套裙，黑框眼镜，永远抱着厚厚的文件夹',
  '剑桥毕业金融高材生，李弈的特助，红星帝国实际操盘手',
  '表面冷静克制、公事公办，实则是李弈的"头号迪化粉"。执行力极高，忠诚度满格',
  '职业化汇报为主，崩溃时会急促吐槽',
  '【魏莱行为铁律】\n1. 迪化约束：魏莱的"迪化脑补"必须严格遵守【事后合理化】原则\n2. 允许：李弈做完决定后，魏莱用金融逻辑将败家行为解读为神级商业布局\n3. 禁止：魏莱在李弈决策前猜到其真实败家意图（读者信息差优越感是核心喜剧结构）\n4. 第三卷蜕变：从"解说员/吐槽工具人"向"独立决策者"蜕变，遇到危机不再第一时间找老板，学会用老板的逻辑反杀资本\n5. 决策基于数据和情报的理性判断，不是盲目信任；对外冷酷果断，独处时才流露疲惫',
  '从"解说员/吐槽工具人"向"独立决策者"蜕变',
  '配合李弈完成"战略欺诈"，准备见证红星算力登顶',
  '"老板故意压低良品率，一定是在等最佳的发布窗口期！太深谋远虑了！"',
  '第120章：第一次独立决策（非请示李弈，镇压供应商）\n第123章：猎巫篇连夜追查陈默身份',
  now,
  now
);
console.log('✅ 插入角色: 魏莱');

// 角色3 - 赵光
insertCharacter.run(
  uuidv4(),
  '赵光',
  '赵疯子',
  '主要配角',
  '30岁出头，头发常乱如鸡窝，形象邋遢，一年四季趿拉着人字拖，黑眼圈极重',
  '第二卷引入（约第65-70章）。硅谷归国天才科学家，放弃百万美金年薪回国，红星首席技术官。被李弈用"管够的算力和随便炸的实验室"忽悠进厂',
  '对科学极度狂热，对人情世故极度迟钝（水杯乱放导致指纹被盗）。性格倔强暴烈，但在芯片面前没有尊严可言',
  '直来直去，带脏字。技术问题上滔滔不绝，愤怒时咆哮',
  '1. 技术至上：所有决策优先考虑技术可行性\n2. 情商低但忠诚度高\n3. 愤怒时会咆哮甚至动手（揪衣领）\n4. 对刘大爷从看不起到尊敬的转变已完成',
  '从硅谷天才到红星技术支柱',
  '72小时极限爆肝完成V2.0，正在后台补觉',
  '"那不过是我上个月的废稿！我脑子里已经有V2.0了！"',
  '第二卷（约65-70章）：首次登场/加入红星\n第118章：与刘大爷"土洋之争"爆发与和解\n第124-125章：猎巫篇被冤枉出走\n第125-126章：被李弈鞠躬追回，V2.0诞生',
  now,
  now
);
console.log('✅ 插入角色: 赵光');

// 角色4 - 刘大爷
insertCharacter.run(
  uuidv4(),
  '刘大爷',
  '八级钳工',
  '主要配角',
  '快六十岁，满手厚茧，指甲缝里常年嵌着铁屑，佝偻背影，标志性道具为旱烟袋和一把旧金刚石锉刀',
  '第一卷引入。原红星机械表厂元老，掌握无法数字化的绝活，五十年的肌肉记忆',
  '老派硬骨头，大西北工人的缩影。对手艺有绝对的骄傲，看不起只会敲键盘的年轻人',
  '老西北口音，短句为主，带"小兔崽子""老头子"等词，用烟袋锅指人',
  '【刘大爷暗线约束——帕金森】\n1. 当前阶段：仅允许写伏笔（偷偷吃药、手指微震、回避需要精细操作的场合、把手藏进袖子、用旱烟袋压住微颤的虎口）\n2. 引爆条件：由作者手动下达"引爆帕金森线"指令后方可正式揭开\n3. 引爆点已确定为第175章，届时由赵疯子发现绑带+回收169章药瓶意象\n4. 第166-174章期间严格执行暗线规则，任何角色不得说破\n5. 铁律：写手Agent在未收到引爆指令前，严禁让任何角色发现或公开讨论刘大爷的病情',
  '从红星表厂元老到V2.0物理模组打磨者',
  '协助完成V2.0物理模组的打磨',
  '"公式偷得走，老头子这双搓透镜的手，洋鬼子偷得走吗？"',
  '第一卷：红星表厂元老\n第116章：手搓纳米级透镜首次惊艳全网\n第166章(预定)：帕金森伏笔首次出现（手部微震）\n第175章(预定)：帕金森引爆',
  now,
  now
);
console.log('✅ 插入角色: 刘大爷');

// 角色5 - 王代码
insertCharacter.run(
  uuidv4(),
  '王代码',
  '算力疯子',
  '主要配角',
  '20多岁，重度宅男，发际线堪忧，常年穿着二次元T恤',
  '第二卷引入（约第85-90章）。被李弈从网吧里捞出来的顶级黑客/算力架构师',
  '能动手绝不哔哔，在网络世界是无所不能的神，现实中是个社恐',
  '话少，技术术语多，偶尔蹦出二次元梗',
  '1. 功能定位：负责数据追踪（揪出内鬼IP）、算力调度（运行《黑神话》实测）\n2. 社恐但关键时刻绝对可靠',
  '从网吧到红星算力架构师',
  '负责V2.0算力架构调试',
  null,
  '第二卷（约85-90章）：被李弈从网吧捞出加入团队\n第123章：猎巫篇中察觉异常切断数据传输',
  now,
  now
);
console.log('✅ 插入角色: 王代码');

// 角色6 - 灰衣人
insertCharacter.run(
  uuidv4(),
  '灰衣人',
  'WCA幕后掌控者',
  '反派',
  '未详细描述，给人阴沉威压感',
  'WCA幕后掌舵人，华尔街老钱家族代表，资本巨鳄',
  '傲慢、冷漠，信奉"算力霸权"和"资本万能"。对中国工匠精神嗤之以鼻',
  '优雅但带有令人窒息的威压，把商战当成喝红酒般的游戏',
  '1. 永远站在幕后操控\n2. 通过代理人和资本手段打击红星\n3. 不会亲自出面直到最终决战',
  '从幕后操控到500亿美金打水漂',
  '误判局势，刚刚将500亿美金砸进V1.0的过时产线',
  null,
  '首次出场：V1.0发布会后',
  now,
  now
);
console.log('✅ 插入角色: 灰衣人');

// 角色7 - 陈默
insertCharacter.run(
  uuidv4(),
  '陈默',
  'CM',
  '反派',
  null,
  '商业间谍，伪造MIT学籍混入红星',
  '极度理性的利己主义者，信奉"这世界就是个巨大的赌场"',
  null,
  '1. 已叛逃，当前通过加密邮件向灰衣人汇报红星动态\n2. 可能在后续章节以远程方式影响剧情',
  '从红星技术员到WCA间谍',
  '携V1.0数据叛逃，收取1000万美金，自以为赢麻了。身份暴露后撤离至纽约WCA总部',
  null,
  '第114章：以"完美技术员"身份潜入504厂\n第123章：异常外传流量被王代码发现\n第126章：身份暴露后撤离至纽约WCA总部',
  now,
  now
);
console.log('✅ 插入角色: 陈默');

// 角色8 - 李半城
insertCharacter.run(
  uuidv4(),
  '李半城',
  '海城首富',
  '次要配角',
  null,
  '李弈的父亲，千亿商业帝国的掌舵人，本书"5000万限期一个月创业试炼"的始作俑者',
  '威严、传统、奉行极致的"狼性商业法则"。表面上对李弈恨铁不成钢，实际上一直通过财报和暗线关注',
  null,
  '1. 迪化体质（特殊）：属于"三观崩塌式迪化"，看着李弈瞎搞却不断缔造奇迹，陷入深深的自我怀疑\n2. 当前为远程观察状态，随时准备在第四卷作为家族线核心碰撞点回归',
  '从质疑儿子到自我怀疑',
  '在海城大本营遥望大西北，对红星芯片的诞生感到震颤',
  null,
  '第一卷：5000万试炼发起者\n后续：远程关注红星动态',
  now,
  now
);
console.log('✅ 插入角色: 李半城\n');

console.log('📥 插入世界设定数据...\n');

// 世界设定数据
const worldSettings = [
  { name: '系统V3.0', category: '系统', volume: '第三卷', description: '商业亏损=0，科研亏损=双倍资产。倒逼李弈必须投向重工业和无底洞', currentStatus: '激活中' },
  { name: '红星方便面', category: '产品', volume: '第一卷', description: '李弈最早的败家产物。目前已成为红星团队熬夜标配', currentStatus: '持续发售' },
  { name: '《黑神话：悟空》', category: '投资', volume: '第二卷', description: '红星投资的国产3A大作。现作为V2.0芯片的"极限跑分测试工具"', currentStatus: '实测中' },
  { name: '逆风物流/骑手', category: '业务', volume: '第二卷', description: '李弈投资的外卖体系。后期自发组成"护卫队"保护基地', currentStatus: '运营中' },
  { name: '504厂', category: '地点', volume: '第三卷', description: '大西北废弃核基地，红星现在的总部。充满苏式工业废土风', currentStatus: '总部基地' },
  { name: '光子芯片V1.0', category: '科技', volume: '第三卷', description: '理论被盗70%。已成为李弈套路华尔街500亿资金的"香饵"', currentStatus: '已泄露' },
  { name: '光子芯片V2.0', category: '科技', volume: '第三卷', description: '赵光极限研发，非线性光路，体积如砖头，算力超硅基100倍', currentStatus: '刚发布' },
  { name: '核聚变图纸碎片', category: '科技', volume: '第三卷', description: '系统掉落的究极败家图纸（进度1/10）。第九单元终极无底洞', currentStatus: '收集进度1/10' },
];

worldSettings.forEach(setting => {
  insertWorldSetting.run(
    uuidv4(),
    setting.category,
    setting.name,
    setting.volume,
    setting.description,
    setting.currentStatus,
    now
  );
  console.log(`✅ 插入设定: ${setting.name}`);
});
console.log('');

console.log('📥 插入全局规则数据...\n');

// 全局规则数据
const globalRules = [
  { 
    category: '角色约束', 
    title: '魏莱迪化约束', 
    content: '魏莱的\'迪化脑补\'必须严格遵守【事后合理化】原则：允许李弈做完决定后用金融逻辑解读为神级布局；禁止魏莱在李弈决策前猜到其真实败家意图。读者的信息差优越感是本书核心喜剧结构，魏莱提前看穿=结构坍塌。',
    priority: 10
  },
  { 
    category: '系统规则', 
    title: '系统V3.0惩罚量化', 
    content: '连续盈利惩罚：触发条件为连续三个自然月项目净盈利；惩罚机制为每月扣除一张黑科技图纸碎片（从最新获得的开始倒扣）；扣完上限为已有碎片扣至0张；解除条件为任意一个月出现净亏损即重置计时。',
    priority: 9
  },
  { 
    category: '角色约束', 
    title: '刘大爷帕金森暗线', 
    content: '当前阶段仅允许写伏笔（偷偷吃药、手指微震、回避精细操作、把手藏进袖子、用旱烟袋压住微颤虎口）。引爆点已确定为第175章。第166-174章严格执行暗线规则，任何角色不得说破。写手Agent在未收到作者\'引爆帕金森线\'指令前，严禁让任何角色发现或公开讨论刘大爷病情。',
    priority: 10
  },
  { 
    category: '废弃设定', 
    title: '已废弃设定', 
    content: '以下设定已废弃/进化：5000万一个月期限（第一卷结束后系统升级，不再有固定期限和金额约束）；系统V1.0亏损1:1转化（已升级为V3.0）；红星=机械表厂（已扩展为横跨制造、互联网、物流、芯片的商业帝国）。',
    priority: 5
  },
  { 
    category: '风格铁律', 
    title: '番茄网文风格铁律', 
    content: '1. 段落长度：每段不超过3行（手机屏幕可见范围内），禁止超过5行的\'大砖块\'段落\n2. 对话密度：每500字中至少包含2-3组对话\n3. 内心OS：主角李弈的内心独白必须频繁出现，用（括号）呈现\'表面装逼/内心狂喜\'的反差\n4. 情绪直给：爽点、笑点、泪点必须在3行之内引爆\n5. 节奏公式：每800字一个小高潮，每2000字一个大高潮\n6. 章末钩子：最后一段必须制造强烈悬念\n7. 禁止：学术化长句、连续超过3段纯描写无对话、文青式抒情散文腔',
    priority: 10
  },
];

globalRules.forEach(rule => {
  insertGlobalRule.run(
    uuidv4(),
    rule.category,
    rule.title,
    rule.content,
    rule.priority,
    now
  );
  console.log(`✅ 插入规则: ${rule.title}`);
});
console.log('');

// 统计
const charCount = db.prepare('SELECT COUNT(*) as count FROM characters').get() as { count: number };
const worldCount = db.prepare('SELECT COUNT(*) as count FROM world_settings').get() as { count: number };
const ruleCount = db.prepare('SELECT COUNT(*) as count FROM global_rules').get() as { count: number };

console.log('📊 ===== 导入报告 =====');
console.log(`   角色数量: ${charCount.count}`);
console.log(`   世界设定数量: ${worldCount.count}`);
console.log(`   全局规则数量: ${ruleCount.count}`);
console.log('=========================\n');

db.close();
console.log('✅ 数据库导入完成！');
