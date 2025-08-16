# Building Applications with Concept Design

This repository demonstrates how to build applications using **Concept Design**, a revolutionary approach to software modularity introduced by Daniel Jackson in "The Essence of Software". This methodology addresses the core problems that make software brittle, complex, and difficult for both humans and AI systems to understand and modify.

## Why Concept Design?

Modern software development faces critical challenges:
- **Brittleness**: Small changes risk breaking everything
- **Poor Organization**: Code structure doesn't match user-facing behavior
- **Needless Complexity**: Features are scattered across multiple layers
- **LLM Limitations**: AI coding assistants struggle with large, entangled codebases

Concept Design solves these problems through:
- **Transparency**: Clear mapping between code and behavior
- **Modularity**: Each feature in its own independent module
- **Incrementality**: Safe, isolated changes that don't propagate
- **AI-Friendly Structure**: Clear boundaries that LLMs can understand and work with

This approach describes software in terms of _concepts_ - coherent units of behavior that capture familiar functionality with a single purpose. These are composed using _synchronizations_ - declarative statements that describe how concept actions interact.

# Concepts

A concept is a **coherent unit of behavior** that serves as:
- A **user-facing behavioral pattern** that users recognize and understand
- A **backend nano-service** with a clean API
- A **reusable module** that can work across different applications
- An **independent component** designed, coded, and explained in isolation

Unlike microservices or traditional OOP classes, concepts **must** remain completely independent from one another. This independence is what makes software transparent and prevents the propagation of changes that leads to brittleness.

## Concept Independence Rules

1. **No Cross-Concept Imports**: Concepts cannot import or reference other concepts
2. **No Shared Types**: Concepts cannot assume external type definitions
3. **No Direct Calls**: One concept cannot directly call another's methods
4. **Pure Interfaces**: All concept interaction happens through synchronizations

Concepts can be specified using a simple specification language and stored as `.concept` files, such as:

```
<concept_spec>

concept User

purpose 
    to associate identifying information with individuals

state
    a set of Users with
        a name String
        an email String

actions
    register (user: Users, name: String, email: String) : (user: Users)
        associate user with users
        associate name and email if both unique and valid
        return the user reference
    register (user: Users, name: String, email: String) : (error: String)
        if either name or email is invalid or not unique, describe error
        return the error description

    update (user: Users, name: String) : (user: Users)
        if name is unique, update user's name
        return the user reference
    update (user: Users, name: String) : (error: String)
        if name is not-unique, describe error
        return the error description

    update (user: Users, email: String) : (user: Users)
        if email is unique and valid, update id's email
        return the user reference
    update (user: Users, email: String) : (error: String)
        if email is not-unique or invalid, describe error
        return the error description

operational principle
    after register () : (user: x) and update (name: "xavier") : (user: x)
    for any user u such that u's name is "xavier", u must be x

</concept_spec>
```

- `concept`: A unique name for the concept.
- `purpose`: A carefully crafted description of the concept's purpose and what
  problem it solves.
- `state`: A specification of the shape of the state the concept holds. Refer to
  the `concept-state-specification.mdc` rule to find the details of Simple State
  Form (SSF), the language of this specification.
- `actions`: Descriptions of actions, which are how the concept evolves its
  state, and the only way to perform side-effects and behavior. The lines at the
  first level of indentation are action signatures, and describe the inputs
  (before the `:`) and the outputs (after the `:`) as a map from names to types.
  Therefore, every concept implementation standardizes on exactly one input
  argument as a map/record/object (depending on the language) with named keys to
  values of the specified type. Generic "object" types like `Users` are _not_
  complex references to objects, but all simply IDs, usually UUIDs as strings.
  The text below each signature at the next level of indentation are vernacular
  descriptions of the effect that the action has, and usually describe what to
  expect from the return values.
- `operational principle`: A description of a scenario that demonstrates how the
  concept can fulfill its purpose through its actions and state. It need not
  completely cover all actions/state, but instead is designed to capture the
  essence of why this particular design for the concept helps fulfill the
  purpose. In this case, the scenario describes how the related state of the
  concept, such as the `name` field, helps uniquely identify the same
  individual.

## Designing Concepts

### The Modularity Principle

Traditional object-oriented design often conflates multiple concerns. For example, a typical `User` class might handle:
- **Authentication** (passwords, login/logout)
- **Profile Management** (bio, avatar, preferences) 
- **Social Features** (following, blocking)
- **Identity** (username, email)

This creates brittleness because changes to authentication logic might break profile features. In concept design, each of these becomes a separate concept:
- `User` concept: Core identity mapping
- `Authentication` concept: Password management and verification
- `Profile` concept: User information and customization
- `Following` concept: Social relationship management

The `User` concept example above highlights key design considerations:

- **Single, focused purpose:** A typical User service or class might contain a
  lot more kinds of information pertaining to users, such as passwords
  (`Authentication`), bio or avatar images (`Profile`), or any other number of
  user related concerns. As pointed out in the parentheses in the previous
  sentence, these concerns are actually better modeled as separate concepts.
  This is motivated by the fact that every application can have different
  requirements: some apps might not have authentication at all, while some may
  lack certain kinds of `Profile` related information like bios. If your `User`
  class/service/concept models such information, it is thus inherently less
  modular and cannot be directly shared. Instead, this design for `User` focuses
  solely on the idea that every application including it needs a simple mapping
  from user identifiers to uniquely identifying fields like usernames or email
  addresses. An additional subtlety is that the `register` action actually takes
  in the unique ID (the `user` argument), instead of arbitrarily generating its
  own scheme. This further modularizes this concept, and allows it to support
  any set of applications with different unique identification schemes.
- **Actions that thoroughly describe all possible outcomes:** A unique feature
  of the action descriptions above is that they overload (on the same action
  name) for all the possible kinds of transitions and arguments. Since all
  actions are simply functions that take an input map and output a map, the
  shape found in each signature is exactly the shape of the map that you can
  expect. This explicitly spells out the different kinds of arguments that an
  `update` method can handle, as well as specifying what can happen as a result.
- **Errors are not special:** Following from the explicit transitions of the
  previous point, all errors are simply just another pattern specified by the
  concept specification. Here, we use the convention that if an output map
  contains the `error:` key, then an error is considered to have happened. This
  is not special, and allows us to model any number of conditions, and match on
  the for the purposes of processing errors or unusual outcomes, as we will see
  in the synchronizations.

# Synchronizations

The challenge with truly independent modules is composition: how do you make them work together without creating dependencies? Traditional approaches inevitably lead to:
- Complicated dependency structures
- Brittle build systems  
- Layers of abstraction that entangle components
- Changes that propagate unpredictably

**Synchronizations** solve this through a declarative composition mechanism that:
- Maintains complete concept independence
- Enables granular, incremental behavior specification
- Provides explicit control over all execution paths
- Allows surgical modifications without system-wide effects

## Real-World Example: URL Shortening Service

Consider building a URL shortening service like bit.ly. Rather than a monolithic approach, we can decompose this into independent concepts:

- `UrlShortening`: Core shortening and lookup functionality
- `NonceGenerator`: Unique string generation within contexts
- `ExpiringResource`: Automatic resource expiration
- `WebAnalytics`: Visit tracking and statistics

Each concept works independently, but synchronizations coordinate their behavior:

```
<sync_spec>
sync generateNonce
when Web.request (method: "shortenUrl", shortUrlBase)
then NonceGenerator.generate (context: shortUrlBase)

sync registerShort  
when Web.request (method: "shortenUrl", targetUrl, shortUrlBase)
     NonceGenerator.generate (): (nonce)
then UrlShortening.register (shortUrlSuffix: nonce, shortUrlBase, targetUrl)

sync setExpiry
when UrlShortening.register (): (shortUrl)
then ExpiringResource.setExpiry (resource: shortUrl, seconds: 3600)
</sync_spec>
```

This approach provides incredible flexibility - you can add analytics, remove expiration, or change nonce generation without touching the core shortening logic.

Consider three very simple concepts:

- `Counter`: has the actions `increment {}` and `decrement {}`, and stores a
  single state `count`.
- `Button`: has the action `clicked {kind: string}` that is simply a proxy for a
  button clicked of the kind `kind`.
- `Notification`: has the action `notify {message: string}`, which sends a
  notification with the specified message.

What if we wanted to specify the following two behaviors:

- **when** a `Button` of the `kind: "increment_counter"` is `clicked`, **then**
  the `Counter` should `increment`
- **when** that same `Button` is clicked, _and_ `Counter.increment` happens,
  **where** `count` is above 10, **then** `Notify.notification` with the message
  that we reached 10.

The synchronization language allows us to model these two behaviors exactly as
we have written them as the following two granular synchronizations:

```
<sync_spec>

sync ButtonIncrement
when
    Button.clicked (kind: "increment_counter") : ()
then
    Counter.increment ()

sync NotifyWhenReachTen
when
    Button.clicked (kind: "increment_counter") : ()
    Counter.increment () : ()
where
    Counter._getCount () : (count: count)
    count > 10
then
    Notification.notify (message: "Reached 10")
    
</sync_spec>
```

Each keyword refers to:

- `sync`: A unique identifier for the sync.
- `when`: A number of actions and their input/arguments to match. You can match
  both literals as above, as well as variables, which are just symbols like
  `count`. The left hand side is the same as the keys described in the actions,
  while the right hand side allows you to specify a different name (or the same)
  for the variable.
- `where`: An optional clause that allows further processing and filtering of
  results. You may only refer to query functions of concepts, indicated by the
  mandatory starting underscore `_`, and use the input/output arguments to map
  to variables to bind and perform logic on.
- `then`: A number of actions that, if there are variables, are bound based on
  the declarative logic throughout, and which form new action invocations
  exactly of the shape specified.

## Designing Synchronizations

Synchronizations have a number of interesting properties that enable their
granularity and incrementality:

- **Conditioning on multiple actions:** Unlike many systems with graphical
  pipeline builders and other approaches that allow you to chain actions
  together, synchronizations allow you to condition on **multiple** actions
  which share an inherent notion of **flow**. In this case, you might wonder why
  the notification needs to condition on both the button click and the counter
  incrementing, where just one or the other might suffice. Specifying both
  allows you to robustly condition on the idea that we'd like to notify only
  when a counter has been successfully incremented _because_ of the
  `"increment_counter"` button. This is robust even if our application evolves
  such that `ButtonIncrement` is updated, and we may limit the number of times
  you can press a button: conditioning on only the click would still result in a
  notification. On the other hand, conditioning only on the increment would
  generate extra notifications if there were other ways to increment the
  counter.
- **The idea of flow:** But how are action occurrences grouped together? In a
  large application, we can imagine there being a ton of buttons clicked and
  counters incremented - which ones are grouped? **Flow** is the idea that
  actions that directly caused other actions through synchronizations all share
  the same unique **flow token**, a UUID that groups all such actions to
  consider for the `when` clause. A new **flow** is initiated whenever an
  external force (like a user) causes an action, and all subsequent automatic
  synchronizations will propagate that flow token. You can think of it like a
  logical grouping or scope of execution, and an explicit way to model a large
  lexical scope in a block of code in a more traditional programming language.
- **Separation of read and write:** Synchronizations strongly separate
  side-effecting actions from pure computations (like querying and filtering) by
  construction: any query functions in the `where` clause must be pure, and all
  side-effects are isolated into the invocations constructed by the `then`
  clause with exactly the specified shape. Note that the `when` clause will
  always have action patterns that have both input and output (denoted by the
  two records around the `:`), since it talks about conditioning on action
  **completions**, while the `then` clause will always only have **invocations**
  with only the shape of an input (and thus no `:` and only one record).

# Entry Point: Bootstrap Concepts

If an application is made entirely of concepts and synchronizations, and
therefore composed in a horizontal and flat way, then what is the entry point? A
concept can be considered a **bootstrap concept** if it is intended to be called
by an external actor, such as a user, or from an otherwise independent frontend
application treating the entire backend as a single opaque API, and without
knowledge that it is otherwise powered by concepts and synchronizations. For the
latter, an example concept might be:

```
<concept_spec>

concept API
purpose
    to bootstrap generic API requests and allow asynchronous responses
state
    a set of Requests with
        a callback Function
        an Input set of Parameters
        an Output set of Parameters
    a set of Parameters with
        ...any arguments...
actions
    request (callback: Function, ...any input arguments...) : (request: Requests)
        generate a fresh request associated with the input arguments
        register the callback with the request ID
        return the request ID
    response (request: Requests, ...any output arguments...) : (request: Requests)
        save the output arguments, and await the callback to give them to the requester
        return the request ID

</concept_spec>
```

This concept allows synchronizations against the initial `request`, with any
shape of arguments, and usually with explicit modeling in the parameters like
`method: "user_registration"` or `path: "/api/users", method: "GET"` to pattern
match on the intended route. This can cascade a series of actions, and keeping
this `request` pattern as one of the `when` conditions allows for a route
specific set of synchronizations to model behavior. Finally, an `API.response`
in a `then` allows for giving control back to the calling party.

There can be many other ways in which such a bootstrap concept enables external
interaction, but this pattern is the simplest for establishing a classic
backend/frontend kind of separation at the API level.

# Implementation

For actually implementing synchronizations in this application, refer to the
following:

@synchronization-implementation.mdc

For actually implementing concepts in this application, refer to the following:

@concept-implementation.mdc
