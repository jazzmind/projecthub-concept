import { actions, Frames, Vars } from "@/lib/engine";
import { APIConcept } from "@/lib/concepts/common/api";
import { RelationshipConcept } from "@/lib/concepts/common/relationship";

/**
 * Relationship Synchronizations
 * - Generic REST endpoints for linking entities
 */

export function makeApiRelationshipSyncs(
  API: APIConcept,
  Relationship: RelationshipConcept,
) {
  // Link relationship (trigger)
  const LinkRelationship = ({ request, fromEntity, toEntity, relationType, metadata }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/relationships", fromEntity, toEntity, relationType, metadata }, { request }],
    ),
    then: actions(
      [Relationship.link as any, { fromEntity, toEntity, relationType, metadata }],
    ),
  });

  // Link relationship (response)
  const LinkRelationshipResponse = ({ request, requestId, relationshipData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "POST", path: "/api/relationships" }, { request }],
      [Relationship.link as any, {}, { relationship: relationshipData }],
    ),
    where: (frames: Frames) => {
      return frames.map((frame) => {
        const relationship = (frame as any)[relationshipData];
        const bodyData = { relationship };
        
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

  // Unlink relationship (trigger)
  const UnlinkRelationship = ({ request, fromEntity, toEntity, relationType }: Vars) => ({
    when: actions(
      [API.request as any, { method: "DELETE", path: "/api/relationships", fromEntity, toEntity, relationType }, { request }],
    ),
    then: actions(
      [Relationship.unlink as any, { fromEntity, toEntity, relationType }],
    ),
  });

  // Unlink relationship (response)
  const UnlinkRelationshipResponse = ({ request, requestId, successData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "DELETE", path: "/api/relationships" }, { request }],
      [Relationship.unlink as any, {}, { success: successData }],
    ),
    where: (frames: Frames) => {
      return frames.map((frame) => {
        const success = (frame as any)[successData];
        const bodyData = { success };
        
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

  // Get relationships by from entity
  const GetByFrom = ({ request, requestId, fromEntity, relationType, relationshipsData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "GET", path: "/api/relationships/from", fromEntity, relationType }, { request }],
    ),
    where: (frames: Frames) =>
      frames.query(Relationship._getByFrom as any, { fromEntity, relationType }, { relationships: relationshipsData })
        .map((frame) => {
          const relationships = (frame as any)[relationshipsData];
          const bodyData = { relationships };
          
          return {
            ...frame,
            [requestId]: (frame as any)[request]?.id,
            [responseBody]: bodyData,
          };
        }),
    then: actions([
      API.respond,
      { requestId, status: 200, body: responseBody },
    ]),
  });

  // Get relationships by to entity
  const GetByTo = ({ request, requestId, toEntity, relationType, relationshipsData, responseBody }: Vars) => ({
    when: actions(
      [API.request as any, { method: "GET", path: "/api/relationships/to", toEntity, relationType }, { request }],
    ),
    where: (frames: Frames) =>
      frames.query(Relationship._getByTo as any, { toEntity, relationType }, { relationships: relationshipsData })
        .map((frame) => {
          const relationships = (frame as any)[relationshipsData];
          const bodyData = { relationships };
          
          return {
            ...frame,
            [requestId]: (frame as any)[request]?.id,
            [responseBody]: bodyData,
          };
        }),
    then: actions([
      API.respond,
      { requestId, status: 200, body: responseBody },
    ]),
  });

  return {
    LinkRelationship,
    LinkRelationshipResponse,
    UnlinkRelationship,
    UnlinkRelationshipResponse,
    GetByFrom,
    GetByTo,
  } as const;
}


