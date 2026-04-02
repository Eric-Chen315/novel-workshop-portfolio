declare module "better-sqlite3" {
  // 最小声明：避免 Next/TS 报错。具体类型在需要时再补全。
  const Database: any;
  export default Database;
}
