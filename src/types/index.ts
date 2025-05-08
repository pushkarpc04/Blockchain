import type { User as FirebaseUser } from 'firebase/auth';

export interface AppUser extends FirebaseUser {
  // Add any app-specific user properties here if needed
}

export interface DocumentMetadataCore {
  documentName: string;
  documentType: string;
  issuingAuthority: string;
  dateOfIssue: string; // Consider using Date object or ISO string
  uniqueId: string; // User-provided unique ID for the document itself
}

export interface DocumentUploadPayload extends DocumentMetadataCore {
  file: File;
}

export interface RegisteredDocument extends DocumentMetadataCore {
  id: string; // Firestore document ID
  userId: string; // UID of the uploader
  fileName: string;
  fileType: string;
  documentHash: string;
  storageUrl: string;
  blockchainTransactionId?: string;
  registrationTimestamp: number; // Unix timestamp
}

export interface VerificationResult {
  found: boolean;
  isHashMatching?: boolean;
  document?: RegisteredDocument;
  message: string;
  blockchainStatus?: {
    isVerified: boolean;
    registrationTimestamp?: number;
    issuer?: string;
    transactionId?: string;
  };
}
