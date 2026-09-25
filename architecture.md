# FocusOS — Architecture

## 1. Architectural Direction

FocusOS uses a configurable, domain-first architecture centered on the Universal Node model.

The architecture must separate:

```text
Node
  = what the user organizes

Capability
  = what a Node can do

Configuration
  = how the user wants behavior to work

View / Component
  = how information is presented

System Module
  = fixed infrastructure exposed by FocusOS
```

## 2. System Layers

### Presentation Layer

Responsible for:

- Routing
- Pages
- Components
- Layout
- Accessibility
- User interaction
- Responsive behavior

The presentation layer must not contain complex persistence logic or duplicated business rules.

### Application Layer

Responsible for:

- Coordinating user actions
- Loading and saving preferences
- Coordinating Nodes and capabilities
- Dashboard configuration
- Calendar configuration
- Onboarding flows

### Domain Layer

Responsible for pure, testable rules:

- Node creation and hierarchy validation
- Parent-child relationships
- Ordering and movement
- Capability attachment
- Capability configuration validation
- Dashboard normalization
- Progress calculations
- Recurrence rules
- Permission and ownership assumptions

### Data Layer

Responsible for:

- Firebase Authentication integration
- Firestore reads and writes
- Serialization and normalization
- Data validation at persistence boundaries
- Safe migrations
- Query helpers

### Infrastructure Layer

Responsible for:

- Firebase configuration
- Hosting
- Firestore rules
- Environment handling
- Build and deployment configuration

## 3. Universal Node Data Model

A Node should conceptually contain:

```text
Node
├── id
├── ownerId
├── parentId
├── name
├── description
├── icon
├── color
├── status
├── order
├── customFields
├── capabilityBindings
├── viewConfiguration
├── visibilityConfiguration
├── relationshipReferences
├── createdAt
└── updatedAt
```

The exact Firestore representation may evolve, but the public domain contract must remain stable and versioned.

## 4. Capability Model

Capabilities should be represented independently from Nodes.

A Node references attached capabilities through bindings. A binding may contain:

- Capability key or identifier
- Configuration
- Enabled state
- Visibility
- Ordering
- View preferences
- Capability-specific data references

Built-in capabilities are registered in a controlled registry. User-created capabilities should eventually be represented through validated schemas rather than arbitrary executable code.

## 5. Storage Strategy

Use Firestore for persistent user-owned data.

Recommended conceptual boundaries:

```text
users/{userId}
users/{userId}/preferences/{preferenceId}
users/{userId}/nodes/{nodeId}
users/{userId}/capabilities/{capabilityId}
users/{userId}/events/{eventId}
users/{userId}/dashboardLayouts/{layoutId}
users/{userId}/activity/{activityId}
```

The final collection structure may be adjusted after query patterns and security rules are verified. Avoid premature fragmentation and avoid storing large unrelated documents in a single record.

## 6. Fixed System Modules

The system exposes only these fixed modules:

- Dashboard
- Calendar
- Settings

The sidebar is a navigation presentation and must not impose product categories. User-created Nodes and capability views may be surfaced in navigation according to user configuration.

## 7. Dashboard Architecture

Dashboard configuration should be persisted separately from rendered widgets.

A dashboard layout contains:

- Layout identity
- Name
- Column count
- Widget definitions
- Widget order
- Position
- Width and height
- Enabled state
- Widget configuration

The Dashboard page should render the saved configuration. The Settings builder should edit the configuration. The home Dashboard should not accidentally become an editor.

## 8. Configuration Architecture

Configuration should be divided into:

- User preferences
- Regional and localization settings
- Calendar and time settings
- Accessibility settings
- Dashboard settings
- Sidebar settings
- Capability settings
- Node builder settings
- Notification settings
- Data and privacy settings

All configuration should have defaults, normalization, and validation.

## 9. Migration Strategy

- Prefer additive migrations.
- Preserve existing user records.
- Normalize missing fields with safe defaults.
- Do not silently reinterpret user data.
- Do not delete legacy functionality until replacement functionality is verified.
- Document migrations and rollback considerations.

## 10. Testing Strategy

Pure domain logic should be testable through Node-based scripts or a dedicated test framework.

Minimum verification areas:

- Node hierarchy validation
- Parent-child movement
- Node ordering
- Capability binding validation
- Dashboard normalization
- Preference normalization
- Calendar and time formatting
- Firestore security rules
- Authentication and protected routes

## 11. Future Awwab Layer

Awwab must be built later as a layer over FocusOS rather than becoming the foundation of the data model.

Awwab should consume stable APIs for:

- Reading user context
- Planning
- Memory
- Calendar interaction
- Notifications
- Automation
- Voice

Awwab must not bypass FocusOS domain rules or directly mutate arbitrary Firestore data without validated application interfaces.
