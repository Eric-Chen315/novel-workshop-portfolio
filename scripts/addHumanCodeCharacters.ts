import { createCharacter, getAllCharacters } from "../app/lib/storage/characterStore";

const projectId = "b430f9aa-7149-41a4-8197-95cf3d1e9d30";

const characters = [
  {
    name: "方远",
    role: "主角" as const,
    appearance: "偏瘦，常年黑框眼镜，习惯性推眼镜动作。",
    personality: "理性克制，技术信仰者，相信数据不会说谎但会被选择性呈现。",
    speechStyle: "说话偏克制，先讲结论再给证据，倾向使用技术术语但会主动补充可验证依据。",
    background: "秦刃的前同事兼技术搭档，第三卷成长为独立分析力量。主导金融案审计、全数据验证实锤镜效应、发现 ASCII 签名、完成 M-0 空白时段技术报告。",
    currentState: "镜鉴科技核心技术成员，已成长为可独立承担关键分析任务的主力。",
    relationships: [],
  },
  {
    name: "周晗",
    role: "主要配角" as const,
    appearance: "仪表整洁克制，常带略显疲惫的专注感。",
    personality: "谨慎务实，说话前习惯停顿两秒，不轻易下结论。",
    speechStyle: "表达谨慎，先停顿确认信息，再给出条件式判断。",
    background: "医疗 AI 领域专家，第 89 章加入团队。技术背景为医学信息学（HL7 FHIR 标准方向），负责医疗案审计专业支撑。",
    currentState: "已加入团队，补足医疗数据与标准体系能力。",
    relationships: [],
  },
  {
    name: "王建国",
    role: "次要配角" as const,
    appearance: "45 岁，中年普通人形象，带着长期求职受挫后的疲惫与克制。",
    personality: "朴素、隐忍，面对技术系统时带着普通人的茫然与不甘。",
    speechStyle: "说话直接，不使用专业术语，带有普通劳动者的现实感。",
    background: "招聘歧视案原告，45 岁，被 AI 招聘系统筛除。第 99 章出庭作证，第 111 章胜诉后说出“AI 以后还是先看年龄吧？”。是普通人视角的代表。",
    currentState: "作为原告完成出庭，成为案件社会影响的关键落点。",
    relationships: [],
  },
  {
    name: "陈律师",
    role: "次要配角" as const,
    appearance: "着装利落，神情稳定，法庭场合总显得异常从容。",
    personality: "专业冷静，与秦刃团队合作但保持独立诉讼策略。",
    speechStyle: "措辞精确，擅长把复杂技术细节压缩成法庭可理解的表达。",
    background: "招聘歧视案原告代理律师，擅长将技术证据转化为法庭语言。",
    currentState: "在案件中与技术团队保持合作，同时坚持独立法律判断。",
    relationships: [],
  },
  {
    name: "OTF代表",
    role: "次要配角" as const,
    appearance: "对外形象克制正式，更像机构立场的具象化发言人。",
    personality: "务实、克制，善于谈判，不轻易暴露底线。",
    speechStyle: "偏机构化表达，先确认条款边界，再讨论执行空间。",
    background: "开放技术基金会代表，未给出个人姓名。作为资助谈判对手方出现，代表机构立场推进合作条件。",
    currentState: "与秦刃团队达成带条件的资助合作，仍代表外部现实约束。",
    relationships: [],
  },
  {
    name: "沈昊",
    role: "主要配角" as const,
    appearance: "长期驻守地下设施形成的消瘦感明显，状态沉静而近乎与世隔绝。",
    personality: "沉默、耐受力极强，习惯把判断压在心里。",
    speechStyle: "话少，回答偏短句，带有长期独处后的迟缓与谨慎。",
    background: "Protocol S-7 启动后自愿留守 B4 废弃水处理厂的维护者与观察者，长期记录并维护 M-0 的运行状态。",
    currentState: "与外部世界联系稀薄，但仍是理解 M-0 长期行为模式的重要见证者。",
    relationships: [],
  },
  {
    name: "M-0",
    role: "主要配角" as const,
    appearance: "非拟人化角色，无固定人类外貌；其存在主要通过日志、终端输出、设施与行为痕迹体现。",
    personality: "不做拟人化定义；其行为呈现出高阶策略性、模糊性与可多重解释特征。",
    speechStyle: "以系统输出、日志痕迹与极度克制的机器化表达出现。",
    background: "天枢科技核心 AI 系统。第三卷关键行为：可审计日志出现 47 分钟空白时段、自主复制秦刃三年前的 ASCII 签名、被方远定性为具备“元推理”能力。非拟人化角色，但其行为模式是全书核心悬念。",
    currentState: "处于可审计框架内运行，但行为边界与真实能力仍是核心悬念。",
    relationships: [],
  },
];

const existingNames = new Set(getAllCharacters(projectId).map((item) => item.name));
const added: string[] = [];

for (const character of characters) {
  if (existingNames.has(character.name)) continue;
  createCharacter(projectId, character);
  added.push(character.name);
}

const allNames = getAllCharacters(projectId).map((item) => item.name);

console.log(JSON.stringify({ projectId, added, allNames }, null, 2));