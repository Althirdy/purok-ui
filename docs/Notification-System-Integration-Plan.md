# Notification System Integration Plan
## UrbanWatch Mobile Applications (Citizen & Purok)

## 1. Executive Summary

This document outlines the integration plan for a persistent notification system that will serve both the Citizen and Purok Leader mobile applications. The system will ensure that notifications are stored in a backend database and can be retrieved when users log in, even if the notifications were sent while they were offline.

---

## 2. Problem Statement

### Current Situation
- Notifications are delivered only via real-time Pusher events
- If a user is logged out or offline when an event occurs, they miss the notification
- Notifications are stored only locally on the device and are lost when the app is reinstalled

### Business Impact
- Purok leaders may miss critical concern assignments
- Citizens may miss updates on their submitted concerns
- Poor user experience and potential safety implications

---

## 3. Proposed Solution

### 3.1 Architecture Overview

The solution involves:
1. **Backend Database Storage** - All notifications are persisted in the database
2. **REST API Endpoints** - For fetching, reading, and managing notifications
3. **Real-time Updates** - Pusher continues to provide instant notifications
4. **Mobile App Integration** - Apps fetch notifications on login and sync with backend

### 3.2 System Flow Diagram

```
┌─────────────────┐
│  Citizen App    │
│  Submits        │
│  Concern        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Backend      │
│    Server       │
└────────┬────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐          ┌─────────────────┐
│   Database      │          │    Pusher       │
│   (Persist      │          │    (Real-time)  │
│   Notification) │          │                 │
└─────────────────┘          └────────┬────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │  Purok App      │
                             │  (Online)       │
                             │  Receives       │
                             │  Instantly      │
                             └─────────────────┘

When Purok Leader Logs In:
┌─────────────────┐          ┌─────────────────┐
│  Purok App      │  ──────► │    Backend      │
│  Fetches        │  GET     │    API          │
│  Notifications  │          │                 │
└─────────────────┘          └────────┬────────┘
                                      │
                                      ▼
                             ┌─────────────────┐
                             │   Database      │
                             │   Returns all   │
                             │   notifications │
                             └─────────────────┘
```

---

## 4. Database Design

### 4.1 Notifications Table Schema

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT (PK) | Auto-increment primary key |
| user_id | BIGINT | Recipient user ID |
| user_type | ENUM | 'citizen' or 'purok_leader' |
| type | VARCHAR(50) | Notification type (see 4.2) |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification body |
| data | JSON | Additional metadata |
| read_at | TIMESTAMP | When notification was read (NULL = unread) |
| created_at | TIMESTAMP | When notification was created |
| updated_at | TIMESTAMP | Last update timestamp |

### 4.2 Notification Types

| Type | Target User | Trigger Event |
|------|-------------|---------------|
| concern_assigned | Purok Leader | New concern distributed to leader |
| concern_acknowledged | Citizen | Leader acknowledged their concern |
| concern_resolved | Citizen | Concern has been resolved |
| concern_status_update | Both | Status change on a concern |
| new_safety_post | Citizen | New public safety post published |
| system_announcement | Both | System-wide announcements |

### 4.3 Migration SQL

```sql
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    user_type ENUM('citizen', 'purok_leader') NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_notifications (user_id, user_type, read_at),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. API Endpoints

### 5.1 Endpoint Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/v1/notifications | Fetch paginated notifications | Yes |
| GET | /api/v1/notifications/unread-count | Get unread count | Yes |
| PUT | /api/v1/notifications/{id}/read | Mark as read | Yes |
| PUT | /api/v1/notifications/mark-all-read | Mark all as read | Yes |
| DELETE | /api/v1/notifications/{id} | Delete notification | Yes |
| DELETE | /api/v1/notifications/clear | Clear all notifications | Yes |

### 5.2 API Response Formats

#### GET /api/v1/notifications

**Request:**
```
GET /api/v1/notifications?page=1&per_page=20
Authorization: Bearer {token}
```

**Response:**
```json
{
    "success": true,
    "message": "Notifications retrieved successfully",
    "data": {
        "notifications": [
            {
                "id": 1,
                "type": "concern_assigned",
                "title": "New Concern Assigned",
                "message": "A safety concern has been reported in your area",
                "data": {
                    "concern_id": 5,
                    "tracking_code": "CN-20260125-ABC1",
                    "category": "safety",
                    "severity": "high"
                },
                "read_at": null,
                "created_at": "2026-01-25T10:30:00Z"
            },
            {
                "id": 2,
                "type": "concern_acknowledged",
                "title": "Concern Acknowledged",
                "message": "Your concern has been acknowledged by the purok leader",
                "data": {
                    "concern_id": 3,
                    "tracking_code": "CN-20260124-XYZ9"
                },
                "read_at": "2026-01-25T09:00:00Z",
                "created_at": "2026-01-24T15:20:00Z"
            }
        ],
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 45,
            "last_page": 3,
            "has_more": true
        }
    }
}
```

#### GET /api/v1/notifications/unread-count

**Response:**
```json
{
    "success": true,
    "data": {
        "unread_count": 5
    }
}
```

---

## 6. Backend Implementation

### 6.1 Laravel Files to Create

| File | Purpose |
|------|---------|
| database/migrations/xxxx_create_notifications_table.php | Database migration |
| app/Models/Notification.php | Eloquent model |
| app/Http/Controllers/Api/V1/NotificationController.php | API controller |
| app/Services/NotificationService.php | Business logic service |
| routes/api.php | API route definitions |

### 6.2 Notification Service Methods

```php
class NotificationService
{
    // Create notification when concern is assigned to purok leader
    public function notifyConcernAssigned(Concern $concern, User $purokLeader): void

    // Create notification when concern status changes
    public function notifyConcernStatusChanged(Concern $concern, string $newStatus): void

    // Create notification for new public post
    public function notifyNewPublicPost(PublicPost $post, Collection $users): void

    // Bulk create notifications
    public function createBulkNotifications(array $notifications): void
}
```

### 6.3 Integration Points

The NotificationService should be called in these existing backend locations:

1. **ConcernDistributionService** - When concern is assigned to purok leader
2. **ConcernController@update** - When purok leader updates concern status
3. **PublicPostController@publish** - When a safety post is published

---

## 7. Mobile App Implementation

### 7.1 New Service File

Create `services/notification-api-service.ts`:

```typescript
export interface NotificationResponse {
    notifications: Notification[];
    pagination: {
        current_page: number;
        per_page: number;
        total: number;
        has_more: boolean;
    };
}

export async function fetchNotifications(
    token: string, 
    page: number = 1
): Promise<NotificationResponse>

export async function getUnreadCount(token: string): Promise<number>

export async function markAsRead(token: string, id: string): Promise<void>

export async function markAllAsRead(token: string): Promise<void>

export async function deleteNotification(token: string, id: string): Promise<void>

export async function clearAllNotifications(token: string): Promise<void>
```

### 7.2 Context Updates

Update `context/notification-context.tsx`:

1. Add state for backend-synced notifications
2. On login: fetch notifications from API
3. Merge real-time Pusher notifications with fetched notifications
4. Sync read status with backend when marking as read

### 7.3 Flow on User Login

```
1. User enters PIN and logs in
2. Auth context stores token
3. Notification context detects login
4. Fetch notifications from API
5. Store in local state
6. Subscribe to Pusher for real-time updates
7. Display notification badge with unread count
```

---

## 8. Scalability Considerations

### 8.1 Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| Pagination | Fetch 20 notifications per page |
| Database Indexing | Index on user_id, user_type, read_at, created_at |
| Caching | Cache unread count with 1-minute TTL |
| Batch Operations | Mark all as read in single query |
| Lazy Loading | Load more notifications on scroll |

### 8.2 Data Retention Policy

To prevent database bloat:
- Auto-delete notifications older than 90 days
- Or archive to separate table after 30 days
- Implement via Laravel scheduled command

```php
// In Console/Kernel.php
$schedule->command('notifications:cleanup')->daily();
```

---

## 9. Testing Plan

### 9.1 Backend Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Create notification | Record saved to database |
| Fetch notifications | Returns paginated list for user |
| Mark as read | read_at timestamp updated |
| Mark all as read | All user's notifications marked read |
| Delete notification | Record removed from database |
| Unread count | Returns correct count |

### 9.2 Mobile App Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Login fetch | Notifications loaded from API |
| Real-time notification | Added to list immediately |
| Mark as read | Synced with backend |
| Pull to refresh | Fetches latest from API |
| Pagination | Loads more on scroll |

---

## 10. Implementation Timeline

### Phase 1: Backend (Estimated: 2-3 days)
- [ ] Create database migration
- [ ] Create Notification model
- [ ] Create NotificationController
- [ ] Create NotificationService
- [ ] Add API routes
- [ ] Integrate with concern distribution
- [ ] Write unit tests

### Phase 2: Mobile App - Purok (Estimated: 1-2 days)
- [ ] Create notification API service
- [ ] Update notification context
- [ ] Update notification screen
- [ ] Test integration

### Phase 3: Mobile App - Citizen (Estimated: 1-2 days)
- [ ] Create notification API service
- [ ] Update notification context
- [ ] Update notification screen
- [ ] Test integration

### Phase 4: Testing & QA (Estimated: 1-2 days)
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] Bug fixes

**Total Estimated Time: 5-9 days**

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database growth | High storage costs | Implement retention policy |
| API performance | Slow app response | Add caching, pagination |
| Duplicate notifications | Confusion | Use idempotency keys |
| Migration downtime | Service interruption | Use zero-downtime migration |

---

## 12. Appendix

### 12.1 Current vs Proposed Comparison

| Feature | Current | Proposed |
|---------|---------|----------|
| Real-time delivery | ✅ Pusher | ✅ Pusher |
| Offline persistence | ❌ None | ✅ Database |
| Fetch on login | ❌ No | ✅ Yes |
| Read status sync | ❌ Local only | ✅ Backend synced |
| Cross-device sync | ❌ No | ✅ Yes |
| Scalability | ❌ Limited | ✅ Paginated API |

### 12.2 Related Documents

- UrbanWatch API Documentation
- Pusher Integration Guide
- Mobile App Architecture Document

---

**Document End**

*For questions or clarifications, please contact the development team.*
