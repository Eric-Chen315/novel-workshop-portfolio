import type { CharacterRow, DeprecatedRow, PlotlineRow, SettingRow } from "./types";

export function buildBibleSummary(args: {
  characters: CharacterRow[];
  settings: SettingRow[];
  plotlines: PlotlineRow[];
  deprecated: DeprecatedRow[];
}) {
  const { characters, settings, plotlines, deprecated } = args;

  const injectedCharacters = characters
    .filter((c) => c.defaultInject === 1)
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));

  const untriggeredPlotlines = plotlines
    .filter((p) => p.status === "untriggered")
    .sort((a, b) => a.name.localeCompare(b.name, "zh"));

  const lines: string[] = [];

  lines.push("【角色圣经·核心摘要】");
  if (injectedCharacters.length === 0) {
    lines.push("（暂无默认注入角色）");
  } else {
    for (const c of injectedCharacters) {
      const parts = [
        `${c.name}：${c.personality || ""}`.trimEnd(),
        c.speakingStyle ? `，${c.speakingStyle}` : "",
        c.catchphrase ? `，口头禅\"${c.catchphrase}\"` : "",
        c.currentLocation ? `，${c.currentLocation}` : "",
        c.currentStatus ? `，${c.currentStatus}` : "",
      ].join("");
      lines.push(parts.replace(/，+/g, "，").replace(/：，/g, "：").trim());
    }
  }

  lines.push("");
  lines.push("【关键设定】");
  if (settings.length === 0) {
    lines.push("（暂无）");
  } else {
    for (const s of settings) {
      const tail = [s.description, s.status].filter(Boolean).join("，");
      lines.push(`${s.name}：${tail || ""}`.trim());
    }
  }

  lines.push("");
  lines.push("【暗线约束】");
  if (untriggeredPlotlines.length === 0) {
    lines.push("（暂无）");
  } else {
    for (const p of untriggeredPlotlines) {
      lines.push(`${p.name}：${p.rule}`.trim());
    }
  }

  lines.push("");
  lines.push("【废弃设定】");
  if (deprecated.length === 0) {
    lines.push("（暂无）");
  } else {
    for (const d of deprecated) {
      lines.push(`${d.name}：已废弃，${d.reason}`.trim());
    }
  }

  return lines.join("\n");
}
