# User Flow Documentation

This document outlines how users navigate through the DSA Grinders application during authentication and onboarding.

---

## 🆕 NEW USER FLOW

### Step 1: Landing Page (`/`)
- **State:** No authentication session
- **UI:** Shows landing page with "Sign in with Google" button
- **Action:** User clicks "Sign in with Google"

### Step 2: Google OAuth
- Redirects to Google sign-in page
- User authenticates with Google account
- Supabase handles OAuth flow

### Step 3: Auth Callback (`/auth/callback`)
- **What happens:**
  1. Receives session from Supabase
  2. Calls `/api/auth/sync` with access token
  3. Backend creates new user in database:
     ```js
     {
       name: "User Name",
       email: "user@example.com",
       leetcodeUsername: "pending_xxx", // temporary
       github: "pending",               // temporary
       role: "user",
       isProfileIncomplete: true
     }
     ```
  4. Returns user object with `isProfileIncomplete: true`
  5. **Redirects to `/onboarding`** ✅

### Step 4: Onboarding Page (`/onboarding`)
- **State:** Logged in, profile incomplete
- **UI:** Full-page form requesting:
  - LeetCode username
  - GitHub username
  - LinkedIn handle
  - WhatsApp number (with country code)
- **Action:** User fills form and clicks "Start Grinding"
- **What happens:**
  1. Validates LeetCode username format
  2. Validates WhatsApp number format
  3. Calls `/api/users/profile` (PUT) to update user
  4. Backend updates user with real data
  5. Returns `isProfileIncomplete: false`
  6. **Redirects to `/home`** ✅

### Step 5: Home Page (`/home`)
- **State:** Logged in, profile complete
- **UI:** Full dashboard with leaderboards, groups, stats
- User can now access all features

---

## 👤 EXISTING USER FLOW (Complete Profile)

### Step 1: Landing Page (`/`)
- **State:** Existing Supabase session in browser
- **What happens in background:**
  1. AuthContext initializes on page load
  2. Retrieves existing session from Supabase
  3. Calls `/api/auth/sync` with token
  4. Backend finds existing user in database
  5. User has complete profile (LeetCode, GitHub, LinkedIn, phone all set)
  6. Returns `isProfileIncomplete: false`
  7. AuthContext sets user state
- **Landing page useEffect detects user:**
  - Checks `user.isProfileIncomplete === false`
  - **Redirects to `/home`** ✅

### Step 2: Home Page (`/home`)
- **State:** Logged in, profile complete
- User lands directly on dashboard
- Full access to all features

---

## 🔁 EXISTING USER FLOW (Incomplete Profile)

If an existing user somehow has an incomplete profile:

### Step 1: Landing Page (`/`)
- AuthContext detects user with `isProfileIncomplete: true`
- **Redirects to `/onboarding`** ✅

### Step 2: Onboarding Page (`/onboarding`)
- User completes profile
- **Redirects to `/home`** ✅

---

## 🔒 ROUTE PROTECTION

### Protection Against Direct Navigation

#### User with incomplete profile tries `/home`
- **File:** [`src/app/home/page.tsx`](src/app/home/page.tsx#L30-L34)
- **Logic:** 
  ```tsx
  useEffect(() => {
    if (!authLoading && user?.isProfileIncomplete) {
      router.push('/onboarding');
    }
  }, [user, authLoading, router]);
  ```
- **Result:** Redirects to `/onboarding`

#### User with complete profile tries `/onboarding`
- **File:** [`src/app/onboarding/page.tsx`](src/app/onboarding/page.tsx#L39-L47)
- **Logic:**
  ```tsx
  useEffect(() => {
    if (!isLoading && user && !user.isProfileIncomplete) {
      router.push('/home');
    }
  }, [user, isLoading, router]);
  ```
- **Result:** Redirects to `/home`

#### Unauthenticated user tries `/home` or `/onboarding`
- **File:** [`src/app/onboarding/page.tsx`](src/app/onboarding/page.tsx#L44-L46)
- **Logic:**
  ```tsx
  if (!isLoading && !user) {
    router.push('/');
  }
  ```
- **Result:** Redirects to landing page

---

## 🔑 KEY COMPONENTS

### `isProfileIncomplete` Flag
- **Calculated in:** [`src/lib/auth.ts`](src/lib/auth.ts#L53-L64)
- **Logic:**
  ```ts
  function isProfileIncomplete(user) {
    if (!user) return true;
    return (
      !user.leetcodeUsername ||
      user.leetcodeUsername.startsWith('pending_') ||
      !user.github ||
      user.github === 'pending' ||
      !user.phoneNumber ||
      !user.linkedin
    );
  }
  ```

### AuthContext Smart Routing
- **File:** [`src/components/AuthContext.tsx`](src/components/AuthContext.tsx#L90-L97)
- **Prevents redirect loops:**
  - Checks current pathname before redirecting
  - Skips redirect if already on `/onboarding`, `/home`, or `/auth/callback`
  - Only redirects from landing (`/`) or login pages

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        LANDING PAGE (/)                      │
│                                                              │
│  Not Logged In          │          Logged In                │
│       ↓                 │                ↓                   │
│  Show Landing           │    Profile Incomplete?            │
│                         │         ↙            ↘             │
│                         │       YES            NO            │
│                         │        ↓              ↓            │
│                         │   /onboarding     /home            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GOOGLE SIGN-IN FLOW                       │
│                                                              │
│  Landing → Google OAuth → /auth/callback                     │
│                                ↓                             │
│                        Create/Fetch User                     │
│                                ↓                             │
│                    Profile Incomplete?                       │
│                     ↙              ↘                          │
│                   YES              NO                        │
│                    ↓                ↓                         │
│              /onboarding         /home                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    ONBOARDING PAGE                           │
│                                                              │
│  Fill form → Submit → Update Profile → /home                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐛 Common Issues & Solutions

### Issue: User stuck in redirect loop
**Cause:** Multiple redirects firing simultaneously  
**Solution:** AuthContext checks pathname before redirecting (lines 90-97)

### Issue: Modal popup instead of onboarding page
**Cause:** Old `OnboardingModal` component was in layout  
**Solution:** Removed modal, created dedicated `/onboarding` page

### Issue: Direct `/home` access with incomplete profile
**Cause:** Missing protection in home page  
**Solution:** Added useEffect hook to redirect incomplete profiles

---

## 📝 Testing Checklist

- [ ] New user signs in → lands on onboarding page
- [ ] Complete onboarding → redirects to home
- [ ] Existing complete user → directly to home from landing
- [ ] Incomplete profile tries `/home` → redirected to onboarding
- [ ] Complete profile tries `/onboarding` → redirected to home
- [ ] Unauthenticated tries `/home` → loading spinner (protected by auth)
- [ ] No redirect loops on any page
