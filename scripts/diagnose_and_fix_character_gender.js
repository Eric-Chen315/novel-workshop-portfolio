const path = require('node:path');
const Database = require('better-sqlite3');

const projectId = 'b430f9aa-7149-41a4-8197-95cf3d1e9d30';
const dbPath = path.join(process.cwd(), 'data', 'projects', projectId, 'knowledge', 'bible.sqlite');

const genderMap = {
  '秦刃': '男',
  '苏可': '女',
  '林桐': '男',
  '赵谦': '女',
  '郑维': '男',
  '陆鸣远': '男',
  '方远': '男',
  '周翰': '男',
  '沈明哲': '男',
  '王建国': '男',
  '陈律师': '男',
  '林正阳': '男',
  'M-0': '无性别',
  '秦简': '待定',
  'OTF代表': '待定',
};

const db = new Database(dbPath);

try {
  const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('=== 数据库表结构诊断 ===');
  for (const table of tables) {
    console.log(`表: ${table.name}`);
    console.log(table.sql || '(无DDL)');
    console.log('---');
  }

  const charactersExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='characters'").get();
  if (!charactersExists) {
    console.log('未找到 characters 表，无法执行性别迁移。');
    process.exit(0);
  }

  const columns = db.prepare("PRAGMA table_info(characters)").all();
  console.log('=== characters 表字段 ===');
  console.log(columns);

  const hasGender = columns.some((column) => column.name === 'gender');
  if (!hasGender) {
    db.prepare("ALTER TABLE characters ADD COLUMN gender TEXT DEFAULT ''").run();
    console.log("已执行：ALTER TABLE characters ADD COLUMN gender TEXT DEFAULT ''");
  } else {
    console.log('gender 列已存在，无需 ALTER TABLE');
  }

  const characters = db.prepare("SELECT id, name, role, gender, createdAt FROM characters ORDER BY createdAt DESC").all();
  console.log('=== 角色数据样本 ===');
  console.log('角色总数:', characters.length);
  for (const char of characters) {
    console.log(char);
  }

  const updateStmt = db.prepare("UPDATE characters SET gender = ? WHERE name = ?");
  const transaction = db.transaction(() => {
    for (const [name, gender] of Object.entries(genderMap)) {
      updateStmt.run(gender, name);
    }
  });
  transaction();

  const updatedCharacters = db.prepare("SELECT name, gender FROM characters WHERE name IN (SELECT name FROM characters) ORDER BY createdAt DESC").all();
  console.log('=== 性别写入后结果 ===');
  for (const char of updatedCharacters) {
    console.log(char);
  }

  console.log('=== 执行方案 ===');
  console.log('采用方案A：characters 表增加 gender TEXT 列，并按角色名批量写入性别。');
} finally {
  db.close();
}