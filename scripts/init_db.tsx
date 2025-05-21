import { Client } from "pg";

// ANSI 顏色代碼
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// 日誌輸出函數
const logger = {
  info: (message: string) =>
    console.log(`${colors.bright}${colors.blue}ℹ ${colors.reset}${message}`),
  success: (message: string) =>
    console.log(`${colors.bright}${colors.green}✓ ${colors.reset}${message}`),
  warn: (message: string) =>
    console.log(`${colors.bright}${colors.yellow}⚠ ${colors.reset}${message}`),
  error: (message: string, error?: any) => {
    console.error(`${colors.bright}${colors.red}✗ ${colors.reset}${message}`);
    if (error)
      console.error(`  ${colors.dim}${error.toString()}${colors.reset}`);
  },
  step: (step: number, total: number, message: string) => {
    console.log(
      `${colors.bright}${colors.cyan}[${step}/${total}] ${colors.reset}${message}`,
    );
  },
  divider: () => console.log(`${colors.dim}${"─".repeat(50)}${colors.reset}`),
  operation: (message: string) =>
    console.log(`  ${colors.magenta}› ${colors.reset}${message}`),
  result: (message: string) =>
    console.log(`    ${colors.gray}→ ${colors.reset}${message}`),
};

// 資料庫配置
const POSTGRES_URL =
  process.env.POSTGRES_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";
const DB_NAME = "automotive";
const TABLE_NAME = "dev_user";

// 從連接字串中提取主機、端口、使用者名稱和密碼
function parseConnectionString(url: string): {
  host: string;
  port: string;
  user: string;
  password: string;
} {
  try {
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/.*/;
    const matches = url.match(regex);

    if (!matches || matches.length < 5) {
      throw new Error("Invalid PostgreSQL connection string format");
    }

    return {
      user: matches[1],
      password: matches[2],
      host: matches[3],
      port: matches[4],
    };
  } catch (error) {
    logger.error("Error parsing connection string:", error);

    return {
      host: "localhost",
      port: "5432",
      user: "postgres",
      password: "postgres",
    };
  }
}

// 創建資料表的SQL
const createTestUserTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    air_conditioning BOOLEAN DEFAULT false,
    fan_speed INTEGER DEFAULT 0,
    airflow_head_on BOOLEAN DEFAULT false,
    airflow_body_on BOOLEAN DEFAULT false,
    airflow_feet_on BOOLEAN DEFAULT false,
    temperature FLOAT DEFAULT 22.0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// 刪除資料表的SQL
const dropTableSQL = `DROP TABLE IF EXISTS ${TABLE_NAME};`;

// 確保資料庫存在
async function ensureDatabaseExists(): Promise<void> {
  // 解析連接字串以獲取連接資訊
  const connInfo = parseConnectionString(POSTGRES_URL);

  // 連接到默認的postgres資料庫進行管理操作
  const adminConnectionString = `postgresql://${connInfo.user}:${connInfo.password}@${connInfo.host}:${connInfo.port}/postgres`;

  const adminClient = new Client({
    connectionString: adminConnectionString,
  });

  try {
    logger.operation("Connecting to PostgreSQL server");
    await adminClient.connect();
    logger.result("Connected successfully");

    // 檢查資料庫是否存在
    logger.operation(`Checking if database '${DB_NAME}' exists`);
    const dbCheckResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME],
    );

    // 如果資料庫不存在，創建它
    if (dbCheckResult.rows.length === 0) {
      logger.operation(`Creating database '${DB_NAME}'`);
      await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
      logger.result(`Database created successfully`);
    } else {
      logger.result(`Database already exists`);
    }
  } catch (err) {
    logger.error("Database creation failed", err);
    throw err;
  } finally {
    await adminClient.end();
  }
}

// 重新創建資料表
async function recreateTestUserTable(): Promise<void> {
  // 解析連接字串以替換資料庫名稱
  const dbConnectionString = POSTGRES_URL.replace(/\/[^\/]+$/, `/${DB_NAME}`);

  const client = new Client({
    connectionString: dbConnectionString,
  });

  try {
    logger.operation(`Connecting to database '${DB_NAME}'`);
    await client.connect();
    logger.result("Connected successfully");

    // 首先刪除表（如果存在）
    logger.operation(`Dropping existing table '${TABLE_NAME}'`);
    await client.query(dropTableSQL);

    // 然後創建表
    logger.operation(`Creating table '${TABLE_NAME}'`);
    await client.query(createTestUserTableSQL);

    // 確認表已創建
    logger.operation("Verifying table creation");
    const tableCheckResult = await client.query(
      `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
      );`,
      [TABLE_NAME],
    );

    if (tableCheckResult.rows[0].exists) {
      logger.result("Table verified and ready");
    } else {
      throw new Error(`Failed to create table '${TABLE_NAME}'`);
    }
  } catch (err) {
    logger.error("Table recreation failed", err);
    throw err;
  } finally {
    await client.end();
  }
}

// 主函數：初始化資料庫
async function initDatabase(): Promise<void> {
  console.log(
    `\n${colors.bright}${colors.cyan}=== PostgreSQL Database Initialization ===${colors.reset}\n`,
  );
  logger.info(`Connection: ${POSTGRES_URL.replace(/:[^:@]+@/, ":****@")}`);
  logger.info(`Target database: ${DB_NAME}`);
  logger.info(`Target table: ${TABLE_NAME}`);
  logger.divider();

  try {
    // 步驟1: 確保資料庫存在
    logger.step(1, 2, "Ensuring database exists");
    await ensureDatabaseExists();

    // 步驟2: 刪除並重新創建資料表
    logger.step(2, 2, "Setting up tables");
    await recreateTestUserTable();

    logger.divider();
    logger.success("Database initialization completed successfully!");
  } catch (err) {
    logger.divider();
    logger.error("Database initialization failed", err);
    process.exit(1);
  }
}

// ESM 模式下的主模塊檢測
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  initDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      logger.error("Unhandled error during execution", err);
      process.exit(1);
    });
}

// 導出供其他模塊使用
export { initDatabase, recreateTestUserTable };
