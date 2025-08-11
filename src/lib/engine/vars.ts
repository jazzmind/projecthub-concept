import { Vars } from "./types";

// Special object that returns new Symbols when accessed
export const $vars = new Proxy({} as Vars, {
    get(_, prop) {
        if (typeof prop === "string") {
            // Return a symbol constructed with the property name
            return Symbol(prop);
        }
        return undefined;
    },
}) as Vars;

// Destructuring binds new symbols with property names
// Example usage (commented out for build)
// if (typeof window === 'undefined') {
//     const { user, post } = $vars;
//     console.log(user, post);
// }
