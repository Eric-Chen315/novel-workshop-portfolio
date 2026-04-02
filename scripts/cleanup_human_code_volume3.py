import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTLINE_PATH = ROOT / "data" / "projects" / "b430f9aa-7149-41a4-8197-95cf3d1e9d30" / "knowledge" / "outline.json"


def main() -> None:
    data = json.loads(OUTLINE_PATH.read_text(encoding="utf-8"))
    for volume in data.get("volumes", []):
        if volume.get("volumeNum") == 3 or str(volume.get("title", "")).startswith("觉醒（71-"):
            kept = []
            for chapter in volume.get("chapters", []):
                num = chapter.get("chapterNum")
                if isinstance(num, int) and 71 <= num <= 115:
                    kept.append(chapter)
            volume["chapters"] = kept
            volume["chapterRange"] = "71-115"
            volume["title"] = "觉醒（71-115章）"
            break

    OUTLINE_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    summary = []
    for volume in data.get("volumes", []):
        nums = [c.get("chapterNum") for c in volume.get("chapters", []) if isinstance(c.get("chapterNum"), int)]
        summary.append(
            {
                "volumeNum": volume.get("volumeNum"),
                "title": volume.get("title"),
                "chapterRange": volume.get("chapterRange"),
                "chapterCount": len(volume.get("chapters", [])),
                "minChapter": min(nums) if nums else None,
                "maxChapter": max(nums) if nums else None,
            }
        )

    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()