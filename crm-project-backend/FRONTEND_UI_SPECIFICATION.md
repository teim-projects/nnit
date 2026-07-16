# NNIT Car Parking System - Frontend UI Specification

## 🎨 Design System

### Color Palette
```
Primary: #2563EB (Blue)
Secondary: #10B981 (Green)
Accent: #F59E0B (Amber)
Error: #EF4444 (Red)
Warning: #F59E0B (Orange)
Success: #10B981 (Green)

Status Colors:
- Open: #3B82F6 (Blue)
- In Process: #F59E0B (Orange)
- Closed: #10B981 (Green)
- Overdue: #EF4444 (Red)

Text:
- Primary: #111827
- Secondary: #6B7280
- Light: #9CA3AF

Background:
- White: #FFFFFF
- Gray-50: #F9FAFB
- Gray-100: #F3F4F6
- Gray-200: #E5E7EB
```

### Typography
```
Font Family: 'Inter', 'Segoe UI', sans-serif

Headings:
- H1: 2rem (32px), font-weight: 700
- H2: 1.5rem (24px), font-weight: 600
- H3: 1.25rem (20px), font-weight: 600
- H4: 1rem (16px), font-weight: 600

Body:
- Base: 0.875rem (14px), font-weight: 400
- Small: 0.75rem (12px), font-weight: 400
```

---

## 🏗️ Layout Structure

### Sidebar Navigation (Fixed Left)
```
┌──────────────────────┐
│  NNIT CRM            │
│  [Logo]              │
├──────────────────────┤
│ 📊 Dashboard         │
│ 📞 Leads             │
│ 👥 Customers         │
│ 🏗️ Products          │
│ 📐 Requirements      │
│ 💰 Quotations        │
│ 🧾 Invoices          │
│ 📊 Reports           │
├──────────────────────┤
│ ⚙️ Settings          │
│ 👤 Profile           │
│ 🚪 Logout            │
└──────────────────────┘
```

### Main Content Area
```
┌─────────────────────────────────────────────┐
│ Header: [Page Title] [Action Buttons]      │
├─────────────────────────────────────────────┤
│                                             │
│  Content Area                               │
│  (Tables, Forms, Cards)                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📊 DASHBOARD SCREEN

### Layout
```
┌──────────────────────────────────────────────────────┐
│ Dashboard                          [Date Range Filter]│
├──────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ 150     │  │ 45      │  │ 28      │  │ 15      ││
│  │ Leads   │  │ Customer│  │ Follow  │  │ Overdue ││
│  │ 📞      │  │ 👥      │  │ ups 📅  │  │ 🔴      ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
├──────────────────────────────────────────────────────┤
│  Today's Follow-ups (8)                              │
│  ┌───────────────────────────────────────────┐      │
│  │ Sharma Builders | 9876543210 | 10:00 AM   │      │
│  │ Status: In Process | Next: Tomorrow       │      │
│  └───────────────────────────────────────────┘      │
├──────────────────────────────────────────────────────┤
│  Recent Activity Feed                                │
│  • Rajesh added follow-up to Lead #15 - 2 mins ago  │
│  • New lead created by Admin - 15 mins ago
│  • Customer converted from Lead #12 - 1 hour ago    │
├──────────────────────────────────────────────────────┤
│  Revenue Overview (This Month)                       │
│  Total: ₹25,00,000 | Invoices: 12 | Paid: 8         │
└──────────────────────────────────────────────────────┘
```

---

## 📞 LEAD MANAGEMENT SCREENS

### Lead List Page
```
┌──────────────────────────────────────────────────────┐
│ Leads                            [+ Add New Lead]    │
├──────────────────────────────────────────────────────┤
│ [Search] [Filter by Status ▼] [Assigned To ▼]       │
│                                                      │
│ 🔴 Overdue (5) | 📅 Today (8) | 📆 Upcoming (25)    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Customer Name     | Contact    | Status | Next F/U  │
│ ─────────────────────────────────────────────────── │
│ 🔴 Sharma Builders | 9876543210 | Process | Today   │
│    Project: Tower A                                  │
│    Assigned: Rajesh Kumar                            │
│                                                      │
│ 📅 ABC Developers  | 9876543211 | Open    | Tomorrow│
│    Project: Mall Parking                             │
│    Assigned: Priya Singh                             │
│                                                      │
│ [Load More]                                          │
└──────────────────────────────────────────────────────┘
```

### Add Lead Form
```
┌──────────────────────────────────────────────────────┐
│ Add New Lead                    [Cancel] [Save Lead] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Customer Information                                 │
│ ┌────────────────────────────────────────────┐      │
│ │ Select Existing Customer:                  │      │
│ │ [Search Customer... ▼]                     │      │
│ │                OR                          │      │
│ │ [+ Create New Customer]                    │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
│ Lead Details                                         │
│ Lead Source: [IndiaMART ▼] *                         │
│ Project Name: [________________] *                   │
│ Project Address: [________________]                  │
│                                                      │
│ Requirements:                                        │
│ ┌──────────────────────────────────────────┐        │
│ │                                          │        │
│ │ [Text area for requirements]             │        │
│ │                                          │        │
│ └──────────────────────────────────────────┘        │
│                                                      │
│ Contact Person: [________________]                   │
│ Contact Number: [________________]                   │
│                                                      │
│ Follow-up Details                                    │
│ Enquiry Date: [Date Picker]                          │
│ First Follow-up Date: [Date Picker] *                │
│ Assign To: [Select Staff ▼] *                        │
│                                                      │
│ Status: [Open ▼]                                     │
│                                                      │
│                       [Cancel] [Save Lead]           │
└──────────────────────────────────────────────────────┘
```

### Lead Detail Page
```
┌──────────────────────────────────────────────────────┐
│ Lead #15 - Sharma Builders  [Edit] [Convert to Quote]│
├──────────────────────────────────────────────────────┤
│ [Overview] [Follow-ups] [Requirements] [Documents]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Customer Details              Project Details        │
│ ─────────────────            ─────────────────       │
│ Sharma Builders              Tower A                 │
│ 📞 9876543210                Plot 45, Vashi          │
│ 📧 info@sharma.com                                   │
│ 📍 Mumbai, MH                Status: In Process 🟡   │
│                              Assigned: Rajesh Kumar  │
│                                                      │
│ Next Follow-up: July 20, 2026 (in 5 days)           │
│ Last Follow-up: July 15, 2026                        │
│                                                      │
│ Requirements                                         │
│ ─────────────────                                   │
│ Need parking for 50 cars, 2-level basement available│
│ Budget: 15-20 lakhs, Timeline: 3 months              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 📝 FOLLOW-UP MANAGEMENT

### Follow-up Timeline (in Lead Detail)
```
┌──────────────────────────────────────────────────────┐
│ Follow-up History                  [+ Add Follow-up] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 🕐 July 15, 2026 - 2:30 PM                          │
│ ┌────────────────────────────────────────────┐      │
│ │ Status: In Process 🟡                      │      │
│ │ By: Rajesh Kumar                           │      │
│ │                                            │      │
│ │ Discussion Notes:                          │      │
│ │ Customer confirmed interest in Stack       │      │
│ │ Parking. Plot dimensions: 20x30x12 ft.     │      │
│ │ Budget: ₹15-20 lakhs. Prefers fully auto.  │      │
│ │                                            │      │
│ │ Suggested Solutions: ✅                     │      │
│ │ ┌──────────────────────────────────┐       │      │
│ │ │ 🏗️ 2DP 101 (Stack Parking)       │       │      │
│ │ │ Capacity: 4 cars                 │       │      │
│ │ │ Reason: Best for 2-level basement│       │      │
│ │ └──────────────────────────────────┘       │      │
│ │ ┌──────────────────────────────────┐       │      │
│ │ │ 🏗️ Puzzle 201 (Puzzle Parking)   │       │      │
│ │ │ Capacity: 8 cars                 │       │      │
│ │ │ Reason: Alternative option       │       │      │
│ │ └──────────────────────────────────┘       │      │
│ │                                            │      │
│ │ Next Follow-up: July 20, 2026              │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
│ 🕐 July 10, 2026 - 10:00 AM                         │
│ ┌────────────────────────────────────────────┐      │
│ │ Status: Open 🔵                            │      │
│ │ By: Rajesh Kumar                           │      │
│ │                                            │      │
│ │ Discussion Notes:                          │      │
│ │ Initial inquiry. Customer looking for      │      │
│ │ parking solution for 50 cars.              │      │
│ │                                            │      │
│ │ Next Follow-up: July 15, 2026              │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Add Follow-up Form
```
┌──────────────────────────────────────────────────────┐
│ Add Follow-up                   [Cancel] [Save]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Follow-up Date: [Date Picker] * [Time: 10:00 AM]    │
│                                                      │
│ Status: [In Process ▼] *                             │
│                                                      │
│ Remarks (Brief):                                     │
│ ┌──────────────────────────────────────────┐        │
│ │                                          │        │
│ └──────────────────────────────────────────┘        │
│                                                      │
│ Discussion Notes (Detailed):                         │
│ ┌──────────────────────────────────────────┐        │
│ │                                          │        │
│ │ [Enter detailed conversation notes,     │        │
│ │  customer requirements, concerns, etc.]  │        │
│ │                                          │        │
│ └──────────────────────────────────────────┘        │
│                                                      │
│ Suggested Solutions:                                 │
│ [+ Add Product Suggestion]                           │
│                                                      │
│ ┌────────────────────────────────────────────┐      │
│ │ Product: [2DP 101 ▼]                       │      │
│ │ Category: Stack Parking (auto-filled)      │      │
│ │ Capacity: 4 cars (auto-filled)             │      │
│ │                                            │      │
│ │ Reason for Suggestion:                     │      │
│ │ ┌────────────────────────────────────┐     │      │
│ │ │ Best fit for 2-level basement      │     │      │
│ │ └────────────────────────────────────┘     │      │
│ │                                 [Remove]   │      │
│ └────────────────────────────────────────────┘      │
│                                                      │
│ Next Follow-up Date: [Date Picker]                   │
│                                                      │
│                       [Cancel] [Save Follow-up]      │
└──────────────────────────────────────────────────────┘
```

---

## 👤 CUSTOMER MANAGEMENT

### Customer List
```
┌──────────────────────────────────────────────────────┐
│ Customers                     [+ Add New Customer]   │
├──────────────────────────────────────────────────────┤
│ [Search by name, email, contact...] [Filter ▼]      │
│                                                      │
│ Name              | Contact    | City   | Leads     │
│ ──────────────────────────────────────────────────  │
│ Sharma Builders   | 9876543210 | Mumbai | 3 (2 ✓)  │
│ ABC Developers    | 9876543211 | Pune   | 5 (1 ✓)  │
│ XYZ Constructions | 9876543212 | Delhi  | 2 (2 ✓)  │
│                                                      │
│ [Load More]                                          │
└──────────────────────────────────────────────────────┘
```

### Customer Detail Page
```
┌──────────────────────────────────────────────────────┐
│ Sharma Builders                    [Edit] [Actions ▼]│
├──────────────────────────────────────────────────────┤
│ [Profile] [Leads] [Follow-up History] [Invoices]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Contact Information                                  │
│ ─────────────────                                   │
│ 📞 Primary: 9876543210                              │
│ 📞 Secondary: 9876543211                            │
│ 📧 Email: info@sharmabuilders.com                   │
│ 📧 Secondary: contact@sharmabuilders.com            │
│                                                      │
│ POC Details                                          │
│ ─────────────────                                   │
│ Name: Mr. Amit Sharma                                │
│ Contact: 9876543212                                  │
│                                                      │
│ Billing Address                  Site Address        │
│ ─────────────────               ─────────────────   │
│ 123, MG Road                    Plot 45, Sector 12  │
│ Andheri East                    Vashi               │
│ Mumbai, MH - 400069             Navi Mumbai, MH     │
│                                                      │
│ Business Details                                     │
│ ─────────────────                                   │
│ GST: 27AABCS1234F1Z5                                │
│ PAN: AABCS1234F                                     │
│                                                      │
│ Statistics                                           │
│ ─────────────────                                   │
│ Total Leads: 3 | Active: 2 | Closed: 1              │
│ Total Revenue: ₹45,00,000                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Customer Follow-up History Tab
```
┌──────────────────────────────────────────────────────┐
│ Complete Follow-up History                           │
├──────────────────────────────────────────────────────┤
│ [All Leads ▼] [Date Range ▼]                        │
│                                                      │
│ Lead: Tower A (Lead #15)                             │
│ ───────────────────────────────                     │
│ 🕐 July 15, 2026                                     │
│ Status: In Process | By: Rajesh Kumar                │
│ Discussion: Customer confirmed interest...           │
│ Suggested: 2DP 101, Puzzle 201                       │
│                                                      │
│ 🕐 July 10, 2026                                     │
│ Status: Open | By: Rajesh Kumar                      │
│ Discussion: Initial inquiry...                       │
│                                                      │
│ Lead: Mall Parking (Lead #18)                        │
│ ───────────────────────────────                     │
│ 🕐 July 12, 2026                                     │
│ Status: Open | By: Priya Singh                       │
│ Discussion: Requirements gathering...                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 👥 STAFF MANAGEMENT

### Staff List
```
┌──────────────────────────────────────────────────────┐
│ Staff Management              [+ Add New Staff]      │
├──────────────────────────────────────────────────────┤
│ [Search by name, email...] [Filter by Role ▼]       │
│                                                      │
│ Name           | Email            | Role    | Status │
│ ──────────────────────────────────────────────────  │
│ 👤 Rajesh Kumar | sales1@nnit.com  | Sales   | ✅    │
│ 👤 Priya Singh  | sales2@nnit.com  | Sales   | ✅    │
│ 👤 Admin User   | admin@nnit.com   | Admin   | ✅    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Add Staff Form
```
┌──────────────────────────────────────────────────────┐
│ Add New Staff                   [Cancel] [Save]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Personal Information                                 │
│ ─────────────────                                   │
│ First Name: [________________] *                     │
│ Last Name:  [________________] *                     │
│                                                      │
│ Contact Details                                      │
│ ─────────────────                                   │
│ Email:      [________________] *                     │
│ Mobile No:  [__________] (10 digits) *              │
│                                                      │
│ Role & Access                                        │
│ ─────────────────                                   │
│ Role: [Sales ▼] *                                    │
│                                                      │
│ Password                                             │
│ ─────────────────                                   │
│ Password: [________________] *                       │
│ Confirm:  [________________] *                       │
│                                                      │
│ Status: ☑ Active                                     │
│                                                      │
│                       [Cancel] [Save Staff]          │
└──────────────────────────────────────────────────────┘
```

---

## 🎯 KEY UI COMPONENTS

### Status Badge
```jsx
// Open Lead
<span class="badge-blue">Open</span>

// In Process
<span class="badge-orange">In Process</span>

// Closed
<span class="badge-green">Closed</span>

// Overdue
<span class="badge-red">🔴 Overdue</span>
```

### Action Buttons
```jsx
// Primary Action
<button class="btn-primary">
  + Add New Lead
</button>

// Secondary Action
<button class="btn-secondary">
  Cancel
</button>

// Icon Button
<button class="btn-icon">
  <EditIcon /> Edit
</button>
```

### Card Component
```jsx
<div class="card">
  <div class="card-header">
    <h3>Follow-up Details</h3>
  </div>
  <div class="card-body">
    Content here...
  </div>
  <div class="card-footer">
    <button>Save</button>
  </div>
</div>
```

### Data Table
```jsx
<table class="data-table">
  <thead>
    <tr>
      <th>Customer</th>
      <th>Contact</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Sharma Builders</td>
      <td>9876543210</td>
      <td><span class="badge-orange">In Process</span></td>
      <td>
        <button>View</button>
        <button>Edit</button>
      </td>
    </tr>
  </tbody>
</table>
```

### Timeline Component
```jsx
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-marker">🕐</div>
    <div class="timeline-content">
      <div class="timeline-header">
        <span>July 15, 2026</span>
        <span class="badge-orange">In Process</span>
      </div>
      <div class="timeline-body">
        Discussion notes...
      </div>
    </div>
  </div>
</div>
```

---

## 📱 RESPONSIVE DESIGN

### Mobile View (< 768px)
```
- Sidebar collapses to hamburger menu
- Table converts to card list
- Forms stack vertically
- Action buttons full-width
```

### Tablet View (768px - 1024px)
```
- Sidebar shows icons only
- Tables with horizontal scroll
- 2-column form layout
```

### Desktop View (> 1024px)
```
- Full sidebar with labels
- Full tables visible
- 3-column layouts where applicable
```

---

## ⚡ INTERACTIVE BEHAVIORS

### Auto-save Drafts
- Forms auto-save every 30 seconds
- Show "Draft saved" indicator

### Real-time Updates
- New follow-ups appear without refresh
- Lead status updates in real-time
- Notification badges update

### Loading States
```jsx
// Skeleton Loading
<div class="skeleton-card">
  <div class="skeleton-line"></div>
  <div class="skeleton-line short"></div>
</div>

// Spinner
<div class="spinner"></div>
```

### Empty States
```jsx
<div class="empty-state">
  <img src="no-leads.svg" />
  <h3>No Leads Yet</h3>
  <p>Create your first lead to get started</p>
  <button>+ Add New Lead</button>
</div>
```

---

## 🔔 NOTIFICATIONS

### Toast Notifications
```jsx
// Success
<toast type="success">Follow-up saved successfully!</toast>

// Error
<toast type="error">Failed to save. Please try again.</toast>

// Warning
<toast type="warning">Follow-up date is overdue!</toast>

// Info
<toast type="info">New lead assigned to you.</toast>
```

### Alert Banners
```jsx
<alert type="warning">
  🔴 You have 5 overdue follow-ups. [View Now]
</alert>
```

---

## 🎛️ FILTERS & SEARCH

### Advanced Filters
```
┌──────────────────────────────────────┐
│ Filters                              │
├──────────────────────────────────────┤
│ Status:                              │
│ ☑ Open  ☑ In Process  ☐ Closed      │
│                                      │
│ Date Range:                          │
│ From: [Date] To: [Date]              │
│                                      │
│ Assigned To:                         │
│ [Select Staff ▼]                     │
│                                      │
│ Lead Source:                         │
│ [IndiaMART ▼]                        │
│                                      │
│ [Clear All] [Apply Filters]          │
└──────────────────────────────────────┘
```

### Search with Suggestions
```
┌────────────────────────────────────┐
│ 🔍 Search customers, leads...      │
├────────────────────────────────────┤
│ Sharma Builders (Customer)         │
│ Tower A Project (Lead #15)         │
│ 9876543210 (Contact)               │
└────────────────────────────────────┘
```

---

## 🎨 CSS FRAMEWORK RECOMMENDATIONS

### Option 1: Tailwind CSS
```css
/* Modern utility-first framework */
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Add Lead
</button>
```

### Option 2: Material-UI (React)
```jsx
import { Button } from '@mui/material';
<Button variant="contained" color="primary">Add Lead</Button>
```

### Option 3: Ant Design
```jsx
import { Button, Table } from 'antd';
<Button type="primary">Add Lead</Button>
```

---

## 🔐 USER EXPERIENCE CONSIDERATIONS

### Permission-Based UI
```jsx
// Show/hide based on role
{user.role === 'admin' && (
  <button>Delete Lead</button>
)}

// Disable for sales staff
<button disabled={user.role === 'sales'}>
  Reassign Lead
</button>
```

### Confirmation Dialogs
```jsx
<dialog>
  <h3>Confirm Deletion</h3>
  <p>Are you sure you want to delete this lead?</p>
  <button>Cancel</button>
  <button>Delete</button>
</dialog>
```

---

## 📊 DATA VISUALIZATION

### Charts for Dashboard
```jsx
// Revenue Chart (Line Chart)
<LineChart data={revenueData} />

// Lead Status Distribution (Pie Chart)
<PieChart data={statusData} />

// Follow-up Trends (Bar Chart)
<BarChart data={followupData} />
```

---

**Last Updated:** July 15, 2026
**Version:** 1.0
**Framework Compatibility:** React, Vue, Angular
