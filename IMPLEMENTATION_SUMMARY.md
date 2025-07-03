# Course Changes Notification Implementation

## Overview
I have successfully implemented a new notification system for course changes that triggers when:
1. **New course appears** - When a user gets enrolled in a new course
2. **Course changes from inprogress to past** - When a course status changes (e.g., semester ends)
3. **Course gets deleted** - When a user is unenrolled from a course or course is removed

## Implementation Details

### 1. Type Definitions Updated
- **File**: `packages/types/src/db.d.ts`
- **Change**: Added `"courseChanges::telegram": 0 | 1 | 2` to `NotificationSettings` type

### 2. Course Change Event Handler
- **File**: `apps/backend/src/services/cluster/events/courses.ts`
- **Features**:
  - `CourseChangeType`: "added" | "deleted" | "classification_changed"
  - `trackCourseChanges()`: Compares old vs new course lists and detects changes
  - `formatCourseChanges()`: Formats notification messages with emojis and clear descriptions

### 3. Database Schema Updated
- **File**: `packages/db/src/mongo/models/User.ts`
- **Change**: Added courseChanges notification setting to user schema with default value of 1 (enabled)

### 4. API Router Updated
- **File**: `apps/backend/src/services/api/router/v2.ts`
- **Change**: Added courseChanges validation to settings update endpoint

### 5. Course Sync Enhanced
- **File**: `apps/backend/src/core/sync.ts`
- **Changes**:
  - Added `trackChanges` parameter to `syncCourses()`
  - Now captures courses before and after sync for comparison
  - Returns change data when tracking is enabled

### 6. Background Processor Updated
- **File**: `apps/backend/src/services/cluster/processors.ts`
- **Changes**:
  - Course sync processor now tracks changes and sends notifications
  - Integrates with existing Telegram notification queue
  - Respects user notification preferences

### 7. Telegram Bot Settings
- **File**: `apps/telegram-bot/src/bot/features/settings.ts`
- **Change**: Added "Course Changes" to notification configuration

### 8. Frontend UI
- **File**: `apps/frontend/src/pages/account/AccountNotifications.vue`
- **Change**: Added course changes toggle switch with description

## Notification Messages

The system generates user-friendly messages like:

```
Course updates:

✅ New course: Mathematics 101 (inprogress)

🗑️ Course removed: Physics 201

📋 Course status changed: Chemistry 301
  • in progress → past
```

## How It Works

1. **Course Sync Process**: When the system syncs courses for a user, it now optionally captures the existing courses before sync
2. **Change Detection**: The `trackCourseChanges()` function compares old vs new course lists to identify:
   - New courses (not in old list or previously marked as deleted)
   - Deleted courses (in old list but not in new list)
   - Classification changes (same course ID but different status)
3. **Notification**: If changes are detected and user has course change notifications enabled, a formatted message is sent via Telegram
4. **User Control**: Users can enable/disable course change notifications through both the Telegram bot and web interface

## Database Impact

- New users will have course change notifications enabled by default (value: 1)
- Existing users will need to manually enable this notification type if desired
- No migration is required as the schema uses default values

## Integration Points

The implementation follows the existing notification patterns:
- Uses the same queue system as grade updates and deadline reminders
- Follows the same user preference checking logic
- Integrates with existing Telegram bot command structure
- Uses consistent UI patterns in the frontend

This provides users with comprehensive awareness of their course enrollment changes while maintaining the same user experience as other notification types.