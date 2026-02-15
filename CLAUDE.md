# LOKALNO Frontend - Development Guidelines

This file provides guidance to Claude Code when working with the frontend codebase.

## Tech Stack

- **Framework**: Angular 21 (standalone components, no NgModules)
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: SCSS with variables/mixins
- **Testing**: Jest + Angular Testing Library (@angular-builders/jest)
- **Build**: @angular/build (esbuild-based)
- **PWA**: @angular/pwa with Service Worker

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images (does not work for inline base64 images)

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of `@Input()` / `@Output()` decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available
- Do not write arrow functions in templates (they are not supported)

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Accessibility Requirements

- It MUST pass all AXE checks
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes

## Authentication Architecture (Secure)

### How It Works
- **Access token**: 15-minute JWT, stored ONLY in memory (Angular signal). Never in localStorage/sessionStorage.
- **Refresh token**: HttpOnly cookie set by backend. JavaScript cannot access it.
- **On app startup**: Silent refresh attempt via `POST /auth/refresh` (browser sends cookie automatically)
- **On 401**: Auth interceptor calls refresh, retries the failed request with new token
- **Logout**: `POST /auth/logout` clears the cookie server-side

### Key Rules
- Always use `withCredentials: true` for auth endpoints (`/auth/*`)
- Never store tokens in localStorage, sessionStorage, or cookies via JavaScript
- Access token lives in `AuthService` signal - lost on page refresh (recovered via silent refresh)
- The `StorageService` is NOT used for tokens

### Auth Flow
```
App Init → POST /auth/refresh (cookie) → Get accessToken → Store in signal
Login → POST /auth/login → Backend sets cookie + returns accessToken → Store in signal
API Call → Interceptor adds Bearer header from signal
401 Error → Interceptor calls /auth/refresh → Retry with new token
Logout → POST /auth/logout → Clear signal → Navigate to /auth/login
```

## Testing

- Use Angular Testing Library
- Each server call needs to be mocked
- Isolate tests: Ensure each test runs independently. Use beforeEach and afterEach hooks wisely.
- Prioritize testing public APIs/user behavior: test how users interact with the DOM (button clicks, input changes) rather than calling private methods
- Mock services and API calls: Avoid real network requests. Use mocks for async operations with predictable test data.
- Structure tests logically: Place `*.spec.ts` files alongside the code they test. Use nested describe blocks.
- Aim for quality over 90% coverage: Focus on critical business logic, not simple visual code

## Brand & Styling

- **Primary**: `#20B2AA` (Tirkizna)
- **Secondary**: `#FF8C42` (Narandžasta)
- **Text**: `#2c3e50`, **Background**: `#f5f7fa`
- **Fonts**: Poppins (headings), Inter (body)
- **SCSS variables**: `src/styles/_variables.scss`
- **Logo files**: `src/assets/logos/` (6 SVG variants)

## Project Structure

```
src/app/
├── core/                    # Singleton services, guards, interceptors, models
│   ├── models/             # TypeScript interfaces matching backend DTOs
│   ├── services/           # AuthService, ToastService
│   ├── interceptors/       # authInterceptor, errorInterceptor
│   └── guards/             # authGuard, businessGuard, adminGuard
├── shared/                  # Reusable UI components, pipes, directives
│   ├── components/         # Header, BottomNav, Spinner, EmptyState, etc.
│   └── pipes/              # DistancePipe, TimeAgoPipe, DiscountLabelPipe
├── features/                # Feature modules (lazy loaded)
│   ├── auth/               # Login, Register
│   ├── home/               # Discount feed, search, filters
│   ├── discount-detail/    # Full discount view + claim coupon
│   ├── coupons/            # My coupons list
│   ├── profile/            # Profile, favorites, saved discounts
│   ├── business/           # Dashboard, discount CRUD, verify coupon
│   └── admin/              # Pending businesses, manage
└── layouts/                 # UserLayout, BusinessLayout, AdminLayout
```

## Backend API

Backend runs at `http://localhost:3000` (dev). See `src/environments/environment.ts`.

All API models are defined in `src/app/core/models/` matching the backend DTOs exactly.
