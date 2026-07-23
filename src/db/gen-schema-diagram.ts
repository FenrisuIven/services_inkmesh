import { writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { pathToFileURL } from 'url';
import { getTableConfig, type PgTable } from 'drizzle-orm/pg-core';

// Configuration
const SCHEMA_DIR = join(process.cwd(), 'src/db/schema');
const OUT_FILE = join(process.cwd(), 'docs/diagrams/database/schema.puml');

const SCHEMA_COLORS: Record<string, string> = {
  public: '#FEFECE', // Default PlantUML yellow
  projects: '#E1F5FE', // Light Blue
  users: '#E8F5E9', // Light Green
  chats: '#FFF3E0', // Light Orange
  junctions: '#F3E5F5', // Light Purple
  characters: '#FCE4EC', // Light Pink
};

async function generatePlantUML() {
  const lines: string[] = [
    '@startuml schema',
    'hide circle',
    'skinparam linetype ortho',
    'skinparam packageStyle rectangle',
    '',
    'title Database Schema',
    '',
  ];

  const tables: Record<string, { table: PgTable; file: string }> = {};
  const enums: Record<string, { enumObj: any; file: string }> = {};
  const relations: string[] = [];

  // 1. Scan schema directory for tables and enums
  const files = readdirSync(SCHEMA_DIR).filter(
    (f) => f.endsWith('.ts') && f !== 'index.ts',
  );

  for (const file of files) {
    const filePath = join(SCHEMA_DIR, file);
    const mod = await import(pathToFileURL(filePath).href);

    for (const [key, value] of Object.entries(mod)) {
      if (value && typeof value === 'object') {
        try {
          const config = getTableConfig(value as PgTable);
          if (config && config.name && config.columns) {
            tables[key] = { table: value as PgTable, file };
            continue;
          }
        } catch (e) {}

        const val = value as any;
        if (val.enumName && val.enumValues) {
          enums[key] = { enumObj: val, file };
        }
      }
    }
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const formatName = (s: string) => s.split(/[._]/).map(capitalize).join(' ');

  // 2. Process Enums
  for (const [exportName, { enumObj, file }] of Object.entries(enums)) {
    const schemaName = enumObj.schema || 'public';
    const color = SCHEMA_COLORS[schemaName] || '#FFFFFF';
    const displayName = formatName(enumObj.enumName);

    const subscript = `<size:12><color:gray>Schema: ${schemaName}</color></size>\\n<size:10><color:gray>${file}</color></size>`;
    lines.push(
      `enum "${displayName}\\n${subscript}" as ${exportName} ${color} {`,
    );
    for (const val of enumObj.enumValues) {
      lines.push(`  ${val}`);
    }
    lines.push('}');
    lines.push('');
  }

  // 3. Process each table
  for (const [exportName, { table, file }] of Object.entries(tables)) {
    const config = getTableConfig(table);
    const schemaName = config.schema || 'public';
    const color = SCHEMA_COLORS[schemaName] || '#FFFFFF';

    const tableName = config.name;
    const displayName = formatName(tableName);

    const subscript = `<size:12><color:gray>Schema: ${schemaName}</color></size>\\n<size:10><color:gray>${file}</color></size>`;
    lines.push(
      `entity "${displayName}\\n${subscript}" as ${exportName} ${color} {`,
    );

    for (const columnKey of Object.keys(config.columns)) {
      const col = (config.columns as any)[columnKey];
      const type = col.getSQLType();
      const notNull = col.notNull ? 'NOT NULL' : '';
      const pk = col.primary ? ' [PK]' : '';
      lines.push(`  ${col.name} : ${type}${pk} ${notNull}`);
    }

    lines.push('}');
    lines.push('');

    // 4. Process Foreign Keys
    for (const fk of config.foreignKeys) {
      const ref = fk.reference();
      const foreignTableConfig = getTableConfig(ref.foreignTable);
      const foreignTableName = foreignTableConfig.name;

      const foreignExportName =
        Object.entries(tables).find(
          ([_, { table: t }]) => getTableConfig(t).name === foreignTableName,
        )?.[0] || foreignTableName;

      const colNames = ref.columns.map((c) => c.name).join(', ');
      relations.push(
        `${exportName} }o--|| ${foreignExportName} : "${colNames}"`,
      );
    }
  }

  lines.push("' === Relationships ===");
  lines.push(...new Set(relations));
  lines.push('');
  lines.push('@enduml');

  const dir = dirname(OUT_FILE);
  try {
    mkdirSync(dir, { recursive: true });
  } catch (err) {}

  writeFileSync(OUT_FILE, lines.join('\n'));
  console.log(`Successfully generated PlantUML diagram to ${OUT_FILE}`);
}

generatePlantUML();
