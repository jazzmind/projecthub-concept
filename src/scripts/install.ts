import { Campaign, Membership, User, Role, Organization } from "@/lib/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function bootstrapSystem() {
    const autoRegisterDomain = process.env.AUTO_REGISTER_DOMAIN;
    const adminUsers = (process.env.ADMIN_USERS || "").split(",").map(e => e.trim());
    const role = 'platform_admin';
    const roles = {
        platform_admin: {
            name: 'platform_admin',
            displayName: 'Platform Admin',
            description: 'Full platform access',
            scope: 'platform',
            permissions: {
              organizations: { create: true, read: true, update: true, delete: true, manage_members: true },
              campaigns: { create: true, read: true, update: true, delete: true, publish: true },
              projects: { create: true, read: true, update: true, delete: true, assign: true },
              teams: { create: true, read: true, update: true, delete: true, manage_members: true },
              profiles: { create: true, read: true, update: true, delete: true, verify: true },
              users: { read: true, update: true, delete: true },
            },
        },
        manager: {
            name: 'manager',
            displayName: 'Manager',
            description: 'Manager role',
            scope: 'organization',
            permissions: {
                organizations: { read: true, update: true, manage_members: true },
                campaigns: { create: true, read: true, update: true, publish: true },
                projects: { create: true, read: true, update: true, assign: true },
                teams: { create: true, read: true, update: true, manage_members: true },
                profiles: { read: true, update: true, delete: true, verify: true },
                users: { read: true, update: true, delete: true },
            },
        },
        educator: {
            name: 'educator',
            displayName: 'Educator',
            description: 'Educator role',
            scope: 'organization',
            permissions: {
                organizations: { read: true },
                campaigns: { create: true, read: true, update: true, publish: true },
                projects: { create: true, read: true, update: true, assign: true },
                teams: { create: true, read: true, update: true, manage_members: true },
                profiles: { read: true, update: true, delete: true, verify: true },
                users: { read: true, update: true, delete: true },
            },
        },
        provider: {
            name: 'provider',
            displayName: 'Provider',
            description: 'Provider role',
            scope: 'project',
            permissions: {
                campaigns: { read: true },
                projects: { read: true, create: true, update: true },
                teams: { read: true },
                profiles: { read: true }
            }
        },
        learner: {
            name: 'learner',
            displayName: 'Learner',
            description: 'Learner role',
            scope: 'project',
            permissions: {
                projects: { read: true },
                teams: { read: true },
                profiles: { read: true }
            }
        }
    }
    // Create the user in our concept system via the bridge
    try {
        // make sure all the core roles exist
        for (const roleName in roles) {
            const roleData = roles[roleName as keyof typeof roles] as any;
            const existingRole = await Role._getByDisplayName({ displayName: roleData.displayName });
            if (!existingRole) {
                await Role.create(roleData);
            }
        }
        const roleEntity = await Role._getByDisplayName({ displayName: 'Platform Admin' });

        // Ensure default organization exists (use valid org type)
        const org = await Organization._getByDomain({ domain: autoRegisterDomain as string } as any);
        let platformOrg = org[0];
        if (!platformOrg) {
            const created = await Organization.create({
                name: 'Starter Organization',
                description: 'Default organization',
                type: 'industry' as any,
                domain: autoRegisterDomain as string,
                contactEmail: 'help@practera.com',
            } as any);
            if ('organization' in created) {
                platformOrg = created.organization as any;
            }
        }

        // create default campaign if missing (use concept signature)
        const starterId = 'starter-campaign';
        const existingStarter = await Campaign._getById({ id: starterId } as any);
        let starterCampaign = existingStarter[0];
        if (!starterCampaign) {
            const created = await Campaign.create({
                id: starterId,
                name: 'Starter Campaign',
                description: 'Default campaign',
                learningObjectives: ['Onboard educators and admins'],
                startDate: new Date(),
                contactEmail: 'help@practera.com',
            } as any);
            if ('campaign' in created) {
                starterCampaign = created.campaign as any;
            }
        }
        // for each admin user, create a user and invite them to the platform org
        for (const adminUser of adminUsers) {
            const userResult = await User.register({
                email: adminUser,
                name: adminUser.split('@')[0]
            } as any);

            let memberId: string;
            if ('error' in userResult) {
                // If already exists, fetch by email
                const existing = await (User as any)._getByEmail?.({ email: adminUser });
                if (existing && existing[0]?.id) {
                    memberId = existing[0].id;
                } else {
                    console.error('Failed to create user in concept system:', userResult.error);
                    continue;
                }
            } else {
                memberId = userResult.user.id as any;
            }

            // invite the user to the platform org
            const orgInvite = await Membership.invite({
                memberEntityType: 'user',
                memberEntityId: memberId,
                targetEntityType: 'organization',
                targetEntityId: (platformOrg as any).organization || (platformOrg as any).id,
                roleEntityId: roleEntity?.id || '',
                invitedBy: 'system'
            });
            
            if ('error' in orgInvite) {
                console.error('Failed to invite user to organization:', orgInvite.error);
            }
            
            if ('membership' in orgInvite) {
                await Membership.approve({  
                    memberEntityType: 'user',
                    memberEntityId: memberId,
                    targetEntityType: 'organization',
                    targetEntityId: (platformOrg as any).organization || (platformOrg as any).id,
                    approvedBy: 'system',
                });
            }

            // invite the user to the starter campaign
            const educatorRoleEntity = await Role._getByDisplayName({ displayName: 'Educator' });
            const campaignInvite = await Membership.invite({
                memberEntityType: 'user',
                memberEntityId: memberId,
                targetEntityType: 'campaign',
                targetEntityId: (starterCampaign as any).id,
                roleEntityId: educatorRoleEntity?.id || '',
                invitedBy: 'system'
            });

            if ('error' in campaignInvite) {
                console.error('Failed to invite user to campaign:', campaignInvite.error);
            }

            if ('membership' in campaignInvite) {
                await Membership.approve({
                    memberEntityType: 'user',
                    memberEntityId: memberId,
                    targetEntityType: 'campaign',
                    targetEntityId: (starterCampaign as any).id,
                    approvedBy: 'system',
                });
            }
        }
    } catch (error) {
        console.error('Failed to bootstrap system:', error);
    }
}

bootstrapSystem();
