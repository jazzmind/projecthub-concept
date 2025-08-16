# Implementing Synchronizations

Synchronizations are the key to composing independent concepts into working applications. The TypeScript implementation provides a declarative, LLM-friendly approach that maintains the clarity and precision of the specification language.

## Why TypeScript Synchronizations?

From the Sundai-25 presentation, we learned that better structure amplifies AI effectiveness. TypeScript synchronizations provide:

- **Type Safety**: Catch composition errors at compile time
- **IDE Support**: Auto-completion and refactoring for synchronizations
- **Debugging**: Clear stack traces when synchronizations fail
- **Modularity**: Each sync is an independent, testable function
- **LLM Clarity**: Explicit patterns that AI can understand and modify

A complete working example can be found in the framework evaluation examples.

After creating concept classes, you can initialize the Sync engine and
instrument concepts as follows:

```
// Create new Sync engine
const Sync = new SyncConcept();

// Register concepts
const concepts = {
    Button: new ButtonConcept(),
    Counter: new CounterConcept(),
    Notification: new NotificationConcept(),
};

// All concepts must be instrumented to be reactive and used in a sync
const { Button, Counter, Notification } = Sync.instrument(concepts);
```

The original, unmodified concepts are available as (e.g.) `concepts.Button`,
while the destructuring allows for the instrumented version `Button` to both
participate in syncs, as well as feature as a fully reactive concept. Calling
`Button.clicked({ kind: "increment_counter" })`, for example, will trigger all
registered synchronizations.

## Basic Synchronization Patterns

Synchronizations translate declarative logic into TypeScript functions. Here's how the button/counter example looks:

```typescript
// Simple one-to-one action triggering
const ButtonIncrement = ({}: Vars) => ({
    when: actions(
        [Button.clicked, { kind: "increment_counter" }, {}],
    ),
    then: actions(
        [Counter.increment, {}],
    ),
});
```

### Pattern Breakdown

- **Function Structure**: Each sync is a function returning a sync object
- **Variable Destructuring**: `{}` from `Vars` declares variables used in the sync
- **When Clause**: Array of action patterns with `[action, input, output]` format
- **Then Clause**: Array of action invocations with only input patterns

Each synchronization is a simple function that returns an object with the
appropriate keys, minimally containing `when` and `then`. The `actions` helper
function enables a shorthand specification of action patterns as an array, where
the first argument is the instrumented action, the second the input pattern, and
in the case of the `when` clause, the third is the output pattern.
Synchronizations may additionally have a `where` clause and specify variables:

```
// Each sync can declare the used variables by destructuring the input vars object
const NotifyWhenReachTen = ({ count }: Vars) => ({
    when: actions(
        [Button.clicked, { kind: "increment_counter" }, {}],
        [Counter.increment, {}, {}],
    ),
    where: (frames: Frames): Frames => {
        return frames
            .query(Counter._getCount, {}, { count })
            .filter(($) => {
                return $[count] > 10;
            });
    },
    then: actions(
        [Notification.notify, { message: "Reached 10" }],
    ),
});
```

Each synchronization function actually receives a special object that you can
destructure arbitrarily to receive variables to use in your patterns. In this
case, we destructure `count` to use it as a variable, which can be employed on
the right-hand side of input/output patterns to indicate an open binding. The
`where` clause, unlike the other two, is itself also a function that simply
takes in a set of `Frames` and returns a set of `Frames`. This refers to the
idea that each `Frame` is a `Record<symbol, unknown>` describing the current
bindings of the current frame, where each `Frame` that makes it through to the
`then` clause corresponds 1-to-1 with calling all actions in the `then` with
those bindings.

`Frames` is simply a small extension of the `Array` class, and all of the
standard methods and iterator functions can be applied to it. It additionally
carries the `.query` method which enables query functions on concepts to receive
certain inputs and produce outputs that enrich the frame. In this basic `where`
clause it enhances every frame with a `count` binding. In a slightly more
advanced example, something like:

```
.query(Comment._getByTarget, {target: post}, {comment})
```

says to lookup the `post` binding for the frame, and query the `Comment` concept
for all comments associated with a `target` of that `post`. Note that post as a
variable refers to that unique symbol for binding, and that the role of the
input pattern is simply to match our current binding name to the generic
accepted parameter name of `Comment._getByTarget`: since concepts are highly
modular, we encourage general names like `target` to enable commenting on many
kinds of things, and this pattern provides the way to map the two names. In this
case we are okay with binding the `comment` output with a symbol of the same
name, and use JavaScript's destructuring shorthand to indicate this. For such a
pattern, we would expect there to be at least `({post, comment, ...}: Vars)` as
the input signature for the containing synchronization function.

All such query functions always return an array of such frames, specifically to
allow for this kind of behavior: imagine the containing synchronization was to
delete all comments associated with a specific post when that post is deleted.
Despite one frame and a single `post` binding coming in from the `when`, this
query would enable exactly as many frames, one each with a different `comment`
id bound, to execute in the `then` and cascade all the deletes, without manually
writing a `for` loop or other looping construct.

## Real-World Example: URL Shortening Service

Based on the Sundai-25 presentation, here's how to implement the URL shortening synchronizations:

```typescript
// Generate unique nonce for short URL
const GenerateNonce = ({ shortUrlBase, nonce }: Vars) => ({
    when: actions(
        [Web.request, { method: "shortenUrl", shortUrlBase }, {}],
    ),
    then: actions(
        [NonceGenerator.generate, { context: shortUrlBase }],
    ),
});

// Register short URL with generated nonce
const RegisterShortUrl = ({ targetUrl, shortUrlBase, nonce, shortUrl }: Vars) => ({
    when: actions(
        [Web.request, { method: "shortenUrl", targetUrl, shortUrlBase }, {}],
        [NonceGenerator.generate, {}, { nonce }],
    ),
    then: actions(
        [UrlShortening.register, { shortUrlSuffix: nonce, shortUrlBase, targetUrl }],
    ),
});
```

## Registration and Setup

```typescript
// Register all synchronizations
const syncs = { 
    GenerateNonce, 
    RegisterShortUrl,
    NotifyWhenReachTen 
};
Sync.register(syncs);
```

## Essential Imports

```typescript
import {
    actions,
    Frames,
    SyncConcept,
    Vars,
} from "./engine/mod.ts";
```

## Best Practices for LLM-Friendly Synchronizations

### 1. Predictable Structure
```typescript
// Always follow this pattern
const SyncName = ({ variables }: Vars) => ({
    when: actions(/* triggers */),
    where: (frames) => { /* optional filtering */ },
    then: actions(/* consequences */),
});
```

### 2. Self-Documenting Names
```typescript
// Sync names should explain their purpose
const NotifyAuthorOnCommentReply = ({ ... }) => ({ ... });
const ExpireUnusedShortUrls = ({ ... }) => ({ ... });
const UpdateSearchIndexOnEdit = ({ ... }) => ({ ... });
```

This structure enables AI coding assistants to understand, generate, and safely modify synchronizations while maintaining system integrity.

## Critical Pattern: Nested Symbol Resolution

⚠️ **IMPORTANT**: The sync engine only resolves symbols at the top level of action inputs. **Symbols nested within objects will NOT be resolved** and will cause serialization errors.

### The Problem

This pattern will **FAIL** because `organizationsData` is nested within the `body` object:

```typescript
// ❌ BROKEN: Nested symbol will not be resolved
const BadSync = ({ request, organizationsData }: Vars) => ({
    when: actions(
        [API.request, { method: "GET", path: "/api/organizations" }, { request }],
        [Organization.list, {}, { organizations: organizationsData }],
    ),
    then: actions([
        API.respond, { 
            request, 
            status: 200, 
            body: { organizations: organizationsData }  // ❌ Symbol won't resolve
        }
    ]),
});
```

**Error**: `Invalid value for argument organizations: We could not serialize [object Symbol] value.`

### The Solution: Two-Sync Pattern

Split into trigger and response syncs, building the response body in the `where` clause:

```typescript
// ✅ CORRECT: Trigger sync
const ListOrganizations = ({ request }: Vars) => ({
    when: actions([
        API.request, { method: "GET", path: "/api/organizations" }, { request }
    ]),
    then: actions([
        Organization.list, {}
    ]),
});

// ✅ CORRECT: Response sync with body building in where clause
const ListOrganizationsResponse = ({ request, requestId, organizationsData, responseBody }: Vars) => ({
    when: actions(
        [API.request, { method: "GET", path: "/api/organizations" }, { request }],
        [Organization.list, {}, { organizations: organizationsData }],
    ),
    where: (frames: Frames) => {
        return frames.map((frame) => {
            const organizations = (frame as any)[organizationsData];
            
            // Build response body here to avoid nested symbol resolution
            const bodyData = { organizations };
            
            return {
                ...frame,
                [requestId]: (frame as any)[request]?.id,
                [responseBody]: bodyData,  // Top-level symbol
            };
        });
    },
    then: actions([
        API.respond, { requestId, status: 200, body: responseBody }  // ✅ Resolves correctly
    ]),
});
```

### When to Use This Pattern

Use the two-sync pattern whenever you need to:

1. **Return data from concept queries** in API responses
2. **Pass complex objects** containing symbol-bound data
3. **Build response bodies** that include data from multiple sources
4. **Avoid serialization errors** with nested symbols

### Alternative: Direct Data Building

For simpler cases, you can also resolve data directly in the `where` clause:

```typescript
const GetUser = ({ request, requestId, userId, userData }: Vars) => ({
    when: actions([
        API.request, { method: "GET", path: "/api/users/:id", userId }, { request }
    ]),
    where: (frames: Frames) =>
        frames.query(User._getById, { userId }, { user: userData })
            .map((frame) => {
                const user = (frame as any)[userData];
                return {
                    ...frame,
                    [requestId]: (frame as any)[request]?.id,
                    // Build simple response body inline
                    responseBody: { user, success: true },
                };
            }),
    then: actions([
        API.respond, { requestId, status: 200, body: responseBody }
    ]),
});
```

### Key Rules

1. **Never nest symbols** in object literals passed to actions
2. **Always build complex response bodies** in the `where` clause
3. **Use the two-sync pattern** for data-dependent API responses
4. **Test with real data** to catch symbol resolution issues early

This pattern is essential for reliable API sync implementations and prevents common serialization errors that are difficult to debug.
