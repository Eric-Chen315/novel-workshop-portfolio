import json
import shutil
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "projects"
OLD_PROJECT_ID = "d0ca5fae-df9e-48f1-96b0-566087c5cd94"
NEW_PROJECT_ID = "b430f9aa-7149-41a4-8197-95cf3d1e9d30"
BACKUP_DIR = (
    DATA_ROOT
    / OLD_PROJECT_ID
    / "migration-backups"
    / "human-code-separation-20260319-231919"
)

HUMAN_CODE_VOLUME_TITLES = {
    "坠落（1-30章）",
    "深渊（31-70章）",
    "觉醒（71-171章）",
}


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def backup_file(path: Path, backup_dir: Path) -> None:
    backup_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, backup_dir / path.name)


def summarize(volumes: list[dict]) -> list[dict]:
    return [
        {
            "title": v.get("title"),
            "chapterCount": len(v.get("chapters", [])),
            "minChapter": min([c.get("chapterNum") for c in v.get("chapters", []) if isinstance(c.get("chapterNum"), int)] or [None]),
            "maxChapter": max([c.get("chapterNum") for c in v.get("chapters", []) if isinstance(c.get("chapterNum"), int)] or [None]),
        }
        for v in volumes
    ]


def main() -> None:
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    recovery_backup_dir = BACKUP_DIR / f"outline-recovery-{timestamp}"

    backup_outline_path = BACKUP_DIR / "outline.json"
    new_outline_path = DATA_ROOT / NEW_PROJECT_ID / "knowledge" / "outline.json"
    old_outline_path = DATA_ROOT / OLD_PROJECT_ID / "knowledge" / "outline.json"

    backup_outline = read_json(backup_outline_path)
    new_outline = read_json(new_outline_path)
    old_outline = read_json(old_outline_path)

    backup_file(new_outline_path, recovery_backup_dir)
    backup_file(old_outline_path, recovery_backup_dir)

    recovered_volumes = [
        volume
        for volume in backup_outline.get("volumes", [])
        if volume.get("title") in HUMAN_CODE_VOLUME_TITLES
    ]

    if not recovered_volumes:
        raise RuntimeError("未在备份 outline.json 中找到可恢复的《人间代码》卷块")

    new_outline["volumes"] = recovered_volumes
    new_outline["updatedAt"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    write_json(new_outline_path, new_outline)

    old_outline["volumes"] = [
        volume
        for volume in old_outline.get("volumes", [])
        if volume.get("title") not in HUMAN_CODE_VOLUME_TITLES
    ]
    old_outline["updatedAt"] = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    write_json(old_outline_path, old_outline)

    result = {
        "recoveredFrom": str(backup_outline_path),
        "newProjectId": NEW_PROJECT_ID,
        "oldProjectId": OLD_PROJECT_ID,
        "recoveredVolumes": summarize(recovered_volumes),
        "newProjectOutline": summarize(read_json(new_outline_path).get("volumes", [])),
        "oldProjectRemainingOutline": summarize(read_json(old_outline_path).get("volumes", [])),
        "recoveryBackupDir": str(recovery_backup_dir),
    }
    report_path = DATA_ROOT / NEW_PROJECT_ID / "outline-recovery-report.json"
    write_json(report_path, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()