import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase"; // Ensure Firebase app and storage are initialized
import type { DocumentMetadataCore } from "@/types"; // Use DocumentMetadataCore if it's the base

/**
 * Represents the metadata of a document.
 */
export interface DocumentMetadata extends DocumentMetadataCore {
    // Potentially add more fields specific to storage if needed
    fileName: string;
    fileType: string;
    userId: string; // For organizing storage, e.g., by user
}

/**
 * Represents information about an uploaded document, including its storage location.
 */
export interface UploadedDocumentInfo {
    /**
     * The URL where the document is stored.
     */
    storageUrl: string;
    /**
     * The full path in Firebase Storage.
     */
    storagePath: string;
}

// const storage = getStorage(app); // Removed: Use imported storage instance

/**
 * Asynchronously uploads a document to Firebase Storage and returns its storage URL.
 *
 * @param file The file to upload.
 * @param metadata The metadata associated with the document.
 * @returns A promise that resolves to an UploadedDocumentInfo object containing the storage URL and path.
 */
export async function uploadDocument(file: File, metadata: DocumentMetadata): Promise<UploadedDocumentInfo> {
    if (!metadata.userId) {
        throw new Error("User ID is required for uploading document to storage.");
    }

    // Create a storage reference
    // Example path: users/{userId}/documents/{timestamp}_{fileName}
    const filePath = `users/${metadata.userId}/documents/${Date.now()}_${metadata.fileName}`;
    const storageRef = ref(storage, filePath);

    // Upload the file
    // Firebase Storage metadata can also be set here if needed, distinct from your app's metadata
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: metadata.fileType,
        customMetadata: { // Store some of your app metadata directly with the file if useful
            documentType: metadata.documentType,
            issuingAuthority: metadata.issuingAuthority,
            dateOfIssue: metadata.dateOfIssue,
            uniqueId: metadata.uniqueId,
        }
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
        storageUrl: downloadURL,
        storagePath: snapshot.ref.fullPath,
    };
}

// Note: For production, ensure Firebase Storage rules are set up correctly
// to control access to these files (e.g., only authenticated users can write to their own path,
// and perhaps public read access if documents are meant to be publicly verifiable via URL,
// or restricted read if verification only happens through your app).
//
// Example Storage Rules (rules need to be deployed to Firebase):
/*
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to read and write to their own "documents" folder
    match /users/{userId}/documents/{allPaths=**} {
      allow read: if request.auth != null; // Or make public if needed: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // You might have other rules for other paths
  }
}
*/

// The current `services/off-chain-storage.ts` is being called from a Server Action (`document.actions.ts`).
// Firebase client-side SDK for Storage is generally meant for direct client-to-Firebase uploads.
// If Server Actions are running in a Node.js environment on Vercel, they might not have direct browser `File` objects
// or the full client SDK context as expected.
//
// A more robust approach for server-side uploads from Server Actions would be:
// 1. Frontend sends file to a Next.js API Route (or directly to the Server Action if it can handle raw file data).
// 2. API Route/Server Action uses Firebase Admin SDK (for Node.js) to upload to Storage. This is more secure
//    as it doesn't expose client-side upload logic and can enforce stricter checks.
//
// However, if Server Actions are executed in an environment where the client SDK *can* work
// (e.g., for simpler cases or if the `File` object is correctly passed), this might function.
// The current `uploadDocument` function within `document.actions.ts` seems to assume it receives a `File` object.
//
// For this iteration, I'll keep the client SDK usage as it simplifies the setup without adding Admin SDK complexity yet.
// But be aware this is a point of potential refactoring for a production system for better security and robustness
// if `File` objects are not directly usable or if Admin SDK features are needed.
// The provided `metadata: DocumentMetadata` in `uploadToOffChainStorage` now includes `fileName`, `fileType`, `userId`.
// The caller `registerDocumentAction` in `document.actions.ts` needs to be updated to pass these.
//
// I'll update the `uploadToOffChainStorage` call in `document.actions.ts` to reflect this.
// In `document.actions.ts`:
// const { storageUrl } = await uploadToOffChainStorage(payload.file, {
//   documentType: payload.documentType,
//   issuingAuthority: payload.issuingAuthority,
//   dateOfIssue: payload.dateOfIssue,
//   uniqueId: payload.uniqueId,
//   fileName: payload.file.name, // ADDED
//   fileType: payload.file.type, // ADDED
//   userId: user.uid,             // ADDED
// });
// This change has been made in document.actions.ts.
