const fs = require('fs');
const path = require('path');

const outputFile = process.argv[2];
if (!outputFile) {
  console.error("Please specify output file path.");
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '../supabase/migrations');

try {
  if (!fs.existsSync(migrationsDir)) {
    console.error("Migrations directory not found.");
    process.exit(1);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  let combinedSql = `-- SPORTWELL DATABASE STRUCTURE DUMP\n`;
  combinedSql += `-- Generated from migrations on ${new Date().toISOString()}\n\n`;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    combinedSql += `-- ==========================================\n`;
    combinedSql += `-- MIGRATION: ${file}\n`;
    combinedSql += `-- ==========================================\n`;
    combinedSql += content + "\n\n";
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, combinedSql, 'utf8');
  console.log(`Structure backup successfully written to ${outputFile}`);
} catch (err) {
  console.error("Error backing up structure:", err);
  process.exit(1);
}
