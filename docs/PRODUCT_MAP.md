# KonkourX Canonical Product Map

**Status:** CANONICAL PRODUCT DEFINITION
**Product Owner decision:** 2026-10-07

This document answers: **What is KonkourX / کنکوریکس intended to become?**

It is the primary product-behavior and scope reference. [ROADMAP.md](ROADMAP.md) defines build order, [PROJECT_STATE.md](PROJECT_STATE.md) records what actually exists today, [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) governs visual rules, and [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md) governs Curriculum educational truth.

Older product visions, scope files, decision logs, architecture plans, and historical roadmaps remain supporting context only. Where they conflict with this map, this map governs product behavior.

## State Interpretation

### CURRENT IMPLEMENTED STATE

Current repository reality is documented only in [PROJECT_STATE.md](PROJECT_STATE.md). Inclusion in this product map does not claim implementation.

### APPROVED FUTURE STATE

The 0–6 model and explicit decisions below define the approved intended product. Implementation still requires an approved milestone in [ROADMAP.md](ROADMAP.md).

### EXPLORATORY / DEFERRED

Items explicitly labeled future or extensible remain in the product vision but are not implementation-authorized until scheduled. Details not decided here must not be invented.

## Master Definition

KonkourX is a comprehensive Persian EdTech platform. It connects public acquisition and educational publishing, Student learning execution, Counselor operations, shared learning and assessment, communication, business administration, and School/Institute collaboration.

It is not merely a planner, counseling CRM, Question Bank, content website, or virtual classroom. Those are product areas inside one platform.

The canonical conceptual map is:

0. Account / Identity / Access
1. Public Website
2. Student Super App
3. Counselor Workspace
4. Learning & Assessment
5. Communication & Classroom
6. Admin / Business / School

## Cross-Cutting Engines

The following capabilities support multiple surfaces and are not separate user-facing products:

- Identity/Auth;
- Roles/Permissions;
- Entitlements;
- Curriculum;
- Planning;
- Notifications;
- Files;
- Payments;
- Analytics.

Shared engines must not be duplicated for a role or organization when the same platform capability can be safely reused with appropriate permissions and context.

## 0. Account / Identity / Access

This is a cross-cutting product layer. It answers who a user is, which structural role they hold, which product capabilities they may use, which Organization they belong to, and which privileged actions authorized staff may perform.

Identity, Role, Entitlements, Permissions, and Organization Membership are separate concepts. The product must not collapse them into a single `role`, `planName`, or account-type field.

### 0.1 Registration Model

Public registration is Student-first. The primary public conversion path is:

```text
Start Free
→ Student Registration
→ Student account available immediately under the applicable free/default access model
```

Student, Counselor, and School/Institute must not be presented as three equal public registration choices.

Counselor and School/Institute entry points are secondary collaboration/application paths, such as:

- `درخواست همکاری مشاور`;
- `درخواست همکاری مدرسه / آموزشگاه`.

These are application flows. Submission does not activate privileged Counselor or Organization access.

### 0.2 Student Registration

Student registration is the default consumer account-creation path and is direct rather than approval-gated.

Registration may conceptually use mobile and/or email, password, and the profile information required by the product. Exact form fields may evolve through an approved UX milestone.

The locked distinction is: Student account creation is direct, while Counselor and School/Institute authority requires approval.

### 0.3 Counselor Application

Counselor onboarding is an application workflow. Application information may include:

- personal identity and contact information;
- education or university;
- experience;
- specialty;
- Student capacity;
- résumé or supporting documents;
- acceptance of relevant conditions.

Exact fields and form layout are not locked here. The workflow conceptually supports:

- Submitted / Pending;
- Approved;
- Rejected;
- Needs More Information.

Submitting an application never grants Counselor Workspace authority. Counselor Role and Workspace access become active only after approval by an authorized Admin.

Authorized Admin workflows may approve, reject, request additional information, and later suspend or deactivate Counselor access. Detailed suspension/deactivation consequences remain milestone-specific.

### 0.4 School / Institute Application

School/Institute onboarding is also an application workflow. Organization application information may include:

- Organization name and type;
- city/location fields;
- manager and contact information;
- approximate Student and staff counts;
- grades or educational levels;
- requested needs/services.

Exact form design is not locked here. An authorized Admin reviews the application. Only after approval is the Organization activated and the appropriate organizational administrator/access created or enabled.

### 0.5 Admin Account Creation

Admin registration is never public. Do not create a public Admin signup path.

Admin accounts are created and managed through authorized administration. Super Admin may create and manage Admin accounts subject to Roles, Permissions, and Audit requirements.

### 0.6 Identity vs Role vs Entitlement

These concepts remain distinct:

- **Identity:** who the user is.
- **Role:** the structural position the user holds, such as Student, Counselor, Admin, future Teacher, or an Organization Role.
- **Entitlement:** a product capability the user is allowed to use.

A Student remains a Student when their commercial package changes.

Example:

```text
Role: STUDENT

Possible Entitlements:
- question_bank.access
- exam_builder.access
- planning.advanced
- counselor.assigned
- learning.premium
```

Commercial names such as Bronze, Silver, or Gold must not be hardcoded into authorization logic. Plan names and packaging may change dynamically.

Authentication method is also separate: how a user proves Identity does not decide their Role or Entitlements.

### 0.7 Effective Access

The canonical conceptual rule is:

```text
Effective Access =
Role
+ Plan Entitlements
+ Organization Entitlements
+ User Overrides
+ Approved Purchased Rights where applicable
```

These sources may combine. Authorization evaluates effective capabilities and relevant scope rather than relying on one plan-name field.

For example, a Student may receive `question_bank.access` because their personal Plan includes it, their School Organization includes it, an authorized Admin granted temporary access, or an approved Purchase grants the right directly.

### 0.8 Plan / Product Dynamism Boundary

Authorized Admins may dynamically package existing software capabilities. Once `question_bank.access` exists in the product, Admin configuration may decide which Plans include it.

Admin configuration may change:

- packaging;
- Entitlement assignment;
- commercial availability;
- pricing-related access.

Admin configuration does not create application functionality. A brand-new software capability or permission type still requires development and an approved implementation milestone.

### 0.9 Authentication

Current/near-term direction is standard account authentication with secure server-side enforcement. The architecture remains extensible toward:

- mobile and/or email login;
- password authentication;
- OTP;
- Google;
- Telegram or other approved adapters.

This list does not claim that every method is currently implemented or approved for immediate delivery. Exact OTP, identity-provider, and MFA implementation remains a future technical choice.

Authentication method, Identity, Role, Permission, and Entitlement remain separate concepts.

### 0.10 Password Security

Passwords are never readable by Admin or Super Admin. The product must never offer a “show user password” capability.

Passwords must use appropriate secure one-way hashing, never reversible plaintext storage.

Authorized recovery actions may reset a password, send a recovery link or OTP, revoke sessions, or assist account recovery. They never reveal the previous password. This is a hard product and security rule.

### 0.11 Account Recovery

The full account lifecycle should support:

- forgot password;
- recovery through a supported email/mobile verification flow;
- setting a new password;
- logout from the current device;
- logout from all devices;
- session revocation;
- account unlock where applicable;
- optional future OTP/MFA reset through a privileged workflow.

Admin/Super Admin may initiate or assist authorized recovery but may not read the previous password.

### 0.12 Session Management

Users have controlled authenticated sessions. Product direction includes:

- a current session;
- multiple devices where permitted;
- logout;
- logout all devices;
- revocation of compromised sessions.

Admin/Super Admin may revoke sessions where authorized. Admin experiences must not expose session tokens, refresh tokens, or other session secrets.

### 0.13 Roles and Permissions

Administrative authorization must not rely on one universal `ADMIN` flag. The product model combines role-based access control with fine-grained Permissions.

Illustrative Permissions include:

```text
users.view
users.edit
users.suspend

questions.view
questions.create
questions.edit
questions.review
questions.approve
questions.reject
questions.publish
questions.unpublish

content.create
content.edit
content.publish

counselors.review_application
counselors.approve
counselors.reject
counselors.suspend
counselors.assign_student

payments.view
subscriptions.manage
```

The exact Permission inventory may evolve with implemented capabilities. This map locks the RBAC plus fine-grained Permission model, not a final exhaustive list.

### 0.14 Dynamic Admin Roles

Super Admin can configure administrative Roles by combining existing Permissions without requiring code changes for each employee.

Illustrative administrative Roles include:

- Question Reviewer;
- Finance Admin;
- Support Admin;
- Counselor Manager;
- Content Editor.

New combinations of existing Permissions are configuration. A new software capability or new Permission type may still require development.

### 0.15 Super Admin

The primary Super Admin is the highest operational authority inside the product. Subject to the security and Audit rules below, Super Admin may manage:

- users and profiles;
- Roles and Permissions;
- Subscriptions and Entitlements;
- Counselor assignment and applications;
- School/Institute applications;
- Question Bank;
- Content/CMS;
- support and Tickets;
- Payments;
- Admin accounts;
- sensitive access;
- Audit;
- sessions and account-recovery actions;
- temporary access overrides.

Super Admin may configure business/product behavior supported by existing software. Super Admin does not edit application code, change database schema, or create new software features through Admin UI.

### 0.16 Sensitive / Private Data Access

Super Admin must be capable of accessing private operational data when necessary for support, investigation, troubleshooting, or management. This may include private Chat, Counselor Private Notes, relevant Files, and sensitive user context.

This is privileged **Break-Glass** access, not ordinary browsing. Where applicable, access requires:

- an authorized Permission;
- an explicit reason;
- an Audit event.

Example reason:

```text
Investigating complaint #1842
```

The system records who accessed what, when, and why.

### 0.17 Private Notes

Counselor Private Notes are not Student-visible. Super Admin may access them only under authorized sensitive-access rules.

If privileged administrative editing is ever allowed, the original/historical content must not be silently destroyed. This principle does not define or authorize a complete versioning workflow.

### 0.18 Admin Support Authority

Super Admin is ultimately responsible for platform support and requires enough operational authority to resolve difficult user, account, and product issues. Authorized actions may include:

- correcting Entitlements;
- extending Subscriptions;
- revoking sessions;
- assisting account recovery;
- Counselor reassignment;
- resolving Ticket ownership;
- inspecting sensitive context through Break-Glass access.

Sensitive actions and manual overrides remain attributable.

### 0.19 User Suspension / Restoration

Authorized Admin Roles may suspend and restore/reactivate accounts.

Exact suspension consequences are not defined here and must be decided when implementation is scheduled. Implementers must not invent lockout, data-visibility, billing, Organization, or relationship side effects in advance.

### 0.20 Organization Membership

A user may belong to a School/Institute Organization. Organization Membership is distinct from personal Identity, global platform Role, and personal Subscription.

Membership may grant Organization-scoped Permissions and Organization Entitlements. For example, a Student may receive `question_bank.access` through their School without personally purchasing a separate Plan.

### 0.21 Commercial Access Examples

Illustrative commercial packages may include:

- Free Student;
- Exam access;
- Counselor/Planning access;
- Learning access;
- Complete/Pro access.

These names are examples, not a permanent Plan taxonomy or authorization vocabulary. Plans are dynamically managed under the Business model.

### 0.22 Security / Server Authority

Frontend visibility is never sufficient authorization. The backend enforces:

- Identity;
- ownership;
- Roles;
- Permissions;
- Entitlements;
- Organization scope.

Hidden buttons, client-side route protection, or frontend-supplied role/owner claims are not authorization.

### 0.23 Decision Gates

The following Section 0 decisions are locked and are not open gates:

- Student-first registration;
- direct Student account creation;
- Counselor approval requirement;
- School/Institute approval requirement;
- no public Admin registration;
- separation of Identity, Role, Entitlement, Permission, and Organization Membership;
- dynamic administrative Roles composed from existing Permissions;
- broad Super Admin operational authority within security/Audit boundaries;
- passwords are never readable;
- controlled and audited Break-Glass access for sensitive/private operational data;
- backend-authoritative access enforcement.

Remaining Section 0 design gates are limited to:

- the detailed Permission matrix for each implementation milestone;
- exact OTP, identity-provider, and MFA implementation choices;
- exact account-suspension consequences.

These details must be resolved when their affected implementation is scheduled. They do not weaken the locked model above.

### 0.24 Profile Center and Account-Security Experience

Profile Center is the header-owned account surface. Its retained information architecture is:

| Student | Counselor |
|---|---|
| اطلاعات شخصی | اطلاعات شخصی |
| اطلاعات تحصیلی | اطلاعات حرفه‌ای |
| تنظیمات | تنظیمات |
| امنیت و حساب | امنیت و حساب |

`امنیت و حساب` is mandatory. The current technical Profile Center has not received Product Owner Visual PASS and is classified for redesign, not polish-only continuation. The redesign must improve visual hierarchy, reduce excessive empty space, keep large error states from dominating the page, polish account-menu/header spacing, and give Counselor professional identity an appropriately professional presentation.

Account controls must correspond to real backend capabilities. The existing login, refresh/session handling, logout, logout-all, and current-password change flow remain valid. Verified email/phone management, email/phone change and verification, forgot/reset password, account recovery, session/device listing, and specific-session/device revocation are approved future capability areas sequenced after Profile visual closeout. MFA/2FA remains future-only unless separately approved. No frontend may fabricate these controls before the backend capability exists.

## 1. Public Website

The Public Website is a first-class product surface responsible for brand, SEO, acquisition, education, trust, marketing, product explanation, pricing, conversion, public content publishing, collaboration/application entry points, and public support/contact entry points.

It is the public front door to the entire KonkourX ecosystem, not merely a static landing page. Visitors should understand what the platform offers before registration.

### 1.1 Primary Audience and Conversion Priority

The main public conversion path is Student-first. Primary CTA examples include:

- `شروع رایگان`;
- `ثبت‌نام دانش‌آموز`;
- `شروع استفاده`.

The website must not present Student, Counselor, and School/Institute as three equally weighted primary signup paths.

Counselor and School/Institute collaboration are secondary flows. Examples include:

- `درخواست همکاری مشاور`;
- `درخواست همکاری مدرسه / آموزشگاه`.

These entry points belong in appropriate secondary areas such as lower Homepage sections, a Collaboration page, the footer, or relevant institutional pages. They must not compete visually with the main Student conversion path.

### 1.2 Website Information Architecture

The Public Website conceptually supports these page families:

- Home;
- Product / Platform overview;
- Planning;
- Counseling;
- Exams;
- Question Bank;
- Learning / Resources;
- School / Institute offering;
- Pricing;
- Blog;
- Article pages;
- FAQ;
- About;
- Team where appropriate;
- Contact;
- Collaboration / Work With Us;
- Policies / Privacy / Terms.

Future public surfaces may include public search, public resource discovery, and additional SEO landing pages.

This map preserves page families, not final URL structures or route names. Exact routing is implementation-stage detail.

### 1.3 Homepage

The Homepage should communicate the product quickly and clearly. Its conceptual hierarchy may include:

- primary brand/hero;
- clear value proposition;
- primary Student CTA;
- key product capabilities;
- real product UI/screenshots where available;
- Planning, Counseling, Exam, Question Bank, and Learning highlights;
- trust elements;
- Pricing entry;
- Content/Blog entry;
- School/Institute offering;
- Counselor collaboration entry;
- FAQ;
- final CTA;
- footer.

The Homepage does not need to expose every product detail. Its intended progression is:

```text
Understand
→ Trust
→ Explore
→ Convert
```

Avoid excessive feature dumping.

### 1.4 Product / Feature Pages

Major capabilities may have dedicated public pages, including:

- Planning;
- Counseling;
- Student Workspace;
- Question Bank;
- Practice;
- Exam Builder;
- Performance/Analytics;
- Learning Content;
- School/Institute.

A capability page should explain what the capability is, who it serves, which problem it solves, its important product behaviors, relevant screenshots/visuals, its access or Pricing path where applicable, and a clear CTA.

Public feature pages must not expose private user data or fabricated product metrics.

### 1.5 Service Pages

Service-oriented offerings may use dedicated pages, including academic Counseling, personal Planning, Exam services, School/Institute services, and Counselor collaboration.

Service pages and software-feature pages are related but not identical. For example, **Counseling** may explain the service relationship, while **Planning** explains a product capability. Do not force every offering into one page type.

### 1.6 Pricing

Pricing is dynamic and conceptually connected to the Business/Product/Plan system.

Ordinary commercial changes must not require a website deployment, including:

- Plan name;
- price;
- discount;
- duration;
- active/inactive state;
- display order;
- badge;
- CTA;
- trial;
- Pricing visibility.

The Business/Plan configuration model owns commercial truth. The Public Website consumes that configuration and must not duplicate hardcoded Pricing truth.

### 1.7 Free / Paid / Plan-Based Communication

The website clearly communicates configured access models. A capability or Content item may be:

- Free;
- Paid separately;
- included in one Plan;
- included in multiple Plans.

The website reflects the Business/Entitlement model; it does not invent access rules. For example, Question Bank may be presented as a paid capability or as included in configured Plans.

### 1.8 Blog / SEO Content Platform

Blog and SEO Content are first-class platform capabilities. Public Content conceptually supports:

- Article;
- Category;
- Tag;
- Author;
- publish state;
- publish date;
- related Content;
- search/discovery;
- SEO title;
- SEO description;
- canonical metadata where appropriate;
- social/share metadata where appropriate.

This does not authorize a deep enterprise editorial CMS. The locked requirement is that authorized Content staff can publish and manage ordinary public SEO/Content without a developer deployment.

### 1.9 SEO Direction

The Public Website is designed as an SEO engine, not only as a JavaScript product shell. Product requirements include:

- crawlable and indexable public pages where appropriate;
- stable public URLs;
- page-specific metadata;
- structured internal linking;
- Blog/Article discoverability;
- fast public-page loading;
- sitemap and robots support when implemented;
- redirect management where appropriate;
- correct separation of public and private/authenticated Content.

Private Student, Counselor, School, or Admin Content must not be publicly indexed.

Exact framework and SSR/SSG strategy are technical implementation choices and are not selected here.

### 1.10 CMS / Public Content Management

Authorized Admin/Content Roles should manage ordinary public Content without code changes. CMS-managed Content may include:

- Homepage sections;
- banners;
- CTA text;
- public product copy;
- FAQ;
- testimonials;
- Blog/Articles;
- Pricing display Content not sourced directly from Plans;
- Collaboration page Content;
- School offering Content;
- SEO metadata;
- selected redirects;
- announcement/banner Content.

CMS manages Content and configuration for supported public surfaces. It does not create new software functionality.

### 1.11 Content Publishing Approval

Publishing authority is Permission-driven. Content contribution does not automatically grant publication authority.

The model supports conceptual separation between:

- create/edit;
- review;
- publish/unpublish.

Exact Permission names and the staffing/Role matrix may be finalized during Admin/CMS implementation. This map locks the approval model, not a single staffing structure.

### 1.12 Trust / Testimonials / Results

The website may use legitimate trust-building Content such as:

- real testimonials;
- real outcomes/results;
- product screenshots;
- Team information;
- legitimate institutional relationships;
- real usage or product evidence where available.

Do not fabricate testimonials, Student results, statistics, user counts, success rates, or institutional claims. When real evidence does not exist, use honest alternative or empty Content rather than fake metrics.

### 1.13 Public Product Screenshots

Real product UI is a major trust and explanation mechanism. Preferred public evidence includes real Student UI, Counselor UI, Question Bank/Exam UI, and real analytics/product states when those surfaces exist.

Illustrative or 3D graphics may complement the website but should not replace showing the actual product.

### 1.14 Visual Role of the Website

The Public Website belongs to the same KonkourX design family as the applications, while using a more editorial and marketing-oriented presentation.

Compared with operational Student/Counselor applications, it may use:

- more vertical page rhythm;
- stronger storytelling;
- larger brand moments;
- hero composition;
- selected 3D illustration;
- product screenshots;
- editorial Content layouts.

It must not become sci-fi, gaming-like, aggressively neon, or visually disconnected from the applications.

[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and Product Owner-approved references for this specific surface remain the visual authority. Historical reference images must not be applied indiscriminately.

### 1.15 Light / Dark

The Public Website remains compatible with the approved KonkourX Light/Dark design direction. Exact public-page theme behavior may be decided during implementation.

### 1.16 Responsive Navigation

Public Website navigation differs from authenticated application navigation:

- desktop Public Website may use top/header navigation;
- mobile Public Website may use a hamburger/menu.

Do not impose the authenticated application's right-side sidebar on the public marketing website.

Authenticated application rules remain unchanged: desktop right-side sidebar and mobile right-side drawer. Public Website may use standard responsive marketing navigation.

### 1.17 Search

Future public search may cover public/indexable Content such as:

- Blog Articles;
- public Resources;
- public Course/Resource descriptions;
- selected Question Bank marketing or sample Content explicitly made public.

Private or Entitlement-protected Content must not become publicly accessible because search exists. Authenticated/private search belongs to the relevant product surface.

Public Search remains future/extensible unless specifically scheduled.

### 1.18 Public Support / Contact

The website provides clear public support/contact entry points. These may include:

- Contact page/form;
- support/help entry;
- public chat/support launcher where appropriate;
- FAQ;
- links into authenticated support/Ticket flows after login.

Public Contact and authenticated Ticket authorization remain separate. A visitor may initiate Contact, but privileged account actions require authentication and appropriate verification.

### 1.19 Counselor Collaboration Entry

Counselor collaboration remains secondary. The website may explain who can apply, collaboration benefits, expected information, and the application process.

The CTA is:

```text
درخواست همکاری مشاور
```

The application feeds the approval workflow defined in Section 0. The website must not imply instant Counselor account or Workspace activation.

### 1.20 School / Institute Entry

The website provides a dedicated explanation of School/Institute use. It may explain Student management, Counselor/staff structure, Question Bank, Exam Builder, printable Exams, reporting, Organization-specific Content, and future Class/video capabilities.

The CTA is:

```text
درخواست همکاری مدرسه / آموزشگاه
```

This feeds the approval-gated Organization application flow defined in Section 0. Future capabilities must not be presented as currently available unless [PROJECT_STATE.md](PROJECT_STATE.md) confirms implementation.

### 1.21 Auth Entry Points

The website clearly links to Student signup/login, Counselor login where approved, and relevant Organization/Admin login routes where applicable.

Public registration emphasis remains Student-first. The Public Website must not become a role-switching application shell.

### 1.22 Public vs Authenticated Boundary

The Public Website is public, marketing, and Content-facing. Authenticated operational work belongs to Student App, Counselor Workspace, Admin, and School Workspace where applicable.

Public pages may explain those products and deep-link into them. They must not duplicate the full operational UI of authenticated surfaces.

### 1.23 Content Linkability

Public pages and Resources should be individually linkable where appropriate, including Article URLs, public Resource pages, Product pages, Pricing, and School offering pages.

Individual linkability supports SEO, sharing, campaigns, and direct navigation. Exact URL schema remains implementation-stage detail.

### 1.24 Campaigns / Landing Pages

The website architecture supports future campaign and SEO landing pages without requiring a separate marketing system.

Authorized Content staff may eventually create or configure campaign-specific public pages using supported CMS components. Do not build a generic no-code website builder unless separately approved.

### 1.25 Analytics Boundary

Public Website may use product/marketing analytics to understand acquisition and conversion.

Marketing analytics must not:

- be fabricated for public display;
- redefine Student educational analytics;
- introduce an intrusive-surveillance requirement through this Product Map.

Exact analytics tooling/provider is a later technical/business choice.

### 1.26 Performance / Accessibility

The Public Website should be responsive, fast, accessible, readable in Persian RTL, usable on mobile, and search-engine friendly.

It follows the accessibility direction in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). Avoid tiny tap targets, poor contrast, usability-blocking animation, and excessive effects that damage performance.

### 1.27 Legal / Policy Surfaces

The website includes public surfaces for relevant Terms, Privacy, applicable commercial/payment policies, and other required user-facing policies.

Exact legal wording is outside Product Map scope and must not be invented here.

### 1.28 Future / Extensible

Future/extensible capabilities include:

- richer public Search;
- advanced personalization;
- advanced marketing automation;
- campaign builder;
- localized or expanded language versions;
- advanced public recommendation systems.

They remain in the product vision but are not current implementation authorization.

### 1.29 Anti-Drift Rules for Public Website

Implementation must not reduce the Public Website to:

- one static landing page;
- a brochure disconnected from Products/Plans;
- hardcoded Pricing;
- a generic template site;
- a duplicate authenticated application.

The Public Website remains:

```text
Brand
+ SEO
+ Content
+ Product Education
+ Pricing
+ Trust
+ Conversion
```

### 1.30 Decision Gates

The following Section 1 decisions are locked and are not open gates:

- Public Website is first-class, not a brochure;
- Student-first primary CTA;
- Counselor and School/Institute are secondary collaboration paths;
- Blog/SEO are core capabilities;
- Pricing consumes dynamic Business configuration;
- CMS manages ordinary public Content/configuration;
- real product UI/screenshots are important trust evidence;
- public and authenticated surfaces remain distinct;
- Public Search is future/extensible;
- fabricated testimonials, results, statistics, and analytics are prohibited.

Remaining Section 1 implementation-stage choices are limited to:

- exact page and route structure;
- exact CMS implementation;
- exact SEO rendering technology;
- exact public analytics provider;
- exact Public Search implementation;
- exact legal wording.

These choices are not product-behavior blockers until their affected implementation is scheduled.

## 2. Student Super App

### 2.1 Dashboard

The Student Super App is intended to become the Student's primary daily academic workspace. It progressively brings together planning, task execution, study tracking, exams, Question Bank, progress, counseling, communication, learning resources, and focus/tools. The Dashboard does not expose all of those capabilities at once. It is an action-first summary and launch surface centered on one question: **What should I do now?**

#### 2.1.1 Dashboard Purpose

The Dashboard must let the Student determine quickly:

- what they need to do now;
- what comes next;
- how today's plan is going;
- how they are progressing;
- whether an exam or other important academic event is approaching; and
- which important action they should take next.

Immediate academic action takes precedence over decorative analytics. The Dashboard is not a generic administration dashboard, analytics wall, table-heavy interface, collection of unrelated widgets, or motivational/gamification feed.

#### 2.1.2 Visual Source of Truth

For this surface, the Product Owner-approved Student Dashboard reference is a visual specification, not loose inspiration. Future implementation must converge closely toward its composition, hierarchy, information density, card structure, header and sidebar behavior, product polish, and Light/Dark quality.

Only references explicitly approved for the Student Dashboard govern this surface. Unrelated historical references from other surfaces must not be applied automatically. Detailed visual tokens remain governed by `docs/DESIGN_SYSTEM.md`.

#### 2.1.3 Desktop Application Shell

The Dashboard belongs inside the authenticated Student application shell. Its desktop direction is:

- RTL-first layout;
- the main application sidebar on the right;
- a purposeful top/header region;
- a content workspace; and
- canonical Light and Dark theme support.

The shell must feel like a polished Student product rather than a developer or administration template. Its major destinations conceptually include Dashboard, Planning, Exams, Learning/Lessons, Question Bank, Performance/Analytics, Counseling, and Messages. Settings and Logout may appear as lower or utilitarian destinations. Focus/Habits/Goals may later be a direct destination or live under a Tools grouping. Final labels and ordering may be refined during UI implementation without removing these intentional product families.

#### 2.1.4 Header

The Dashboard header should support:

- controlled KonkourX branding;
- a global/product search entry when that capability is available;
- notifications; and
- the Student profile/account entry.

It must not feel empty or like an unfinished placeholder. The distinctive KonkourX/X identity should remain visible without overpowering operational content.

#### 2.1.5 Personal Greeting / Hero

The Dashboard may include a personal greeting area with the Student's name, current date, brief contextual or motivational copy, and an optional restrained Student illustration. This is one of the limited surfaces where the approved 3D Student illustration language may appear.

The greeting/hero must not displace the current academic action or Today Plan. Decorative illustration is subordinate to daily utility.

#### 2.1.6 Today Plan Is the Highest Priority

The Student's current daily plan is the Dashboard's highest-priority content. The Today Plan area must make clear:

- the current task;
- the next task;
- today's real task count and progress;
- the overall state of today's plan; and
- a direct path to the full Today Plan.

A count such as `3 / 5 tasks` is appropriate only when derived from real plan state. When no plan or usable data exists, the Dashboard must show an honest, useful empty state.

#### 2.1.7 Current / Next Task

The current or next academic action must be prominent. Where the underlying task supports it, the Student should be able to understand its subject, title, planned time, current execution state, relevant Curriculum title, and relevant counselor instruction. The primary action may be Start, Continue, or View according to the real state.

The interaction should minimize the steps between opening the application and beginning or resuming study.

#### 2.1.8 Overall Progress

The Dashboard may provide a concise overall-progress summary derived from supported data such as plan execution, subject progress, Curriculum coverage, or study/execution records. It must not invent an arbitrary overall percentage when the product does not have a valid calculation for it.

When sufficient data or calculation logic is unavailable, the surface must show a meaningful incomplete or empty state rather than simulated precision.

#### 2.1.9 Subject Snapshot

A concise subject-level snapshot may show real high-level signals such as recent activity, progress or coverage, relevant task state, or an exam-related signal. It remains an orientation summary. Deep subject analysis belongs to Section 2.5, Progress & Analytics, and must not be duplicated in Dashboard cards.

#### 2.1.10 Weekly Study Snapshot

The Dashboard should support a compact weekly study view using real data, such as daily study time, planned-versus-actual study where meaningful, and a weekly trend. Its purpose is quick orientation. Detailed history and exploration belong in Study & Performance and Progress & Analytics.

#### 2.1.11 Upcoming Exam

When one exists, the Dashboard should surface the most relevant upcoming exam or academic event. Useful information may include its title, date/time, real status, and a direct View or relevant action.

The Dashboard must not display fictional upcoming exams. When no upcoming exam exists, it must use an honest no-exam state rather than placeholder data.

#### 2.1.12 Quick Actions

The Dashboard may provide a small set of high-value actions, for example:

- Continue Study;
- Take or Create an Exam when supported and entitled;
- Open Question Bank when entitled; and
- open Counseling or contact an assigned counselor where applicable.

Quick actions must correspond to real capabilities and the Student's Effective Access. A paid or locked capability may use an appropriate discovery or upgrade state, but it must never behave as if access has already been granted.

#### 2.1.13 Personalized Recommendations

`APPROVED FUTURE STATE`: Personalized Dashboard recommendations are extensible future capability. They may eventually include a relevant article, video/resource, practice collection, study recommendation, or Curriculum-related suggestion.

Recommendations must be grounded in real data. Generic or random content must not be presented as personalized, and the interface must not fabricate intelligence. Advanced intelligent recommendations remain future until explicitly scheduled for implementation.

#### 2.1.14 Dashboard Data Honesty

**Hard rule: no fake analytics or activity data.** The Dashboard must not fabricate percentages, streaks, study hours, task completion, exam scores, recommendations, or performance trends for visual completeness.

Missing data requires a designed, honest state, such as No plan yet, No exam scheduled, Start your first study session, or No weekly data available yet. Empty state is preferable to fake product data.

#### 2.1.15 Dashboard vs. Detail Pages

The Dashboard is a summary-and-action surface that deep-links into specialized areas:

- Today Plan leads to Planning;
- weekly study leads to Study & Performance;
- subject progress leads to Progress & Analytics;
- an upcoming exam leads to Exams; and
- a message leads to Communication.

Dashboard cards must not reproduce complete specialized workflows.

#### 2.1.16 Student Dashboard Density

The Student interface is calmer than Counselor and Admin interfaces, but calm does not mean oversized empty cards, excessive whitespace, huge controls, or one piece of information per screen. The Dashboard should use balanced card density, strong hierarchy, compact actionable information, clear spacing, and intentional grouping. It must not drift into a generic SaaS-dashboard appearance.

#### 2.1.17 Light Mode

The Dashboard supports the canonical KonkourX Light theme: a light neutral canvas, white or elevated surfaces, restrained brand accents, readable dark text, controlled borders/shadows, and primary blue actions. It must not introduce a separate Dashboard theme. Exact tokens remain governed by `docs/DESIGN_SYSTEM.md`.

#### 2.1.18 Dark Mode

The Dashboard also supports the canonical KonkourX Dark theme. Dark mode must preserve surface hierarchy, readability, subtle elevation, and controlled blue/violet/cyan brand presence. It must not become uniformly black, completely flat, neon-heavy, gaming-like, or science-fiction styled. Light and Dark modes must feel like the same product.

#### 2.1.19 Mobile Dashboard

Mobile Student navigation uses a hamburger and a drawer that opens from the right. It does not use a main bottom-navigation replacement. Mobile must not merely compress the desktop grid into unreadable columns.

The preferred mobile priority is:

1. header and hamburger;
2. greeting and date;
3. current or next task;
4. Today Plan;
5. Quick Actions;
6. overall and subject progress;
7. Upcoming Exam;
8. Weekly Study; and
9. recommendations when real and available.

Exact card grouping may evolve, but the action priority must remain intact.

#### 2.1.20 Mobile Density

Mobile cards should support fast scanning, useful information above the fold, clear touch targets, compact but readable content, and progressive detail. Excessively tall cards and excessive scrolling for basic daily orientation must be avoided.

#### 2.1.21 Responsive Behavior

Desktop and mobile preserve the same product priorities but need not use identical layouts. Responsive implementation may reorder cards, collapse secondary information, transform desktop structures into stacked summaries, and use drawers or sheets where appropriate. Desktop geometry must not be forced onto small screens.

#### 2.1.22 Accessibility

Accessibility is part of the Dashboard requirement, not a deferred polish pass. The surface must follow the established accessibility direction, including:

- readable contrast;
- visible focus;
- approximately 44px usable touch targets where appropriate;
- status communication that does not rely on color alone;
- correct RTL behavior;
- usable keyboard and focus behavior where relevant; and
- understandable labels.

#### 2.1.23 Entitlement-Aware Dashboard

The Dashboard may reference a capability the Student does not currently own, but it must respect Effective Access as defined in Section 0. For example, Question Bank may appear in an appropriate discovery or upgrade state while unauthorized use remains blocked.

Access behavior must derive from Entitlements and other effective-access sources, not from hardcoded commercial plan names.

#### 2.1.24 Counselor Relationship on Dashboard

When the Student has an assigned counselor, the Dashboard may surface relevant counselor context such as a counselor action, new message, task or instruction context, or upcoming session. This remains a concise entry point; deep communication belongs in Messages/Counseling.

Students without an assigned counselor must receive an appropriate product state rather than broken or fabricated counselor UI.

#### 2.1.25 Notifications

The Dashboard header and experience may expose important notifications as visible, actionable items that deep-link to the relevant product context. Notification behavior and operations belong to Section 5.2; this section preserves only the Student Dashboard expectation.

#### 2.1.26 Search

A global/product search entry may exist in the Student shell or header. Its exact scope and implementation are not locked by this Dashboard milestone. It may later span appropriate authenticated entities or content subject to access rules, but this section does not authorize or define universal search behavior.

#### 2.1.27 Empty States

Important Dashboard areas require useful empty states that explain the real situation and help the Student move forward when an appropriate action exists. At minimum, the design direction must account for:

- no Today Plan: explain that no plan exists and provide an appropriate next action if one is available;
- no upcoming exam: state that no exam is scheduled;
- no study history: invite the first study action; and
- no counselor: show the correct unassigned state without inventing an assignment.

#### 2.1.28 Error / Loading States

The Dashboard must eventually provide intentional loading, partial-loading, error, retry, and unavailable-data states rather than blank pages. Exact skeletons and loading treatments are UI-stage details.

#### 2.1.29 3D / Illustration Boundary

The approved Student illustration/3D language may be used selectively in the Dashboard greeting or banner and on landing, login, or onboarding surfaces. Decorative characters must not spread across every task, study, or analytics card. Operational academic content remains primary.

#### 2.1.30 Dashboard Anti-Drift Rules

Future implementation must not reduce the Student Dashboard to generic SaaS metric cards, fake analytics, a decorative illustration page, an administration-style dense table screen, an oversized mobile card stack, or a page disconnected from Today Plan.

The canonical priority is:

**Current / Next Action -> Today Plan -> Useful Progress -> Upcoming Academic Context -> Supporting Actions**

#### 2.1.31 Current vs. Future

`APPROVED FUTURE STATE — CORE DASHBOARD DIRECTION`:

- authenticated shell and navigation;
- prominent current or next task;
- Today Plan;
- real progress summaries;
- compact weekly study snapshot;
- upcoming exam or academic event;
- entitlement-aware Quick Actions; and
- notification and profile entry.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- advanced personalized recommendations;
- sophisticated recommendation ranking;
- richer predictive insights; and
- additional intelligent summaries.

These statements preserve approved product direction; they do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities require explicit milestone authorization.

#### 2.1.32 Decision Gates

The following product decisions are locked:

- Dashboard is action-first, with Today Plan as its highest priority;
- current or next task is prominent;
- all displayed data is real and fake analytics are prohibited;
- the Student interface is calmer than Counselor/Admin while remaining information-efficient;
- the desktop application sidebar is on the right;
- mobile navigation uses a hamburger and right-side drawer, with no main bottom navigation;
- canonical Light/Dark support is required;
- selected 3D illustration is allowed on the Dashboard within the stated boundary;
- deep workflows belong in specialized pages; and
- the approved Student Dashboard reference governs this surface.

Remaining implementation-stage choices are limited to:

- exact card dimensions and layout;
- exact final sidebar label ordering;
- exact global search scope;
- exact empty-state copy;
- the exact recommendation algorithm if and when future recommendation work is approved; and
- the chart library and exact chart rendering.

These choices are not unresolved core product behavior and do not authorize implementation outside an approved milestone.

### 2.2 Planning & Execution

Planning & Execution is the Student's core daily operating system. It must answer what is planned today, what is happening now, what comes next, what was actually completed, which Curriculum items were covered, how long execution really took, how well it was executed, and what remains unfinished.

The product must always distinguish **PLAN** from **EXECUTION / REPORT**. Planned intent and actual outcome are both meaningful records; the Student must never be led to confuse what was scheduled with what actually happened.

#### 2.2.1 Planning Model

The canonical precise planning model is a 24-hour day, with each hour divided into four 15-minute segments: 96 visual slots per day. For example, `15:45 -> 17:00` is 75 minutes, or five 15-minute segments.

The Student v1 use of this model is a read-only daily timeline derived from existing Task start/end times. It is not 96 database entities and is not a drag/drop scheduler. The timeline is not draggable, resizable, clickable for editing, or used to create or move Tasks. Date-only Tasks without a precise time appear separately, such as under `کارهای بدون ساعت`, and are never assigned an artificial timeline position.

#### 2.2.2 Mini-Box Boundary

A 15-minute mini-box is a time-grid and UI concept, not a separate user-facing domain object. The product must not introduce a MiniBox entity, workflow, or completion system. The meaningful product object remains the Task.

#### 2.2.3 Task Origins

Student planning supports distinct Task origins:

1. Counselor-created academic Tasks;
2. Student-created personal academic Tasks; and
3. Student-created non-academic/freeform life blocks.

The interface must preserve origin clearly because these categories do not have identical editing authority or reporting needs.

#### 2.2.4 Counselor-Created Tasks

A Counselor-created academic Task belongs to the counselor-managed plan. The Student may view, start, continue, and execute it; record applicable Curriculum coverage; submit its execution report; and add permitted report or execution notes.

The Student may not freely modify Counselor Curriculum targets, instructional intent, controlled planning structure, or Task content as though it were a personal Task. A future request or rescheduling workflow may be approved separately, but submission or execution authority does not grant free editing authority.

#### 2.2.5 Student Personal Academic Tasks

The Student may create personal academic Tasks such as personal review, a self-planned study block, or other self-directed academic work. These Tasks may link to one or more official Curriculum nodes through the same canonical Curriculum reference system.

The product must not create a separate personal-topic taxonomy. Canonical Curriculum remains the shared academic reference.

#### 2.2.6 Non-Academic / Freeform Blocks

The Student may create freeform non-academic blocks such as ورزش, دکتر, مهمانی, رفت‌وآمد, or کار شخصی so the plan can represent a realistic day.

These blocks must not pollute Curriculum and do not require fabricated Curriculum mapping. Their execution or reporting may be simpler than the academic Task flow.

#### 2.2.7 Precise Scheduling

A Task may have a calendar date and paired exact start and end times. Exact scheduling aligns to 15-minute boundaries such as `15:45`, `16:00`, `16:15`, and `16:30`.

A scheduled Task window must conceptually have paired start/end values, `start < end`, positive duration, a valid daily range, and no cross-midnight window. Legacy or date-only Tasks may exist without exact time; the product must not fabricate exact times for historical Tasks that never had them.

#### 2.2.8 Today Plan

Today Plan is the Student's primary daily execution surface. It should communicate the current date, current and next Tasks, today's Task count, daily execution progress, planned time, actual time where available, incomplete or partial work, and direct Start or Continue actions.

Its purpose is operational clarity: the Student should not need to inspect multiple pages to know what to do now.

#### 2.2.9 Current Task Card

The active or current Task should be prominent and use progressive disclosure. Before execution, it shows the Task identity, relevant Curriculum context, scheduled time, and the primary Start action. During execution, it prioritizes active state, elapsed time, and Finish. After execution, it reveals only the applicable closure inputs—Curriculum coverage, one Task-level Quality Score, and optional Note—followed by the final submit action. The page must not expose every control and form simultaneously.

Where supported by the Task, the presentation may show:

- subject and Task title;
- exact planned time and planned duration;
- relevant Curriculum title or titles;
- Counselor instruction;
- execution state;
- progress or coverage state; and
- a Start or Continue action.

Internal implementation data that does not help execution must not be exposed.

#### 2.2.10 Today Timeline

Today Plan should provide the read-only 24×4 daily timeline described above, showing timed Tasks, gaps or free time, overlaps if applicable, and completed, partial, or skipped states. Date-only Tasks remain in a separate untimed area. The Student must not navigate or manipulate 96 raw mini-boxes.

#### 2.2.11 Task Origin Visibility

Task provenance must remain understandable through a restrained badge, label, icon, or equivalent visual treatment. The Student should be able to distinguish Counselor, Personal, and Non-academic origins. Exact presentation is an implementation-stage visual choice.

#### 2.2.12 Curriculum Targeting

An academic Task may target **one or multiple** canonical Curriculum references. Multiple Curriculum targets per Task are explicitly supported; the model must not be simplified to `one Task = one topic`.

Curriculum selection appears only inside authorized `STUDY` Task create/edit flows. The normal `/curriculum` route is a browse-only explorer and is not a Task Picker.

#### 2.2.13 Tri-State Recursive Study Task Picker

The approved Picker is one tri-state checkbox tree:

- unchecked means no selectable item in the branch is selected;
- checked means the complete selectable subtree is selected; and
- indeterminate/minus means only part of the subtree is selected.

Checking a parent selects its complete selectable subtree recursively, including descendants not loaded by the lazy/paginated client. Child changes update every ancestor. Search results and the tree share the same selection state. Multiple selection is inherent in checkboxes; there is no separate single/multiple mode and no user-facing `دامنه`, `دقیق`, `با زیرمبحث`, `EXACT`, `WHOLE`, or `فرزندان مستقیم` terminology.

Navigation-only wrappers may provide useful bulk checkbox behavior but must never silently become invalid persisted Task targets.

#### 2.2.14 Historical WHOLE and Recursive Subtree Contract

Existing saved `WHOLE` targets retain their historical direct-child meaning. They must not be reinterpreted as recursive, silently migrated, or converted by an unrelated edit.

The approved future internal contract adds `SUBTREE` without changing `WHOLE`. A compact, versioned selection expression sends canonical roots; the server validates the Student's authoritative track, recursively resolves terminal selectable nodes, and atomically saves both normalized selector intent and immutable item snapshots. Navigation wrappers expand to valid child-node selectors and are never persisted as Task targets. The current 50-target rule remains a normalized selector-root ceiling, while resolved items require a separately capacity-tested server bound before implementation. Exact architecture and legacy-edit rules are governed by [2026-10-07-planning-curriculum-interaction-design.md](superpowers/specs/2026-10-07-planning-curriculum-interaction-design.md).

#### 2.2.15 Overlapping / Duplicate Targets

Planning must avoid invalid duplicate or overlapping Curriculum selections that would make execution coverage ambiguous. Exact validation mechanics belong to implementation design, but coverage for a single Task must remain deterministic and understandable.

#### 2.2.16 Task Plan Immutability After Execution

Once meaningful execution begins, the original planned academic target must not be silently rewritten. After execution begins or a Task reaches a terminal state, Counselor-controlled Curriculum targets and planning data become historically protected.

Later changes must not make it appear that the Student was originally assigned different work.

#### 2.2.17 Plan vs. Execution Data

The product preserves both planned and actual execution data. For example:

- planned: 75 minutes and Curriculum targets A + B;
- actual: 60 minutes, all targets completed, and Quality Score 5/5.

Actual duration must not overwrite planned duration. Planned intent and actual outcome remain independently meaningful.

#### 2.2.18 Task Execution States

The canonical academic content outcome has exactly three states:

- `COMPLETED` — کاملاً خوانده شد / fully completed;
- `PARTIAL` — بخشی خوانده شد / partially completed;
- `SKIPPED` — نخوانده‌ام / not completed.

These states describe content execution. They are not inferred automatically from elapsed time.

#### 2.2.19 COMPLETED

`COMPLETED` means the planned academic content was fully read, completed, or executed. A Task planned for 75 minutes may be completed in 60 minutes or 95 minutes and still be `COMPLETED` when all planned content was completed.

Time variance is an analytical signal; it is not the definition of completion.

#### 2.2.20 PARTIAL

`PARTIAL` is a terminal execution result. It means the Student performed the Task but completed only part of its planned academic content. The Student must be able to identify exactly which planned Curriculum execution items were completed, leaving unfinished items identifiable.

#### 2.2.21 PARTIAL Coverage

For a `PARTIAL` Task, the product presents the planned execution items as a clear checklist or equivalent interaction. The Student marks completed items, and unfinished items remain unmarked and preserved.

`PARTIAL` must not be reduced to an arbitrary percentage such as `50%` without item-level Curriculum evidence.

#### 2.2.22 SKIPPED

`SKIPPED` means the planned academic work was not completed. The product may capture a skip reason according to approved UX and business rules, but this milestone does not invent a skip-reason taxonomy.

Time variance alone must never turn a Task into `SKIPPED`. Any already-established implementation behavior is preserved without expanding it into new product policy.

#### 2.2.23 Task Report — Final Locked Fields

The academic Task report is intentionally simple. Its canonical fields are:

1. Status;
2. Coverage when relevant, especially for `PARTIAL`;
3. Actual Time;
4. one Quality Score from 1–5; and
5. an optional Note.

No additional required rating dimensions belong in Task closure.

#### 2.2.24 One Quality Score Only

There is exactly one Task-level 1–5 rating: **Quality Score / کیفیت اجرا**.

The closure report must not add separate Mastery/تسلط, Satisfaction/رضایت, Focus, or Confidence scores. A future Mastery capability is a separate analytical/product system and must not be conflated with Task Quality Score.

#### 2.2.25 Quality Score Semantics

Quality Score is the Student's simple, self-reported overall quality of execution on a 1–5 scale. This Product Map does not introduce multiple subdimensions or a complex rubric. Exact label and help copy may be refined during implementation.

#### 2.2.26 Actual Time

Actual Time is independent from Status. A Task completed faster or slower than planned can still be `COMPLETED`; a `PARTIAL` Task may contain substantial actual time; and a `SKIPPED` Task may have little or no execution time according to actual product behavior.

Actual Time supports study history, planned-versus-actual analysis, Counselor understanding, and future analytics. It does not define content completion.

#### 2.2.27 Optional Note

The Student may optionally add a short execution note, for example مشکل در بخشی از مبحث, نیاز به مرور, or an explanation of how the Task went. The Note is optional and must not turn every study closure into a long reporting exercise.

#### 2.2.28 Close / Submit Report

When the Student selects `ثبت گزارش و پایان` or an equivalent final action, the execution report is finalized. After finalization:

- execution state becomes historical/read-only;
- original planning state remains preserved;
- actual report data remains preserved; and
- Curriculum coverage remains preserved.

Completed historical reports must not be silently mutated.

#### 2.2.29 Next Task After Closure

After closure, the product should confirm successful report submission, surface or highlight the next relevant Task, and provide a direct path to continue the day. The reporting flow should not end on a dead-end completion screen.

#### 2.2.30 No Automatic Compensatory Task

`PARTIAL` or `SKIPPED` must **not** automatically create or schedule a compensatory Task. The system may expose unfinished work. The Counselor may later decide whether compensation is necessary, when it should occur, which remaining Curriculum items it includes, and how much time to allocate.

#### 2.2.31 Remaining Work Visibility

For `PARTIAL` or `SKIPPED` academic work, unfinished Curriculum items and state remain visible for Counselor follow-up and possible later compensatory planning. The product must not lose the remainder.

#### 2.2.32 History

The Student should be able to inspect read-oriented historical execution. History may include the Task title, date, planned time, actual time, status, Curriculum coverage, Quality Score, optional Note, and origin where useful. Deep analysis belongs to Sections 2.3 and 2.5.

#### 2.2.33 Weekly Plan

The Student should have a Weekly Plan view that answers what is planned across the week, how much is scheduled each day, what was actually executed, and where incomplete work remains. The Student should be able to move between weeks.

#### 2.2.34 Weekly Summary

The weekly overview may show real total planned time, total actual time, total Task count, and completed, partial, and skipped counts. Each day may show its completion state, planned-versus-actual time, Task count, and unfinished work. No weekly metric may be fabricated.

#### 2.2.35 Weekly Desktop UX

Desktop Weekly Plan may use a structured seven-day planning or timeline view. It should be operationally useful without rendering 96 raw mini-boxes per day. Tasks and their schedule—not the underlying slot implementation—are the visual focus.

#### 2.2.36 Weekly Mobile UX

Mobile must not compress the full seven-column desktop weekly grid into an unreadable table. The preferred direction is day-by-day summaries, expandable or collapsible days, compact Task lists, and clear daily totals and status. Selecting a day may focus or open its corresponding Today Plan.

#### 2.2.37 Weekly Unfinished / Follow-Up Area

Weekly Plan should make incomplete work visible. A follow-up area such as `نیاز به پیگیری` may surface `PARTIAL` Tasks, `SKIPPED` Tasks, and unfinished Curriculum items. This is visibility for follow-up, not automatic rescheduling.

#### 2.2.38 Planned vs. Actual

Planning surfaces may compare Planned Time with Actual Time—for example, planned `6h 15m` versus actual `5h 32m`. This is a descriptive time-management signal, not a punitive judgment. The difference alone must not be interpreted as academic success or failure.

#### 2.2.39 Student Edit Authority

Editing authority depends on Task origin:

- a personal academic Task may be appropriately editable by the Student before execution;
- a non-academic/freeform block may be managed through its simpler workflow; and
- a Counselor Task cannot be freely rewritten by the Student.

Historical-integrity protections become stronger after meaningful execution begins.

#### 2.2.40 Rescheduling Boundary

The product may later support a Student request for rescheduling or an explanation, but the Student must not silently drag or move Counselor-controlled Tasks as if they owned the Counselor plan. A future request-change workflow is distinct from direct editing; its full behavior is not defined here.

#### 2.2.41 Execution Start

A Task may support lifecycle actions such as Start, Continue, Finish/Report, and Pause/Resume where relevant. Exact timers and pause mechanics belong to Focus/Study implementation detail.

The locked rule for this section is that once meaningful execution begins, planning targets must not be silently rewritten.

#### 2.2.42 Non-Academic Execution

Non-academic/freeform Tasks do not require academic Curriculum reporting and may use a simpler completion flow. Curriculum Coverage, academic Quality semantics, and question or exam behavior must not be forced onto a doctor appointment, gym block, commute, or personal event. Exact simplified reporting remains an implementation-stage choice.

#### 2.2.43 Counselor Instruction

Counselor Tasks may contain Counselor instructions, which should remain visible during planning and execution. A Student report Note is distinct from a Counselor instruction; neither may overwrite the other.

#### 2.2.44 Task Content vs. Curriculum Targets

A Task may contain both human-readable content or instruction and structured Curriculum targets. They serve different purposes. For example, an instruction such as `گفتار را بخوان و تست‌های مشخص‌شده را مرور کن` may accompany structured Curriculum Node A and Curriculum Node B.

Instructional language must not be forced into Curriculum structure.

#### 2.2.45 Data Honesty

The planning experience must not fabricate completed Tasks, actual time, Curriculum coverage, Quality Score, Counselor instructions, or weekly totals for visual completeness. Missing data requires honest states.

#### 2.2.46 Empty States

Planning surfaces must account for useful first-use and empty states:

- no plan today: state that no Task is scheduled and provide an appropriate action when the product state permits one;
- no Counselor: do not fabricate Counselor-created Tasks;
- no Curriculum target: do not invent one; and
- no historical execution: show an honest first-use state.

#### 2.2.47 Error / Loading States

Planning and execution surfaces should provide intentional loading, error, and retry behavior. A partial failure must not make it appear that a Task disappeared or was completed. Exact technical treatment is not defined here.

#### 2.2.48 Accessibility / Status Clarity

Execution status must not be communicated through color alone. `COMPLETED`, `PARTIAL`, and `SKIPPED` require clear labels, icons, text, or an equivalent accessible combination.

Planning must preserve RTL correctness, readable contrast, usable touch targets, clear focus behavior, and mobile usability.

#### 2.2.49 Visual Status Direction

Controlled semantic differentiation may distinguish Task origin—Counselor, Personal, or Non-academic—and execution state—Completed, Partial, or Skipped. The treatment must remain restrained rather than turning the planner into a rainbow of categories. Exact colors remain governed by `docs/DESIGN_SYSTEM.md`.

#### 2.2.50 Planning Anti-Drift Rules

Future implementation must not reduce Planning & Execution to a generic checklist, one-topic-per-Task model, time-only completion system, automatic compensatory scheduler, Student-editable Counselor plan, 96-box Student UI, multiple Task-level rating systems, Curriculum-free academic planner, or destructively editable history.

The canonical model is:

**Precise Plan + Canonical Curriculum Targets + Simple Execution + Exact Coverage + Actual Time + ONE Quality Score /5 + Optional Note + Historical Integrity**

#### 2.2.51 Current vs. Future

`APPROVED FUTURE STATE — CORE PLANNING & EXECUTION DIRECTION`:

- Today Plan and Weekly Plan;
- exact scheduling and distinct Task origins;
- origin-based Counselor versus Student editing authority;
- one or multiple Curriculum targets selected through the tri-state recursive Study Task Picker, with historical `EXACT`/`WHOLE` meaning preserved for existing Tasks;
- `COMPLETED` / `PARTIAL` / `SKIPPED` outcomes;
- item-level `PARTIAL` Coverage;
- Actual Time, one Quality Score /5, and optional Note;
- read-oriented history and remaining-work visibility; and
- no automatic compensation.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- a Student reschedule-request workflow;
- more advanced personal-planning helpers;
- richer planner automation;
- advanced schedule optimization; and
- additional productivity tooling.

These statements preserve approved product direction and do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`; future capabilities still require explicit milestone authorization.

#### 2.2.52 Decision Gates

The following product decisions are closed:

- the 24 × 4 precise planning foundation, without a raw 96-box Student UX;
- Counselor, Personal, and Non-academic Task origins;
- one or multiple Curriculum targets per academic Task;
- the separate browse-only `/curriculum` surface and authorized Study Task Picker;
- tri-state recursive checkbox behavior with shared search/tree selection state;
- preservation of historical direct-child `WHOLE` meaning;
- no free Student editing of Counselor Task targets;
- execution and historical immutability;
- exactly three academic content outcomes: `COMPLETED`, `PARTIAL`, and `SKIPPED`;
- item-level Curriculum Coverage for `PARTIAL`;
- content—not elapsed time—determines completion;
- exactly one Task-level Quality Score /5;
- an optional Note;
- no separate Task-level Mastery or Satisfaction ratings;
- no automatic compensatory Task;
- unfinished work remains visible; and
- Weekly mobile is not a compressed seven-column grid.

Remaining implementation-stage choices are limited to:

- exact visual styling of the read-only Today timeline;
- exact simplified non-academic reporting;
- exact Student reschedule-request workflow;
- exact skip-reason UX or taxonomy where not already governed elsewhere;
- exact loading and empty-state copy.

The recursive-subtree persistence/resolution architecture Decision Gate is closed. Implementation remains separately milestone-gated and must follow the approved versioned expression, server-authoritative terminal resolution, immutable intent/item snapshots, capacity validation, wrapper normalization, and historical `WHOLE` preservation contract.

These choices do not reopen closed decisions and do not authorize implementation outside an approved milestone.

### 2.3 Study & Performance

Study & Performance explains what the Student actually studied, how long it actually took, which Subject or Curriculum area was involved, whether the activity was planned or extra, what Quality was reported, how actual study compares with the plan, and how study behavior changes over time.

This section governs **Study execution history and Study-level performance**. It does not govern Exam Performance. Study and Exam data may later be correlated without merging their source records, meanings, or lifecycles.

#### 2.3.1 Two Study Sources

Canonical Study history has two main sources:

1. **Task-derived Study**, produced from actual execution of an academic Task; and
2. **Free / Extra Study**, recorded when the Student studies outside a planned Task.

The two sources must remain distinguishable.

#### 2.3.2 Task-Derived Study

When an academic Task is executed and reported, its real execution data contributes to Study history. For example, a Physics—Motion Task planned for 75 minutes but completed in 62 minutes with `COMPLETED` status and Quality 4/5 should be usable as Study history without requiring the Student to enter the same activity again.

Duplicate manual logging after ordinary Task reporting must be avoided.

#### 2.3.3 Task Report Remains Authoritative

For Task-derived Study, the finalized Task execution report remains the authoritative execution source. Study history may present that data, but it must not silently create a conflicting second truth.

Editing a Study-history presentation must not rewrite historical Task execution unless a future workflow explicitly designs and authorizes that behavior.

#### 2.3.4 Free / Extra Study

The Student may record academic study that occurred outside a planned Task, including extra review, spontaneous practice, additional reading, study outside the Counselor plan, or independent revision.

Free / Extra Study preserves this actual activity without requiring creation of a fake planned Task.

#### 2.3.5 Free Study Core Information

A lightweight Free Study record may conceptually include:

- Subject;
- one or more Curriculum references where genuinely applicable;
- Actual Time or duration;
- Quality Score /5;
- an optional Note; and
- date/time context as needed.

Free Study logging must not become a long reporting form.

#### 2.3.6 Curriculum Linking

Academic Study uses the canonical shared Curriculum where appropriate. A Free Study activity may link to one or more relevant Curriculum references when it genuinely covered them.

The product must not introduce a separate Study-topic taxonomy. Exact Curriculum-selection UX remains an implementation-stage choice.

#### 2.3.7 No Fake Curriculum

When a Study activity is not meaningfully mapped to Curriculum, the product must not invent a false relationship. Honest unlinked data is preferable to fabricated academic structure.

#### 2.3.8 Study History

The Student should have a Study History or Timeline that helps answer what was actually studied. Useful historical information may include:

- date/time;
- Subject;
- Curriculum topic or topics;
- source: Task or Free Study;
- actual duration;
- Task Status where applicable;
- Quality /5;
- optional Note; and
- plan relationship where relevant.

#### 2.3.9 History Filters

Study history should support useful filtering. Conceptual filters may include Today, Week, Month, a later custom period, Subject, Curriculum, and source. Source filtering may distinguish Counselor-planned Tasks, Student Personal Academic Tasks, and Free Study.

Exact filter controls and layout are implementation-stage details.

#### 2.3.10 Study Source Clarity

The Student must be able to distinguish Counselor-planned study, Personal planned study, and Free / Extra Study. Records must not be presented as though they all originated from the same planning source because provenance is meaningful for later analysis.

#### 2.3.11 Planned vs. Actual

Planned-versus-Actual is a core Study-performance concept. A daily summary may show, for example, planned `6h 15m` and actual `5h 32m`.

This comparison describes execution and time behavior. It does not determine whether individual academic Tasks were completed; Task Status remains content-based as locked in Section 2.2.

#### 2.3.12 Time Variance Is Analytical

Time difference is analytics, not completion semantics. A Task planned for 75 minutes and actually completed in 60 minutes remains `COMPLETED` when its planned content was fully completed. Study history may show both values without treating the Student as incomplete.

#### 2.3.13 Actual Study Time

Actual Study Time must come from real execution data, not from planned duration. If an activity was planned for 90 minutes but actually lasted 55 minutes, its Actual Study Time is 55 minutes.

#### 2.3.14 Daily Study Summary

A concise daily Study summary may show real values such as:

- Actual Study Time;
- planned academic time;
- number of academic activities;
- completed, partial, and skipped Task counts;
- Free Study contribution; and
- average Quality when sufficient data exists.

The product must not add meaningless metrics merely to fill summary cards.

#### 2.3.15 Weekly Study Summary

A weekly Study summary may include total Actual Study Time, planned-versus-actual time, daily Study distribution, Study activity count, Subject distribution, and Quality trend where meaningful. It should remain understandable rather than becoming an analytics wall.

#### 2.3.16 Monthly / Longer History

Study history remains extensible toward month, multi-month, and full academic-period views. Detailed long-term analysis belongs primarily to Section 2.5; this section preserves the Study-history foundation needed for it.

#### 2.3.17 Subject Performance

The Student should be able to view Study activity summarized by Subject. A real-data summary could show, for example:

- Physics: `4h 10m`, five Study activities, average Quality 3.4/5;
- Biology: `6h 20m`, eight Study activities, average Quality 4.2/5.

Every displayed value must be derived from real Study data.

#### 2.3.18 Subject Detail

Opening a Subject may provide Study-oriented detail such as Study Time, Study activities, Curriculum areas studied, last Study, Quality history, and incomplete related Tasks. It must not duplicate the complete Progress & Analytics product.

#### 2.3.19 Curriculum-Level Study History

For Curriculum-linked Study, the product should be able to answer:

- when the topic was studied;
- how many Study activities covered it;
- how much real Study Time is associated with it;
- what Quality was reported; and
- which related Tasks were partial or incomplete.

This history supports later progress and analytics without redefining Curriculum.

#### 2.3.20 Quality Score

Study uses the same simple 1–5 Quality concept where applicable. Task-derived Study uses the finalized Task Quality Score; Free Study may record a simple Quality /5.

The product must not create a competing Study-quality rating.

#### 2.3.21 No Extra Task-Level Ratings

Focus, Mastery, Satisfaction, and Confidence scores must not be introduced as mandatory Study- or Task-level reporting dimensions. The locked simplification remains **one Quality Score /5**. Any future specialized system must remain separate and requires explicit approval.

#### 2.3.22 Quality Is Self-Reported

Quality represents the Student's self-reported execution quality. It is not automatically equivalent to an Exam score, Mastery, Curriculum completion, or objective academic proficiency and must not be presented as any of them.

#### 2.3.23 Study Performance vs. Exam Performance

The conceptual boundary is:

- **Study Performance** = time + execution + coverage + Quality + history;
- **Exam Performance** = answers + correct/wrong/unanswered outcomes + percentages or scores + question-level outcomes + assessment analysis.

The domains may later be combined in Analytics, but they must not be conflated or stored as though they express the same event.

#### 2.3.24 Study + Exam Future Correlation

Future Analytics may identify patterns such as repeated Study of a topic alongside weak Exam Performance, or low Study Time alongside strong Exam Performance. That correlation belongs mainly to Section 2.5.

Section 2.3 preserves trustworthy Study data that can support such analysis later; it does not itself authorize advanced correlation behavior.

#### 2.3.25 Trend View

Study & Performance may show simple, useful trends such as daily Study Time, weekly Study Time, planned-versus-actual time, average Quality, and Task execution distribution. Their purpose is orientation, not decorative charting.

#### 2.3.26 Trend Comparison

Where both periods contain sufficient real data and the calculation is mathematically valid, the product may show a comparison such as `This week's Study Time is 8% higher than last week.` Trend statements must never be fabricated.

#### 2.3.27 No Punitive Framing

Study analytics should be descriptive and helpful rather than punitive. Neutral wording such as `Actual Study Time was lower than planned` is preferred over judgmental language such as `You failed your Study target.` Exact copy remains a UX-stage detail.

#### 2.3.28 Source-Based Analysis

Where useful, Study summaries may distinguish Counselor plan execution, Student Personal plan execution, and Free Study. Source context must not be collapsed into one ambiguous total when that distinction is material to understanding Study behavior.

#### 2.3.29 Double-Counting Prevention

The same academic execution must not be counted twice. A 60-minute Task execution that contributes 60 minutes to Study history must not also become a duplicate 60-minute manual Study entry unless the Student genuinely performed an additional, separate activity.

Study totals must remain trustworthy.

#### 2.3.30 Editing Free Study

The Student may reasonably need to correct a Free Study record. Exact edit and delete policy remains an implementation-stage choice. Any Free Study correction must remain within that source and must not silently modify Counselor Task execution history.

#### 2.3.31 Task-Derived History Integrity

Finalized Task-derived Study data inherits the historical-integrity rules in Section 2.2. A Study-history surface must not provide a route around Task report immutability.

#### 2.3.32 Notes

A Study Note remains optional. It may preserve context such as a difficulty encountered, need to review, what was studied, or another contextual observation. Narrative journaling must not be required after every Study activity.

#### 2.3.33 Empty States

Useful honest Study states include No Study history yet, No Study recorded today, No data for this Subject, and No Curriculum-linked Study yet. The surface may provide an appropriate next action where useful, but real-user charts must not be filled with fake sample values.

#### 2.3.34 Loading / Error States

Study history and summaries should provide intentional loading, error, retry, and partial-data states. A failed data request must not silently turn real Study history into zero Study Time. Exact implementation is technical detail.

#### 2.3.35 Mobile Experience

On mobile, Study history should prioritize a readable Timeline, concise daily and weekly summaries, easy filtering, Subject drill-down, and compact trend presentation. Desktop-style dense analytical tables must not be compressed onto small screens.

#### 2.3.36 Desktop Experience

Desktop may use summary cards, a Timeline or list, compact charts, Subject summaries, and filters. It must remain Student-oriented and must not resemble Counselor or Admin analytics.

#### 2.3.37 Accessibility

Study and performance surfaces must preserve RTL correctness, readable contrast, status labels beyond color, accessible chart interpretation where possible, usable touch targets, and keyboard/focus support where relevant. Charts must not be the only representation of key information.

#### 2.3.38 Data Honesty

The product must not fabricate Study Time, planned time, Quality, Curriculum activity, weekly totals, Subject performance, or trend percentages. Missing or insufficient data requires an honest empty or incomplete state.

#### 2.3.39 Dashboard Relationship

The Student Dashboard may show a compact Study snapshot. Section 2.3 owns the deeper Study history and performance experience; the Dashboard must not duplicate it.

#### 2.3.40 Analytics Relationship

Section 2.3 owns Study records, Study history, simple Study summaries, and Study trends. Section 2.5 owns the broader cross-domain Progress & Analytics layer. The two areas must not introduce competing definitions.

#### 2.3.41 Counselor Visibility

Study records are intended to support Counselor understanding of actual Student behavior. Detailed Counselor presentation belongs in Counselor Workspace. This section preserves only the Student-side Study data and product model and does not define Counselor UI.

#### 2.3.42 Free Study vs. Personal Task

A Personal Academic Task is planned before execution. Free Study records academic Study that occurred without requiring a previously planned Task. Both may link to Curriculum, but their planning provenance remains distinct.

#### 2.3.43 Study Record Is Not a Task

A Task represents planned work and its execution lifecycle. A Study Record represents actual Study activity and history. Task execution may generate Study history, but every Study record must not be turned into a Task, and the concepts remain distinct.

#### 2.3.44 Study Performance Anti-Drift

Future implementation must not reduce Study & Performance to manual stopwatch-only logging, duplicate reporting after every Task, time-only productivity scoring, fake Subject progress, another Mastery system, Exam analytics mixed directly into Study records, or punitive performance scoring.

The canonical model is:

**Real Study Activity + Source + Curriculum Context + Actual Time + Quality /5 + Optional Note + Plan Comparison + Historical Trends**

#### 2.3.45 Current vs. Future

`APPROVED FUTURE STATE — CORE STUDY & PERFORMANCE DIRECTION`:

- Task-derived Study history and Free Study;
- Curriculum-linked Study where genuinely applicable;
- Actual Time, one Quality Score /5, and optional Note;
- Study Timeline/history and filters;
- daily and weekly summaries;
- planned-versus-actual comparison;
- Subject summaries and simple trends; and
- trustworthy totals with double-counting prevention.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- richer long-term Study analytics;
- deeper cross-domain correlation;
- advanced automatic insights;
- predictive Study recommendations; and
- sophisticated behavioral analytics.

These statements preserve approved product direction and do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities still require explicit milestone authorization.

#### 2.3.46 Decision Gates

The following product decisions are closed:

- Task execution contributes to Study history;
- Free Study exists and does not require fake Task creation;
- Task-derived Study does not require duplicate manual entry;
- Actual Study Time is real execution time rather than planned duration;
- planned-versus-actual comparison is descriptive;
- time variance does not determine Task completion;
- Quality remains one 1–5 dimension;
- no separate Task/Study Mastery rating exists;
- Study Performance and Exam Performance are distinct;
- canonical Curriculum is shared rather than duplicated; and
- fake analytics are prohibited.

Remaining implementation-stage choices are limited to:

- exact Free Study edit/delete policy;
- exact Free Study form layout;
- exact date/time capture UX;
- exact filter controls;
- exact chart and visualization implementation;
- exact minimum-data threshold for trend comparisons; and
- exact wording of Study insights.

These choices do not reopen core product behavior or authorize implementation outside an approved milestone.

### 2.4 Practice / Exam UX

The current `/assessments` presentation is legacy and is not the final Assessment UX. Its useful completed-attempt backend/history may be preserved, but the surface is classified for a dedicated future rewrite rather than incremental visual polishing. The current giant all-in-one form, legacy Subject/Topic selectors, native/old date-time interaction, old visual language, and simultaneous-input density must not be treated as the target design. This classification does not authorize the rewrite.

Practice Mode and Exam Mode are intentionally two different Student experiences. **Practice** supports learning, feedback, repetition, and improvement. **Exam** supports assessment through a deliberately minimal interface. This is a hard Product Owner decision; the product must not reuse one generic rich question screen for both modes with only minor visual differences.

#### 2.4.1 Core Distinction

The canonical distinction is:

- **Practice Mode** = learning-oriented + information-rich + immediate educational feedback allowed;
- **Exam Mode** = assessment-oriented + minimal + no educational assistance during the active attempt.

Behavior and presentation must make the current mode unmistakable.

#### 2.4.2 Practice Entry Points

Student Practice may begin through Quick Practice, Custom Practice, a specific Subject, one or more Curriculum topics, wrong questions, bookmarked questions, a review collection, Counselor-recommended Practice, or a future system recommendation.

Exact page hierarchy is an implementation-stage choice. Future recommendation entry points must not be presented as already implemented.

#### 2.4.3 Practice Configuration

Custom Practice may let the Student select relevant parameters such as Subject, one or more Curriculum areas, question count, difficulty, and timed or untimed behavior where supported. For example, a Student might request 20 Easy and Medium Physics questions covering Motion and Graphs.

The builder should remain simple enough for frequent Student use.

#### 2.4.4 Practice Curriculum Selection

Practice uses the canonical Curriculum and may select one or multiple Curriculum areas. It must not create a separate Practice-topic hierarchy.

Question-to-Curriculum behavior comes from the central Question Bank model, where a Question may itself link to multiple Curriculum areas.

#### 2.4.5 Practice Difficulty

Practice may select or filter broad Question Bank difficulty such as Easy, Medium, and Hard. Exact labels and localization may be refined later. Difficulty may be visible to the Student in Practice; that does not authorize showing it during Exam Mode.

#### 2.4.6 Timed vs. Untimed Practice

Default Practice may be untimed, with optional timed Practice where supported. A timer alone does not convert Practice into Exam Mode. Timed Practice remains educational and may preserve Practice feedback behavior.

#### 2.4.7 Practice Question Experience

During Practice, the Student may see the Question, answer options, relevant Practice context, difficulty where appropriate, and educational state after answering. Practice should support learning rather than copy Exam restrictions without reason.

#### 2.4.8 Immediate Practice Feedback

After a Practice answer, the product may immediately show correctness, the correct answer, an available explanation, an available educational note, related Curriculum areas, and Bookmark or save-for-review actions. Immediate educational feedback is a core difference from Exam Mode.

#### 2.4.9 Practice Explanation

An available Question explanation may appear after answering in Practice. When no explanation exists, the product must not fabricate one and may state honestly that no explanation is available.

#### 2.4.10 Practice Question States

Practice outcomes may distinguish Correct, Wrong, and Unanswered/Skipped. The Student may skip rather than being forced to answer. Skipped questions may later be available for review or repractice.

#### 2.4.11 Practice Navigation

Practice may support navigation through the current Practice Session while keeping the educational flow lightweight. Exact Previous/Next, question-list, and navigation mechanics remain implementation-stage choices. Exam restrictions must not be copied into Practice without a product reason.

#### 2.4.12 Practice Session Result

At the end of a Practice Session, the Student should receive a useful real-data summary that may include total questions, correct, wrong, unanswered, accuracy, actual duration, average time per Question where measured, and Curriculum or Subject breakdown where meaningful.

Unsupported values must not be invented.

#### 2.4.13 Practice Follow-Up Actions

Useful post-Practice actions may include repracticing wrong questions, practicing unanswered questions, reviewing answers, creating a similar Practice Session, and saving Questions for later. Exact calls to action may evolve.

#### 2.4.14 Practice History

The Student may have Practice Session history containing real information such as date, Subject or Curriculum scope, question count, result, duration, wrong or unanswered Questions, and Practice source/type. History should support returning to prior Study or Practice context.

#### 2.4.15 Personal Question Collections

Practice may support personal organization such as Bookmarks, Wrong Questions, Unanswered Questions, For Review, and later Student-created collections such as `Important Motion Questions`.

A complex collection system is not required in the earliest implementation unless separately scheduled.

#### 2.4.16 Question Repetition

When generating new Practice, the system should avoid unnecessary recent Question repetition where practical. Legitimate exceptions include explicit review, wrong or bookmarked Question selection, a limited pool, or future deliberately approved spaced-review logic.

This direction does not promise sophisticated spaced repetition.

#### 2.4.17 Question Bank Access

Core Question Bank usage is intended as a paid capability. Practice that consumes the central Question Bank must respect Effective Access and Entitlements. The product must not assume a permanent free daily-question allowance; future samples or trials may be configured separately.

#### 2.4.18 Practice Entitlement Handling

When the Student lacks required Question Bank or Practice access, the interface may show an appropriate locked, discovery, or upgrade state but must not permit unauthorized use. Access depends on Entitlements rather than hardcoded commercial Plan names.

#### 2.4.19 Exam Creation Entry

The Student may create an Online Exam for themselves when the required Entitlements are active. This is a paid/entitled capability. Conceptually relevant capabilities may include `question_bank.access` and `exam_builder.access`; commercial Plan names remain dynamic.

#### 2.4.20 Student Self-Exam Builder

Student self-Exam creation may support Subject selection, one or more Curriculum areas, question count, difficulty, and Exam duration. Its purpose is to generate an assessment from the central Question Bank for the Student to take under Exam Mode.

This section does not define the complete Exam-authoring or administration system. System-level Exam behavior belongs to Section 4.3.

#### 2.4.21 Exam Mode Principle

Exam Mode is deliberately minimal so the Student's attention remains on assessment. The Product Owner explicitly rejected an information-rich Exam interface. Active Exam Mode must not become a Question Bank detail page.

#### 2.4.22 Exam Mode — Allowed Core Content

During an active Exam, the primary visible academic content is:

- Subject list;
- current Question; and
- answer Options.

Necessary execution controls may also appear, including a timer, current Question number, Previous, Next, and Submit/End Exam. These controls must remain functional and restrained.

#### 2.4.23 Subject List Only

For a multi-Subject Exam, navigation presents a list of Subjects, such as Mathematics, Physics, Chemistry, and Biology. Selecting a Subject shows that Subject's Questions.

The approved direction does not include a large sidebar, grid, or list containing every Question number. Any such navigation surface would require separate Product Owner approval.

#### 2.4.24 Current Question Number

The active Question may display its current number, such as `Question 12`, for orientation. Current-position information does not authorize a full Question-number navigation palette.

#### 2.4.25 Exam Options

The active Exam displays available answer Options. The Student selects an answer without correctness feedback, and no Option may visually reveal the correct answer during the attempt.

#### 2.4.26 Forbidden During Active Exam

Active Exam Mode must not show:

- the correct answer or correct/incorrect feedback;
- explanation, hint, or educational note;
- difficulty;
- Curriculum linkage or an assisting topic label;
- performance analysis or recommendations;
- percentages attributed to other users;
- Mastery signals;
- related resources; or
- learning suggestions.

The active Exam is assessment, not teaching.

#### 2.4.27 No Immediate Correctness Feedback

Selecting an Exam answer must not immediately reveal correctness, the correct Option, or an explanation. Feedback is deferred until the Exam is finished and the applicable result-release rules permit it.

#### 2.4.28 Exam Timer

Exam Mode may display the applicable timer prominently enough for assessment awareness without letting it dominate the screen. Exact timing, timeout, and auto-submit rules belong to the broader Exam system and are not invented here.

#### 2.4.29 Previous / Next

Simple Previous and Next navigation may be available during Exam Mode. Navigation should remain minimal and avoid unnecessary control surfaces.

#### 2.4.30 Exam Submit

The Student must have a clear Submit or End Exam action, and the product must distinguish an active attempt from a finalized attempt. Exact confirmation, timeout, and auto-submit behavior remains for the Exam implementation milestone.

#### 2.4.31 Post-Submit Boundary

Educational and result information may appear only after both conditions are met:

1. the attempt is submitted/finalized; and
2. the applicable result/release policy allows the information.

An externally assigned Exam does not necessarily expose full analysis immediately after Submit. Exact release rules remain an Exam-system configuration decision.

#### 2.4.32 Post-Exam Result

When results are available, the Student may see correct, wrong, and unanswered counts; score or percentage where applicable; Subject performance; time information; Question review where allowed; and Curriculum analysis where supported.

This is post-Exam information and must not leak into an active attempt.

#### 2.4.33 Post-Exam Question Review

When Exam release rules allow it, the Student may review their selected answer, the correct answer, an available explanation, and wrong or unanswered Questions. Exact review permission may vary by Exam configuration; the product must not assume every Exam releases its answer key immediately.

#### 2.4.34 Exam Analysis

Post-Exam analysis may eventually include Subject performance, Curriculum-area performance, timing, and historical Exam comparison. Broader cross-domain analysis belongs primarily to Section 2.5; this section preserves the attempt, result, and review boundaries.

#### 2.4.35 Practice vs. Exam Result Difference

Practice may provide feedback Question by Question. Exam feedback is deferred until the assessment is finalized and its release rules allow disclosure. These behaviors must not be blurred.

#### 2.4.36 Practice vs. Exam Visual Difference

Practice may feel more educational and information-rich. Exam should feel calmer, focused, and intentionally sparse. The distinction should be perceptible without distracting decoration; exact styling remains a UI implementation choice.

#### 2.4.37 Visual Reference Boundary

Historical Question Bank or Exam images are not automatically authoritative. For Practice and Exam, the product behavior in this section governs. A visual reference becomes surface-specific authority only when the Product Owner explicitly approves it for that surface.

#### 2.4.38 Exam Mobile UX

Mobile Exam Mode prioritizes Subject access, Question, Options, timer/orientation, Previous/Next, and Submit. It must avoid crowded secondary panels, dense Question grids, analytics, explanatory cards, and distracting navigation.

#### 2.4.39 Exam Desktop UX

Desktop may use available space for clarity, but extra width does not authorize Curriculum details, explanations, difficulty, analytics, or full Question Bank metadata. The minimal assessment principle remains unchanged.

#### 2.4.40 Practice Mobile UX

Practice on mobile should make the Question, Options, response feedback, available explanation, Bookmark/review action, and Next Question easy to use without excessive scrolling. Exact card and component structure remains an implementation-stage choice.

#### 2.4.41 Accessibility

Practice and Exam must provide readable answer Options, clear selected states, sufficient contrast, status communication beyond color alone, correct RTL behavior, accessible tap targets, and keyboard/focus support where relevant. Exam minimalism must not reduce accessibility.

#### 2.4.42 Data Honesty

The product must not fabricate Question metadata, Practice results, Exam results, explanations, difficulty, Curriculum links, timing, scores, or analysis. A missing explanation remains missing, and an unreleased or missing result must not be replaced by a placeholder score.

#### 2.4.43 Attempt Integrity

An Exam attempt is a historical assessment event. After finalization, its answers and result must not be silently rewritten. Exact retake and versioning rules belong to the central Exam system, but historical integrity is mandatory.

#### 2.4.44 Question Version Integrity

Later edits to a central Question must not silently change the past meaning of historical Exam attempts. Detailed Question versioning belongs to the central Question Bank architecture; Student UX relies on preserved historical Exam truth.

#### 2.4.45 Dashboard Relationship

The Dashboard may show an upcoming Exam, a quick Practice or Exam action, and a relevant result summary. Section 2.4 owns the deeper Practice and Exam workflow; the Dashboard must not duplicate it.

#### 2.4.46 Analytics Relationship

Section 2.4 owns Practice interaction, Exam-attempt interaction, immediate Practice feedback, and the post-Exam result/review boundary. Section 2.5 owns broader Progress & Analytics across Study, Curriculum, and Exams.

#### 2.4.47 Question Bank Relationship

Practice and Student Exam Builder consume the central Question Bank. The product must not create a Student Question Bank copy, Practice-specific duplicate Questions, or an Exam-specific duplicate Question repository.

#### 2.4.48 Practice / Exam Access Boundary

Access derives from Effective Access. Relevant capabilities may include `question_bank.access` and `exam_builder.access`. A visible UI control is never sufficient authorization; backend authority remains required.

#### 2.4.49 No Hardcoded Plan Names

Practice and Exam authorization must not compare against a fixed commercial Plan name. Plan names may change; behavior depends on Entitlements.

#### 2.4.50 Empty States

Useful honest states may include no Practice history, no Questions available for the selected scope, no available Exam, no previous Exam results, and Exam submitted but result not yet released. The product must not fabricate content to avoid emptiness.

#### 2.4.51 Loading / Error States

Practice and Exam should eventually handle loading, Question-loading failure, attempt-state failure, safe retry, and submission uncertainty. Critical Exam UX must not report successful submission unless finalization is confirmed. Exact resilience mechanics remain implementation-stage technical work.

#### 2.4.52 Practice Anti-Drift

Future implementation must not reduce Practice to Exam Mode with explanations added only at the end, a static Question Bank reader, a generic Question list without Session behavior, fabricated immediate explanations, or mandatory timer-only testing.

The canonical Practice flow is:

**Question -> Student Answer -> Educational Feedback -> Explanation/Review where available -> Next Question**

#### 2.4.53 Exam Anti-Drift

Future implementation must not turn Exam Mode into a Question Bank detail interface, Curriculum explorer, learning page, analytics page, Question-number dashboard, hint system, explanation panel, difficulty display, or recommendation surface.

The canonical active Exam is intentionally close to:

**Subject List + Question + Options + Only Necessary Execution Controls**

#### 2.4.54 Current vs. Future

`APPROVED FUTURE STATE — CORE PRACTICE DIRECTION`:

- Quick and Custom Practice;
- Curriculum and difficulty filtering;
- question count;
- timed or untimed Practice where supported;
- immediate feedback and available explanation;
- Correct, Wrong, and Unanswered outcomes;
- Bookmark/review actions;
- Practice result; and
- Practice-history foundation.

`APPROVED FUTURE STATE — CORE EXAM DIRECTION`:

- Student self-Exam Builder when entitled;
- multi-Subject Exams and Subject-list navigation;
- deliberately minimal active Exam;
- Question, Options, timer, Previous/Next, and Submit;
- no educational feedback before finalization and permitted release; and
- a post-Exam result/review boundary.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- richer automated Practice recommendations;
- sophisticated adaptive Practice;
- spaced review;
- predictive Question selection;
- advanced Exam analytics; and
- additional assessment intelligence.

These directions do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities require explicit milestone authorization.

#### 2.4.55 Decision Gates

The following product decisions are closed:

- Practice and Exam are distinct experiences;
- Practice is educational and information-rich;
- Practice may show immediate correctness, available explanation, Curriculum context, and difficulty;
- Exam Mode is minimal;
- active Exam shows Subject list, Question, and Options with only necessary controls;
- active Exam shows no correctness feedback, explanation, difficulty, Curriculum assistance, analytics, or recommendations;
- the approved direction contains no full Question-number navigation grid or sidebar;
- post-Exam information waits for finalization and the applicable release policy;
- Student self-Exam Builder is available only when entitled;
- Question Bank and Exam Builder access is Entitlement-based;
- the central Question Bank is shared; and
- historical visual references are not universally authoritative.

Remaining implementation-stage choices are limited to:

- exact Practice page layout;
- exact Practice navigation mechanics;
- exact Exam Submit confirmation UX;
- exact timeout and auto-submit rules;
- exact externally assigned Exam result-release settings;
- exact retake policy;
- exact post-Exam Question-review permissions;
- exact Practice-history layout;
- exact Bookmark and collection UX; and
- exact visual styling for this surface.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

### 2.5 Progress & Analytics

Progress & Analytics is the Student's cross-domain understanding layer. It helps the Student understand overall and Subject-level progress, Curriculum coverage and gaps, changes in Study behavior and Exam performance, alignment between Study and assessment evidence, and areas worth inspecting.

It combines real data from Planning and Task execution, Study history, Curriculum coverage, and Practice/Exam results. It does not replace, redefine, or create a parallel version of those source domains.

#### 2.5.1 Analytics Is a View over Real Data

Analytics is derived from real product data and is not a second source of truth. Task execution truth comes from Planning & Execution; Study truth comes from Study & Performance; Exam truth comes from released Exam results; and educational structure comes from canonical Curriculum.

Analytics may read and combine those domains but must not silently invent or rewrite them.

#### 2.5.2 No Fake Overall Score

The product must not invent a generic value such as `Overall Progress = 78%` unless an explicit, meaningful calculation has been approved and is supported by real data. When no valid composite metric exists, the surface must show separate real signals rather than manufacture one number for visual convenience.

#### 2.5.3 Overall Student View

The Student should have an overall Progress view summarizing useful real indicators. Depending on available data, these may include plan execution, Actual Study Time, Task outcome distribution, Quality trend, Curriculum coverage, Exam activity, and Exam performance.

Unavailable dimensions must not be populated with fabricated values or placeholders that appear real.

#### 2.5.4 Time Range

Progress & Analytics should support understanding performance over ranges such as Week, Month, Three Months, and a later broader academic period or all-time view. Exact date-range controls remain an implementation-stage choice.

#### 2.5.5 Subject-Level Analytics

The Student should be able to understand progress by Subject through real data such as Study Time, Study activity count, Task execution, average Quality, Curriculum coverage, recent Exam performance, and recent activity.

The purpose is to answer a question such as `How am I doing in Physics?`, not merely list disconnected logs.

#### 2.5.6 Subject Summary Example

A conceptual Subject composition may show:

- Physics;
- Study: `12h 40m`;
- Activities: `18`;
- Average Quality: `4.1/5`;
- Curriculum Coverage: a real calculated state; and
- Exam Performance: a real available result or trend.

This illustrates information composition, not a locked layout, and every value must come from real data.

#### 2.5.7 Subject Drill-Down

Opening a Subject may expose Study history, Curriculum areas, completed and incomplete Tasks, Exam history, and recent trends. Specialized workflows remain owned by Study, Planning, and Exam; Analytics should deep-link rather than duplicate them.

#### 2.5.8 Curriculum Progress

Curriculum Progress is a core Student Analytics capability. It should help the Student understand what has been covered, what remains incomplete, what has not been worked on, when an area was last studied, whether related Tasks were partial, and whether relevant Exam evidence exists.

Only canonical Curriculum may provide the educational structure. Analytics must not invent nodes.

#### 2.5.9 Curriculum Coverage

Coverage must be grounded in real execution and history. A Curriculum area is not covered merely because it was planned, appeared in a Task, or existed in an Exam. Planned does not equal executed.

Coverage comes from actual completed or partial execution evidence according to the established product model.

#### 2.5.10 Partial Curriculum State

Item-level evidence from Section 2.2 remains meaningful. When only some planned Curriculum execution items were completed, Analytics must not flatten the entire Task or its targets into fully covered. `PARTIAL` coverage remains partial.

#### 2.5.11 Untouched Curriculum

The Student should be able to distinguish Curriculum areas with no meaningful Study or Task history. Untouched is legitimate product information; progress must not be fabricated for those areas.

#### 2.5.12 Last Activity

Where useful, Curriculum and Subject analytics may show the last Study activity, last Task execution, or last Exam evidence. Recency must come from real events and must not be fabricated.

#### 2.5.13 Review Frequency / Repeated Study

Analytics may report how many real Study activities involved a Curriculum area, such as `Studied 4 times`. This is historical activity information, not automatic Mastery or objective proficiency.

#### 2.5.14 Task Execution Analytics

The Student may see real execution patterns such as Completed, Partial, and Skipped counts and plan execution over time. These are descriptive signals and must not be converted automatically into moral or judgmental scores.

#### 2.5.15 Planned vs. Actual Trend

Analytics may compare planned Study Time with Actual Study Time across time. This remains a time-management signal and does not redefine Task completion. Actual time below planned does not automatically mean poor academic performance.

#### 2.5.16 Quality Trend

The Student may see a trend for their self-reported Quality /5. Quality remains one self-reported dimension; it is not Mastery, an Exam score, or objective proficiency. Analytics must not transform it into an academic Mastery metric.

#### 2.5.17 Exam Performance Input

When Exam results are released and authorized for the Student, Analytics may use real data such as correct, wrong, and unanswered outcomes; Subject score or percentage where applicable; Curriculum-linked Question outcomes; captured timing; and Exam history.

Student-visible analysis may use only result data that the applicable Exam release rules permit.

#### 2.5.18 Exam Trend

The Student may see Exam-performance change over time when a meaningful basis for comparison exists. Incompatible assessments must not be presented as equivalent. Exact comparison methodology remains an implementation-stage design choice.

#### 2.5.19 Curriculum-Level Exam Evidence

Because a Question may link to multiple Curriculum areas, its Exam outcome may provide evidence for more than one area. Analytics must preserve the central Question-to-Curriculum many-to-many model and must not simplify it to `one Question = one Curriculum topic`.

#### 2.5.20 Study + Exam Relationship

A major long-term value of Analytics is combining Study and Exam evidence. Legitimate descriptive patterns may include high Study activity with weak Exam performance, low Study activity with strong Exam performance, consistent Study alongside improving Exam performance, or repeated Study of an area that remains weak in assessment.

These are relationships, not automatic diagnoses.

#### 2.5.21 Example Insight

A future real-data insight might state: `You studied Motion 4 times, but recent Exam performance in related Questions remains weak.` It is acceptable only when Study data, Curriculum linkage, and released Exam evidence are real and the statement is mathematically supported.

Missing or insufficient data must not produce such an insight.

#### 2.5.22 Descriptive, Not Diagnostic

Analytics may describe patterns but must not automatically claim that a Student has mastered or cannot learn a topic, is lazy, received a bad Counselor plan, or has a proven causal explanation. Any stronger conclusion requires a separately approved and explicitly defined system.

#### 2.5.23 No Hidden Mastery System

Analytics must not reintroduce Mastery under another name, including an unapproved Mastery percentage, proficiency score, knowledge score, or confidence index. Task Quality /5 remains separate from any future Mastery concept.

A Mastery product or system requires an explicit future Product Owner decision.

#### 2.5.24 Attention Signals

Student Analytics may surface useful real-data attention signals such as repeated `PARTIAL` Tasks in a Subject, several `SKIPPED` Tasks, no recent Study in an active Subject, weak recent Exam evidence, or a Study/Exam mismatch.

These signals invite inspection and must not become punitive alerts.

#### 2.5.25 Attention Signal Boundary

An attention signal must be explainable: the Student should be able to understand which real data produced it. Opaque claims such as `AI says you are weak here` are not acceptable without evidence. Advanced AI recommendations remain future/extensible.

#### 2.5.26 Trends

Useful trends may cover Study Time, plan execution, Quality, Curriculum coverage, Exam performance, and Task outcome distribution. A trend should appear only when enough real data exists.

#### 2.5.27 Comparison with Previous Period

When periods are valid and comparable, the Student may see statements such as Study Time increased, plan execution decreased, or Exam performance improved. Values and trend copy must not be fabricated.

#### 2.5.28 No Punitive Design

Student Analytics should be supportive, clear, and non-punitive. Neutral language such as `Execution was lower than last week` is preferred over judgment such as `You are failing your plan.` Its purpose is self-understanding and better action.

#### 2.5.29 Student Agency

Analytics should help the Student decide what to inspect or work on next rather than make opaque decisions on their behalf. Useful actions may deep-link to Planning, Study History, Practice, Exam History, a Curriculum area, or Counselor communication. Exact calls to action are implementation-stage details.

#### 2.5.30 Dashboard Relationship

The Dashboard owns compact snapshots, such as a small weekly Study chart. Section 2.5 owns deeper trend and Subject/Curriculum exploration. The same analytical page must not be duplicated inside Dashboard.

#### 2.5.31 Study Relationship

Section 2.3 remains authoritative for Study Records, Study History, Free Study, and Study summaries. Section 2.5 consumes those records for broader analysis and must not create a second Study-log system.

#### 2.5.32 Planning Relationship

Section 2.2 remains authoritative for planned Tasks, execution status, partial Coverage, Actual Time, Quality, and planning history. Analytics reads those states and must not mutate historical planning truth.

#### 2.5.33 Exam Relationship

Section 2.4 and the central Exam system remain authoritative for attempts, answers, result release, and Question review. Analytics consumes permitted outcomes for broader trends and must not bypass Exam release rules.

#### 2.5.34 Curriculum Relationship

Canonical Curriculum remains the educational reference structure. Analytics may aggregate against it but must not rewrite it, flatten it, normalize its labels, create missing educational nodes, or turn it into a new knowledge graph.

#### 2.5.35 Subject Distribution

Analytics may show how real Study Time is distributed across Subjects—for example, Physics 25%, Biology 30%, and Chemistry 20%. This is descriptive allocation, not a recommendation by itself.

#### 2.5.36 Time Distribution

The Student may inspect when Study occurred across days and weeks through representations such as daily bars, weekly totals, or period trends. Exact visualization remains a UI implementation choice.

#### 2.5.37 Curriculum Coverage Visualization

Curriculum Progress may visually distinguish covered, partial, and untouched states. Exact labels and colors are implementation-stage design choices, and status must not rely on color alone. Arbitrary decimal Mastery percentages are not permitted as false precision.

#### 2.5.38 Exam Performance by Subject

When released data exists, the Student may compare their own Exam performance across Subjects. This section does not authorize comparison or ranking against other Students.

#### 2.5.39 Practice Data

Practice outcomes may contribute supporting evidence such as Practice volume, correct/wrong/unanswered outcomes, and Curriculum-related Practice performance. Practice and formal Exam evidence must remain distinguishable and must not be silently merged into one assessment score.

#### 2.5.40 Practice vs. Exam Evidence

Practice evidence is learning-oriented; Exam evidence is assessment-oriented. Analytics may show both while preserving source and type. A strong Practice result is not automatically equivalent to a formal Exam result.

#### 2.5.41 Filters

Analytics may support time-range, Subject, Curriculum-area, and data-domain filters. Exact controls remain implementation-stage details and should avoid excessive complexity for Student users.

#### 2.5.42 Drill-Down

Summary information should lead to supporting evidence where appropriate:

- Subject summary → Subject detail;
- Curriculum coverage → Curriculum-area history;
- Exam trend → Exam history or released result; and
- Task execution trend → relevant Planning/history.

Drill-down keeps summaries clean without hiding their basis.

#### 2.5.43 Empty States

Analytics must represent missing data honestly, including not enough Study history, no Exam results, no Curriculum-linked execution, or insufficient data for a trend. It must not manufacture charts to avoid an empty state.

#### 2.5.44 Insufficient Data

`Insufficient data` is a valid product state. One Study activity, for example, may not justify a meaningful monthly trend. Statistical-looking output must not be forced from tiny datasets.

#### 2.5.45 Loading / Partial Data

Because Analytics combines several domains, one source may load while another is unavailable. The experience should support loading, partial-data, error, and retry states. Failed data retrieval must not be interpreted as zero performance.

#### 2.5.46 Mobile Experience

Mobile Analytics should prioritize concise summaries, Subject cards, Curriculum Progress, compact trends, and drill-down. Dense desktop dashboards must not be reduced into unreadable mobile charts.

#### 2.5.47 Desktop Experience

Desktop may use a richer analytical layout but remains Student-facing. It should use clear hierarchy rather than Counselor/Admin operational density or a wall of dashboards.

#### 2.5.48 Chart Boundary

Charts support understanding; they are not the product itself. Every important analytical conclusion should remain understandable without relying only on a visualization. Decorative charts without actionable meaning should be avoided.

#### 2.5.49 Accessibility

Analytics must preserve RTL correctness, readable contrast, non-color-only status communication, accessible labels, understandable chart alternatives or summaries where practical, usable mobile interaction, and keyboard/focus support where relevant.

#### 2.5.50 Data Honesty

The product must not fabricate Study trends, Curriculum coverage, Exam performance, Quality averages, plan execution, comparisons, insights, or attention signals. Analytics must reflect its underlying real product data.

#### 2.5.51 Privacy / Own-Data Scope

Student Analytics primarily reflects the Student's own authorized data. It must not expose another Student's private academic data. Any future School or group comparison requires separately approved product behavior.

#### 2.5.52 No Unsupported Ranking

Percentile, class rank, national rank, and peer benchmarking must not be added without a separate Product Owner decision that approves the source population, data, and behavior. This section does not authorize those comparisons.

#### 2.5.53 Insight Provenance

When an insight appears, its basis should be understandable. For example, `3 PARTIAL Physics Tasks this week` is grounded in visible execution records. Unexplained proprietary scores must be avoided.

#### 2.5.54 Actionable Analytics

Analytics should help the Student move toward a useful action, such as inspecting incomplete Curriculum, reviewing Study history, opening related Practice, inspecting an Exam result, opening Today's Plan, or contacting a Counselor where appropriate.

An analytical signal does not itself authorize changes to the plan.

#### 2.5.55 No Automatic Plan Mutation

Analytics may identify an area needing attention but must not automatically rewrite Counselor plans, move Tasks, create compensatory Tasks, or change Curriculum targets. Any future automation workflow requires explicit approval.

The current rule is: analysis informs; it does not silently rewrite planning.

#### 2.5.56 Recommendation Boundary

Simple evidence-based suggestions may exist later. Advanced AI recommendations, predictive recommendations, and automated schedule optimization remain future/extensible and must not be presented as current core behavior.

#### 2.5.57 No Causal Claims

Correlation must not be presented automatically as proven causation. `Study Time increased and Exam performance also improved` may be acceptable when supported; `Exam performance improved because Study Time increased` is a stronger causal claim and must not be inferred automatically.

#### 2.5.58 Analytics Anti-Drift

Future implementation must not reduce Progress & Analytics to decorative charts, an arbitrary overall score, a hidden Mastery system, fake percentages, punitive Student scoring, one giant dashboard, duplicated Study logs, duplicated Exam records, automatic plan rewriting, or opaque AI conclusions.

The canonical model is:

**Real Planning Data + Real Study Data + Canonical Curriculum + Released Practice/Exam Evidence → Clear Student Progress Understanding**

#### 2.5.59 Current vs. Future

`APPROVED FUTURE STATE — CORE PROGRESS & ANALYTICS DIRECTION`:

- an overall real-data summary;
- Subject-level progress and Curriculum coverage;
- Task execution, Study, planned-versus-actual, and Quality trends;
- released Exam performance;
- descriptive Study/Exam relationships;
- useful and explainable attention signals;
- time-range exploration and evidence drill-down; and
- honest insufficient-data states.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- advanced automated insights;
- predictive analysis and intelligent recommendations;
- richer cross-domain correlation;
- advanced behavioral analytics;
- automated recommendation ranking; and
- a future explicit Mastery system only if separately approved.

These directions do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities require explicit milestone authorization.

#### 2.5.60 Decision Gates

The following product decisions are closed:

- Analytics uses real underlying domain data and does not create parallel truth;
- fake analytics and arbitrary overall scores are prohibited;
- Subject-level analysis and Curriculum Progress exist;
- planned Curriculum does not equal covered Curriculum;
- `PARTIAL` coverage remains partial;
- Study and Exam can be analyzed together while remaining distinct source domains;
- Practice and formal Exam evidence remain distinguishable;
- Quality is not Mastery, and no hidden Mastery score exists;
- Analytics is descriptive, supportive, and non-punitive;
- Analytics does not automatically create compensatory Tasks or silently rewrite plans;
- Student Analytics primarily concerns the Student's own authorized data; and
- advanced AI and predictive recommendations remain future.

Remaining implementation-stage choices are limited to:

- exact Curriculum-coverage calculation and display rules where source evidence has multiple types;
- exact Subject-summary layout;
- exact comparison methodology between Exams;
- exact trend thresholds and minimum-data rules;
- exact attention-signal thresholds;
- exact chart types;
- exact filter layout;
- exact insight wording; and
- exact future recommendation behavior.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

### 2.6 Focus / Habits / Goals

Focus / Habits / Goals is an intentionally lightweight supporting Student capability. It helps with concentration, simple recurring behaviors, organization, and clear personal goals, but it is not a primary KonkourX product pillar.

This area must not become a large productivity platform, life-coaching system, complex habit tracker, gamification engine, or achievement/badge economy. Expansion requires later usage evidence and a separately approved milestone.

#### 2.6.1 Focus

Focus provides a simple concentration and timer tool. Conceptual modes may include Free Focus, Pomodoro-style Focus, and Focus started from a Task. Its purpose is to help the Student spend intentional time on Study; exact timer mechanics remain implementation-stage details.

#### 2.6.2 Focus from Task

Where useful, the Student may start Focus from an academic Task and preserve the relationship to that Task so actual execution evidence can remain connected. Focus must not create a competing Task-execution system; Task status and reporting remain governed by Section 2.2.

#### 2.6.3 Focus Time Relationship

Focus time may contribute useful actual-time evidence only where the implementation explicitly connects it to the applicable workflow. A Focus timer alone must not determine `COMPLETED`, `PARTIAL`, `SKIPPED`, Curriculum coverage, or Quality Score.

Content execution remains Student-reported through the established Task workflow.

#### 2.6.4 Focus Session Basics

A Focus Session may conceptually support Start, Pause, Resume, and Finish. Interruption, background, device, and timer-resilience behavior remain implementation-stage choices and are not specified here.

#### 2.6.5 Focus History

The Student may see a simple Focus history containing real information such as date, duration, related Task or Subject where available, and total Focus time. Focus history is supportive and does not replace Study History.

#### 2.6.6 Focus vs. Study

Focus and Study are related but distinct. Focus represents timer or concentration activity; Study represents actual academic activity and history. A Focus Session must not automatically become an independent academic Study truth without the intended relationship, and time must not be double-counted.

#### 2.6.7 No Focus Score

Focus must not add a mandatory Focus, concentration, or attention rating to Task reporting. The Task-level report remains Status + applicable Coverage + Actual Time + one Quality Score /5 + optional Note.

Focus is a tool, not another reporting dimension. It also does not authorize a new Mastery or Satisfaction rating.

#### 2.6.8 Habits

Habits support simple recurring behaviors such as waking or sleeping on time, daily review, daily vocabulary, exercise, or a short recurring Study behavior. A Habit is conceptually distinct from a Task.

#### 2.6.9 Habit vs. Task

A Task is a specific planned activity; a Habit is a recurring behavior. For example, `Study Physics Chapter 3 at 16:00` is a Task, while `Review vocabulary every night` is a Habit.

Habits must not be forced into the academic Task or Curriculum model.

#### 2.6.10 Habit Basics

A simple Habit may conceptually have a title, recurrence, completion state, simple history, optional reminder, and a simple streak where appropriate. This direction does not authorize an advanced habit engine.

#### 2.6.11 Habit Recurrence

Habit recurrence may support simple patterns such as daily, selected days, or weekly. Exact recurrence mechanics remain implementation-stage details; complex scheduling rules require later approval.

#### 2.6.12 Habit Reminders

Where implemented, Habit reminders use the shared Notification system governed by Section 5.2. This area must not create a separate reminder infrastructure.

#### 2.6.13 Streaks

Simple streak visibility, such as a five-day streak, may be supportive. Streak preservation must not become the core Student motivation system, and the product must avoid aggressive guilt, loss-aversion, or punishment patterns.

#### 2.6.14 Habit History

The Student may inspect simple completed, missed, and recurrence history. The purpose is self-awareness, not deep behavioral analytics.

#### 2.6.15 Goals

Goals let the Student define a meaningful target over time. Conceptual Goal families may include Study Time, Curriculum completion, Exam-related, and activity-count Goals—for example, 30 Study hours this week, completing a defined Physics area by month-end, completing five Practice Sessions, or reaching a specified Exam target.

Supported Goal types may be introduced incrementally.

#### 2.6.16 Goal Measurement

When a Goal uses measurable product data, its progress must derive from real data. A Goal for 30 weekly Study hours, for example, uses real Study records.

Manual progress must not masquerade as system-measured progress unless the Goal is explicitly manual.

#### 2.6.17 Curriculum-Based Goals

Where supported, a Goal may reference canonical Curriculum. The product must not create a separate Goal-topic taxonomy. Goal progress must respect the established real coverage rules; planned Curriculum does not automatically count as completed Goal progress.

#### 2.6.18 Exam-Related Goals

A Goal may reference real Exam outcomes where appropriate, such as reaching a specified future Exam target. Goals do not redefine Exam scoring; Exam truth remains authoritative in the Exam system.

#### 2.6.19 Goal Status

A Goal may conceptually communicate an in-progress, completed, or expired/not-achieved state where applicable. Exact lifecycle labels remain implementation-stage details, and Goals must not become a complex project-management workflow.

#### 2.6.20 Lightweight Summary

The Student may see a compact real-data summary such as Focus `2h 10m`, Habits `4 / 5`, and two active Goals. This is illustrative, not a locked layout. It must not be forced onto the main Dashboard when it would harm action priority.

#### 2.6.21 Dashboard Boundary

Section 2.1 remains action-first. Focus, Habits, and Goals may appear as a small supporting element or quick action, but must not displace Today Plan, Current Task, or core academic actions.

#### 2.6.22 Analytics Boundary

Habits and Goals must not become a second Progress & Analytics platform. Simple history and progress are sufficient; deep academic Analytics remains governed by Section 2.5.

#### 2.6.23 Gamification Boundary

Advanced gamification is future and optional. This section does not authorize XP, levels, currencies, complex badge systems, leaderboards, competitive ranking, reward shops, or daily quest systems. Each requires separate future approval.

#### 2.6.24 No Social Competition

Student leaderboards, peer Habit ranking, Focus competitions, and class streak competitions are not authorized. Any social or competitive behavior requires a separate Product Owner decision.

#### 2.6.25 No Punitive UX

Habits and Goals should support rather than shame the Student. Aggressive failure messaging, guilt-based streak recovery, punitive colors or copy, and manipulative engagement loops must be avoided.

#### 2.6.26 Notification Boundary

Focus, Habit, and Goal reminders should use the shared Notification system rather than parallel push, SMS, or email infrastructure. The Student should later be able to control optional reminders through the applicable Notification settings.

#### 2.6.27 Entitlement Boundary

This section does not lock a commercial restriction for Focus, Habits, or Goals. If an advanced capability later becomes paid, it must use the shared Entitlement system rather than hardcoded Plan names.

#### 2.6.28 Data Honesty

The product must not fabricate Focus Time, Habit completion, streaks, Goal progress, or achievements. Missing data requires an honest state.

#### 2.6.29 Empty States

Useful states may include no Focus history, no Habits created, and no active Goals. The interface may offer a simple action to create or start the relevant item but must not force onboarding into this secondary area.

#### 2.6.30 Mobile / Desktop

These tools should remain simple on mobile and desktop, with mobile especially useful for timer and quick-completion behavior. They must not become dense administrative interfaces. Exact layout is an implementation-stage choice.

#### 2.6.31 Accessibility

The experience must preserve RTL correctness, clear timer states, readable labels, accessible tap targets, completion states that do not rely only on color, and keyboard/focus behavior where relevant.

#### 2.6.32 Anti-Drift

Future implementation must not turn Focus / Habits / Goals into a primary product pillar, another Study-reporting system, another Task system, another Analytics system, a gamification economy, a social-ranking product, or a mandatory daily workflow.

The canonical intent is: **small, useful tools supporting the Student's main academic workflow**.

#### 2.6.33 Current vs. Future

`APPROVED FUTURE STATE — CORE LIGHTWEIGHT DIRECTION`:

- Focus: a simple timer, optional Task relationship, and basic history;
- Habits: simple recurrence, done/missed state, basic history, optional reminders, and a simple streak where useful; and
- Goals: simple measurable targets with real-data progress where supported.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- advanced recurrence and sophisticated Goal types;
- richer Habit analytics and advanced productivity tooling;
- gamification and social challenges;
- AI Habit/Goal coaching; and
- automatic behavioral recommendations.

These directions do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities require explicit milestone authorization.

#### 2.6.34 Decision Gates

The following product decisions are closed:

- this area remains lightweight and supporting;
- Focus is a simple timer/tool and does not determine Task completion;
- Focus does not add a Task-level Focus rating;
- Habits remain distinct from Tasks;
- Goals may use real Study, Curriculum, and Exam data;
- advanced gamification is not currently authorized;
- social leaderboards and competitions are not authorized;
- this area must not displace core Dashboard priorities;
- shared Notifications are reused; and
- fake progress and streaks are prohibited.

Remaining implementation-stage choices are limited to:

- exact Focus timer modes and Pomodoro defaults;
- exact Focus-history presentation;
- exact Habit recurrence and reminder UX;
- exact simple Streak behavior;
- the initial supported Goal types;
- exact Goal lifecycle wording; and
- exact placement and navigation of these tools.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

### 2.7 Communication & Learning Access

This Student area contains two related but conceptually distinct capabilities: **Communication Access** for Counselor interaction, Notifications, support entry points, and contextual conversation; and **Learning Access** for discovering and consuming educational resources, Articles, PDFs, Files, Links, Video links, and later Lessons or Courses.

Communication and Learning Content share the Student Super App but must not be merged into one domain model.

#### 2.7.1 Student Communication

Where a Counselor relationship exists, the primary direct academic communication path is Student ↔ assigned Counselor. The Student should be able to communicate without leaving the KonkourX workflow through lightweight, context-aware communication.

This capability is not a full general-purpose social messenger.

#### 2.7.2 Counselor Availability State

When a Counselor is assigned, the product may show Counselor identity, a conversation entry, unread state, and a relevant upcoming session or action. When no Counselor is assigned, the interface must show an honest unassigned state and must not fabricate a relationship.

#### 2.7.3 Message Types

Student messaging may conceptually support text, image, file, PDF/document, link, and reply-to-message behavior. Voice Messages remain a future possibility and are not a current locked requirement unless separately scheduled.

#### 2.7.4 Context-Aware Messaging

A message may originate from relevant context such as a Task, Today Plan, Study Report, Exam, Exam Result, Resource, Session, or appropriate Curriculum context. Preserving that relationship helps the Student and Counselor understand what the conversation concerns.

#### 2.7.5 Context Card

When communication originates from a product object, the conversation may display a compact contextual reference. For example, it may reference a Physics—Motion Task scheduled from `15:45–17:00`, or a Comprehensive Exam result, with an appropriate View action.

Exact card presentation is an implementation-stage choice. The context must be preserved rather than flattened into ambiguous plain text.

#### 2.7.6 Message Context Does Not Duplicate Data

A contextual message references its underlying Task, Exam, Report, Resource, or other product object. It must not create a detached duplicate of that object. Where the preserved underlying record remains accessible, the contextual link should lead to it.

#### 2.7.7 Chat vs. Ticket

Chat supports conversation. Ticket supports formal tracked issues that require ownership, workflow, referral, and resolution. They are different systems.

A Chat interaction may later create or become a Ticket while preserving context. Detailed Ticket behavior belongs to Section 5.3.

#### 2.7.8 Student Support Issues

Not every Student issue belongs to Counselor handling. Technical, payment/subscription, account/login, Counselor-change, complaint, and platform/service issues should enter the appropriate Admin, Support, or Ticket workflow.

#### 2.7.9 Counselor Referral Awareness

When a Counselor refers an issue to Admin or Support, the Student may continue through the appropriate Ticket/support experience. Counselor visibility after referral is governed by Sections 3.5 and 5.3 and is not duplicated here.

#### 2.7.10 Chat Retention

Ordinary Chat history is intentionally finite. The Product Owner does not want unbounded message storage. The canonical direction is:

- ordinary messages use finite retention;
- Chat attachments may use shorter retention; and
- retention policy is Admin-configurable.

The current default product direction may be approximately six months for messages and three months for attachments. These are configurable operational defaults, not immutable hardcoded constants; authorized administration may adjust them for product, legal, or operational needs.

#### 2.7.11 Retention Is Server Policy

The platform enforces configured retention rather than depending on Students to clean conversations manually. Pagination or hidden older messages must not be mistaken for a retention policy or used to preserve unlimited history.

#### 2.7.12 Retention Exceptions

Formal or sensitive records—including Ticket history, complaint or investigation records, and required administrative evidence—may use separate retention rules. Ordinary Chat retention must not automatically delete Ticket, audit, or other formal records governed by a different policy.

Exact legal retention remains implementation and legal-policy work.

#### 2.7.13 Chat Attachments

Because attachments can be more storage-heavy than text, they may expire sooner. An expired attachment must be handled intentionally rather than appearing as an unexplained broken file link. Exact Student-facing treatment remains an implementation-stage choice.

#### 2.7.14 Read / Unread

Messaging should support simple read and unread awareness and relevant unread counts. This does not authorize an overly complex messenger-state system.

#### 2.7.15 Message Search

Message search may be added where useful and operates only over retained, available Chat history. Search is not a current MVP blocker.

#### 2.7.16 Notifications Relationship

New communication integrates with the shared Notification system. A Notification such as `Your Counselor sent a new message` should deep-link to the relevant conversation or context. Detailed Notification behavior belongs to Section 5.2; Student Communication must not create a parallel notification infrastructure.

#### 2.7.17 Communication Privacy

Student/Counselor conversations are private operational data, not ordinary public or Admin-browsable content. Normal access belongs to authorized participants. Super Admin sensitive access is governed by the controlled Break-Glass model in Section 0; private Chat must not be exposed to ordinary Admin browsing.

#### 2.7.18 Communication Data Honesty

The product must not fabricate Counselor messages, unread state, sessions, conversation history, or attachment availability. Missing or unavailable communication data requires an honest state.

#### 2.7.19 Learning Access Purpose

Learning Access gives the Student a structured way to discover and consume educational Content within the KonkourX ecosystem. The initial direction is simple, manageable, linkable, commercially controllable, and extensible; it is not a deep full-scale LMS.

#### 2.7.20 Content Types

Student Learning Access may expose Articles, PDFs, Files, External Links, Videos, Lessons, Courses, and later recorded Content. Not every type must be implemented immediately; the product model preserves progressive expansion.

#### 2.7.21 Current Content Delivery Direction

The current practical direction supports File and External URL delivery. A Video may be hosted externally—including through Telegram or another service—while KonkourX stores and manages its link.

Internal video hosting is not required to launch Learning Content.

#### 2.7.22 External Video / Link Content

A Content item may reference an external URL such as Telegram-hosted media, an external Video, an external document, or another approved learning resource. KonkourX still manages its title, description, access, Curriculum relationships, publication state, and presentation metadata even when media is hosted elsewhere.

#### 2.7.23 Linkability

A Learning Resource should be individually linkable through a stable internal product destination or a supported external destination where appropriate. Linkability supports Counselor sharing, Student navigation, Notifications, later Course composition, and Curriculum relationships. Exact URL structure remains an implementation detail.

#### 2.7.24 Curriculum Linking

Learning Content may link to canonical Curriculum, such as Physics → Motion → Position-Time Graph, to support relevant discovery. The product must not create a second Learning-topic taxonomy that conflicts with canonical Curriculum.

#### 2.7.25 Multiple Curriculum Links

A Content item that genuinely spans several Curriculum areas may represent multiple relationships. Resources must not be forced into exactly one topic when their educational scope is broader. Exact relationship mechanics belong to implementation.

#### 2.7.26 Resource Library

The Student may have a Learning or Resource Library. Useful discovery dimensions may include Subject, Grade, Stream where relevant, Curriculum, Content type, access state, recently added Content, and purchased or otherwise available Content. Exact filter UI remains an implementation-stage choice.

#### 2.7.27 Resource Presentation

A Resource may show real title, type, description, thumbnail or cover, Subject/Curriculum context, author or publisher where relevant, and access state. Metadata that does not exist must not be fabricated.

#### 2.7.28 Free / Paid / Plan-Based Access

Learning Content may be **FREE**, **PAID**, or **PLAN-BASED**. A Content item may be available to everyone, separately purchasable, included in one or more Plans, or granted through another Effective Access source.

All access uses the shared Entitlement and Commercial model.

#### 2.7.29 No Hardcoded Plan Names

Content access must not depend on fixed commercial labels such as Gold or VIP. It resolves through Entitlements, Purchases, Organization access, and User overrides according to Effective Access.

#### 2.7.30 Commercial Approval

Final Learning Content commercial and access state requires approval from an authorized Admin or Super Admin. A creator or editor may prepare Content, but commercial publication, Free/Paid choice, and Plan inclusion require the relevant Permission.

#### 2.7.31 Content Creator vs. Commercial Authority

Content creation/editing and commercial/access approval are conceptually separate. For example, an Editor may create a Video Resource while an authorized Admin approves Premium or Plan-based access. Exact permission names remain implementation-stage details.

#### 2.7.32 Content Publication

Learning Content should have controlled publication states such as Draft, Published, and Archived. Additional review states may be added through the broader Content workflow where needed, but this section does not define a deep editorial process.

#### 2.7.33 Admin-Managed Content

Authorized Admin or Content staff should manage ordinary Content without code changes. Supported management may include create, edit, publish/unpublish/archive, title and description, thumbnail, File or Link, Curriculum relationships, ordering, access state, and Plan/Entitlement inclusion where authorized.

Configuration manages supported Content behavior; new software capabilities still require development.

#### 2.7.34 Content Access State

The Student should clearly understand whether Content is available, locked, separately purchasable, included in current access, or unavailable. Locked Content must not appear usable. Exact commercial wording and interaction remain implementation-stage choices.

#### 2.7.35 One-Time Purchase

Where Business configuration permits, a Resource or Course may be sold through one-time purchase distinct from Subscription or Plan access. Student authorization still resolves through Effective Access.

#### 2.7.36 Organization Access

A Student may receive Learning Content through School or Institute membership. When Organization Entitlement grants a Resource collection, the Student should not need to purchase the same access personally.

#### 2.7.37 School-Specific Content

Future School/Institute capability may expose Organization-scoped Content only to members. It reuses the shared Learning Content model and must not create a separate School Content engine.

#### 2.7.38 Course Concept

Multiple Content items may later form a Course with conceptual sections, Lessons, Videos or Resources, Files, and Practice/Exam links. This preserves Course extensibility without authorizing a deep LMS implementation now.

#### 2.7.39 Course Progress

Future Course capability may support progress, completed Lessons, continuation from a previous position, and related Practice or Exam. These behaviors remain future/extensible until explicitly scheduled and must not be presented as current core behavior.

#### 2.7.40 Video Platform Boundary

Internal Video Hosting is not a current requirement. Current delivery remains File/Link/external-provider friendly. A future system may add internal video providers, streaming, playback progress, resume, secure delivery, recorded Courses, or class recordings, but this milestone does not authorize an internal Video Platform.

#### 2.7.41 Recorded Courses

The product model should remain extensible toward future KonkourX-produced recorded Courses. The current external-link approach must not permanently block later Course or Video expansion.

#### 2.7.42 Content → Practice / Exam Relationship

A Resource or Course may later reference relevant Practice or Exam experiences, such as a Lesson leading to related Practice Questions or a Course section leading to an Exam. Learning Content, Practice, and Exam remain distinct systems.

#### 2.7.43 Content → Curriculum → Analytics Relationship

Curriculum-linked Content may later support discovery or recommendation, such as showing relevant Content for weak Exam evidence in an area. Advanced automatic and personalized Content recommendation remains future/extensible and must not be fabricated now.

#### 2.7.44 Counselor-Shared Resources

A Counselor may later share or reference an existing Learning Resource for a Student. The preferred direction references the canonical Content item rather than duplicating its file or data. Exact sharing workflow belongs to Counselor and Communication implementation.

#### 2.7.45 Notification → Content

A Notification may deep-link to a Learning Resource, for example when a new Physics Resource is published. Distribution remains governed by Section 5.2; Learning Content must not create a separate Content-notification engine.

#### 2.7.46 Content History / Availability

When Content is unpublished, archived, expired, or its access changes, Student UX should show its real availability rather than a broken link that appears usable. Historical purchase and access rules remain Business implementation-stage decisions.

#### 2.7.47 External Link Risk / Change

External URLs may change or become unavailable. Authorized Admins must be able to update or replace them. External Content URLs must not be hardcoded into application code.

#### 2.7.48 File Storage Boundary

Learning Content may use the shared File/Storage abstraction and must not be permanently coupled to local filesystem storage. Exact storage provider is technical architecture detail.

#### 2.7.49 Student Download / Open Behavior

Depending on Content type and policy, the Student may open, view, follow an external link, or download where permitted. Exact download restrictions are implementation-stage choices; not all Content is assumed downloadable.

#### 2.7.50 Content Search / Filter

Student Learning may support search and filters across accessible Content. Search must respect Effective Access; discovering a locked or private Resource must not make it downloadable. Exact search implementation remains open.

#### 2.7.51 Data Honesty

The product must not fabricate Resource availability, purchase or access state, Content progress, Counselor messages, unread counts, Video progress, recommendations, or Course completion. Only supported real data may be displayed.

#### 2.7.52 Empty States

Communication states may include no messages and no assigned Counselor. Learning states may include no accessible Resources, no Content for the active filter, no purchased Courses, or unavailable Content. Empty states should guide without inventing data.

#### 2.7.53 Mobile Experience

Communication on mobile requires readable conversation, accessible attachment/open actions, and contextual messages. Learning requires compact Resource lists or cards, simple search/filtering, and clear locked/available states. Neither capability may become desktop-only.

#### 2.7.54 Desktop Experience

Desktop may use additional space for conversation context, Resource discovery, and Content detail while remaining Student-oriented. Admin/CMS complexity must not be copied into Student Learning UI.

#### 2.7.55 Accessibility

The experience must preserve RTL correctness, readable message and Content text, clear attachment actions, accessible locked states, readable metadata, non-color-only state communication, usable touch/focus targets, and keyboard/focus support where relevant.

#### 2.7.56 Communication Anti-Drift

Future implementation must not turn Student Communication into a general social network, permanent unlimited Chat archive, Ticket replacement, ordinary Admin-visible inbox, or duplicate Notification system.

The canonical intent is: **context-aware Student/Counselor communication with finite retention and formal Ticket escalation where necessary**.

#### 2.7.57 Learning Anti-Drift

Future implementation must not turn Learning Access into a hardcoded frontend link list, separate topic taxonomy, permanently free-only or Plan-only library, immediate deep LMS, immediate internal Video Platform, or School-specific duplicate Content engine.

The canonical intent is: **Admin-managed + Link/File-friendly + Curriculum-aware + Free/Paid/Plan-capable + extensible toward Courses and Video**.

#### 2.7.58 Current vs. Future

`APPROVED FUTURE STATE — CORE COMMUNICATION DIRECTION`:

- Student ↔ Counselor Chat where a relationship exists;
- contextual text, image, File, document, and Link messages;
- read/unread awareness;
- finite, Admin-configurable retention;
- shared Notification integration; and
- a path from Chat to formal Support/Ticket where needed.

`APPROVED FUTURE STATE — CORE LEARNING DIRECTION`:

- Admin-managed Articles, PDFs, Files, Links, and Video Resources;
- canonical Curriculum linking and a Resource Library;
- Free, Paid, and Plan-based access;
- authorized commercial/access approval;
- external URL and File delivery; and
- Entitlement-aware authorization.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- Voice Messages, richer message search, and Teacher messaging;
- deep Course/LMS behavior and Course progress;
- Continue Watching;
- internal Video Hosting and streaming;
- recorded Courses and class recordings; and
- intelligent Content recommendations.

These directions do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities require explicit milestone authorization.

#### 2.7.59 Decision Gates

The following product decisions are closed:

- Communication and Learning remain distinct concepts;
- Student/Counselor Chat exists and is context-aware;
- Chat and Ticket are different systems, and not every support issue belongs to a Counselor;
- ordinary Chat retention is finite and Admin-configurable;
- attachments may use shorter retention;
- current default direction is approximately six months for messages and three months for attachments while remaining configurable;
- Learning Content is Admin-managed and may use Files or External URLs;
- externally hosted Video, including Telegram-hosted links, is acceptable for current practical delivery and does not lock permanent architecture;
- Content may link to canonical Curriculum;
- Learning Content may be Free, Paid, or Plan-based;
- commercial/access state requires authorized Admin approval;
- access is Entitlement-based rather than hardcoded Plan-name based;
- Organization access may grant Content, without a duplicate School Content engine;
- an internal Video Platform and deep LMS remain future; and
- recorded Courses remain a future extensibility target.

Remaining implementation-stage choices are limited to:

- exact enforced retention values for each deployment and legal policy;
- exact attachment limits and types;
- exact message-search UX;
- exact Content search/filter UI;
- exact download and view restrictions;
- exact historical access after purchase or Content archive;
- exact Course model when Course work begins;
- exact future Video provider and hosting strategy;
- exact Content-card and detail layout; and
- exact commercial locked-state UX.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

## 3. Counselor Workspace

### 3.1 Dashboard

The Counselor Workspace is a professional operational workspace, not merely a Student directory, CRM, analytics dashboard, planner page, or messaging inbox. Its Dashboard is the daily operations center and answers: **Which Student needs action from me now, and what exactly do I need to do?**

Counselor UI is intentionally denser and more operational than Student UI while remaining readable, contextual, and action-oriented.

#### 3.1.1 Dashboard Purpose

The Counselor Dashboard surfaces Students needing attention, planning work, new reports, incomplete Tasks, messages, Follow-ups, Sessions, and operational backlog. Its primary purpose is to help the Counselor decide and perform the next relevant action.

#### 3.1.2 Not a Decorative Analytics Dashboard

The Dashboard must not be reduced to generic metric cards, decorative charts, engagement statistics, or business KPIs unrelated to counseling work. Analytics may appear, but operational action takes priority.

#### 3.1.3 Visual Source of Truth

Only Product Owner-approved references for Counselor surfaces govern this interface. The approved Counselor Dashboard direction should influence composition, density, card hierarchy, shell structure, Light/Dark quality, and professional operational character.

Unrelated Student, Public, or School references must not be applied automatically. Detailed visual tokens remain governed by `docs/DESIGN_SYSTEM.md`.

#### 3.1.4 Application Shell

The Dashboard belongs inside the authenticated Counselor application shell. Desktop is RTL-first with a right-side sidebar, purposeful header/top region, operational workspace, and canonical Light/Dark support. Mobile uses a hamburger and drawer opening from the right, with no main bottom navigation.

The Counselor shell may be denser than the Student shell.

#### 3.1.5 Primary Dashboard Question

The Dashboard must clearly answer `Who needs my attention now?` Priority therefore favors unresolved Student issues, missing planning work, new reports, incomplete execution, due Follow-ups, upcoming Sessions, and important unread communication over passive statistics.

#### 3.1.6 Today Summary

A concise Today Summary may show real indicators such as active Students, Students needing a plan, new Student reports, incomplete or partial Tasks requiring review, unread messages, due Follow-ups, and today's Sessions.

Operational counts must not be fabricated.

#### 3.1.7 Actionable Summary Cards

Summary cards should lead to action. For example, `Students needing plan: 5` should open the relevant filtered work queue. Dead metric cards that display a number without a useful next step should be avoided.

#### 3.1.8 Needs Attention

Needs Attention is a primary Dashboard area. It may surface Students requiring Counselor action because of multiple `PARTIAL` Tasks, several `SKIPPED` Tasks, no report or activity for a meaningful period, missing next planning, weak recent Exam evidence, a due Follow-up, an important unread message, or a planning gap.

Exact thresholds remain implementation-stage choices.

#### 3.1.9 Attention Signals Must Be Explainable

When a Student appears in Needs Attention, the reason must be visible—for example, `3 PARTIAL Tasks` and `2 days without report`. The interface must not show an opaque label such as `High Risk Student` without evidence or introduce a hidden risk score.

#### 3.1.10 No Automatic Student Judgment

The Dashboard may surface factual evidence but must not automatically label a Student lazy, weak, unmotivated, problematic, or failing. Any future evaluative model requires explicit Product Owner approval and defined semantics.

#### 3.1.11 Counselor Work Queue

The Counselor should have a personal operational queue. Possible work includes writing a Student plan, reviewing a report, inspecting a `PARTIAL` Task, preparing compensatory work, replying to a Student, reviewing an Exam, performing a Follow-up, attending a Session, or handling authorized Admin-assigned Counselor work.

The queue represents concrete work requiring Counselor action.

#### 3.1.12 Work Item Context

Each work item must retain sufficient context. A report-review item should identify its Student and Task; a planning item should identify its Student and applicable day or week. Ambiguous tasks without Student or product-object context must not be surfaced.

#### 3.1.13 Work Item Priority

The Dashboard may distinguish urgency or priority through clear, product-defined and rule-based reasons. It must not invent an opaque AI priority score. Exact initial thresholds may evolve during implementation.

#### 3.1.14 New Student Reports

New execution reports should surface Student, Subject or Task, `COMPLETED` / `PARTIAL` / `SKIPPED` Status, Actual Time, Quality /5, and incomplete Curriculum items where applicable. Selecting a report should open its Student and Task context.

#### 3.1.15 PARTIAL Task Visibility

`PARTIAL` Tasks may highlight the Student, Task, completed Curriculum items, and remaining Curriculum items. They are especially relevant for Counselor attention, but `PARTIAL` does not automatically create a compensatory Task. The Counselor decides whether and how to compensate.

#### 3.1.16 SKIPPED Task Visibility

`SKIPPED` Tasks may surface Student, Task, recorded reason where available, date, and context. The Dashboard must not automatically reschedule or penalize the Student.

#### 3.1.17 Planning Required

The Counselor should quickly see Students who need upcoming planning because, for example, the next day or week has no plan, the plan horizon is ending, or planning is incomplete. Exact needs-plan thresholds are implementation-stage choices; visibility of the backlog is core.

#### 3.1.18 Messages

The Dashboard may show unread Student messages, Students waiting for a reply, or urgent contextual communication as a compact summary. It must not embed the complete Chat experience; actions deep-link to Messages or the Student context.

#### 3.1.19 Support / Ticket Boundary

The Counselor Dashboard is not a general Admin support queue. Technical, payment, account, Counselor-change, complaint, and platform-level Tickets belong to their authorized Admin or Support queues. Counselors see only Counselor-relevant work and authorized referral/Ticket states.

#### 3.1.20 Follow-Ups

Due Follow-ups should be visible, such as checking a Student status, reviewing an Exam result, revisiting a plan, or following up after a Session. Section 3.5 defines detailed Follow-up behavior; the Dashboard only surfaces due work.

#### 3.1.21 Sessions

The Dashboard should show today's or upcoming Counselor Sessions. Useful information may include Student, date/time, Session type, upcoming status, and a direct View or action. The full Session workflow belongs to Section 3.5.

#### 3.1.22 Calendar Snapshot

The Dashboard may show a compact schedule or timeline for today, such as a `16:00` Student Session, `17:30` plan review, and `19:00` Online Session. It must not become the complete calendar product.

#### 3.1.23 Student Status Snapshot

A compact Student overview may use contextual operational states such as on track, needs attention, no recent report, planning missing, or incomplete execution. Exact labels may be refined, but simplistic red/yellow/green judgment without supporting context must be avoided.

#### 3.1.24 Student List Is Not Dashboard

The Dashboard may surface selected Students requiring action. Full Student management remains in Section 3.2 and must not be reproduced as a giant Student table inside Dashboard.

#### 3.1.25 Operational Analytics

A small number of useful operational summaries may appear, such as plan execution, `PARTIAL` Task count, Students with no recent activity, or weekly aggregate Study execution. They remain secondary to action queues.

#### 3.1.26 No Fake Analytics

The product must not fabricate active Student counts, report counts, planning backlog, average execution, Session counts, unread messages, or trends. Missing data requires honest empty or unavailable states.

#### 3.1.27 Counselor Dashboard Density

The Counselor interface is more information-dense than Student UI, but density must not mean cramped layouts, unreadable content, table-only presentation, tiny controls, or excessive borders. Preferred characteristics are compact operational cards, structured queues, clear hierarchy, fast scanning, and fewer decorative elements.

#### 3.1.28 No 3D Operational Decoration

Large Student-style 3D character illustrations must not become a primary Counselor Dashboard element. Brand character may remain controlled, but operational information has priority.

#### 3.1.29 Light Mode

The Dashboard uses the canonical KonkourX Light theme with readable hierarchy, compact surfaces, controlled brand accents, and operational clarity. Exact tokens remain governed by `docs/DESIGN_SYSTEM.md`.

#### 3.1.30 Dark Mode

The Dashboard also uses the canonical Dark theme, preserving surface hierarchy, readable tables and queues, clear status differentiation, and subtle brand accents. It must avoid flat black, neon or gaming styling, and indistinguishable panels.

#### 3.1.31 Mobile Dashboard

The preferred mobile priority is:

1. header and hamburger;
2. Today Summary;
3. Needs Attention;
4. today's Work Queue;
5. New Reports;
6. Messages;
7. Sessions and Follow-ups; and
8. secondary analytics.

Desktop multi-column layouts must not be compressed into unreadable mobile grids.

#### 3.1.32 Mobile Action Density

Mobile cards should remain compact and support rapid triage. Huge metric tiles, overly tall Student cards, excessive scrolling, and hidden critical actions must be avoided.

#### 3.1.33 Responsive Behavior

Desktop and mobile preserve the same operational priorities with different structures. Desktop may use richer multi-column or queue layouts; mobile uses stacked priority queues and progressive drill-down. Identical geometry is not required.

#### 3.1.34 Accessibility

The Dashboard must preserve RTL correctness, readable contrast, clear labels, status communication beyond color alone, usable touch targets, keyboard/focus support where relevant, and understandable queue/action labels.

#### 3.1.35 Entitlement / Assignment Boundary

The Dashboard shows only Students and capabilities the Counselor is authorized to access. Unassigned Students must not appear through summary counts or work items. Backend authorization is authoritative.

#### 3.1.36 Counselor Capacity Snapshot

A small workload summary may show real values such as `Active Students: 32` and `Capacity: 40`. This is supporting information; full capacity and workload management belongs to Section 3.6.

#### 3.1.37 Periodic Review Boundary

Counselor periodic review is an Admin or Super Admin function. The Counselor Dashboard must not expose internal management-review flags unless a later design explicitly approves it. Detailed review behavior belongs to Section 3.6 and Admin.

#### 3.1.38 Dashboard → Student Workspace

Dashboard actions should deep-link to the relevant Student context. A Needs Attention item leads to Student Overview; a `PARTIAL` Task leads to Planning/Task context; an Exam concern leads to Student Assessments; and a Message leads to the Student conversation.

Detached parallel workflows must be avoided.

#### 3.1.39 Dashboard → Planning

Planning-required work deep-links to the Student's planning workspace. The Dashboard is not the full plan editor.

#### 3.1.40 Dashboard → Report Review

A new report opens its relevant Task and report context. The Counselor must not need to search manually for the Student and Task again.

#### 3.1.41 Dashboard → Follow-Up

A due Follow-up opens its associated Student and Follow-up context, preserving the relationship across navigation.

#### 3.1.42 Empty States

Honest states include no Students needing attention, no reports to review, no Sessions today, no unread Student messages, and no planning backlog. The Dashboard must not use fabricated operational examples to fill empty space.

#### 3.1.43 Error / Partial Data States

Because the Dashboard aggregates several domains, it should support loading, partial-data, error, and retry states. Failure of one source must not appear as zero operational work without explanation.

#### 3.1.44 Data Recency

Operational information should be current enough for Counselor action. Exact refresh and realtime mechanics remain technical implementation details; the product must not promise realtime behavior unless implemented.

#### 3.1.45 No Activity Surveillance

The Counselor Dashboard is not an employee-surveillance interface. It must not add keystroke tracking, screen tracking, every-click monitoring, or invasive productivity surveillance. Admin operational monitoring is separately governed and intentionally limited.

#### 3.1.46 Dashboard Anti-Drift

Future implementation must not reduce the Counselor Dashboard to generic SaaS metrics, a Student Dashboard copy, decorative charts, placeholder widgets, a giant Student table, a messaging-only page, or a planner-only page.

The canonical priority is:

**Needs Attention + Counselor Work Queue + New Reports + Planning Backlog + Messages / Follow-Ups / Sessions + Small Operational Summary**

#### 3.1.47 Current vs. Future

`APPROVED FUTURE STATE — CORE COUNSELOR DASHBOARD DIRECTION`:

- Today Summary and Needs Attention;
- an actionable Counselor Work Queue;
- Students requiring planning;
- new reports and `PARTIAL` / `SKIPPED` visibility;
- message, Session, and Follow-up summaries;
- a capacity snapshot and small operational analytics; and
- direct deep-linking to Student context.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- richer automated prioritization and attention signals;
- advanced workload intelligence;
- predictive Counselor assistance;
- AI-generated summaries; and
- advanced automation.

These directions do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities require explicit milestone authorization.

#### 3.1.48 Decision Gates

The following product decisions are closed:

- the Counselor Dashboard is operational and action-first, centered on who needs attention now;
- it is denser than Student UI while remaining readable;
- Needs Attention, planning backlog, and new reports are core;
- `PARTIAL` and `SKIPPED` Tasks may surface for Follow-up;
- no compensatory Task is created automatically;
- messages, Follow-ups, and Sessions may surface;
- full Student management remains in Section 3.2 and full Planning in Section 3.3;
- fake analytics and hidden Student risk scores are prohibited;
- invasive employee surveillance is prohibited;
- desktop uses a right-side sidebar;
- mobile uses a hamburger and right-side drawer with no main bottom navigation; and
- canonical Light/Dark support is required.

Remaining implementation-stage choices are limited to:

- exact attention-signal thresholds;
- exact work-item priority rules;
- exact Student-status labels;
- exact Dashboard layout and operational-card design;
- exact calendar snapshot design;
- exact refresh or realtime behavior;
- exact mobile grouping and ordering refinements; and
- future automated-prioritization logic.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

### 3.2 Student Management

Student Management is the Counselor's primary per-Student working surface. It combines an authorized Student List with a persistent Student Workspace so the Counselor can understand the Student's current state and take contextual academic or counseling action.

It is not merely a contact list, read-only profile, CRM record, or generic table. Planning, execution, Curriculum, Study, Assessments, communication, Notes, Sessions, and Follow-ups remain connected to one clear Student context.

#### 3.2.1 Student List

The Counselor has a dedicated list containing only Students they are assigned or otherwise authorized to access. Arbitrary platform Students must not appear; backend assignment and authorization are authoritative.

#### 3.2.2 Student List Purpose

The list supports rapid operational scanning. It should help the Counselor understand who the Student is, the current relationship/status, whether recent action or planning is needed, whether reports or incomplete Tasks need review, whether communication is unread, and whether a Follow-up is due.

It must not overload every row or card with all available metrics.

#### 3.2.3 Student List Filters

Useful conceptual filters may include Student name/search, Grade, educational Track or Stream, Student status, last report/activity, needs planning, needs attention, incomplete execution, unread message, and due Follow-up. Exact controls remain implementation-stage choices; this is not an enterprise CRM-filtering system.

#### 3.2.4 Student List Sorting

Useful sorting may include name, recent activity, attention/action need, planning need, latest report, and unread communication. Exact default ordering remains open, but an opaque AI ordering model must not become core behavior.

#### 3.2.5 Student List Status Signals

Rows or cards may show concise, explainable signals such as needs plan, new report, `PARTIAL` execution, `SKIPPED` execution, unread message, Follow-up due, or no recent activity. A vague `High Risk` label without visible evidence is prohibited.

#### 3.2.6 Student Search

The Counselor should be able to locate an assigned Student quickly. Search operates only within authorized Student scope and must not reveal unauthorized Students.

#### 3.2.7 Student Workspace

Opening a Student enters a dedicated workspace with these canonical conceptual areas:

- Overview;
- Planning;
- Study;
- Assessments;
- Curriculum Progress;
- Messages;
- Private Notes; and
- Sessions.

These areas form one coherent Student context rather than disconnected global pages.

#### 3.2.8 Persistent Student Context

The selected Student must remain clear throughout the workspace. Persistent context may include Student name, Grade or Track, Counselor relationship status, relevant current Plan/access state where appropriate, and important attention state. Exact header design remains an implementation-stage choice.

#### 3.2.9 Overview Tab Purpose

Overview is a compact synthesis answering `What do I need to know about this Student right now?` It may summarize current planning, recent Task execution and Study, released Exam evidence, Curriculum Progress, recent communication, upcoming Session, due Follow-up, and recent Private Note context.

It must not duplicate every detail from every specialized area.

#### 3.2.10 Overview Actions

High-value contextual actions may include entering plan creation or editing, sending a message, adding a Private Note, creating a Session or Follow-up, inspecting a report or Curriculum remainder, and manually creating compensatory work when the Counselor decides it is appropriate. Exact placement remains an implementation-stage choice.

#### 3.2.11 Overview Data Honesty

Overview must not fabricate Study Time, plan execution, Exam results, Curriculum Progress, unread messages, Sessions, Counselor Notes, or attention reasons. Missing data requires an honest state.

#### 3.2.12 Planning Tab

Planning provides this Student's Today and Weekly plan context, planned Tasks, execution state, Curriculum targets, incomplete work, and historical planning state. The full professional planning model remains governed by Section 3.3 and is not redefined here.

#### 3.2.13 Planning Actions

From Student Workspace, the Counselor may enter the planning workflow to create a Task, edit an appropriate future Task, build a daily or weekly plan, inspect execution, or create compensatory work manually. Exact editor behavior belongs to Section 3.3.

#### 3.2.14 Historical Plan Integrity

The workspace preserves historical integrity. The Counselor must not silently rewrite already executed Task targets, finalized Student reports, historical planned Curriculum, or actual execution evidence. Past truth remains preserved.

#### 3.2.15 Study Tab

Study shows the Student's actual Study behavior, potentially including Study history, Actual Study Time, Task-derived Study, Free Study, Subject distribution, Quality /5, recent Study, and planned-versus-actual time. Section 2.3 remains authoritative; no Counselor-specific Study model is created.

#### 3.2.16 Study Source Visibility

The Counselor should be able to distinguish Counselor-planned Tasks, Student Personal Tasks, and Free Study. Their provenance must not be collapsed into an ambiguous log.

#### 3.2.17 Study Detail

A Task-derived Study entry links to its underlying Task/report. Free Study displays its actual source record. The workspace must not duplicate or rewrite either source truth.

#### 3.2.18 Assessments Tab

Assessments presents authorized Practice and Exam evidence such as Exam history, released results, Subject performance, wrong/unanswered counts, Curriculum-linked evidence, and Practice history where useful. It must not bypass result-release rules.

#### 3.2.19 Exam Release Boundary

Counselor visibility respects Exam authorization and release configuration. Not every result is necessarily fully visible in every context; access may depend on Exam ownership or configuration. This section does not invent new release behavior.

#### 3.2.20 Practice vs. Exam

Practice remains learning-oriented and Exam remains assessment-oriented. Student Workspace must preserve their distinct sources and must not merge them into one undifferentiated performance score.

#### 3.2.21 Curriculum Progress Tab

The Counselor should be able to inspect Student progress against canonical Curriculum, including covered, partial, untouched, recently studied, incomplete-related-Task, and available assessment-evidence states. No Counselor-only Curriculum taxonomy or invented nodes are permitted.

**APPROVED FUTURE STATE — پیشرفت تحصیلی:** Subject-level performance belongs in this future Student Workspace area. Study-session counts, actual recorded Study minutes, solved-test totals, completed Task counts, and Curriculum Progress remain separately labeled facts with distinct definitions; they must not be collapsed into a fabricated combined metric. This direction does not authorize implementation or change Roadmap sequencing.

#### 3.2.22 Planned Does Not Equal Covered

A Curriculum area does not become covered merely because the Counselor planned it. Coverage depends on real Student execution and history, consistently with Sections 2.2 and 2.5.

#### 3.2.23 PARTIAL Remainder

For a `PARTIAL` Task, the Counselor must be able to distinguish completed Curriculum execution items from the remainder. Analytics and workspace views must not flatten the whole Task into fully covered.

#### 3.2.24 Compensatory Action

The Counselor may manually create compensatory work for remaining Curriculum content. The Counselor decides whether compensation is needed, when it occurs, which Curriculum remains, and what duration or instruction applies.

`PARTIAL` or `SKIPPED` must never create a compensatory Task automatically.

#### 3.2.25 Messages Tab

Messages provides access to the Student/Counselor conversation using the shared model: contextual messages, supported text/Files/Links, read/unread state, finite retention, and shared Notification integration. Detailed rules remain in Sections 2.7 and 5.1.

#### 3.2.26 Message Context

Messages may reference a Task, Study Report, Exam, Resource, Session, or appropriate Curriculum context. Each message references the canonical underlying object and must not create a detached duplicate.

#### 3.2.27 Support Issue Boundary

Student Workspace does not make the Counselor owner of all Student problems. Technical support, payment/subscription, account/login, Counselor-change, complaints about the Counselor, refunds, and platform or management issues belong to the appropriate Admin, Support, or Ticket route.

#### 3.2.28 Ticket Referral

The Counselor may refer an applicable issue from Student context into the Ticket system while preserving context. Detailed routing and access remain in Sections 3.5 and 5.3; Ticket workflow must not be rebuilt inside Student Workspace.

#### 3.2.29 Private Notes Tab

Each Student may have Counselor Private Notes for internal working context that must not appear to the Student. Examples include a counseling observation, context for the next Session, Follow-up reminder context, or internal academic observation.

#### 3.2.30 Private Note vs. Message

A Private Note is Counselor internal working memory; Chat is conversation with the Student. The two must not be mixed.

#### 3.2.31 Private Note vs. Formal Record

Private Notes are also distinct from Tickets, Session records, and Student Task reports. A generic notes field must not collapse these unrelated systems.

#### 3.2.32 Private Note Privacy

The Student cannot see Counselor Private Notes. Unrelated Admin roles must not browse them casually. Super Admin sensitive access follows the controlled Break-Glass model in Section 0.

#### 3.2.33 Private Note History

Historical Counselor Notes must not be silently overwritten in a way that destroys context. If editing is supported, historical traceability must be preserved without defining a full version-control system here.

#### 3.2.34 Sessions Tab

Sessions provides a Student-specific view of counseling meetings or interactions. Conceptual information may include date/time, type, mode, topic, Counselor note, outcome, and next action. Detailed Session behavior belongs to Section 3.5.

#### 3.2.35 Upcoming Session

The next upcoming Session may be prominent so the Counselor can enter its context without searching globally.

#### 3.2.36 Session History

Previous Sessions may be reviewed for the selected Student. Session history remains distinct from Chat, Private Notes, Tickets, and Task reports.

#### 3.2.37 Follow-Ups

Student-specific Follow-ups may include reviewing a plan tomorrow, checking after an Exam, asking about an incomplete Task, or reviewing a Session outcome later. Detailed Follow-up workflow belongs to Section 3.5.

#### 3.2.38 Action Model

Canonical contextual Counselor actions may include Plan, Message, Private Note, Session, Follow-up, report review, Assessment review, Curriculum inspection, and manual compensatory Task creation. These are counseling actions, not platform-account administration.

#### 3.2.39 Counselor Is Not Admin

Student Workspace must not grant general platform-admin powers. A Counselor does not automatically change platform Roles or subscriptions, grant arbitrary Entitlements, reset passwords, suspend accounts, change payment records, view unrelated Support cases, or arbitrarily alter Counselor assignment.

#### 3.2.40 Counselor Assignment Boundary

The Counselor accesses assigned or otherwise authorized Students. Reassignment to another Counselor is an authorized Admin or management action, not a casual Counselor operation. Exact reassignment workflow belongs to Admin/Counselor Management.

#### 3.2.41 Student Identity vs. Counseling Data

The workspace may show identity and profile information necessary for counseling work but must not expose unnecessary security data such as passwords, session tokens, or internal authentication secrets.

#### 3.2.42 Profile Information

Relevant context may include name, Grade, educational Track, School where applicable, Counselor relationship, and academic information needed for planning. Exact fields remain implementation-stage choices; this section does not invent sensitive requirements.

#### 3.2.43 Student Status

The Counselor may need a practical relationship status such as active, inactive, temporarily paused/unavailable, or counseling relationship ended. Exact taxonomy remains open and must not be confused with platform account suspension.

#### 3.2.44 Counselor-Side Attention Signals

Evidence-based signals may include repeated `PARTIAL` or `SKIPPED`, missing reports, planning gaps, low recent activity, weak released Exam evidence, and overdue Follow-ups. Each signal requires visible evidence; no opaque Student score is authorized.

#### 3.2.45 No Automatic Diagnosis

Counselor tools may surface data but must not automatically conclude that a Student is lazy, has low ability, is unmotivated, cannot learn a Subject, or that a Counselor plan failed. Such semantics require a separately approved future system.

#### 3.2.46 Student Timeline / Recent Activity

Overview may show a concise timeline of meaningful events such as a submitted Task report, recorded Free Study, completed Exam, sent Message, held Session, or created Follow-up. Every Timeline item references its real underlying object rather than creating duplicate activity truth.

#### 3.2.47 Timeline Boundary

The Timeline is a navigation and context surface, not a permanent audit log of every click or UI interaction. Only meaningful Student and Counselor events belong.

#### 3.2.48 File / Resource Context

Where supported, the Counselor may share or reference existing Learning Resources from Student context. The preferred model links to canonical Content rather than creating a duplicate file or Content system.

#### 3.2.49 Entitlement Awareness

The Counselor may need to understand whether a Student can access a capability or Resource before recommending it. Visibility does not grant authority to change commercial Entitlements; granting paid access remains an authorized Business or Admin action.

#### 3.2.50 Organization Context

When authorized, the Counselor may see relevant School or Institute context for the Student. Organization membership remains separate from personal identity and subscription, and unrelated Organization data must not be exposed.

#### 3.2.51 School Counselor Boundary

Future School/Institute staff may use shared Student contexts according to Organization Permissions. The School layer reuses shared Student, Planning, and Assessment engines and must not create a duplicate School Student model.

#### 3.2.52 Student Workspace Navigation

Overview, Planning, Study, Assessments, Curriculum Progress, Messages, Private Notes, and Sessions preserve one selected Student context. Moving between them must not require selecting the Student again. Exact routing remains technical detail.

#### 3.2.53 Deep Links

Dashboard and queue items may deep-link to a specific Student area and object: a `PARTIAL` report to its Planning/Task context, an Exam issue to the relevant Assessment, an unread message to Messages, and a Follow-up to its Student context. Navigation must preserve context.

#### 3.2.54 Mobile Student Workspace

Mobile must remain usable without compressing all desktop tabs and data into dense tables. It may use a compact Student header, horizontally scrollable or menu-based section navigation, stacked summaries, drill-down, and prioritized actions. Exact navigation UI remains open.

#### 3.2.55 Desktop Student Workspace

Desktop may use a denser professional layout with a Student context header, tabs or secondary navigation, summary panels, contextual side areas, and appropriate tables or lists. It must avoid generic CRM appearance.

#### 3.2.56 Accessibility

The workspace must preserve RTL correctness, readable contrast, clear tabs and navigation, state communication beyond color, usable touch targets, keyboard/focus support where relevant, and understandable actions.

#### 3.2.57 Light / Dark

Canonical Light and Dark themes must preserve professional density, hierarchy, readable planning and report states, and clear navigation distinction. Exact tokens remain governed by `docs/DESIGN_SYSTEM.md`.

#### 3.2.58 Data Honesty

The product must not fabricate Student progress, Study history, Exam evidence, Messages, Notes, Sessions, planning state, Curriculum coverage, or attention signals. Missing data requires honest states.

#### 3.2.59 Empty States

Contextual empty states may include no plan, no Study history, no released Assessments, no Messages, no Private Notes, no Sessions, and no Follow-ups for the selected Student.

#### 3.2.60 Error / Partial Data

Because the workspace combines several domains, individual sections may load or fail independently. It should support loading, partial-data, error, and retry states. Failed retrieval must not be represented as a misleading zero state.

#### 3.2.61 Privacy Boundary

Counselor access is broad enough for legitimate work but is not unlimited platform access. Every area remains subject to assignment, Role, Permissions, Organization scope, and sensitive-data rules. Frontend visibility alone is never authorization.

#### 3.2.62 No Duplicate Domain Models

Student Workspace aggregates and acts on shared domain truth. It must not create Counselor-specific copies of Tasks, Study Records, Exams, Curriculum, Messages, Learning Content, or Tickets.

#### 3.2.63 Overview vs. Specialized Tabs

Overview summarizes while specialized areas contain deeper detail. Overview must not grow into one giant all-in-one page containing every Student record.

#### 3.2.64 Student Management Anti-Drift

Future implementation must not reduce Student Management to read-only contact cards, CRM-only profiles, a Student list without working context, one giant table, duplicate domain records, unrestricted Admin access, opaque Student scoring, or automatic compensation.

The canonical model is:

**Authorized Student List → Persistent Student Workspace → Overview + Planning + Study + Assessments + Curriculum Progress + Messages + Private Notes + Sessions / Follow-Ups → Contextual Counselor Actions**

#### 3.2.65 Current vs. Future

`APPROVED FUTURE STATE — CORE STUDENT MANAGEMENT DIRECTION`:

- an assigned Student List with useful search and filters;
- a persistent, active Student Workspace;
- Overview, Planning, Study, Assessments, Curriculum Progress, Messages, Private Notes, and Sessions;
- Follow-up visibility and contextual actions;
- deep links and manual compensatory planning;
- evidence-based attention signals; and
- assignment and Permission boundaries.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- a richer Student Timeline;
- more sophisticated attention signals and Counselor summaries;
- smarter cross-domain insights;
- AI-generated Student briefing;
- advanced workflow automation; and
- Organization-specific enhancements.

These directions do not claim implementation. Actual availability remains governed by `docs/PROJECT_STATE.md`, and future capabilities require explicit milestone authorization.

#### 3.2.66 Decision Gates

The following product decisions are closed:

- Counselor access is limited to assigned or authorized Students;
- the Student List is operational rather than merely a contact list;
- Student Workspace retains persistent Student context and is not read-only;
- its canonical areas are Overview, Planning, Study, Assessments, Curriculum Progress, Messages, Private Notes, and Sessions;
- Counselors may take contextual academic and counseling actions;
- compensatory work is manually created by the Counselor and never automatic;
- Private Notes are Student-hidden and distinct from Chat, Tickets, and Sessions;
- Super Admin sensitive Note access follows Break-Glass rules;
- Planning, Study, Exam, Curriculum, and other areas use shared domain truth;
- Counselors do not receive general Admin authority or casual reassignment power;
- planned Curriculum does not equal covered Curriculum, and `PARTIAL` remainder remains visible;
- opaque Student risk scores and automatic diagnosis are prohibited; and
- School reuses the shared Student model rather than duplicating it.

Remaining implementation-stage choices are limited to:

- exact Student List columns or cards and filter/sort controls;
- exact Student header fields and Overview composition;
- exact Student relationship-status taxonomy;
- exact Counselor Exam visibility where ownership differs;
- exact Private Note edit/history mechanics;
- exact mobile Student Workspace navigation;
- exact Timeline event set;
- exact attention thresholds;
- exact empty-state copy; and
- future AI briefing behavior.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

### 3.3 Professional Planning

Professional Planning is a core Counselor capability for creating, inspecting, adjusting, and following structured academic plans for an assigned Student. It supports precise daily and weekly scheduling, canonical Curriculum targeting, clear instructions, controlled editing, execution visibility, historical integrity, and deliberate compensatory planning.

It is not a generic calendar, checklist, 96-cell spreadsheet, freeform note page, or AI-controlled scheduler.

#### 3.3.1 Canonical Time Foundation

Professional Planning reuses the same 15-minute exact-time contract as Student planning. The 24×4 v1 visualization is a read-only daily Task timeline, not an interactive scheduler. Counselor surfaces may later reuse it in Student Detail or an operational overview, but it is not draggable, resizable, clickable for editing, or used to create or move Tasks.

#### 3.3.2 Task Remains the Planning Object

Task is the primary planning object and may span one or many 15-minute segments. Slots are grid mechanics; the product must not introduce a separate MiniBox domain object or workflow.

#### 3.3.3 Exact Scheduling

A Counselor may assign date, paired exact start/end time, and derived duration, aligned to 15-minute boundaries. Exact windows require `start < end`, positive duration, valid daily range, and no cross-midnight window. Existing date-only historical Tasks may remain without fabricated exact times.

#### 3.3.4 Daily Planning

A Student-specific daily surface should show date, scheduled Tasks, start/end times, Subject, title, Curriculum targets, Task type/origin, available execution state, gaps, and relevant conflicts or overlaps. Precision must not overwhelm the Counselor with grid mechanics.

#### 3.3.5 Daily Timeline

Desktop may reuse the read-only daily timeline to reflect 15-minute precision while visually prioritizing existing Task blocks. Date-only Tasks appear separately and are not artificially positioned. The current Counselor `/planning` shell must not be described as an interactive scheduler.

#### 3.3.6 Weekly Planning

A professional Weekly Planning view should show what is planned per day, workload distribution, open periods, incomplete work, and what needs planning next. Conceptual week navigation is required.

#### 3.3.7 Weekly Desktop Model

Desktop may use a structured seven-day view with Task blocks, time positioning, daily totals, and operational status indicators. It must remain a professional planner rather than a spreadsheet clone.

#### 3.3.8 Weekly Mobile Model

Mobile must not compress seven columns into an unreadable grid. Preferred direction includes a day selector, per-day Task list or timeline, daily totals, compact editing actions, and Task drill-down while preserving the same planning truth.

#### 3.3.9 Task Creation

The Counselor may create an academic Task for an assigned Student with conceptual inputs such as title, instruction, date, start/end time, controlled Task category, Subject context, one or more Curriculum targets, and optional planning context. The Study Task Picker owns recursive checkbox selection without a separate user-facing scope mode. Exact form layout is not locked.

#### 3.3.10 Task Title

A Task may use a human-readable title such as `مطالعه حرکت‌شناسی`. A title complements rather than replaces structured Curriculum targets.

#### 3.3.11 Counselor Instruction

The Counselor may provide human guidance such as `گفتار را کامل بخوان و مثال‌های مشخص‌شده را حل کن.` Instruction is distinct from structured Curriculum references and must not be forced into Curriculum.

#### 3.3.12 Task Type

Planning may distinguish a limited academic category set such as Study, Review, Test/Practice, or Compensatory. Exact taxonomy remains an implementation-stage choice; this section does not authorize a large category system.

#### 3.3.13 Non-Academic Context

Relevant Student non-academic blocks may be visible when they affect realistic planning, without Curriculum mapping. Visibility does not imply Counselor ownership or unrestricted edit authority over personal life blocks; exact boundaries remain implementation-stage choices.

#### 3.3.14 Canonical Curriculum

Academic planning uses canonical Curriculum. A Counselor taxonomy, simplified parallel syllabus, or arbitrary freeform academic tree must not be created.

#### 3.3.15 Multiple Curriculum Targets

One academic Task may target one or multiple canonical Curriculum references. The model must not be simplified to `one Task = one topic`; a single 90-minute Task may legitimately cover several related targets.

#### 3.3.16 Study Task Picker

Counselor `STUDY` Task create/edit uses the same tri-state recursive checkbox Picker as authorized Student flows. Checking a parent selects the complete selectable subtree; partial descendants produce an indeterminate ancestor; search and tree share one state. There is no single/multiple switch and no user-facing `EXACT`/`WHOLE` scope choice.

#### 3.3.17 Historical Target Compatibility

Existing saved `WHOLE` targets keep their historical direct-child meaning. New recursive-subtree persistence uses the separately approved versioned `SUBTREE` contract and must not reinterpret or silently rewrite historical Tasks.

#### 3.3.18 Multi-Target Task Clarity

The Counselor must be able to understand the precise target set for a multi-target Task. Coverage must remain deterministic rather than becoming ambiguous through overlapping selections.

#### 3.3.19 Overlap / Duplicate Target Prevention

Invalid duplicate or overlapping target combinations that create ambiguous execution coverage should be prevented. Exact validation mechanics are technical detail; deterministic planned coverage is the product rule.

#### 3.3.20 Plan Snapshot / Historical Truth

The system preserves what was assigned at the time, including Task content, targets, planned time, and relevant execution checklist or snapshot. Once execution meaningfully begins, past plan meaning must not be silently rewritten and must remain recoverable.

#### 3.3.21 Future Task Editing

The Counselor may appropriately edit future, unexecuted Tasks, including time, date, title, instruction, or Curriculum targets, subject to integrity rules. The exact editable-state matrix remains an implementation-stage choice.

#### 3.3.22 Executed Task Immutability

After meaningful execution or a finalized report, the Counselor must not alter history to make it appear that different content or Curriculum was assigned. Historical truth takes precedence over editing convenience.

#### 3.3.23 Plan vs. Execution

Planned and actual execution data remain distinct and visible. For example, 75 planned minutes, 60 Actual Minutes, `COMPLETED`, and Quality 4/5 may all be simultaneously true. Actual duration must not overwrite planned duration.

#### 3.3.24 Student Execution Visibility

Planning context may show `COMPLETED` / `PARTIAL` / `SKIPPED`, Actual Time, Quality /5, Student Note, Curriculum Coverage, and an available skip reason. These values come from the shared execution record, not a Counselor-specific second truth.

#### 3.3.25 COMPLETED

`COMPLETED` means all assigned academic content was completed. A Task planned for 75 minutes and finished in 60 remains `COMPLETED` when its content is complete; time variance does not redefine Status.

#### 3.3.26 PARTIAL

`PARTIAL` means only part of the assigned content was completed. The Counselor must be able to inspect completed and remaining execution items; an arbitrary percentage is not an adequate substitute.

#### 3.3.27 PARTIAL Remainder

Remaining Curriculum from `PARTIAL` execution stays visible for future human planning decisions and must not disappear after report submission.

#### 3.3.28 SKIPPED

`SKIPPED` means planned academic work was not completed. A recorded reason may be visible, but the product must not automatically penalize, reschedule, or create compensatory work.

#### 3.3.29 Quality /5

The Counselor sees the Student's single Task-level Quality Score /5. No separate Task-level Mastery, Satisfaction, Focus, or Confidence rating is introduced.

#### 3.3.30 Student Note vs. Counselor Instruction

Counselor Instruction records what was requested; Student Note records what the Student reported after execution. They must remain distinct and neither may overwrite the other.

#### 3.3.31 Compensatory Task

The Counselor may deliberately create compensatory work based on `PARTIAL` remainder, `SKIPPED` work, or later academic judgment. Compensation is always a human Counselor decision.

#### 3.3.32 No Automatic Compensation

`PARTIAL` or `SKIPPED` must not automatically create a replacement, make-up, rescheduled, or next-day Task. The system may surface remaining work; the Counselor decides the response.

#### 3.3.33 Compensatory Scope

For manual compensation, the Counselor decides necessity, date/time, duration, instruction, and remaining Curriculum target or targets. The new Task need not reproduce the original exactly.

#### 3.3.34 Compensatory Provenance

Where supported, a compensatory Task remains identifiable as intentional follow-up work and must not appear to have belonged to the original historical plan. Exact presentation remains an implementation-stage choice.

#### 3.3.35 Copy Task

Copying may create a new future planned Task to reduce repetitive work. It must not reuse or rewrite the historical identity of the source execution record.

#### 3.3.36 Copy Day

Copying a day's planning structure is an approved Counselor-productivity direction that may be introduced incrementally. It must not overwrite historical executed days.

#### 3.3.37 Copy Week

Copy-week, planning-template duplication, or prior-structure reuse may later support Counselor productivity. Exact behavior remains open, and historical execution stays untouched.

#### 3.3.38 Repeat / Duplicate

Future-plan duplicate or repeat operations may exist, but advanced recurrence remains extensible and must not obscure direct planning.

#### 3.3.39 Timeline Interaction Boundary

The 24×4 daily timeline is read-only. Desktop and mobile do not use it to drag, resize, create, move, or edit Tasks.

#### 3.3.40 Historical Movement Boundary

Already executed historical Tasks cannot be silently moved. New future work must be created, duplicated, or rescheduled through authorized controls without altering past truth.

#### 3.3.41 Transfer / Move Future Task

A future, unexecuted Task may be moved to another valid day or time. Exact rescheduling semantics remain implementation-stage design and must remain distinct from historical execution.

#### 3.3.42 Personal Task Boundary

Student Personal Academic Tasks remain distinct from Counselor Tasks. Appropriate visibility must preserve provenance rather than silently converting a Student Task into Counselor-authored work.

#### 3.3.43 Student Non-Academic Block Boundary

Personal and non-academic blocks may inform schedule realism but are not Counselor academic Tasks. The Counselor cannot be assumed to have arbitrary rewrite authority; exact interaction rules remain open.

#### 3.3.44 Workload Visibility

The Counselor should be able to inspect real planned academic time, Task count, Subject distribution, free periods, and relevant personal/non-academic blocks to reduce accidental overload.

#### 3.3.45 Workload Is Not Automatic Judgment

Planned load may be described, but the system must not automatically claim a plan is too hard, optimal, or overloaded without an explicitly approved rule or system.

#### 3.3.46 Daily Totals

Daily Planning may show real planned academic time, Task count, and executed time as the day progresses. Totals must not be fabricated.

#### 3.3.47 Weekly Totals

Weekly Planning may show real planned and available actual Study Time, Task counts, `COMPLETED` / `PARTIAL` / `SKIPPED` outcomes, and Subject distribution. These are planning summaries, not a replacement for Analytics.

#### 3.3.48 Subject Distribution

The Counselor may inspect planned-work distribution across Subjects for balance. No automatic perfect-balance score is authorized.

#### 3.3.49 Curriculum Coverage Context

Planning may show canonical Curriculum as covered, partially covered, or untouched to inform future Tasks. Planning intent alone must not rewrite coverage; planned does not equal covered.

#### 3.3.50 Task Creation from Remainder

The Counselor may initiate creation of a new Task from remaining `PARTIAL` Curriculum items. This is a productivity action, not automatic compensation.

#### 3.3.51 Task Creation from Curriculum

Task creation should use the authorized tri-state recursive Picker for canonical Curriculum rather than forcing manual topic text where valid references exist. The Picker layout uses one primary scroll region, search, compact selected count, and `انصراف` / `تأیید` footer actions; final visual styling remains milestone-specific.

#### 3.3.52 Curriculum Search

Curriculum selection may search or browse canonical references while preserving hierarchy and validity. It must not infer or invent educational nodes.

#### 3.3.53 Placement / Node Boundary

The existing Curriculum runtime contains distinct valid reference concepts. Planning must preserve those behaviors rather than substitute a simplified taxonomy; this milestone does not redesign Curriculum runtime.

#### 3.3.54 Plan Preview

A preview or summary before finalizing substantial planning is an acceptable direction where useful. It does not authorize a complex approval workflow.

#### 3.3.55 Save / Publish Boundary

Exact draft, save, and publish semantics remain implementation-stage choices. Student-visible planning state must be deterministic and historical changes controlled, without inventing a heavy publication workflow now.

#### 3.3.56 Plan Templates

Reusable structures such as common weeks, review patterns, or Exam-week patterns remain future/extensible until scheduled. Templates must not create duplicate Curriculum truth.

#### 3.3.57 Batch vs. Cross-Student Group Assignment

Current batch creation means several independent Tasks for one Student; it is not group assignment and should use wording equivalent to `ثبت چند وظیفه برای این دانش‌آموز` if retained.

Future true Group Assignment begins from the Students list, selects multiple Students, issues one bounded atomic assignment command, and creates one independent `DailyTask` lifecycle per Student. A `STUDY` assignment must validate the complete Curriculum selection against every selected Student's authoritative track. Any invalid authorization or target prevents partial creation.

#### 3.3.58 Automation Boundary

Advanced automation is future. The current system does not assume AI-generated complete plans, automatic schedule optimization, automatic compensation, or automatic Curriculum changes. The Counselor remains in control.

#### 3.3.59 AI Planning Boundary

Future AI may offer visible planning suggestions, but it must preserve Counselor control, never silently change plans, and never fabricate Curriculum relationships. No AI planner is authorized as current implementation.

#### 3.3.60 Counselor Authorization

The Counselor may plan only for authorized Students. Backend enforcement is authoritative; hidden lists, route guards, and client-supplied Student identifiers are not sufficient authorization.

#### 3.3.61 School / Organization Reuse

Future School or Institute planning should reuse the shared Planning engine for equivalent Task behavior. Organization Permissions determine who may plan for whom; a duplicate School planning domain is prohibited.

#### 3.3.62 Planner → Student Workspace

Planning operates within persistent Student context. The Counselor should move among Overview, Planning, Study, Assessments, and Curriculum without losing the selected Student.

#### 3.3.63 Planner → Messages

A Task may become message context when the Counselor discusses it with the Student. The message references rather than duplicates Task content.

#### 3.3.64 Planner → Follow-Up

The Counselor may create a future Follow-up connected to planning or execution, such as checking a `PARTIAL` area after an Exam. Detailed behavior remains in Section 3.5.

#### 3.3.65 Planner → Analytics

Small planning-relevant evidence may appear in Planner, while deep Analytics remains in Section 3.4. The editor must not become a full analytics dashboard.

#### 3.3.66 Planner Status Visuals

Restrained semantic treatment may distinguish origin/type and execution state, including future planned, in progress where supported, `COMPLETED`, `PARTIAL`, and `SKIPPED`. Exact colors belong to `docs/DESIGN_SYSTEM.md`; the planner must not become an uncontrolled rainbow.

#### 3.3.67 Status Not Color-Only

`COMPLETED`, `PARTIAL`, and `SKIPPED` require text, icon, label, or another non-color-only distinction.

#### 3.3.68 Mobile Task Creation

Essential planning must remain possible on mobile, although mobile need not copy every desktop productivity affordance. Mobile may use editing sheets, time/day selection, and direct Task actions. The 24×4 daily timeline remains read-only.

#### 3.3.69 Desktop Productivity

Desktop is the primary heavy-planning surface and may provide richer weekly views, multi-column layouts, faster Curriculum selection, and copy/duplicate helpers without becoming cluttered. The 24×4 daily timeline is not a drag/drop creation, move, resize, or edit surface.

#### 3.3.70 Responsive Consistency

Desktop and mobile operate on the same plan truth. They must not create platform-specific Task semantics, statuses, or plan versions; only interaction and layout differ.

#### 3.3.71 Light / Dark

Canonical Light and Dark themes must preserve time structure, Task hierarchy, status clarity, professional density, and readable Curriculum selection.

#### 3.3.72 Accessibility

The Planner must preserve RTL, readable labels, non-color-only status, relevant keyboard/focus support, usable touch targets, and accessible time selection.

#### 3.3.73 Empty States

Honest states include no Tasks today, no weekly plan, no Curriculum target yet, no execution report, and no remaining `PARTIAL` work. Real Student state must not be filled with demonstration Tasks.

#### 3.3.74 Loading / Error States

Planning should handle loading, save error, partial data, conflicts, and retry. A failed save must not appear as a successfully published plan. Exact mechanics are technical detail.

#### 3.3.75 Conflict Visibility

When implemented rules identify an invalid or conflicting schedule, the Counselor needs clear feedback. Exact overlap policy remains open, but Tasks must not be silently lost.

#### 3.3.76 Data Honesty

The Planner must not fabricate execution, Actual Time, Quality, Curriculum coverage, totals, completed Status, or Student availability.

#### 3.3.77 Planning Performance Boundary

Planner supports counseling work but does not score Counselor quality. A hidden Counselor planning score is prohibited; operational performance belongs separately to Section 3.6.

#### 3.3.78 Student Edit Boundary

Counselor-created Tasks remain Counselor-controlled. Students may execute and report but cannot freely rewrite Counselor Curriculum targets, instructions, or plan structure. Any future change-request workflow is separate.

#### 3.3.79 Counselor Edit Boundary

Counselor control remains constrained by historical integrity, Student-owned personal context, authorization scope, and canonical Curriculum validity. Authority does not permit destructive history edits.

#### 3.3.80 Audit / Traceability Principle

Meaningful persisted planning changes affecting accountability should remain attributable where appropriate. Ordinary planning must not become a noisy every-click audit system; detailed Audit policy belongs to Admin.

#### 3.3.81 No Every-Action Logging

Every hover, filter, or temporary UI state does not need an Audit event. Only meaningful persisted changes may warrant traceability.

#### 3.3.82 Professional Planning Anti-Drift

Future implementation must not reduce Professional Planning to a generic calendar, checklist, raw 96-box UI, one-topic-per-Task model, editable history, automatic compensatory scheduler, AI-controlled planner, duplicate Counselor Curriculum, time-based completion, or multiple Task-level rating systems.

The canonical model is:

**Precise Time Plan + Task + Tri-State Recursive Curriculum Picker + Counselor Instruction + Student Execution Evidence + PARTIAL Remainder + Manual Counselor Compensation + Historical Integrity**

#### 3.3.83 Current vs. Future

`APPROVED FUTURE STATE — CORE PROFESSIONAL PLANNING DIRECTION`:

- precise scheduling, read-only 24×4 Daily Timeline, and Weekly Planning;
- Task creation and appropriate future-Task editing;
- title, instruction, multiple Curriculum targets, and the tri-state recursive Study Task Picker, while preserving historical `EXACT`/`WHOLE` meaning;
- planned-versus-actual execution visibility with `COMPLETED` / `PARTIAL` / `SKIPPED`, Quality /5, and `PARTIAL` remainder;
- manual compensatory Tasks;
- controlled future-Task editing outside the read-only 24×4 timeline;
- copy/duplicate productivity direction;
- responsive mobile planning; and
- historical integrity.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- reusable Templates and sophisticated copy-week behavior;
- advanced recurrence and batch/multi-Student helpers;
- advanced workload intelligence;
- AI planning suggestions and optimization suggestions; and
- sophisticated schedule generation.

Future automation must never silently take control from the Counselor. These directions do not claim implementation; actual availability remains governed by `docs/PROJECT_STATE.md` and explicit milestone approval.

#### 3.3.84 Decision Gates

The following product decisions are closed:

- the read-only 24×4 daily timeline, without a raw 96-box interactive UX;
- Task remains the planning object with 15-minute scheduling;
- Daily and Weekly Counselor Planning;
- one or multiple canonical Curriculum targets per Task;
- the tri-state recursive Study Task Picker, with historical direct-child `WHOLE` meaning preserved;
- deterministic target coverage without duplicates or ambiguity;
- Counselor Instruction remains distinct from Curriculum;
- planned and actual data remain separate;
- Student outcomes remain `COMPLETED` / `PARTIAL` / `SKIPPED`, with content—not time—defining completion;
- `PARTIAL` preserves exact remainder;
- one Quality Score /5 only, without Task Mastery, Satisfaction, Focus, or Confidence ratings;
- compensation is manually created by the Counselor and never automatic;
- executed historical planning cannot be silently rewritten;
- future unexecuted Tasks may be adjusted appropriately;
- Students cannot freely edit Counselor Tasks;
- the 24×4 daily timeline is never a drag/drop creation, move, resize, or edit surface;
- mobile preserves the same planning truth with different interaction;
- School reuses the shared Planning engine; and
- advanced AI and automation remain future, with Counselor control preserved.

Remaining implementation-stage choices are limited to:

- exact academic Task-category taxonomy;
- exact overlap and conflict policy;
- exact draft, save, and publish semantics;
- exact future-Task editable-state matrix;
- exact copy-day, copy-week, and recurrence behavior;
- exact visibility/edit authority for Student personal and non-academic blocks;
- exact Plan preview and Planner layout;
- measured resolved-item capacity and rollout evidence for the approved recursive-subtree persistence/resolution architecture;
- exact set of persisted changes requiring traceability;
- exact future Template system; and
- exact future AI-assistance behavior.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

### 3.4 Counselor Analytics

Counselor Analytics is the Counselor's evidence, interpretation, and action layer. It combines real Planning, execution, Study, Curriculum, Practice, and released Exam evidence to explain what warrants attention and support an explicit Counselor response.

The canonical principle is: **Real Student Evidence → Explainable Counselor Insight → Human Counselor Action**. It is not a decorative chart dashboard, hidden scoring or diagnostic system, automated planner, Student Workspace replacement, or Counselor employee-performance system.

#### 3.4.1 Source-of-Truth Model

Analytics consumes shared truth: Planning from Sections 2.2 and 3.3; Study from Section 2.3; Practice and Exam from Section 2.4 and the assessment system; canonical Curriculum; and the shared Communication and Follow-up systems. It does not create parallel record copies.

#### 3.4.2 No Second Analytics Truth

Analytics may aggregate and interpret but must not rewrite Task Status, Study Time, Curriculum Coverage, Exam results, Quality, Student reports, or planning history. Source domains remain authoritative.

#### 3.4.3 Student-Specific Analytics

The Counselor may inspect an assigned Student's plan execution, Study Time, Task outcomes, Quality, Curriculum Progress, Practice and released Exam evidence, recent activity, and attention signals to understand context and act appropriately.

#### 3.4.4 Caseload-Level Analytics

A limited overview across authorized Students may surface low recent activity, repeated `PARTIAL`, upcoming planning needs, weak released Exam evidence, or due Follow-ups. It must never expose platform-wide or unauthorized Student data.

#### 3.4.5 Caseload Analytics Is Operational

Cross-Student Analytics exists to prioritize Counselor work, not to rank Students publicly, build leaderboards, score worth, or produce opaque risk rankings. Section 3.1 may surface a subset; Section 3.4 owns deeper evidence.

#### 3.4.6 Overall Student Summary

A real-data summary may include planned and Actual Study Time, Task counts and `COMPLETED` / `PARTIAL` / `SKIPPED` distribution, average Quality /5, active Study days, meaningful activity gaps, Curriculum Coverage, and released Exam activity or results.

#### 3.4.7 No Arbitrary Overall Student Score

Values such as `Student Score: 72/100`, `Performance Index: 8.4`, or `Risk Score: 63%` are prohibited unless a separately approved future system defines them. Current Analytics uses understandable evidence.

#### 3.4.8 Plan Execution

The Counselor may inspect planned Tasks, outcomes, pending or unreported states where applicable, planned time, and actual time across periods. These are descriptive execution signals.

#### 3.4.9 Completion Is Content-Based

Analytics preserves canonical execution semantics. Seventy-five planned minutes and sixty actual minutes remain `COMPLETED` when all content was completed; Status must not be recalculated from time variance.

#### 3.4.10 PARTIAL Analytics

The Counselor may inspect `PARTIAL` frequency, Subjects, completed Curriculum items, remaining items, and repeated remainder patterns. `PARTIAL` remains item-evidenced rather than an arbitrary percentage.

#### 3.4.11 Repeated PARTIAL Signal

A signal such as `3 PARTIAL Physics Tasks in the last 7 days` may appear only from real execution records. It describes a pattern and must not automatically explain its cause.

#### 3.4.12 SKIPPED Analytics

The Counselor may inspect `SKIPPED` frequency, Subject/context, date, and a recorded reason where available. Repetition may warrant review but must not automatically punish, reschedule, or diagnose.

#### 3.4.13 Missing Report / Activity

Analytics may identify planned Tasks without execution data, no Task report since a real date, or no recorded Study activity for a meaningful period. Exact thresholds remain implementation-stage choices.

#### 3.4.14 Planned vs. Actual

Daily, weekly, Subject-level, or Student-level planned-versus-actual analysis is a time-management signal. For example, 30 planned hours and `24h 20m` actual does not automatically mean poor academic performance.

#### 3.4.15 Time Variance Boundary

Shorter actual time may still accompany `COMPLETED`; longer time is not automatically better execution. Time and content outcome remain distinct.

#### 3.4.16 Study Analytics

Authorized Study evidence may include Actual Study Time, activity count, daily/weekly distribution, Subjects and Curriculum studied, Task-derived and Free Study, Quality /5, and recent Study. Section 2.3 remains authoritative.

#### 3.4.17 Study Source Visibility

Where useful, Analytics distinguishes Counselor-planned Tasks, Student Personal Tasks, and Free Study. Provenance must not disappear into an ambiguous total.

#### 3.4.18 Free Study Evidence

Free Study is legitimate Student activity, not unplanned failure. It may inform Counselor understanding but must not be automatically converted into Counselor planning.

#### 3.4.19 Quality Analytics

The Counselor may inspect recent, average, trending, or Subject-specific Quality /5 values. Quality remains Student self-reported.

#### 3.4.20 Quality Is Not Mastery

Quality /5 is not Mastery, Exam score, objective proficiency, confidence, intelligence, or academic ability. Analytics must not silently convert it into any such construct.

#### 3.4.21 No Second Quality Dimension

Additional Task-level Mastery, Satisfaction, Focus, or Confidence ratings are prohibited. The one Quality /5 decision remains locked.

#### 3.4.22 Subject Analytics

Subject views may combine real Study Time, Task execution, Quality, Curriculum Coverage, recent activity, Practice, released Exam evidence, and incomplete Tasks to explain what is happening in a Subject.

#### 3.4.23 Subject Comparison

The Counselor may compare a Student's own Subjects with context—for example, high Study with weak released Exam evidence in Physics versus moderate Study with strong evidence in Biology. This must not become a simplistic ranking.

#### 3.4.24 Curriculum Analytics

Analytics may show canonical Curriculum areas as covered, partial, untouched, recently studied, repeatedly studied, containing incomplete Task remainder, or associated with authorized Practice or released Exam evidence.

#### 3.4.25 Planned Does Not Equal Covered

Planning a Curriculum item does not cover it. Coverage requires real execution and history; Analytics must not inflate progress from intent.

#### 3.4.26 PARTIAL Curriculum Evidence

When only some execution items are complete, the target scope remains partial. It must not be promoted to fully covered.

#### 3.4.27 Untouched Curriculum

Untouched is a valid state. Gaps must not be filled through inferred Study or fabricated progress.

#### 3.4.28 Curriculum Recency

The Counselor may inspect last Study, Task execution, Practice evidence, or Exam evidence for an area when real data exists. Recency is not Mastery.

#### 3.4.29 Repeated Study Is Not Mastery

`Studied 5 times` is historical activity evidence and does not mean `Mastered`. Repetition count alone cannot establish proficiency.

#### 3.4.30 Assessment Analytics

Authorized and released assessment evidence may include correct, wrong, and unanswered outcomes, applicable scores, Subject performance, Curriculum-linked Question outcomes, available timing, and Exam history. Release and visibility rules remain binding.

#### 3.4.31 Practice vs. Exam Evidence

Practice remains learning-oriented and Exam assessment-oriented. Both may appear, but they must not be silently merged into one score.

#### 3.4.32 Exam Trend

Comparable real Exams may support improvement, decline, or stable-performance trends. Exact comparability methodology remains open; incompatible assessments must not be presented as equivalent.

#### 3.4.33 Exam Drop Signal

A meaningful decline in released comparable Exam evidence may create a descriptive attention signal. The system must not infer its cause automatically.

#### 3.4.34 Study / Exam Relationship

Analytics may compare patterns such as high Study with weak Exam evidence, low Study with weak evidence, high Study with improvement, repeated Study with repeated weak Curriculum evidence, or low Study with strong evidence. These remain descriptive relationships.

#### 3.4.35 High Study / Weak Exam Signal

Substantial Study alongside weak released Exam evidence may warrant Counselor investigation. It does not prove ineffective method, poor ability, bad planning, or lack of focus.

#### 3.4.36 Low Study / Weak Exam Signal

Low recent Study plus weak relevant Exam evidence may also be surfaced factually without diagnosing why.

#### 3.4.37 Study Improvement / Exam Improvement

Where supported, Analytics may state that Study Time increased and comparable Exam performance also improved. It must not automatically claim one caused the other.

#### 3.4.38 No Causal Claims

Correlation is not causation. The Counselor may interpret context professionally, but Analytics must not convert simultaneous changes into an unsupported causal statement.

#### 3.4.39 Attention Signals

Evidence-based signals may include repeated `PARTIAL` or `SKIPPED`, missing reports or Study, declining execution, Exam decline, Study/Exam mismatch, repeated weak Curriculum evidence, explainable load pressure, missing upcoming planning, and overdue Follow-ups.

#### 3.4.40 Explainable Signals

Every signal must answer `Why am I seeing this?` A Physics signal might cite three `PARTIAL` Tasks, two remaining Curriculum items, and weak latest released Exam evidence. Opaque black-box labels are prohibited.

#### 3.4.41 No Hidden Risk Score

Current Analytics does not include a risk score, danger score, failure probability, motivation score, or discipline score. Any future predictive system requires separate Product Owner review.

#### 3.4.42 No Automatic Student Judgment

Analytics must not label a Student lazy, weak, unmotivated, problematic, irresponsible, or incapable. It presents evidence for human interpretation.

#### 3.4.43 No Automatic Counselor Judgment

Student evidence must not automatically conclude that a Counselor plan is bad, Counselor performance is poor, or the Counselor caused a decline. Section 3.6 governs separately reviewed operational performance.

#### 3.4.44 Planned Load Analysis

Real planned time, Task count, Subject distribution, authorized personal/non-academic blocks, and free periods may help the Counselor understand planning pressure.

#### 3.4.45 Overload Signal Boundary

Potential overload may be surfaced only through conservative, explainable rules. One threshold cannot establish that a Student is objectively overloaded; exact thresholds remain open.

#### 3.4.46 Days without Activity

A careful statement such as `No recorded Study activity for 3 days` may appear when data supports it. Absence of tracked Study must not be presented as proof that the Student did nothing.

#### 3.4.47 Missing Data vs. Zero

Missing is not zero. Failed Study retrieval is not `0h`, an unreleased Exam is not `0%`, and unknown report state is not `SKIPPED`. The UI must use unavailable or insufficient states.

#### 3.4.48 Insufficient Data

Too few Study records, one Exam, no comparable history, or no Curriculum-linked evidence may produce `Insufficient data`. Statistical-looking claims must not be generated from tiny datasets.

#### 3.4.49 Time Ranges

Analytics may explore Week, Month, broader periods, and later custom periods. Exact controls remain implementation-stage choices.

#### 3.4.50 Trend Comparisons

This-week versus last-week and recent-versus-previous comparisons may cover Study Time, execution, Quality, and Exam evidence only when periods and data are valid.

#### 3.4.51 Student Self-Comparison

The preferred baseline is generally the Student's own history rather than peer comparison.

#### 3.4.52 No Peer Ranking

Class rank, caseload rank, percentile, national rank, and peer leaderboards require separate Product Owner approval and defined data. They are not authorized here.

#### 3.4.53 Counselor Actions from Analytics

Contextual actions may include Message, Private Note, future-plan adjustment, manual compensatory Task, Follow-up, Session, and inspection of a Task, Exam, or Curriculum area. Exact calls to action remain an implementation-stage choice.

#### 3.4.54 Analytics → Message

The Counselor may message a Student from an analytical context while preserving relevant evidence context. This references shared Communication and does not create a duplicate analytics conversation system.

#### 3.4.55 Analytics → Private Note

The Counselor may create an internal Private Note from evidence. Note privacy and semantics remain governed by Sections 3.2 and 3.5; the Student must not see it.

#### 3.4.56 Analytics → Plan

Analytics may inform an explicit Counselor decision to adjust future workload, add review, change Subject emphasis, or create compensation. Analytics itself must not mutate the plan.

#### 3.4.57 No Automatic Plan Mutation

Analytics must not automatically move Tasks, change times or targets, create compensation, delete Tasks, or rewrite Counselor instructions. The current rule is: Analytics informs; Counselor acts.

#### 3.4.58 Analytics → Compensatory

A signal may expose remaining Curriculum work, after which the Counselor may choose to create a compensatory Task. The signal is not itself a Task and no auto-generation occurs.

#### 3.4.59 Analytics → Follow-Up

The Counselor may create a Follow-up from an insight, such as reviewing Physics after the next Exam. Detailed behavior remains in Section 3.5.

#### 3.4.60 Analytics → Session

The Counselor may decide that evidence warrants a Session. Analytics supports but does not diagnose that decision.

#### 3.4.61 Analytics → Curriculum

The Counselor may drill into the relevant canonical Curriculum area and its Task, Study, and Question evidence. Analytics must not create a separate Curriculum tree.

#### 3.4.62 Analytics → Source Evidence

Insights should link to supporting source records—for example, a repeated-`PARTIAL` signal to its Tasks, an Exam decline to relevant Exams, and low recent Study to Study History.

#### 3.4.63 Drill-Down Model

Where relevant, navigation supports Summary → Subject → Curriculum → underlying Task/Study/Exam evidence. High-level charts must not trap the Counselor away from source context.

#### 3.4.64 Dashboard Relationship

Section 3.1 surfaces high-priority operational signals; Section 3.4 provides deeper trends and evidence. The full experience must not be duplicated across both.

#### 3.4.65 Student Workspace Relationship

Analytics integrates with Section 3.2's persistent Student context rather than creating a separate Student identity or workspace.

#### 3.4.66 Planning Relationship

Section 3.3 owns planning and editing. Analytics reads and deep-links to Planner but never becomes a second Planner.

#### 3.4.67 Communication Relationship

Message, Note, and Follow-up actions use their shared systems. Communication state must not be duplicated inside analytical records.

#### 3.4.68 Counselor Capacity Boundary

Counselor workload and capacity belong mainly to Section 3.6. Section 3.4 focuses on Student evidence and must not become employee analytics.

#### 3.4.69 Privacy / Authorization

Analytics uses only Student data the Counselor is assigned and permitted to access. It must not expose unrelated Students, out-of-scope private data, or hidden Admin investigation information. Backend authorization is authoritative.

#### 3.4.70 Organization Scope

Authorized School or Institute staff may later use shared Analytics within Organization scope. Equivalent Student evidence must not be copied into a separate School analytics truth; Organization aggregate reporting belongs to Section 6.3.

#### 3.4.71 Data Honesty

Study Time, Task outcomes, Curriculum Coverage, Quality, Exam results, trends, signals, inactivity, comparisons, and explanations must never be fabricated. Every insight traces to real evidence.

#### 3.4.72 Explainable Formulas

Derived values must have understandable meanings—for example, plan-execution counts may derive from actual Task statuses. Proprietary-looking black-box numbers without an interpretable basis are prohibited.

#### 3.4.73 Chart Boundary

Charts such as Study Time, planned-versus-actual, Subject distribution, Task outcomes, or Exam trends should appear only when they improve counseling understanding. Decorative charts have no place here.

#### 3.4.74 Charts Are Not the Only Explanation

Important information requires textual or numeric summaries and source drill-down, not chart-only communication. This is also an accessibility requirement.

#### 3.4.75 Mobile Experience

Mobile should prioritize concise Student summary, key signals, Subject cards, Curriculum issues, compact Study/Exam trends, source drill-down, and contextual actions. Dense desktop charts must not simply shrink onto small screens.

#### 3.4.76 Desktop Experience

Desktop may use denser professional composition across summary, attention signals, trends, Subject breakdown, Curriculum detail, and source evidence without becoming a generic BI dashboard.

#### 3.4.77 Accessibility

Analytics must preserve RTL correctness, readable contrast, labels beyond color, accessible chart summaries, clear actions, usable mobile touch targets, and keyboard/focus behavior where relevant.

#### 3.4.78 Light / Dark

Canonical Light and Dark themes must preserve chart readability, dense hierarchy, status clarity, and a professional visual tone. Exact tokens remain governed by `docs/DESIGN_SYSTEM.md`.

#### 3.4.79 Empty States

Honest states include insufficient Study data, no released Exams, no Curriculum evidence, no attention signals, or no recent activity records. Demo analytics must not fill real empty states.

#### 3.4.80 Error / Partial Data

When one source is available and another is not, Analytics should show loading, partial-data, error, and retry states rather than treat the missing domain as zero.

#### 3.4.81 Refresh / Recency

Evidence should be current enough for operational decisions. Exact refresh or realtime technology remains implementation detail, and realtime behavior must not be promised unless implemented.

#### 3.4.82 Analytics History Integrity

Analytics may change as evidence accumulates, but old Task, Exam, and Study records retain their historical integrity and must not be rewritten to simplify current reporting.

#### 3.4.83 Future Automated Insights

Future systems may provide Student briefings, trend summaries, evidence clustering, suggested Follow-ups, or planning considerations. These remain future/extensible.

#### 3.4.84 AI Insight Boundary

Future AI may summarize evidence but must not fabricate it, alter plans silently, invent Curriculum relationships, assert unsupported diagnoses, or replace Counselor judgment. Current Counselor Analytics does not require AI.

#### 3.4.85 Future Recommendations

Future transparent suggestions may invite the Counselor to inspect a Subject or consider review, Follow-up, Session, or compensation. No autonomous action is currently authorized.

#### 3.4.86 Counselor Analytics Anti-Drift

Future implementation must not reduce Counselor Analytics to generic BI charts, opaque risk scores, Student ranking, a hidden Mastery model, time-only scoring, automatic diagnosis, plan rewriting, automatic compensation, employee surveillance, or duplicated source records.

The canonical model is:

**Planning Evidence + Study Evidence + Canonical Curriculum + Practice / Released Exam Evidence → Explainable Signals → Human Counselor Action**

#### 3.4.87 Current vs. Future

`APPROVED FUTURE STATE — CORE COUNSELOR ANALYTICS DIRECTION`:

- Student-specific and limited authorized caseload Analytics;
- Plan execution, planned-versus-actual, Task outcome, Study Time, and Quality /5 trends;
- Subject and Curriculum analysis;
- distinct Practice and released Exam evidence;
- descriptive Study/Exam relationships;
- repeated `PARTIAL` / `SKIPPED`, missing activity/report, and Exam-decline signals;
- explainable attention signals and source drill-down; and
- explicit Message, Note, Plan, Follow-up, and Session actions without automatic action.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- richer automated summaries and evidence clustering;
- predictive systems and AI-generated Student briefings;
- recommended intervention suggestions;
- advanced workload signals; and
- sophisticated cross-domain analysis.

Future systems remain Counselor-controlled. These directions do not claim implementation; actual availability requires `docs/PROJECT_STATE.md` evidence and explicit milestone approval.

#### 3.4.88 Decision Gates

The following product decisions are closed:

- Analytics consumes shared domain truth rather than creating duplicate truth;
- arbitrary overall Student, hidden risk, and hidden Mastery/proficiency scores are prohibited;
- execution Status is content-based and time variance does not redefine completion;
- `PARTIAL` remains evidence-rich with its remainder preserved;
- Study provenance remains visible where useful;
- Quality remains one self-reported /5 dimension and is not Mastery;
- Subject and canonical Curriculum Analytics exist, with planned not equal to covered;
- Practice and Exam remain distinct evidence types and only authorized/released Exam evidence is used;
- Study and Exam may be correlated, but correlation is not causation;
- attention signals are explainable and do not perform automatic diagnosis;
- Student peer ranking is not authorized;
- plan mutation and compensatory Task creation are never automatic;
- Counselor actions are explicit and human-controlled;
- source evidence is drillable;
- Analytics is assignment and Permission scoped;
- Counselor Analytics is not employee surveillance; and
- AI and predictive insight remain future.

Remaining implementation-stage choices are limited to:

- exact plan-execution formulas and attention or inactivity thresholds;
- exact Exam-comparability and trend minimum-data rules;
- exact Subject-summary and Curriculum-analysis presentation;
- exact overload-signal rules;
- exact chart types and filter/time-range controls;
- exact caseload-level and mobile layouts;
- exact insight wording; and
- exact future AI and recommendation behavior.

These choices do not reopen closed decisions or authorize implementation outside an approved milestone.

### 3.5 Communication and Follow-up

Counselor communication and follow-up work preserves five distinct concepts: **Chat** is conversation; **Ticket** is a formal, trackable issue or workflow; **Private Note** is Counselor-only internal memory and context; **Session** is a counseling meeting or interaction; and **Follow-up** is a future action the Counselor intends to perform. These concepts may reference one another but are never interchangeable.

#### 3.5.1 Counselor Communication Purpose

Communication supports the academic and counseling relationship: assigned-Student conversation, planning and execution discussion, Student questions, short feedback, resource sharing, Session preparation or follow-up, and recognition of issues requiring formal referral. It is not a general social messenger.

#### 3.5.2 Authorized Student Scope

A Counselor may communicate only with Students they are authorized to access. Assignment, Role, and Permissions remain authoritative; a Counselor must not discover or message arbitrary platform Students.

#### 3.5.3 Chat

Chat is the normal Student–Counselor conversational channel. Supported message content may include text, images, files, PDF/documents, links, and reply/reference behavior. Voice Messages remain future/extensible rather than a required current capability.

#### 3.5.4 Chat Is Conversational

Chat is lightweight and suited to clarification, planning discussion, Student questions, short feedback, coordination, resource sharing, and Session follow-up. It must not model every formal support issue.

#### 3.5.5 Context-Aware Chat

Messages may reference real shared product objects such as Tasks, Student Reports, daily or weekly Plans, Exams, Exam Results, Study Records, Curriculum context, Resources, and Sessions. The underlying object remains authoritative; Chat must not create a detached duplicate of it.

#### 3.5.6 Context Card

A contextual message may show a compact reference card and action, such as a `PARTIAL` Physics Task with `View Task`, or an Exam with `View Result`. Exact presentation is an implementation-stage decision.

#### 3.5.7 Read / Unread

Chat supports simple read and unread state where appropriate. This does not authorize a complex presence or social-messenger system.

#### 3.5.8 Chat Notification

New Student–Counselor communication uses the shared Notification system and deep-links to the relevant Student conversation or context. Section 5.2 remains authoritative for detailed Notification behavior.

#### 3.5.9 Chat Retention

Ordinary Chat history is finite. The configurable product defaults are approximately six months for messages and three months for attachments. Authorized Admin configuration may change these defaults; they are not immutable constants, and ordinary Chat is not defined as permanently retained.

#### 3.5.10 Retention Exceptions

Ticket history, complaint or investigation records, Audit events, and other formal records may follow separate legal or operational retention. Expiry of ordinary Chat must not silently delete formal Ticket or Audit history.

#### 3.5.11 Chat Attachments

Attachments may expire sooner than message text. An expired or unavailable attachment must have an intentional state rather than an unexplained broken link. Exact type, size, and retention limits remain implementation-stage decisions.

#### 3.5.12 Chat Search

Chat search is future/extensible and, because retention is finite, may search only retained and available history. It is not a current core blocker.

#### 3.5.13 Chat Privacy

Student–Counselor Chat is private relationship data. Ordinary Admin roles must not casually browse conversations. Super Admin sensitive access follows the Section 0 Break-Glass model: authorized permission, explicit reason, attributable access, and an Audit event where applicable.

#### 3.5.14 Chat vs. Ticket

Chat is conversation; Ticket is a formal tracked issue. Not every Chat becomes a Ticket, and Chat must not be the sole mechanism for formal support cases.

#### 3.5.15 When Ticket Is Appropriate

A Ticket is appropriate when an issue requires formal ownership, routing, tracking, escalation, resolution, or support responsibility. Examples include technical, account/login, payment/subscription, refund, Counselor-change, complaint, platform/management, and other formal support issues.

#### 3.5.16 Counselor-Owned Academic Issue

Ordinary Study difficulty, plan clarification, incomplete academic work, planning adjustment, and academic Follow-up may remain in Counselor workflow when appropriate. They do not require unnecessary Admin Tickets.

#### 3.5.17 Counselor Must Not Own All Support

The Counselor does not own technical support, payment/subscription, account/login, refund, Counselor-change, complaint about the Counselor, or platform/management issues by default. These route to the appropriate Admin or Support queues.

#### 3.5.18 Referral from Chat

A Counselor may explicitly refer an issue from Chat or Student context into the shared Ticket system. The referral may include the Student, category, a short Counselor explanation, selected relevant messages, and relevant linked product context. The resulting Ticket becomes the tracked issue.

#### 3.5.19 Selected Message Context

One or more relevant messages may be selected to explain a referral without exposing unrelated conversation history. The entire Chat history must not be copied blindly into every Ticket.

#### 3.5.20 Referral Category

Referral uses the appropriate centrally defined category and queue. Conceptual routes include Academic/Planning to Counselor or academic handling; Technical to Support; Payment/Subscription to Finance/Admin; Account to Support; Counselor-change to Counselor Management/Admin; and Complaint to an authorized Admin or Super Admin. Section 5.3 owns exact routing.

#### 3.5.21 Ticket Is a Central System

The Counselor Workspace does not own a separate Ticket implementation. It uses the shared central system governed by Section 5.3 for Ticket lifecycle, routing, assignment, escalation, formal timeline, and queues. This section defines only the Counselor-facing relationship to Tickets.

#### 3.5.22 Post-Referral Access — Default

After referring a Ticket to another queue, the Counselor does not automatically retain ongoing Ticket details or conversation access, even when they created the referral. The exact default is `NO_ACCESS`.

#### 3.5.23 Why Post-Referral Access Is Restricted

Referral does not justify access to payment discussion, complaint investigation, account-security details, internal Admin conversation, Counselor-change handling, or other sensitive support information. Authorization remains need-to-know.

#### 3.5.24 Post-Referral Access Levels

The closed access concepts are:

- `NO_ACCESS`: the Counselor cannot view ongoing Ticket details or messages;
- `VIEW_ONLY`: the Counselor may view authorized Ticket information but cannot participate;
- `PARTICIPATE`: the Counselor may view and participate because an authorized Admin explicitly allowed it.

#### 3.5.25 Default Is `NO_ACCESS`

Referral defaults to `NO_ACCESS`, never automatically to `VIEW_ONLY` or `PARTICIPATE` merely because the Counselor referred the issue.

#### 3.5.26 Admin-Granted Access

An authorized Admin may explicitly grant `VIEW_ONLY` or `PARTICIPATE` when operationally appropriate. The grant is attributable and auditable; exact permission names remain an implementation-stage choice.

#### 3.5.27 Sensitive Tickets

Complaints about the Counselor, Counselor-change, payment/refund, account/security, and sensitive management Tickets remain hidden from the Counselor by default. Referring the issue does not confer inspection rights.

#### 3.5.28 Referral Status Visibility

Where product policy permits, a Counselor may see only a minimal general state such as referred, accepted/received, or resolved/closed. That state does not imply detailed Ticket access. Exact general-status visibility remains an implementation-stage choice.

#### 3.5.29 Super Admin Ticket Authority

Super Admin has broad authorized Ticket-routing visibility under platform governance and may inspect referral chains and operational handling. Sensitive access remains attributable.

#### 3.5.30 Ticket Access Changes

Meaningful access changes—such as `NO_ACCESS` to `VIEW_ONLY`, `VIEW_ONLY` to `PARTICIPATE`, or revocation—must be attributable and auditable. Ordinary viewing and filtering must not create noisy Audit events.

#### 3.5.31 Counselor Cannot Self-Grant

A Counselor cannot grant themselves `VIEW_ONLY` or `PARTICIPATE`, including for a Ticket they referred. Only an appropriate permissioned Admin role may grant access.

#### 3.5.32 Private Note

A Private Note is Counselor-only internal working context, such as a counseling observation, Student context, reminder for a future Session, or internal academic observation that is not displayed to the Student. Private Notes are never Student-visible.

#### 3.5.33 Private Note vs. Chat

Chat is Student–Counselor conversation; a Private Note is the Counselor's internal memory and context. A Note must never be accidentally sent to the Student.

#### 3.5.34 Private Note vs. Ticket

A Private Note is not a formal support case. Issues requiring routing, ownership, resolution tracking, or Admin action belong in Tickets; Notes must not become hidden support queues.

#### 3.5.35 Private Note vs. Session

A Session record documents a counseling interaction; a Private Note is internal working context. A Session may have its own Counselor Note, but Session records and general Private Notes remain distinct.

#### 3.5.36 Private Note Privacy

Students never see Counselor Private Notes, and ordinary unrelated Admin roles must not casually browse them. Super Admin access follows the controlled Section 0 Break-Glass rules.

#### 3.5.37 Private Note History

Private Notes must not be silently and destructively rewritten. If editing is supported, historical or original context remains traceable where appropriate; this rule does not prescribe a full version-control product.

#### 3.5.38 Session

A Session is a structured Student-specific counseling meeting or interaction, not ordinary Chat. Its information may include Student, date/time, type, mode, topic, Counselor note, outcome/result, and next action. The final field set remains an implementation-stage choice.

#### 3.5.39 Session Mode

Supported counseling modes may include online, phone, in-person, or another approved mode. Exact taxonomy remains open, and Session must not be coupled to the future internal Classroom/video system.

#### 3.5.40 Session Is Not Classroom

Counseling Sessions and educational Live Classroom are distinct. Sessions may be coordinated through external communication or meeting methods; this section does not authorize an internal video platform.

#### 3.5.41 Upcoming Session

The Counselor may see upcoming Sessions for assigned Students in the Counselor Dashboard, Student Workspace, and work queue or calendar as appropriate. All surfaces reference one Session truth.

#### 3.5.42 Session History

The Counselor may review meaningful historical Sessions for an authorized Student. Session history is not Chat history.

#### 3.5.43 Session Outcome

A Session may carry a concise outcome, such as plan adjustment required, Follow-up needed, or Student issue discussed. Long narrative reporting must not be mandatory for every Session.

#### 3.5.44 Session Next Action

A Counselor may explicitly turn Session context into a Follow-up, future plan change, Message, Private Note, another Session, or Ticket referral. The system must not silently create these actions without Counselor intent.

#### 3.5.45 Follow-up

A Follow-up is a future Counselor action—for example, checking the Student tomorrow, reviewing an Exam result next week, revisiting incomplete Curriculum, asking about a Study issue, or reviewing a Session outcome. It is neither a Chat message nor a Student Task.

#### 3.5.46 Follow-up Purpose

Follow-up answers, “What do I need to remember to do later for this Student?” It belongs to the Counselor work queue and workflow.

#### 3.5.47 Follow-up Core Information

A Follow-up may include Student, due date/time, short description, context/reference, status, and an optional origin such as Session, Message, Analytics signal, Task/report, or manual Counselor creation. Exact fields and state names remain implementation-stage choices.

#### 3.5.48 Follow-up Context

A Follow-up preserves why it exists and its Student context—for example, reviewing Physics after the next Exam with references to the Exam and Curriculum area. The product must not create ambiguous context-free reminders.

#### 3.5.49 Follow-up Status

A lightweight state model may support pending, completed, and cancelled/closed where appropriate. Exact names remain open; Follow-up must not become a project-management workflow.

#### 3.5.50 Follow-up → Work Queue

Due Follow-ups appear in the Counselor Dashboard or Work Queue. This operational visibility is a primary purpose of Follow-up.

#### 3.5.51 Follow-up → Message

When a Follow-up is due, the Counselor may choose to message the Student. The system must not automatically send substantive counseling messages without a separately approved workflow.

#### 3.5.52 Follow-up → Session

The Counselor may decide that a deeper discussion requires a Session. This transition is an explicit human decision.

#### 3.5.53 Follow-up → Plan

The Counselor may act on a Follow-up by adjusting future planning. Historical planning integrity remains binding.

#### 3.5.54 Follow-up Is Not Student Task

Counselor Follow-up is Counselor work; Student academic Task is planned Student work. They remain distinct.

#### 3.5.55 Follow-up Is Not Habit

Student Habit semantics must not be reused for Counselor Follow-up. They are separate product concepts.

#### 3.5.56 Message → Private Note

A Counselor may explicitly create internal Note context from a relevant conversation. If implemented, the Note references relevant context rather than silently duplicating the entire private Chat history.

#### 3.5.57 Message → Follow-up

A Counselor may explicitly create a Follow-up from a relevant message or context, such as a Friday reminder after a Student says they will send a result. Exact quick-action UX remains an implementation-stage choice.

#### 3.5.58 Message → Session

A Counselor may schedule a Session from Chat when deeper discussion is needed. Chat and Session remain distinct records.

#### 3.5.59 Message → Ticket

A Counselor may explicitly refer a formal issue from conversational context into a Ticket. This is a transition from Chat to the formal shared workflow, not a reclassification of the Chat thread.

#### 3.5.60 Session → Private Note

A Counselor may create or update relevant internal Note context after a Session. The Session record and general Private Note history must not be merged automatically.

#### 3.5.61 Session → Follow-up

A Session may explicitly produce a future Follow-up, such as checking execution after three days.

#### 3.5.62 Analytics → Follow-up

Section 3.4 may expose evidence that the Counselor chooses to convert into a Follow-up. Analytics never auto-creates Follow-ups unless a separately approved future workflow authorizes it.

#### 3.5.63 Analytics → Message / Session

The Counselor may respond to analytical evidence through a Message, Private Note, Session, Follow-up, or future plan adjustment. Every response is an explicit human action.

#### 3.5.64 No Automatic Intervention

An analytical signal must not automatically message a Student, schedule a Session, create a Ticket, create a Follow-up, or change a Plan. Any future automation requires separate Product Owner approval.

#### 3.5.65 Support Routing Examples

Conceptual routing is Academic/Planning to Counselor; Technical to Support; Payment/Subscription to Finance/Admin; Account/Login to Support/Admin; Counselor-change to Counselor Management/Admin; Complaint to an authorized Admin/Super Admin; School Support to the appropriate Organization/Admin route; and Content issues to the relevant Content/Admin route. Section 5.3 owns exact queue names.

#### 3.5.66 Complaint About Counselor

A complaint about the Counselor is especially sensitive and defaults to `NO_ACCESS` for that Counselor. An authorized Admin or Super Admin handles it; only explicit authorized policy may grant limited access.

#### 3.5.67 Change Counselor Request

A Student's request to change Counselor routes to authorized Counselor Management/Admin, not to the current Counselor. The current Counselor must not automatically see detailed handling or conversation.

#### 3.5.68 Payment / Refund Issue

Payment and refund issues route to Finance/Admin. The Counselor does not need detailed discussion, and post-referral access defaults to `NO_ACCESS`.

#### 3.5.69 Account / Security Issue

Account, login, and security cases route to authorized Support/Admin. Counselors must never receive passwords, session secrets, or security-investigation details.

#### 3.5.70 Technical Issue

Technical platform issues route to Support. A Counselor may supply useful Student and product context but does not become the technical case owner.

#### 3.5.71 Student Visibility of Ticket

The Student receives the appropriate central Ticket/support experience for their formal issue under Section 5.3. Student visibility and Counselor visibility are independent; Counselor access follows the access-level model above.

#### 3.5.72 Ticket Referral Chain

The central Ticket system preserves formal referral and routing history. Counselor-facing behavior must not conceal that referral occurred; Section 5.3 owns the detailed routing timeline.

#### 3.5.73 Access Revocation

An authorized Admin may revoke temporary `VIEW_ONLY` or `PARTICIPATE` access. A prior grant does not make access permanent.

#### 3.5.74 Ticket Participation Boundary

`PARTICIPATE` grants explicit involvement only in that Ticket context. It does not grant access to its queue, unrelated Tickets, or unrelated Admin data.

#### 3.5.75 Counselor Work Queue

Unread Student messages, due Follow-ups, today's Sessions, and academic issues requiring response may enter the Counselor's operational Work Queue. Unrelated Admin support backlog must not be mixed into it.

#### 3.5.76 Calendar Relationship

Sessions and scheduled Follow-ups may appear in Counselor calendar or work scheduling. Calendar presentation must reference the underlying Session or Follow-up rather than creating a second scheduling truth. Exact Calendar UI remains open.

#### 3.5.77 Notification Relationship

Relevant events such as a new Student message, upcoming Session, due Follow-up, or authorized Ticket-participation update use the shared Notification infrastructure. There is no Counselor-only parallel notification engine.

#### 3.5.78 Private Data Minimization

Counselors receive the private Student information necessary for legitimate counseling work, but not unnecessary sensitive platform or account data. Need-to-know authorization remains binding.

#### 3.5.79 Data Honesty

Messages, read state, Ticket state, access level, Private Notes, Sessions, Follow-ups, referral state, and attachment availability must always reflect real product state.

#### 3.5.80 Empty States

Honest states include no Messages yet, no Private Notes, no upcoming Sessions, no Follow-ups, and no Ticket referrals. Fake conversation or history must not be inserted for visual completeness.

#### 3.5.81 Partial Data / Error States

Communication and support surfaces support intentional loading, partial-data, error, and retry states. A failed Ticket fetch must not appear as resolved, and a failed Chat fetch must not appear as no messages.

#### 3.5.82 Mobile Communication

Mobile communication prioritizes Student context, conversation, context cards, attachments, reply, referral, and appropriate Follow-up or Session actions. It must not depend on desktop-only interaction.

#### 3.5.83 Mobile Follow-up / Session

Essential mobile operations include viewing and completing a due Follow-up, creating a simple Follow-up, inspecting a Session, and recording a concise Session outcome. Exact forms remain an implementation-stage decision.

#### 3.5.84 Desktop Experience

Desktop may combine conversation, contextual Student information, Private Note, Session and Follow-up shortcuts, and relevant context links. Normal Counselor Chat must not adopt a generic enterprise-helpdesk aesthetic.

#### 3.5.85 Accessibility

Surfaces preserve RTL correctness, readable conversation, clear read/unread state, accessible attachment actions, non-color-only Ticket and access states, keyboard and focus usability, touch-friendly mobile actions, and clear Session and Follow-up status labels.

#### 3.5.86 Light / Dark

Communication and Follow-up support canonical Light and Dark themes while preserving message hierarchy, distinction of private/internal context, Ticket-referral clarity, and Session/Follow-up readability. Exact tokens remain governed by [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

#### 3.5.87 No General Messenger Drift

Counselor Chat must not expand into a social feed, unrelated groups, public profiles, follower mechanics, reaction-heavy social features, or entertainment messaging. It remains academic and counseling focused.

#### 3.5.88 No Helpdesk Drift

The Counselor Workspace must not become a general platform Support Console. Formal Admin and Support operations belong to Sections 5.3 and 6.1; the Counselor participates only where their role requires it.

#### 3.5.89 No Private-Note Drift

Private Notes must not become Student-visible messages, generic Ticket comments, formal Audit logs, hidden Admin support records, or a substitute for Session history. They remain Counselor internal working context.

#### 3.5.90 No Session Drift

A Session must not become a Chat thread, Live Classroom product, Task, Ticket, or calendar-only placeholder. It remains a counseling interaction record.

#### 3.5.91 No Follow-up Drift

A Follow-up must not become a Student Task, Student Habit, Ticket, recurring productivity engine, or automated intervention. It remains a future Counselor action.

#### 3.5.92 Communication Anti-Drift

The canonical model is Student–Counselor conversation + contextual references + Counselor internal Notes + structured counseling Sessions + Counselor future Follow-ups + formal Ticket referral when needed. `Chat != Ticket != Private Note != Session != Follow-up`, and Ticket access after referral defaults to `NO_ACCESS` unless an authorized Admin explicitly grants `VIEW_ONLY` or `PARTICIPATE`.

#### 3.5.93 Current vs. Future

`APPROVED FUTURE STATE — CORE COMMUNICATION / FOLLOW-UP DIRECTION`:

- Student–Counselor contextual Chat with text, images, files, PDFs/documents, links, replies, read/unread state, finite retention, and shared Notifications;
- explicit Ticket referral with category, selected context, central routing, `NO_ACCESS` by default, explicit Admin grants for `VIEW_ONLY` or `PARTICIPATE`, sensitive-case privacy, and attributable access changes;
- Student-hidden Counselor Private Notes with controlled Break-Glass Super Admin access;
- Student-specific upcoming and historical counseling Sessions with date/time, type/mode, topic, note, outcome, and next-action direction;
- context-aware future Counselor Follow-ups surfaced in the Work Queue and completed through explicit human action.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- Voice Messages and richer retained-history Chat search;
- richer Session tooling and an advanced Counselor calendar;
- automated Follow-up suggestions, AI conversation summarization, AI Session preparation, and advanced routing assistance.

Extensible assistance remains human-controlled and privacy-aware. Inclusion here does not claim implementation or authorize autonomous behavior; actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md) and requires a separately approved milestone.

#### 3.5.94 Decision Gates

Closed decisions:

- Chat, Ticket, Private Note, Session, and Follow-up are distinct;
- Chat is lightweight, contextual, private, and subject to finite, Admin-configurable retention, with approximate defaults of six months for messages and three months for attachments;
- ordinary Admin roles do not casually browse Chat, while Super Admin sensitive access follows Break-Glass controls;
- technical, payment, account, Counselor-change, complaint, and platform issues are not Counselor-owned by default;
- a Counselor may refer selected relevant context into the shared Ticket system but retains no detailed access automatically;
- post-referral access defaults exactly to `NO_ACCESS`; only an authorized Admin may explicitly grant `VIEW_ONLY` or `PARTICIPATE`, and the Counselor cannot self-grant;
- complaints, Counselor-change, and other sensitive Tickets remain hidden from the Counselor by default, and Ticket-access changes are attributable and auditable;
- Private Notes are Student-hidden and distinct from Chat, Ticket, and Session;
- Session is a counseling interaction rather than Chat, Ticket, or Classroom;
- Follow-up is a future Counselor action rather than a Student Task or Habit and appears in Counselor work context;
- analytical signals do not automatically create Messages, Tickets, Sessions, Follow-ups, or Plan changes;
- shared Notifications are reused, and Counselor Workspace does not become a general Support Console.

Remaining implementation-stage choices:

- exact Chat attachment limits and supported types, legally/deployment-appropriate enforced retention, retained-history search UX, and selected-message referral UX;
- exact minimal Ticket-status visibility after referral, access-grant UI, and permission names;
- exact Private Note editing and history mechanics;
- exact Session type/mode taxonomy and required or optional fields;
- exact Follow-up state taxonomy, due-time/reminder UX, Counselor calendar composition, and mobile layouts;
- exact behavior of future AI summarization or assistance, which does not reopen the human-control boundary.

These choices do not reopen any closed product decision.

### 3.6 Counselor Work and Capacity

Work / Capacity helps a Counselor and authorized management understand and manage operational workload. It covers Student capacity, active caseload, remaining capacity, acceptance and work state, daily and weekly work, backlog, Sessions, Follow-ups, planning and report work, limited response-related evidence, and periodic human management review.

The canonical principle is **operational visibility + manageable workload + human management review**, not continuous surveillance, automatic judgment, a sales quota, hidden ranking, quality-verdict engine, or every-click time tracking.

#### 3.6.1 Counselor Capacity

Each Counselor may have a defined maximum intended active Student load. For example, capacity `40`, active Students `32`, and remaining capacity `8` support operational workload management.

#### 3.6.2 Active Students

Active Student count includes Students currently assigned through the relevant active counseling relationship. It excludes unrelated or unauthorized Students, historical relationships, and fake/demo records. Exact relationship-state inclusion remains an implementation-stage choice.

#### 3.6.3 Remaining Capacity

Remaining Capacity derives transparently from configured Capacity minus relevant active assigned Students. The product must not replace this with an opaque availability score.

#### 3.6.4 Capacity Is Operational

Capacity helps prevent accidental overload, control new Student assignment, support Admin and Counselor management, and explain available assignment room. It is not Counselor quality, rank, performance, or compensation.

#### 3.6.5 Admin Capacity Authority

Authorized Admin or Super Admin may increase or decrease Counselor capacity or temporarily freeze new assignment. Capacity is managed product configuration rather than an application-code constant; exact permission names remain an implementation detail.

#### 3.6.6 Counselor Capacity Visibility

The Counselor may understand their own active Student count, configured capacity, remaining room, and whether new Students can currently be accepted. Exact presentation remains an implementation-stage choice.

#### 3.6.7 Acceptance State

The product preserves whether the Counselor is currently accepting new assignments. Accepting and not accepting are distinct from account state: not accepting new Students does not mean the account is suspended.

#### 3.6.8 Working Status

Canonical operational-state concepts include `ACTIVE`, `LEAVE`, `NOT_ACCEPTING`, `SUSPENDED`, and `INACTIVE`. Exact technical enum names may differ, but their operational meanings remain distinct.

#### 3.6.9 `ACTIVE`

`ACTIVE` means operationally active within the authorized Counselor role. It does not mean accepting unlimited Students; Capacity and acceptance still govern assignment.

#### 3.6.10 `LEAVE`

`LEAVE` represents temporary operational absence. Consequences for new assignment, existing Students, Sessions, and handoff remain implementation-stage choices; this section does not authorize a full leave-management system.

#### 3.6.11 `NOT_ACCEPTING`

`NOT_ACCEPTING` means the Counselor should not receive new Student assignments. It does not automatically terminate existing counseling relationships; exact consequences remain open for implementation design.

#### 3.6.12 `SUSPENDED`

`SUSPENDED` is an authorized management restriction stronger than not accepting new Students. Exact consequences must align with Section 0 account/access rules and remain an implementation-stage decision rather than an invented punishment model.

#### 3.6.13 `INACTIVE`

`INACTIVE` means the Counselor is not currently operating as active. Historical counseling records remain preserved and must not be deleted because work state changed.

#### 3.6.14 Status vs. Account Identity

Counselor operational state is distinct from user Identity, platform Role, authentication, and commercial access. Identity history can remain while Counselor work state becomes `INACTIVE`.

#### 3.6.15 New Student Assignment

New assignment respects Counselor authorization, operational state, Capacity, acceptance state, and the relevant Admin workflow. Assignment beyond allowed conditions requires explicit authorized override behavior; exact rules remain an Admin/implementation decision.

#### 3.6.16 Capacity Override Boundary

Authorized management may adjust Capacity or assignment conditions. Meaningful manual overrides remain attributable where appropriate without creating an every-action Audit system.

#### 3.6.17 Daily Work Queue

The Counselor has a contextual Daily Work Queue that helps answer, “What do I need to do today?” Items may include planning needed, reports to review, `PARTIAL` or `SKIPPED` work requiring inspection, unread Student communication, due Follow-ups, today's Sessions, future-plan adjustment, and authorized Ticket participation.

#### 3.6.18 Work Queue Is Contextual

Each work item preserves meaningful Student and source context—for example, review a Physics Task report for a named Student rather than an unexplained numeric record.

#### 3.6.19 Work Queue Sources

The queue may aggregate shared Planning, Student Report, Message, Follow-up, Session, authorized Ticket, and relevant operational records. It references rather than duplicates source-domain truth.

#### 3.6.20 Work Queue Completion

Completing queue work corresponds to the real underlying action: completing a Follow-up changes that Follow-up; reviewing a report uses the supported report/review state; answering a message changes communication state. A disconnected checklist must not drift from domain truth.

#### 3.6.21 Daily Workload Summary

A concise daily summary may show real Students needing action, plans to prepare, reports to review, unread conversations, due Follow-ups, today's Sessions, and relevant backlog. Values must never be fabricated.

#### 3.6.22 Weekly Workload

A weekly view may organize upcoming Sessions, planning responsibilities, due Follow-ups, report or review backlog, active caseload, and scheduled work. Exact weekly presentation remains an implementation-stage choice.

#### 3.6.23 Calendar

A Counselor calendar may present Sessions, scheduled Follow-ups, relevant Counselor events, and other approved scheduled work. It remains a view over underlying records, not a second Session or Follow-up truth.

#### 3.6.24 Workload Counters

Useful counters may include active Students, remaining Capacity, plans needing work, reports awaiting review, due Follow-ups, Sessions, unread Student conversations, and backlog. These are operational indicators, not a scorecard.

#### 3.6.25 Backlog

Backlog is real Counselor work not yet handled, such as unreviewed reports, overdue Follow-ups, required planning, or messages awaiting response. It exists for workload visibility and is not by itself a quality judgment.

#### 3.6.26 Backlog Age

Counselors or authorized management may see how long work has remained pending, such as a Follow-up overdue by two days. This is an operational fact, not automatic evidence of poor Counselor quality.

#### 3.6.27 Response Time

Where meaningful, operational evidence may measure a clearly defined interval such as Student message to Counselor response. Its formula must be specified during implementation; an ambiguous response score is prohibited.

#### 3.6.28 Response Time Is Contextual

Work schedule, leave, message timing, Student context, weekends, holidays, and platform policy may affect response time. It must not automatically become a quality verdict.

#### 3.6.29 Plans Prepared

Operational reporting may count real plans or planning actions completed during a period. This is activity evidence, not inherently a measure of counseling quality.

#### 3.6.30 Reports Reviewed

Real Student reports handled may be counted where a genuine review state exists. Activity count is not a quality score.

#### 3.6.31 Follow-ups Completed

Operational history may show Follow-ups created, completed, and overdue to explain workload. These values must not become a hidden Counselor grade.

#### 3.6.32 Sessions Completed

Real Sessions scheduled, completed, and upcoming may appear in operational reporting. A higher Session count does not automatically mean better counseling.

#### 3.6.33 Active Caseload

Authorized views may combine active Students, Capacity, remaining Capacity, Students needing attention, and planning backlog to support caseload management.

#### 3.6.34 Caseload Complexity

The current product must not invent a proprietary caseload-complexity score. Different Students may require different effort, but advanced workload modeling remains future/extensible.

#### 3.6.35 Counselor Performance Data

Limited operational evidence for authorized human management may include active caseload, planning and report-review backlog, response-related information, Follow-up completion, Session activity, relevant complaints or Tickets, and appropriate work-state history.

#### 3.6.36 No Automatic Quality Score

The system must not produce a final Counselor rating, quality score, grade, good/bad classification, automatic performance tier, or automatic employment recommendation. Management review remains human.

#### 3.6.37 No Good / Bad Counselor Verdict

The product may present understandable evidence but does not decide that a Counselor is good or bad. Authorized human management makes contextual judgments.

#### 3.6.38 Periodic Review

Super Admin or authorized management may conduct periodic Counselor review, supported by a review-needed flag or workflow. This is explicitly human review.

#### 3.6.39 Periodic Review Inputs

Review may consider real workload, backlog, operational responsiveness, planning/report work, Follow-ups, Sessions, complaint or Ticket history, Student-management context, and management observations. The system gathers evidence but does not issue the verdict.

#### 3.6.40 Review Is Not Automatic

The required sequence is evidence → authorized human review → management decision where necessary. Metrics must never flow directly into an automatic score and verdict.

#### 3.6.41 Complaint Evidence

Authorized management may consider relevant complaint or Ticket information while reviewing operations. Review never grants the Counselor access to sensitive complaint details; Section 3.5 Ticket and privacy rules remain binding.

#### 3.6.42 Management Note / Review Record

A management review may preserve a concise administrative result or note. Exact review-record design belongs to Admin implementation and must not create a public Counselor score or profile.

#### 3.6.43 Review Outcomes

Authorized management workflows may support no action, Capacity adjustment, a requested Follow-up, temporary status change, or further investigation. Exact workflow remains an implementation-stage choice; no automated disciplinary engine is authorized.

#### 3.6.44 Counselor Self-View

Counselors may see their own useful Capacity, caseload, backlog, Session, Follow-up, and work-counter information to manage work. Private Admin-only evaluation notes remain hidden unless separately approved.

#### 3.6.45 Admin View

Authorized Admin and Super Admin may have broader Counselor-operations views. Section 6.1 owns detailed Admin UX; this section defines only the operational Counselor concepts.

#### 3.6.46 Counselor Status Management Boundary

Authorized Admin or Super Admin may manage Counselor operational state where appropriate. Counselor self-change or status-request authority is not decided here; no self-service leave or status workflow is implied.

#### 3.6.47 Capacity Management Boundary

Authorized management can adjust Capacity. Whether a Counselor may request a Capacity change remains a later decision; self-edit authority must not be assumed.

#### 3.6.48 New Student Acceptance Boundary

New assignment respects acceptance and work state, but the exact assignment algorithm is not defined. This section does not authorize automatic lead distribution or marketplace behavior.

#### 3.6.49 No Counselor Marketplace

This section does not authorize a public Counselor marketplace, leaderboard, Student shopping or ranking of Counselors, or public Counselor quality scores. Any such direction requires separate Product Owner approval.

#### 3.6.50 No Compensation / Payroll Model

Operational evidence does not define salary, commission, bonuses, penalties, compensation, or payroll. Business and HR rules remain outside scope unless separately approved.

#### 3.6.51 No Every-Click Tracking

Counselor performance must not track every click, tab change, filter, page view, hover, refresh, or cursor movement. The approved direction is limited meaningful operational evidence rather than oppressive surveillance.

#### 3.6.52 No Screen / Keyboard Surveillance

Screen recording, keystroke monitoring, mouse tracking, activity screenshots, time-online surveillance, and presence policing are prohibited as Counselor-performance features.

#### 3.6.53 Meaningful Events Only

Operational evidence comes from meaningful persisted events such as a plan created, report reviewed, Follow-up completed, Session completed, Student message answered, Capacity changed, or Counselor status changed. These events do not all need to become formal Audit events.

#### 3.6.54 Operations vs. Audit

Operations data manages daily work; Audit records important or sensitive actions. For example, Follow-up due belongs to the Work Queue, planning backlog is operational evidence, and an Admin Capacity change may be Audited. Section 6.1 owns detailed Audit policy.

#### 3.6.55 Limited Audit Principle

Meaningful sensitive management changes—such as suspension, manual Capacity change, access/Permission change, or another sensitive management action—may require traceability. Ordinary navigation must not create Audit events.

#### 3.6.56 Counselor Work Data Privacy

Counselor operational and management data is visible only to authorized parties. Students and unrelated Counselors must not receive internal management information.

#### 3.6.57 Student Privacy in Workload Views

Cross-Counselor management views remain permission-scoped. Workload analytics must not expose another Counselor's Students to an unauthorized Counselor.

#### 3.6.58 Organization / School Context

Future School or Institute Counselors reuse the shared Capacity and workload concepts under Organization Permissions. The platform must not build a separate School Counselor engine.

#### 3.6.59 School Management Boundary

An authorized School Manager may later view operations for Organization Counselors. Section 6.3 owns detailed School behavior; it reuses these shared workload concepts.

#### 3.6.60 Dashboard Relationship

Section 3.1 presents the actionable daily summary; Section 3.6 owns deeper Capacity and workload concepts. A second Counselor Dashboard must not be duplicated here.

#### 3.6.61 Student Management Relationship

Section 3.2 owns per-Student work. Section 3.6 may aggregate workload across authorized Students but must not duplicate the Student-management workspace.

#### 3.6.62 Analytics Relationship

Section 3.4 owns Student academic Analytics; Section 3.6 owns Counselor operational workload evidence. Student academic performance must not become a simplistic Counselor performance score.

#### 3.6.63 Communication Relationship

Section 3.5 owns Chat, Ticket relationships, Private Notes, Sessions, and Follow-ups. Section 3.6 may count or surface the workload they create but does not redefine them.

#### 3.6.64 Response-Time Boundary

Response evidence uses clearly defined persisted events rather than arbitrary UI activity. Exact SLA or business rules require later explicit definition.

#### 3.6.65 No Automatic SLA Punishment

Exceeding a response threshold must not trigger automatic Counselor punishment. Operational alerts may exist, but management decisions remain human.

#### 3.6.66 Workload Alerts

Explainable future alerts may identify nearly full Capacity, significant backlog, overdue Follow-ups, a large planning backlog, or upcoming Sessions needing attention. Black-box workload-risk scores are prohibited.

#### 3.6.67 Overload Signal

High workload may be expressed through understandable evidence—for example, Capacity `40`, active `40`, and twelve overdue items—rather than an opaque percentage such as `Workload Risk = 83%`.

#### 3.6.68 Counselor Calendar Boundary

Calendar organizes Sessions, Follow-ups, and other approved scheduled Counselor work. It must not become a generic project-management system.

#### 3.6.69 Counselor Availability

Future scheduling may require Counselor availability, but its exact model remains open. This milestone does not authorize a complex booking or shift-management system.

#### 3.6.70 Empty States

Honest states include no backlog, no Sessions today, no Follow-ups due, no Students waiting for planning, full Capacity with no remaining room, and no pending reports. Operations screens must not display fake work.

#### 3.6.71 Error / Partial Data

Aggregated operational views support intentional loading, partial-data, error, and retry states. Failure of a source must not be represented as zero workload.

#### 3.6.72 Data Honesty

Active Student count, Capacity, backlog, response time, reviewed reports, Sessions, Follow-ups, planning work, performance evidence, complaint history, and Counselor state must always come from real data.

#### 3.6.73 Mobile Experience

Mobile prioritizes a Capacity snapshot, today's work, backlog, Sessions, Follow-ups, and acceptance/work state. Desktop operations tables must not be compressed into unreadable mobile grids.

#### 3.6.74 Desktop Experience

Desktop may combine Capacity summaries, workload counters, backlog, calendar, Work Queue, and operational trends at professional Counselor density. It must not become a BI or HR dashboard.

#### 3.6.75 Accessibility

Surfaces preserve RTL correctness, readable operational labels, non-color-only states, explicit Capacity and status text, usable touch targets, keyboard and focus behavior, and accessible alternatives to dense tables or lists.

#### 3.6.76 Light / Dark

Canonical Light and Dark themes preserve operational readability, status clarity, compact density, and restrained visual hierarchy.

#### 3.6.77 Human Review Principle

The platform may organize evidence for management but never replaces authorized human review with an automatic judgment engine. This is a hard governance rule.

#### 3.6.78 Evidence Does Not Equal Verdict

High backlog or low Session count does not automatically mean a bad Counselor; fast response does not automatically mean a good Counselor; high Student Exam scores do not prove Counselor quality. Evidence always requires context.

#### 3.6.79 Student Outcomes Boundary

Student outcomes may inform human review but must not be automatically attributed to Counselor quality. Student performance has many influences, so a simplistic attribution model is prohibited.

#### 3.6.80 Periodic Review Privacy

Internal management review is not a public Counselor profile. Students do not automatically see review notes, management flags, complaint investigation context, or internal evaluation evidence; Admin Permissions govern internal visibility.

#### 3.6.81 Review Flag

A needs-review state may support periodic or manual review workflow. It is a workflow signal, not an automatic negative classification.

#### 3.6.82 Review Frequency

Review cadence remains open and may later be configured for operations. Monthly, quarterly, or another fixed cadence must not be hardcoded without Product Owner approval.

#### 3.6.83 Future Workload Intelligence

Workload forecasting, Capacity recommendations, backlog summarization, operational anomaly detection, and assignment suggestions remain future/extensible.

#### 3.6.84 AI Management Boundary

Future AI may summarize operational evidence but must not declare a Counselor good or bad, suspend them, change Capacity, reassign Students, infer unsupported motives, or fabricate complaint evidence. Human management retains authority.

#### 3.6.85 Future Assignment Assistance

A future system may transparently suggest which Counselor has room for a Student. It must not silently assign or reassign Students outside an approved workflow.

#### 3.6.86 Work / Capacity Anti-Drift

Work / Capacity must not become employee surveillance, every-click analytics, Counselor ranking, automatic quality scoring, public ratings, payroll, opaque risk scoring, automatic discipline, Student-outcome attribution, or generic project management. The canonical model is Capacity + Active Caseload + Acceptance/Work State + Daily Work Queue + Backlog + Sessions/Follow-ups/Planning/Reports + limited operational evidence + human periodic review.

#### 3.6.87 Current vs. Future

`APPROVED FUTURE STATE — CORE WORK / CAPACITY DIRECTION`:

- Counselor Capacity, active Student count, Remaining Capacity, acceptance state, and distinct operational work states;
- contextual Daily Work Queue, workload counters, backlog, Sessions, Follow-ups, planning/report workload, and limited response evidence;
- authorized Admin Capacity and status management, meaningful-event traceability, and periodic human management review;
- operational evidence without automatic Counselor-quality judgments.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- workload forecasting, Capacity recommendations, assignment suggestions, advanced operational Analytics, advanced Calendar/availability, anomaly detection, AI evidence summaries, and smarter workload balancing.

Future assistance remains transparent and human-controlled. Inclusion here does not claim implementation; actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md) and requires a separately approved milestone.

#### 3.6.88 Decision Gates

Closed decisions:

- Counselor Capacity, active Student count, and Remaining Capacity exist, and authorized Admin may adjust Capacity;
- acceptance state is distinct from account state, while operational states preserve `ACTIVE`, `LEAVE`, `NOT_ACCEPTING`, `SUSPENDED`, and `INACTIVE` concepts;
- a contextual Daily Work Queue, workload and backlog counters, and workload from Sessions, Follow-ups, planning, reports, communication, and authorized Tickets are approved;
- response-related and other operational evidence may exist, but no automatic Counselor-quality score or good/bad verdict is authorized;
- periodic review is performed by Super Admin or authorized human management, with complaint privacy preserved;
- Counselor work metrics do not define payroll, compensation, a public ranking, a marketplace, or Student-outcome attribution;
- every-click, keyboard, screen, cursor, presence, and time-online surveillance are prohibited;
- Operations and Audit remain distinct, and only meaningful or sensitive changes require traceability;
- School and Organization contexts reuse the shared Counselor workload concepts;
- AI and automated management remain future, with human management retaining final authority.

Remaining implementation-stage choices:

- exact active-Student inclusion, Capacity override, and full-Capacity assignment rules;
- exact consequences of `LEAVE`, `SUSPENDED`, and `INACTIVE`, plus authority for Counselor status-change requests;
- exact Work Queue item types and states, backlog formulas, response-time formula, and operational metric set;
- exact periodic-review cadence, record, workflow, outcomes, and Counselor self-view versus Admin-only evidence;
- exact Calendar composition, future availability model, overload thresholds, and responsive layouts;
- exact future Capacity and assignment-recommendation behavior.

These choices do not reopen any closed product decision.

## 4. Learning & Assessment

### 4.1 Question Bank

The Central Question Bank is one reusable, moderated repository of educational Questions. Student Practice, Student Exam Builder, Counselor, Admin, School/Institute, printable Exam, and future Teacher workflows consume this shared source; they must not create role- or surface-specific Question repositories.

The canonical principle is **one shared Question repository → many approved use cases**. Practice and Exam consume Question Bank content but remain distinct experiences, while Learning Content remains a separate teaching/resource system.

#### 4.1.1 Question as a Shared Asset

A Question is a reusable educational asset. Once approved and published, the same canonical Question may support Practice, Exams, Counselor assignment, School Exams, printable Exams, future Homework or Teacher workflows, and collections. Usage context is separate from Question identity.

#### 4.1.2 Who May Author a Question

Every user may conceptually author and submit a Question. Authoring is not limited to Admin, Counselor, or future Teacher roles; a visible but non-primary action such as `تألیف سؤال` may enter the workflow.

#### 4.1.3 Authoring Is Not Automatic Publication

A user-authored Question never becomes official, approved, published, or available in central Practice or Exam pools merely because it was submitted. Appropriate moderation is mandatory.

#### 4.1.4 Authoring Center

An author may have an Authoring Center with New Question, Drafts, Submitted, Under Review, Needs Changes, Approved, Rejected, and Published groupings where relevant. Exact organization remains an implementation-stage choice.

#### 4.1.5 Question Workflow

The conceptual lifecycle is `DRAFT → SUBMITTED → UNDER_REVIEW → NEEDS_CHANGES | REJECTED | APPROVED → PUBLISHED`. Exact technical names may differ, but authoring, review, approval, and publication remain distinct.

#### 4.1.6 `DRAFT`

A Draft may be incomplete and editable by the authorized author. It is neither official nor available to ordinary Question Bank consumers, and Draft status does not imply review.

#### 4.1.7 `SUBMITTED`

Submitted means the author requested review. Submission is not approval and must not place the Question into normal Practice or Exam use.

#### 4.1.8 `UNDER_REVIEW`

Under Review means an authorized Reviewer or Admin is evaluating the Question. It must not be presented to the author as approval.

#### 4.1.9 `NEEDS_CHANGES`

An authorized Reviewer may return a Question for correction. The author may revise and resubmit; exact reviewer-comment mechanics remain an implementation-stage choice.

#### 4.1.10 `REJECTED`

A rejected Question is not accepted for official publication or use. Rejection-reason taxonomy remains open, while historical authorship and review truth must not be deleted.

#### 4.1.11 `APPROVED`

Approved means the Question passed required review. Approval and Publication remain distinct, so an approved Question may await operational publication.

#### 4.1.12 `PUBLISHED`

Published means an approved Question is available for authorized Question Bank uses. Publication is permission-controlled, and review authority does not automatically imply publish authority.

#### 4.1.13 Question Core Content

A Question may include stem/text, answer options, authoritative correct answer, explanation, difficulty, source, author, Curriculum relationships, review/publication state, relevant dates, and supported media. This Product Map does not prescribe storage representation.

#### 4.1.14 Answer Options

Questions support the answer choices needed by approved assessment formats. Current direction is primarily multiple-choice compatible; expansion to additional Question types requires separate approval.

#### 4.1.15 Correct Answer

The Question Bank preserves the authoritative correct answer. Consuming experiences control visibility: Practice may reveal it after an answer, while an active Exam must not.

#### 4.1.16 Explanation

A Question may include an educational explanation for Practice and post-assessment review. If none exists, the product must not fabricate one.

#### 4.1.17 Difficulty

Broad difficulty uses `EASY`, `MEDIUM`, and `HARD`, or equivalent localized labels, for filtering and approved Practice or Exam generation. Consuming surfaces decide visibility; active Exams must not leak difficulty merely because the repository stores it.

#### 4.1.18 Source

A Question may preserve a truthful source or reference, such as authored/original, an Exam/source reference, or an educational source. Exact taxonomy remains open; provenance must never be fabricated.

#### 4.1.19 Authorship

The system preserves who authored or submitted a Question. Later approval by another person does not erase original authorship.

#### 4.1.20 Review Provenance

Meaningful actions—submission, review, approval or rejection, publication, and unpublication—remain attributable. Exact Audit implementation belongs elsewhere, but moderation history must not be anonymous or silently destructive.

#### 4.1.21 Question ↔ Curriculum Relationship

Question ↔ Curriculum is explicitly **many-to-many**. One Question may validly relate to multiple topics, chapters, grades, Curriculum placements, and even Subjects where educationally appropriate. A one-Question-to-one-node model is prohibited.

#### 4.1.22 Multiple Curriculum Links

A Question may carry multiple genuine canonical Curriculum relationships, including interdisciplinary coverage. Every relationship references the shared canonical Curriculum.

#### 4.1.23 Primary Curriculum Link

A Question may optionally designate one Primary Curriculum Link for display, grouping, default categorization, or author/reviewer orientation. Primary is optional.

#### 4.1.24 Primary Link Is Not the Only Link

Primary never means exclusive. It does not invalidate or replace any other legitimate Curriculum relationship in the many-to-many model.

#### 4.1.25 Curriculum Authority

Question Bank reuses the canonical Curriculum and must not create a parallel Question-topic taxonomy, simplified syllabus, invented educational nodes, or duplicate hierarchy.

#### 4.1.26 Curriculum Boundary

Question Bank links Questions to Curriculum but must not transform Curriculum into a knowledge graph, skill ontology, scientific approval system, dependency graph, Question-pattern taxonomy, or Mastery taxonomy.

#### 4.1.27 Cross-Grade / Cross-Subject Validity

Curriculum relationships preserve valid heterogeneous source structures and must not assume every case follows a simple Grade → Subject → Chapter → Topic tree.

#### 4.1.28 Curriculum Link Review

Moderation may inspect whether Curriculum references are canonical, educationally appropriate, incomplete, or incorrect. Exact review UX remains an implementation-stage choice.

#### 4.1.29 Question Review Purpose

Human moderation protects the official Bank by considering correctness, completeness, correct-answer validity, explanation quality, Curriculum mapping, difficulty, duplicate concerns, formatting/media quality, and source/provenance where relevant. This is not a machine-scoring rubric.

#### 4.1.30 Human Review

Current moderation is human-controlled. Future AI assistance, if separately approved, remains advisory and must never silently approve or publish Questions.

#### 4.1.31 No Scientific Governance Engine

Moderation is practical product governance, not an AI scientific reviewer, scientific approval graph, formula-governance engine, educational knowledge package, skill taxonomy, or Question-pattern ontology.

#### 4.1.32 Reviewer Permissions

Moderation uses shared RBAC plus fine-grained Permissions. Illustrative capabilities include view, create, edit, review, approve, reject, publish, and unpublish; exact names may differ, and no contributor automatically receives all of them.

#### 4.1.33 Dynamic Question-Bank Roles

Authorized Admin may compose roles from existing Permissions, such as Contributor, Question Reviewer, Question Admin, or Content/Question Moderator. Labels are illustrative and staffing structure must not be hardcoded.

#### 4.1.34 Author vs. Reviewer

Authorship and review authority are separate. A person may have one or both through Permissions, while submitting a Question never grants approval authority.

#### 4.1.35 Reviewer vs. Publisher

Review or approval and publication authority may also be separate. The model preserves permission separation without forcing every action into one Admin role.

#### 4.1.36 Admin Question Management

Authorized Admin roles may search, filter, operate the review queue, moderate, approve or reject, publish or unpublish, review Curriculum links, investigate duplicates, and inspect history. Section 6.1 owns detailed Admin UX.

#### 4.1.37 Review Queue

A moderation queue supports submitted/reviewable Questions and may filter by state, author, Subject, Curriculum, difficulty, submission date, and reviewer or assignment where applicable. Exact mechanics remain open.

#### 4.1.38 Question Search

Authorized users may search or browse according to permitted use, potentially by text, Subject, Curriculum, difficulty, state, source, author where appropriate, and later usage context. Search always respects access and Permissions.

#### 4.1.39 Duplicate Questions

Moderation may identify potential duplicate or similar Questions. An opaque similarity score must never automatically reject or delete a Question; a human Reviewer decides. Detection tooling remains future/extensible.

#### 4.1.40 Media / Formula Extensibility

Question content remains extensible to images, mathematical formulas, tables, and diagrams. Initial tooling need not support every rich-media case but must not permanently block them.

#### 4.1.41 Question Version Integrity

Published or historically used Questions require integrity. Later edits must not silently change the meaning of past Exams or attempts.

#### 4.1.42 Historical Exam Snapshot

An Exam preserves the Question content, options, correct answer, and analysis meaning used at that historical version. Later canonical edits do not retroactively alter it; technical implementation belongs to architecture.

#### 4.1.43 Question Revision

Approved or published Questions may need typo, explanation, mapping, answer, or source corrections. Current canonical editing remains distinct from rewriting historical usage.

#### 4.1.44 Material vs. Minor Edit Boundary

Exact minor-edit versus new-revision rules remain an implementation-stage choice. The closed rule is that historical Exam and Practice truth never silently mutates.

#### 4.1.45 Unpublish

Authorized Admin may unpublish a Question to prevent future normal use. Unpublishing must not delete historical Exam attempts that used it.

#### 4.1.46 Archive / Retire

A Question may need an archived or retired operational state. Exact naming remains open, while historical references remain valid.

#### 4.1.47 Delete Boundary

Historically used Questions must not be destructively deleted in a way that breaks Exam history, Practice history, provenance, Audit, or analysis. Exact archival and deletion policy remains open.

#### 4.1.48 Question Usage

A published Question may support Practice, Student self-Exam, Counselor-generated Exam, Admin Exam, School Exam, printable Exam, and future Teacher use through the central Bank.

#### 4.1.49 Practice Consumption

Practice consumes approved/published central content. Section 4.2 and Student Section 2.4 own Practice behavior and feedback timing.

#### 4.1.50 Exam Consumption

Exam consumes approved/published central content. Section 4.3 and Student Section 2.4 own Exam behavior and active Exam UX.

#### 4.1.51 Printable Exam Consumption

Printable Exam generation uses the same central Question Bank. A separate PDF Question repository is prohibited.

#### 4.1.52 Counselor Consumption

Authorized Counselor workflows may consume Questions for appropriate Student academic work. Consumption does not grant moderation Permissions; exact selection workflow remains open.

#### 4.1.53 School Consumption

Future School/Institute workflows reuse the central Bank. Organization access and commercial rights remain distinct from Question identity, and School receives no duplicate repository.

#### 4.1.54 Future Teacher Consumption

Future Teacher workflows may use the central Bank rather than a Teacher-specific repository.

#### 4.1.55 Question Collections

Authorized users may eventually organize references into saved collections, selected sets, or Exam sets. Exact model remains open; Collection is not Question identity.

#### 4.1.56 Student Personal Bookmarks

Student bookmark, wrong-answer, and review lists reference central Questions and never create copies.

#### 4.1.57 Question Reporting

A user may report a possible wrong answer, typo, broken image, or problematic explanation through a future/current supported workflow. A report does not automatically unpublish the Question.

#### 4.1.58 Question Bank Commercial Model

Actual Question Bank consumption is intended as a paid capability. Full access is not permanently free or automatically granted to every Student.

#### 4.1.59 Marketing Sample / Trial

Configurable sample or trial access may be offered later without changing the paid-product direction. No free daily quota is assumed or hardcoded.

#### 4.1.60 Entitlement-Based Access

Consumption uses Effective Access, conceptually including `question_bank.access`, rather than hardcoded commercial Plan names. Additional capabilities may use separate Entitlements.

#### 4.1.61 Authoring vs. Paid Consumption

Broad authoring and submission do not grant full paid Question Bank consumption. Authoring Permission and consumption Entitlement are separate.

#### 4.1.62 Review Permission vs. Commercial Access

Moderation authority derives from Role and Permissions, while consumption derives from Entitlement. These concepts must never be merged.

#### 4.1.63 Backend Authority

Server-side enforcement governs access and moderation. Hidden buttons, frontend-only routes, or client-supplied Role and approval claims are insufficient.

#### 4.1.64 Official Question Boundary

Only the appropriate approved and published state enters official central pools. Draft, Submitted, Needs Changes, and Rejected Questions must not enter normal Practice or Exam generation.

#### 4.1.65 Question Authoring UX

Normal contributors use human-readable Curriculum selection or search rather than internal identifiers. Exact authoring UI remains an implementation-stage choice.

#### 4.1.66 Question Preview

Authors and Reviewers may preview presentation. Preview remains distinct from publication.

#### 4.1.67 Validation Before Submission

Authoring validates required product information before submission without imposing an invented, excessive checklist. Exact required fields remain open.

#### 4.1.68 Review Feedback

Where appropriate, Reviewers explain Needs Changes or rejection so authors do not have to guess. Exact feedback and history UX remains open.

#### 4.1.69 Resubmission

A Question in Needs Changes may be revised and resubmitted. Historical review context must not be silently erased.

#### 4.1.70 Approved Question Edit Authority

Editing approved or published Questions requires appropriate Permission. Original authors do not retain unrestricted mutation authority automatically.

#### 4.1.71 Moderation Conflict Boundary

Reviewer assignment, simultaneous editing, review locking, and conflict resolution remain implementation-stage choices and are not invented here.

#### 4.1.72 Question Bank Analytics Boundary

Supportive operational information may later include usage, Questions by Subject, review backlog, reports, and publication counts. This does not authorize a large BI system.

#### 4.1.73 Question Performance Data

Future answer distributions or similar evidence may support review and assessment analysis, but statistics must not automatically determine correctness, quality, publication, or difficulty without human rules and review.

#### 4.1.74 Difficulty Revision

Authorized roles may later revise difficulty based on evidence and review. Student outcomes alone must not automatically rewrite difficulty unless separately approved.

#### 4.1.75 Question Quality Boundary

A universal numerical Question Quality Score is not a current requirement. Human moderation state is sufficient.

#### 4.1.76 No Public User Rating Requirement

Likes, stars, public ratings, votes, and popularity rankings are not required. Any social or reputation system requires separate approval.

#### 4.1.77 Contributor Reputation Boundary

Current authoring does not introduce automatic Contributor ranks, gamification, leaderboards, or rewards. Future incentives require separate approval.

#### 4.1.78 No Auto-Publish

No Question becomes official because of likes, submission count, AI confidence, contributor status, or elapsed time. Required human moderation and Permission controls remain mandatory.

#### 4.1.79 No AI Auto-Approval

Future AI may assist duplicate detection, formatting review, or suggestions but must not automatically approve or publish Questions. Human governance remains authoritative.

#### 4.1.80 Data Honesty

Author, source, correct answer, explanation, difficulty, Curriculum relationships, review/publication state, usage, Reviewer, and timestamps always reflect real data.

#### 4.1.81 Empty States

Honest states include no Drafts, no Submitted Questions, nothing needing changes, an empty review queue, and no results for the selected filters. Fake Questions must not fill product screens.

#### 4.1.82 Error / Partial Data

Question Bank supports intentional loading, validation errors, save or submission failure, review conflict, unavailable media, and retry states. Failed publication must never appear successful.

#### 4.1.83 Accessibility

Authoring, review, and browsing preserve RTL correctness, readable Questions and options, keyboard/focus behavior, clear validation, accessible Curriculum selection, non-color-only states, and usable touch targets.

#### 4.1.84 Mobile Experience

Mobile supports appropriate browsing, search, Practice consumption, and feasible simple authoring or review. Heavy moderation may favor larger screens, but Question semantics never differ by device.

#### 4.1.85 Desktop Experience

Desktop may provide a Question editor, Curriculum selector, review panel, history/provenance, and side-by-side preview. Exact layout remains open.

#### 4.1.86 Light / Dark

Canonical Light and Dark themes preserve Question readability, option clarity, workflow-state clarity, review density, and restrained brand language.

#### 4.1.87 Privacy / Author Visibility

Internal authorship provenance is preserved even if a Student-facing surface does not display author identity. Exact public visibility remains an implementation-stage decision.

#### 4.1.88 Question Bank ≠ Practice UX

Question Bank is the repository; Practice is a learning-session experience. The Bank must not be designed as if it is always Practice Mode.

#### 4.1.89 Question Bank ≠ Exam UX

Question Bank is the repository; Exam is assessment execution. Repository metadata that an active Exam intentionally hides must not leak into Exam UX.

#### 4.1.90 Question Bank ≠ Curriculum

Question Bank references but does not own or redefine the fixed canonical Curriculum map.

#### 4.1.91 Question Bank ≠ Learning Content

Question Bank stores Questions for Practice and Assessment, while Learning Content stores teaching and resources. Both may link to Curriculum but remain separate systems.

#### 4.1.92 School Reuse

School/Institute uses the shared Bank with Organization access, School Exam workflows, printable Exams, and authorized staff. It receives no duplicate repository.

#### 4.1.93 Print Integrity

Printable Exams use preserved Question content. Later Question updates must not silently alter the meaning of a historical generated or assigned Exam; Section 4.3 and School implementation own PDF details.

#### 4.1.94 Question Bank Anti-Drift

Question Bank must not become Admin-only static CRUD, a one-Question-one-Curriculum model, separate Practice/Exam/School repositories, unmoderated publishing, AI auto-approval, destructive editing, hardcoded Plan access, a Curriculum knowledge graph, or a social popularity system. The canonical model is broad authoring + human moderation + Permission-controlled approval/publication + central reusable Questions + many-to-many canonical Curriculum links + optional Primary Link + historical integrity + Entitlement-controlled consumption.

#### 4.1.95 Current vs. Future

`APPROVED FUTURE STATE — CORE QUESTION BANK DIRECTION`:

- one shared central Question Bank with broad authoring/submission and an Authoring Center;
- Draft, Submitted, Under Review, Needs Changes, Rejected, Approved, and Published lifecycle concepts under human moderation;
- multiple-choice-compatible Questions with options, correct answer, explanation, Easy/Medium/Hard difficulty, source, authorship, and provenance;
- many-to-many canonical Curriculum relationships with an optional non-exclusive Primary Link;
- Permission-driven review and publication, search/filter/review queues, and version/history integrity;
- shared Practice, Exam, Counselor, printable Exam, School, and future Teacher consumption;
- paid, Entitlement-controlled consumption separated from authoring and moderation authority.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- richer Question types and media/formula tooling;
- advanced duplicate assistance, statistics, authoring productivity, Analytics, separately approved contributor incentives, AI moderation assistance, and future Teacher workflows.

Future AI and automation remain subordinate to human moderation. Inclusion here does not claim implementation; actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md) and requires a separately approved milestone.

#### 4.1.96 Decision Gates

Closed decisions:

- the Question Bank is one central shared repository reused by Practice, Exam, printable Exam, Counselor, School, and future Teacher workflows;
- every user may conceptually author or submit, but submission never means automatic approval or publication;
- the lifecycle distinguishes Draft, Submitted, Under Review, Needs Changes, Rejected, Approved, and Published;
- moderation remains human-controlled, with RBAC and fine-grained Permissions separating author, Reviewer, approval, and publication authority;
- Question content preserves options, correct answer, explanation where available, truthful source/authorship/provenance, and broad Easy/Medium/Hard difficulty;
- Question ↔ Curriculum is many-to-many, supports multiple canonical links, and may have an optional non-exclusive Primary Link;
- no parallel Curriculum taxonomy, knowledge graph, scientific-governance engine, or Question-pattern ontology is authorized;
- published Question history cannot silently mutate old Exams, Practice history, or printable Exam meaning, and unpublication or archival preserves historical use;
- Question Bank consumption is paid and Entitlement-based rather than Plan-name-based, while authoring, moderation, and commercial access remain separate;
- unofficial states cannot enter normal central pools, and public ratings, Contributor reputation systems, AI auto-approval, and automatic publication are not required or authorized.

Remaining implementation-stage choices:

- exact authoring fields, state-transition Permissions, Reviewer assignment, approval/publication workflow, and Needs Changes or rejection reasons;
- exact source taxonomy, public author visibility, minor-edit versus new-revision rules, and archive/delete behavior;
- Question-type roadmap, rich-media/formula editor, duplicate tooling, reporting workflow, Collection model, statistics, and difficulty-adjustment policy;
- search/filter UX, mobile authoring/review scope, and future AI-assistance behavior.

These choices do not reopen any closed product decision.

### 4.2 Practice System

Practice is the learning-oriented Question execution engine for active recall, guided practice, immediate educational feedback, repetition, review of mistakes, and Curriculum-targeted solving. It consumes eligible published Questions from the Central Question Bank and never owns a separate Question repository.

The canonical flow is **Practice configuration + central published Questions → Practice Session → answer → immediate educational feedback → Session result, review, and history**. Practice and Exam are intentionally distinct experiences.

#### 4.2.1 Practice vs. Exam

Practice is learning-oriented, information-rich, and feedback-oriented. Exam is assessment-oriented, minimal during the active attempt, and subject to deferred feedback or release rules. They must not become one generic Question screen with superficial mode styling.

#### 4.2.2 Practice Engine Is Shared

Quick, Custom, Wrong Questions, Bookmarks, Review, Counselor-directed, and other approved entry points all use one Practice engine and shared semantics rather than separate execution systems.

#### 4.2.3 Central Question Bank Source

Normal Practice pools use eligible published central Questions. Draft, Submitted, Under Review, Needs Changes, Rejected, or otherwise unavailable Questions must never enter ordinary Student Practice.

#### 4.2.4 Question Version Integrity

Practice history preserves what was actually presented, including stem, options, correct answer, available explanation state, and relevant revision context. Later Question edits cannot silently rewrite a completed historical Session.

#### 4.2.5 Practice Entry Points

Approved directions include Quick, Custom, Subject, Curriculum, Wrong Questions, Bookmarks, Review collections, Counselor-directed Practice where supported, and future system-generated Practice. Not every entry point must ship simultaneously, and future automation must not be presented as implemented.

#### 4.2.6 Quick Practice

Quick Practice reduces configuration friction using a small set of available Student or context defaults. Exact defaults remain open, and Quick does not currently mean opaque AI selection.

#### 4.2.7 Custom Practice

Custom Practice lets the Student intentionally choose Subject, one or multiple Curriculum areas, Question count, difficulty, and timed or untimed behavior. Exact form layout remains open.

#### 4.2.8 Subject Selection

Subject-targeted Practice derives from canonical Curriculum and Question relationships. A Practice-only Subject taxonomy is prohibited.

#### 4.2.9 Curriculum Selection

Practice may target one or multiple canonical Curriculum references. It must not create a duplicate topic taxonomy, simplified tree, or inferred educational nodes.

#### 4.2.10 Multiple Curriculum Areas

One Session may intentionally span multiple Curriculum areas and draw eligible Questions related to any of them. One Practice Session is not limited to one node.

#### 4.2.11 Question Many-to-Many Awareness

Practice respects Question ↔ Curriculum many-to-many relationships. A Question matching multiple requested links appears only once in a Session unless intentional repetition applies.

#### 4.2.12 Primary Curriculum Link Boundary

An optional Primary Link may help display or grouping but is never the only relationship considered for eligibility. All valid canonical links remain meaningful.

#### 4.2.13 Difficulty

Practice uses central `EASY`, `MEDIUM`, and `HARD` metadata, or localized equivalents. A second Practice-specific difficulty system is prohibited.

#### 4.2.14 Mixed Difficulty

Mixed-difficulty composition may be supported where product design requires it. Exact ratios and defaults remain implementation-stage choices rather than fixed percentages.

#### 4.2.15 Question Count

Where the entry mode allows, the Student may choose a desired count. The engine never fabricates Questions; insufficient eligible content is handled honestly through later-defined UX.

#### 4.2.16 Timed Practice

Timed Practice remains Practice. A timer does not turn it into Exam or remove immediate Practice feedback semantics.

#### 4.2.17 Untimed Practice

Untimed Practice supports learning without time pressure. Timed and untimed are configurations of the same engine.

#### 4.2.18 Timer Boundary

Countdown versus elapsed time, pause, background handling, and timeout action remain implementation-stage decisions. Exam restrictions must not be imported merely because Practice is timed.

#### 4.2.19 Practice Session

A Session is one coherent Question-solving activity created from a Practice configuration or source. It preserves origin, selection criteria, presented Questions, answers, and outcomes sufficiently to explain the activity.

#### 4.2.20 Session Source / Origin

Where useful, origin remains identifiable as Quick, Custom, Subject, Curriculum, Wrong Questions, Bookmark, Review, Counselor-directed, or future recommendation/system-generated. Exact names remain open.

#### 4.2.21 Counselor-Directed Practice

Where supported, a Counselor may direct a Student toward Practice using the shared engine and central Bank. Exact assignment workflow remains open; no Counselor-only engine is created.

#### 4.2.22 Practice Question Presentation

Practice presents the Question and answer options and may show appropriate learning metadata. It is intentionally richer than active Exam Mode.

#### 4.2.23 Answer Submission

The Student submits an answer to the current Question, after which Practice may immediately evaluate it. Immediate evaluation is a defining Practice behavior.

#### 4.2.24 Immediate Correctness Feedback

Practice may immediately show Correct or Wrong after submission. This behavior is explicitly prohibited during active Exam Mode.

#### 4.2.25 Correct Answer Reveal

Practice may reveal the correct answer after submission to support learning. Active Exam must not inherit this behavior.

#### 4.2.26 Explanation

If the Question has an approved explanation, Practice may show it after answering. If none exists, the product displays honest absence and never fabricates one.

#### 4.2.27 Curriculum Context After Answer

Real Curriculum relationships may be shown after submission where educationally useful. Invented Curriculum metadata is prohibited.

#### 4.2.28 Difficulty Visibility

Practice may show stored difficulty where product design chooses, unlike active Exam where difficulty is hidden. Exact placement remains open.

#### 4.2.29 Educational Note Boundary

Practice may expose available approved explanation and context. Generated teaching content that does not exist requires separate future AI/content approval.

#### 4.2.30 Practice Question Outcomes

The core outcomes are `CORRECT`, `WRONG`, and `UNANSWERED`. Additional scoring outcomes require Product Owner approval.

#### 4.2.31 `UNANSWERED`

Unanswered means no answer was submitted under supported Session/navigation behavior. It is analytically distinct and must never be silently classified as Wrong.

#### 4.2.32 No Practice Partial Answer Score

Current multiple-choice Practice does not require partial credit or fractional correctness. New Question types would require separate approval of any different scoring.

#### 4.2.33 Next Question

The canonical loop is Question → Answer → Correctness → Correct Answer → available Explanation or review context → Next Question.

#### 4.2.34 Practice Navigation

Appropriate Session movement may be supported, with exact mechanics left to implementation. Active Exam navigation restrictions must not be copied automatically.

#### 4.2.35 Bookmark

A Student may retain a Bookmark reference to the canonical central Question for later review. Bookmarking never creates a Question copy.

#### 4.2.36 Bookmark Persistence

Bookmarks may persist outside the current Session. Exact organization and search UX remain open.

#### 4.2.37 Wrong Questions Collection

Questions answered Wrong may appear through a collection or history backed by the original outcome and canonical Question reference, not a new repository.

#### 4.2.38 Unanswered Collection

Unanswered Questions may be available for later review or retry and remain distinguishable from Wrong Questions.

#### 4.2.39 Review Collection

A review workflow may include Bookmarks, Wrong Questions, Unanswered Questions, and explicitly selected Questions without merging their provenance.

#### 4.2.40 Collection Provenance

One Question may be both Bookmarked and Wrong. The underlying identity remains single while each membership preserves why it exists.

#### 4.2.41 Retry Wrong Questions

Retrying Wrong Questions creates a new Practice Session and new evidence. It never rewrites the original Wrong outcome.

#### 4.2.42 Retry Unanswered Questions

Retrying Unanswered Questions similarly creates new evidence while preserving the original historical outcome.

#### 4.2.43 Review Again

Repeated Practice of saved Questions records new outcomes without mutating previous attempts.

#### 4.2.44 Similar / Related Practice

Additional Questions from relevant Curriculum areas may be offered in a supported or future flow. Exact similarity logic remains future/implementation-stage and does not imply a current embedding recommendation engine.

#### 4.2.45 Question Repetition

Selection should avoid unnecessary immediate repetition when sufficient alternatives exist.

#### 4.2.46 Repetition Is Not Absolutely Forbidden

Repetition remains valid for intentional retry, Wrong/Review flows, a small eligible pool, or future spaced review. The goal is to reduce accidental repetition, not ban a Question forever.

#### 4.2.47 Anti-Repeat Boundary

The anti-repeat window and algorithm remain implementation-stage choices; no permanent arbitrary exclusion rule is authorized.

#### 4.2.48 Session Result

A real end-of-Session summary may include total Questions, Correct, Wrong, Unanswered, accuracy, duration, average time where available, and supported Subject or Curriculum breakdowns.

#### 4.2.49 Accuracy

Accuracy must use a clearly defined formula. Denominator treatment of Unanswered remains an implementation-stage decision and must not be ambiguous.

#### 4.2.50 Result Is Not Mastery

A Practice result does not establish Curriculum Mastery, objective proficiency, long-term knowledge, or Exam readiness. Hidden Mastery inference is prohibited.

#### 4.2.51 Result by Subject

Sessions spanning valid Subject contexts may summarize performance by Subject using only real Question evidence.

#### 4.2.52 Result by Curriculum

Results may relate outcomes to multiple valid Curriculum areas because Question ↔ Curriculum is many-to-many. Single-topic attribution must not be forced.

#### 4.2.53 Curriculum Result Boundary

Practice evidence does not automatically establish Curriculum Study Coverage or Mastery. Study Coverage remains governed by execution and history rules.

#### 4.2.54 Practice History

History may preserve date/time, source, selected Subject/Curriculum, Question count, difficulty, timed/untimed configuration, duration, outcome counts, accuracy, and permitted review access. Exact layout remains open.

#### 4.2.55 Historical Session Integrity

Completed history remains understandable when Question content, difficulty, Curriculum links, or publication status later changes.

#### 4.2.56 Question Unpublish After Practice

Unpublication or archival affects future eligibility but does not invalidate historical Practice evidence.

#### 4.2.57 Question Correction After Practice

Later correction never silently rewrites the Student's original experience. Exact recalculation or correction governance remains open, with historical traceability preserved.

#### 4.2.58 Practice History Drill-Down

Where policy allows, historical review may show Questions, Student answers, Correct/Wrong/Unanswered outcomes, correct answers, and available explanations. This is Practice history rather than Exam release policy.

#### 4.2.59 Practice Data in Analytics

Practice volume, accuracy, Wrong/Unanswered outcomes, and Curriculum-related evidence may feed authorized Analytics with `source = Practice`. It must not be silently merged with formal Exam evidence.

#### 4.2.60 Practice vs. Formal Exam Analytics

Practice and Exam evidence may later be compared but remain distinguishable types. No unified assessment score exists by default.

#### 4.2.61 Counselor Visibility

Where Permissions allow, Counselors may view authorized Student Practice evidence for counseling or analysis but cannot edit historical outcomes.

#### 4.2.62 Counselor Action from Practice

A Counselor may explicitly discuss a Curriculum area, adjust a future Plan, suggest additional Practice, or create a Follow-up based on evidence. Practice does not mutate planning automatically.

#### 4.2.63 No Automatic Compensation

Wrong answers must not automatically create Student or compensatory Tasks, rewrite a Counselor Plan, or schedule Study. Student and Counselor actions remain explicit.

#### 4.2.64 Entitlement

Question Bank Practice consumption is intended as paid access governed by Effective Access and capabilities such as `question_bank.access`, never hardcoded Plan names.

#### 4.2.65 Practice Access and Authoring Are Separate

Authoring or submission Permission does not grant paid Practice consumption. Authoring authority and consumption Entitlement remain distinct.

#### 4.2.66 Entitlement Server Authority

Backend authorization enforces Practice access. Hidden buttons, client Plan labels, and UI-only locked cards are insufficient.

#### 4.2.67 Locked Practice State

A Student without access receives an honest locked state. Exact upsell UX remains open; free access must not be fabricated.

#### 4.2.68 Marketing Sample Boundary

Separately approved sample or trial Practice may exist, but no permanent daily free quota is assumed.

#### 4.2.69 Practice Source Eligibility

Normal selection excludes Draft, pending-review, Rejected, unavailable, or inaccessible Questions.

#### 4.2.70 Insufficient Question Pool

When fewer eligible Questions exist than requested, the system responds honestly rather than inventing Questions, including unapproved content, or secretly broadening the intended Curriculum scope. Exact fallback UX remains open.

#### 4.2.71 Question Selection Transparency

Current selection uses understandable product-defined logic. Opaque AI personalization must not be presented as the current default.

#### 4.2.72 Adaptive Practice

Adaptive Practice remains future/extensible and may later consider Wrong history, Curriculum evidence, repetition, difficulty, or Study/Exam evidence. No algorithm is currently locked.

#### 4.2.73 Spaced Review

Spaced review remains future/extensible. No memory-strength score, recall interval, or spaced-repetition score is currently authorized.

#### 4.2.74 Predictive Question Selection

Predictive selection remains future and must not be presented as current behavior.

#### 4.2.75 AI Practice Boundary

Future AI assistance must not fabricate Questions or explanations, alter Question truth, create fake Curriculum links, or override published correctness without separately approved architecture.

#### 4.2.76 Practice Recommendations

Future explainable recommendations may suggest retrying Wrong Questions, reviewing Unanswered Questions, or practicing a related Curriculum area. Current core does not require an intelligent recommendation engine.

#### 4.2.77 Student Agency

Within available modes and access, Students may intentionally choose what to Practice, count, difficulty, and timed/untimed configuration. Opaque system-generated Practice must not be the only experience.

#### 4.2.78 Counselor-Directed vs. Student-Initiated

Where relevant, Session provenance distinguishes Student choice from Counselor direction rather than erasing operational origin.

#### 4.2.79 School / Organization Reuse

Future School/Institute workflows reuse the shared Practice engine under Organization Entitlements and Permissions. A duplicate School engine is prohibited.

#### 4.2.80 Future Teacher Reuse

Future Teacher workflows reuse the shared engine rather than a Teacher-specific implementation.

#### 4.2.81 Practice Collections

Bookmarks, Wrong Questions, Unanswered, and Review are references and filters over canonical Questions plus historical Student evidence, not separate stores.

#### 4.2.82 Collection Removal Boundary

Removing a Bookmark does not delete the Question, Practice history, or Wrong-outcome history. Membership and historical evidence remain separate.

#### 4.2.83 Wrong History Boundary

A later Correct answer does not erase a prior Wrong outcome. Whether the Question remains in a current active Wrong list is an implementation-stage choice.

#### 4.2.84 Session Abandonment

Resume, abandoned, unfinished, and auto-finalization semantics remain implementation-stage decisions. This section does not invent a heavy lifecycle.

#### 4.2.85 Resume Practice

Future resume behavior may preserve unfinished Sessions, with persistence and expiry rules left open. Resume is not claimed as a closed current requirement.

#### 4.2.86 No Practice Release Policy

Ordinary Practice does not require Exam-style delayed result release. Immediate educational feedback remains defining behavior.

#### 4.2.87 Practice Feedback Is Question-Level

Feedback occurs after each submitted answer, followed by an aggregate Session summary. It is not deferred entirely to Session end.

#### 4.2.88 No Other-User Percentage Requirement

Current Practice does not require answer-choice popularity, peer performance, or user percentages. Such social/statistical features require separate approval.

#### 4.2.89 No Peer Ranking

Practice does not authorize leaderboards, class rank, peer percentile, or national rank.

#### 4.2.90 No Hidden Mastery

Practice history must not generate a Mastery percentage, proficiency index, knowledge score, or confidence score unless a future explicit Mastery system is approved.

#### 4.2.91 No Question Quality Inference from One Student

A Student answering incorrectly does not make the Question bad. Question quality belongs to Section 4.1 moderation, and Practice outcomes never rewrite Question truth.

#### 4.2.92 Question Report Action

Where reporting exists, a suspected wrong answer, broken image, typo, or explanation problem enters the Question Bank moderation/report workflow. It must not automatically change the Question or mark an answer Correct.

#### 4.2.93 Data Honesty

Questions, answers, explanations, difficulty, Curriculum links, outcomes, accuracy, duration, history, collections, and recommendations always use real data.

#### 4.2.94 Missing Explanation State

`No explanation available` is valid and preferable to generated or fake content.

#### 4.2.95 Empty States

Honest states include no history, no Wrong Questions, no Bookmarks, no Unanswered Questions, no filter matches, and no eligible Questions in the selected Curriculum.

#### 4.2.96 Error States

Practice supports intentional Question-load, answer-submit, Session-save, media, result-load, and entitlement failures with retry where appropriate. Failed submission must not appear recorded.

#### 4.2.97 Partial Data

Missing metadata is not inferred. For example, absence of an explanation does not block a real correct answer from being shown.

#### 4.2.98 Mobile Experience

Mobile prioritizes Question readability, clear options, answer action, immediate feedback, explanation, Next Question, and Bookmark/review actions without clutter.

#### 4.2.99 Desktop Experience

Desktop may use additional space while preserving the same learning loop. Exam-like navigation grids or sidebars are not added merely because space exists.

#### 4.2.100 Accessibility

Practice preserves RTL correctness, readable Questions, accessible options, keyboard/focus behavior, non-color-only Correct/Wrong states, readable explanations, touch-friendly controls, and usable timers or status labels.

#### 4.2.101 Light / Dark

Canonical Light and Dark themes preserve Question, answer-state, and explanation readability with a calm learning orientation.

#### 4.2.102 Practice Engine Anti-Drift

Practice must not become Exam Mode with an answer key, a separate Question repository, a one-topic or one-link system, a fake explanation generator, hidden Mastery engine, peer-ranking system, automatic planning mutation, permanent-free Question Bank, or unapproved adaptive AI core. The canonical model is approved entry + central published Questions + Subject/Curriculum/count/difficulty/time configuration → Session → Question → Answer → immediate correctness → correct answer → available explanation/context → next Question → real result and referenced review collections.

#### 4.2.103 Current vs. Future

`APPROVED FUTURE STATE — CORE PRACTICE DIRECTION`:

- one shared Practice engine consuming eligible published central Questions;
- Quick, Custom, Subject, Curriculum, Wrong, Bookmark, Review, and Counselor-directed entry directions;
- Subject, multiple Curriculum areas, count, Easy/Medium/Hard, and timed/untimed configuration;
- immediate Correct/Wrong feedback, correct-answer reveal, available explanation, and distinct `CORRECT`, `WRONG`, and `UNANSWERED` outcomes;
- referenced Bookmarks, Wrong, Unanswered, and Review collections with retry as new evidence;
- real Session results, Subject/Curriculum breakdowns, Practice history, and historical Question integrity;
- paid Entitlement-based access plus shared Counselor, School, and future Teacher reuse.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- richer similarity logic, adaptive Practice, spaced review, predictive selection, intelligent recommendations, advanced Analytics, additional Question types, AI assistance, and richer resume behavior.

Future capabilities must not be presented as implemented. Actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md), and implementation requires a separately approved milestone.

#### 4.2.104 Decision Gates

Closed decisions:

- Practice is learning-oriented, distinct from Exam, and uses one shared engine over eligible published central Questions;
- Custom Practice supports Subject, one or multiple canonical Curriculum areas, count, difficulty, and timed/untimed configuration, while timed Practice remains Practice;
- Question ↔ Curriculum many-to-many and all valid links are respected; Primary Link is not exclusive;
- immediate Question-level correctness, correct-answer reveal, and real available explanation are allowed, while explanations are never fabricated;
- `CORRECT`, `WRONG`, and `UNANSWERED` remain distinct, with Unanswered never silently classified as Wrong;
- Bookmarks and Wrong/Unanswered/Review collections reference rather than copy Questions, and retry produces new evidence without rewriting history;
- unnecessary repetition is reduced without forbidding intentional retry or review;
- real result counts, accuracy, timing, breakdowns, and history do not imply Mastery or Curriculum Study Coverage;
- Question edits or unpublication do not rewrite historical Practice, and Practice remains distinct from formal Exam evidence in Analytics;
- Practice does not automatically modify Plans or create compensatory Tasks;
- consumption is paid and Entitlement-based, separated from authoring, with no assumed permanent free quota;
- adaptive, spaced, predictive, and AI-driven systems remain future; peer ranking and hidden proficiency scores are prohibited;
- School and future Teacher workflows reuse the shared engine.

Remaining implementation-stage choices:

- Quick defaults, mixed-difficulty composition, accuracy denominator, anti-repeat algorithm, navigation, and timer behavior;
- abandonment/resume semantics, current Wrong-list behavior after later success, Bookmark/Review UX, and history layout;
- Counselor-directed workflow, insufficient-pool fallback, result presentation, Question-report workflow, and responsive layouts;
- future adaptive, spaced-review, recommendation, and AI behavior.

These choices do not reopen any closed product decision.

### 4.3 Exam System

Exam is the formal assessment engine. It provides one shared foundation for Student self-created, Counselor-created, Admin-created, School/Institute, future Teacher, Online, and Printable Exams.

The canonical model is **Exam Definition + Central Question Bank + audience/access/timing → Online Attempt and/or Printable Output → Finalized Result → controlled release/review → historical Analytics**. Exam is not Practice with different styling, a separate Question repository, a PDF-only generator, a generic form builder, or an always-immediate answer-key system.

#### 4.3.1 Shared Exam Engine

All creator types and delivery modes reuse one Exam engine. Role, Permission, audience, delivery mode, and configuration determine behavior; separate Student, Counselor, Admin, School, and Printable Exam domains are prohibited.

#### 4.3.2 Central Question Bank Source

Exam Questions come from the central Question Bank. Normal creation uses Questions eligible for Exam use and never creates a duplicate Exam repository.

#### 4.3.3 Question Eligibility

Draft, Submitted, Under Review, Needs Changes, Rejected, or otherwise ineligible Questions cannot enter normal Exam pools. Section 4.1 governs published/authorized eligibility.

#### 4.3.4 Exam Definition

An Exam Definition is the configured assessment and may include title, instructions, Subjects, selected Questions and order, duration, availability window, audience, delivery mode, attempt policy, result/review release policy, and creator/origin. Storage design remains outside this Product Map.

#### 4.3.5 Exam Definition vs. Attempt

Definition describes what was configured; Attempt records what a specific Student did. Attempt answers and status must not be merged into the reusable Definition.

#### 4.3.6 Exam Creator Types

Approved creator directions include Student, Counselor, Admin, School/Institute staff, and future Teacher, each constrained by Role, Permission, Entitlement, assignment, and Organization scope.

#### 4.3.7 Creator Authority

Authentication alone does not grant creation authority. Backend enforcement of the shared access model is canonical.

#### 4.3.8 Student Self-Exam Builder

An entitled Student may create an Exam for themselves using the shared engine and central Question Bank. Self-Exam Builder is a paid/entitled capability.

#### 4.3.9 Student Self-Exam Entitlements

Relevant Effective Access may include `question_bank.access` and `exam_builder.access`. Commercial Plan names must not be hardcoded.

#### 4.3.10 Student Self-Exam Configuration

Approved self-Exam configuration includes Subject, one or multiple Curriculum areas, Question count, difficulty, and duration. Additional options remain implementation-stage choices.

#### 4.3.11 Student Self-Exam Is Still Exam Mode

A Student-created Exam follows Exam rules. During the active Attempt it provides no immediate correctness, explanation, hint, or learning assistance.

#### 4.3.12 Counselor-Created Exam

Authorized Counselors may create or use Exams for assigned Students where scope permits. Authority is assignment-scoped and never platform-wide merely because the user is a Counselor.

#### 4.3.13 Admin-Created Exam

Authorized Admin roles may create and manage Exams through their Permissions. Question-review authority and Exam administration remain separate.

#### 4.3.14 School / Institute Exam

School workflows reuse the shared engine, Question Bank, scoring foundation, and Attempt concept. Organization Permissions govern creation and assignment.

#### 4.3.15 Future Teacher Exam

Future Teachers reuse the shared engine rather than receiving a separate assessment system.

#### 4.3.16 Title

An Exam has a human-readable title. Exact naming UX remains an implementation-stage choice.

#### 4.3.17 Exam Subjects

An Exam may contain one or multiple Subjects; multi-Subject Exams are approved core direction.

#### 4.3.18 Multi-Subject Exam

Multi-Subject Exams preserve clear Subject boundaries so the Student understands the current Subject rather than receiving an ambiguous flat stream.

#### 4.3.19 Curriculum-Aware Creation

Creation may filter or select through canonical Curriculum and Question ↔ Curriculum many-to-many relationships. An Exam-specific topic taxonomy is prohibited.

#### 4.3.20 Multiple Curriculum Areas

An Exam may target one or multiple Curriculum areas; it is not restricted to one node.

#### 4.3.21 Many-to-Many Question Matching

Selection respects all valid Question-Curriculum links. Optional Primary Curriculum Link is never the only eligibility relationship.

#### 4.3.22 Question Count

Configuration may specify a desired Question count. The system must never fabricate Questions to satisfy it.

#### 4.3.23 Insufficient Question Pool

If eligible content cannot satisfy a request, the product responds honestly rather than using Draft content, secretly broadening scope, inventing Questions, or violating Curriculum/difficulty constraints without disclosure. Exact fallback UX remains open.

#### 4.3.24 Difficulty

Creation may use central `EASY`, `MEDIUM`, and `HARD` metadata. A separate Exam difficulty taxonomy is prohibited.

#### 4.3.25 Mixed Difficulty

Multiple difficulty levels may be composed where configured. Exact ratios and defaults remain open.

#### 4.3.26 Duration

An Exam may define total allowed Attempt duration. Exact timer mechanics remain implementation-stage detail.

#### 4.3.27 Availability Window

Assigned or scheduled Exams may define start and end availability. Exact scheduling semantics remain open.

#### 4.3.28 Duration vs. Availability Window

The period in which an Exam may be started and the duration allowed for one Attempt are distinct concepts—for example, available 10:00–18:00 with a 90-minute Attempt.

#### 4.3.29 Audience

Audience may include one Student, selected Students, a Counselor-assigned scope, Organization/School scope, future class/group scope, or another authorized audience. Exact tooling remains open.

#### 4.3.30 Audience Authorization

Creators cannot assign beyond authorized scope. Counselors cannot target arbitrary platform Students, and School staff cannot target outside their Organization. Backend authorization is authoritative.

#### 4.3.31 Delivery Mode

Canonical directions are `ONLINE`, `PRINTABLE`, and `BOTH`, or equivalent configuration, within the same Exam system.

#### 4.3.32 Online Mode

Online delivery creates a platform Attempt using the minimal Student Exam Mode defined in Section 2.4.

#### 4.3.33 Printable Mode

Printable delivery generates authorized output from the same Definition and central Questions. It does not create a PDF Question Bank.

#### 4.3.34 Both Mode

Where allowed, one coherent Definition may support both Online and Printable delivery. Exact workflow remains open.

#### 4.3.35 Attempt Policy

An Exam may govern permitted online Attempt count. Defaults remain open; unlimited retries must not be assumed.

#### 4.3.36 Retake Policy

Retake rules may differ for self, Counselor, School, and Admin Exams. No universal policy is invented here; exact rules remain a Decision Gate.

#### 4.3.37 Attempt Is Historical

Every finalized Attempt is historical assessment evidence. A retake creates a new Attempt and never overwrites the prior one.

#### 4.3.38 Result Release Policy

Result availability is governed by release policy. Submission does not imply immediate full results.

#### 4.3.39 Answer-Key Release Policy

Correct-answer review may be released separately from the overall result. Exact controls remain implementation-stage choices.

#### 4.3.40 Explanation Release Policy

Explanations appear only after finalization, when release policy permits, and only when a real explanation exists.

#### 4.3.41 Question-Review Release Policy

Post-Exam access to individual Questions and answers may be configurable. Exact review permissions remain open.

#### 4.3.42 No Immediate-Release Assumption

Assigned or external Exams do not automatically reveal correct answers, explanations, or Question analysis at Submit unless configured and authorized.

#### 4.3.43 Self-Exam Release Boundary

Self-Exams may use different default release behavior from assigned Exams, but the exact default is not locked. Shared release architecture must support that distinction.

#### 4.3.44 Exam Lifecycle Boundary

Definition lifecycle concepts such as Draft, Scheduled, Available, Closed, or Archived remain implementation-stage choices. The locked sequence is configuration → availability → Attempts → historical preservation.

#### 4.3.45 Active Exam Principle

Active Exam Mode is deliberately minimal and assessment-focused rather than a learning page.

#### 4.3.46 Active Exam Core Content

Core content is Subject List, current Question, answer options, timer, current Question number, Previous, Next, and Submit/End. Only necessary execution and orientation controls may be added.

#### 4.3.47 Subject-List Navigation

For multi-Subject Exams, a Subject List is the canonical high-level navigation model. Selecting a Subject accesses its Questions according to implementation behavior.

#### 4.3.48 No Full Question-Number Grid

A full Question-number matrix, grid, or sidebar is explicitly not approved as default active Exam navigation.

#### 4.3.49 Current Question Number

Orientation such as `Question 12` or `12 / 30` is allowed and is distinct from a navigation grid.

#### 4.3.50 Previous / Next

Previous and Next controls are allowed; exact edge behavior remains open.

#### 4.3.51 Timer

A clear, non-dominating Exam timer is allowed. Exact timeout behavior remains open.

#### 4.3.52 Submit / End Exam

The Student receives a clear finalization action. Wording and confirmation details remain implementation-stage choices.

#### 4.3.53 Submit Confirmation

A confirmation step may prevent ambiguous accidental finalization. Exact UX is a Decision Gate.

#### 4.3.54 Timeout

Whether expiry auto-submits or enters another finalization flow remains undecided and must not be invented here.

#### 4.3.55 Active Exam — No Correctness Feedback

Active Exam never reveals Correct, Wrong, or the correct answer for the current Question.

#### 4.3.56 Active Exam — No Explanation

Question explanations are prohibited during the active Attempt.

#### 4.3.57 Active Exam — No Hint

Hints and educational assistance are prohibited during the active Attempt.

#### 4.3.58 Active Exam — No Difficulty

Stored Question difficulty is hidden during the active Attempt.

#### 4.3.59 Active Exam — No Curriculum Assistance

Curriculum topics, chapters, and other educational labels that could assist inference are hidden during the active Attempt.

#### 4.3.60 Active Exam — No Analytics

Performance analysis, weakness signals, recommendations, and previous related results are prohibited during the Attempt.

#### 4.3.61 Active Exam — No Other-User Percentages

Option popularity, peer correctness, and percentages of other Students are prohibited during the Attempt.

#### 4.3.62 Active Exam — No Mastery Signal

Mastery, proficiency, confidence, and predicted-success signals are prohibited during the Attempt.

#### 4.3.63 Active Exam — No Learning Resources

Related Articles, Videos, Resources, and lessons are prohibited during the Attempt. Post-release recommendations remain future where separately approved.

#### 4.3.64 Active Exam — No Practice Feedback Loop

The Practice loop of answer → correctness → explanation is prohibited during Exam.

#### 4.3.65 Active Answer State

Recorded selections persist coherently across Question and Subject movement. Exact save mechanics remain technical detail.

#### 4.3.66 Unanswered Questions

Answered and Unanswered remain distinct. Unanswered is not automatically Wrong unless a defined scoring rule uses it, and post-Exam reporting preserves an explicit count.

#### 4.3.67 Subject Switching

Changing Subject does not reset prior answers or corrupt current Attempt state.

#### 4.3.68 Active Exam Data Honesty

Remaining time, Subject, Question number, saved-answer state, and submission state must reflect confirmed reality. Unknown state is not presented as certain.

#### 4.3.69 Mobile Active Exam

Mobile prioritizes Subject access, Question, options, essential timer/status, Previous/Next, and Submit without clutter.

#### 4.3.70 Mobile Subject List

Mobile may use a compact list, menu, or sheet while preserving Subject-list navigation. A Question-number grid cannot replace it.

#### 4.3.71 Desktop Active Exam

Additional desktop space must not reintroduce a full Question grid, explanation or metadata panels, Analytics sidebar, or Learning Resources.

#### 4.3.72 Accessibility

Exam preserves RTL correctness, readable Questions, accessible options, keyboard/focus support, non-color-only selected states, clear timer and Submit actions, usable Subject navigation, and touch-friendly controls.

#### 4.3.73 Light / Dark

Canonical Light and Dark themes preserve focus, Question readability, answer clarity, low distraction, and restrained brand presence.

#### 4.3.74 Attempt Finalization

Once finalized, answer state becomes historical evidence and cannot be casually reopened or rewritten. Exceptional correction policy remains implementation-stage governance.

#### 4.3.75 Finalized Attempt Integrity

A finalized Attempt preserves presented Questions and order, options, Student answers, Unanswered states, relevant timing, scoring basis, and Definition/version context.

#### 4.3.76 Question Snapshot / Version

Exam history preserves the exact Question meaning used. Later central edits cannot silently alter historical meaning.

#### 4.3.77 Correct-Answer History

Later correct-answer corrections do not silently mutate past evidence. Regrading policy remains open, while traceability is mandatory.

#### 4.3.78 Option History

Later option edits do not change what the Student historically saw.

#### 4.3.79 Curriculum-Link History

Later Curriculum-link changes do not silently rewrite an old Attempt's analytical meaning; historical association remains interpretable.

#### 4.3.80 Exam-Definition Edits

Editing a Definition after Attempts exist cannot rewrite past Attempts. Future availability or configuration may change appropriately.

#### 4.3.81 Exam Version / Revision Principle

Exact versioning design remains technical. The locked requirement is that historical Exam meaning cannot silently change.

#### 4.3.82 Retake History

Every permitted retake creates new evidence while all earlier Attempts remain intact.

#### 4.3.83 Post-Submit State

After finalization, the Student sees only information permitted by release policy, with no alternate UI bypass.

#### 4.3.84 Result Summary

When released, real results may include total Questions, Correct, Wrong, Unanswered, applicable score/percentage, Subject performance, and available timing data.

#### 4.3.85 Correct / Wrong / Unanswered

Post-Exam reporting preserves all three outcomes separately. A scoring rule may treat Unanswered specially, but display must not silently collapse it into Wrong.

#### 4.3.86 Score / Percentage

Scores follow defined Exam rules. No universal formula is invented where Exam types may differ.

#### 4.3.87 Negative Marking Boundary

Negative marking is not decided. It requires a later explicit scoring-rule decision and must not be assumed.

#### 4.3.88 Subject Result

Multi-Subject results may summarize real outcomes by Subject.

#### 4.3.89 Curriculum Analysis

When allowed, results may show evidence across multiple valid Curriculum areas according to many-to-many links rather than forced single-topic attribution.

#### 4.3.90 Curriculum Evidence Is Not Mastery

Exam evidence does not automatically create a Mastery percentage, proficiency score, or permanent knowledge verdict.

#### 4.3.91 Question Review

When policy permits, review may show Question, Student answer, correct answer, outcome, and real explanation. Exact access remains configurable.

#### 4.3.92 Review May Be Restricted

An overall result may be released while Questions, correct answers, and explanations remain unavailable. The architecture supports this separation.

#### 4.3.93 Answer Key Is Not Always Immediate

Release policy, not submission alone, controls answer-key availability.

#### 4.3.94 Explanation Is Never Fabricated

Missing explanations remain absent rather than generated to fill review UI.

#### 4.3.95 Exam History

Authorized Student history may preserve Exam, date, Attempt number, result and release states, available score, Subjects, duration, and creator/origin. Exact layout remains open.

#### 4.3.96 Exam Origin

Self, Counselor, School, Admin, and future Teacher provenance remains understandable because it may affect audience, release, permissions, and retakes.

#### 4.3.97 Self-Exam vs. Assigned Exam

Self and assigned Exams share one engine but may differ in audience, release, attempt policy, and lifecycle.

#### 4.3.98 Counselor Result Visibility

Counselors see only authorized Student evidence consistent with assignment, ownership/context, and release/access policy.

#### 4.3.99 School Result Visibility

School staff see only Organization-scoped evidence allowed by Permissions.

#### 4.3.100 Admin Result Visibility

Admin access remains Role/Permission and sensitive-data governed; no Admin label confers arbitrary academic-data access.

#### 4.3.101 Exam → Student Analytics

Released and authorized Exam evidence may feed Student Analytics, whose presentation remains governed by Section 2.5.

#### 4.3.102 Exam → Counselor Analytics

Released and authorized Exam evidence may feed Counselor Analytics under Section 3.4.

#### 4.3.103 Practice vs. Exam Analytics

Practice and Exam remain distinguishable evidence sources and do not become one default assessment score.

#### 4.3.104 No Automatic Planning Mutation

Exam results do not automatically rewrite Plans, create Student or compensatory Tasks, or change Curriculum targets. Any Student or Counselor action remains explicit.

#### 4.3.105 No Automatic Diagnosis

Results do not automatically declare weakness, Mastery, inability to learn, or planning failure. The product presents evidence without unsupported judgment.

#### 4.3.106 Printable Exam Engine

Printable Exam is an output mode of the shared Definition, Question set, and central Bank—not a separate domain.

#### 4.3.107 Student Printable PDF

Printable direction includes a Student Question output containing the material needed for offline execution. Exact visual layout remains open.

#### 4.3.108 Answer Key Output

Authorized users may receive printable answer-key output. Access remains Permission-controlled and unavailable to unauthorized Students.

#### 4.3.109 Optional Explanation Output

Where policy permits and real explanations exist, printable solution/explanation output may be supported. Missing explanations are never fabricated.

#### 4.3.110 Printed Exam Historical Integrity

Once generated or assigned from a defined set, later Question edits cannot silently change the historical printable Exam meaning.

#### 4.3.111 PDF Is Not Question Storage

PDF is output rather than canonical Question storage; central Question truth and historical version integrity remain authoritative.

#### 4.3.112 Printable Attempt Boundary

Generating or printing does not create a completed online Attempt or fabricate answers, score, completion, or timing.

#### 4.3.113 Printable Result-Entry Boundary

Manual or scanned printable-result entry is not defined as core. OMR or scanning requires a separately approved workflow.

#### 4.3.114 Future A/B/C Versions

Multiple printable paper versions and Question/order variation remain future/extensible.

#### 4.3.115 Future Answer Sheet

Printable answer sheets remain future/extensible unless separately scheduled.

#### 4.3.116 Future School Branding

School logo, header, and printable metadata remain future/extensible.

#### 4.3.117 School Printable Exam

School/Institute is an important printable consumer but still uses the shared engine and Question Bank.

#### 4.3.118 Future Class / Grade / Group Assignment

Future Organization workflows may assign to class, grade, or group under Section 6.3 without creating a parallel School Exam system.

#### 4.3.119 Question Order

Definition and historical Attempt/output preserve Question order. Exact selection or ordering UI remains open.

#### 4.3.120 Randomization Boundary

Question or option randomization may later be configured, but exact behavior is undecided and must preserve Attempt meaning.

#### 4.3.121 Deterministic Attempt Snapshot

Once an Attempt begins, refresh or navigation must not unexpectedly regenerate a different assessment. Selection and order remain stable enough to preserve meaning.

#### 4.3.122 Exam Builder Question Selection

Creators may search, filter, and select by Subject, Curriculum, difficulty, count, or direct Question choice. Exact builder UX remains open.

#### 4.3.123 Automatic Question Selection

Rule-based selection from requested filters may be supported. Exact algorithm remains implementation-stage detail, and opaque AI generation is not current core behavior.

#### 4.3.124 Manual Question Selection

Where supported, authorized creators may select specific central Questions manually.

#### 4.3.125 Question Collection Reuse

Existing Collections may later assist creation. Exact Collection-to-Exam workflow remains open.

#### 4.3.126 Exam Preview

Creators may preview an Exam before availability or printing. Preview is not a Student Attempt.

#### 4.3.127 Draft / Publish Boundary

Exact Draft, Publish, and Activate semantics remain open without authorizing a complex workflow. Students access only an authorized available state.

#### 4.3.128 Editing Before Attempts

Authorized edits may occur before Attempts subject to availability rules. Exact editable-state matrix remains open.

#### 4.3.129 Editing After Attempts

Once Attempts exist, changes cannot alter historical meaning. Future use may require a revision or new version according to later-defined policy.

#### 4.3.130 Unpublish / Close

An Exam may stop accepting future Attempts without deleting historical Attempts. Exact Close/Archive mechanics remain open.

#### 4.3.131 Delete Boundary

Definitions with history cannot be destructively deleted in a way that breaks Attempts. Exact archival policy remains open.

#### 4.3.132 Entitlement / Permission Separation

Permission controls creation, management, and assignment; Entitlement controls paid capability use; Assignment/Audience controls who may take a specific Exam. These concepts remain separate.

#### 4.3.133 Student Paid Self-Builder

Student self-creation requires applicable `question_bank.access` and `exam_builder.access` Effective Access, enforced beyond frontend visibility.

#### 4.3.134 Counselor Permission

Counselor creation and assignment derive from Counselor Permissions plus assigned-Student scope, not Student commercial Entitlements.

#### 4.3.135 School Permission

School authority derives from Organization membership and Permissions; School membership never means full Exam Admin automatically.

#### 4.3.136 No Hardcoded Plan Names

Exam access uses Effective Access and Entitlements, never commercial labels such as Gold or VIP.

#### 4.3.137 Backend Authority

Backend enforcement governs creation, audience, Attempt permission, result visibility, answer-key release, and printable-key access.

#### 4.3.138 No Frontend-Only Release

UI hiding is insufficient; authoritative backend behavior enforces all release and visibility rules.

#### 4.3.139 Data Honesty

Questions, availability, time, answers, Attempt state, result, score, release state, Curriculum analysis, creator, audience, and Attempt count always reflect real state.

#### 4.3.140 Empty States

Honest states include no Exams, no eligible Questions, no assigned Exams, no history, result not released, and no filtered School/Admin results. Fake Exam data is prohibited.

#### 4.3.141 Result-Not-Released State

`Result not released yet` is valid and must not be represented as `0%` or another misleading failure state.

#### 4.3.142 Review-Not-Available State

A released overall result may coexist with unavailable Question review, and the UI represents that honestly.

#### 4.3.143 Error States

Intentional failures include Exam load, answer save, Submit, timer/state sync, result load, PDF generation, authorization, and unavailable media. Failed Submit never appears finalized.

#### 4.3.144 Partial Data

Unavailable analysis is not converted into fabricated zero values; for example, an available score with unavailable Curriculum analysis does not mean `0%` Curriculum performance.

#### 4.3.145 Attempt Recovery Boundary

Refresh, connectivity loss, interrupted Attempt, and recovery semantics remain technical choices, but integrity and protection from silent answer loss are required.

#### 4.3.146 Multi-Device Boundary

Concurrent and multi-device Attempt rules remain undecided and must not be invented.

#### 4.3.147 No Proctoring Assumption

Camera monitoring, screen recording, keystroke surveillance, and other proctoring are not implicit core requirements. Any future proctoring needs separate Product Owner approval.

#### 4.3.148 No Peer Ranking Requirement

Leaderboards, class rank, percentiles, and national ranking are not required and need separately approved population and data rules.

#### 4.3.149 No Hidden Mastery

Exam results do not silently generate a Mastery or proficiency index.

#### 4.3.150 No Fake Comparative Analytics

Comparisons against other Students, class, or nation require separately approved valid data and cannot be fabricated.

#### 4.3.151 Exam Notifications

New assignment, availability, deadline, and result-release events may use the shared Notification system governed by Section 5.2. No Exam-specific parallel engine is created.

#### 4.3.152 Exam → Counselor Context

Counselors inspect authorized shared Attempt evidence through Student Workspace or Analytics without duplicating it in Counselor records.

#### 4.3.153 Exam → School Context

School staff inspect Organization-authorized evidence; Section 6.3 owns detailed reporting.

#### 4.3.154 Exam → Learning Content

Post-Exam Learning Content recommendations remain future/extensible and are never shown during active Exam.

#### 4.3.155 Exam → Practice

A future explicit post-assessment action may create a separate Practice experience from related areas. It never transforms the historical Attempt into Practice.

#### 4.3.156 No Auto-Retry as Practice

Wrong Exam Questions do not automatically enter Practice without explicit Student/Counselor action or a separately approved recommendation workflow.

#### 4.3.157 AI Exam Boundary

Future AI may assist composition, coverage checks, or configuration, but cannot fabricate official Questions, alter correct answers, silently change selection, publish autonomously, or alter release policy without creator intent.

#### 4.3.158 Adaptive Exam Boundary

Adaptive testing is not part of the locked core and requires separate Product Owner approval because it changes assessment semantics.

#### 4.3.159 Exam Statistics

Future authorized aggregate statistics must not rewrite historical Student answers or results. Exact features remain future/implementation-stage scope.

#### 4.3.160 Question Performance

Question-level outcome statistics do not automatically determine Question correctness, publication, quality, or difficulty; Section 4.1 governance remains authoritative.

#### 4.3.161 Exam Engine Anti-Drift

Exam must not become Practice with delayed feedback, separate role-specific engines, a separate printable Bank, active Exam with explanations or hints, a full Question-number grid, automatic immediate key release, mutable Attempts, hardcoded Plans, hidden Mastery, automatic Plan rewriting or Practice generation, or default surveillance. The canonical system is shared Definition + central Questions + authorized creator + configuration/audience/delivery/Attempt/release policy → minimal active Exam → finalized historical Attempt → controlled results/review + printable outputs + authorized Analytics.

#### 4.3.162 Current vs. Future

`APPROVED FUTURE STATE — CORE EXAM DIRECTION`:

- one shared Exam engine and Central Question Bank for Student, Counselor, Admin, School, future Teacher, Online, Printable, and Both delivery;
- entitled Student Self-Exam Builder plus authorized Counselor/Admin/Organization creator directions;
- one or multiple Subjects, canonical Curriculum, count, difficulty, duration, availability, audience, Attempt and release policies;
- minimal active Exam with Subject List, current Question/number, options, timer, Previous/Next, and Submit/End—without a full number grid or learning feedback;
- finalized Attempt and Question-version integrity, released Correct/Wrong/Unanswered results, Subject and permitted Curriculum evidence, and Exam history;
- Student printable Question output, authorized Answer Key, optional real explanations, Entitlement/Permission separation, and backend authorization.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- A/B/C paper versions, answer sheets, School branding, class/grade/group assignment enhancements, richer printing, randomization, advanced Analytics/comparison, AI composition assistance, separately approved adaptive testing, offline result entry, and richer recovery/concurrency policy.

Future capabilities must not be presented as implemented. Actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md), and implementation requires a separately approved milestone.

#### 4.3.163 Decision Gates

Closed decisions:

- one shared Exam engine uses the central Question Bank across Online, Printable, Student, Counselor, Admin, School, and future Teacher contexts;
- Student self-creation is paid and Entitlement-controlled through capabilities including `question_bank.access` and `exam_builder.access`, and remains Exam Mode;
- one or multiple Subjects, canonical Curriculum with many-to-many links, count, difficulty, duration, audience, and `ONLINE` / `PRINTABLE` / `BOTH` directions are supported;
- Definition, Attempt, availability window, Attempt duration, attempt policy, audience, and release controls remain distinct;
- multi-Subject active Exam uses Subject-list navigation, allows current number, Previous/Next, timer, and Submit/End, and excludes a full Question-number grid;
- active Exam excludes correctness, correct answer, explanation, hint, difficulty, Curriculum assistance, Analytics, recommendations, Mastery, Learning Resources, and other-user percentages;
- finalized Attempts preserve Questions, order, options, answers, Unanswered state, timing, scoring basis, and Definition/version context; retakes never overwrite prior evidence;
- result, answer-key, explanation, and Question-review visibility are release-policy controlled and are not assumed immediate;
- released results preserve Correct, Wrong, and Unanswered and may include applicable score, timing, Subject result, and permitted Curriculum evidence without implying Mastery;
- Exam evidence does not automatically alter Planning or create compensatory Tasks, and Practice remains a distinct evidence type;
- Printable is shared-engine output; PDF is not Question storage; printing fabricates no Attempt, and future A/B/C, answer sheets, School branding, and offline result entry remain future;
- Permission, Entitlement, and Assignment/Audience remain separate; backend authorization is authoritative and Plan names are not hardcoded;
- no implicit proctoring, peer ranking, fake comparison, hidden Mastery, AI-autonomous Exam behavior, or core adaptive testing is authorized.

Remaining implementation-stage choices:

- Definition lifecycle, creator Permission matrix, self versus assigned release defaults, result/key/explanation/review controls, and attempt/retake defaults;
- availability semantics, timeout/auto-submit, Submit confirmation, autosave/recovery, concurrency, scoring, and negative marking;
- builder layout, manual versus rule-based selection, mixed difficulty, insufficient-pool behavior, randomization, preview, and revision/editable-state policy;
- archive/delete and historical correction/regrading governance;
- printable layout, key/explanation policy, future A/B/C, answer sheet, School assignment, responsive Exam layout, offline result entry, advanced Analytics, and future AI/adaptive behavior.

These choices do not reopen any closed product decision.

### 4.4 Learning Content

Learning Content is the teaching and resource layer. Authorized staff manage educational resources, and authorized Students discover and consume them through a shared, Curriculum-aware, commercially controllable model compatible with Files and External URLs.

The canonical model is **shared Learning Content + content type and delivery + canonical Curriculum references + publication state + Effective Access → Student Resource Library and Content Detail → consumption**. It remains extensible toward Lessons, Courses, recorded Content, video progress, and streaming without requiring a deep LMS or internal Video Platform now.

#### 4.4.1 Learning ≠ Question Bank

Learning Content teaches or provides resources; Question Bank stores Questions for Practice and Assessment. Both may reference Curriculum but remain separate domains.

#### 4.4.2 Learning ≠ Practice

Learning explains or teaches, while Practice provides Question solving with learning feedback. A Resource may reference Practice without becoming Practice.

#### 4.4.3 Learning ≠ Exam

Learning remains separate from formal assessment. A Resource or future Course may reference an Exam, which remains in the shared Exam engine.

#### 4.4.4 Learning ≠ Classroom

Recorded Content and Live Classroom are distinct. Learning Content does not authorize an internal live-video platform; Section 5.4 owns future Classroom direction.

#### 4.4.5 Central Learning Content Model

One shared Content model serves Student, Counselor, and School contexts and commercial packages. Separate role-, Organization-, or Plan-specific Content repositories are prohibited.

#### 4.4.6 Current Content Types

Approved directions include Article, PDF, File, External Link, Video Resource, and future-extensible Lesson, Course, and Recorded Content. Not every type must be fully implemented together.

#### 4.4.7 Article

Article is textual educational Content managed inside the product. Exact rich-text/editor technology remains an implementation-stage choice rather than a publishing-platform architecture decision.

#### 4.4.8 PDF

A PDF Resource is an educational file available according to access policy through the shared File/Storage abstraction where applicable.

#### 4.4.9 File

Generic educational Files may be supported. Type and size limits remain implementation-stage choices.

#### 4.4.10 External Link

An approved External URL is a first-class practical delivery mechanism; the product does not require every resource to be internally hosted.

#### 4.4.11 Video Resource

Current Video delivery may use an External URL or another supported source. Internal streaming is not required for the current Learning launch.

#### 4.4.12 External Video Providers

Telegram-hosted links, external video providers, and approved third-party hosting are acceptable. KonkourX manages metadata and access without currently owning streaming infrastructure.

#### 4.4.13 Telegram Hosting

Telegram hosting is an acceptable current option but not a permanent architectural dependency. The provider may change without changing Content identity.

#### 4.4.14 File / URL Delivery

Current delivery supports File and/or External URL according to type. Exact adapters belong to technical architecture.

#### 4.4.15 Delivery Source Is Not Content Identity

Content is not identified solely by its current path or URL. Moving a Video from Telegram to another provider does not create a new unrelated learning item.

#### 4.4.16 Admin-Editable Delivery

Authorized staff can replace delivery URLs or Files without code deployment. Resource destinations must not be hardcoded into frontend source.

#### 4.4.17 Broken External Resource

Authorized staff may correct or replace an unavailable external destination. Automated broken-link monitoring remains implementation/future detail.

#### 4.4.18 Core Content Metadata

Content may include title, type, description, cover, File/URL, Curriculum relationships, tags, ordering, publication and commercial/access states, provenance, and relevant dates. Required fields remain implementation-stage choices.

#### 4.4.19 Title

Every Student-facing Resource has a clear human-readable title rather than relying on a filename.

#### 4.4.20 Description

A concise description may explain the Resource. Descriptions must never be fabricated.

#### 4.4.21 Thumbnail / Cover

A cover may be used where helpful. Missing artwork is represented honestly; fallback UI does not fabricate metadata.

#### 4.4.22 Author / Publisher

Where relevant, author or publisher provenance is preserved internally even if public display policy varies.

#### 4.4.23 Tags

Tags support practical organization but never become a competing educational taxonomy. Canonical Curriculum remains the educational reference.

#### 4.4.24 Canonical Curriculum Linking

Content may link to canonical Curriculum. A separate Learning-topic tree is prohibited.

#### 4.4.25 Multiple Curriculum Links

One item may legitimately relate to multiple Curriculum areas and is not restricted to one node.

#### 4.4.26 Curriculum Heterogeneity

Links preserve valid canonical structures without assuming every relationship follows a simple Grade → Subject → Chapter → Topic tree.

#### 4.4.27 Curriculum Is Reference, Not LMS Structure

Learning uses Curriculum for reference and classification, not as a Course engine, skill or knowledge graph, prerequisite graph, or Mastery ontology.

#### 4.4.28 Learning-Topic Taxonomy Prohibition

A second Learning-specific educational hierarchy is prohibited; canonical Curriculum is reused where meaningful.

#### 4.4.29 Content Without Curriculum Link

General guidance or another valid Resource may exist without a Curriculum link. The product must not fabricate one.

#### 4.4.30 Publication State

The practical state direction is `DRAFT`, `PUBLISHED`, and `ARCHIVED`, or equivalent technical names. A deep editorial workflow is not implied.

#### 4.4.31 `DRAFT`

Draft Content is prepared by authorized editors and is not normally Student-accessible.

#### 4.4.32 `PUBLISHED`

Published Content is available to authorized audiences subject to Effective Access; publication does not mean free for everyone.

#### 4.4.33 `ARCHIVED`

Archived Content leaves normal discovery or active use. Historical and commercial consequences remain an implementation Decision Gate.

#### 4.4.34 Publication Authority

Publication requires appropriate Permission. Edit authority does not automatically include publish authority.

#### 4.4.35 Content Creation Authority

Current core creation belongs to authorized Admin/Content staff. Question Bank's broad user-authoring decision does not authorize public Learning-content authoring.

#### 4.4.36 Creator vs. Publisher

Creation/editing and publication may be separate configurable Permissions under shared RBAC.

#### 4.4.37 Content Editing

Authorized editors may change ordinary title, description, cover, URL, File, Curriculum links, and ordering without code deployment.

#### 4.4.38 Commercial State Is Separate

Editing does not grant authority over Free/Paid state, Plan inclusion, or Organization commercial availability.

#### 4.4.39 Commercial Approval

Final commercial and access status requires an authorized Admin, Super Admin, or business-capable role. Normal editors need separate Permission.

#### 4.4.40 Access Models

Content may be `FREE`, `PAID`, `PLAN-BASED`, Organization-granted, User-override granted, or available through another approved Entitlement source.

#### 4.4.41 Free Content

Free Content requires no paid Content Entitlement but remains subject to account and publication rules. Free does not necessarily mean anonymous or publicly indexable.

#### 4.4.42 Paid Content

An item may be separately purchasable where Business configuration supports it.

#### 4.4.43 Plan-Based Content

Content may be included in one or multiple Products/Plans through Entitlements rather than hardcoded Plan labels.

#### 4.4.44 Organization Access

School/Institute Entitlements may grant access without a separate personal purchase.

#### 4.4.45 User Override

Authorized Business/Admin workflows may grant specific User access through the shared Effective Access model rather than a Learning-only entitlement system.

#### 4.4.46 Effective Access

Learning access derives from Role + Plan Entitlements + Organization Entitlements + User Overrides + one-time Purchase where applicable. Learning-specific hardcoded rules must not bypass it.

#### 4.4.47 No Hardcoded Plan Names

Content access is capability/Entitlement-driven and never implemented as checks for labels such as Gold or VIP.

#### 4.4.48 Backend Authorization

Server authority protects access, Files, and URLs where technically controllable. Hidden frontend states alone are not security.

#### 4.4.49 One-Time Purchase

Content or future Course may support a one-time purchase distinct from recurring Subscription or Plan access.

#### 4.4.50 Payment Engine Boundary

Learning owns no payment processor. Section 6.2 handles orders, payments, and subscriptions; Learning consumes resulting Effective Access.

#### 4.4.51 Locked Content State

Students without access see an honest locked or unavailable state. Exact upsell UX remains open.

#### 4.4.52 Accessible Content State

Valid access is represented accurately rather than misleadingly shown as locked.

#### 4.4.53 Separately Purchasable State

Separately purchasable Resources may expose an appropriate purchase path; exact price and CTA presentation belongs to Business and Student UI implementation.

#### 4.4.54 Organization-Provided State

The product may explain that access comes from a School or Organization. Exact labeling remains open.

#### 4.4.55 Historical Purchase / Archive Boundary

Previously purchased access, later archive/removal, and Subscription-expiry effects remain Business Decision Gates. Permanent access must not be silently assumed.

#### 4.4.56 Resource Library

Students have a Learning/Resource Library for discovering available educational Content.

#### 4.4.57 Resource Library Filters

Discovery may filter by Subject, Grade, Track/Stream, Curriculum, type, access state, recent addition, and available/purchased status. Exact UX remains open.

#### 4.4.58 Resource Search

Search covers relevant Content while respecting authorization; a result can never bypass locked-resource protection.

#### 4.4.59 Search Result Visibility

Whether locked items appear in discovery remains a commercial UX choice. If shown, locked status remains truthful.

#### 4.4.60 Resource Card

A card may show real title, type, thumbnail, Curriculum context, description excerpt, and access state. Exact design remains open.

#### 4.4.61 Content Detail

Detail may show title, description, Curriculum relationships, media access, metadata, and relevant actions without becoming a Practice or Exam screen.

#### 4.4.62 Open / View

Depending on type and Permission, a Student may open internal Content, view a File, follow an External URL, or access a Video link.

#### 4.4.63 Download

Download may be allowed where policy permits but is not assumed for every item. Controls remain implementation-stage choices.

#### 4.4.64 External Link Opening

External destinations are represented honestly rather than pretending third-party media is internally streamed.

#### 4.4.65 Student Content Progress

Percentage watched, Lesson completion, Course completion, and Continue Watching are not required by the current lightweight model.

#### 4.4.66 Course

Course is an approved future/extensible concept for organizing multiple Learning items. A deep LMS is not authorized now.

#### 4.4.67 Course Composition

Future Courses may contain Sections, Lessons, Videos, Files, Articles, Links, and references to Practice or Exams. Exact model remains future.

#### 4.4.68 Lesson

Lesson may become a structured Course unit later. Current Resources are not forced into a Course/Lesson hierarchy.

#### 4.4.69 Standalone Resource

PDFs, Videos, and other Resources remain valid without Course membership.

#### 4.4.70 Course Sequence

Ordered future Lessons or Sections remain extensible; complex prerequisite logic is not current scope.

#### 4.4.71 Course Progress

Completed Lessons, progress, resume, and Course completion remain future rather than current core requirements.

#### 4.4.72 Continue Watching

Playback resume and Continue Watching remain future/extensible.

#### 4.4.73 Internal Video Hosting

Internal Video Hosting is not currently required. External and File-based delivery remain sufficient current direction.

#### 4.4.74 Future Video Platform

Managed hosting, streaming, protected delivery, playback progress, resume position, recorded Courses, and class recordings remain future capabilities.

#### 4.4.75 Video Provider Abstraction Direction

The product remains conceptually provider-changeable; Telegram or another current provider is not a permanent limitation. Exact abstraction belongs to architecture.

#### 4.4.76 Recorded Courses

Recorded Courses are a future extensibility target that current design must not block, without overbuilding them now.

#### 4.4.77 Class Recordings

Future Classroom recordings may become Learning Content later without making Live Classroom part of Learning today.

#### 4.4.78 Content → Practice

A Resource may later reference the shared Practice engine for a relevant area. Learning never embeds a duplicate Practice engine.

#### 4.4.79 Content → Exam

A Resource or Course may later reference the shared Exam engine rather than owning Course-specific assessment truth.

#### 4.4.80 Practice / Exam Links Are References

Learning references canonical Practice or Exam experiences and never duplicates Questions or Attempts.

#### 4.4.81 Content → Curriculum

Curriculum references support discovery for Students and Counselors while remaining reference relationships.

#### 4.4.82 Analytics → Content Future

Evidence-based Content suggestions remain future/extensible and do not authorize current personalized recommendations.

#### 4.4.83 No Automatic Content Prescription

Analytics, Exam, or Practice evidence must not automatically enroll a Student, purchase Content, change a Plan, or force Resource consumption.

#### 4.4.84 Counselor-Shared Content

Where supported, a Counselor shares or references the canonical Resource with an assigned Student rather than creating a duplicate per conversation.

#### 4.4.85 Counselor Access Boundary

Sharing authority does not grant publish, edit, pricing, or access-state authority.

#### 4.4.86 Counselor Should Respect Student Access

Where useful, the Counselor may see whether the Student can access a Resource before recommending it but cannot automatically grant paid access.

#### 4.4.87 School / Organization Reuse

School/Institute reuses the shared Learning engine and does not receive a separate Resource repository.

#### 4.4.88 Organization-Scoped Content Access

Organization Entitlements may restrict a shared item to relevant members without changing its Content identity.

#### 4.4.89 School-Specific Content

Future Organization-specific Content uses shared identity and access concepts. Exact scoping remains open; no duplicate School engine is created.

#### 4.4.90 Future Teacher Boundary

Future Teachers may interact with shared Content according to Permissions, but Teacher authoring or publication is not automatically approved.

#### 4.4.91 Public Website Boundary

Public Website CMS and authenticated Learning Content may overlap conceptually without sharing one automatic workflow. Section 1 remains authoritative.

#### 4.4.92 Free Content ≠ Public SEO Content

Free does not imply public, anonymous, or search-indexed. Public exposure is a separate publication decision.

#### 4.4.93 Content Notifications

Events such as a new available Resource may use shared Notifications and deep-link to canonical Content. No Learning-specific Notification engine is created.

#### 4.4.94 Content Ordering

Authorized staff may manually order curated Content. Ordering remains presentation rather than Curriculum truth.

#### 4.4.95 Featured Content

Selected Resources may be featured by a future/implementation surface, but this is not an intelligent recommendation engine or locked core requirement.

#### 4.4.96 Content Archive / Unpublish

Authorized staff may stop normal discovery or access under publication rules. Exact differences among archive, unpublish, and disable remain open.

#### 4.4.97 Content Delete Boundary

Deletion policy remains open and must avoid breaking meaningful references, history, or purchases. No permanent-delete rule is invented.

#### 4.4.98 Content Link Stability

Internal references remain stable enough, where practical, for Counselor shares, Notifications, Student context, and future Course composition. Routing design remains technical.

#### 4.4.99 Commercial Change Boundary

Authorized roles may change Free, Paid, Plan-based, or another valid commercial state under governance. Impact on existing users remains a Business Decision Gate.

#### 4.4.100 Content Access Does Not Alter Content Identity

Price, Plan inclusion, and Organization access changes do not inherently create a new educational item.

#### 4.4.101 Product / Plan Integration

Authorized Business/Admin can package existing Content capabilities into Products/Plans without code changes. New software capability still requires development.

#### 4.4.102 CMS-Like Admin Management

Authorized staff can create, edit, publish, archive, change delivery, link Curriculum, order Content, configure access, and—when separately authorized—change commercial state without developer deployment.

#### 4.4.103 No Generic No-Code Platform Requirement

Admin-manageable Content does not turn KonkourX into a generic no-code website or LMS builder.

#### 4.4.104 Content Review Boundary

Unlike Question Bank, current Learning does not lock a deep moderation lifecycle for every item. Controlled Draft/Published/Archived is sufficient; additional editorial review requires later need and approval.

#### 4.4.105 No AI Content Approval Engine

Human authorized staff remain responsible for publication and commercial decisions; no AI scientific/content approval system is current architecture.

#### 4.4.106 AI Content Generation Boundary

Future AI may assist authorized workflows but cannot autonomously generate and publish official educational Content or fabricate Curriculum links.

#### 4.4.107 Content Completion ≠ Curriculum Coverage

Opening, viewing, or later completing Content or a Course does not automatically complete Curriculum Study Coverage, which remains governed by execution/history rules.

#### 4.4.108 Content View ≠ Mastery

Reading or watching does not automatically establish Mastery, proficiency, understanding, or Exam readiness. A hidden Learning Mastery model is prohibited.

#### 4.4.109 Future Course Completion Boundary

Future Course Completion and Curriculum Coverage or Mastery remain conceptually distinct.

#### 4.4.110 Content Analytics Boundary

Views, opens, or future Course progress may be tracked only when explicitly implemented. A large Content BI system is not current scope.

#### 4.4.111 No Fake Engagement Metrics

Views, watch time, completion, popularity, rating, Student progress, and recommendations must never be fabricated.

#### 4.4.112 No Social Rating Requirement

Likes, stars, comments, public ratings, popularity ranking, and influencer profiles are not current requirements and need separate approval.

#### 4.4.113 No Learning Leaderboard

Course, Content-consumption, and peer-reading leaderboards are prohibited from current Learning scope.

#### 4.4.114 Resource Availability

Student UI reflects real Available, Locked, Unavailable, Archived, or known broken-external states rather than presenting unusable Content as accessible.

#### 4.4.115 Data Honesty

Titles, descriptions, Curriculum links, types, provenance, delivery, access, purchase, publication, progress, and recommendations always reflect real data.

#### 4.4.116 Empty States

Honest states include no Resources, no filter results, no purchases, no Organization Resources, and no Course content. Fake educational material is prohibited.

#### 4.4.117 Error States

Learning supports intentional Content-load, File, external-link, access-check, purchase/access mismatch, search, and retry states. Failed access checks do not automatically become permanent locks.

#### 4.4.118 Partial Data

Missing metadata is not fabricated; absence of a thumbnail does not imply fake cover information.

#### 4.4.119 Mobile Experience

Mobile prioritizes discovery, search/filter, clear access state, readable detail, simple open/view, and External URL/File handling without CMS-like density.

#### 4.4.120 Desktop Experience

Desktop may use richer discovery layouts while remaining simple and content-focused for Students. Admin complexity stays out of Student UI.

#### 4.4.121 Admin Desktop Experience

Authorized Content management may be denser and desktop-optimized; Section 6.1 owns detailed Admin UX.

#### 4.4.122 Accessibility

Learning preserves RTL correctness, readable typography, accessible links/Files, keyboard/focus behavior, touch targets, non-color-only access states, external-destination indication, and accessible metadata.

#### 4.4.123 Light / Dark

Canonical Light and Dark themes preserve reading comfort, Resource hierarchy, access clarity, and restrained brand language.

#### 4.4.124 Content Security Boundary

Paid/private access cannot rely on hidden links alone. Backend authority protects actual Resources where technically controllable.

#### 4.4.125 External URL Security Reality

KonkourX controls access to an external link but cannot promise provider behavior or unsupported DRM. Exact provider/security strategy remains open.

#### 4.4.126 File Storage Boundary

Internally stored Files use shared storage abstraction rather than permanent local-filesystem coupling. Provider choice belongs to architecture.

#### 4.4.127 School Content Reuse

School consumes or shared-manages Content under Organization scope using the shared engine.

#### 4.4.128 Future Course Purchase

Future Courses may be separately paid, Plan-included, or Organization-granted through the same Business/Entitlement system rather than a Course-specific payment engine.

#### 4.4.129 Content → Notification

Configured publication/access events may use shared Notifications under Section 5.2.

#### 4.4.130 Content → Counselor Communication

Counselors may reference canonical Content in contextual Chat rather than duplicating the educational File into every conversation.

#### 4.4.131 Content → Student Dashboard

The Dashboard may later show a small justified Resource shortcut, but Learning never displaces Today Plan or current-action priority.

#### 4.4.132 Content Recommendation Boundary

Manual/editorial Featured Content and intelligent personalized recommendation are distinct; advanced personalization remains future.

#### 4.4.133 Future Personalization

Future recommendations may use real Curriculum, Practice, Exam, and Study evidence through explicitly designed behavior. They are not current core.

#### 4.4.134 No Automatic Commercial Action

A recommendation never automatically purchases Content, enrolls the Student, charges payment, or grants Entitlement without an explicit authorized workflow.

#### 4.4.135 Learning Content Anti-Drift

Learning must not become hardcoded frontend links, a duplicate School repository or Curriculum taxonomy, Question Bank, Practice, Exam, an immediate deep LMS, mandatory internal streaming, permanent Telegram lock-in, hardcoded Plan access, unrestricted editor-controlled commerce, hidden Mastery, fake engagement, or a generic no-code builder. The canonical model is shared Content + approved practical types + canonical Curriculum links + controlled publication and commerce + Effective Access + File/URL delivery + Student Library + Counselor/School reuse, with future Course/video/progress/recommendation extensibility.

#### 4.4.136 Current vs. Future

`APPROVED FUTURE STATE — CORE LEARNING CONTENT DIRECTION`:

- one shared Content model with Article, PDF, File, External Link, and Video Resource directions;
- canonical and multiple Curriculum links where meaningful, practical metadata, and Draft/Published/Archived states;
- authorized Admin/Content management, editable File/URL delivery, and allowed Telegram/external hosting without permanent lock-in;
- Student Resource Library, search/filter, truthful access states, and Free/Paid/Plan/Organization/User-override/one-time-purchase compatibility through Effective Access;
- separation of editing, publication, and commercial authority plus canonical Counselor sharing, School reuse, and shared Notifications;
- no current deep LMS or internal Video Platform requirement.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- Lesson, Course, sequencing, progress, completion, Continue Watching, internal Video Hosting, protected streaming, playback progress, recorded Courses, class recordings, richer Analytics, intelligent recommendations, future Teacher workflows, and AI authoring assistance.

Future capabilities must not be presented as implemented or core-now. Actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md), and implementation requires a separately approved milestone.

#### 4.4.137 Decision Gates

Closed decisions:

- Learning Content remains distinct from Question Bank, Practice, Exam, and Live Classroom and uses one shared model across Student, Counselor, and School contexts;
- current practical types include Article, PDF, File, External Link, and Video Resource, delivered by File and/or External URL, with Telegram/external video hosting currently allowed but not permanent lock-in;
- Lesson, Course, progress, Continue Watching, internal hosting/streaming, and recorded Course/Class capabilities remain future/extensible;
- Content may have multiple canonical Curriculum links or no link where appropriate, without a Learning taxonomy or Curriculum-to-LMS/knowledge-graph conversion;
- Draft, Published, and Archived are the current controlled state direction; broad user authoring is not approved, and editing, publication, and commercial authority remain separable;
- commercial state requires authorized approval and may be Free, Paid, Plan-based, Organization-granted, User-override granted, or one-time-purchase compatible through shared Effective Access;
- Plan names are not hardcoded, backend authorization is authoritative, and Section 6.2 remains the payment engine;
- Counselor shares canonical Content without gaining edit/commercial authority, and School/Organization reuse the shared engine;
- viewing or future completion never automatically means Curriculum Coverage or Mastery;
- no social rating, Learning leaderboard, fake engagement, AI auto-publication, current personalized recommendation, or automatic commercial action is authorized.

Remaining implementation-stage choices:

- required and type-specific fields; Draft/Publish/Archive, editor/publisher/commercial Permission names, and public visibility of Free Content;
- search/filter, card/detail, locked-state, file limits, download/view, external-link, broken-link, and internal-routing UX;
- historical purchase/archive/access policy and effects of commercial-state changes on existing users;
- Organization-scoped Content, ordering/featured behavior, archive/delete policy, and responsive layouts;
- future Course/Lesson models, progress rules, Video provider/hosting and streaming/security strategy, Analytics, recommendations, Teacher Permissions, and AI assistance.

These choices do not reopen any closed product decision.

## 5. Communication & Classroom

### 5.1 Messaging

Messaging is the shared, lightweight, context-aware conversation capability for authorized product relationships and educational/counseling workflows. Its primary current relationship is Student ↔ assigned Counselor; future authorized Student ↔ Teacher communication may reuse it.

The canonical principle is **authorized relationship + lightweight conversation + canonical context references + finite retention + shared Notifications + privacy**. Messaging remains distinct from Notifications, Tickets, and Classroom and is not a social network, public messenger, general team chat, support replacement, or mass-broadcast system.

#### 5.1.1 One Shared Messaging Domain

Supported direct conversations reuse one Messaging domain. Role, relationship, Permission, Organization scope, and context determine access; separate Student, Counselor, Teacher, or School messaging engines are prohibited where semantics match.

#### 5.1.2 Counselor Chat Reuse

Section 3.5 remains authoritative for Counselor-facing Chat behavior. This section supplies shared platform semantics and must not create a conflicting model.

#### 5.1.3 Student Chat Reuse

Section 2.7 remains authoritative for the Student communication entry. Messaging preserves one conversation truth rather than duplicating Student Chat.

#### 5.1.4 Primary Current Relationship

Current direct Messaging is Student ↔ assigned Counselor and requires a valid authorized relationship. Students without a Counselor receive an honest state, not a fabricated conversation.

#### 5.1.5 Future Teacher Relationship

Future Student ↔ Teacher Messaging may reuse the shared domain only through an authorized relationship. It is not current core and does not create a public Teacher-directory messenger.

#### 5.1.6 Admin ↔ User Boundary

Admin/User Messaging may exist only for explicitly defined operational scenarios. Admin role alone never authorizes arbitrary direct messages or casual conversation browsing.

#### 5.1.7 Relationship-Scoped Conversation

Access is grounded in a real Student/Counselor assignment, future Teacher relationship, or authorized Organization context. Knowing a user ID is never sufficient authority.

#### 5.1.8 Backend Authorization

Server-side enforcement governs participants and access. Hidden UI, route guards, client participant IDs, and displayed role labels are insufficient.

#### 5.1.9 Conversation

A Conversation is authorized shared context between participants and is not a Ticket, Notification, Session, Private Note, or Classroom.

#### 5.1.10 Direct Conversation Model

Current core is lightweight direct conversation. Broad group or class communication requires separate product definition.

#### 5.1.11 No General Group Chat

Arbitrary groups, public channels, communities, fan groups, study groups, and large broadcast Chats are not approved.

#### 5.1.12 Classroom Chat Is Separate

Future Classroom communication belongs to Section 5.4 and must not be permanently modeled as ordinary Student/Counselor direct Chat.

#### 5.1.13 Ticket Conversation Is Separate

Ticket discussion and timeline belong to Section 5.3 formal support workflow, not direct Messaging.

#### 5.1.14 Message Core Types

Approved current direction includes Text, Image, File, PDF/document, Link, and Reply/reference. Voice remains future/extensible.

#### 5.1.15 Text Message

Text supports normal Persian/RTL conversation. Exact formatting remains open; Messaging is not a rich document editor.

#### 5.1.16 Image Message

Images may be shared subject to later-defined size, format, compression, and preview rules.

#### 5.1.17 File / Document Message

Files and PDFs/documents may be shared where permitted. Expired or unavailable attachments must not appear as working downloads.

#### 5.1.18 Link Message

Links may reference internal KonkourX objects or external destinations. Preview behavior remains an implementation-stage choice.

#### 5.1.19 Reply

A Reply may reference one prior Message with understandable context. A complex threaded hierarchy is not implied.

#### 5.1.20 Voice Message Future

Voice recording, storage, and transcoding remain future/extensible rather than current core requirements.

#### 5.1.21 Message Context

Messages may reference canonical Tasks, daily/weekly Plans, Study Reports or Records, Practice, Exams or Results, Learning Resources, Sessions, Curriculum context, and future approved objects.

#### 5.1.22 Context References Canonical Objects

Messaging references the real underlying object and never duplicates a Task, Exam, Result, Resource, Session, or Curriculum node.

#### 5.1.23 Context Card

UI may present a compact contextual card with truthful metadata and an Open action. Exact rendering remains open.

#### 5.1.24 Context Access Check

A Message reference never grants access to its underlying object. Opening it still follows domain authorization.

#### 5.1.25 Context After Access Change

If access later changes, the Message may remain while its destination becomes restricted. Chat never bypasses authorization.

#### 5.1.26 Context Snapshot Boundary

Historical card behavior after source changes remains open. Messaging is never the canonical historical source for referenced domain objects.

#### 5.1.27 Sent State

Sent state reflects authoritative acceptance. Failed requests must never appear successfully sent; detailed delivery taxonomy remains open.

#### 5.1.28 Read / Unread

Simple read/unread behavior is core and sufficient. A large presence or read-receipt system is not implied.

#### 5.1.29 No Presence Requirement

Online status, last seen, typing indicators, active-now state, and exact presence are not current requirements.

#### 5.1.30 No Social Status Features

Stories, status posts, public bio feeds, followers, and reaction-based social presence are prohibited from current Messaging scope.

#### 5.1.31 Notification Integration

New Message events reuse the shared Notification system rather than owning a parallel infrastructure.

#### 5.1.32 Message Notification Deep Link

Notifications deep-link to the authorized Conversation or relevant context rather than a detached page.

#### 5.1.33 Unread Counter

Real unread counts may appear where useful and must never be fabricated for engagement.

#### 5.1.34 Mark Read

Exact mechanics remain open; the locked requirement is consistent useful unread/read state.

#### 5.1.35 Finite Retention

Ordinary direct Chat has finite retention and is not assumed to provide permanent unlimited history.

#### 5.1.36 Default Message Retention Direction

The configurable, server-enforced default direction is approximately six months for ordinary Messages. Exact legal/deployment value remains a Decision Gate and is not hardcoded.

#### 5.1.37 Default Attachment Retention Direction

The configurable, server-enforced default direction is approximately three months for attachments, potentially shorter than text retention.

#### 5.1.38 Retention Server Authority

Retention is backend/domain behavior, not pagination or frontend hiding while indefinite user-accessible history remains.

#### 5.1.39 Expired Message History

Expired ordinary history is no longer normally accessible according to policy. Technical deletion, anonymization, or storage details remain legal/architecture decisions.

#### 5.1.40 Expired Attachments

If text remains after attachment expiry, the UI shows an intentional expired/unavailable state rather than a broken download.

#### 5.1.41 Retention Exceptions

Ticket, complaint, investigation, Audit, and formal administrative evidence use separately governed retention.

#### 5.1.42 Chat → Ticket Preservation

Selected context referred into a Ticket may be retained as formal evidence under Ticket policy. Ordinary Chat expiry must not destroy formal Ticket truth.

#### 5.1.43 Search Boundary

Richer Message search is future/non-blocking. Architecture should not make it impossible, but it is not a launch requirement.

#### 5.1.44 Search and Retention

Future search covers only retained, authorized history and never resurrects expired Chat.

#### 5.1.45 Privacy

Direct Messages are private relationship data visible only to authorized participants and explicitly authorized exceptional roles.

#### 5.1.46 Ordinary Admin Privacy Boundary

Ordinary Admin roles have no casual browse-all-chat authority.

#### 5.1.47 Super Admin Break-Glass

Exceptional Super Admin access follows Section 0: appropriate Permission, explicit reason, attributable access, and Audit where required. No Messaging-specific bypass exists.

#### 5.1.48 No Password / Secret Disclosure

Conversation context never exposes passwords, authentication secrets, session tokens, or security credentials to Counselors or Admins.

#### 5.1.49 Participant Privacy

Counselors see only relationship-authorized Student conversations, not unrelated Counselors, Students, support investigations, or relationships.

#### 5.1.50 Counselor Reassignment Boundary

Access follows the new authorization model after reassignment. Historical visibility for former Counselors remains an implementation Decision Gate; unlimited former access is not assumed.

#### 5.1.51 Relationship End Boundary

Ending the relationship may stop future sending. Exact historical-read behavior remains open.

#### 5.1.52 Chat Is Not Support

Formal issues needing ownership, routing, escalation, and resolution tracking belong to Tickets rather than direct Chat.

#### 5.1.53 Chat → Ticket

An explicit workflow may refer selected Chat context into the central Ticket system without turning every Message into a Ticket.

#### 5.1.54 Selected Context for Ticket

Referral preserves only relevant selected context and never blindly copies the entire private conversation.

#### 5.1.55 Ticket Access After Referral

Section 3.5 remains authoritative: Counselor post-referral access defaults to `NO_ACCESS`; only authorized Admin grant may provide `VIEW_ONLY` or `PARTICIPATE`.

#### 5.1.56 Message Does Not Grant Ticket Access

Participation in source Chat never grants ongoing access to a resulting Ticket. Section 5.3 owns Ticket authorization.

#### 5.1.57 Private Note Is Not Message

Counselor Private Notes remain distinct and must never appear in Student Chat.

#### 5.1.58 Session Is Not Message

Messages may reference a Session but do not replace structured Session history.

#### 5.1.59 Follow-up Is Not Message

A Counselor Follow-up may originate from Message context but remains a separate future Counselor action.

#### 5.1.60 Message → Follow-up

A Counselor may explicitly create a Follow-up from context. Automatic creation is prohibited.

#### 5.1.61 Message → Session

A Counselor may explicitly create or schedule a Session from context. Messaging never schedules it automatically.

#### 5.1.62 Message → Private Note

A Counselor may explicitly create an internal Note from relevant context without duplicating the entire conversation.

#### 5.1.63 Message → Resource

A Counselor may reference canonical Learning Content rather than re-uploading an existing Resource.

#### 5.1.64 Message → Task

Messages may discuss a canonical Task but do not become a Task-editing engine.

#### 5.1.65 Message → Exam / Result

Messages may reference an authorized Exam or released Result but never change its release policy.

#### 5.1.66 Message → Curriculum

Canonical Curriculum may be referenced; Messaging does not create a second taxonomy.

#### 5.1.67 Message Edit Boundary

Editing is not locked. Any future policy must address history and privacy without assuming unrestricted editing.

#### 5.1.68 Message Delete Boundary

Delete-for-self, pre-retention removal, and administrative removal remain undecided and require explicit policy.

#### 5.1.69 Moderation / Abuse Boundary

This is not a social-platform moderation system. Future abuse/reporting must preserve privacy and authorized escalation without automated Chat surveillance.

#### 5.1.70 No Automated Content Surveillance

Continuous AI reading, employee monitoring, sentiment/motivation scoring, automatic Student-risk scoring, and Counselor-quality scoring from private Chat are not authorized.

#### 5.1.71 No Social Reactions Requirement

Emoji reactions, likes, sticker/GIF marketplaces, and reaction Analytics are not current core.

#### 5.1.72 No Message Gamification

Streaks, XP, badges, response points, and Chat leaderboards are prohibited.

#### 5.1.73 No Public Profile Discovery

Username discovery, public user search, open DMs, and public-profile Messaging are not authorized.

#### 5.1.74 Attachment Access

Attachment access respects Conversation authorization and availability. Controlled storage URLs cannot bypass access when copied.

#### 5.1.75 External Link Reality

KonkourX controls the reference but not all security or availability of external destinations and must not promise otherwise.

#### 5.1.76 File Storage Boundary

Internally managed attachments reuse shared storage abstraction and are not permanently coupled to one provider.

#### 5.1.77 Message Order

Conversation presents coherent chronological order. Pagination and loading remain implementation-stage choices.

#### 5.1.78 Timestamps

Send, read, and delivery times appear only when real and known.

#### 5.1.79 Date / Time Presentation

UI may use localized/Jalali presentation; canonical storage and timezone behavior belong to architecture.

#### 5.1.80 Conversation List

Authorized participants may have an inbox showing participant, retained preview, timestamp, unread state, and relationship context. Exact layout remains open.

#### 5.1.81 Inbox Is Not Social Feed

The inbox excludes public discovery, trending Chat, social suggestions, and follower content.

#### 5.1.82 Counselor Operational Integration

Unread Student Messages may surface in Counselor Dashboard/Work Queue while shared Messaging remains the source of truth.

#### 5.1.83 Student Dashboard Integration

A compact real indicator may appear without displacing Today Plan or next-action priority.

#### 5.1.84 School / Organization Boundary

Future Organization roles use Messaging only through authorized relationships and Permissions. School staff do not automatically gain access to every Student.

#### 5.1.85 School Does Not Get Duplicate Messaging

School/Institute reuses shared Messaging where the relationship model applies.

#### 5.1.86 Teacher Permission Boundary

Future Teacher Messaging remains Permission- and relationship-scoped and never opens all Student conversations.

#### 5.1.87 Admin Broadcast Boundary

Administrative broadcast belongs primarily to Section 5.2 Notification/Broadcast behavior rather than private direct Messaging.

#### 5.1.88 Message Delivery Channel Boundary

Direct Messaging is in-product. SMS, email, Telegram, and push belong to Notification/integration or future channel architecture; private Chats are not automatically mirrored externally.

#### 5.1.89 Data Honesty

Conversation, relationship, participants, Messages, unread/read state, attachments, timestamps, context, availability, and delivery state always reflect real data.

#### 5.1.90 Empty States

Honest states include no conversation, no Messages, no assigned Counselor, no unread Messages, expired attachment, and unavailable conversation after a relationship change.

#### 5.1.91 Error States

Messaging supports intentional load, send, upload, download, unavailable-context, authorization, and retry states. Failed Messages never appear sent.

#### 5.1.92 Partial Data

Unavailable Context details are not fabricated; the UI shows an honest unavailable state while the Conversation remains.

#### 5.1.93 Mobile Experience

Mobile prioritizes participant/context, readable conversation, composer, attachments, Reply, Context Cards, and clear navigation without excessive secondary panels.

#### 5.1.94 Desktop Experience

Desktop may combine inbox, selected Conversation, and compact context while remaining lightweight rather than an enterprise helpdesk console.

#### 5.1.95 Accessibility

Messaging preserves RTL correctness, readable content, keyboard/focus behavior, accessible attachment actions, non-color-only unread state, usable Reply/context controls, touch targets, and understandable expiry states.

#### 5.1.96 Light / Dark

Canonical themes preserve conversation readability, participant clarity, Context Card hierarchy, attachment visibility, read state, and restrained tone.

#### 5.1.97 Privacy-First Error Copy

Authorization errors do not leak unauthorized Conversation or participant existence/details. Exact copy remains open.

#### 5.1.98 Conversation History Integrity

Retained history preserves what was sent and by whom. Unrelated domain changes cannot silently rewrite Messages; edit/delete policy remains separate.

#### 5.1.99 Relationship Provenance

Where useful, enough context remains to explain why a Conversation was authorized. Exact historical representation remains open.

#### 5.1.100 No Message-Based Entitlement Grant

Sending a Resource, Exam, or Feature link does not grant commercial access. Effective Access remains authoritative.

#### 5.1.101 Locked Resource in Chat

A referenced Resource may remain locked or unavailable to the recipient; Messaging never bypasses Entitlements.

#### 5.1.102 Exam Release in Chat

An Exam Result reference cannot bypass Exam release policy or expose unreleased review information.

#### 5.1.103 Private Note Leak Prevention

Private Counselor Notes never become Student-visible Context Cards.

#### 5.1.104 Ticket Leak Prevention

Sensitive Ticket information cannot become visible through Messaging to participants without Ticket access.

#### 5.1.105 Notification Privacy

Notifications expose only surface-appropriate information. Full private Message text is not assumed for every channel.

#### 5.1.106 Retention Configuration Authority

Authorized Admin/system configuration controls retention; ordinary users do not define platform policy.

#### 5.1.107 Retention Does Not Become User Delete

System retention expiry and user editing/deletion are separate concepts.

#### 5.1.108 Search Does Not Override Privacy

Future search respects participant authorization, relationship scope, retention, and Break-Glass governance and never becomes an Admin privacy bypass.

#### 5.1.109 Future AI Summarization Boundary

Separately approved AI may summarize for an authorized participant while preserving privacy and factual accuracy. This is not current core.

#### 5.1.110 Future Message Assistance

Future optional drafting assistance cannot send autonomously, impersonate participants, fabricate Student state, or make hidden counseling decisions.

#### 5.1.111 No Autonomous Messaging

Analytics or signals do not trigger substantive Messages presented as written by a Counselor, Teacher, Admin, or Student. Human-controlled communication remains core.

#### 5.1.112 Message Reminders Boundary

Reminder behavior belongs to Section 5.2; Messaging owns no parallel Reminder engine.

#### 5.1.113 Message Reporting Metrics Boundary

Meaningful facts such as unread counts or defined response timing may support operations, but never every-message productivity, Counselor-quality, or Student-engagement scoring.

#### 5.1.114 No Sentiment / Motivation Score

Private Messages do not produce sentiment, motivation, discipline, mental-state, or relationship-health scores.

#### 5.1.115 No Message Content Ranking

Private content cannot publicly rank Students, Counselors, Teachers, or Schools.

#### 5.1.116 Messaging Anti-Drift

Messaging must not become open DMs, public discovery, general group/social Chat, Ticket/Notification/Classroom replacement, an unlimited archive, Admin browse-all console, duplicate domain records, Entitlement bypass, surveillance/scoring, or autonomous counseling. The canonical model is authorized relationship → private direct Conversation → approved Message types and canonical Context references + read/unread + finite retention + shared Notifications + explicit Ticket transition, governed by ordinary Admin privacy and Section 0 Break-Glass.

#### 5.1.117 Current vs. Future

`APPROVED FUTURE STATE — CORE MESSAGING DIRECTION`:

- one shared relationship- and Permission-scoped direct-Messaging domain centered on Student ↔ assigned Counselor;
- Text, Image, File, PDF/document, Link, Reply, canonical Context Cards, read/unread, real counters, and shared Notifications;
- approximately six-month Message and three-month attachment configurable server-enforced default retention with intentional expiry states;
- private participant access, ordinary Admin privacy, Section 0 Break-Glass, and backend authorization;
- explicit selected-context Chat → Ticket transition while preserving Section 3.5 `NO_ACCESS` default and separate Ticket authorization;
- operational Student/Counselor integration and School reuse where authorized.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- Voice Messages, richer retained-history search, authorized Teacher relationships, explicitly defined Admin/User scenarios, richer previews and delivery/read behavior, AI summarization, drafting assistance, and additional relationship types.

Future capabilities must not be presented as implemented. Actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md), and implementation requires a separately approved milestone.

#### 5.1.118 Decision Gates

Closed decisions:

- Messaging, Notifications, Tickets, and Classroom remain distinct; one shared direct-Messaging domain is preferred;
- Student ↔ assigned Counselor is the current primary relationship; open DMs, arbitrary group/public Chat, and unrestricted Admin Messaging/browsing are not approved;
- current types are Text, Image, File, PDF/document, Link, and Reply, while Voice remains future;
- Context references canonical product objects without duplicating them or granting underlying access;
- read/unread and shared Notifications are approved;
- ordinary Chat retention is finite, configurable, server-enforced, and approximately six months for Messages and three months for attachments by default; formal Ticket/Audit evidence may differ;
- ordinary Admin cannot casually browse private Chat, and exceptional Super Admin access follows Section 0 Break-Glass;
- Chat may explicitly lead to Ticket with selected context, but source participation grants no Ticket access and Counselor access still defaults to `NO_ACCESS` unless Admin grants `VIEW_ONLY` or `PARTICIPATE`;
- Private Notes, Sessions, Follow-ups, Classroom Chat, and Admin Broadcast remain separate systems or concepts;
- Context cannot bypass Entitlements or Exam release; no autonomous substantive messaging, surveillance/scoring, social network, or gamification is authorized;
- School reuses shared Messaging where relationships permit, and backend authorization remains authoritative.

Remaining implementation-stage choices:

- Conversation granularity; reassignment and relationship-end history; attachment limits and UX; exact enforced retention values;
- read/delivery states, Message editing/deletion, Reply and link-preview UX, Context Card rendering, inbox layout, and pagination/loading;
- Notification preview policy, future search, Teacher relationship model, approved Admin/User scenarios, Voice implementation, AI summarization/drafting, and responsive layouts.

These choices do not reopen any closed product decision.

### 5.2 Notifications

Notifications are the shared attention-routing layer. Domain events inform authorized users that something relevant happened or needs attention through clear context and a next action.

The canonical flow is **domain event → shared Notification engine → authorized recipient → concise context → deep link/next action**. Notifications remain distinct from Messages, Tickets, Tasks, Follow-ups, Calendar events, and Classroom and never become a social engagement engine or second source of domain truth.

#### 5.2.1 One Shared Notification Engine

All supported domains reuse one Notification engine. Separate Task, Exam, Message, Ticket, Learning, or School notification engines are prohibited where semantics match.

#### 5.2.2 Source Domain Remains Authoritative

Notification is an attention pointer. Message, Exam Result, Follow-up, Ticket, and every other source domain remain authoritative rather than being copied into a second Notification truth.

#### 5.2.3 In-App Is Current Core Channel

In-App Notification is the current core channel. Push, Email, SMS, and Telegram are not mandatory for current core.

#### 5.2.4 Future Delivery Channels

Push, Email, SMS, and Telegram remain future/extensible transports over shared Notification intent and events, not separate business-rule systems.

#### 5.2.5 Notification vs. Message

Messaging is conversation; Notification is an attention signal. A new Message may generate a Notification, but the Notification is not the Message.

#### 5.2.6 Notification vs. Ticket

Ticket is a formal tracked issue; Notification is awareness of an authorized Ticket event.

#### 5.2.7 Notification vs. Follow-up

Follow-up is Counselor work; Notification may remind the Counselor that it is due but never replaces it.

#### 5.2.8 Notification vs. Task

Task is planned Student work. A Notification may remind the Student but is not a substitute Task model.

#### 5.2.9 Notification vs. Calendar

Calendar/Schedule records remain domain truth. Notifications may alert about upcoming events without duplicating them.

#### 5.2.10 Notification Types

Conceptual areas include Messages, Plans, Tasks, Exams and results, justified Practice events, Sessions, Classroom, Follow-ups, Tickets, Payments, Subscriptions, Learning Content, account/security, and Admin announcements. Exact event taxonomy remains open.

#### 5.2.11 Message Notifications

An authorized new Message may generate an In-App Notification deep-linked to its Conversation without exposing unauthorized details.

#### 5.2.12 Plan / Task Notifications

Meaningful new or changed Plans/Tasks and configured reminders may notify Students. Minor internal saves must not create spam.

#### 5.2.13 Exam Notifications

Approved directions include assigned Exam, availability, approaching deadline, released result, and released review/answer key, always respecting authorization and release policy.

#### 5.2.14 Practice Notification Boundary

Practice is mainly Student-initiated and does not notify on every Question or result. Only explicitly meaningful future events justify alerts.

#### 5.2.15 Session Notifications

Upcoming Counseling Sessions may generate reminders while Session remains authoritative.

#### 5.2.16 Follow-up Notifications

A due Counselor Follow-up may notify the Counselor. A private Follow-up does not notify the Student unless a separate Student-facing action exists.

#### 5.2.17 Ticket Notifications

Assignment, response-needed, status, resolution, and explicit access-grant events may notify authorized users. Ticket details must never leak to unauthorized roles.

#### 5.2.18 Payment Notifications

Payment confirmation/failure, receipt review, Subscription expiry, and access activation may notify according to Section 6.2 source truth.

#### 5.2.19 Learning Content Notifications

Selected new, purchased, or Organization-granted Resources may notify. Ordinary CMS edits do not.

#### 5.2.20 Account / Security Notifications

Important password, recovery, security-state, or account-restriction events may create critical notices. Exact events belong to Identity/security implementation.

#### 5.2.21 Admin Announcements

Authorized Admin announcements use Notification/Broadcast behavior rather than private direct Messaging.

#### 5.2.22 Notification Content

A Notification may include type, title, concise message, timestamp, read state, importance, source reference, deep link, and later delivery state. Storage representation remains implementation detail.

#### 5.2.23 Short and Actionable

Notifications answer what happened, why it matters, and where to go without becoming long-form content.

#### 5.2.24 Deep Links

Deep links route to authorized canonical context such as Conversation, Task, Today Plan, Exam, released Result, Ticket, Resource, or Session.

#### 5.2.25 Deep Link Does Not Grant Access

A deep link never grants access. The destination domain re-checks authorization.

#### 5.2.26 Stale Notification Destination

A Notification may remain after access changes while its destination becomes honestly unavailable. Notification never bypasses current authorization.

#### 5.2.27 Read / Unread

Simple `UNREAD` and `READ` states are current core.

#### 5.2.28 Mark as Read

Users can mark relevant Notifications read; exact interaction remains open.

#### 5.2.29 Mark All as Read

Mark All as Read is approved within the user's authorized scope.

#### 5.2.30 Unread Count

Real unread counts may be shown and are never fabricated for engagement.

#### 5.2.31 Notification Center

Users have an In-App Notification Center organizing unread, recent, category/type, timestamp, and action/deep link. Exact layout remains open.

#### 5.2.32 Notification History

In-App history is limited and finite rather than a permanent Audit record.

#### 5.2.33 Notification Retention

History may have configurable retention. Audit, Ticket, and security records may follow different policies.

#### 5.2.34 Source Record May Outlive Notification

A Notification may expire while its Exam, Ticket, Message, or other source persists.

#### 5.2.35 Notification May Outlive Active Action

A retained Notification may remain after the action is completed. Exact stale-state UX remains open.

#### 5.2.36 Severity / Importance

A simple informational, important, or critical concept may be used. Exact names remain open; this is not an incident-management severity system.

#### 5.2.37 Severity Has Meaning

Severity reflects real importance, such as a critical security issue, and cannot be inflated to force engagement.

#### 5.2.38 No Attention Manipulation

Fake urgency, artificial pressure, meaningless red badges, repeated duplicates, and manipulative failure wording are prohibited.

#### 5.2.39 Notification Deduplication

Meaningless duplicate Notifications should be avoided where semantics allow. Exact rules remain implementation-stage choices.

#### 5.2.40 No Badge Spam

Only events with useful awareness or action value notify; minor events do not produce badge spam.

#### 5.2.41 User Preferences

Users may configure optional categories or future channels. Exact matrix remains open.

#### 5.2.42 Optional Notification Categories

Selected Learning updates, reminders, or product announcements may be configurable when non-critical. Defaults remain open.

#### 5.2.43 Critical Notifications

Required account, security, payment/access, or operational notices may not be fully disableable. Exact event set remains security/implementation policy.

#### 5.2.44 User Preferences Do Not Bypass Required Notice

Disabling optional Notifications never suppresses required critical notices.

#### 5.2.45 Channel Preferences

Future external channels may have channel-specific preferences. Exact Push/Email/SMS/Telegram matrix remains future detail.

#### 5.2.46 In-App Remains Authoritative Product Surface

Even with future channels, In-App remains the canonical awareness surface for supported events.

#### 5.2.47 Push Future

Push remains future/extensible and is not required for current core.

#### 5.2.48 Email Future

Email remains future/extensible and requires privacy-conscious event selection.

#### 5.2.49 SMS Future

SMS may later serve selected critical or OTP/security use cases and is not a default noise channel.

#### 5.2.50 Telegram Future

Telegram delivery may be configured later but never automatically mirrors private Chats.

#### 5.2.51 Channel Delivery Is Secondary

External delivery is transport over shared Notification intent; providers do not own separate product rules.

#### 5.2.52 External Channel Privacy

External previews require privacy-conscious redaction because they may be visible outside the app.

#### 5.2.53 No Full Private Message in Every Channel

External channels need not show full private text; a generic new-message alert may be appropriate.

#### 5.2.54 Broadcast

Authorized Admin may send Broadcast Notifications to approved audiences. Broadcast remains distinct from direct Messaging.

#### 5.2.55 Broadcast Audience

Audiences may include one or selected users, Roles, grade/track, School/Organization, or all authorized users. Exact builder remains open.

#### 5.2.56 Broadcast Authorization

Broadcast requires explicit Permission; Admin-like roles cannot automatically send to everyone.

#### 5.2.57 Broadcast Is Not Chat

Broadcast does not create a direct Conversation with every recipient.

#### 5.2.58 Broadcast Is Not Ticket

Broadcast does not create formal Ticket cases.

#### 5.2.59 Broadcast Scheduling

Authorized Broadcast scheduling may be supported where useful. Exact UX remains open.

#### 5.2.60 Broadcast History

Authorized Admin may have attributable operational Broadcast history. Exact reporting remains open and does not create marketing automation.

#### 5.2.61 No Spam Broadcast

High-frequency irrelevant promotional Broadcast is prohibited; product trust takes priority.

#### 5.2.62 Scheduled Reminders

Shared Notifications may remind about real Sessions, Exams, Tasks, Subscription expiry, Follow-ups, and Classroom events.

#### 5.2.63 Reminder References Source Domain

Every reminder references its real underlying event rather than duplicating scheduled truth.

#### 5.2.64 Task Reminder

Task reminders may follow Student preferences and product rules. Timing remains open.

#### 5.2.65 Exam Reminder

Authorized Students may receive availability or deadline reminders.

#### 5.2.66 Session Reminder

Counseling Sessions may generate upcoming reminders with later-defined timing.

#### 5.2.67 Classroom Reminder

Classroom events may generate reminders while Section 5.4 remains authoritative.

#### 5.2.68 Subscription Reminder

Subscription/payment systems may trigger expiry or access reminders while Section 6.2 remains source truth.

#### 5.2.69 Follow-up Reminder

Counselor Follow-up may remind the Counselor while Section 3.5 retains the work item.

#### 5.2.70 Reminder Timing Configuration

Exact timing may be system-defined, Admin-configured, or user-configurable and remains a Decision Gate.

#### 5.2.71 No Duplicate Reminder Engines

Task, Exam, Session, and other reminders reuse shared mechanisms fed by their domains.

#### 5.2.72 Notification Preferences vs. Domain Rules

Turning off a reminder never deletes or changes the underlying Task, deadline, Session, or event.

#### 5.2.73 Notification Actions

Simple actions such as Open Message, View Task, Start Exam, View Result, Open Ticket, Join Class, or View Resource deep-link to canonical domains.

#### 5.2.74 No Domain Mutation from Display

Viewing a Notification never silently completes a Task/Follow-up, resolves a Ticket, submits an Exam, or purchases Content. Domain action requires an explicit workflow.

#### 5.2.75 Authorization at Generation

Generation targets only authorized recipients and does not reveal that inaccessible objects exist.

#### 5.2.76 Authorization at Open

Authorization is checked again at open to account for Role, assignment, Entitlement, Ticket, or Organization changes.

#### 5.2.77 Ticket Privacy

Ticket Notifications respect `NO_ACCESS`, `VIEW_ONLY`, `PARTICIPATE`, and other Permissions without leaking case details.

#### 5.2.78 Message Privacy

Message Notifications respect Conversation authorization and avoid exposing sensitive full content outside secure context.

#### 5.2.79 Exam Release Privacy

Notifications cannot reveal answers, results, explanations, or review data before Exam policy permits.

#### 5.2.80 Content Entitlement Privacy

Content Notifications never grant paid access; the destination enforces Effective Access.

#### 5.2.81 School / Organization Notifications

School Exam, Classroom, Organization Resource, and announcement events reuse the shared engine rather than a School-specific system.

#### 5.2.82 Organization Audience Scope

Organization audiences respect membership and Permissions; School staff cannot broadcast outside their scope.

#### 5.2.83 Counselor Notifications

Counselors may receive new Message, due Follow-up, upcoming Session, relevant report, and authorized Ticket notices. Notifications do not become a second Work Queue.

#### 5.2.84 Work Queue Relationship

Work Queue represents work to do; Notification Center represents awareness. An event may appear in both while source/work state remains authoritative.

#### 5.2.85 Student Notifications

Student events may include Counselor Message, Plan change, assigned Exam, Result release, Session, Learning Resource, and account/payment notice.

#### 5.2.86 Admin Notifications

Permission-relevant applications, Ticket escalations, payment reviews, Question reviews, and Content events may notify Admin roles. Exact set remains open.

#### 5.2.87 Super Admin Notification Boundary

Super Admin does not receive every platform event by default; a global firehose is prohibited.

#### 5.2.88 Notification Aggregation

Related events may be grouped to reduce noise. Exact rules remain open.

#### 5.2.89 Aggregation Must Preserve Meaning

Grouping cannot hide critical distinctions or bury security events.

#### 5.2.90 Event Priority

Ordering may use unread state, recency, and meaningful importance without opaque engagement ranking.

#### 5.2.91 No AI Priority Required

Current Notification Center needs no AI ranking; understandable ordering is sufficient.

#### 5.2.92 Quiet Hours Future / Optional

Quiet Hours for external channels or reminders remain future/optional, with possible critical exceptions.

#### 5.2.93 Daily Digest Future

Digests for suitable non-critical events remain future and do not replace urgent alerts.

#### 5.2.94 Smart Bundling Future

Advanced explainable bundling remains future and cannot suppress critical events.

#### 5.2.95 AI Notification Boundary

Future AI may summarize groups or reduce duplicate noise but cannot invent events or urgency, suppress required notices, change domain truth, or send substantive Messages as users.

#### 5.2.96 No Engagement Score

Notification response, discipline, and unread-risk scores for Students or Counselors are prohibited.

#### 5.2.97 No User Punishment for Unread

Unread count is not behavioral judgment and does not label a user irresponsible.

#### 5.2.98 No Marketing Automation Platform

Broadcast does not authorize funnels, lead scoring, drip campaigns, behavioral advertising, or a full marketing-automation suite.

#### 5.2.99 Security Notification Boundary

Security notices provide enough information to act without leaking sensitive internal details. Exact wording remains a security decision.

#### 5.2.100 Delivery Failure

Failed future Push, Email, SMS, or Telegram delivery must not appear successful. Retry policy remains open.

#### 5.2.101 In-App Delivery Failure

Failed internal creation must not pretend the user was notified. Technical observability belongs to implementation.

#### 5.2.102 Data Honesty

Notifications, events, timestamps, counts, severity, delivery state, recipients, destinations, audiences, and reminder schedules always reflect real state.

#### 5.2.103 Empty States

Honest states include no Notifications, no unread items, and no items in a selected category. Fake activity is prohibited.

#### 5.2.104 Error States

Center loading, mark-read, preference-save, and destination errors support retry. Failed load cannot masquerade as verified zero Notifications.

#### 5.2.105 Partial Data

When source preview is unavailable, the UI shows honest partial state rather than fabricated details.

#### 5.2.106 Mobile Experience

Mobile prioritizes unread/recent, concise content, source, timestamp, importance, deep link, and simple mark-read without Admin density.

#### 5.2.107 Desktop Experience

Desktop may add filtering and grouping while remaining an attention center rather than a BI dashboard.

#### 5.2.108 Accessibility

Notifications preserve RTL correctness, readable content, non-color-only states, keyboard/focus behavior, touch targets, accessible actions, and understandable critical/locked states.

#### 5.2.109 Light / Dark

Canonical themes preserve unread distinction, importance hierarchy, scanability, and restrained emphasis.

#### 5.2.110 Localization

Presentation follows Persian/RTL and product date/time conventions. Exact localization remains implementation detail.

#### 5.2.111 Duplicate Event Boundary

Duplicate processing must not emit repeated identical alerts. Technical idempotency belongs to architecture.

#### 5.2.112 Event Update Boundary

Update or replacement behavior after source changes remains open, but historical Notification meaning cannot be rewritten falsely.

#### 5.2.113 Cancelled Event Reminders

Future reminders stop when their source event is cancelled or invalidated. Exact mechanics remain technical.

#### 5.2.114 Notification Source Traceability

Notifications retain enough source reference to explain their origin and avoid anonymous alerts.

#### 5.2.115 Internal System Notice

Platform-generated notices remain authorized, truthful, relevant, and operationally attributable where needed.

#### 5.2.116 Admin Broadcast Accountability

Meaningful Broadcast sends are attributable to the authorized actor/system. Section 6.1 owns Audit policy; recipient views are not each Audited.

#### 5.2.117 Broadcast Does Not Bypass Privacy

Broadcast cannot expose private Student or Counselor data outside authorized audience/context.

#### 5.2.118 Notification Analytics Boundary

Future delivery, unread, and failure counts may support operations but not behavioral engagement surveillance.

#### 5.2.119 No Open-Rate Quality Score

Read behavior does not create Student motivation, Counselor quality, or engagement grades.

#### 5.2.120 No Auto-Intervention from Unread

Unread status does not automatically create a Ticket, schedule a Session, punish a Student, alter a Plan, or change Counselor status.

#### 5.2.121 Shared Engine Reuse

Student, Counselor, Admin, School, and future Teacher contexts reuse the same engine with authorized events and audiences.

#### 5.2.122 School Does Not Get Duplicate Notifications

Organization events reuse shared Notification infrastructure.

#### 5.2.123 Future Teacher Notifications

Future Teacher workflows may receive authorized class/Student notices through the shared architecture. Details remain future.

#### 5.2.124 Classroom Integration

Class scheduled, starting, changed, or cancelled events may notify while Section 5.4 remains authoritative.

#### 5.2.125 Learning Integration

Learning Content generates selected events through the shared engine.

#### 5.2.126 Question Bank Integration

Needs Changes, approval/rejection, and review assignment may notify Question authors or Reviewers. Exact events remain open.

#### 5.2.127 Question Bank Notification Boundary

Notification informs authorized people but never changes moderation state.

#### 5.2.128 Payment Integration

Payment events may notify users or staff but do not themselves activate Entitlements; Business remains authoritative.

#### 5.2.129 Access Change Notifications

Purchase activation, Entitlement expiry, and Organization access changes may notify. Exact set remains open.

#### 5.2.130 Notification Anti-Drift

Notifications must not become module-specific engines, badge spam, Messaging/Ticket/Work Queue replacement, permanent Audit archive, provider-hardcoded rules, privacy-leaking previews, automated scoring, marketing automation, or unread-driven intervention. The canonical model is shared domain event → shared engine → authorized recipient → In-App Notification with read state, importance, deep link, preferences, finite history, and optional reminder/Broadcast, extensible to future channels and bundling.

#### 5.2.131 Current vs. Future

`APPROVED FUTURE STATE — CORE NOTIFICATION DIRECTION`:

- one shared domain-event-driven Notification engine with In-App as the current core channel;
- meaningful Message, Plan/Task, Exam/result, Session, Follow-up, Ticket, payment/subscription, Learning, account/security, and Admin announcement directions;
- read/unread, real count, Mark Read, Mark All Read, Notification Center, concise context, authorized deep links, simple importance, and finite history;
- optional preferences with required critical-notice exceptions, shared reminders, Permission-controlled Broadcast, Organization reuse, and backend privacy enforcement;
- anti-spam, anti-manipulation, and no automatic behavioral scoring.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- Push, Email, SMS, Telegram, channel preferences, Quiet Hours, Daily Digest, smart bundling, richer delivery tracking, advanced Broadcast scheduling, Teacher Notifications, and AI-assisted grouping/summarization.

Future capabilities must not be presented as implemented. Actual availability is recorded in [PROJECT_STATE.md](PROJECT_STATE.md), and implementation requires a separately approved milestone.

#### 5.2.132 Decision Gates

Closed decisions:

- one shared Notification engine remains distinct from Messaging, Tickets, Tasks, Follow-ups, Calendar, and Classroom, with source domains authoritative;
- In-App is current core, while Push, Email, SMS, and Telegram remain future/extensible transports;
- read/unread, real unread count, Mark All Read, Notification Center, concise content, and authorized deep links are approved, and links never grant access;
- simple meaningful importance is approved; history is finite; optional preferences cannot suppress required critical notices;
- shared reminders reference source events; Admin Broadcast belongs to Notifications, requires Permission, and creates neither Chat nor Tickets;
- Ticket, Message, Exam, Content, and Organization privacy/access rules remain binding, including authorization at generation and open;
- School/Organization reuses the shared engine; Notifications do not become a second Work Queue;
- badge spam, fake urgency, manipulative engagement, behavioral scoring, unread-driven intervention, marketing automation, and privacy-leaking external previews are prohibited;
- future AI may assist grouping but cannot invent events/urgency, suppress critical notices, change domain truth, or impersonate users.

Remaining implementation-stage choices:

- event taxonomy, importance names, retention duration, categories, preference defaults, critical-event set, and reminder timing;
- deduplication/aggregation, Broadcast audience and scheduling, preview/redaction, external providers, delivery retry, ordering, stale/update/cancellation behavior;
- responsive layouts, Quiet Hours/Digest, and future AI bundling/summarization.

These choices do not reopen any closed product decision.

### 5.3 Ticket and Referral System

Ticket is KonkourX's formal, trackable operational issue workflow for cases that require ownership, routing, assignment, accountability, status, escalation, formal response, resolution, and durable history.

The canonical flow is **issue/request → Ticket → category/Queue → assignment → formal workflow → resolution → historical Timeline**. Ticket is distinct from Chat, Notification, Private Note, Session, Follow-up, Student Task, and Work Queue item.

#### 5.3.1 One Central Ticket System

KonkourX uses one shared central Ticket system. Category, Queue, Permissions, sensitivity, Organization scope, and assignment specialize behavior; separate Student, Counselor, Payment, School, Complaint, or Technical engines are prohibited where the formal workflow semantics match.

#### 5.3.2 Section 3.5 Reuse

Section 3.5 defines the Counselor-facing relationship to Tickets. This section is authoritative for the central lifecycle and must not be duplicated by a conflicting Counselor-specific lifecycle.

#### 5.3.3 Ticket vs. Chat

Chat is conversation; Ticket is a formal tracked issue. Chat may lead to a Ticket, but Ticket is not a renamed Chat thread.

#### 5.3.4 Ticket vs. Notification

Ticket is the issue and workflow; Notification creates awareness of Ticket events. A Notification never becomes the Ticket record.

#### 5.3.5 Ticket vs. Follow-up

Counselor Follow-up represents future Counselor work. Ticket is a formal cross-role issue workflow and is not replaced by Follow-up for support, complaint, payment, or account cases.

#### 5.3.6 Ticket vs. Private Note

Private Counselor Note preserves internal counseling context. Formal support issues must not be hidden inside Private Notes.

#### 5.3.7 Ticket vs. Session

Counseling Session is an interaction record; Ticket is a tracked issue. A Session may reveal a need for a Ticket without becoming one.

#### 5.3.8 Ticket Origins

Approved conceptual origins include Student, Counselor, Admin, Support, explicit Chat referral, Payment workflow, Account workflow, School/Organization context, and other approved product workflows. The exact origin taxonomy remains implementation-stage design.

#### 5.3.9 Student-Created Ticket

A Student may create a formal Ticket for supported categories. It remains scoped to that Student and the relevant issue; exact form fields are not locked here.

#### 5.3.10 Counselor-Created / Referred Ticket

A Counselor may create or refer a Ticket where permitted. Creation or referral grants neither automatic ownership nor continuing access.

#### 5.3.11 Admin / Support Origin

Authorized Admin or Support roles may create operational Tickets. This does not give every Admin role unrestricted Ticket authority.

#### 5.3.12 Payment Origin

Payment or business workflows may create or lead to a Ticket when formal investigation is required. Section 6.2 remains authoritative for Payment and Business truth.

#### 5.3.13 Chat → Ticket

Escalating or referring Chat into Ticket is an explicit conversation-to-formal-workflow transition. Not every Chat becomes a Ticket automatically.

#### 5.3.14 Selected Chat Context

A Chat referral may preserve the Student, referring actor, selected relevant Messages, issue explanation, category, and linked context. It must not blindly copy the entire private Chat history.

#### 5.3.15 Context Reference

A Ticket may reference canonical User, Payment, Subscription, Counselor relationship, Task, Exam, Resource, Organization, or Message context without duplicating source-domain truth.

#### 5.3.16 Context Does Not Grant Access

A Ticket reference never grants access to its referenced object. Underlying authorization remains authoritative.

#### 5.3.17 Ticket Category

Every Ticket has an appropriate issue category or route. Conceptual categories include Academic/Planning, Technical, Payment/Subscription, Account/Login, Counselor Management, Change Counselor, Complaint, School Support, Content, and future authorized categories; exact taxonomy remains open.

#### 5.3.18 Category Is Operational

Category supports routing, assignment, authorization, reporting, and resolution. It is not a marketing taxonomy.

#### 5.3.19 Queue

Queue identifies the operational destination responsible for handling a case. Conceptual routes include Academic/Planning to academic handling, Technical to Support, Payment/Subscription to Finance/Admin, Account to Support/Admin, Counselor Management to authorized management, Complaint to authorized Admin/Super Admin, School Support to authorized School/platform support, and Content to Content/Admin.

#### 5.3.20 Category vs. Queue

Category describes issue type; Queue describes where it is handled. They need not be the same implementation field.

#### 5.3.21 Extensible Queues

Routing remains extensible and must not be hardcoded around one universal Support Queue.

#### 5.3.22 Queue Permissions

Queue access is permission-controlled. An Admin-like role does not automatically receive every Queue.

#### 5.3.23 Organization Queue Scope

School/Organization support may use Organization-scoped Tickets. Organization staff never receive platform-wide Ticket access merely through membership.

#### 5.3.24 Assignment

A Ticket may be assigned to an authorized person, role/team/Queue context, or operational handler. Exact assignment mechanics remain implementation-stage design.

#### 5.3.25 Assigned Handler

The assigned handler is responsible for the Ticket within authorized scope. Assignment does not change the original requester or affected user.

#### 5.3.26 Reassignment

Authorized roles may reassign a Ticket. Reassignment preserves history rather than silently replacing the previous assignment.

#### 5.3.27 Referral

A Ticket may be referred or routed to another authorized Queue or handler. Referral preserves the formal Ticket history.

#### 5.3.28 Escalation

A Ticket may be escalated when different or higher authority is required. Exact rules remain open, and escalation is not a hidden severity score.

#### 5.3.29 Routing Reason

Where operationally meaningful, routing, reassignment, or escalation preserves an attributable reason or context. The exact mandatory-reason matrix remains implementation-stage design.

#### 5.3.30 Ticket Status Model

The closed canonical lifecycle concepts are OPEN, ASSIGNED, IN_PROGRESS, WAITING_USER, WAITING_INTERNAL, RESOLVED, CLOSED, and REOPENED, with equivalent localized or technical labels permitted.

#### 5.3.31 OPEN

OPEN means the Ticket exists and is awaiting or entering formal handling.

#### 5.3.32 ASSIGNED

ASSIGNED means responsibility has been assigned to an authorized handler or context.

#### 5.3.33 IN_PROGRESS

IN_PROGRESS means active handling, investigation, or work is underway.

#### 5.3.34 WAITING_USER

WAITING_USER means the next required action is expected from the requesting or affected user. The Ticket remains unresolved.

#### 5.3.35 WAITING_INTERNAL

WAITING_INTERNAL means the Ticket awaits another internal dependency, role, or process and remains unresolved.

#### 5.3.36 RESOLVED

RESOLVED means the handling team believes the issue has been addressed. It remains distinct from CLOSED.

#### 5.3.37 CLOSED

CLOSED means the active Ticket lifecycle ended according to product rules. Its historical record remains.

#### 5.3.38 REOPENED

Where product rules permit, a resolved or closed Ticket may be REOPENED without losing its prior lifecycle history.

#### 5.3.39 No Destructive Status Rewrite

Status changes must never erase earlier Ticket state or history.

#### 5.3.40 Status Transitions

The exact transition matrix remains implementation-stage design; this map does not prescribe a generic workflow engine. Meaningful status changes must be traceable.

#### 5.3.41 Formal Ticket Timeline

Every Ticket has a formal historical Timeline explaining what happened to the case.

#### 5.3.42 Timeline Event Content

Meaningful persisted events may include creation, assignment, reassignment, Queue change, referral, escalation, status change, authorized response, resolution, reopen, and access grant or revocation.

#### 5.3.43 Timeline Actor

Meaningful Timeline events identify the responsible authorized actor or system where applicable; formal workflow history is not anonymous.

#### 5.3.44 Timeline Time

Meaningful Ticket events preserve real timestamps without fabrication or destructive overwrite.

#### 5.3.45 Timeline Reason

When an administrative action requires justification, its relevant reason may be preserved. Exact mandatory-reason rules remain open.

#### 5.3.46 Timeline Is Not Every Click

Timeline records meaningful persisted workflow events, not page views, filters, tab switches, refreshes, hovers, or cursor actions.

#### 5.3.47 Ticket Conversation

Ticket may support formal participant communication required to resolve the issue. This communication belongs to the Ticket workflow and is not ordinary direct Chat.

#### 5.3.48 User Response

Where required, an affected or requesting user may respond within the Ticket. Exact composer and attachment capabilities remain implementation-stage choices and do not redesign Messaging.

#### 5.3.49 Staff Response

Authorized handlers may communicate within the Ticket according to Permissions.

#### 5.3.50 Ticket Communication ≠ Direct Chat

Ticket communication stays attached to the formal issue and does not automatically establish a private Chat relationship with every handler.

#### 5.3.51 Internal Work Boundary

Internal-only staff commentary mechanics are not locked here. Do not invent a complex internal-note subsystem; formal Timeline, status, and routing are sufficient product architecture at this stage.

#### 5.3.52 Student Ticket View

A Student may see Tickets they are authorized to access, including useful category, status, creation time, formal responses, and resolution state. Exact UI remains implementation-stage design.

#### 5.3.53 Student Cannot See Internal Routing Details by Default

Students do not automatically receive internal Queue mechanics, staff management data, or sensitive investigation details. The precise user-visible Timeline subset remains open.

#### 5.3.54 Student Own-Ticket Scope

Student access is scoped to their own authorized cases and must never expose another user's Tickets.

#### 5.3.55 Counselor Ticket Relationship

Counselor Ticket access is deliberately constrained. A Counselor is not a general Support Agent.

#### 5.3.56 Counselor Academic Case

Academic or Planning issues may remain in Counselor workflow where appropriate, and formal academic Tickets may route to authorized academic handling. Exact use cases remain implementation-stage choices.

#### 5.3.57 Counselor Referral

A Counselor may refer technical, payment, account, change-Counselor, complaint, or other issues to the proper Queue. Referral transfers formal handling responsibility.

#### 5.3.58 Post-Referral Default Access

Closed Product Owner decision: after a Counselor refers a Ticket to another Queue, their default access to ongoing Ticket details is exactly NO_ACCESS.

#### 5.3.59 NO_ACCESS

NO_ACCESS prevents the Counselor from viewing ongoing detailed Ticket conversation or content. Referral history may remain attributable without exposing sensitive handling.

#### 5.3.60 VIEW_ONLY

An authorized Admin may explicitly grant VIEW_ONLY for a specific Ticket. It permits viewing without participation.

#### 5.3.61 PARTICIPATE

An authorized Admin may explicitly grant PARTICIPATE for a specific Ticket. It permits authorized viewing and participation.

#### 5.3.62 Default Is Not VIEW_ONLY

Creating or referring a Ticket never gives a Counselor automatic VIEW_ONLY access. The post-referral default remains NO_ACCESS.

#### 5.3.63 Counselor Cannot Self-Grant

A Counselor cannot grant themselves VIEW_ONLY or PARTICIPATE.

#### 5.3.64 Ticket-Specific Access

A grant applies only to the specified Ticket. It does not grant Queue-wide access, unrelated Tickets, or other users' cases.

#### 5.3.65 Access Revocation

Authorized Admin must be able to revoke specific or temporary Counselor access. Previous access never becomes permanently implied.

#### 5.3.66 Access-Change Traceability

Meaningful access changes such as NO_ACCESS → VIEW_ONLY, VIEW_ONLY → PARTICIPATE, or PARTICIPATE → NO_ACCESS remain attributable and auditable.

#### 5.3.67 Sensitive Tickets

Complaint, complaint-about-Counselor, Counselor-change, payment/refund, account/security, and sensitive management cases require stricter privacy.

#### 5.3.68 Complaint About Counselor

A complaint about a Counselor is not automatically visible to that Counselor. The default is NO_ACCESS.

#### 5.3.69 Change Counselor Request

A Student request to change Counselor is handled by authorized Counselor Management or Admin. The current Counselor does not automatically see detailed case handling.

#### 5.3.70 Payment / Refund Privacy

Counselors do not automatically receive detailed payment or refund Ticket history. Finance/Admin handles the case according to Permission.

#### 5.3.71 Account / Security Privacy

Account/security Tickets do not expose sensitive credentials or details to unauthorized roles. Counselors must never receive passwords, session tokens, or security secrets.

#### 5.3.72 Technical Support Privacy

A Technical Ticket routes to Support without turning the referring Counselor into its technical owner.

#### 5.3.73 Sensitive Case Access

Effective sensitive Ticket access derives from Role + Permission + Queue scope + specific grant + Organization scope where applicable. Frontend visibility is never sufficient authority.

#### 5.3.74 Super Admin Authority

Super Admin has broad authorized operational visibility over Ticket routing and history consistent with platform governance. Sensitive access and actions remain attributable.

#### 5.3.75 Super Admin Does Not Erase Auditability

Broad authority is not untraceable authority. Sensitive management and access events remain attributable.

#### 5.3.76 Ordinary Admin Boundary

Ordinary Admin roles receive only the Tickets their Permissions and Queues require. The Admin label does not imply global Ticket visibility.

#### 5.3.77 Support Role Boundary

Support staff manage authorized Support Queues without automatically gaining complaints, Finance cases, Counselor-management cases, or unrelated Organization cases.

#### 5.3.78 Finance Role Boundary

Finance or payment roles access relevant financial Tickets according to Permissions. That access does not grant general private-Chat or academic-case access.

#### 5.3.79 Counselor Management Boundary

Authorized Counselor Management/Admin may handle Counselor-change, relationship, and management cases according to Permissions.

#### 5.3.80 School Support Boundary

School Support may handle Organization-scoped issues without receiving platform-wide sensitive access.

#### 5.3.81 Content Ticket Boundary

Content issues may route to an appropriate Content/Admin team. This remains distinct from Question Bank moderation unless the case concerns a Question workflow.

#### 5.3.82 Question Issue Boundary

A Question problem report may lead to appropriate moderation or review, while Section 4.1 remains authoritative for Question correctness and publication truth.

#### 5.3.83 Payment Source of Truth

A Payment Ticket does not rewrite Payment truth. Payment status remains authoritative in the Business/Payment domain.

#### 5.3.84 Account Source of Truth

An Account Ticket is not Identity or Authentication state. The Identity system remains authoritative.

#### 5.3.85 Counselor Relationship Source of Truth

A Change-Counselor Ticket is not the Counselor assignment. An authorized management workflow must update the canonical relationship separately.

#### 5.3.86 Ticket Resolution Does Not Auto-Mutate Domains

Resolving a Ticket never rewrites related domain state unless an explicit authorized domain workflow performs that action. For example, a resolved Payment Ticket does not mean Payment = PAID, and a resolved Change-Counselor Ticket does not change assignment.

#### 5.3.87 Ticket Deep Links

Notification or Work Queue may deep-link to a Ticket, but access is checked again when opened.

#### 5.3.88 Ticket Notifications

Assignment, required response, status change, resolution, reopening, or specific access-grant events may generate shared Notifications for authorized recipients. Section 5.2 remains authoritative.

#### 5.3.89 No Notification-Based Access

Receiving a Ticket Notification never grants Ticket access.

#### 5.3.90 Counselor Work Queue Integration

A Ticket appears in the Counselor Work Queue only when the Counselor has actual authorized responsibility or access. Referred NO_ACCESS Tickets are not active Counselor cases.

#### 5.3.91 Admin Work Queue Integration

Admin or Support operational surfaces may show authorized assigned or queued Tickets. Detailed Admin Operations UI belongs to Section 6.1.

#### 5.3.92 School Work Queue Integration

Authorized School roles may see Organization-scoped Ticket work when required by their Permissions.

#### 5.3.93 Ticket Priority Boundary

Ticket may need practical priority, but the exact taxonomy is not locked. Opaque AI priority or risk scoring is prohibited.

#### 5.3.94 No Automatic Sentiment Escalation

Current product direction does not authorize sentiment scoring, anger detection, emotion classification, automatic complaint severity, or automatic escalation from private-language analysis.

#### 5.3.95 Escalation Is Operational

Escalation uses understandable rules or explicit human action, not unexplained risk scores.

#### 5.3.96 Ticket Retention

Formal Ticket history may use retention different from ordinary Chat. Exact legal and operational policy remains open; the approximately six-month ordinary Chat direction is not inherited automatically.

#### 5.3.97 Formal Record Preservation

Ticket history may require longer preservation because it represents formal operational handling. Exact retention and deletion policy is deferred.

#### 5.3.98 Chat Expiry Does Not Destroy Ticket Evidence

Selected Chat context formally preserved inside a Ticket must not disappear merely because the ordinary Chat source expires.

#### 5.3.99 Resolved/Closed History

Resolved and Closed Tickets remain historical records according to retention policy and are not deleted merely because active work ended.

#### 5.3.100 Reopen History

Reopening preserves the original issue, prior resolution, close history, and later reopening rather than rewriting the Ticket as never resolved.

#### 5.3.101 Duplicate Ticket Boundary

Future tooling may identify possible duplicates but must not automatically merge or delete cases based only on opaque similarity.

#### 5.3.102 Ticket Merge Boundary

Ticket merge is not a current closed requirement. Any future merge must preserve history and affected-user context.

#### 5.3.103 Ticket Attachment Boundary

Formal attachments may be supported where operationally necessary. File types, sizes, retention, and visibility remain implementation-stage decisions, and ordinary Chat policy is not inherited automatically.

#### 5.3.104 Ticket Search

Authorized users may search or filter Tickets within scope by dimensions such as Ticket ID, category, Queue, status, assignee, user, date, or Organization. Exact UX remains open.

#### 5.3.105 Search Respects Access

Search must never expose Tickets outside the searcher's authorized scope.

#### 5.3.106 Filters

Operational filters may include status, category, Queue, assignee, age, Organization, and unresolved/resolved state without turning Ticket handling into generic BI.

#### 5.3.107 Ticket Age

Authorized staff may see how long a Ticket has been open or waiting. This is operational evidence, not automatically a staff quality score.

#### 5.3.108 SLA Boundary

SLA rules are not locked here. Future targets require explicit definition and must not introduce invented automatic penalties.

#### 5.3.109 Response Time Boundary

Response time may become a clearly defined operational metric but must not become ambiguous automatic employee scoring.

#### 5.3.110 Ticket Reporting

Authorized operations may report real counts, open/closed state, category, Queue, age, resolution time, and backlog. This is operational reporting.

#### 5.3.111 No Automatic Staff Quality Score

Ticket metrics must not automatically create Support quality scores, Counselor quality scores, Admin grades, or good/bad classifications.

#### 5.3.112 No Public Support Ranking

Support-agent leaderboards, Counselor Ticket leaderboards, and public complaint rankings are not approved product behavior.

#### 5.3.113 Complaint Reporting Privacy

Complaint reporting requires appropriate privacy, and aggregates must not expose sensitive case details to unauthorized users.

#### 5.3.114 Ticket Identity

A Ticket has a stable recognizable operational reference. Exact format is implementation detail and must not expose sensitive internal sequencing where security design forbids it.

#### 5.3.115 Ticket Title / Summary

A concise real title or summary may help handlers understand the issue; it must not fabricate issue content.

#### 5.3.116 Requester / Affected User

Ticket may distinguish its creator or reporter from the person affected. Exact representation remains open and is especially relevant to Admin-created or Counselor-referred cases.

#### 5.3.117 Requester Is Not Owner

Requester, affected user, and operational assignee are distinct concepts. Creating or reporting a Ticket does not make someone its handler.

#### 5.3.118 Organization Context

A School/Institute Ticket may carry explicit Organization context.

#### 5.3.119 Cross-Organization Privacy

School staff must never access Tickets belonging to other Organizations.

#### 5.3.120 Account / Payment / School Routing

Routing preserves differences among account, payment, academic, Counselor management, complaint, School support, and content cases instead of collapsing everything into generic Support.

#### 5.3.121 Issue Recategorization

Authorized handlers may correct a wrongly selected category or Queue. Recategorization preserves history; exact Permissions remain implementation-stage design.

#### 5.3.122 No Silent Recategorization

Meaningful category or routing changes must not erase the previous path.

#### 5.3.123 Reassignment / Referral Chain

Ticket history preserves the formal chain of responsible Queues and handlers.

#### 5.3.124 No Circular Workflow Complexity Requirement

The Product Map does not require a generic BPM or process builder. Ticket workflow remains purpose-specific.

#### 5.3.125 No Generic CRM Requirement

Ticket architecture is not a full CRM and does not add sales pipeline, lead management, marketing campaigns, or opportunity tracking.

#### 5.3.126 No Public Forum

Tickets are private operational cases, not public forum posts.

#### 5.3.127 No Social Reactions

Likes, reactions, public votes, and popularity mechanics are outside Ticket scope.

#### 5.3.128 No Gamification

Ticket XP, agent badges, response streaks, and gamified closure points are prohibited.

#### 5.3.129 No AI Auto-Resolution

AI is not authorized to resolve or close Tickets, grant access, change Counselor, approve refunds, alter Payments, or suspend accounts. Authorized human workflow remains authoritative.

#### 5.3.130 Future AI Assistance

Future AI may assist authorized handlers with summaries, suggested category or Queue, response drafts, or duplicate hints. This remains future/extensible.

#### 5.3.131 AI Cannot Invent Case Facts

Future AI must not fabricate user statements, payment state, complaint facts, account history, routing history, or resolution.

#### 5.3.132 AI Routing Boundary

Future routing assistance may recommend but may not silently override sensitive access or routing governance.

#### 5.3.133 Automation Boundary

Clear rule-based workflow actions may be added later, but Ticket status must not silently trigger sensitive domain actions.

#### 5.3.134 Resolution Action vs. Domain Action

Resolving a Payment issue Ticket is distinct from verifying or approving the Payment; the domain action requires its authorized Business workflow.

#### 5.3.135 Closed Ticket Does Not Guarantee Domain Change

Closing a Ticket ends the Ticket workflow and does not inherently change every referenced domain or external object.

#### 5.3.136 Student Notification on Ticket Events

Students may receive Notifications for authorized relevant Ticket events. Section 5.2 and implementation decisions determine the exact event set.

#### 5.3.137 Counselor Notification After Referral

A Counselor with NO_ACCESS must not receive detailed ongoing sensitive updates. Whether a minimal generic referral status exists remains an implementation Decision Gate.

#### 5.3.138 Access-Grant Notification

An explicit VIEW_ONLY or PARTICIPATE grant may generate an appropriate Notification.

#### 5.3.139 Access-Revoke Behavior

After revocation, future detailed access stops, and existing Notifications or deep links cannot bypass that revocation.

#### 5.3.140 Ticket Resolution Visibility

An authorized requester or affected user should understand when their Ticket is resolved or closed. Exact copy remains implementation-stage design.

#### 5.3.141 Waiting State Visibility

When user action is required, WAITING_USER must be understandable rather than leaving the user unaware.

#### 5.3.142 WAITING_INTERNAL Privacy

WAITING_INTERNAL does not require revealing sensitive internal details to the requester. Exact user-facing wording remains open.

#### 5.3.143 Reopen User Experience

Who may reopen and under what conditions remains implementation-stage design; the REOPENED lifecycle concept is closed.

#### 5.3.144 Ticket Creation UX

Creation should be purpose-specific and understandable. Potential fields include category, concise subject, description, relevant context, and supported attachment, while exact required fields remain open.

#### 5.3.145 Category Guidance

Creation UI may guide category selection without requiring users to understand internal Queue names.

#### 5.3.146 User Does Not Choose Internal Staff

Normal users need not select a specific internal handler to create a Ticket; routing is operational.

#### 5.3.147 Ticket Status UX

User-facing status labels must be understandable and may differ from internal technical names.

#### 5.3.148 Mobile Experience

Student and Counselor access remains mobile-usable, prioritizing Ticket identity, category, status, concise content, formal responses, required action, and resolution state without desktop helpdesk density.

#### 5.3.149 Admin Desktop Experience

Authorized Admin/Support handling may be denser and desktop-oriented through Queue, filters, list, detail, Timeline, and routing actions. Section 6.1 governs detailed Admin UI.

#### 5.3.150 Accessibility

Ticket surfaces preserve RTL correctness, readable and non-color-only states, keyboard/focus behavior, accessible forms, clear required action, touch-friendly controls, and understandable Timeline presentation.

#### 5.3.151 Light / Dark

Canonical Light/Dark themes preserve status clarity, Timeline readability, issue hierarchy, sensitivity distinction, and a restrained operational tone.

#### 5.3.152 Data Honesty

Never fabricate a Ticket, category, Queue, assignee, requester, affected user, status, Timeline, response, resolution, access grant, escalation, or referenced Payment/Account state.

#### 5.3.153 Empty States

Honest empty states include no Student Tickets, no Admin/Support Tickets in the selected Queue or filter, and no authorized Counselor Ticket work. Fake support cases are prohibited.

#### 5.3.154 Error States

Ticket surfaces eventually handle load, creation, response, assignment, routing, status-change, access-grant, authorization, and retry states. Failed mutations must never appear successful.

#### 5.3.155 Partial Data

When a Ticket exists but a referenced object cannot load, show an honest unavailable state rather than fabricating the object.

#### 5.3.156 Privacy-First Errors

Authorization errors must not leak the existence or details of sensitive Tickets.

#### 5.3.157 Ticket Security

Backend authorization governs Queue and Ticket access, assignment, status changes, routing, participation, sensitive-case visibility, and access grants.

#### 5.3.158 Frontend Is Not Authority

Hidden buttons, route guards, disabled controls, client-supplied Queue IDs, and client-supplied access levels are never sufficient authorization.

#### 5.3.159 Ticket Access and Role Are Distinct

Effective Ticket access derives from Role + Permission + Queue/Organization scope + case sensitivity + specific grants + applicable relationship/context. A broad Role alone is insufficient.

#### 5.3.160 Access Change Is Not Role Change

A Ticket-specific VIEW_ONLY or PARTICIPATE grant does not alter the Counselor's platform Role.

#### 5.3.161 Ticket History Is Not Audit Log

Ticket Timeline records formal case workflow; platform Audit records sensitive administrative actions. They may overlap on meaningful events but remain distinct.

#### 5.3.162 Audit Boundary

Specific Ticket grants, sensitive Queue permission changes, and certain management actions may also require Admin Audit. Section 6.1 governs detailed Audit policy.

#### 5.3.163 No Every-View Audit Requirement

Ordinary authorized Ticket views need not create noisy Audit events. Defined Break-Glass or sensitive access may follow stricter rules.

#### 5.3.164 Organization Reuse

Schools and Institutes reuse the central Ticket engine; no duplicate School Ticket system is created.

#### 5.3.165 Organization Support

School-related cases may carry Organization and Student/staff context plus a School Support category or Queue according to Permissions.

#### 5.3.166 Future Teacher Tickets

Future Teacher workflows may use the shared Ticket system where appropriate. No Teacher-specific engine is created.

#### 5.3.167 Cross-Domain Reuse

Account, Payment, Counselor Management, Content, School, Academic, and Technical cases use the same formal Ticket framework where formal issue handling is needed.

#### 5.3.168 No Ticket for Every Product Action

Tickets are for formal tracked issues. Not every error or product event creates one, and automatic Ticket spam is prohibited.

#### 5.3.169 Automatic Ticket Creation Boundary

Current product direction does not authorize automatic Tickets from failed Tasks, bad Exam results, unread Notifications, PARTIAL or SKIPPED Tasks, inactive Students, or Chat sentiment.

#### 5.3.170 Analytics → Ticket Boundary

Student or Counselor Analytics does not automatically create Tickets. A human or explicit approved workflow is required unless a future rule is separately approved.

#### 5.3.171 Notification → Ticket Boundary

Unread or failed Notifications never automatically become Tickets.

#### 5.3.172 Ticket → Plan Boundary

Ticket resolution does not automatically rewrite Student Planning.

#### 5.3.173 Ticket → Account Boundary

Ticket status does not suspend, reset, unlock, or otherwise mutate an Account. An authorized Account workflow must perform the action.

#### 5.3.174 Ticket → Payment Boundary

Ticket status does not approve, reject, or refund a Payment.

#### 5.3.175 Ticket → Counselor Assignment Boundary

Closing a Change-Counselor Ticket does not change assignment. Authorized Counselor-management workflow must update the relationship.

#### 5.3.176 Ticket → Entitlement Boundary

Ticket status does not grant or revoke commercial Entitlements.

#### 5.3.177 Ticket Reporting Future

Future operational reporting may add backlog, resolution timing, category trends, and Queue-load views. It remains operational rather than employee scoring.

#### 5.3.178 Routing Intelligence Future

Future routing recommendations must be explainable, permission-aware, human-overridable, and privacy-respecting.

#### 5.3.179 AI Summary Future

Future AI may summarize long Ticket history for authorized handlers. This remains future/extensible.

#### 5.3.180 AI Response Draft Future

Future AI may draft a proposed response for an authorized handler but cannot send as that person without explicit approved action.

#### 5.3.181 No AI Sensitive Decision

AI must not autonomously decide refunds, complaint verdicts, Counselor discipline or reassignment, account suspension, access grants, Ticket closure, or security outcomes.

#### 5.3.182 Central Ticket Anti-Drift

Ticket must not drift into Chat with statuses, a Counselor-only support list, one universal Queue, duplicate domain Ticket systems, unrestricted Admin visibility, permanent Counselor access after referral, analytics-generated cases, every-click surveillance, employee scoring, CRM, marketing automation, or autonomous AI support authority.

The canonical model is **Ticket origin + category + Queue + requester/affected user + assignment + formal status + formal Timeline + authorized Ticket communication + refer/reassign/escalate + sensitive access controls + resolve/close/reopen**. Counselor referral defaults to NO_ACCESS; only authorized Admin can explicitly grant VIEW_ONLY or PARTICIPATE.

#### 5.3.183 Current vs. Future

`APPROVED FUTURE STATE — CORE TICKET DIRECTION`:

- one central Ticket system supporting approved Student, Counselor-referral, Admin/Support, Chat, Payment, Account, and School origins;
- extensible categories, Queues, routing, assignment, reassignment, referral, escalation, and the eight closed status concepts;
- formal Timeline with attributable actor, time, routing, status, response, access-change, resolution, close, and reopen history;
- Student own-Ticket access, permission/Queue-scoped staff access, sensitive-case restrictions, and Counselor post-referral NO_ACCESS by default with explicit VIEW_ONLY or PARTICIPATE grants;
- access revocation and traceability, Organization reuse, shared Notifications, backend authority, formal retention distinct from ordinary Chat, and scoped search/filter direction.

`APPROVED FUTURE STATE — EXTENSIBLE`:

- richer operational reporting, explicitly defined SLA features, duplicate detection or merge, advanced Queue automation, routing recommendations, AI summaries, AI response drafting, and advanced workload analytics.

Future automation cannot replace authorized human control for sensitive decisions. These capabilities are not represented as implemented; [PROJECT_STATE.md](PROJECT_STATE.md) remains authoritative for actual availability, and implementation requires a separately approved milestone.

#### 5.3.184 Decision Gates

Closed decisions:

- one shared central Ticket system remains distinct from Chat, Notification, Follow-up, Private Note, Session, Student Task, and Work Queue;
- approved origins include Student, Counselor, Admin/Support, explicit Chat referral, Payment/Account workflows, and School/Organization context; selected Chat context may be preserved, but entire private Chat is not blindly copied;
- categories and Queues are extensible and distinct, Queue access is permission-controlled, and the framework supports assignment, reassignment, referral, and escalation;
- OPEN, ASSIGNED, IN_PROGRESS, WAITING_USER, WAITING_INTERNAL, RESOLVED, CLOSED, and REOPENED are the canonical lifecycle concepts;
- formal Timeline preserves meaningful attributable workflow history rather than every click;
- Students access only their authorized own Tickets; Counselor is not general Support; referral grants neither ownership nor ongoing access;
- Counselor post-referral default is exactly NO_ACCESS; VIEW_ONLY and PARTICIPATE require explicit authorized Admin grant; Counselor cannot self-grant; grants remain Ticket-specific, revocable, and traceable;
- complaints about a Counselor and Change-Counselor requests remain hidden from that Counselor by default; payment, account, security, management, and Organization cases follow need-to-know authority;
- Super Admin has broad attributable operational oversight, while ordinary Admin, Support, Finance, Counselor Management, and School roles remain Permission/Queue/scope constrained;
- Ticket resolution or closure never automatically mutates Payment, Account, Planning, Entitlement, Counselor assignment, or other source-domain truth;
- Ticket retention is distinct from ordinary Chat; School reuses the central engine; Ticket metrics are not staff-quality scoring;
- Analytics, unread Notifications, execution state, Exam results, inactivity, and sentiment do not automatically create Tickets;
- CRM, marketing, social, gamification, opaque surveillance/scoring, AI auto-resolution, and autonomous sensitive decisions are outside approved scope;
- backend authorization remains authoritative.

Remaining implementation-stage choices:

- exact required fields, origin/category taxonomy, Queue configuration, assignment model, transition matrix, reopen rules, and requester-versus-affected-user representation;
- Ticket communication UX, attachment support/retention, Student-visible Timeline subset, internal routing visibility, and minimal Counselor referral-status visibility under NO_ACCESS;
- priority taxonomy, escalation and mandatory-reason rules, search/filter UX, retention duration, archive/delete policy, and response/resolution metrics;
- future SLA, duplicate/merge policy, Organization routing, responsive layouts, routing automation, and AI summary/drafting behavior.

These choices do not reopen any closed product decision.

### 5.4 Classroom

Classroom is KonkourX's lightweight scheduled live-learning coordination layer. The current product direction manages authorized event identity, title, host, date/time, audience, external meeting destination, Join behavior, and shared Notifications, then sends the participant to an external provider.

The canonical current model is **authorized Classroom Event + host + date/time + audience + external meeting URL + Join + shared Notifications → external live meeting**. KonkourX does not currently become its own WebRTC, conferencing, streaming, whiteboard, attendance, recording, or Classroom-social platform.

#### 5.4.1 Classroom Is Distinct

Classroom is distinct from direct Messaging, Notifications, Tickets, Counselor Session, Learning Content, Exam, Practice, Student Task, and Counselor Follow-up. These domains may reference one another without sharing source truth.

#### 5.4.2 Classroom ≠ Counseling Session

Counseling Session is a Counselor–Student counseling interaction; Classroom is a scheduled educational live event. They must not be merged.

#### 5.4.3 Classroom ≠ Messaging

Messaging is direct conversation; Classroom is a scheduled live-learning event. Ordinary Student/Counselor Chat is not the Classroom implementation.

#### 5.4.4 Classroom ≠ Notification

Notification may inform a user about Classroom state but is not the Classroom Event.

#### 5.4.5 Classroom ≠ Learning Content

Learning Content is reusable educational material; Classroom is a scheduled live event. A future recording may become Learning Content without merging the domains.

#### 5.4.6 Classroom ≠ Exam

Any assessment associated with Classroom must use the shared Exam engine. Classroom-specific Exam truth is prohibited.

#### 5.4.7 Lightweight Current Scope

Closed Product Owner direction: current Classroom scope is intentionally lightweight—manage an event and provide authorized participants an external Join destination. Do not overbuild a live-learning platform now.

#### 5.4.8 Shared Classroom Domain

Student, School, future Teacher, and Admin-managed scenarios reuse one shared Classroom/Event domain. Separate engines for equivalent event semantics are prohibited.

#### 5.4.9 Classroom Event

A Classroom Event represents one scheduled live educational interaction and may contain title, host/teacher, date/time, audience, external meeting URL, relevant status, and optional description. Exact required fields remain implementation-stage design.

#### 5.4.10 Title

Every event has a clear human-readable title rather than deriving visible identity from raw URL or provider metadata.

#### 5.4.11 Description / Context

An optional concise description may provide context. It does not become Course or Lesson authoring.

#### 5.4.12 Host

An event identifies its authorized host or instructor where relevant. This may later include Teacher, authorized School staff, or another approved instructional role; exact Role matrix remains open.

#### 5.4.13 Host Is Not Automatically Platform Admin

Hosting grants neither Admin access nor Content publication, Exam administration, Ticket authority, or commercial authority. Role and Permission remain separate.

#### 5.4.14 Future Teacher Role

Teacher is a future/extensible role direction. Classroom remains compatible without defining a complete Teacher Workspace here.

#### 5.4.15 Date / Time

A Classroom Event has scheduled time. Exact start, end, duration, and timezone fields remain implementation-stage details.

#### 5.4.16 Time Authority

Classroom time is persisted truth; frontend-only assumptions must not fabricate upcoming, start, or end state.

#### 5.4.17 Jalali Presentation

User-facing time follows Persian/Jalali conventions where appropriate. Canonical storage and timezone behavior belong to technical architecture.

#### 5.4.18 Audience

An event has an authorized audience, potentially selected Students, Organization Students, School class, grade/group, or another permitted audience. Exact builder UX remains open.

#### 5.4.19 Audience Is Access Control

Audience is authorization context, not merely display metadata. Only permitted participants may access the event.

#### 5.4.20 Backend Authorization

Server-side authority protects event and link access. Hidden Join buttons, frontend routes, client-supplied audience, or copied internal URLs are insufficient.

#### 5.4.21 Creator / Management Authority

Creating or editing an event requires Permission. Counselors, Teachers, School staff, and Admins do not automatically share identical authority; exact matrix remains open.

#### 5.4.22 Organization Scope

School-created events remain Organization-scoped. School staff cannot target unrelated platform Students without authorization.

#### 5.4.23 No Public Classroom Discovery

Public directories, open discovery, anonymous joining, and a live-class marketplace are not approved current behavior.

#### 5.4.24 External Meeting URL

Current delivery uses an external meeting URL, such as Google Meet, Skyroom, or another approved provider. KonkourX manages event metadata and the destination.

#### 5.4.25 Provider-Agnostic Product Direction

The Classroom product model must not become permanently coupled to one provider. URL-based delivery remains compatible with future provider changes.

#### 5.4.26 External URL Is Current Core

An external meeting destination is sufficient for current scope. Internal live-video infrastructure is not a launch requirement.

#### 5.4.27 Join

An authorized participant receives a clear Join action when available. Join opens the external meeting destination.

#### 5.4.28 Join Does Not Create Internal Call

Join does not start an internal KonkourX WebRTC call or imply in-app video infrastructure.

#### 5.4.29 Join Destination Honesty

The interface must state honestly when Join opens an external provider rather than pretending KonkourX hosts the meeting.

#### 5.4.30 Join Window

When Join becomes available before, during, or after an event remains an implementation-stage choice.

#### 5.4.31 Meeting URL Privacy

Meeting URLs are exposed only to authorized users under event access rules.

#### 5.4.32 External URL Reality

After opening an external provider, that provider controls its experience. KonkourX cannot promise provider uptime, moderation, recording, access controls, or security beyond supported integration and configuration.

#### 5.4.33 External Provider Auth Boundary

Provider-side authentication, login, and access requirements are not locked here. SSO or provider provisioning is not current core.

#### 5.4.34 Event Status

Classroom may use simple scheduled/upcoming, active/current, completed, and cancelled concepts. Exact taxonomy remains open; a heavy workflow is not required.

#### 5.4.35 Cancelled Event

A cancelled event must not continue sending misleading upcoming reminders. Exact cancellation workflow remains open.

#### 5.4.36 Updated Event

Authorized roles may update time, host, audience, URL, or title according to Permission. Participant-facing state must remain truthful.

#### 5.4.37 Change Notification

Meaningful event changes may use shared Notifications rather than a separate Classroom notification engine.

#### 5.4.38 Classroom Notifications

Approved directions include scheduled, upcoming, time changed, cancelled, and meeting-destination changed. Exact events and timing remain implementation-stage choices.

#### 5.4.39 Shared Notification Engine

Section 5.2 remains authoritative. Classroom publishes events into the shared engine.

#### 5.4.40 Upcoming Reminder

An upcoming event may generate a reminder; exact timing remains a Decision Gate.

#### 5.4.41 Notification Does Not Grant Access

Receiving a Classroom Notification does not grant audience membership or Join access.

#### 5.4.42 Student Classroom List

Students may see authorized upcoming, current, and useful recent/past events. Exact list and history UX remains open.

#### 5.4.43 Upcoming Classroom

Upcoming entries use real title, time, host where relevant, Join availability, and event state.

#### 5.4.44 Past Classroom

Past events may preserve scheduling context but must not fabricate attendance, recording, or completion.

#### 5.4.45 Event Ended ≠ Attended

An event ending never proves that a Student attended.

#### 5.4.46 Join Click ≠ Attendance

Opening Join does not prove admission to or attendance at the external meeting.

#### 5.4.47 No Attendance Engine Currently

Current core has no dedicated Attendance engine, present/absent automation, attendance percentage or scoring, lateness automation, or leaderboard.

#### 5.4.48 Future Attendance

Attendance is future/extensible and requires a separately approved source-of-truth model. It cannot be inferred from weak proxies.

#### 5.4.49 No Internal Video Currently

Internal live video, WebRTC media servers, SFU/MCU, call rooms, camera/microphone infrastructure, and screen-share infrastructure are not current core.

#### 5.4.50 No Whiteboard Currently

Interactive whiteboard is future/extensible only if separately approved.

#### 5.4.51 No Screen Sharing Engine Currently

KonkourX does not currently implement screen sharing; an external provider may independently offer it.

#### 5.4.52 No Internal Recording Currently

KonkourX recording, storage, and transcoding are not current core.

#### 5.4.53 No Recording Assumption

Recording availability, Watch Recording, and recorded duration must never appear unless real recording state exists through an approved workflow.

#### 5.4.54 Future Recording

Future recording may come from an external provider or future internal platform. Exact architecture requires separate approval.

#### 5.4.55 Recording → Learning Content

A real future recording may become Learning Content through the shared Learning Content engine; no separate recording-content repository is created.

#### 5.4.56 No Internal Streaming Currently

Internal streaming and video delivery remain future Learning/Classroom architecture and are not current dependencies.

#### 5.4.57 No Classroom Chat Currently

A dedicated real-time Classroom Chat engine is not current core.

#### 5.4.58 Classroom Chat Future

Future Classroom Chat may be separately approved and remains distinct from ordinary direct Messaging.

#### 5.4.59 Direct Messaging Remains Separate

Student/Counselor direct Chat is not reused as a multi-participant Classroom room.

#### 5.4.60 No Reactions / Hand-Raise Currently

Reactions, hand raise, live polls, participant emoji, and engagement tools are future/extensible rather than current core.

#### 5.4.61 No Breakout Rooms Currently

Breakout rooms are not current core, though an external provider may independently offer them.

#### 5.4.62 No Internal Participant Roster Engine

Authorized audience is required, but a live participant-presence engine is not current core.

#### 5.4.63 Audience ≠ Attendance

Audience describes who may or is intended to attend; Attendance describes who actually attended. They remain distinct.

#### 5.4.64 Host ≠ Attendance Verifier

Host identity alone does not create verified attendance data.

#### 5.4.65 Classroom ≠ Course

Course is structured Learning Content; Classroom is a scheduled live event. A Course may later reference events without merging domains.

#### 5.4.66 Course → Classroom Future

A future Course may reference scheduled events through the shared Classroom domain.

#### 5.4.67 Classroom → Resource

Classroom may reference canonical Learning Resources without duplicating Learning Content.

#### 5.4.68 Classroom → Exam

Authorized future workflows may associate an Exam while the shared Exam engine remains authoritative.

#### 5.4.69 Classroom → Practice

Authorized future workflows may reference Practice while the shared Practice engine remains authoritative.

#### 5.4.70 Classroom → Curriculum

An event may later reference canonical Curriculum without creating a Classroom-specific topic taxonomy. Exact need remains open.

#### 5.4.71 Classroom → Task / Homework Future

Future homework may reuse approved Task, Practice, Exam, or Learning Content domains. No separate Classroom homework engine is current scope.

#### 5.4.72 No LMS Drift

Classroom must not initiate a deep LMS with modules, gradebook, assignment engine, attendance grade, feed, forum, teacher analytics suite, or live collaboration infrastructure.

#### 5.4.73 School / Institute Use

School/Institute is an important Classroom consumer and reuses the shared domain with Organization context.

#### 5.4.74 School Does Not Get Duplicate Classroom Engine

Equivalent School event semantics never receive a separate Classroom database or engine.

#### 5.4.75 Organization Audience

Future School events may target a class, grade, group, or selected Students within Organization scope. Section 6.3 governs detailed assignment.

#### 5.4.76 School Staff Authority

School staff create or manage events only through Organization membership and Permissions. Membership alone is not full administration.

#### 5.4.77 Future Teacher Host

Future Teachers may host or manage events under scoped Permissions.

#### 5.4.78 Admin Authority

Authorized Admin may manage events or configuration where operationally required. Section 6.1 governs exact scope.

#### 5.4.79 Counselor Boundary

Counselor Role does not automatically grant live teaching authority. Counselor Sessions remain separate unless explicit Permission and product need say otherwise.

#### 5.4.80 Student Authority

Student is primarily a participant. Arbitrary Student-created live rooms are not approved current behavior.

#### 5.4.81 Classroom Access / Entitlement

Future access may combine audience, Organization membership, Role/Permission, Entitlement, and explicit assignment or grant. Exact commercial model remains open.

#### 5.4.82 Audience and Entitlement Are Distinct

Audience membership and commercial access may be separate where paid live products later exist.

#### 5.4.83 No Hardcoded Plan Names

Any commercial control uses Effective Access rather than hardcoded Gold, VIP, or other plan labels.

#### 5.4.84 Current Commercial Boundary

This section does not lock Classroom pricing or packaging. Section 6.2 governs Business configuration.

#### 5.4.85 Classroom Payment Boundary

Classroom does not process Payments; paid access derives from shared Business and Entitlement systems.

#### 5.4.86 Join Link Does Not Grant Commercial Access

A KonkourX deep link never bypasses audience or Entitlement checks, while external-provider behavior may have separate limitations.

#### 5.4.87 URL Leak Reality

A shareable raw provider URL may be forwarded out of band after exposure. KonkourX must not promise DRM or access guarantees the provider cannot enforce.

#### 5.4.88 Internal Event Authorization Still Matters

External delivery does not remove KonkourX responsibility to restrict event discovery, Join, and meeting-link exposure.

#### 5.4.89 Classroom History

Authorized users may see past event scheduling context without fabricated attendance, recording, completion, or participation score.

#### 5.4.90 Host History

Historical events preserve relevant host and event metadata where needed. Exact historical-edit behavior remains open.

#### 5.4.91 Event Edit History Boundary

Exact edit-version semantics are not locked, but meaningful historical context must not become misleading. A heavy versioning engine is not required.

#### 5.4.92 Classroom Status Data Honesty

Never fabricate scheduled, active, ended, or cancelled state, host, audience, Join URL, attendance, or recording.

#### 5.4.93 Join Failure

An unavailable or broken destination must not appear as a successful Join. Exact error and retry UX remains open.

#### 5.4.94 External Provider Failure

Provider failure may coexist with valid KonkourX metadata and should be represented honestly where detectable.

#### 5.4.95 Cancelled / Changed Link

When a URL changes, current event data should prevent stale destinations from remaining active in UI or Notifications. Exact mechanics remain open.

#### 5.4.96 Classroom Search / Filter Boundary

Simple scoped browsing may filter upcoming/past, host, Organization, or date. It must not become marketplace discovery.

#### 5.4.97 Student Dashboard Integration

An upcoming event may appear as a compact Student Dashboard item but cannot displace Today Plan or current/next action as primary priority.

#### 5.4.98 Counselor Dashboard Boundary

Classroom does not appear on Counselor Dashboard without an authorized relevant role or context. Counselor Sessions remain separate.

#### 5.4.99 School Dashboard Integration

Future School Dashboard may show upcoming Organization events. Section 6.3 governs detailed UX.

#### 5.4.100 Notification Center Integration

Classroom reminders and changes use the shared Notification Center; no separate Classroom inbox exists.

#### 5.4.101 Calendar Integration

Classroom Events may appear in schedule or calendar views, while the Event remains source truth and Calendar remains presentation.

#### 5.4.102 Calendar ≠ Classroom Domain

Calendar placement does not create a duplicate event record.

#### 5.4.103 External Calendar Future

Google Calendar or other external synchronization is future/extensible, not current core.

#### 5.4.104 Recording Notification Future

If a real future recording exists, authorized users may be notified. No recording Notification appears without real state.

#### 5.4.105 Future Internal Video

Provider integration, embedded rooms, internal WebRTC, or protected streams require separate future product and technical milestones.

#### 5.4.106 Future Attendance Engine

Future Attendance must define presence evidence, late/partial behavior, manual correction, and privacy. None is current core.

#### 5.4.107 Future Recording Engine

Future recording may support association, access, publication, and conversion to Learning Content; exact architecture remains future.

#### 5.4.108 Future Classroom Chat

Future class Chat requires separate approval and cannot automatically reuse private direct Messaging as a group room.

#### 5.4.109 Future Whiteboard

Interactive Whiteboard remains future/extensible.

#### 5.4.110 Future Screen Sharing

Internal Screen Share remains future/extensible.

#### 5.4.111 Future Live Interaction Features

Reactions, hand raise, polls, participant controls, and moderation tools remain future rather than current core.

#### 5.4.112 Future Homework Integration

Future homework and follow-up reuse Task, Practice, Exam, and Learning Content rather than creating a separate assignment engine.

#### 5.4.113 Future Course Integration

Future Courses may contain Classroom Events while Course remains Learning Content architecture and Classroom remains live-event architecture.

#### 5.4.114 Future Class Recordings as Content

Recorded classes may become canonical Learning Content through Section 4.4 rather than a second recorded-content model.

#### 5.4.115 Future Provider Integration

Future provider APIs may support room creation, access provisioning, or meeting metadata. API integration is not current core.

#### 5.4.116 Future Provider Abstraction

Future integration should avoid single-provider lock-in. Exact abstraction belongs to technical architecture.

#### 5.4.117 No Proctoring

Screen monitoring, webcam surveillance, keystroke tracking, and behavioral proctoring are outside Classroom scope.

#### 5.4.118 No Student Engagement Score

Classroom activity does not create engagement, attention, motivation, or participation-quality scores.

#### 5.4.119 No Attendance Score Currently

Without authoritative Attendance, no attendance percentages or scores may be created.

#### 5.4.120 No Host Quality Score

Classroom data does not automatically produce Teacher or Counselor quality scores, host ratings, or good/bad instructor classifications.

#### 5.4.121 No Live Class Leaderboard

Attendance, participation, and top-Student leaderboards are not approved current behavior.

#### 5.4.122 No Social Classroom Feed

Classroom does not require a social feed around events.

#### 5.4.123 No Public Comments / Ratings Requirement

Public comments, stars, instructor reviews, and ratings require separate approval.

#### 5.4.124 No Autonomous AI Classroom

AI is not authorized to teach autonomously, replace the host, create rooms or invite Students automatically, or record/analyze private classes automatically.

#### 5.4.125 Future AI Boundary

Separately approved future AI may assist with class preparation, real-source summaries, recording summaries, or suggested follow-up.

#### 5.4.126 AI Must Not Fabricate Class State

AI must not fabricate attendance, recording, participation, host statements, class content, or completion.

#### 5.4.127 Privacy

Classroom metadata and access remain restricted by audience, Organization, Role/Permission, and relevant Entitlements.

#### 5.4.128 Private Meeting Destination

Private meeting URLs are not exposed in public surfaces. Public Classroom is not required by current direction.

#### 5.4.129 Data Minimization

Lightweight Classroom collects only coordination data needed for approved use and no rich participant-surveillance data without a real approved case.

#### 5.4.130 Retention Boundary

Exact event retention is open. Historical metadata may outlive the live meeting; recording retention is not defined because recording is not current core.

#### 5.4.131 No Recording Retention Invention

Recording-retention rules must not be invented before a recording system exists.

#### 5.4.132 Empty States

Honest states include no upcoming classes, no past classes, no access, cancelled event, Join unavailable, and meeting link unavailable. Fake events are prohibited.

#### 5.4.133 Error States

Classroom eventually handles load, save, authorization, Join-link, external-destination, update/cancellation, and Notification failures. A failed save never appears successful.

#### 5.4.134 Partial Data

If provider state cannot be confirmed, the product must not fabricate live state, participant count, attendance, or recording.

#### 5.4.135 Mobile Experience

Mobile prioritizes title, host, date/time, status, Join, and essential context without desktop management density.

#### 5.4.136 Desktop Student Experience

Desktop may show more scheduling context but remains simple and does not imitate a conferencing control panel for an external meeting.

#### 5.4.137 Admin / School Desktop Experience

Authorized management may support event list, create/edit, audience, host, date/time, meeting URL, and status. Section 6 governs exact design.

#### 5.4.138 Accessibility

Classroom preserves RTL, readable time, non-color-only status, accessible Join, keyboard/focus behavior, touch controls, and understandable external-destination behavior.

#### 5.4.139 Light / Dark

Canonical themes preserve event clarity, schedule readability, Join prominence, and restrained brand presence.

#### 5.4.140 External Destination Accessibility

The UI should make clear that Join opens an external service; exact icon and copy remain open.

#### 5.4.141 Event State Honesty

Live now appears only with a trustworthy basis. Whether scheduled time alone is sufficient remains a Decision Gate.

#### 5.4.142 Join Success Boundary

Opening an external URL does not prove provider admission, joining, or attendance.

#### 5.4.143 Provider-Side Recording Boundary

An external provider may record independently, but KonkourX cannot claim a recording without an authorized real recording reference.

#### 5.4.144 Host Change

Authorized management may change host. Exact history and Notification behavior remains implementation-stage design.

#### 5.4.145 Audience Change

Authorized management may change audience before the event under Organization and Permission rules. Post-notification behavior remains open.

#### 5.4.146 Event Reschedule

Events may be rescheduled; meaningful changes must not leave participants with stale schedule information. Exact UX remains open.

#### 5.4.147 Event Cancellation

Authorized roles may cancel under Permission. Cancelled events stop behaving as active or upcoming.

#### 5.4.148 Event Delete Boundary

Archive/delete policy remains open. Meaningful historical events must not be destructively removed without considering references and history.

#### 5.4.149 Classroom Analytics Boundary

Current Classroom does not require large analytics. Future operational facts may include real event and cancellation counts or authoritative Attendance, never fabricated engagement analytics.

#### 5.4.150 No External Provider Scraping Requirement

KonkourX is not required to scrape providers for Attendance, recording, or state. Any integration must be explicit and supported.

#### 5.4.151 Event Notification Source

Classroom remains event source truth; Notifications are derived. Two independent schedules are prohibited.

#### 5.4.152 Calendar Source Boundary

Calendar is a view/aggregation layer and cannot create divergent Classroom truth.

#### 5.4.153 School Reuse

School/Institute uses the same event model with Organization scope, roles, audience, and Permissions rather than a duplicate engine.

#### 5.4.154 Future Teacher Reuse

Future Teachers use the shared domain under authorized Organization and class context.

#### 5.4.155 Future Internal Classroom Migration

If internal delivery is built later, existing Classroom Event identity should remain usable while delivery evolves from external URL to integrated provider or internal room.

#### 5.4.156 Delivery Mechanism ≠ Event Identity

Closed architectural principle: Classroom Event identity is separate from provider and delivery mechanism.

#### 5.4.157 Current External-First Strategy

KonkourX manages the educational event; the external provider manages the live meeting. This is intentional scope control.

#### 5.4.158 Future Video Does Not Invalidate Current Model

Future integrated or internal video extends the shared Event model rather than creating a separate product domain.

#### 5.4.159 Classroom Anti-Drift

Classroom must not drift into an internal WebRTC project now, Zoom clone, deep LMS, Course engine, Counseling Session, direct Chat, generic calendar record, duplicate School engine, mandatory recording system, proxy-based Attendance, engagement scoring, Student surveillance, public marketplace, or provider-hardcoded model.

The canonical current model remains **shared Classroom Event + title + host + date/time + authorized audience + external meeting URL + Join + shared Notifications + optional calendar presentation → external live meeting**, extensible later toward provider APIs, integrated video, Attendance, recording, Classroom Chat, whiteboard, screen sharing, interaction tools, homework/Course integration, recordings, and real operational analytics.

#### 5.4.160 Current vs. Future

**APPROVED FUTURE STATE — CORE CLASSROOM DIRECTION**:

- one shared lightweight Classroom Event domain with title, host/teacher, date/time, authorized audience, external meeting URL, and Join;
- external-provider delivery compatible with Google Meet, Skyroom, or equivalent providers without provider-defined event identity;
- shared Notifications and reminders, event changes/cancellation, Student upcoming-event access, School/Organization reuse, and backend authorization;
- no Attendance or recording inference, no duplicate Calendar truth, and separation of delivery mechanism from Event identity.

**APPROVED FUTURE STATE — EXTENSIBLE**:

- provider APIs, richer Teacher workflows, class/grade/group assignment, and external calendar synchronization;
- internal/embedded video, WebRTC, Attendance, recording, Classroom Chat, whiteboard, screen sharing, reactions, hand raise, polls, and participant controls;
- homework and Course integration, recordings as Learning Content, operational Classroom analytics, and separately approved AI assistance.

Future capabilities must not be presented as implemented. [PROJECT_STATE.md](PROJECT_STATE.md) remains authoritative for actual availability, and implementation requires a separately approved milestone.

#### 5.4.161 Decision Gates

Closed decisions:

- Classroom remains distinct from Messaging, Notifications, Tickets, Counselor Session, Learning Content, Exam, and Practice;
- current scope is intentionally lightweight and uses one shared Classroom Event domain;
- current core direction includes title, host/teacher, date/time, authorized audience, external meeting URL, and Join opening the external destination;
- delivery is external-provider based, compatible with examples such as Google Meet and Skyroom, provider-agnostic, and separate from Event identity;
- backend authorization protects event and link visibility; public discovery, anonymous joining, and arbitrary Student-created rooms are not approved;
- School/Organization reuses the shared domain, Counselor Session remains separate, and Counselor Role does not automatically grant teaching authority;
- internal WebRTC, streaming, recording, whiteboard, screen sharing, dedicated Classroom Chat, advanced interactions, and Attendance are not current core;
- Audience, Join click, Host identity, and Event end do not prove Attendance; attendance, engagement, and host-quality scoring are prohibited without authoritative approved models;
- Classroom uses shared Notifications; Calendar is presentation rather than source truth; Classroom does not process Payment;
- future recordings reuse Learning Content, and Exam, Practice, Task/Homework, Course, and Resource integrations reuse existing authoritative domains;
- proctoring, surveillance, public marketplace behavior, provider scraping assumptions, and autonomous AI Classroom behavior are outside scope;
- future AI cannot fabricate participation, Attendance, recording, class state, or content.

Remaining implementation-stage choices:

- required fields, creator/host Permission matrix, status taxonomy, start/end/duration semantics, Join window, URL validation, and provider login handling;
- audience-builder UX, Student history, edit/history behavior, reschedule/cancellation workflow, reminder timing, and Calendar presentation;
- commercial/Entitlement behavior if monetized, School audience modeling, host changes, archive/delete policy, and responsive layouts;
- future provider integration, Attendance source truth, recording, Classroom Chat, internal video/WebRTC, Course/Homework integration, analytics, and AI assistance.

These choices do not reopen any closed product decision.

## 6. Admin / Business / School

### 6.1 Admin Control Center

Admin is KonkourX's permission-driven platform operations and control plane. It lets authorized operators understand operational state and manage approved User, Counselor, application, Question Bank, Content, Support, Admin-account, Role/Permission, Audit, and sensitive workflows.

The canonical principle is **Role + fine-grained Permissions + scoped access + attributable sensitive actions → Admin Operations**. Admin, Business, and School remain distinct: Section 6.2 owns commercial truth, and Section 6.3 owns Organization truth.

#### 6.1.1 Admin Is Permission-Driven

Admin capability is permission-driven. A role named ADMIN is never sufficient authorization for every Admin feature.

#### 6.1.2 Super Admin

Super Admin has broad platform operational authority, but passwords remain unreadable, Break-Glass and Audit still apply, and broad authority never becomes silent authority.

#### 6.1.3 Ordinary Admin

Ordinary Admin roles receive only granted capabilities. Support Admin, Content Admin, Question Admin, Counselor Management, Finance-oriented, and Operations Admin are illustrative combinations rather than fixed staffing structures.

#### 6.1.4 Admin Role ≠ One Fixed Role

The architecture supports multiple dynamic administrative Roles rather than one all-powerful Admin profile.

#### 6.1.5 Dynamic Roles

Authorized role-management authority may compose Roles from existing Permissions. A new software capability still requires development.

#### 6.1.6 Permission Authority

Backend Permission checks are authoritative. Hidden controls, routes, menu visibility, or client-supplied Role names are insufficient.

#### 6.1.7 Admin Navigation Direction

Conceptual navigation includes Dashboard, Operations, Users, Counselors, Schools, Applications, Question Bank, Content, Support, Admins, Roles/Permissions, and Audit. Business is separate; exact order remains implementation-stage design.

#### 6.1.8 Admin Dashboard

Admin Dashboard is an operational platform overview, not a generic executive BI dashboard.

#### 6.1.9 Admin Dashboard Question

The Dashboard prioritizes “What currently requires operational attention?” rather than decorative metrics.

#### 6.1.10 Dashboard Real Data Only

User, Payment, Ticket, application, Counselor, review-queue, and alert summaries must use real product state.

#### 6.1.11 Dashboard Possible Summaries

Real summaries may cover pending applications, Support backlog, payment review, Question review, Content work, Counselor issues, account issues, meaningful events, and Organization items. Exact set remains open.

#### 6.1.12 Dashboard Not Full Reporting

Dashboard is a summary/action surface; specialized domains own detailed management.

#### 6.1.13 Operations

Operations is the day-to-day actionable platform activity and attention surface.

#### 6.1.14 Operations ≠ Audit

Operations shows work requiring action; Audit traces important or sensitive administrative actions. They remain distinct.

#### 6.1.15 Operations Examples

Meaningful items may include applications, payment receipts, Ticket escalations, Question moderation, Content issues, Counselor review, Organization support, and other approved domain work.

#### 6.1.16 Operations Not Every Event

Operations contains actionable work, not every technical or domain event.

#### 6.1.17 Operations Not Click Log

Page views, tab switches, filters, refreshes, hovers, and navigation clicks are not Operations items.

#### 6.1.18 User Management

Authorized Admin may inspect and manage Users according to Permission; User management is broader than account CRUD.

#### 6.1.19 User Profile Context

Authorized User detail may show real identity/profile, Roles, access, account state, join date, Counselor, Organization, Payment/Subscription, Session, Ticket, and operational context where permitted. Exact composition remains open.

#### 6.1.20 User Identity Boundary

Admin User views do not redefine Identity; Section 0 remains authoritative.

#### 6.1.21 Password Privacy

No Admin, including Super Admin, may read a user's plaintext password. Passwords remain non-recoverable secrets.

#### 6.1.22 Admin Cannot Reveal Password

Show password, View user password, and equivalent behavior are prohibited.

#### 6.1.23 Password Reset

Authorized Admin may initiate approved reset or recovery without reading or choosing the existing password. Exact workflow remains open.

#### 6.1.24 Session Revocation

Authorized roles may revoke active or all User sessions where security or operations requires. Exact UI and API are implementation details.

#### 6.1.25 Account Suspension

Authorized roles may suspend or restrict an account under Permission. Section 0 governs unresolved suspension consequences.

#### 6.1.26 Account Unlock

Authorized account-management roles may perform supported unlock or recovery actions. Exact mechanics remain open.

#### 6.1.27 User Role Management

Authorized roles may assign or remove platform Roles. Role changes are sensitive actions.

#### 6.1.28 User Entitlement Visibility

Authorized Admin may inspect shared Effective Access and commercial state without creating a parallel access model.

#### 6.1.29 User Entitlement Override

Authorized Business/Admin roles may perform approved, attributable Entitlement overrides with a reason. Section 6.2 remains commercially authoritative.

#### 6.1.30 User Payment Context

Admin may inspect Payment or Subscription context when Permission requires it; Finance-sensitive information remains need-to-know.

#### 6.1.31 User School Context

Authorized Admin may inspect Organization membership while Section 6.3 retains domain truth.

#### 6.1.32 User Counselor Context

Authorized Admin may inspect current or historical Counselor relationships without duplicating relationship truth.

#### 6.1.33 User Ticket Context

Admin may inspect a User's Tickets only under Ticket Permissions; Admin Role alone does not bypass sensitivity.

#### 6.1.34 User Private Chat Boundary

Ordinary Admin User detail never casually exposes private Student/Counselor Chat. Section 5.1 remains authoritative.

#### 6.1.35 Break-Glass for Sensitive Chat

Authorized Super Admin access to private Chat follows Break-Glass: special Permission, explicit reason, attribution, and Audit where required.

#### 6.1.36 Private Counselor Note Boundary

Ordinary Admin cannot casually browse Counselor Private Notes. Authorized Super Admin may use governed Break-Glass where policy permits.

#### 6.1.37 Counselor Management

Admin supports authorized Counselor lifecycle and operational management.

#### 6.1.38 Counselor Applications

Counselor application review is distinct from Student signup and limited to authorized roles.

#### 6.1.39 Counselor Application Review

Review may use submitted identity, qualification, and product-required information. Exact fields and workflow remain implementation-stage design.

#### 6.1.40 Counselor Application Outcome

Authorized reviewers may approve, reject, or request correction or more information where supported. Exact state model remains open.

#### 6.1.41 Application Review Traceability

Meaningful Counselor application decisions are attributable rather than anonymous.

#### 6.1.42 Counselor Status

Admin may manage Section 3.6 status concepts ACTIVE, LEAVE, NOT_ACCEPTING, SUSPENDED, and INACTIVE without redefining them.

#### 6.1.43 Counselor Capacity

Authorized management may inspect or change Section 3.6 Capacity. Capacity changes are meaningful administrative actions.

#### 6.1.44 Counselor Assigned Students

Authorized management may inspect assigned Students without granting ordinary Admin unrestricted academic-data access.

#### 6.1.45 Counselor Workload

Authorized management may inspect limited real caseload, Capacity, backlog, Follow-up, Session, Planning, and report-work evidence from Section 3.6.

#### 6.1.46 Counselor Performance Boundary

Operational evidence must not produce automatic good/bad verdicts, quality scores, staff grades, or employment recommendations.

#### 6.1.47 Periodic Counselor Review

Authorized management may conduct human periodic review using real evidence. The process remains human-controlled.

#### 6.1.48 Counselor Complaints

Authorized management may inspect complaints under sensitivity and Permission rules. The complained-about Counselor does not receive automatic access.

#### 6.1.49 Counselor Change Management

Authorized management handles Change-Counselor workflows. Closing a Ticket does not change assignment; the canonical relationship requires an authorized domain action.

#### 6.1.50 Counselor Reassignment

Authorized Admin may reassign relationships where approved. Exact workflow remains a Decision Gate, and historical context stays meaningful.

#### 6.1.51 School Management Entry

Admin may have authorized Organization oversight, while Section 6.3 owns detailed School behavior.

#### 6.1.52 School Applications

School/Institute onboarding may use its own authorized review workflow. Exact form and states remain implementation-stage design.

#### 6.1.53 Organization Authority Boundary

Platform Admin and School Manager are different roles. School Manager is Organization-scoped; Platform Admin is platform-Permission-scoped.

#### 6.1.54 School Support

Admin/Support handles Organization issues through the central Ticket system rather than a separate School support engine.

#### 6.1.55 Applications Area

A shared Applications area may support approved Counselor, School/Institute, and other explicit applications. It is not a generic form builder.

#### 6.1.56 Question Bank Admin

Admin exposes authorized Section 4.1 Question Bank operations.

#### 6.1.57 Question Review Queue

Permissions determine who may view, review, approve/reject, and publish/unpublish Questions.

#### 6.1.58 Question Author ≠ Reviewer

Contributor/Author, Reviewer, Approver, and Publisher remain distinct; Admin does not collapse them into universal authority.

#### 6.1.59 Question History

Authorized Admin may inspect moderation and version history while preserving historical Exam integrity.

#### 6.1.60 Content Admin

Admin exposes authorized Section 4.4 Learning Content management.

#### 6.1.61 Content Operations

Permissioned staff may create, edit, publish, archive, update File/URL, link Curriculum, and order Content.

#### 6.1.62 Content Commercial Authority

Content editing does not grant commercial access authority; Section 6.2 governs commercial configuration.

#### 6.1.63 Support Admin

Admin exposes the central Ticket system to authorized Support and operations roles.

#### 6.1.64 Support Queue Scope

Support staff see only permitted Queues and Tickets; every Admin does not receive global Support visibility.

#### 6.1.65 Support Sensitive Cases

Complaint, Counselor-change, payment/refund, and account/security cases remain need-to-know.

#### 6.1.66 Admins Management

Super Admin or authorized role-management authority manages Admin accounts.

#### 6.1.67 Admin Account Creation

Admin accounts have no public signup. Authorized authority creates them.

#### 6.1.68 Admin Role Assignment

Account creation and Role assignment are distinct; a new Admin requires explicit Role/Permission configuration.

#### 6.1.69 Admin Disable / Suspend

Authorized authority may disable or restrict Admin operational access. Exact state model remains open.

#### 6.1.70 Admin Session Revocation

Authorized Super Admin may revoke Admin sessions for security or operations.

#### 6.1.71 Admin Password Privacy

Super Admin cannot read another Admin's password; Section 0 remains authoritative.

#### 6.1.72 Roles / Permissions Area

Admin includes a Permission-management area accessible only to authorized roles.

#### 6.1.73 Permission Catalog

The platform supplies software-defined Permissions that Admin may package into Roles. Admin UI cannot invent executable software capability.

#### 6.1.74 Role Creation

Authorized Super Admin may create dynamic Roles from existing Permissions.

#### 6.1.75 Role Editing

Authorized role-management authority may edit Role composition. Permission changes are sensitive.

#### 6.1.76 Role Deletion / Retirement Boundary

Deletion or retirement behavior for assigned Roles remains open and must not silently orphan access state.

#### 6.1.77 Permission Matrix

The exact Permission matrix remains an implementation-stage Decision Gate; the architectural model is closed.

#### 6.1.78 Effective Access

Admin respects Section 0 Effective Access rather than using an Admin-only authorization formula.

#### 6.1.79 Admin Override Boundary

Overrides must be explicit and attributable. Super Admin cannot silently mutate every domain.

#### 6.1.80 Audit

Admin includes a meaningful Audit surface for important and sensitive administrative actions.

#### 6.1.81 Audit Is Limited

Audit is not a universal activity log and does not record every ordinary interaction.

#### 6.1.82 Audit Examples

Potential meaningful events include Role or Permission changes, Break-Glass access, suspension, reset/recovery, selected session revocation, Payment or Entitlement override, sensitive Counselor changes, Question or Content publication, Ticket grants, and major Admin-account changes. Exact inventory remains open.

#### 6.1.83 Audit Does Not Include Every Click

Navigation, page views, tabs, filters, sorting, refreshes, hovers, and ordinary Dashboard viewing are not Audit events.

#### 6.1.84 Audit Actor

Sensitive Audit events identify the responsible actor or system where applicable.

#### 6.1.85 Audit Time

Audit preserves real event time.

#### 6.1.86 Audit Target

Audit identifies the relevant target or context where appropriate.

#### 6.1.87 Audit Reason

Break-Glass, manual commercial override, or sensitive status change may require a reason. Exact mandatory-reason matrix remains open.

#### 6.1.88 Audit History Integrity

Ordinary Admin roles cannot casually mutate Audit history. Exact retention and storage controls are technical implementation.

#### 6.1.89 Audit Access

Audit itself is permission-controlled; not every Admin sees complete platform history.

#### 6.1.90 Break-Glass Audit

Section 0 Break-Glass actions produce appropriate attributable Audit evidence.

#### 6.1.91 Operations vs. Audit Example

“Payment receipt awaiting review” is Operations; “Admin manually approved a Payment/Entitlement override” is Audit.

#### 6.1.92 Ticket Timeline ≠ Platform Audit

Ticket Timeline records formal case workflow; platform Audit records administrative traceability. They may overlap but remain separate.

#### 6.1.93 Question History ≠ Platform Audit

Question history remains domain history; a sensitive publication action may additionally produce Audit evidence.

#### 6.1.94 Admin Search

Admin may search authorized Users, Counselors, Schools, Tickets, Questions, and Content. Exact UX remains open.

#### 6.1.95 Search Respects Authorization

Search cannot bypass access or reveal hidden Users, cases, or data.

#### 6.1.96 Admin Filtering

Domains may provide practical scoped filters without turning Admin into a generic BI or query builder.

#### 6.1.97 Bulk Action Boundary

Potential future bulk actions require explicit product and Permission design; unrestricted mass mutation is not authorized.

#### 6.1.98 Sensitive Bulk Actions

Bulk suspension, deletion, Entitlement grants, Counselor reassignment, or private-data access are not assumed or authorized here.

#### 6.1.99 Admin Delete Boundary

Admin cannot casually hard-delete historical truth; each source domain governs archive and deletion.

#### 6.1.100 Source Domain Authority

Admin is an operational interface, not replacement truth. Business owns Payment, Ticket owns Tickets, Question Bank owns Questions, Learning Content owns Content, and Counselor/assignment owns relationship state.

#### 6.1.101 Admin Action Uses Domain Workflow

Admin actions invoke real authorized domain operations rather than modifying disconnected Admin-only state.

#### 6.1.102 Business Boundary

Section 6.2 owns Product, Plan, Entitlement, Subscription, and Payment configuration. Admin may link to it without redefining it.

#### 6.1.103 School Boundary

Section 6.3 owns Organization management; Admin provides only authorized platform oversight and support.

#### 6.1.104 Public Website CMS Boundary

Section 1 governs Public Website CMS architecture even if Admin hosts its management surface.

#### 6.1.105 Notification Boundary

Admin uses shared Notifications and does not create an Admin-only engine.

#### 6.1.106 Admin Broadcast

Authorized Broadcast reuses Section 5.2 rather than private Messaging.

#### 6.1.107 Messaging Privacy Boundary

Section 5.1 privacy remains binding; ordinary Admin has no browse-all Chat screen.

#### 6.1.108 Ticket Privacy Boundary

Admin Ticket access obeys Section 5.3 Queue, sensitivity, and Permission rules.

#### 6.1.109 Question Bank Boundary

Question operations preserve Section 4.1 authoring, moderation, approval, publication, and historical integrity.

#### 6.1.110 Content Boundary

Content operations preserve Section 4.4 identity, publication, commercial authority, Curriculum links, and access.

#### 6.1.111 Exam Boundary

Exam administration preserves Section 4.3 Attempt and release history; Admin cannot casually rewrite old Exam truth.

#### 6.1.112 Admin Data Honesty

Never fabricate counts, queues, applications, Tickets, Payments, Counselor workload, Audit events, Roles, Permissions, Entitlements, School state, Question review, or Content state.

#### 6.1.113 Zero ≠ Failed Fetch

A failed Ticket or Payment fetch is not verified zero work.

#### 6.1.114 Partial Data

Cross-domain Dashboard aggregation supports honest loading, partial, error, and retry states without hiding source failure.

#### 6.1.115 Empty States

Real empty states include no applications, Payment reviews, Question backlog, or scoped Support cases; fake work is prohibited.

#### 6.1.116 Admin Mobile Boundary

Admin is primarily desktop-oriented, while appropriate low-complexity mobile operations remain usable without unreadable dense tables.

#### 6.1.117 Admin Desktop Experience

Desktop may be denser than Student/Counselor surfaces but stays readable, task-oriented, Permission-aware, and operational rather than generic BI.

#### 6.1.118 Admin Navigation Visibility

Navigation reflects Permissions as UX, while backend checks remain authoritative.

#### 6.1.119 RTL

Admin preserves RTL and the approved right-side desktop sidebar.

#### 6.1.120 Light / Dark

Canonical themes prioritize operational readability, compact density, status clarity, and restrained treatment.

#### 6.1.121 Accessibility

Admin preserves keyboard/focus behavior, readable lists, non-color-only states, accessible forms, clear sensitive actions, RTL, and appropriate touch targets.

#### 6.1.122 Confirmation for Sensitive Actions

Sensitive or destructive actions may require clear confirmation. Exact behavior remains open, and harmless actions should not be overburdened.

#### 6.1.123 Reason for Sensitive Action

Break-Glass, manual Entitlement override, selected suspensions, sensitive Ticket access, or Capacity/status override may require a human-readable reason. Exact matrix remains open.

#### 6.1.124 No Admin Impersonation by Default

General Login as User impersonation is not current core. Any future support impersonation requires explicit product and security design.

#### 6.1.125 No Database Editor

Admin is not a SQL console, table editor, Prisma editor, arbitrary JSON editor, or schema editor. Operations use supported product workflows.

#### 6.1.126 No Code / Schema Authority

Super Admin cannot edit application code, database schema, or API definitions through Admin UI.

#### 6.1.127 No Generic Internal Tool Builder

Dynamic Roles and Plans do not turn Admin into a no-code internal-tool builder.

#### 6.1.128 No Employee Surveillance

Screen, keystroke, mouse, every-click, time-online, and hidden productivity monitoring are prohibited.

#### 6.1.129 No User Surveillance

Admin Dashboard cannot become invasive Student behavior surveillance; only meaningful domain evidence is used.

#### 6.1.130 No Counselor Quality Auto-Score

Section 3.6 human evidence review remains authoritative; automatic Counselor quality scores are prohibited.

#### 6.1.131 No Support Staff Auto-Score

Ticket metrics cannot automatically grade Support staff.

#### 6.1.132 No Admin Leaderboard

Admin, Support, Moderator, and Counselor productivity leaderboards are not approved behavior.

#### 6.1.133 No Public Admin Activity

Administrative history is internal and is not a public staff social feed.

#### 6.1.134 No Automatic Disciplinary Engine

Opaque metrics cannot automatically suspend Counselors/Admins, terminate accounts, change Roles, or reduce Capacity. Sensitive management remains human-controlled.

#### 6.1.135 AI Admin Assistance Future

Future AI may assist authorized workflows with summaries, triage suggestions, Ticket summaries, Question-review support, or anomaly summaries. It remains future/extensible.

#### 6.1.136 AI Cannot Grant Itself Authority

Future AI remains within Role and Permission boundaries.

#### 6.1.137 AI Sensitive Action Boundary

AI cannot autonomously suspend accounts, grant Roles, change Permissions, approve refunds, grant Entitlements, publish Questions or Content, access private Chat, or change Counselor assignment.

#### 6.1.138 AI Cannot Fabricate Admin Facts

AI must not fabricate Payment state, User history, complaints, Counselor evidence, Ticket state, Audit events, Roles, Entitlements, or application results.

#### 6.1.139 Operations Automation Boundary

Future low-risk rule automation must be Permission-aware, explainable, attributable, and reversible where appropriate. Sensitive decisions remain separately governed.

#### 6.1.140 Admin Notifications

Admin may receive shared Notifications for meaningful authorized applications, Ticket escalations, Payment review, or Question work. Exact event set remains open.

#### 6.1.141 Admin Work Queues

Domain work queues reference real underlying source truth rather than a disconnected Admin checklist.

#### 6.1.142 Admin Application Queue

Application review may use a pending queue; exact prioritization remains implementation-stage design.

#### 6.1.143 Payment Review Queue Boundary

Section 6.2 owns manual Payment review; Admin accesses it only when permitted.

#### 6.1.144 Question Review Queue Boundary

Section 4.1 owns Question moderation Queue semantics; Admin provides the management surface.

#### 6.1.145 Ticket Queue Boundary

Section 5.3 owns Ticket Queue semantics; Admin provides the handling surface.

#### 6.1.146 Counselor Review Queue Boundary

Admin may provide human review workflow using Section 3.6 evidence without creating an automatic staff-risk engine.

#### 6.1.147 Platform Health Boundary

Deep CPU, memory, database, and trace observability belongs to infrastructure tools; Product Admin is not DevOps monitoring.

#### 6.1.148 Security Operations Boundary

Product-level restrictions, session revocation, and Break-Glass records may appear without turning Admin into a full SIEM.

#### 6.1.149 Admin Retention Boundary

Each source domain retains its own policy; Admin does not impose one global record-retention rule.

#### 6.1.150 Audit Retention Boundary

Audit retention is a technical/legal Decision Gate and does not inherit ordinary Chat retention.

#### 6.1.151 Sensitive Data Redaction

Admin exposes only sensitive data needed for authorized work. Exact masking policy remains open.

#### 6.1.152 Export Boundary

Any future export requires explicit Permission and privacy design; unrestricted platform-data export is not authorized.

#### 6.1.153 Role-Based Landing

Different Admin roles may land on relevant operational views. Exact routing remains open.

#### 6.1.154 Business Navigation Boundary

Business may appear as an authorized Admin-area entry, while Section 6.2 owns its semantics.

#### 6.1.155 School Navigation Boundary

Schools may appear as an authorized entry, while Section 6.3 owns Organization semantics.

#### 6.1.156 Application State Honesty

Application states are real; pending or failed review cannot appear Approved.

#### 6.1.157 Admin Action Failure

Failed suspension, Role assignment, publication, Ticket grant, or Capacity update must never appear successful.

#### 6.1.158 Admin Concurrency Boundary

Concurrent-edit behavior remains implementation-stage design; no complex locking architecture is invented here.

#### 6.1.159 Admin History / Timeline Reuse

Admin reuses Ticket Timeline, Question history, Payment history, and Counselor relationship history instead of creating parallel copies.

#### 6.1.160 Platform-Wide Search Boundary

Future cross-domain search may be considered but must be Permission-aware and is not current required core.

#### 6.1.161 Super Admin Break-Glass Principle

Broad Super Admin authority does not turn private data into ordinary browsable content. Exceptional access remains exceptional.

#### 6.1.162 Admin Accountability Principle

More sensitive actions require stronger attribution and traceability; harmless navigation does not carry the same burden.

#### 6.1.163 Human Control Principle

Sensitive Admin decisions remain authorized and human-controlled; systems and AI may assist but not decide silently.

#### 6.1.164 Admin Anti-Drift

Admin must not drift into one global all-access role, database/schema/code editor, browse-all Chat or Notes console, every-click surveillance, employee scoring, generic BI, DevOps monitoring, Business or School replacement, duplicate source truth, automatic discipline, or autonomous AI administration.

The canonical model is **Permission-driven Admin Roles + operational Dashboard + actionable Operations + Users + Counselors + Schools + Applications + Question Bank + Content + Support/Tickets + Admin accounts + Roles/Permissions + limited sensitive Audit + Break-Glass**, with Operations ≠ Audit and Admin ≠ Business ≠ School.

#### 6.1.165 Current vs. Future

**APPROVED FUTURE STATE — CORE ADMIN DIRECTION**:

- permission-driven Admin with broad but attributable Super Admin authority and dynamic Admin Roles;
- Dashboard, Operations, Users, Counselors, Schools, Applications, Question Bank, Content, Support, Admins, Roles/Permissions, and Audit;
- backend authorization, User account operations, session revocation, approved suspension/recovery, and Role management;
- Counselor application, status, Capacity, reassignment, and human-review support plus School/application support;
- reuse of Question moderation, Content management, Ticket queues, Business, School, Identity, and other source-domain truth;
- authorized Admin-account creation with no public signup, limited meaningful Audit, Break-Glass, honest loading/error states, and no every-click surveillance.

**APPROVED FUTURE STATE — EXTENSIBLE**:

- richer cross-domain Operations, additional Admin Roles, configurable work queues, low-risk automation, Permission-aware cross-domain search, constrained export, richer summaries, AI-assisted summaries/triage, and additional security or management tools.

Future capabilities must not be presented as implemented. [PROJECT_STATE.md](PROJECT_STATE.md) remains authoritative for actual availability, and implementation requires a separately approved milestone.

#### 6.1.166 Decision Gates

Closed decisions:

- Admin is Permission-driven; one fixed all-access Admin Role is not the architecture; Super Admin authority is broad but attributable and never reveals passwords;
- dynamic Roles package software-defined Permissions without creating new software capabilities;
- conceptual areas include Dashboard, Operations, Users, Counselors, Schools, Applications, Question Bank, Content, Support, Admins, Roles/Permissions, and Audit, while Business and School remain distinct;
- Dashboard is action-oriented; Operations and limited Audit are separate; clicks, tabs, filters, refreshes, and ordinary viewing are not tracked;
- User management reuses Identity, Effective Access, Payment, Ticket, Counselor, and Organization truth; authorized reset, revocation, suspension, and recovery exist directionally;
- private Chat and Private Notes are not ordinary Admin-browsable; exceptional access follows Break-Glass with Permission, reason, attribution, and appropriate Audit;
- authorized roles review Counselor applications and manage existing status and Capacity concepts; periodic Counselor review remains human, with no automatic quality score;
- Question Bank reuses Section 4.1, Content reuses Section 4.4, Support reuses Section 5.3, Notifications reuse Section 5.2, and public CMS remains governed by Section 1;
- Admin accounts have no public signup; creation and Role assignment require authorized authority; Audit is meaningful and Permission-controlled;
- source domains remain authoritative; Admin cannot create parallel Payment, Ticket, Question, Content, Exam, Counselor, Business, or School truth;
- Admin is not a database, schema, code, API, generic BI, internal-tool, DevOps, SIEM, surveillance, staff-ranking, disciplinary, or autonomous AI system;
- future AI cannot autonomously perform sensitive actions or fabricate operational facts.

Remaining implementation-stage choices:

- exact Admin Role/Permission matrix, navigation order, Dashboard counters, Operations events, User detail composition, suspension consequences, recovery capabilities, and session UX;
- Counselor application fields/states, reassignment and review workflows, School application review, Role lifecycle, and Permission naming;
- sensitive-action confirmations, reason-required matrix, Audit inventory, retention and access roles, search/filter UX, mobile scope, and desktop layouts;
- redaction/masking, exports, future cross-domain search, low-risk automation, and AI assistance.

These choices do not reopen any closed product decision.

### 6.2 Business / Plans / Entitlements / Payments

Business is KonkourX's commercial and access layer. It defines sellable Products and Plans, packages software-defined Entitlements, manages Purchases and Subscriptions, processes Payments, activates verified access, supports Organization commerce, and permits attributable authorized overrides.

The closed conceptual distinction is **Product ≠ Plan ≠ Entitlement ≠ Subscription ≠ Payment**. These concepts interact but never collapse into one generic Plan field or table.

#### 6.2.1 Product

Product is a commercial offering that may be sold or packaged, such as Question Bank, Exam Builder, Learning Content, Counseling, School access, or another approved capability. Initial catalog is business detail.

#### 6.2.2 Product ≠ Software Capability

Business may package existing software capabilities but cannot create executable behavior. New capability requires product development and code.

#### 6.2.3 Plan

Plan is a commercial bundle of existing Entitlements and terms. It does not define application logic.

#### 6.2.4 Product vs. Plan

Product and Plan remain distinct. A Product may have one or more Plans, one-time configuration, or future B2B packaging; exact relationships remain open.

#### 6.2.5 Entitlement

Entitlement is a usable capability or right, such as question_bank.access, exam_builder.access, counselor.assigned, planning.advanced, learning.premium, or school.pdf_export. Exact catalog remains implementation/domain design.

#### 6.2.6 Entitlement Is Capability-Based

Domain authorization checks effective capabilities, never hardcoded Gold, VIP, Premium, or other Plan names.

#### 6.2.7 Plan Packages Entitlements

A Plan may bundle Entitlements, supported limits, and commercial terms. Its name is not authorization truth.

#### 6.2.8 Effective Access

Section 0 remains authoritative: Role + Plan Entitlements + Organization Entitlements + User Overrides + approved one-time rights feed Effective Access.

#### 6.2.9 Subscription

Subscription is a time-bounded commercial relationship to a Product or Plan, potentially preserving start, end, status, renewal state, purchase context, and granted rights. Exact model remains open.

#### 6.2.10 Subscription ≠ Payment

Payment is transaction state; Subscription is access over time. Verified Payment may activate or renew Subscription but is not the Subscription.

#### 6.2.11 Payment

Payment is the financial transaction workflow for an Order or Purchase and preserves appropriate method, status, provider, and reference context.

#### 6.2.12 Payment ≠ Entitlement

Verified Payment may trigger commercial activation, but Entitlement truth remains in shared access rather than Payment logic.

#### 6.2.13 Purchase

Purchase represents commercial acquisition. Exact Order/Purchase/Subscription representation remains implementation-stage design, while conceptual separation is mandatory.

#### 6.2.14 Order

Order records what the user intends to buy before Payment completion becomes authoritative.

#### 6.2.15 Product Builder

Authorized Business/Admin roles receive a Product/Plan Builder for packaging existing capabilities.

#### 6.2.16 Product Builder Fields

Configuration may include name, description, price, discount, duration, trial, active state, display order, badge, CTA, Entitlements, limits, customer type, and visibility. Exact required fields remain open.

#### 6.2.17 Dynamic Packaging

Price, duration, ordering, included Entitlements, and display metadata for supported capabilities should change without code deployment.

#### 6.2.18 Product Builder Boundary

The Builder is not a no-code app, Permission, API, or software-feature builder.

#### 6.2.19 New Capability Requires Code

Typing an unknown Entitlement key cannot create functionality; the software-defined capability catalog is authoritative.

#### 6.2.20 Product Active State

Products and Plans may be active or inactive for new acquisition. Stopping sales does not automatically remove previously purchased access; exact historical behavior remains open.

#### 6.2.21 Price

Pricing is configurable commercial truth and must not be hardcoded in frontend or source code.

#### 6.2.22 Discount

Explicit discounts may be configured. Exact rules remain open, and no deep promotion engine is current core.

#### 6.2.23 Duration

Duration is configurable for time-bounded access; exact units and presets remain open.

#### 6.2.24 Trial

Trial may be explicitly configured for selected Products. It is not assumed universally; exact behavior remains open.

#### 6.2.25 Plan Order / Presentation

Business may configure display order and presentation metadata without affecting software authority.

#### 6.2.26 Badges / Labels

Configured popular, recommended, or best-value labels are presentation metadata and cannot fabricate popularity or performance.

#### 6.2.27 Customer Type

Products may target individual Students, Organizations/Schools, or other approved customers. Exact taxonomy remains open.

#### 6.2.28 One-Time Purchase

Suitable products and Content may be purchased once, distinctly from Subscription.

#### 6.2.29 One-Time Access

One-time Purchase grants a defined persistent or bounded right. Permanence rules remain a Decision Gate; one-time does not automatically mean lifetime forever.

#### 6.2.30 Recurring / Renewal Boundary

Automatic recurring debit is not current core. Provider and autorenew behavior require later decisions.

#### 6.2.31 Subscription Status

Subscription has explicit lifecycle state distinguishing usable active access from expired, cancelled, or inactive states. Exact taxonomy remains open.

#### 6.2.32 Start / End

Time-bounded Subscriptions preserve authoritative dates rather than relying on frontend countdowns.

#### 6.2.33 Expiry

Expiry removes only rights that actually ended. Grace-period behavior remains open.

#### 6.2.34 Access After Expiry

Commercial expiry does not erase Exam, Practice, purchase, or Student history governed by source domains.

#### 6.2.35 Renewal

Renewal creates a traceable commercial continuation rather than rewriting original transaction history. Exact workflow remains open.

#### 6.2.36 Upgrade / Downgrade Boundary

Upgrade, downgrade, and proration require explicit policy and are not locked here.

#### 6.2.37 Coupons Future

Coupons and promo codes remain future/extensible unless separately implemented.

#### 6.2.38 Payment Provider Abstraction

Payment providers connect through adapters; the Business domain must not be permanently hardwired to one PSP.

#### 6.2.39 Provider Examples

Potential adapters include Zarinpal, a direct PSP, another Iranian provider, or future alternatives. Examples do not claim implementation.

#### 6.2.40 New Provider Requires Adapter

A materially different provider protocol requires developer implementation of an adapter; Admin configuration cannot support an unknown API.

#### 6.2.41 Configured Provider

After an adapter exists, authorized Admin may configure it without application deployment.

#### 6.2.42 Provider Configuration

Adapter-specific configuration may include active state, merchant/terminal identifiers, credentials, sandbox/production, priority, and limits.

#### 6.2.43 Provider Secrets

Provider secrets are sensitive and must not be exposed to ordinary Admin or casually returned through UI/API.

#### 6.2.44 No Plaintext Secret Display

General show merchant secret behavior is prohibited; authorized configuration minimizes exposure.

#### 6.2.45 Provider Priority

Multiple configured providers may later support priority or fallback. Exact selection rules remain open.

#### 6.2.46 Provider Failover Boundary

Automatic failover is not current closed scope and requires explicit duplicate-safe rules.

#### 6.2.47 Online Payment Flow

The closed flow is **Order → provider request → redirect → provider Payment → callback/return → backend verification → authoritative Payment result → commercial activation**.

#### 6.2.48 Frontend Success Is Not Authoritative

A success page or provider-return parameter cannot activate access.

#### 6.2.49 Backend Verify

Backend verifies Payment under the configured adapter protocol. Only authoritative verification can drive activation.

#### 6.2.50 Callback

Callback/return is input to backend verification, not final truth.

#### 6.2.51 Client Cannot Mark Paid

Client-supplied paid or success fields are never trusted for activation.

#### 6.2.52 Payment Idempotency

Duplicate callbacks or retries must not create duplicate unintended Purchases or access grants. Exact mechanism is implementation detail.

#### 6.2.53 Payment Reference

Real provider and transaction references required for traceability are preserved and never fabricated.

#### 6.2.54 Amount Verification

Backend validates authoritative transaction amount against the expected Order/Product context before activation.

#### 6.2.55 Verified Success

Verified success may activate the intended Purchase, Subscription, renewal, or Entitlements according to Order/Product.

#### 6.2.56 Verified Failure

Failed or unverified Payment never activates access.

#### 6.2.57 Pending / Unknown State

Processing uncertainty remains pending or unknown rather than being invented as success or failure.

#### 6.2.58 Retry / Reconciliation

Exact retry and reconciliation remain open, but architecture must preserve later verification capability.

#### 6.2.59 Card-to-Card

Manual Card-to-Card is an approved Payment workflow distinct from online PSP verification.

#### 6.2.60 Card-to-Card Instructions

Users may receive authorized manual-transfer instructions. Exact bank/account presentation is security and implementation detail.

#### 6.2.61 Card-to-Card Submission

Users may submit reference/tracking number, receipt image/file, or other approved evidence. Exact required evidence remains open.

#### 6.2.62 Card-to-Card Status Flow

The closed concepts are WAITING_FOR_RECEIPT → UNDER_REVIEW → APPROVED or REJECTED.

#### 6.2.63 Manual Review

Authorized Finance/Admin reviews evidence; User submission never auto-approves Payment.

#### 6.2.64 Card-to-Card Approval

Only authorized approval activates the related intended commercial access.

#### 6.2.65 Card-to-Card Rejection

Rejected manual Payment never activates access. Exact reason UX remains open.

#### 6.2.66 Manual Payment Traceability

Approval or rejection preserves actor, time, relevant Order/Payment, and reason where policy requires.

#### 6.2.67 Card-to-Card ≠ Payment Provider

Card-to-Card is a manual Payment Method, not a PSP adapter with gateway verification.

#### 6.2.68 Payment Method Separation

A Product may use online PSP, Card-to-Card, or another approved method without changing Product identity.

#### 6.2.69 Product Does Not Hardcode Payment Method

Separate Products must not be created solely because Payment Method differs.

#### 6.2.70 Payment Status Model

Payment has trustworthy states covering pending, verified success, failure, manual review, and rejection. Exact names remain open.

#### 6.2.71 Subscription Activation

Subscription activation follows authoritative commercial confirmation, never frontend optimism.

#### 6.2.72 Entitlement Activation

Entitlements follow authoritative Purchase, Subscription, or override state.

#### 6.2.73 Activation Is Server-Controlled

Commercial access activation is always server-controlled.

#### 6.2.74 Business Admin

Authorized Business/Admin roles manage commercial configuration separately from general Admin authority.

#### 6.2.75 Business Permissions

Fine-grained concepts may include product.view/manage, plan.manage, payment.view/review, provider.manage, and entitlement.override. Exact names remain open.

#### 6.2.76 Finance Role

Finance roles may review and reconcile Payments without unrelated Admin authority.

#### 6.2.77 Product Manager Authority

Product/Plan editing does not grant provider-secret access, refund authority, User suspension, Question moderation, or private Chat access.

#### 6.2.78 Provider Management Authority

Provider configuration requires specific sensitive Permission and is not exposed to unrelated staff.

#### 6.2.79 Commercial Override

Authorized roles may extend access, grant temporary or specific Entitlements, or correct commercial access state through approved workflows.

#### 6.2.80 Override Reason

Manual commercial overrides require a meaningful human-readable reason.

#### 6.2.81 Override Attribution

Override preserves actor, target User/Organization, affected access/Product, reason, and time.

#### 6.2.82 Override ≠ Plan Mutation

A User-specific override never changes the Plan for other users.

#### 6.2.83 Override Expiry

Temporary overrides may expire; exact model remains open.

#### 6.2.84 Revoke Override

Authorized roles may revoke overrides while retaining attributable history.

#### 6.2.85 Override Audit

Meaningful overrides are Audit-worthy under Section 6.1.

#### 6.2.86 Organization / B2B Commercial Access

School/Organization commerce reuses the same Business engine.

#### 6.2.87 Organization Product

Products and Plans may target Organizations; exact pricing remains open.

#### 6.2.88 Organization Entitlements

Business owns commercial Entitlements; Section 6.3 owns membership and scope through which permitted members receive them.

#### 6.2.89 Business ≠ School

Business determines commercial rights; School defines Organization membership and educational structure.

#### 6.2.90 School Plan Limits

Supported School Plans may include seats, staff limits, features, or export capability. Exact limits remain open.

#### 6.2.91 Limits Are Entitlement/Capability Data

Supported limits are explicit capability data, never opaque Plan-name checks.

#### 6.2.92 Plan Change Boundary

Plan edits may affect future configuration. Existing active Subscription behavior is a Decision Gate; historical terms cannot be silently mutated.

#### 6.2.93 Purchase Snapshot / Historical Commercial Context

History preserves what was purchased, amount, Product/Plan context, duration, and rights sufficiently for interpretation after catalog edits.

#### 6.2.94 Price Change Does Not Rewrite Old Payment

Current price changes never rewrite historical Order or Payment amounts.

#### 6.2.95 Plan Rename Does Not Erase History

Catalog renames cannot destroy historical purchase interpretation; exact snapshot/version mechanism remains open.

#### 6.2.96 Product Archive

Product or Plan may be retired from future sales while historical Purchases and Subscriptions remain traceable.

#### 6.2.97 Product Delete Boundary

Products used in history cannot be destructively deleted in a way that breaks commercial records. Exact policy remains open.

#### 6.2.98 Payment History

Users and authorized Admin may access real Payment/Purchase history.

#### 6.2.99 User Payment View

Users may view their own authorized commercial information; exact detail level remains UX-stage design.

#### 6.2.100 Admin Payment View

Authorized Finance/Admin may inspect Payment details without exposing provider secrets.

#### 6.2.101 Payment Notifications

Verified Payment, manual review, activation, and expiry events may use shared Notifications under Section 5.2.

#### 6.2.102 Notification Does Not Activate Access

Payment Notification is informational and grants no Entitlement.

#### 6.2.103 Ticket Integration

Payment and Subscription issues use the central Ticket system.

#### 6.2.104 Ticket Does Not Change Payment

Resolving a Payment Ticket never marks Payment successful or refunded; an authorized Business workflow performs the action.

#### 6.2.105 Learning Content Purchase

Learning Content and Courses consume Business one-time or Plan access and do not own Payment engines.

#### 6.2.106 Question Bank Access

Question Bank and Practice consume Business Entitlements through Effective Access.

#### 6.2.107 Exam Builder Access

Self-Exam Builder consumes relevant capabilities such as question_bank.access and exam_builder.access, never Plan names.

#### 6.2.108 Counseling Commercial Boundary

Counseling may later be packaged, but billing details and commission behavior are not locked here.

#### 6.2.109 No Payroll Engine

Counselor salary, commission, staff payroll, revenue share, and Teacher payroll are not current scope.

#### 6.2.110 No Accounting Suite

Business does not turn KonkourX into full accounting or ERP software.

#### 6.2.111 No Tax Engine Currently

Tax, invoice, and compliance details require explicit future legal/product specification.

#### 6.2.112 Refund

Refund is future/extensible; detailed workflow is not current core.

#### 6.2.113 Refund Authority

Future refunds require authorized Finance/Admin action and cannot be triggered merely by Ticket closure or frontend input.

#### 6.2.114 Partial Refund Boundary

Partial refund requires future explicit commercial and provider design.

#### 6.2.115 Wallet Future

Wallet or balance is future/extensible, not current core.

#### 6.2.116 Credit Future

Promotional or account credit may be considered later; no current credit ledger is required.

#### 6.2.117 Invoice Future / Optional

Invoice and receipt-document workflows may be added for legal/business need without overbuilding accounting now.

#### 6.2.118 Payment Security

Business never exposes provider credentials or trusts client Payment claims.

#### 6.2.119 Payment Amount Honesty

Displayed amounts derive from authoritative configuration and Order state, not client tampering.

#### 6.2.120 Order Price Snapshot

Order preserves expected commercial price and context despite later catalog changes.

#### 6.2.121 Discount Snapshot

History remains able to explain the real charged amount and applied discount.

#### 6.2.122 Payment Currency

Currency storage and presentation remain implementation-stage design; multi-currency is not invented without need.

#### 6.2.123 Iran Payment Context

Initial design supports Iranian PSP and local Payment realities without binding the domain to one provider.

#### 6.2.124 Provider Callback Security

Callbacks never trust arbitrary browser input; backend verification is mandatory.

#### 6.2.125 Duplicate Callback

Repeated callback or refresh cannot duplicate commercial activation.

#### 6.2.126 User Returns Before Verification

Until backend verification completes, UI shows truthful pending/verifying state rather than active access.

#### 6.2.127 Payment Failure UX

Failed, cancelled, or unverified Payment is represented honestly; retry UX remains open.

#### 6.2.128 Payment Success UX

Success UI reflects authoritative verified state, not success-like redirect values.

#### 6.2.129 Access-Activation Failure

If verification succeeds but activation fails, verified Payment truth is retained for reconciliation.

#### 6.2.130 Payment Reconciliation

Architecture supports authorized reconciliation of Payment/access mismatches; exact tools remain open.

#### 6.2.131 Manual Commercial Correction

Authorized Finance/Admin may correct verified mismatches through attributable workflows without rewriting historical Payment truth.

#### 6.2.132 Provider Transaction Truth

Provider-verification evidence and internal state remain sufficiently traceable for support and reconciliation. Exact raw-data retention remains technical/legal detail.

#### 6.2.133 Payment Audit Boundary

Manual approval, Entitlement override, provider configuration, and future refund may create Section 6.1 Audit evidence.

#### 6.2.134 Normal Payment View ≠ Audit

Ordinary authorized viewing is not necessarily an Audit event.

#### 6.2.135 Commercial Data Privacy

Commercial data is restricted to the relevant User and authorized Finance/Admin or appropriate Organization roles.

#### 6.2.136 School Finance Boundary

School Managers do not automatically see all platform financial data; Organization-facing visibility requires explicit definition.

#### 6.2.137 User Cannot Edit Payment Truth

Users may submit manual evidence but cannot set authoritative Payment status.

#### 6.2.138 Admin Cannot Fabricate PSP Success

A manual correction or override must retain its provenance and cannot masquerade as provider-verified success.

#### 6.2.139 Payment Method Provenance

History preserves PSP, Card-to-Card/manual, or future method provenance where relevant.

#### 6.2.140 Business Analytics

Real operational reporting may cover sales/revenue, active Subscriptions, success/failure, manual backlog, Product performance, and expiry/renewal.

#### 6.2.141 Business Analytics ≠ Accounting

Commercial reporting does not become full accounting software.

#### 6.2.142 Revenue Data Honesty

Revenue, sales, conversion, ARPU, Subscription counts, and success rates are never fabricated.

#### 6.2.143 Failed Fetch ≠ Zero Revenue

Source failure cannot appear as verified zero revenue or Subscriptions.

#### 6.2.144 Business Dashboard

Business may have a commercial operations Dashboard distinct from generic Admin Dashboard. Exact metrics and layout remain open.

#### 6.2.145 Business Dashboard Purpose

Dashboard supports real commercial state, Payment review, Products/Plans, active access, expiry, and trends rather than decorative metrics.

#### 6.2.146 Payment Review Queue

Manual Card-to-Card review appears in an authorized Finance/Admin work queue.

#### 6.2.147 Payment Review Is Not Support Queue

Finance review remains Business truth; Support Tickets may reference issues but do not replace review.

#### 6.2.148 Subscription Management

Authorized roles inspect or manage Subscription state through approved commercial workflows. Exact actions remain open.

#### 6.2.149 User Override Management

Authorized roles manage User overrides without editing the base Plan.

#### 6.2.150 Organization Commercial Management

Authorized roles manage Organization commercial access while School retains membership and educational structure.

#### 6.2.151 Product Entitlement Matrix

Business UI may show Plan Entitlements and limits; exact interface remains open.

#### 6.2.152 Entitlement Catalog Authority

The software-defined catalog is authoritative; Business packages but cannot invent executable Entitlements.

#### 6.2.153 Entitlement Limits

Plans may configure limits such as usage, seats, Organization limits, or export only when underlying software supports them.

#### 6.2.154 Limit Changes

Effects of limit changes on existing active users require explicit commercial and historical policy.

#### 6.2.155 Plan Visibility

Plans may be public, hidden, or inactive through commercial configuration. Exact states remain open.

#### 6.2.156 Public Pricing Source

Public Website Pricing consumes authoritative Business configuration, never duplicate hardcoded truth.

#### 6.2.157 Student Pricing Source

Student purchase and upgrade surfaces consume the same authoritative configuration.

#### 6.2.158 Commercial Presentation vs. Authority

Marketing text does not grant access; authoritative commercial state drives Entitlements.

#### 6.2.159 Product Badge Truth

Badges are configured presentation metadata and cannot imply unsupported popularity.

#### 6.2.160 Manual Free Grant

Authorized override may grant access without Payment, preserving manual-grant provenance rather than fake paid Purchase.

#### 6.2.161 Organization Grant

Organization Entitlements may provide access without personal Payment, with understandable provenance.

#### 6.2.162 Purchased vs. Granted Access

Purchased, Plan, Organization, User override, and trial sources remain distinguishable and are not collapsed into fake Payments.

#### 6.2.163 Cancellation Boundary

Immediate, end-of-period, or renewal-stop cancellation behavior requires explicit policy.

#### 6.2.164 Manual Extension

Authorized roles may extend access through an attributable workflow without fabricating an additional Purchase.

#### 6.2.165 Gift / Transfer Boundary

Gift Subscription and Purchase transfer are not current core.

#### 6.2.166 Family / Multi-User Plan Boundary

Family/shared personal Plans are not current core; Organization access is the approved multi-user model.

#### 6.2.167 Marketplace Boundary

A marketplace for Counselors, Teachers, or third-party sellers is not current scope.

#### 6.2.168 External Seller Boundary

Seller payouts, commissions, settlement, and KYC are not current core.

#### 6.2.169 No Crypto / Wallet Assumption

Crypto, internal wallet, and stored-value balance are not current core.

#### 6.2.170 No Gamified Purchase

Coins, reward currency, purchase XP, and loot/reward mechanics are prohibited.

#### 6.2.171 No Dark Patterns

Fake scarcity, countdowns, discounts, hidden recurring charges, and misleading cancellation language are prohibited.

#### 6.2.172 Discount Honesty

Displayed discounts use real configured values and no fabricated crossed-out price.

#### 6.2.173 Subscription Transparency

Users understand what they buy, duration, price, included access, and relevant renewal behavior. Exact checkout UX remains open.

#### 6.2.174 Payment Confirmation

Purchase context is understandable before Payment; exact confirmation UX remains open.

#### 6.2.175 Product Change History Boundary

Meaningful Product/Plan commercial changes may require traceability. Exact history and Audit design remains open.

#### 6.2.176 Provider Config Change Audit

Sensitive provider configuration changes are attributable and potentially Audited under Section 6.1.

#### 6.2.177 Business Role Separation

Product management, Payment review, provider configuration, overrides, and reporting may be separate Permissions rather than one Finance/Admin role.

#### 6.2.178 No Payment Secret in Logs

Provider secrets never appear in ordinary User-visible logs or Audit plaintext.

#### 6.2.179 Callback / Provider Error Honesty

Provider error cannot appear as verified success.

#### 6.2.180 Payment History Immutability Principle

Historical transaction facts are not silently rewritten; corrections and overrides retain distinct provenance.

#### 6.2.181 Access History Interpretability

The platform should explain why a User held access historically where operationally required. Exact implementation remains technical detail.

#### 6.2.182 Business Data Retention Boundary

Financial retention follows legal and operational requirements, not ordinary Chat or Notification policy.

#### 6.2.183 Payment Delete Boundary

Historical Payments cannot be casually hard-deleted; retention and anonymization require legal/technical design.

#### 6.2.184 Purchase Delete Boundary

Purchase and Subscription history remains traceable where needed for commercial and Support history.

#### 6.2.185 Data Honesty

Never fabricate Products, Plans, prices, discounts, Entitlements, Subscriptions, Payments, references, purchase state, evidence, revenue, expiry, or overrides.

#### 6.2.186 Empty States

Honest states include no Products, Plans, Payments, receipts, Subscription, or Organization access. Fake commercial data is prohibited.

#### 6.2.187 Error States

Product, checkout, provider, verification, activation, review, override, configuration, and reconciliation failures must never appear successful.

#### 6.2.188 Partial Data

If Subscription state fails to load, it cannot be fabricated from Payment alone.

#### 6.2.189 Business Mobile Boundary

Business administration is desktop-first, with suitable mobile review/status access and no unreadable dense tables.

#### 6.2.190 Business Desktop Experience

Desktop may support dense Product, Entitlement, Payment, review, Subscription, provider, override, and reporting workflows. Exact layout remains open.

#### 6.2.191 User Checkout Mobile

Mobile checkout remains clear, transparent, simple, and trustworthy.

#### 6.2.192 Accessibility

Business surfaces preserve RTL, readable price/duration, non-color-only states, accessible forms, clear actions, focus behavior, and mobile controls.

#### 6.2.193 Light / Dark

Canonical themes preserve checkout trust and readability.

#### 6.2.194 Business Notification Reuse

Business uses shared Notifications, not a separate Payment notification engine.

#### 6.2.195 Business Ticket Reuse

Commercial Support uses central Tickets, not a separate Payment-support engine.

#### 6.2.196 Admin Audit Reuse

Sensitive commercial actions reuse Section 6.1 Audit governance.

#### 6.2.197 Public Website Reuse

Public Pricing reads Business configuration without duplicate CMS pricing truth.

#### 6.2.198 Learning Reuse

Learning consumes Business access and has no separate Payment engine.

#### 6.2.199 Question Bank Reuse

Question Bank/Practice consumes Effective Access and has no separate Payment engine.

#### 6.2.200 Exam Reuse

Exam Builder consumes Effective Access and has no separate Payment engine.

#### 6.2.201 School Reuse

School/Organization commerce uses the shared Business engine without duplicate billing architecture.

#### 6.2.202 Business Anti-Drift

Business must not drift into a hardcoded premium Plan, Plan-name authorization, frontend-only Payment state, trusted callbacks, single-provider coupling, Product-per-method duplication, module-specific Entitlements, manual auto-approval, Ticket-based Payment truth, unsupported capability creation, ERP/payroll/accounting, marketplace, wallet/crypto, dark patterns, or rewritten history.

The canonical model is **software-defined capabilities + Products + Plans + Entitlements + Orders/Purchases + Subscriptions + Payments + Payment Methods + provider adapters + backend verification + Card-to-Card review + commercial activation + User/Organization overrides + historical integrity**.

#### 6.2.203 Current vs. Future

**APPROVED FUTURE STATE — CORE BUSINESS DIRECTION**:

- distinct Product, Plan, Entitlement, Subscription, Payment, Order, and Purchase concepts;
- dynamic packaging of existing software capabilities with configurable names, price, discount, duration, active state, display metadata, Entitlements, limits, and customer type;
- capability-based Effective Access, one-time Purchase, time-bounded Subscription, real history, server-controlled activation, and no Plan-name authorization;
- provider-adapter architecture compatible with Iranian PSPs, configurable after adapter implementation, and the closed Order-to-backend-verify-to-activation online flow;
- duplicate-safe callbacks, manual Card-to-Card evidence and Finance/Admin review using WAITING_FOR_RECEIPT, UNDER_REVIEW, APPROVED, and REJECTED concepts;
- attributable User and Organization overrides, B2B Entitlements, historical integrity, shared Notifications, central Tickets, Admin Audit, and Public Website Pricing reuse.

**APPROVED FUTURE STATE — EXTENSIBLE**:

- additional adapters, provider priority/failover, coupons/promotions, richer renewal, upgrade/downgrade/proration, refunds, partial refunds, wallet/credit, invoices, richer B2B limits, advanced reporting, constrained automation, reconciliation tooling, and advanced Subscription lifecycle.

Future capabilities must not be presented as implemented. [PROJECT_STATE.md](PROJECT_STATE.md) remains authoritative for actual availability, and implementation requires a separately approved milestone.

#### 6.2.204 Decision Gates

Closed decisions:

- Product, Plan, Entitlement, Subscription, and Payment remain distinct; Builder packages existing software-defined capabilities and cannot invent new behavior;
- domain authorization uses Entitlements and Effective Access, never Plan names; one-time Purchase and time-bounded Subscription are supported directions;
- provider adapters prevent permanent PSP coupling; an unknown protocol requires developer work, while implemented adapters become authorized configuration;
- secrets remain protected; online Payment flows through Order, provider request, redirect, callback, backend verification, authoritative result, and server-controlled activation;
- frontend/redirect claims and client fields are non-authoritative; unverified failure grants nothing; duplicate callbacks cannot duplicate activation;
- Card-to-Card is supported through evidence, authorized review, and WAITING_FOR_RECEIPT, UNDER_REVIEW, APPROVED, or REJECTED—not auto-approval;
- Product remains independent of Payment Method; overrides require reason, actor, target, time, and provenance; manual grant is not paid Purchase;
- Organization/B2B commerce reuses Business while Section 6.3 owns membership; Public Pricing consumes Business truth; Learning, Question Bank, Practice, and Exam consume Effective Access;
- Ticket resolution and Notifications never change Payment or activate access; historical Product, price, Order, Purchase, Payment, and access meaning remains interpretable;
- payroll, ERP/accounting, marketplace, wallet/crypto, gamification, fake discounts, and dark patterns are not current core;
- backend verification and authorization remain authoritative, and historical Payment truth cannot be silently rewritten.

Remaining implementation-stage choices:

- Product/Plan relationship, Entitlement catalog, limit model, required fields, lifecycle/archive states, and treatment of existing Subscribers after edits;
- Subscription statuses, renewal/cancellation, upgrade/downgrade/proration, one-time permanence, trial, checkout, and Order/Purchase representation;
- provider interface, initial PSP, configuration, priority/failover, reconciliation, manual evidence and rejection reasons;
- override types/expiry, B2B pricing/limits, historical snapshot strategy, reporting metrics, retention, refund, coupon, invoice/legal requirements, responsive layouts, wallet/credit, and future automation.

These choices do not reopen any closed product decision.

### 6.3 School / Institute Workspace

School/Institute Workspace is KonkourX's Organization layer. It combines Organization Membership, scoped Roles/Permissions, Classes/Grades/Groups, and shared platform engines inside an authorized institutional context.

The canonical model is **Organization + Membership + Organization Roles/Permissions + Classes/Grades/Groups + shared Student, Counselor, Planning, Study, Curriculum, Question Bank, Practice, Exam, Learning, Messaging, Notification, Ticket, Classroom, and Business engines → School Workspace**. School is not a second copy of the platform.

#### 6.3.1 Organization

A School or Institute is represented by an Organization, not a giant special User account.

#### 6.3.2 Organization ≠ User

User is human identity; Organization is institutional scope. A School is never encoded as one login or profile.

#### 6.3.3 Membership

Organization Membership records a User's authorized relationship to an Organization.

#### 6.3.4 Membership ≠ Platform Role

Platform Role and Organization Membership/Role remain distinct concepts.

#### 6.3.5 Organization Roles

Conceptual roles include Primary Manager/Owner, Education Manager, Counselor, Teacher, and Student. Exact names and future scoped roles remain implementation-stage design.

#### 6.3.6 Primary Manager

Primary Manager is the Organization-level responsible role where required and receives no platform Super Admin authority.

#### 6.3.7 Education Manager

Education Manager handles authorized Organization educational workflows. Exact Permission matrix remains open.

#### 6.3.8 Organization Counselor

Counselors may belong to Organizations while reusing the shared Counselor engine.

#### 6.3.9 Future / Organization Teacher

Teacher is future/extensible and reuses shared engines; this section does not create a duplicate Teacher platform.

#### 6.3.10 Organization Student

A Student may belong to authorized Organization contexts while retaining one platform identity.

#### 6.3.11 No Duplicate Student Account

Joining a School never requires a duplicate identity for the same Student.

#### 6.3.12 School Reuses Identity

Section 0 owns Identity/Auth; School consumes Membership and scoped access.

#### 6.3.13 Organization Scope

School users operate only inside authorized Organization scope.

#### 6.3.14 Backend Organization Authorization

Server-side authorization enforces isolation; selected Organization UI, hidden controls, client organizationId, or routes are insufficient.

#### 6.3.15 Cross-Organization Isolation

Students, staff, structures, Exams, reports, Tickets, Content, and operations cannot cross Organization boundaries without explicit platform authority.

#### 6.3.16 Platform Admin vs. School Manager

Platform Admin uses Section 6.1 Permissions; School Manager has Organization-scoped authority. They are distinct.

#### 6.3.17 Business vs. School

Business owns commercial access; School owns Membership and educational structure.

#### 6.3.18 Organization Commercial Access

School Products, Plans, and Entitlements come from the shared Section 6.2 Business engine.

#### 6.3.19 No School Billing Engine

Equivalent School commerce never receives a separate billing or Payment architecture.

#### 6.3.20 Organization Entitlements

Organization Entitlements may grant supported capabilities to eligible members. Allocation rules remain open.

#### 6.3.21 School Plan Limits

Supported limits may include Student/staff seats, features, export, or other software-supported limits.

#### 6.3.22 Limit Enforcement

Limits use real capability data, never hardcoded Plan names.

#### 6.3.23 School Dashboard

School Workspace includes an Organization operational Dashboard.

#### 6.3.24 School Dashboard Purpose

Dashboard answers what the School must manage now rather than maximizing generic metrics.

#### 6.3.25 Dashboard Real Data

Real summaries may cover Students, Counselors, structures, Exams, Classroom, Planning/report work, Tickets, and access limits. Exact composition remains open.

#### 6.3.26 No Fake School Analytics

Student counts, results, Attendance, engagement, performance, Counselor state, and Exam statistics are never fabricated.

#### 6.3.27 School Student Management

Authorized School roles manage Organization Students.

#### 6.3.28 Student Membership Management

School may invite/add Students, view Membership, assign groups, activate/deactivate Membership, or remove it. Exact onboarding remains open.

#### 6.3.29 Removing Membership ≠ Deleting User

Removing a Student from an Organization never deletes their platform account.

#### 6.3.30 Organization Membership History

Meaningful Membership history is not silently destroyed where operationally required. Exact retention remains open.

#### 6.3.31 Student Profile Scope

School staff see only Student data required by authorized Organization roles.

#### 6.3.32 Student Password Privacy

School staff can never read Student passwords.

#### 6.3.33 School Account Action Boundary

School staff do not automatically gain platform suspension, password, session, or global Role authority.

#### 6.3.34 Classes

Class is an Organization structure for grouping Students.

#### 6.3.35 Grades

School may organize Students by Grade where educationally appropriate.

#### 6.3.36 Groups

School may use flexible Groups for Organization assignment.

#### 6.3.37 Class / Grade / Group ≠ Curriculum

Organization grouping never redefines canonical Curriculum.

#### 6.3.38 No School Curriculum Taxonomy

All educational topics reuse canonical Curriculum; School-specific hierarchy is prohibited.

#### 6.3.39 Group Membership

Students join Organization structures according to School workflow. Exact rules remain open.

#### 6.3.40 Group History Boundary

Historical Class/Group Membership rules remain implementation-stage design; no deep SIS history is required now.

#### 6.3.41 School Counselor Management

Authorized School management handles Organization Counselor relationships within scope.

#### 6.3.42 School Reuses Counselor Engine

Counselor Dashboard, Student Workspace, Planning, Analytics, Communication, Follow-up, Work, and Capacity reuse Section 3.

#### 6.3.43 No School Counselor Clone

SchoolCounselorTask, SchoolCounselorPlan, SchoolStudentReport, and parallel analytics are prohibited where semantics match.

#### 6.3.44 Counselor Assignment

Authorized Organization workflows may assign Counselors to Students. Exact matrix remains open.

#### 6.3.45 Counselor Scope

Organization Counselors see only Students they are authorized to counsel; Membership alone grants no all-Student access.

#### 6.3.46 Counselor Capacity Reuse

School reuses Section 3.6 Capacity concepts.

#### 6.3.47 Counselor Workload Reuse

Authorized management may view scoped operational workload evidence without automatic quality scoring.

#### 6.3.48 No Counselor Ranking

Counselor leaderboards, automated good/bad scores, and employment ranking are prohibited.

#### 6.3.49 School Planning

School and Counselor workflows reuse shared Planning.

#### 6.3.50 No School Planning Engine

A parallel School Planning source of truth is prohibited.

#### 6.3.51 School Study Data

Authorized staff may inspect scoped Study evidence; Section 2.3 remains authoritative.

#### 6.3.52 School Student Analytics

Authorized roles may view Organization-scoped Student analytics under Permissions.

#### 6.3.53 Analytics Reuses Shared Evidence

School Analytics derives from Planning, Study, Practice, Exam, Curriculum, and Counselor truth.

#### 6.3.54 No Parallel School Analytics Truth

School does not create duplicate Student-performance records.

#### 6.3.55 School Aggregates

Authorized real aggregates may cover execution, Exams, Curriculum coverage, workload, and Class/Group summaries.

#### 6.3.56 Aggregate ≠ Ranking

Aggregate reporting does not authorize Student, Counselor, or Class leaderboards.

#### 6.3.57 School Student Ranking Boundary

Peer, Class, or national ranking requires separate approval and valid methodology.

#### 6.3.58 School Question Bank Reuse

School uses the central Question Bank.

#### 6.3.59 No School Question Bank

Duplicate Organization Question repositories are prohibited for central Question semantics.

#### 6.3.60 School Question Access

Question use depends on Organization Entitlements, Role/Permission, and publication state.

#### 6.3.61 School Question Authoring Boundary

School Membership does not automatically grant Question Reviewer or Publisher authority.

#### 6.3.62 School Exam Engine

School Exams reuse Section 4.3.

#### 6.3.63 No School Exam Engine

A separate School Exam system is prohibited.

#### 6.3.64 School Exam Creation

Authorized staff may create Organization Exams using central Questions and shared Exam Definitions.

#### 6.3.65 School Exam Audience

Approved audiences may include selected Students, Class, Grade, or Group within scope.

#### 6.3.66 Exam Online / Printable

School may use Online, Printable, or Both through the shared Exam engine.

#### 6.3.67 School Printable PDF

School is an important printable Exam consumer under Section 4.3; PDF never creates separate Question truth.

#### 6.3.68 Future A/B/C

Printable A/B/C variants remain future/extensible under Exam scope.

#### 6.3.69 Future Answer Sheet

Answer-sheet generation remains future/extensible.

#### 6.3.70 School Exam History

School UI cannot rewrite historical Attempts; shared Exam history remains authoritative.

#### 6.3.71 School Practice Reuse

Future School Practice workflows reuse shared Practice.

#### 6.3.72 No School Practice Engine

Parallel Practice semantics are prohibited.

#### 6.3.73 Learning Content Reuse

School uses shared Learning Content.

#### 6.3.74 Organization Content Access

Organization Entitlements may provide Learning Content to eligible members.

#### 6.3.75 Organization-Scoped Content

Approved future School Content may be Organization-scoped using shared Content concepts.

#### 6.3.76 No School Content Repository

A duplicate School Resource engine is prohibited.

#### 6.3.77 School Content Management Authority

School staff Content creation/edit/publication authority remains a Decision Gate and never implies platform publication.

#### 6.3.78 Commercial Content Authority

School Content staff do not control platform commerce; Section 6.2 remains authoritative.

#### 6.3.79 Classroom Reuse

School uses the shared Classroom Event engine.

#### 6.3.80 No School Classroom Engine

A separate School Classroom architecture is prohibited.

#### 6.3.81 Classroom Audience

Authorized events may target Class, Grade, Group, or selected Students within Organization scope.

#### 6.3.82 Classroom Current Scope

School retains Section 5.4 lightweight title, host, time, audience, external URL, and Join scope.

#### 6.3.83 Attendance Boundary

Classroom creates no Attendance engine: Audience ≠ Attendance and Join click ≠ Attendance.

#### 6.3.84 Future School Attendance

Future Attendance needs separately approved authoritative evidence and cannot use weak external-link proxies.

#### 6.3.85 Messaging Reuse

School-related direct Messaging reuses Section 5.1 where relationships permit.

#### 6.3.86 No School Messaging Engine

A duplicate School Chat system is prohibited.

#### 6.3.87 School Staff Messaging Boundary

School staff do not automatically gain DM access to every Student.

#### 6.3.88 Future Teacher Messaging

Future Teacher Messaging reuses Section 5.1.

#### 6.3.89 Notification Reuse

School uses shared Notifications.

#### 6.3.90 No School Notification Engine

Duplicate Organization notification infrastructure is prohibited.

#### 6.3.91 School Announcements

Authorized Organization announcements may use shared Broadcast under scoped Permissions. Exact authority remains open.

#### 6.3.92 Ticket Reuse

School Support uses central Tickets.

#### 6.3.93 No School Ticket Engine

A separate Organization Ticket platform is prohibited.

#### 6.3.94 School Support Tickets

Organization-related Tickets may carry Organization context.

#### 6.3.95 School Ticket Scope

School staff access only authorized Organization-scoped Tickets.

#### 6.3.96 Platform Sensitive Tickets

School Role does not grant unrelated complaints, Finance, other-Organization, or account/security cases.

#### 6.3.97 School Administration

Permissioned UI may manage Organization profile, staff, Students, structures, Counselor assignments, Exams, Classroom, Content access, Tickets, reports, and limits.

#### 6.3.98 Organization Profile

Organization may have basic institutional metadata without becoming a public social profile.

#### 6.3.99 Staff Management

Authorized School management may invite and manage Organization staff.

#### 6.3.100 Staff Platform Identity

Staff are platform Users with Membership, not users of a separate School authentication system.

#### 6.3.101 Staff Role Assignment

Authorized School management may assign supported Organization Roles within bounds.

#### 6.3.102 Cannot Grant Platform Super Admin

School Manager cannot grant platform Admin or Super Admin authority.

#### 6.3.103 Organization Role Catalog

Organization Roles package supported Organization Permissions; exact matrix remains open.

#### 6.3.104 Organization Role ≠ Platform Permission Creation

School cannot create new executable capabilities.

#### 6.3.105 Staff Removal

Staff removal revokes Organization Membership/access without deleting platform identity.

#### 6.3.106 School Audit Boundary

Meaningful staff Role, Student Membership, Counselor assignment, Exam, or sensitive setting changes may need traceability. Exact model remains open.

#### 6.3.107 School Audit ≠ Every Click

Page views, filters, tabs, refreshes, and mouse activity are not School Audit.

#### 6.3.108 Platform Audit Reuse

Meaningful actions reuse shared Audit/governance principles rather than surveillance logs.

#### 6.3.109 School Reporting

Authorized School managers may access Organization reporting.

#### 6.3.110 Reporting Sources

Reporting derives from shared Student/Planning, Study, Practice, Exam, Curriculum, Counselor, Classroom, Membership, and Ticket sources.

#### 6.3.111 Reporting Data Honesty

Source failure never becomes fake zero.

#### 6.3.112 School PDF Export

School may have PDF/export capability when entitled, such as school.pdf_export.

#### 6.3.113 Export Is Permission + Entitlement Controlled

Export depends on Organization Permission, Entitlement, and scope rather than Plan name.

#### 6.3.114 Export Data Scope

Exports contain only authorized Organization data.

#### 6.3.115 No Unrestricted Mass Export

School receives no automatic export of all platform or User data. Exact export types remain open.

#### 6.3.116 School Analytics ≠ BI Platform

Reporting answers real educational and operational questions rather than becoming generic BI.

#### 6.3.117 School Analytics ≠ Employee Surveillance

Teacher clicks, Counselor actions, time online, and keystrokes are not School analytics.

#### 6.3.118 Student Privacy

Student access is Organization-scoped, Permission-scoped, and educationally or operationally justified.

#### 6.3.119 Private Counselor Chat

School Manager does not automatically access private Student/Counselor Chat.

#### 6.3.120 Private Counselor Notes

School Manager does not automatically access Counselor Private Notes; exceptional access requires separate governance.

#### 6.3.121 Student Tickets

School Manager does not automatically see all Student Tickets; access follows Queue, category, Organization, and Permission.

#### 6.3.122 Payment Privacy

School staff do not automatically see personal Student Payment history; Organization commerce and personal finance remain distinct.

#### 6.3.123 Platform Account Security

School staff receive no passwords, auth secrets, security tokens, or unrestricted session management.

#### 6.3.124 School Break-Glass Boundary

Organization managers receive no platform Break-Glass authority; Sections 0 and 6.1 remain authoritative.

#### 6.3.125 School Application / Onboarding

School may enter through application/onboarding reviewed by platform Admin. Exact states and fields remain open.

#### 6.3.126 Organization Activation

Production Organization privileges require platform-authorized activation; applicants cannot self-grant them.

#### 6.3.127 Primary Manager Assignment

Activation may require authorized Primary Manager assignment. Exact mechanics remain open.

#### 6.3.128 Organization Suspension Boundary

Organization suspension/inactive behavior remains open and requires platform-level authority.

#### 6.3.129 Organization Delete Boundary

Organizations with historical Students, Exams, Memberships, Tickets, Purchases, and reports cannot be casually hard-deleted.

#### 6.3.130 Membership Invitation Boundary

Invitation methods remain open and reuse platform Identity/Auth.

#### 6.3.131 Bulk Student Import Future / Optional

Bulk onboarding remains future/extensible unless separately scheduled.

#### 6.3.132 CSV / File Import Boundary

Exact format remains open; imports preserve Identity matching and avoid duplicates.

#### 6.3.133 No Duplicate Identities from Import

Bulk import must not casually duplicate existing platform Users. Conflict handling remains open.

#### 6.3.134 School Self-Service Boundary

Self-service management stays within Product limits, platform Roles, commercial rights, and Organization scope.

#### 6.3.135 Organization Settings

School may configure approved operational preferences; unrestricted white-labeling is not implied.

#### 6.3.136 School Branding Boundary

Limited future branding may include logo, name, or printable Exam header. Exact scope requires approval.

#### 6.3.137 No Full White-Label Currently

Custom app, domain, theme engine, feature fork, and separate codebase are not current core.

#### 6.3.138 School Domain / Subdomain Future

Organization-specific domains may be considered later and are not current core.

#### 6.3.139 School Classroom External-First

School follows Section 5.4 external-first Classroom and does not trigger internal video development.

#### 6.3.140 School Content / Classroom / Exam Integration

School connects shared Content, Classroom, Exam, Practice, and Student groups through references rather than duplicate records.

#### 6.3.141 School Educational Calendar

Calendar may present relevant Organization events while underlying domains remain authoritative.

#### 6.3.142 No Duplicate School Calendar Truth

School Calendar cannot diverge from Classroom, Exam, Session, or other event truth.

#### 6.3.143 School Notification Broadcast

Future authorized School announcements use shared Notification/Broadcast. Exact Permission remains open.

#### 6.3.144 School Broadcast ≠ Messaging

An Organization announcement does not create direct-message threads with every Student.

#### 6.3.145 School Support

School may create or manage authorized Organization support Tickets through the central engine.

#### 6.3.146 Platform Support vs. School Internal Operations

Not every internal issue is a platform Ticket, and no second generic Ticket engine is created.

#### 6.3.147 School User Search

School may search only authorized Organization members.

#### 6.3.148 No Global User Directory

Member search cannot expose a global platform User directory.

#### 6.3.149 School Student Transfer Boundary

Cross-Organization Student transfer is not defined here and requires explicit future workflow.

#### 6.3.150 Multi-Organization Membership

Architecture does not assume one Organization forever; exact allowed combinations remain a Decision Gate.

#### 6.3.151 School Ownership / Tenancy Principle

Organization scope behaves as strong logical tenancy without cross-Organization leakage.

#### 6.3.152 Tenancy ≠ Separate Database Requirement

Isolation is required, but one database per School is not a product requirement.

#### 6.3.153 School Source-of-Truth Principle

School is an Organization view and control layer, not duplicate shared-domain truth.

#### 6.3.154 Shared Engine Principle

School reuses Identity, Student, Counselor, Planning, Study, Curriculum, Question Bank, Practice, Exam, Learning, Messaging, Notifications, Tickets, Classroom, and Business/Entitlements.

#### 6.3.155 No School-Specific Domain Clones

SchoolStudent, SchoolTask, SchoolStudy, SchoolQuestion, SchoolExamAttempt, SchoolResource, SchoolMessage, and SchoolNotification clones are prohibited where canonical identity applies.

#### 6.3.156 Data Honesty

Never fabricate Membership, Classes, Users, assignments, Exam results, Curriculum progress, Entitlements, Classroom, Tickets, or reports.

#### 6.3.157 Failed Fetch ≠ Zero

Failed Exam analytics is not zero performance, and failed Student loading is not zero Students.

#### 6.3.158 Partial Data

Dashboard supports honest loading, partial, failure, and retry states across source domains.

#### 6.3.159 Empty States

Honest states include no Students, staff, Classes, Counselors, Exams, Classroom Events, or Tickets.

#### 6.3.160 School Mobile Boundary

School management is desktop-first with suitable mobile access and no unusable compressed management grids.

#### 6.3.161 School Desktop Experience

Desktop may be denser while remaining scoped, Permission-aware, readable, and action-oriented.

#### 6.3.162 School Navigation Visibility

Navigation reflects Organization Permissions as UX; backend authority remains binding.

#### 6.3.163 RTL

School preserves canonical RTL layout.

#### 6.3.164 Light / Dark

School supports canonical Light/Dark themes.

#### 6.3.165 Accessibility

School surfaces preserve keyboard/focus, readable lists, non-color-only states, accessible forms, touch controls, and RTL.

#### 6.3.166 School Design System

School reuses the canonical Design System rather than creating a separate identity without approved branding capability.

#### 6.3.167 No Full School ERP

Payroll, HR, accounting, inventory, cafeteria, transportation, tuition accounting, admissions CRM, and physical Attendance hardware are not current scope.

#### 6.3.168 No SIS Overbuild

Current School direction does not require a comprehensive SIS; focus remains KonkourX educational workflows.

#### 6.3.169 No Employee Surveillance

Staff screen, keystroke, every-click, and time-online monitoring are prohibited.

#### 6.3.170 No Student Surveillance

School access uses existing educational evidence and does not become invasive surveillance.

#### 6.3.171 No Automatic Counselor Quality Score

Section 3.6 remains authoritative; automatic Counselor scoring is prohibited.

#### 6.3.172 No Teacher Quality Score

Future Teacher data cannot automatically create employment ranking or hidden quality grades.

#### 6.3.173 No Student Behavior Score

Discipline, motivation, engagement, and intelligence scores are prohibited.

#### 6.3.174 No Leaderboards by Default

Student, Counselor, Teacher, and Class leaderboards require separate Product Owner approval.

#### 6.3.175 No Automatic Discipline

Opaque metrics cannot suspend Students, remove Counselors, change Roles, punish users, or change Class Membership.

#### 6.3.176 AI School Assistance Future

Future AI may assist authorized aggregate, Exam, Planning, operational, report, or drafting workflows. It remains future/extensible.

#### 6.3.177 AI Authority Boundary

AI cannot autonomously add/remove members, assign Counselors, change Roles, publish Exams, grant Entitlements, change limits, suspend users, or send sensitive announcements.

#### 6.3.178 AI Data-Honesty Boundary

AI cannot fabricate Attendance, Exam outcomes, Student progress, Counselor performance, Class state, Membership, or Entitlement state.

#### 6.3.179 School Analytics Future

Future analytics remains evidence-based, source-derived, privacy-aware, and non-ranking unless separately approved.

#### 6.3.180 Class / Group Comparison Boundary

Comparison requires explicit methodology and appropriate data; simplistic averages cannot create quality ranking.

#### 6.3.181 School Report Export Future

Richer report templates may be added under Permission and Entitlement controls.

#### 6.3.182 Future Bulk Operations

Student import, Class/Group assignment, and Exam assignment require explicit Permission and safety design.

#### 6.3.183 No Unrestricted Bulk Mutation

Bulk tools do not authorize mass deletion, platform suspension, Entitlement change, or Role escalation.

#### 6.3.184 Organization Architecture Anti-Drift

School must not drift into a giant User, duplicate identities or engines, separate Curriculum or billing, unrestricted School Manager access, full ERP/SIS, surveillance, behavior scoring, ranking, or autonomous AI management.

The canonical model is **Organization + Membership + Organization Roles/Permissions + Students + staff + Classes/Grades/Groups + Counselor assignments + shared educational and communication engines + shared Business/Entitlements + Organization-scoped reporting**.

#### 6.3.185 Current vs. Future

**APPROVED FUTURE STATE — CORE SCHOOL DIRECTION**:

- Organization, Membership, scoped Roles/Permissions, Primary Manager, Education Manager, Counselor, Student, and future Teacher compatibility;
- Student/staff management, Classes, Grades, Groups, Counselor assignment, Dashboard, reporting, commercial limits, and entitled PDF/export;
- reuse of Planning, Study, Curriculum, Question Bank, Practice, Exam including Online/Printable, Learning Content, Messaging, Notifications, Tickets, Classroom, and Business/Entitlements;
- backend tenant isolation, privacy-scoped access, and no duplicate domain engines.

**APPROVED FUTURE STATE — EXTENSIBLE**:

- richer Teacher workflows and Organization analytics, bulk onboarding and assignments, richer Exam assignment and exports, limited branding, external Calendar, future Attendance/internal Classroom capabilities, Organization Content workflows, additional Roles, and AI-assisted summaries/reports.

Future capabilities must not be presented as implemented. [PROJECT_STATE.md](PROJECT_STATE.md) remains authoritative for actual availability, and implementation requires a separately approved milestone.

#### 6.3.186 Decision Gates

Closed decisions:

- School is an Organization layer, not a giant User; shared platform Identity persists, and Membership remains distinct from platform Role;
- Platform Admin differs from School Manager; Business differs from School; Organization commerce and Entitlements reuse Section 6.2 without separate billing or Plan-name enforcement;
- School manages scoped members and structures, while Membership removal never deletes a platform User and Class/Grade/Group never redefine Curriculum;
- School reuses Counselor, Planning, Study, Analytics evidence, Question Bank, Practice, Exam, Learning Content, Classroom, Messaging, Notifications, Tickets, Business, and canonical Curriculum without domain clones;
- School Exams use shared Online/Printable/Both behavior; future A/B/C and answer sheets remain Exam extensions; historical Attempts cannot be rewritten;
- Audience and Join do not prove Attendance; School staff cannot DM every Student automatically; Organization support and search remain scoped;
- staff remain platform Users; School Manager cannot grant platform Admin/Super Admin or create executable Permissions;
- reporting derives from source domains; PDF/export requires Permission, Entitlement, and scope; failed data never becomes fake zero;
- School Manager does not automatically access private Chat, Private Notes, Student Tickets, personal Payments, account secrets, or platform Break-Glass;
- Organization activation is platform-authorized; imports cannot casually duplicate identities; full white-label, ERP, and SIS are not current core;
- surveillance, behavior scoring, automatic quality scoring, default leaderboards, automatic discipline, and autonomous AI management are prohibited;
- backend Organization isolation and shared-engine reuse are authoritative.

Remaining implementation-stage choices:

- Organization fields/lifecycle, Role/Permission matrix, Primary Manager semantics, invitations, Membership state, and multi-Organization rules;
- Class/Grade/Group model and Membership, Counselor assignment, Dashboard, Student visibility, analytics, reporting filters, and PDF/export types;
- commercial limits, Exam assignment UX, Question-authoring and Organization Content authority, Broadcast and Ticket visibility, and Audit events;
- bulk import and identity conflicts, Organization suspension/archive, limited branding, responsive layouts, future Attendance, Teacher workflows, analytics, and AI assistance.

These choices do not reopen any closed product decision.

## Curriculum Boundary

`cori.docx` remains the educational source of truth under [CURRICULUM_SOURCE_OF_TRUTH.md](CURRICULUM_SOURCE_OF_TRUTH.md). Do not normalize, rewrite, flatten, correct, or invent educational nodes.

Curriculum is a shared reference/map for Planning, Progress, Question Bank, Exams/analysis, and Learning Content. It is not an educational knowledge graph, scientific approval engine, or content-generation governance system.

The canonical Student-facing Curriculum route is `/curriculum`, labeled `مباحث درسی`. It is a browse-only official Curriculum explorer for navigation, search, expand/collapse, hierarchy, and breadcrumb/path context. It is not a Task Picker and contains no selection tray, save-to-Task action, single/multiple selection switch, or `EXACT`/`WHOLE` scope language. Curriculum selection exists only inside authorized `STUDY` Task create/edit flows.

`/study` and personal Subject/Topic authoring are legacy compatibility only. Future primary navigation removes that duplicate destination while preserving historical data and compatible backend behavior safely. The final official-Curriculum navigation has one `مباحث درسی` destination.

## Visual and Experience Boundary

Only Product Owner-approved references for a specific surface are that surface's visual source of truth. Historical images must not be applied indiscriminately across surfaces.

- Student: calmer, simpler, action-first;
- Counselor and Admin: denser, operational, data/action oriented;
- Persian/RTL first;
- desktop applications use a right-side sidebar;
- mobile uses a hamburger and right-side drawer;
- no main bottom navigation;
- light and dark modes;
- no fake analytics.

Detailed visual rules live in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

The current planning/profile/curriculum/assessment interaction surfaces are classified as follows:

| Classification | Surface |
|---|---|
| KEEP + POLISH | App Shell, Sidebar structure, Header structure, Weekly Planning, core Task lifecycle semantics |
| REDESIGN | Today Planning Task presentation, Curriculum Picker, Profile Center |
| SIMPLIFY HEAVILY | `/curriculum` as the browse-only explorer above |
| RETIRE FROM PRIMARY UI | `/study` personal Subject/Topic authoring |
| REWRITE LATER | Assessment UX |

An implementation milestone must not treat a RETIRE or REWRITE item as polish-only work.

## Future / Extensible Capabilities

The following remain in the approved product vision but are not current implementation authorization unless [ROADMAP.md](ROADMAP.md) explicitly schedules them:

- internal Live Classroom/WebRTC;
- internal video hosting/platform;
- rich recorded-course playback/progress;
- deep LMS;
- advanced gamification;
- advanced intelligent recommendations;
- School live-class infrastructure;
- advanced automation;
- advanced Counselor productivity tooling.

## Genuine Remaining Decision Gates

The following product choices remain open until their affected milestone:

- exact enforced retention periods for messages and attachments;
- exact post-exam analysis release rules;
- detailed permission matrices and sensitive-access procedures for each operational role;
- detailed scope and provider choice for a future internal Classroom/video platform;
- detailed deep-LMS, advanced gamification, intelligent-recommendation, and advanced-automation behavior.

The following are no longer open gates: recursive-subtree persistence architecture, Question ↔ Curriculum cardinality, current external-link Classroom direction, the School organizational-layer model, separation of Product/Plan/Entitlement/Subscription/Payment, provider-abstracted payments, and manual Card-to-Card review.

## Anti-Drift Principles

- Product behavior changes belong in this map through an explicit Product Owner decision.
- [ROADMAP.md](ROADMAP.md) may reorder delivery but may not silently redefine the product.
- [PROJECT_STATE.md](PROJECT_STATE.md) records implemented reality and must not become a future wishlist.
- Supporting and historical documents may add context but may not override this map.
- A capability being future/extensible does not remove it from the product vision.
- Product vision does not authorize implementation; every implementation requires a scoped milestone.
