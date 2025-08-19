import { Frames, actions, Vars } from '../../engine/mod';

// Project extraction sync functions 
export function makeProjectExtractionSyncs(API: any, Project: any, Membership: any) {
  
  // Define the sync functions that take Vars and return sync definitions
  const ExtractProjectFromDocument = (vars: Vars) => {
    const { request } = vars;
    return {
      when: actions([API.request as any, { method: "POST", path: "/api/project/extract" }]),
      then: actions([Project.extractFromDocument, { 
        fileBuffer: request,
        originalFilename: request, 
        organizationId: request
      }]),
    };
  };

  const RespondToExtractionRequest = (vars: Vars) => {
    const { request } = vars;
    return {
      when: actions([Project.extractFromDocument as any, {}]),
      then: actions([API.respond, { 
        requestId: request,
        status: 201,
        body: request
      }]),
    };
  };

  return {
    ExtractProjectFromDocument,
    RespondToExtractionRequest,
  } as const;
}
