# FocusOS — UI/UX Design

## 1. Design Philosophy

FocusOS should feel like an adaptable operating environment rather than a collection of fixed productivity apps.

The interface must be:

- Clear
- Calm
- Configurable
- Accessible
- Consistent
- Responsive
- Respectful of user-defined structure

## 2. System Navigation

The fixed navigation areas are:

- Dashboard
- Calendar
- Settings

The sidebar is configurable. It may contain selected user-created Nodes, capability views, shortcuts, or system entries. Creating a Node does not automatically require displaying it in the sidebar.

## 3. Dashboard Design

The Dashboard is a customizable canvas or grid.

Supported widget behavior should eventually include:

- Add
- Remove
- Enable or disable
- Move
- Resize
- Reorder
- Configure
- Duplicate
- Collapse
- Hide and show

The main Dashboard should prioritize reading and using information. Editing layout should be available through Settings or a clearly enabled edit mode.

## 4. Greeting Design

The greeting is configurable and supports:

- Enable or disable greeting
- Fixed greeting prefix
- Time-based greeting
- Custom greeting mode
- Display name toggle
- Morning, afternoon, evening, and night messages

Default example:

`Assalamualaikum, Good morning, Anas`

The design must allow the user to replace the Islamic prefix with another greeting or disable it.

## 5. Node Builder Design

The Node builder should guide the user through:

1. Identity
2. Structure
3. Fields
4. Capabilities
5. Capability configuration
6. Visibility
7. Dashboard/presentation
8. Save and review

The builder must support returning to earlier steps and editing an existing Node. It should not be a one-time irreversible wizard.

## 6. Node Detail Design

A Node detail screen should present:

- Node identity
- Parent and child navigation
- Custom fields
- Attached capabilities
- Activity/history
- Relationships
- Visibility and configuration controls

The design must avoid assuming that all Nodes have the same fields or capabilities.

## 5. Page Builder UX

Workspace is the Page Builder, not a generic folder manager. The primary action is **Create page**. Users can create root Pages or child Pages to form any hierarchy they want.

For each Page, the builder must make these controls understandable:

- Name, icon, color, description
- Parent Page
- Data fields
- Capabilities
- Capability configuration
- Show in left sidebar
- Sidebar order
- Allow dashboard presentation
- Dashboard order
- Collapsed-by-default behavior

A Page is only shown in the left sidebar when the user enables its navigation visibility. This keeps the sidebar user-defined instead of mirroring the entire hierarchy automatically.

## 6. Page Runtime UX

Opening a Page displays its identity, data fields, attached capabilities, child Pages, and activity/history. A **Configure page** action opens Settings with that Page selected.

## 7. Settings Design

Settings should be grouped into understandable sections:

- General
- Appearance
- Language and Region
- Calendar and Time
- Accessibility
- Dashboard
- Sidebar
- Capabilities
- Nodes and Builder
- Notifications
- Data and Privacy
- Account

Settings should explain consequences before destructive actions and should preserve unsaved changes safely.

## 8. Calendar Design

Calendar views should support configurable:

- Primary and secondary calendar systems
- Date format
- Time format
- Time zone
- First day of week
- Event visibility
- Node-linked event filtering

The interface should clearly distinguish standalone events from Node-linked events.

## 9. Accessibility Design

Accessibility controls should include:

- Font and UI scale
- Contrast
- Theme
- Density
- Reduced motion
- Keyboard navigation
- Visible focus indicators
- Large interaction targets
- Screen-reader-friendly labels and structure
- Notification and sound controls

## 10. Interaction Standards

- Buttons must clearly communicate their action.
- Loading, success, empty, and error states must be visible.
- Destructive actions require confirmation.
- Forms must preserve input after validation errors.
- Avoid unexplained icons without accessible labels.
- Use consistent spacing, typography, and feedback patterns.
- Do not hide important functionality only behind hover interactions.

## 11. Responsive Design

The application must work on desktop and smaller screens.

Grid layouts should degrade gracefully. Controls must remain usable without precise pointer interaction. Keyboard navigation must be considered for all builder and configuration interfaces.
\n## 10. Node Presentation\n\nNode hierarchy and presentation are separate. A Node may be configured to appear in navigation, appear on the Dashboard, start collapsed, and have independent navigation/dashboard ordering. Dashboard bindings may reference a specific Node and capability without changing the underlying hierarchy.\n