import { Client } from "pg";

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
    console.error("Error parsing connection string:", error);

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
    await adminClient.connect();
    console.log("Connected to PostgreSQL server for database management");

    // 檢查資料庫是否存在
    const dbCheckResult = await adminClient.query(
      `
            SELECT 1 FROM pg_database WHERE datname = $1
        `,
      [DB_NAME],
    );

    // 如果資料庫不存在，創建它
    if (dbCheckResult.rows.length === 0) {
      console.log(`Database '${DB_NAME}' does not exist. Creating...`);
      // 必須使用單引號而非參數化查詢來創建資料庫
      await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`Database '${DB_NAME}' created successfully`);
    } else {
      console.log(`Database '${DB_NAME}' already exists`);
    }
  } catch (err) {
    console.error("Error ensuring database exists:", err);
    throw err;
  } finally {
    await adminClient.end();
    console.log("Admin connection closed");
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
    await client.connect();
    console.log(`Connected to database '${DB_NAME}'`);

    // 首先刪除表（如果存在）
    console.log(`Dropping table '${TABLE_NAME}' if exists...`);
    await client.query(dropTableSQL);
    console.log(`Table dropped (if existed)`);

    // 然後創建表
    console.log(`Creating table '${TABLE_NAME}'...`);
    await client.query(createTestUserTableSQL);
    console.log(`Table '${TABLE_NAME}' created successfully`);

    // 確認表已創建
    const tableCheckResult = await client.query(
      `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            );
        `,
      [TABLE_NAME],
    );

    if (tableCheckResult.rows[0].exists) {
      console.log(`Verified: Table '${TABLE_NAME}' exists`);
    } else {
      throw new Error(`Failed to create table '${TABLE_NAME}'`);
    }
  } catch (err) {
    console.error(`Error recreating table:`, err);
    throw err;
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}

// 主函數：初始化資料庫
async function initDatabase(): Promise<void> {
  console.log("Starting database initialization...");
  console.log(
    `Using connection URL: ${POSTGRES_URL.replace(/:[^:@]+@/, ":****@")}`,
  );

  try {
    // 步驟1: 確保資料庫存在
    await ensureDatabaseExists();

    // 步驟2: 刪除並重新創建資料表
    await recreateTestUserTable();

    console.log("✅ Database initialization completed successfully!");
  } catch (err) {
    console.error("❌ Database initialization failed:", err);
    process.exit(1);
  }
}

// ESM 模式下的主模塊檢測
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  initDatabase()
    .then(() => {
      console.log("Script execution completed");
    })
    .catch((err) => {
      console.error("Unhandled error during script execution:", err);
      process.exit(1);
    });
}

// 導出供其他模塊使用
export { initDatabase, recreateTestUserTable };
