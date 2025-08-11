import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

interface ConceptField {
  name: string;
  type: string;
  optional: boolean;
  array: boolean;
  enumValues?: string[];
}

interface ConceptState {
  name: string;
  fields: ConceptField[];
}

interface ParsedConcept {
  name: string;
  purpose: string;
  state: ConceptState[];
  actions: string[];
  queries: string[];
}

export class SchemaGenerator {
  private specsDir: string;
  private schemaPath: string;

  constructor(specsDir: string, schemaPath: string) {
    this.specsDir = specsDir;
    this.schemaPath = schemaPath;
  }

  /**
   * Parse a .concept file and extract state definitions
   */
  parseConceptFile(filePath: string): ParsedConcept {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trim());
    
    let currentSection = '';
    let currentEntity = '';
    const concept: ParsedConcept = {
      name: '',
      purpose: '',
      state: [],
      actions: [],
      queries: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('concept ')) {
        concept.name = line.replace('concept ', '');
        continue;
      }

      if (line === 'purpose') {
        currentSection = 'purpose';
        continue;
      }

      if (line === 'state') {
        currentSection = 'state';
        continue;
      }

      if (line === 'actions') {
        currentSection = 'actions';
        continue;
      }

      if (line === 'queries') {
        currentSection = 'queries';
        continue;
      }

      if (currentSection === 'purpose' && line && !line.startsWith(' ')) {
        concept.purpose = line;
      }

      if (currentSection === 'state' && line && !line.startsWith(' ')) {
        // This is an entity definition
        currentEntity = line;
        concept.state.push({
          name: currentEntity,
          fields: []
        });
      }

      if (currentSection === 'state' && line.startsWith('    ') && currentEntity) {
        // This is a field definition
        const field = this.parseFieldDefinition(line.trim());
        if (field) {
          const entityIndex = concept.state.findIndex(s => s.name === currentEntity);
          if (entityIndex >= 0) {
            concept.state[entityIndex].fields.push(field);
          }
        }
      }

      if (currentSection === 'actions' && line && !line.startsWith(' ')) {
        concept.actions.push(line);
      }

      if (currentSection === 'queries' && line && !line.startsWith(' ')) {
        concept.queries.push(line);
      }
    }

    return concept;
  }

  /**
   * Parse field definition from SSF format
   */
  parseFieldDefinition(line: string): ConceptField | null {
    // Handle comment lines
    if (line.startsWith('//') || line.startsWith('#')) {
      return null;
    }

    // Parse field: fieldName: Type | Type? | [Type] | ObjectId | etc.
    const match = line.match(/^(\w+):\s*(.+?)(?:\s*\/\/.*)?$/);
    if (!match) return null;

    const [, fieldName, typeDefinition] = match;
    
    let type = typeDefinition.trim();
    let optional = false;
    let array = false;
    let enumValues: string[] | undefined;

    // Handle optional fields (ending with ?)
    if (type.endsWith('?')) {
      optional = true;
      type = type.slice(0, -1).trim();
    }

    // Handle array fields [Type]
    if (type.startsWith('[') && type.endsWith(']')) {
      array = true;
      type = type.slice(1, -1).trim();
    }

    // Handle enum definitions "value1" | "value2" | "value3"
    if (type.includes('|') && type.includes('"')) {
      enumValues = type.split('|').map(v => v.trim().replace(/"/g, ''));
      type = `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Enum`;
    }

    // Handle union types with null
    if (type.includes(' | null')) {
      optional = true;
      type = type.replace(' | null', '');
    }

    return {
      name: fieldName,
      type: this.mapSSFTypeToPrisma(type),
      optional,
      array,
      enumValues
    };
  }

  /**
   * Map SSF types to Prisma types
   */
  mapSSFTypeToPrisma(ssfType: string): string {
    const typeMap: Record<string, string> = {
      'String': 'String',
      'Number': 'Int',
      'Float': 'Float',
      'Boolean': 'Boolean',
      'Date': 'DateTime',
      'ObjectId': 'String',
      'Object': 'Json',
      '[String]': 'String[]',
      '[Number]': 'Int[]',
      '[Object]': 'Json[]'
    };

    return typeMap[ssfType] || ssfType;
  }

  /**
   * Generate Prisma model from concept state
   */
  generatePrismaModel(concept: ParsedConcept): string {
    const models: string[] = [];
    const enums: string[] = [];

    for (const entity of concept.state) {
      const modelName = entity.name;
      let modelDef = `model ${modelName} {\n`;

      // Add standard fields
      modelDef += `  id        String    @id @default(cuid())\n`;

      // Add concept fields
      for (const field of entity.fields) {
        if (field.name === 'id') continue; // Skip if already defined

        let fieldType = field.type;
        
        // Handle enums
        if (field.enumValues) {
          const enumName = `${modelName}${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
          enums.push(this.generateEnum(enumName, field.enumValues));
          fieldType = enumName;
        }

        if (field.array) {
          fieldType += '[]';
        }

        const optionalMarker = field.optional ? '?' : '';
        modelDef += `  ${field.name}${' '.repeat(Math.max(1, 12 - field.name.length))}${fieldType}${optionalMarker}\n`;
      }

      // Add standard timestamps if not already present
      const hasCreatedAt = entity.fields.some(f => f.name === 'createdAt');
      const hasUpdatedAt = entity.fields.some(f => f.name === 'updatedAt');
      
      if (!hasCreatedAt) {
        modelDef += `  createdAt DateTime  @default(now())\n`;
      }
      if (!hasUpdatedAt) {
        modelDef += `  updatedAt DateTime  @updatedAt\n`;
      }

      // Add table mapping
      modelDef += `\n  @@map("${this.toSnakeCase(modelName)}")\n`;
      modelDef += `}\n`;

      models.push(modelDef);
    }

    return [...enums, ...models].join('\n');
  }

  /**
   * Generate Prisma enum
   */
  generateEnum(enumName: string, values: string[]): string {
    let enumDef = `enum ${enumName} {\n`;
    for (const value of values) {
      enumDef += `  ${value}\n`;
    }
    enumDef += `}\n`;
    return enumDef;
  }

  /**
   * Convert camelCase to snake_case
   */
  toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  /**
   * Generate complete Prisma schema
   */
  generateSchema(): string {
    const header = `// Generated Prisma schema from concept specifications
// DO NOT EDIT MANUALLY - This file is auto-generated

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

`;

    const conceptFiles = readdirSync(this.specsDir)
      .filter(file => file.endsWith('.concept'))
      .map(file => join(this.specsDir, file));

    const models: string[] = [];
    const enums: string[] = [];

    for (const filePath of conceptFiles) {
      try {
        const concept = this.parseConceptFile(filePath);
        const modelCode = this.generatePrismaModel(concept);
        models.push(modelCode);
      } catch (error) {
        console.warn(`Failed to parse concept file ${filePath}:`, error);
      }
    }

    return header + models.join('\n') + '\n';
  }

  /**
   * Write generated schema to file
   */
  writeSchema(): void {
    const schema = this.generateSchema();
    writeFileSync(this.schemaPath, schema, 'utf-8');
    console.log(`✅ Generated Prisma schema at ${this.schemaPath}`);
  }

  /**
   * Watch for changes and regenerate schema
   */
  watch(): void {
    // In a real implementation, we'd use fs.watch or chokidar
    console.log(`👀 Watching ${this.specsDir} for changes...`);
    // This is a placeholder - in practice you'd implement file watching
  }
}

// CLI usage
// Commented out for Next.js compatibility - this file was designed for Deno
/*
if (import.meta.main) {
  const generator = new SchemaGenerator(
    '../specs',
    '../prisma/schema.prisma'
  );
  
  const command = Deno.args[0];
  
  if (command === 'generate') {
    generator.writeSchema();
  } else if (command === 'watch') {
    generator.writeSchema();
    generator.watch();
  } else {
    console.log('Usage: deno run schema-generator.ts [generate|watch]');
  }
}
*/
