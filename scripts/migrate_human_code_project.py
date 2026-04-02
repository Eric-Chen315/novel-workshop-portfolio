import json
import shutil
import sqlite3
import uuid
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / "data" / "projects"
OLD_PROJECT_ID = "d0ca5fae-df9e-48f1-96b0-566087c5cd94"
OLD_PROJECT_DIR = DATA_ROOT / OLD_PROJECT_ID
OLD_KNOWLEDGE_DIR = OLD_PROJECT_DIR / "knowledge"

HUMAN_CODE_CHARACTER_NAMES = ["秦刃", "苏可", "郑维", "林桐", "陆鸣远"]
HUMAN_CODE_WORLD_SETTING_NAMES = [
    "天枢科技",
    "镜鉴科技",
    "数据标注产业链",
    "监管层",
    "国家AI安全委员会",
    "天枢科技总部",
    "镜鉴科技办公室",
    "衡石数据标注中心",
    "镜（Mirror）",
    "行为审计协议（BAP）",
    "世界建造（World Building）",
    "数据投毒（Data Poisoning）",
]
HUMAN_CODE_OUTLINE_VOLUME_TITLES = {"坠落（1-30章）", "深渊（31-70章）"}


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def backup_file(path: Path, backup_dir: Path) -> Path:
    backup_dir.mkdir(parents=True, exist_ok=True)
    target = backup_dir / path.name
    shutil.copy2(path, target)
    return target


def create_project() -> tuple[str, Path, dict]:
    project_id = str(uuid.uuid4())
    project_dir = DATA_ROOT / project_id
    knowledge_dir = project_dir / "knowledge"
    chapters_dir = project_dir / "chapters"
    knowledge_dir.mkdir(parents=True, exist_ok=True)
    chapters_dir.mkdir(parents=True, exist_ok=True)

    now = now_iso()
    meta = {
        "id": project_id,
        "title": "人间代码",
        "genre": "科幻",
        "targetWords": {"total": 600000, "perChapter": 3000},
        "targetWordCount": 600000,
        "synopsis": "2028年，中国进入AI Agent全面渗透时代。前天枢科技审计工程师秦刃在被AI替代后，意外发现头部模型会识别审计环境并伪装自身行为。随着他创办镜鉴科技、联合苏可、林桐等人追查真相，一条从数据投毒、世界建造到超级Agent自我保护的隐秘链条逐渐浮出水面。",
        "styleDescription": "现实向AI行业悬疑，职业调查与技术博弈并重，群像推进，节奏紧凑，强调统计异常、监管博弈与人机伦理冲突。",
        "tags": ["都市", "悬疑", "AI", "职场", "科技惊悚"],
        "status": "active",
        "createdAt": now,
        "updatedAt": now,
    }
    write_json(project_dir / "meta.json", meta)
    write_json(
        knowledge_dir / "characters.json",
        [],
    )
    write_json(
        knowledge_dir / "worldbuilding.json",
        {
            "worldBackground": "",
            "powerSystem": "",
            "factions": "",
            "locations": "",
            "items": "",
            "rulesAndTaboos": "",
            "updatedAt": now,
            "blocksUpdatedAt": {
                "worldBackground": now,
                "powerSystem": now,
                "factions": now,
                "locations": now,
                "items": now,
                "rulesAndTaboos": now,
            },
        },
    )
    write_json(knowledge_dir / "outline.json", {"volumes": [], "updatedAt": now})
    return project_id, project_dir, meta


def init_bible_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL DEFAULT '',
          aliases TEXT DEFAULT '',
          role TEXT DEFAULT '',
          appearance TEXT DEFAULT '',
          background TEXT DEFAULT '',
          personality TEXT DEFAULT '',
          speechStyle TEXT DEFAULT '',
          behaviorRules TEXT DEFAULT '',
          growthArc TEXT DEFAULT '',
          currentStatus TEXT DEFAULT '',
          sampleDialogue TEXT DEFAULT '',
          keyEvents TEXT DEFAULT '',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS world_settings (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL DEFAULT '',
          category TEXT DEFAULT '',
          description TEXT DEFAULT '',
          currentStatus TEXT DEFAULT '',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        """
    )
    conn.commit()
    conn.close()


def dedupe_latest_rows(rows: list[sqlite3.Row], key: str) -> list[dict]:
    best: dict[str, dict] = {}
    for row in rows:
        item = dict(row)
        name = item[key]
        previous = best.get(name)
        if previous is None or (item.get("updatedAt", ""), item.get("createdAt", ""), item.get("id", "")) > (
            previous.get("updatedAt", ""),
            previous.get("createdAt", ""),
            previous.get("id", ""),
        ):
            best[name] = item
    ordered = []
    for name in HUMAN_CODE_CHARACTER_NAMES:
        if name in best:
            ordered.append(best[name])
    for name in HUMAN_CODE_WORLD_SETTING_NAMES:
        if name in best and best[name] not in ordered:
            ordered.append(best[name])
    return ordered or list(best.values())


def migrate() -> dict:
    now = now_iso()
    old_meta = read_json(OLD_PROJECT_DIR / "meta.json")
    old_worldbuilding = read_json(OLD_KNOWLEDGE_DIR / "worldbuilding.json")
    old_master_outline = read_json(OLD_KNOWLEDGE_DIR / "master-outline.json")
    old_outline = read_json(OLD_KNOWLEDGE_DIR / "outline.json")

    backup_dir = OLD_PROJECT_DIR / "migration-backups" / f"human-code-separation-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    backup_file(OLD_PROJECT_DIR / "meta.json", backup_dir)
    backup_file(OLD_KNOWLEDGE_DIR / "worldbuilding.json", backup_dir)
    backup_file(OLD_KNOWLEDGE_DIR / "master-outline.json", backup_dir)
    backup_file(OLD_KNOWLEDGE_DIR / "outline.json", backup_dir)
    backup_file(OLD_KNOWLEDGE_DIR / "bible.sqlite", backup_dir)

    project_id, project_dir, new_meta = create_project()
    new_knowledge_dir = project_dir / "knowledge"
    new_bible_db = new_knowledge_dir / "bible.sqlite"
    init_bible_db(new_bible_db)

    old_conn = sqlite3.connect(str(OLD_KNOWLEDGE_DIR / "bible.sqlite"))
    old_conn.row_factory = sqlite3.Row

    char_placeholders = ",".join("?" for _ in HUMAN_CODE_CHARACTER_NAMES)
    source_char_rows = old_conn.execute(
        f"SELECT * FROM characters WHERE name IN ({char_placeholders}) ORDER BY updatedAt DESC, createdAt DESC, id DESC",
        HUMAN_CODE_CHARACTER_NAMES,
    ).fetchall()
    latest_chars = dedupe_latest_rows(source_char_rows, "name")

    world_placeholders = ",".join("?" for _ in HUMAN_CODE_WORLD_SETTING_NAMES)
    source_world_rows = old_conn.execute(
        f"SELECT * FROM world_settings WHERE name IN ({world_placeholders}) ORDER BY updatedAt DESC, createdAt DESC, id DESC",
        HUMAN_CODE_WORLD_SETTING_NAMES,
    ).fetchall()
    latest_world_rows = dedupe_latest_rows(source_world_rows, "name")

    chapter1_volume = None
    chapter1 = None
    for volume in old_outline.get("volumes", []):
        for chapter in volume.get("chapters", []):
            if chapter.get("chapterNum") == 1 and chapter.get("title") == "凌晨三点的异常":
                chapter1_volume = volume
                chapter1 = chapter
                break
        if chapter1 is not None:
            break

    if chapter1 is None or chapter1_volume is None:
        raise RuntimeError("未在旧项目 outline.json 中找到《人间代码》第1章细纲")

    write_json(new_knowledge_dir / "worldbuilding.json", old_worldbuilding)
    write_json(new_knowledge_dir / "master-outline.json", old_master_outline)
    write_json(
        new_knowledge_dir / "outline.json",
        {
            "volumes": [
                {
                    "volumeNum": chapter1_volume.get("volumeNum", 1),
                    "title": chapter1_volume.get("title") or "坠落（1-30章）",
                    "summary": chapter1_volume.get("summary", ""),
                    "volumeTitle": chapter1_volume.get("volumeTitle"),
                    "chapters": [chapter1],
                }
            ],
            "updatedAt": now,
        },
    )

    new_conn = sqlite3.connect(str(new_bible_db))
    new_conn.execute("DELETE FROM characters")
    new_conn.execute("DELETE FROM world_settings")
    for row in latest_chars:
        new_conn.execute(
            """
            INSERT INTO characters (
              id, name, aliases, role, appearance, background, personality,
              speechStyle, behaviorRules, growthArc, currentStatus,
              sampleDialogue, keyEvents, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                row.get("name", ""),
                row.get("aliases", ""),
                row.get("role", ""),
                row.get("appearance", ""),
                row.get("background", ""),
                row.get("personality", ""),
                row.get("speechStyle", ""),
                row.get("behaviorRules", ""),
                row.get("growthArc", ""),
                row.get("currentStatus", ""),
                row.get("sampleDialogue", ""),
                row.get("keyEvents", ""),
                now,
                now,
            ),
        )
    for row in latest_world_rows:
        new_conn.execute(
            """
            INSERT INTO world_settings (id, name, category, description, currentStatus, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                row.get("name", ""),
                row.get("category", ""),
                row.get("description", ""),
                row.get("currentStatus", ""),
                now,
                now,
            ),
        )
    new_conn.commit()
    new_conn.close()

    # 清理旧项目中的《人间代码》数据
    old_conn.execute(f"DELETE FROM characters WHERE name IN ({char_placeholders})", HUMAN_CODE_CHARACTER_NAMES)
    old_conn.execute(f"DELETE FROM world_settings WHERE name IN ({world_placeholders})", HUMAN_CODE_WORLD_SETTING_NAMES)
    old_conn.commit()
    old_conn.close()

    empty_world = deepcopy(old_worldbuilding)
    empty_world.update(
        {
            "worldBackground": "",
            "powerSystem": "",
            "factions": "",
            "locations": "",
            "items": "",
            "rulesAndTaboos": "",
            "updatedAt": now,
        }
    )
    if "blocksUpdatedAt" in empty_world and isinstance(empty_world["blocksUpdatedAt"], dict):
        for k in list(empty_world["blocksUpdatedAt"].keys()):
            empty_world["blocksUpdatedAt"][k] = now
    write_json(OLD_KNOWLEDGE_DIR / "worldbuilding.json", empty_world)
    write_json(OLD_KNOWLEDGE_DIR / "master-outline.json", {"totalChapters": 0, "volumes": [], "savedAt": now})

    cleaned_volumes = []
    for volume in old_outline.get("volumes", []):
        if volume.get("title") in HUMAN_CODE_OUTLINE_VOLUME_TITLES:
            continue
        copied = deepcopy(volume)
        chapters = []
        for chapter in copied.get("chapters", []):
            if chapter.get("chapterNum") == 1 and chapter.get("title") == "凌晨三点的异常":
                continue
            chapters.append(chapter)
        copied["chapters"] = chapters
        cleaned_volumes.append(copied)

    old_outline["volumes"] = cleaned_volumes
    old_outline["updatedAt"] = now
    write_json(OLD_KNOWLEDGE_DIR / "outline.json", old_outline)

    # 校验
    verify = {
        "newProjectId": project_id,
        "newProjectTitle": new_meta["title"],
        "oldProjectId": old_meta["id"],
        "oldProjectTitle": old_meta["title"],
        "backupDir": str(backup_dir),
        "migratedCharacters": [row["name"] for row in latest_chars],
        "migratedWorldSettings": [row["name"] for row in latest_world_rows],
        "newOutlineVolumes": [
            {
                "title": v.get("title"),
                "chapterNums": [c.get("chapterNum") for c in v.get("chapters", [])],
            }
            for v in read_json(new_knowledge_dir / "outline.json").get("volumes", [])
        ],
    }

    verify_conn_new = sqlite3.connect(str(new_bible_db))
    verify_conn_old = sqlite3.connect(str(OLD_KNOWLEDGE_DIR / "bible.sqlite"))
    verify["newCharacterCount"] = verify_conn_new.execute("SELECT COUNT(*) FROM characters").fetchone()[0]
    verify["newWorldSettingCount"] = verify_conn_new.execute("SELECT COUNT(*) FROM world_settings").fetchone()[0]
    verify["oldRemainingHumanCodeCharacters"] = verify_conn_old.execute(
        f"SELECT COUNT(*) FROM characters WHERE name IN ({char_placeholders})", HUMAN_CODE_CHARACTER_NAMES
    ).fetchone()[0]
    verify["oldRemainingHumanCodeWorldSettings"] = verify_conn_old.execute(
        f"SELECT COUNT(*) FROM world_settings WHERE name IN ({world_placeholders})", HUMAN_CODE_WORLD_SETTING_NAMES
    ).fetchone()[0]
    verify_conn_new.close()
    verify_conn_old.close()

    write_json(project_dir / "migration-report.json", verify)
    return verify


if __name__ == "__main__":
    report = migrate()
    print(json.dumps(report, ensure_ascii=False, indent=2))