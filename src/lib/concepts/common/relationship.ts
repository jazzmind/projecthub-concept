import { Relationship } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class RelationshipConcept {

  // Build an index description for arbitrary from/to. No side-effects.
  async index(input: {
    fromEntityType: string;
    toEntityType: string;
    relationType: string;
  }): Promise<{ index: { fromEntityType: string; toEntityType: string; relationType: string; key: string } } | { error: string }> {
    try {
      const key = `${input.fromEntityType}::${input.toEntityType}::${input.relationType}`;
      return { index: { fromEntityType: input.fromEntityType, toEntityType: input.toEntityType, relationType: input.relationType, key } };
    } catch (error) {
      return { error: `Failed to build relationship index: ${error}` };
    }
  }

  async link(input: {
    fromEntityType: string;
    fromEntityId: string;
    toEntityType: string;
    toEntityId: string;
    relationType: string;
    metadata?: any;
  }): Promise<{ relationship: Relationship } | { error: string }> {
    try {
      // Check if relationship already exists
      const existing = await prisma.relationship.findFirst({
        where: {
          fromEntityType: input.fromEntityType,
          fromEntityId: input.fromEntityId,
          toEntityType: input.toEntityType,
          toEntityId: input.toEntityId,
          relationType: input.relationType,
        },
      });

      let relationship;
      if (existing) {
        // Update existing relationship
        relationship = await prisma.relationship.update({
          where: { id: existing.id },
          data: { metadata: input.metadata || {} },
        });
      } else {
        // Create new relationship
        relationship = await prisma.relationship.create({
          data: {
            fromEntityType: input.fromEntityType,
            fromEntityId: input.fromEntityId,
            toEntityType: input.toEntityType,
            toEntityId: input.toEntityId,
            relationType: input.relationType,
            metadata: input.metadata || {},
          },
        });
      }
      return { relationship };
    } catch (error) {
      return { error: `Failed to link relationship: ${error}` };
    }
  }

  async unlink(input: {
    fromEntityType: string;
    fromEntityId: string;
    toEntityType: string;
    toEntityId: string;
    relationType: string;
  }): Promise<{ success: boolean } | { error: string }> {
    try {
      const existing = await prisma.relationship.findFirst({
        where: {
          fromEntityType: input.fromEntityType,
          fromEntityId: input.fromEntityId,
          toEntityType: input.toEntityType,
          toEntityId: input.toEntityId,
          relationType: input.relationType,
        },
      });

      if (existing) {
        await prisma.relationship.delete({
          where: { id: existing.id },
        });
      }
      return { success: true };
    } catch (error) {
      return { error: `Failed to unlink relationship: ${error}` };
    }
  }

  async update(input: {
    fromEntityType: string;
    fromEntityId: string;
    toEntityType: string;
    toEntityId: string;
    relationType: string; // fromEntity is relationshipType of toEntity
    metadata?: any;
  }): Promise<{ relationship: Relationship } | { error: string }> {
    try {
      const existing = await prisma.relationship.findFirst({
        where: {
          fromEntityType: input.fromEntityType,
          fromEntityId: input.fromEntityId,
          toEntityType: input.toEntityType,
          toEntityId: input.toEntityId,
          relationType: input.relationType,
        },
      });

      if (!existing) {
        return { error: 'Relationship not found' };
      }

      const relationship = await prisma.relationship.update({
        where: { id: existing.id },
        data: { metadata: input.metadata || {} },
      });
      return { relationship };
    } catch (error) {
      return { error: `Failed to update relationship: ${error}` };
    }
  }

  // Queries
  async _getByFrom(input: { fromEntityType: string; fromEntityId: string; relationType?: string }): Promise<Relationship[]> {
    return await prisma.relationship.findMany({
      where: {
        fromEntityType: input.fromEntityType,
        fromEntityId: input.fromEntityId,
        relationType: input.relationType ?? undefined,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async _getByTo(input: { toEntityType: string; toEntityId: string; relationType?: string }): Promise<Relationship[]> {
    return await prisma.relationship.findMany({
      where: {
        toEntityType: input.toEntityType,
        toEntityId: input.toEntityId,
        relationType: input.relationType ?? undefined,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async _getBetween(input: { entityAType: string; entityAId: string; entityBType: string; entityBId: string }): Promise<Relationship[]> {
    return await prisma.relationship.findMany({
      where: {
        OR: [
          { fromEntityType: input.entityAType, fromEntityId: input.entityAId, toEntityType: input.entityBType, toEntityId: input.entityBId },
          { fromEntityType: input.entityBType, fromEntityId: input.entityBId, toEntityType: input.entityAType, toEntityId: input.entityAId },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async _getChildren(input: { parentEntityType: string; parentEntityId: string }): Promise<Relationship[]> {
    return await prisma.relationship.findMany({
      where: { fromEntityType: input.parentEntityType, fromEntityId: input.parentEntityId, relationType: 'child' },
      orderBy: { updatedAt: "desc" },
    });
  }
}


