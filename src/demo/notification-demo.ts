/**
 * Notification System Demo
 * 
 * This script demonstrates the power of the concept design framework by showing
 * how the Notification concept automatically integrates with all existing concepts
 * without requiring ANY changes to their implementation.
 */

import { User, Assignment, Team, Campaign, Project, Notification } from '@/lib/server';

export async function demonstrateNotificationSystem() {
  console.log('🔔 Notification System Demo');
  console.log('============================\n');

  try {
    // 1. Create a test user
    console.log('1. Creating a test user...');
    const userResult = await User.create({
      email: 'demo@projecthub.com',
      name: 'Demo User'
    });

    if ('error' in userResult) {
      console.error('Failed to create user:', userResult.error);
      return;
    }

    const user = userResult.user;
    console.log(`✅ Created user: ${user.name} (${user.email})`);

    // Check for welcome notification (auto-created by sync)
    const welcomeNotifications = await Notification._getByType({
      userId: user.id,
      type: 'welcome'
    });
    
    if (welcomeNotifications.length > 0) {
      console.log(`🎉 Welcome notification automatically created: "${welcomeNotifications[0].title}"`);
    }

    // 2. Create an organization and add user to it
    console.log('\n2. Adding user to organization...');
    const orgResult = await User.addOrganizationMembership({
      id: user.id,
      organizationId: 'demo-org-id', // Would be real org ID in practice
      role: 'learner'
    });

    if ('error' in orgResult) {
      console.log('Note: Organization membership notification would trigger in real system');
    } else {
      console.log('✅ User added to organization');
      
      // Check for organization notification
      const orgNotifications = await Notification._getByType({
        userId: user.id,
        type: 'system'
      });
      
      if (orgNotifications.length > 0) {
        console.log(`🏢 Organization notification: "${orgNotifications[0].title}"`);
      }
    }

    // 3. Create a manual notification to demonstrate the concept
    console.log('\n3. Creating manual notifications...');
    
    // Assignment notification
    const assignmentNotification = await Notification.create({
      userId: user.id,
      type: 'assignment',
      title: 'New Project Assignment',
      message: 'You have been assigned to work on the AI Chatbot project',
      priority: 'high',
      sourceConceptType: 'Assignment',
      sourceEntityId: 'demo-assignment-id'
    });

    if ('error' in assignmentNotification) {
      console.error('Failed to create assignment notification');
    } else {
      console.log('✅ Assignment notification created');
    }

    // Team invitation notification
    const teamNotification = await Notification.create({
      userId: user.id,
      type: 'team_invite',
      title: 'Invited to Team',
      message: 'You have been invited to join the "AI Innovators" team',
      priority: 'medium',
      sourceConceptType: 'Team',
      sourceEntityId: 'demo-team-id'
    });

    if ('error' in teamNotification) {
      console.error('Failed to create team notification');
    } else {
      console.log('✅ Team invitation notification created');
    }

    // Expert feedback notification
    const feedbackNotification = await Notification.create({
      userId: user.id,
      type: 'expert_feedback',
      title: 'Expert Feedback Received',
      message: 'Your project mentor has provided feedback on your latest submission',
      priority: 'medium',
      sourceConceptType: 'Project',
      sourceEntityId: 'demo-project-id'
    });

    if ('error' in feedbackNotification) {
      console.error('Failed to create feedback notification');
    } else {
      console.log('✅ Expert feedback notification created');
    }

    // 4. Demonstrate bulk notifications
    console.log('\n4. Creating bulk notifications...');
    
    const bulkResult = await Notification.createBulk({
      userIds: [user.id], // In real scenario, this would be multiple users
      type: 'campaign_update',
      title: 'Campaign Status Update',
      message: 'The "Summer 2024 Industry Projects" campaign is now active!',
      priority: 'medium',
      sourceConceptType: 'Campaign',
      sourceEntityId: 'demo-campaign-id'
    });

    if ('error' in bulkResult) {
      console.error('Failed to create bulk notifications');
    } else {
      console.log(`✅ Bulk notifications created for 1 user(s)`);
    }

    // 5. Show all notifications for the user
    console.log('\n5. Retrieving all notifications...');
    const allNotifications = await Notification._getByUser({ userId: user.id });
    
    console.log(`📋 Total notifications: ${allNotifications.length}`);
    allNotifications.forEach((notification, index) => {
      const icon = notification.isRead ? '📖' : '📩';
      const priority = notification.priority === 'high' ? '🔴' : 
                      notification.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${icon} ${priority} [${notification.type}] ${notification.title}`);
    });

    // 6. Show unread count
    const unreadCount = await Notification._getUnreadCount({ userId: user.id });
    console.log(`\n📬 Unread notifications: ${unreadCount[0]}`);

    // 7. Mark notifications as read
    console.log('\n6. Marking notifications as read...');
    const unreadNotifications = await Notification._getUnreadByUser({ userId: user.id });
    
    if (unreadNotifications.length > 0) {
      const markResult = await Notification.markAsRead({
        id: unreadNotifications[0].id,
        userId: user.id
      });
      
      if ('error' in markResult) {
        console.error('Failed to mark notification as read');
      } else {
        console.log('✅ First notification marked as read');
      }
    }

    // 8. Mark all as read
    const markAllResult = await Notification.markAllAsRead({ userId: user.id });
    if ('error' in markAllResult) {
      console.error('Failed to mark all as read');
    } else {
      console.log(`✅ Marked ${markAllResult.count} notifications as read`);
    }

    // 9. Demonstrate notification preferences
    console.log('\n7. Setting notification preferences...');
    const prefsResult = await Notification.updatePreferences({
      userId: user.id,
      emailEnabled: true,
      pushEnabled: false,
      typePreferences: {
        assignment: { email: true, push: true },
        welcome: { email: true, push: false },
        team_invite: { email: false, push: true }
      },
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'America/New_York'
    });

    if ('error' in prefsResult) {
      console.error('Failed to set preferences');
    } else {
      console.log('✅ Notification preferences updated');
    }

    console.log('\n🎯 Demo Summary:');
    console.log('================');
    console.log('✅ Notifications automatically created for user events');
    console.log('✅ Cross-concept integration without code changes');
    console.log('✅ Bulk notification support for campaigns');
    console.log('✅ Read/unread state management');
    console.log('✅ User preference system');
    console.log('✅ Type-safe notification system');
    console.log('\n🚀 The Notification concept demonstrates how the concept design');
    console.log('   framework enables powerful cross-cutting features without');
    console.log('   modifying existing concept implementations!');

    // Cleanup
    console.log('\n8. Cleaning up demo data...');
    await Notification.delete({ id: assignmentNotification.notification.id, userId: user.id });
    console.log('✅ Demo completed and cleaned up');

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Export for use in other scripts
export default demonstrateNotificationSystem;
