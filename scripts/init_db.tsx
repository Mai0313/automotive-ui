import { Client } from 'pg';
const TABLE_NAME = 'test_user';
const createTestUserTableSQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    air_conditioning BOOLEAN,
    fan_speed INTEGER,
    airflow_head_on BOOLEAN,
    airflow_body_on BOOLEAN,
    airflow_feet_on BOOLEAN,
    temperature FLOAT,
    updated_at TIMESTAMP
);
`;
async function createTestUserTable(): Promise<void> {
    const connectionString =
        process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
    const client = new Client({
        connectionString,
    });
    try {
        await client.connect();
        await client.query(createTestUserTableSQL);
        console.log(`${TABLE_NAME} table created or already exists.`);
    } catch (err) {
        console.error(`Error creating table:`, err);
    } finally {
        await client.end();
    }
}

// ESM 模式下的主模塊檢測
// 替換 if (require.main === module) {
if (import.meta.url === import.meta.resolve(process.argv[1])) {
    createTestUserTable();
}