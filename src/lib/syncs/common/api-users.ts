import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { UserConcept } from "@/lib/concepts/common/user";

/**
 * User API Synchronizations
 * 
 * Handles user search, creation, and management via API endpoints
 */

export function makeApiUserSyncs(
  API: APIConcept,
  User: UserConcept,
) {

  // Search users (trigger)
  const SearchUsers = ({ request, query }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "GET", 
        path: "/api/users/search",
        q: query
      }, { request }],
    ),
    then: actions([
      User.search, { q: query }
    ]),
  });

  // Search users (response)
  const SearchUsersResponse = ({ request, requestId, query, usersData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "GET", path: "/api/users/search" }, { request }],
      [User.search, { q: query }, { users: usersData }],
    ),
    where: (frames: Frames) => {
      return frames.map((frame) => {
        const users = (frame as any)[usersData];
        const bodyData = { users };
        
        return {
          ...frame,
          [requestId]: (frame as any)[request]?.id,
          [responseBody]: bodyData,
        };
      });
    },
    then: actions([
      API.respond,
      { requestId, status: 200, body: responseBody },
    ]),
  });

  // Create user (trigger)
  const CreateUser = ({ request, name, email }: Vars) => ({
    when: actions(
      [API.request as any, { 
        method: "POST", 
        path: "/api/users",
        name,
        email
      }, { request }],
    ),
    then: actions([
      User.create, { name, email }
    ]),
  });

  // Create user (response)
  const CreateUserResponse = ({ request, requestId, name, email, userData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/users" }, { request }],
      [User.create, { name, email }, { user: userData }],
    ),
    where: (frames: Frames) => {
      return frames.map((frame) => {
        const user = (frame as any)[userData];
        const bodyData = { user };
        
        return {
          ...frame,
          [requestId]: (frame as any)[request]?.id,
          [responseBody]: bodyData,
        };
      });
    },
    then: actions([
      API.respond,
      { requestId, status: 201, body: responseBody },
    ]),
  });

  return {
    SearchUsers,
    SearchUsersResponse,
    CreateUser,
    CreateUserResponse,
  } as const;
}