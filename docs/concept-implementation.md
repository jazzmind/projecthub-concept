# Implementing Concepts

## Core Implementation Principles

Concept implementations must maintain the independence and modularity that makes them effective for both human developers and AI systems.

### Class Structure
- **Language**: Use TypeScript for type safety and better tooling
- **Naming**: Each concept is a single class named `${name}Concept`
- **Location**: Store in `./concepts/${name}.ts` for clear organization
- **Independence**: No imports from other concepts - only external libraries and utilities

### Action Implementation
- **Single Input/Output**: All actions take exactly one input object and return one output object
- **Type Safety**: Input and output shapes must match the concept specification exactly
- **Naming**: Action method names must match specification names precisely
- **Error Handling**: Errors are just another output pattern with an `error` key
- **Side Effects**: Only actions can modify state or perform side effects

### Query Functions
- **Naming Convention**: MUST start with underscore `_` to distinguish from actions
- **Purity**: MUST NOT update state or perform side effects
- **Input**: Single argument with named keys like actions
- **Output**: Always return arrays to enable declarative composition
- **Purpose**: Enable synchronizations to filter and process state

### State Management
- **Isolation**: Each concept manages its own state independently
- **Persistence**: Use Prisma with concept-specific tables
- **Schema**: Follow Simple State Form (SSF) translation rules
- **Validation**: Validate inputs at concept boundaries

## Implementation Example

```typescript
export class UrlShorteningConcept {
  private table: Table;

  constructor() {
    // Initialize Prisma table
    this.table = db.table('urlShortenings');
  }

  // Action: Create short URL
  async register(input: {
    shortUrlSuffix: string;
    shortUrlBase: string;
    targetUrl: string;
  }): Promise<{ shortUrl: string } | { error: string }> {
    try {
      const shortUrl = `${input.shortUrlBase}/${input.shortUrlSuffix}`;
      
      // Check if already exists
      const existing = await this.table.findOne({ shortUrl });
      if (existing) {
        return { error: "Short URL already exists" };
      }

      // Create new shortening
      await this.table.insertOne({
        shortUrl,
        targetUrl: input.targetUrl,
        createdAt: new Date()
      });

      return { shortUrl };
    } catch (e) {
      return { error: "Failed to create short URL" };
    }
  }

  // Query: Get all shortenings for analytics
  async _getAllShortenings(input: {}): Promise<Array<{
    shortUrl: string;
    targetUrl: string;
    createdAt: Date;
  }>> {
    const results = await this.collection.find({}).toArray();
    return results.map(doc => ({
      shortUrl: doc.shortUrl,
      targetUrl: doc.targetUrl,
      createdAt: doc.createdAt
    }));
  }
}
```

## Best Practices

### Maintainability
- **Stable Interface**: Well-designed concepts rarely need changes except new queries
- **Clear Purpose**: Each concept should solve exactly one problem
- **Complete Specification**: Handle all possible input/output cases explicitly

### Performance
- **Efficient Queries**: Design query functions for synchronization performance
- **Proper Indexing**: Index Prisma fields used in queries
- **Lazy Loading**: Only load state when needed

### Testing
- **Unit Tests**: Test each action and query independently
- **Isolation**: Test concepts without dependencies on other concepts
- **Edge Cases**: Test all error conditions and boundary cases

## Database Integration

### Prisma Setup
- **Driver**: Use TypeScript Prisma driver for type safety
- **Configuration**: Store all config in environment variables
- **Database**: Share single database between concepts
- **Tables**: Use separate tables per concept for isolation
- **Schema**: Follow SSF to Prisma translation rules

### Environment Configuration
```typescript
// Environment variables for database connection
const DATABASE_URL = process.env.DATABASE_URL || 'prisma://localhost:27017';
const DATABASE_NAME = process.env.DATABASE_NAME || 'concept_app';
```

### Runtime Considerations
- **Typescript Support**: Use generic import names without version numbers (e.g. `@prisma/client`)
- **Node.js Support**: Standard npm package imports work seamlessly
- **Error Handling**: Return structured error objects, never throw exceptions
- **Async/Await**: All database operations should be asynchronous

## LLM-Friendly Implementation

Concept implementations should be especially clear for AI systems:

### Clear Structure
- **Predictable Patterns**: Consistent action and query signatures
- **Explicit Types**: Full TypeScript type annotations
- **Self-Documenting**: Code that explains its purpose clearly

### Modular Design
- **Single Responsibility**: Each concept does one thing well
- **No Hidden Dependencies**: All requirements explicit
- **Clean Interfaces**: Simple input/output contracts

This structure enables AI coding assistants to:
- Understand concept purpose immediately
- Modify individual concepts safely
- Generate new concepts following established patterns
- Debug issues without understanding the entire system

## Symbol Resolution Best Practices

When implementing concepts that will be used in synchronizations, follow these critical patterns to avoid symbol resolution issues:

### Query Function Returns

**CRITICAL**: Query functions used with `frames.query` must return arrays of objects where the data is nested within named properties, not raw arrays.

```typescript
// ✅ CORRECT: Returns array of objects with named properties
async _getTopLevel(input: {}): Promise<Array<{ organizations: Organization[] }>> {
    const orgs = await prisma.organization.findMany();
    return [{ organizations: orgs }];  // Wrapped in object with named property
}

// ❌ BROKEN: Returns raw array
async _getTopLevel(input: {}): Promise<Organization[]> {
    return await prisma.organization.findMany();  // Raw array won't bind correctly
}
```

### Action Return Patterns

Design action returns to work well with the two-sync pattern:

```typescript
// ✅ CORRECT: Return data in named property
async create(input: { name: string }): Promise<{ user: User } | { error: string }> {
    try {
        const user = await prisma.user.create({ data: input });
        return { user };  // Named property for symbol binding
    } catch (error) {
        return { error: "Failed to create user" };
    }
}
```

### Query Function Design for Syncs

Design query functions specifically for use in synchronizations:

```typescript
// Action form (returns single result)
async listUsers(input: {}): Promise<{ users: User[] } | { error: string }> {
    const users = await prisma.user.findMany();
    return { users };
}

// Query form for frames.query (returns array of objects)
async _getUsersForPayload(input: {}): Promise<Array<{ users: User[] }>> {
    try {
        const users = await prisma.user.findMany();
        return [{ users }];  // Array with single object containing named property
    } catch {
        return [{ users: [] }];  // Empty array on error
    }
}

// Individual query form (returns array of individual items)
async _getAllUsers(input: {}): Promise<Array<{ user: User }>> {
    const users = await prisma.user.findMany();
    return users.map(user => ({ user }));  // Each user wrapped in object
}
```

### Common Patterns by Use Case

1. **API List Endpoints**: Use `_getForPayload` pattern
2. **Individual Item Processing**: Use individual wrapping pattern
3. **Filtering Operations**: Use standard `_getByField` pattern

### Testing Symbol Resolution

Test query functions with the synchronization engine:

```typescript
// Test that query works with frames.query
const frames = new Frames([{}]);
const result = frames.query(concept._getUsers, {}, { users: Symbol('users') });
console.log('Query result structure:', result);  // Should show proper symbol binding
```

### Key Rules for Symbol Compatibility

1. **Always return arrays** from query functions
2. **Wrap data in named properties** for `frames.query` compatibility  
3. **Use consistent naming** between action and query returns
4. **Test with real synchronizations** not just unit tests
5. **Follow the two-sync pattern** for data-dependent API responses

Following these patterns ensures your concepts work seamlessly with the synchronization engine and avoids common symbol resolution issues that can be difficult to debug.
