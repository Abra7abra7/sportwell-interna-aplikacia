const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const outputFile = process.argv[2];
const dbUrl = process.argv[3];

if (!outputFile || !dbUrl) {
  console.error("Usage: node backup_data.js <output_file> <db_connection_string>");
  process.exit(1);
}

function formatValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Array.isArray(val)) {
    if (val.length === 0) return 'ARRAY[]::text[]';
    const items = val.map(item => {
      if (item === null || item === undefined) return 'NULL';
      if (typeof item === 'number' || typeof item === 'boolean') return String(item);
      return `'${String(item).replace(/'/g, "''")}'`;
    });
    return `ARRAY[${items.join(', ')}]`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log("Connected to database to fetch data...");

    // Fetch all user tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('schema_migrations', '_prisma_migrations', 'spatial_ref_sys')
      ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tables.length} tables to dump.`);

    let dumpSql = `-- SPORTWELL DATABASE DATA DUMP\n`;
    dumpSql += `-- Generated on ${new Date().toISOString()}\n\n`;
    dumpSql += `SET session_replication_role = 'replica';\n\n`;

    for (const table of tables) {
      console.log(`Dumping table: ${table}...`);
      
      // Get column names to construct INSERT statements
      const columnsRes = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      const columns = columnsRes.rows.map(c => c.column_name);

      if (columns.length === 0) continue;

      // Query data
      const dataRes = await client.query(`SELECT * FROM "${table}"`);
      
      if (dataRes.rows.length === 0) {
        dumpSql += `-- Table ${table} is empty.\n\n`;
        continue;
      }

      dumpSql += `-- Data for table: ${table} (${dataRes.rows.length} rows)\n`;

      const colList = columns.map(c => `"${c}"`).join(', ');

      for (const row of dataRes.rows) {
        const valuesList = columns.map(col => formatValue(row[col])).join(', ');
        dumpSql += `INSERT INTO "${table}" (${colList}) VALUES (${valuesList});\n`;
      }
      dumpSql += `\n`;
    }

    dumpSql += `SET session_replication_role = 'origin';\n`;

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputFile, dumpSql, 'utf8');
    console.log(`Data backup successfully written to ${outputFile}`);
  } catch (err) {
    console.error("Error backing up data:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
