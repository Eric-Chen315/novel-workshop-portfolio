import json
import sqlite3
from pathlib import Path


def main() -> None:
    db_path = Path(__file__).resolve().parents[1] / "data" / "projects" / "d0ca5fae-df9e-48f1-96b0-566087c5cd94" / "knowledge" / "bible.sqlite"
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    print(json.dumps({"tables": [row[0] for row in cur.fetchall()]}, ensure_ascii=False, indent=2))

    for table in ["characters", "world_settings"]:
        try:
            rows = [dict(row) for row in cur.execute(f"SELECT * FROM {table} ORDER BY updatedAt DESC, createdAt DESC, id DESC").fetchall()]
            print(json.dumps({"table": table, "rows": rows}, ensure_ascii=False, indent=2))
        except Exception as error:
            print(json.dumps({"table": table, "error": str(error)}, ensure_ascii=False, indent=2))

    conn.close()


if __name__ == "__main__":
    main()