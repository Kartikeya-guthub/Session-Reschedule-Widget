<div align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  
  <h1>📅 Session Reschedule Widget</h1>
  <p><em>A parent-facing tutoring portal component designed to allow users to securely and safely reschedule upcoming tutoring sessions.</em></p>
</div>

---

## ✨ Features

- **Responsive Design**: Mobile-first architecture that scales beautifully to desktop displays.
- **Accessible**: Built with full keyboard navigation support, focus traps, ARIA attributes, and reduced-motion preferences.
- **Timezone Safe**: Robust handling of timezones, parsing boundaries, and Daylight Saving Time edge cases.
- **Idempotency**: Prevents double-booking and identical duplicate requests.
- **Optimistic Concurrency**: Stale session detection protects against simultaneous updates.

---

## 🚀 Getting Started

Follow these steps to run the widget locally:

### 1️⃣ Install dependencies
```bash
npm install
```

### 2️⃣ Start the development server
```bash
npm run dev
```

### 3️⃣ View the application
Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### 4️⃣ Run the test suite
```bash
npx vitest
```

---

## 🏗️ Production Migration (Mock to Firebase)

Currently, the application uses a mock backend implementation to simulate network requests and server-side validation. To deploy this against a real Firebase backend, you only need to change the implementation details in `lib/firebase/functions.ts`. 

Because the `requestReschedule` function already perfectly mirrors the shape of a Firebase `httpsCallable` function (taking a `RescheduleRequestPayload` and returning a Promise of `RescheduleResponse`), you can simply replace the file's body with:

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebaseConfig'; // Your firebase config

export const requestReschedule = httpsCallable(functions, 'requestReschedule');
```

The component UI, types, and error handling will continue to work exactly as they do now without any modifications!

---

<div align="center">
  <p>Built with ❤️ for a seamless tutoring experience.</p>
</div>
