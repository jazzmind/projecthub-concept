import { File, Relationship } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class FileConcept {
  // Upload a file to the database and create a relationship between the file and uploadedByEntity (e.g. User)
  // If attachedEntityType and attachedEntityId are provided, create a relationship between the file and the entity
  async upload(input: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
    uploadedByEntityType: string;
    uploadedByEntityId: string;
    attachToEntityType?: string;
    attachToEntityId?: string;
    isPublic?: boolean;
    metadata?: object;
  }): Promise<{ file: File } | { error: string }> {
    try {
      // store the file in the database
      const file = await prisma.file.create({
        data: {
          id: input.id,
          filename: input.filename,
          originalName: input.originalName,
          mimeType: input.mimeType,
          size: input.size,
          path: input.path,
          isPublic: input.isPublic || false,
          metadata: input.metadata,
        }
      });
      // create a relationship between the file and the uploading entity
      await prisma.relationship.create({
        data: {
          fromEntityType: 'file',
          fromEntityId: input.id,
          toEntityType: input.uploadedByEntityType,
          toEntityId: input.uploadedByEntityId,
          relationType: 'child'
        }
      });
      // create a relationship between the file and the attached entity if it exists
      if (input.attachToEntityId) {
        await prisma.relationship.create({
          data: {
            fromEntityType: 'file',
            fromEntityId: input.id,
            toEntityType: input.attachToEntityType || 'user',
            toEntityId: input.attachToEntityId,
            relationType: 'child'
          }
        });
      }
      return { file };
    } catch (error) {
      return { error: `Failed to upload file: ${error}` };
    }
  }

  async attach(input: {
    id: string;
    attachToEntityType: string;
    attachToEntityId: string;
  }): Promise<{ relationship: Relationship } | { error: string }> {
    try {
      const relationship = await prisma.relationship.create({
        data: { 
          fromEntityType: 'file',
          fromEntityId: input.id,
          toEntityType: input.attachToEntityType,
          toEntityId: input.attachToEntityId,
          relationType: 'child'
        }
      });

      return { relationship };
    } catch (error) {
      return { error: `Failed to attach file: ${error}` };
    }
  }

  async updateVisibility(input: {
    id: string;
    isPublic: boolean;
  }): Promise<{ file: File } | { error: string }> {
    try {
      const file = await prisma.file.update({
        where: { id: input.id },
        data: { 
          isPublic: input.isPublic,
          updatedAt: new Date()
        }
      });

      return { file };
    } catch (error) {
      return { error: `Failed to update file visibility: ${error}` };
    }
  }

  async delete(input: {
    id: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      await prisma.file.delete({
        where: { id: input.id }
      });

      return { success: true };
    } catch (error) {
      return { error: `Failed to delete file: ${error}` };
    }
  }

  // Queries
  async _getById(input: { id: string }): Promise<File[]> {
    const file = await prisma.file.findUnique({
      where: { id: input.id }
    });
    return file ? [file] : [];
  }

  async _getByOwner(input: { userId: string }): Promise<File[]> {
    const relationships = await prisma.relationship.findMany({
      where: { 
        fromEntityType: 'file',
        toEntityType: 'user',
        toEntityId: input.userId,
        relationType: 'child'
      },
      orderBy: { createdAt: 'desc' }
    });
    const fileIds = relationships.map(relationship => relationship.toEntityId);
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds } }
    });
    return files; 
  }

  async _getByAttachedEntity(input: { entityType: string; entityId: string }): Promise<File[]> {
    const relationships = await prisma.relationship.findMany({
      where: { 
        fromEntityType: 'file',
        toEntityType: input.entityType,
        toEntityId: input.entityId,
        relationType: 'child'
      },
      orderBy: { createdAt: 'desc' }
    });
    const fileIds = relationships.map(relationship => relationship.toEntityId);
    const files = await prisma.file.findMany({
      where: { id: { in: fileIds } }
    });
    return files;
  }

  async _getByMimeType(input: { mimeType: string }): Promise<File[]> {
    return await prisma.file.findMany({
      where: { 
        mimeType: input.mimeType
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async _getByVisibility(input: { isPublic: boolean }): Promise<File[]> {
    return await prisma.file.findMany({
      where: { 
        isPublic: input.isPublic
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async _getPublicFiles(): Promise<File[]> {
    return await prisma.file.findMany({
      where: { 
        isPublic: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async _searchByFilename(input: { filename: string }): Promise<File[]> {
    return await prisma.file.findMany({
      where: { 
        OR: [
          { filename: { contains: input.filename, mode: 'insensitive' } },
          { originalName: { contains: input.filename, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async _getLargeFiles(input: { sizeThreshold: number }): Promise<File[]> {
    return await prisma.file.findMany({
      where: { 
        size: { gt: input.sizeThreshold }
      },
      orderBy: { size: 'desc' }
    });
  }
}
