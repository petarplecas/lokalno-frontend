import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { businessGuard } from './core/guards/business.guard';
import { adminGuard } from './core/guards/admin.guard';
import { UserLayout } from './layouts/user-layout/user-layout';
import { BusinessLayout } from './layouts/business-layout/business-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Auth routes (no layout)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.Register),
      },
    ],
  },

  // Business registration (no layout, public)
  {
    path: 'business/register',
    loadComponent: () =>
      import('./features/business/register/business-register').then(
        (m) => m.BusinessRegister,
      ),
  },

  // User routes (with UserLayout)
  {
    path: '',
    component: UserLayout,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'discounts/:id',
        loadComponent: () =>
          import('./features/discount-detail/discount-detail').then(
            (m) => m.DiscountDetail,
          ),
      },
      {
        path: 'coupons',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/coupons/coupons').then((m) => m.Coupons),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'profile/edit',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/edit-profile/edit-profile').then(
            (m) => m.EditProfile,
          ),
      },
      {
        path: 'profile/password',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/change-password/change-password').then(
            (m) => m.ChangePassword,
          ),
      },
      {
        path: 'profile/favorites',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/favorites/favorites').then(
            (m) => m.Favorites,
          ),
      },
      {
        path: 'profile/saved',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/saved-discounts/saved-discounts').then(
            (m) => m.SavedDiscounts,
          ),
      },
    ],
  },

  // Business routes (with BusinessLayout)
  {
    path: 'business',
    component: BusinessLayout,
    canActivate: [businessGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/business/dashboard/dashboard').then(
            (m) => m.Dashboard,
          ),
      },
      {
        path: 'discounts/create',
        loadComponent: () =>
          import('./features/business/create-discount/create-discount').then(
            (m) => m.CreateDiscount,
          ),
      },
      {
        path: 'verify-coupon',
        loadComponent: () =>
          import('./features/business/verify-coupon/verify-coupon').then(
            (m) => m.VerifyCoupon,
          ),
      },
    ],
  },

  // Admin routes (with AdminLayout)
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'businesses',
        pathMatch: 'full',
      },
      {
        path: 'businesses',
        loadComponent: () =>
          import(
            './features/admin/pending-businesses/pending-businesses'
          ).then((m) => m.PendingBusinesses),
      },
      {
        path: 'businesses/:id',
        loadComponent: () =>
          import('./features/admin/business-review/business-review').then(
            (m) => m.BusinessReview,
          ),
      },
    ],
  },
];
