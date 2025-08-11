1) I built a platform for sourcing and managing work-based learning projects.
2) Multi-tenancy, different users/roles, different UI systems
3) Concept design is a great replacement for MVC approaches... it makes it very easy to understand the architecture of the system. Normally with a system this complex the LLM would have created a ton of redundant API routes, broken server components... instead we get a clean nextjs frontend and the backend is the concept/sync engine which is much easier to maintain.
4) Auth is still difficult tho. I tried just plugging in better auth - the llm spent a lot of time trying to get that to work. it would be great to have a secure auth system built into the concept engine; will need to think about how to do that.
