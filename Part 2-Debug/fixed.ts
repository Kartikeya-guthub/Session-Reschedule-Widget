import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

interface BookingRequest {
  studentId: string;
  teacherId: string;
  slot: string; // ISO datetime string
  subject: string;
}

// BUG 2 (Async/Await): The handler must be marked as `async` because Firestore operations are asynchronous and return Promises.
export const bookSession = functions.https.onCall(async (data: any, context) => {
  // BUG 4 (Typing): Firebase passes `data` as `any` at runtime. Typing the parameter directly as `data: BookingRequest` is a TypeScript anti-pattern. We must validate ALL required fields at runtime (including 'subject'), otherwise Firestore throws errors on undefined values or corrupted data is saved.
  if (!data || typeof data.studentId !== "string" || typeof data.teacherId !== "string" || typeof data.slot !== "string" || typeof data.subject !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Missing or invalid required fields");
  }
  const request = data as BookingRequest;

  // BUG 1 (Security): There is no authentication check. In production, anyone could call this endpoint anonymously or maliciously spoof the `studentId`. We must verify `context.auth` exists and matches the caller.
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to book a session");
  }
  if (context.auth.uid !== request.studentId) {
    throw new functions.https.HttpsError("permission-denied", "You can only book sessions for yourself");
  }

  const booking = {
    studentId: request.studentId,
    teacherId: request.teacherId,
    slot: request.slot,
    subject: request.subject,
    status: "confirmed",
    // Best practice: Use serverTimestamp to avoid client clock skew
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // BUG 3 (Logic) & BUG 5 (Race Condition): 
  // 1. Logic mismatch: The original read from `teachers/{id}/bookings` but wrote to the global `bookings`.
  // 2. Race condition: A simple read-then-write allows two concurrent requests to double-book the slot.
  // Fix: Use the deterministic `slot` string as the document ID and wrap it in an atomic transaction.
  const teacherBookingsRef = db.collection("teachers").doc(request.teacherId).collection("bookings");
  const bookingRef = teacherBookingsRef.doc(request.slot); 

  try {
    await db.runTransaction(async (tx) => {
      // Missing 'await' here was part of BUG 2 in the original code, but we now use tx.get()
      const doc = await tx.get(bookingRef);
      
      if (doc.exists) {
        // We throw an HttpsError to abort the transaction cleanly and return to the client
        throw new functions.https.HttpsError("already-exists", "Slot already booked");
      }
      
      tx.set(bookingRef, booking);
    });
    
    return { success: true };
  } catch (error: any) {
    if (error.code === "already-exists") {
      return { success: false, message: "Slot already booked" };
    }
    throw error;
  }
});
