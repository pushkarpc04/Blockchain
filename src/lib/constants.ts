export const APP_NAME = "SecureDocVerify";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  REGISTER_DOCUMENT: "/register-document",
  VERIFY_DOCUMENT: "/verify-document",
};

export const DOCUMENT_TYPES = [
  "Certificate",
  "Diploma",
  "License",
  "Contract",
  "ID Document",
  "Other",
];

export const FIREBASE_COLLECTIONS = {
  DOCUMENTS: "documents",
};
