# Session Reschedule Widget

A parent-facing tutoring portal component designed to allow users to securely and safely reschedule upcoming tutoring sessions.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **View the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run the tests:**
   ```bash
   npx vitest
   ```

## Production Migration (Mock to Firebase)

Currently, the application uses a mock backend implementation to simulate network requests and server-side validation. To deploy this against a real Firebase backend, you only need to change the implementation details in `lib/firebase/functions.ts`. Because the `requestReschedule` function already perfectly mirrors the shape of a Firebase `httpsCallable` function (taking a `RescheduleRequestPayload` and returning a Promise of `RescheduleResponse`), you can simply replace the file's body with `const requestReschedule = httpsCallable(functions, 'requestReschedule');`. The component UI, types, and error handling will continue to work exactly as they do now without any modifications.
