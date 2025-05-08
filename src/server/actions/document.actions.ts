"use server";

import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import type { DocumentUploadPayload, RegisteredDocument, VerificationResult } from "@/types";
import { FIREBASE_COLLECTIONS } from "@/lib/constants";
import { uploadDocument as uploadToOffChainStorage } from '@/services/off-chain-storage';

// Helper to simulate blockchain interaction
async function registerOnBlockchain(documentHash: string, metadataUri: string, owner: string): Promise<string> {
  console.log(`Simulating blockchain registration for hash: ${documentHash}, metadata: ${metadataUri}, owner: ${owner}`);
  // In a real app, this would interact with a smart contract (e.g., using ethers.js or web3.js)
  // const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  // const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY, provider);
  // const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, DocumentRegistryABI, signer);
  // const tx = await contract.registerDocument(documentHash, metadataUri, { gasLimit: 300000 });
  // await tx.wait();
  // return tx.hash;
  return `0x${Buffer.from(Math.random().toString()).toString('hex').substring(0, 64)}`; // Simulated tx hash
}

// Helper to simulate blockchain verification
async function verifyOnBlockchain(documentHash: string): Promise<{ isVerified: boolean; registrationTimestamp?: number; issuer?: string, transactionId?: string } | null> {
  console.log(`Simulating blockchain verification for hash: ${documentHash}`);
  // In a real app, this would query the smart contract
  // const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  // const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, DocumentRegistryABI, provider);
  // const docInfo = await contract.getDocumentByHash(documentHash);
  // if (docInfo.isRegistered) {
  //   return { 
  //     isVerified: true, 
  //     registrationTimestamp: docInfo.timestamp.toNumber() * 1000, 
  //     issuer: docInfo.owner 
  //     transactionId: "TODO" // you'd need to store or retrieve this
  //   };
  // }
  // For simulation, let's assume if a document exists in Firestore with this hash, it was "registered"
  const q = query(collection(db, FIREBASE_COLLECTIONS.DOCUMENTS), where("documentHash", "==", documentHash));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docData = querySnapshot.docs[0].data() as RegisteredDocument;
    return {
      isVerified: true,
      registrationTimestamp: docData.registrationTimestamp,
      issuer: docData.userId, // Or a specific issuer field if you add one
      transactionId: docData.blockchainTransactionId,
    };
  }
  return null;
}

async function generateDocumentHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hashHex}`;
}

export async function registerDocumentAction(payload: DocumentUploadPayload): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    const documentHash = await generateDocumentHash(payload.file);

    // 1. Upload to off-chain storage (e.g., S3, IPFS, Firebase Storage)
    // For this example, we'll use a placeholder service
    const { storageUrl } = await uploadToOffChainStorage(payload.file, {
      documentType: payload.documentType,
      issuingAuthority: payload.issuingAuthority,
      dateOfIssue: payload.dateOfIssue,
      uniqueId: payload.uniqueId,
    });
    
    // The metadata URI could be a link to a JSON file stored off-chain (e.g., on IPFS) containing more detailed metadata.
    // For simplicity, we can use the storageUrl or a reference to the Firestore document ID.
    const metadataUri = storageUrl; // Or potentially a more structured metadata JSON on IPFS/S3

    // 2. Register on blockchain (simulated)
    const blockchainTransactionId = await registerOnBlockchain(documentHash, metadataUri, user.uid);

    // 3. Store metadata in Firestore
    const documentData: Omit<RegisteredDocument, 'id'> = {
      userId: user.uid,
      documentName: payload.documentName,
      fileName: payload.file.name,
      fileType: payload.file.type,
      documentType: payload.documentType,
      issuingAuthority: payload.issuingAuthority,
      dateOfIssue: payload.dateOfIssue,
      uniqueId: payload.uniqueId,
      documentHash,
      storageUrl,
      blockchainTransactionId,
      registrationTimestamp: Date.now(),
    };

    const docRef = await addDoc(collection(db, FIREBASE_COLLECTIONS.DOCUMENTS), documentData);
    
    return { success: true, documentId: docRef.id };
  } catch (error: any) {
    console.error("Error registering document:", error);
    return { success: false, error: error.message || "Failed to register document." };
  }
}

export async function verifyDocumentByFileAction(file: File): Promise<VerificationResult> {
  try {
    const documentHash = await generateDocumentHash(file);
    return verifyDocumentByHash(documentHash);
  } catch (error: any) {
    return { found: false, message: `Error processing file: ${error.message}` };
  }
}

export async function verifyDocumentByIdAction(documentId: string): Promise<VerificationResult> {
 try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.DOCUMENTS, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { found: false, message: "Document ID not found in our records." };
    }
    const document = { id: docSnap.id, ...docSnap.data() } as RegisteredDocument;
    return verifyDocumentByHash(document.documentHash, document);
  } catch (error: any) {
    return { found: false, message: `Error verifying by ID: ${error.message}` };
  }
}


async function verifyDocumentByHash(documentHash: string, knownDocument?: RegisteredDocument): Promise<VerificationResult> {
  try {
    // 1. Query Firestore for the hash
    let dbDocument: RegisteredDocument | undefined = knownDocument;
    if (!dbDocument) {
      const q = query(collection(db, FIREBASE_COLLECTIONS.DOCUMENTS), where("documentHash", "==", documentHash));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        dbDocument = { id: docData.id, ...docData.data() } as RegisteredDocument;
      }
    }

    // 2. Query Blockchain (simulated)
    const blockchainStatus = await verifyOnBlockchain(documentHash);

    if (dbDocument && blockchainStatus?.isVerified) {
      // Document found in DB and verified on blockchain
      return {
        found: true,
        isHashMatching: true, // Assuming if found by hash, it matches
        document: dbDocument,
        message: "Document is registered and verified on the blockchain.",
        blockchainStatus: {
          isVerified: true,
          registrationTimestamp: blockchainStatus.registrationTimestamp,
          issuer: blockchainStatus.issuer,
          transactionId: blockchainStatus.transactionId,
        }
      };
    } else if (dbDocument && !blockchainStatus?.isVerified) {
      // Found in DB but not (or no longer) on blockchain / or discrepancy
      return {
        found: true,
        isHashMatching: true,
        document: dbDocument,
        message: "Document found in our records, but blockchain verification failed or is pending. Please check blockchain details.",
         blockchainStatus: {
          isVerified: false,
        }
      };
    } else if (!dbDocument && blockchainStatus?.isVerified) {
      // Found on blockchain but not in our DB (unlikely with current simulation, but possible in real scenario)
       return {
        found: true,
        isHashMatching: true,
        message: "Document is verified on the blockchain, but local metadata is unavailable.",
        blockchainStatus: {
          isVerified: true,
          registrationTimestamp: blockchainStatus.registrationTimestamp,
          issuer: blockchainStatus.issuer,
          transactionId: blockchainStatus.transactionId,
        }
      };
    } else {
      return { found: false, message: "Document not found or not verified on the blockchain." };
    }

  } catch (error: any) {
    console.error("Error verifying document:", error);
    return { found: false, message: error.message || "Verification failed." };
  }
}


export async function getUserDocumentsAction(): Promise<{ success: boolean; documents?: RegisteredDocument[]; error?: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, error: "User not authenticated." };
  }

  try {
    const q = query(collection(db, FIREBASE_COLLECTIONS.DOCUMENTS), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RegisteredDocument));
    return { success: true, documents };
  } catch (error: any) {
    console.error("Error fetching user documents:", error);
    return { success: false, error: error.message || "Failed to fetch documents." };
  }
}
