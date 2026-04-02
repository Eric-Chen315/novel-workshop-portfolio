/**
 * 预处理层
 *
 * 在用户提交输入后、生成初稿前执行：
 * 1. 否定指令自动正面改写
 * 2. 反派/对手角色专项指令模板注入
 */

/**
 * 将创作指令中的否定表述转化为正面行为描述。
 * 调用时机：构建生成 prompt 之前。
 */
export async function preprocessCreativeInstructions(
  instructions: string,
  llmCall: (prompt: string) => Promise<string>
): Promise<string> {
  if (!instructions.trim()) return instructions;

  const conversionPrompt = `你是一个小说创作指令优化器。

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
输出："马修·科尔的开场段落必须展示其专业能力和内在逻辑的自洽性。他真心相信市场机制能最优配置资源，包括粮食。他的台词体现冷静的专业分析，不包含对主角的嘲讽、人身攻击或傲慢的炫耀。他的崩溃来自其世界观被事实击穿（非理性行为突破了模型边界），而非被主角的力量或气势压倒。读者在他崩溃时应感到一丝理解甚至惋惜，而非痛快。"

现在请转化以下指令（保留正面表述，只转化否定表述）：

${instructions}`;

  try {
    const converted = await llmCall(conversionPrompt);
    return `【优化后的创作指令】
${converted.trim()}

【原始指令（参考）】
${instructions}`;
  } catch {
    // 失败时返回原始指令
    return instructions;
  }
}

/**
 * 检测章节方向和创作指令中是否涉及反派/对手角色，
 * 若涉及则自动注入反脸谱化的角色塑造指令。
 */
export async function detectAndInjectAntagonistTemplate(
  direction: string,
  creativeInstructions: string,
  llmCall: (prompt: string) => Promise<string>
): Promise<string> {
  if (!direction.trim()) return creativeInstructions;

  const detectionPrompt = `分析以下章节方向，判断本章是否包含反派、对手、敌方角色的视角或重要戏份。
如果包含，提取这些角色的名字和身份。

只返回 JSON 格式（不要输出其他内容）：
{"has_antagonist": true或false, "characters": [{"name": "角色名", "identity": "身份描述"}]}

章节方向：
${direction}`;

  try {
    const raw = await llmCall(detectionPrompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return creativeInstructions;

    const result = JSON.parse(match[0]);
    if (!result.has_antagonist || !Array.isArray(result.characters) || result.characters.length === 0) {
      return creativeInstructions;
    }

    const antagonistSections = result.characters
      .map(
        (char: { name: string; identity: string }) => `
【${char.name}的角色塑造要求】
${char.name}（${char.identity}）不是用来被打脸的工具人。请遵循以下原则：
- 他/她的开场必须展示专业能力或内在逻辑的自洽性，让读者理解（虽然不认同）他/她的立场
- 他/她的台词体现冷静的专业判断，不包含对主角的嘲讽、人身攻击或夸张的傲慢炫耀
- 如果他/她最终失败/崩溃，原因是其世界观被事实击穿，而非被主角的力量或气势压倒
- 读者在他/她失败时应感到复杂情绪（理解、惋惜、甚至一丝敬意），而非单纯的痛快
- 禁止以下套路：开场嘲讽主角→中间傲慢自信→结尾震惊打脸
- 替代方案：开场专业冷静→中间发现异常数据→逐步意识到对手的非理性→最终信仰体系被击穿`
      )
      .join("\n");

    return antagonistSections.trim() + "\n\n" + creativeInstructions;
  } catch {
    return creativeInstructions;
  }
}
