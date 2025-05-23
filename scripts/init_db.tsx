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
const TABLE_NAME = "ac_settings";
// 新增車輛資訊表名稱
const VEHICLE_TABLE_NAME = "vehicle_info";

// 創建資料表的SQL（不含 function/trigger，通用觸發器分離）
const createClimateTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    air_conditioning BOOLEAN DEFAULT true NOT NULL,
    fan_speed INTEGER DEFAULT 2 NOT NULL CHECK (fan_speed BETWEEN 0 AND 10),
    airflow_head_on BOOLEAN DEFAULT false NOT NULL,
    airflow_body_on BOOLEAN DEFAULT false NOT NULL,
    airflow_feet_on BOOLEAN DEFAULT true NOT NULL,
    auto_on BOOLEAN DEFAULT false NOT NULL,
    front_defrost_on BOOLEAN DEFAULT false NOT NULL,
    rear_defrost_on BOOLEAN DEFAULT false NOT NULL,
    temperature FLOAT DEFAULT 22.0 NOT NULL CHECK (temperature BETWEEN 16.0 AND 30.0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 加入初始資料 (如果需要)
INSERT INTO ${TABLE_NAME} (air_conditioning, fan_speed, airflow_head_on, airflow_body_on, airflow_feet_on, front_defrost_on, rear_defrost_on, temperature)
VALUES (true, 2, false, false, true, false, false, 22.0::float)
ON CONFLICT DO NOTHING;
`;

// 創建車輛資訊表的SQL（不含 function/trigger，通用觸發器分離）
const createVehicleInfoTableSQL = `
CREATE TABLE IF NOT EXISTS ${VEHICLE_TABLE_NAME} (
  engine_warning BOOLEAN DEFAULT false NOT NULL,
  oil_pressure_warning BOOLEAN DEFAULT false NOT NULL,
  battery_warning BOOLEAN DEFAULT false NOT NULL,
  coolant_temp_warning BOOLEAN DEFAULT false NOT NULL,
  brake_warning BOOLEAN DEFAULT false NOT NULL,
  abs_warning BOOLEAN DEFAULT false NOT NULL,
  tpms_warning BOOLEAN DEFAULT false NOT NULL,
  airbag_warning BOOLEAN DEFAULT false NOT NULL,
  low_fuel_warning BOOLEAN DEFAULT false NOT NULL,
  door_ajar_warning BOOLEAN DEFAULT false NOT NULL,
  seat_belt_warning BOOLEAN DEFAULT false NOT NULL,
  exterior_light_failure_warning BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 初始資料插入
INSERT INTO ${VEHICLE_TABLE_NAME} DEFAULT VALUES
ON CONFLICT DO NOTHING;
`;

// 刪除資料表的SQL
const dropTableSQL = `
-- 刪除觸發器和函數
DROP TRIGGER IF EXISTS update_${TABLE_NAME}_timestamp ON ${TABLE_NAME};
DROP TRIGGER IF EXISTS notify_ac_settings_update_trigger ON ${TABLE_NAME};
-- 刪除表
DROP TABLE IF EXISTS ${TABLE_NAME};
`;
// 刪除車輛資訊表的SQL
const dropVehicleTableSQL = `
DROP TRIGGER IF EXISTS update_${VEHICLE_TABLE_NAME}_timestamp ON ${VEHICLE_TABLE_NAME};
DROP TRIGGER IF EXISTS notify_${VEHICLE_TABLE_NAME}_update_trigger ON ${VEHICLE_TABLE_NAME};
DROP TABLE IF EXISTS ${VEHICLE_TABLE_NAME};
`;

// 通用 updated_at/notify function
const genericPgNotifySQL = `
CREATE OR REPLACE FUNCTION update_timestamp_generic()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_table_update()
RETURNS TRIGGER AS $$
DECLARE
  channel TEXT := TG_TABLE_NAME || '_update';
BEGIN
  PERFORM pg_notify(channel, row_to_json(NEW)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

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
async function recreateTable(): Promise<void> {
  // 解析連接字串以替換資料庫名稱
  const dbConnectionString = POSTGRES_URL.replace(/\/[^\/]+$/, `/${DB_NAME}`);
  const client = new Client({
    connectionString: dbConnectionString,
  });

  try {
    logger.operation(`Connecting to database '${DB_NAME}'`);
    await client.connect();
    logger.result("Connected successfully");

    // 建立通用 function（若尚未存在）
    logger.operation("Creating generic pg_notify/update_timestamp functions");
    await client.query(genericPgNotifySQL);
    logger.result("Generic trigger functions ensured");

    // 首先刪除表（如果存在）
    logger.operation(`Dropping existing table '${TABLE_NAME}'`);
    await client.query(dropTableSQL);
    // 刪除車輛資訊表（如果存在）
    logger.operation(`Dropping existing table '${VEHICLE_TABLE_NAME}'`);
    await client.query(dropVehicleTableSQL);

    // 然後創建表
    logger.operation(`Creating table '${TABLE_NAME}'`);
    try {
      await client.query(createClimateTableSQL);
      logger.result(
        "Table created with all constraints, triggers, and initial data",
      );
    } catch (err) {
      // PostgreSQL較舊版本可能不支援COMMENT，如果這樣我們嘗試一個簡化版本
      if (/syntax error at or near.*comment/i.test(err.message)) {
        logger.warn(
          "Your PostgreSQL version doesn't support COMMENT in CREATE TABLE",
        );

        // 簡化版本的SQL（移除COMMENT）
        const simplifiedSQL = createClimateTableSQL.replace(
          /\sCOMMENT\s+'[^']*'/g,
          "",
        );

        await client.query(simplifiedSQL);
        logger.result("Table created with simplified SQL (without comments)");
      } else {
        throw err;
      }
    }
    // 創建車輛資訊表
    logger.operation(`Creating table '${VEHICLE_TABLE_NAME}'`);
    try {
      await client.query(createVehicleInfoTableSQL);
      logger.result(
        "Vehicle info table created with constraints, triggers, and initial data",
      );
    } catch (err) {
      // PostgreSQL 較舊版本可能不支持 COMMENT
      if (/syntax error at or near.*comment/i.test(err.message)) {
        logger.warn(
          "Your PostgreSQL version doesn't support COMMENT in CREATE TABLE for vehicle_info",
        );
        const simplifiedVehicleSQL = createVehicleInfoTableSQL.replace(
          /\sCOMMENT\s+'[^']*'/g,
          "",
        );

        await client.query(simplifiedVehicleSQL);
        logger.result(
          "Vehicle info table created with simplified SQL (without comments)",
        );
      } else {
        throw err;
      }
    }

    // 加入通用 trigger 到 ac_settings
    logger.operation("Creating triggers for ac_settings");
    await client.query(`
      CREATE TRIGGER update_ac_settings_timestamp
        BEFORE UPDATE ON ac_settings
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_generic();
      CREATE TRIGGER notify_ac_settings_update_trigger
        AFTER INSERT OR UPDATE ON ac_settings
        FOR EACH ROW
        EXECUTE FUNCTION notify_table_update();
    `);
    logger.result("Triggers for ac_settings created");

    // 加入通用 trigger 到 vehicle_info
    logger.operation("Creating triggers for vehicle_info");
    await client.query(`
      CREATE TRIGGER update_vehicle_info_timestamp
        BEFORE UPDATE ON vehicle_info
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp_generic();
      CREATE TRIGGER notify_vehicle_info_update_trigger
        AFTER INSERT OR UPDATE ON vehicle_info
        FOR EACH ROW
        EXECUTE FUNCTION notify_table_update();
    `);
    logger.result("Triggers for vehicle_info created");

    // 確認表已創建
    logger.operation("Verifying table creation");
    // ac_settings
    const acTableCheck = await client.query(
      `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
      );`,
      [TABLE_NAME],
    );

    if (acTableCheck.rows[0].exists) {
      logger.result("ac_settings table verified and ready");
      logger.operation("Table structure for ac_settings:");
      const acTableStructure = await client.query(
        `SELECT column_name, data_type, column_default, is_nullable
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position;`,
        [TABLE_NAME],
      );

      acTableStructure.rows.forEach((col) => {
        logger.result(
          `${col.column_name}: ${col.data_type}${col.is_nullable === "NO" ? " NOT NULL" : ""}${col.column_default ? ` DEFAULT ${col.column_default}` : ""}`,
        );
      });
    } else {
      throw new Error(`Failed to create table '${TABLE_NAME}'`);
    }
    // vehicle_info
    const vehicleTableCheck = await client.query(
      `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
      );`,
      [VEHICLE_TABLE_NAME],
    );

    if (vehicleTableCheck.rows[0].exists) {
      logger.result("vehicle_info table verified and ready");
      logger.operation("Table structure for vehicle_info:");
      const vehicleTableStructure = await client.query(
        `SELECT column_name, data_type, column_default, is_nullable
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY ordinal_position;`,
        [VEHICLE_TABLE_NAME],
      );

      vehicleTableStructure.rows.forEach((col) => {
        logger.result(
          `${col.column_name}: ${col.data_type}${col.is_nullable === "NO" ? " NOT NULL" : ""}${col.column_default ? ` DEFAULT ${col.column_default}` : ""}`,
        );
      });
    } else {
      throw new Error(`Failed to create table '${VEHICLE_TABLE_NAME}'`);
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
    await recreateTable();

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
export { initDatabase, recreateTable };
