# Final Report
# Secure File Sharing System with Scalable Storage

---

**Submitted in partial fulfillment of the requirements for the Capstone Project**

---

| Field | Details |
|---|---|
| Project Title | Secure File Sharing System with Scalable Storage |
| Technology Stack | Node.js, Express.js, React.js, MongoDB, GridFS |
| Encryption Standard | AES-256-CBC |
| Maximum File Size | 30 GB |

---

## Table of Contents

1. [Chapter 1: Introduction](#chapter-1-introduction)
2. [Chapter 2: Literature Review](#chapter-2-literature-review)
3. [Chapter 3: Conceptual Study / System Architecture](#chapter-3-conceptual-study--system-architecture)
4. [Chapter 4: Results and Discussion](#chapter-4-results-and-discussion)
5. [Chapter 5: Conclusion and Future Scope](#chapter-5-conclusion-and-future-scope)

---

## Chapter 1: Introduction

### 1.1 Title of the Project

**Secure File Sharing System with Scalable Storage**

### 1.2 Background and Importance

In the digital era, sharing files across networks has become a fundamental requirement for individuals and enterprises alike. However, the convenience of file sharing is frequently offset by serious security risks — unauthorized access, data interception during transit, and insecure storage are among the most prevalent threats. High-profile data breaches have demonstrated that even large organizations are vulnerable when file handling is not designed with security as a first-class concern.

Existing consumer-grade solutions such as Google Drive or Dropbox, while convenient, do not offer end-to-end encryption at the application layer, nor do they give developers or enterprises full control over encryption keys and storage infrastructure. There is a clear need for a self-hosted, open-source platform that combines strong cryptographic guarantees with the usability expected of modern web applications.

This project addresses that gap by building a full-stack secure file sharing system that encrypts every file before it is written to disk, stores encrypted data in a scalable database-native storage layer (MongoDB GridFS), and exposes files only through time-limited, unique share links — all without requiring the recipient to have an account.

### 1.3 Objectives

1. Implement AES-256-CBC encryption so that files are never stored in plaintext.
2. Support large file uploads up to 30 GB using chunked, streaming storage via MongoDB GridFS.
3. Provide JWT-based user authentication with bcrypt password hashing.
4. Generate unique, unguessable share links (UUID v4) for every uploaded file.
5. Allow unauthenticated recipients to download files via share links with automatic decryption.
6. Deliver a responsive React.js frontend with real-time upload progress tracking.
7. Expose a clean RESTful API that can be consumed by third-party clients.

### 1.4 Overview of Methodology

The project follows a layered full-stack architecture:

- **Frontend** — React.js single-page application communicates with the backend exclusively through Axios HTTP calls, attaching JWT tokens via request interceptors.
- **Backend** — Node.js + Express.js REST API handles authentication, file encryption, GridFS streaming, and share-link resolution.
- **Storage** — MongoDB stores user and file metadata; MongoDB GridFS stores the raw encrypted binary data, eliminating the 16 MB BSON document size limit.
- **Security** — Every file is encrypted with a freshly generated random IV before upload; the IV is stored alongside the file in GridFS metadata and used for decryption on download.

---

## Chapter 2: Literature Review

### 2.1 File Sharing and Security Challenges

Early file sharing systems (FTP, SMB) were designed for trusted internal networks and offered no encryption. As the internet grew, the need for secure transfer protocols led to SFTP and HTTPS, which protect data in transit but do not address encryption at rest. Cloud storage services introduced convenience but shifted trust to the service provider, who typically holds the encryption keys.

### 2.2 Symmetric vs. Asymmetric Encryption for File Storage

Symmetric encryption algorithms (AES, ChaCha20) are preferred for bulk file encryption due to their speed. AES (Advanced Encryption Standard), standardized by NIST in 2001, operates on 128-bit blocks and supports 128, 192, and 256-bit keys. The 256-bit variant is considered computationally infeasible to brute-force with current technology. CBC (Cipher Block Chaining) mode introduces an Initialization Vector (IV) that ensures identical plaintexts produce different ciphertexts, preventing pattern analysis attacks.

Asymmetric encryption (RSA, ECC) is computationally expensive for large files and is typically used only for key exchange, not bulk data encryption.

### 2.3 JSON Web Tokens (JWT) for Stateless Authentication

JWT (RFC 7519) encodes claims as a Base64URL-encoded JSON payload signed with a secret (HMAC-SHA256) or a private key (RS256). Stateless authentication eliminates the need for server-side session storage, making it horizontally scalable. The standard recommends short expiry windows; this project uses a 7-day expiry balanced against usability requirements.

### 2.4 MongoDB GridFS for Large Binary Storage

MongoDB's default document size limit is 16 MB, which is insufficient for large files. GridFS is a specification for storing and retrieving files larger than this limit by splitting them into chunks (default 255 KB each) stored in two collections: `fs.files` (metadata) and `fs.chunks` (binary data). GridFS supports streaming reads and writes, making it suitable for large file handling without loading the entire file into memory.

### 2.5 Secure Link Sharing Patterns

UUID v4 generates 122 bits of randomness, yielding approximately 5.3 × 10³⁶ possible values. The probability of a collision or successful brute-force guess is negligible for practical purposes. This pattern is widely used in systems like AWS S3 pre-signed URLs and file hosting services to provide capability-based access control without requiring recipient authentication.

### 2.6 Related Work

| System | Encryption at Rest | Self-Hosted | Large File Support | Open Source |
|---|---|---|---|---|
| Google Drive | Provider-managed | No | Yes (5 TB) | No |
| Nextcloud | Optional (plugin) | Yes | Yes | Yes |
| OnionShare | Yes (AES) | Yes | Limited | Yes |
| **This Project** | **Yes (AES-256-CBC)** | **Yes** | **Yes (30 GB)** | **Yes** |

---

## Chapter 3: Conceptual Study / System Architecture

### 3.1 System Architecture Overview

The system is divided into three tiers:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT TIER                          │
│   React.js SPA  ──  Axios HTTP  ──  JWT Interceptor     │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS REST API
┌────────────────────────▼────────────────────────────────┐
│                   APPLICATION TIER                      │
│   Express.js Router                                     │
│   ├── /api/auth  →  authController (register / login)  │
│   └── /api/files →  fileController (upload/download/   │
│                      delete / info / list)              │
│   Middleware: JWT auth, Multer (memoryStorage)          │
│   Utils: AES-256-CBC encrypt / decrypt (crypto module)  │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────┐
│                     DATA TIER                           │
│   MongoDB                                               │
│   ├── users collection  (User schema)                   │
│   ├── files collection  (File schema + gridfsId ref)    │
│   └── GridFS (uploads.files + uploads.chunks)           │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Core Concepts

#### 3.2.1 AES-256-CBC Encryption

The `encryption.js` utility uses Node.js's built-in `crypto` module. The encryption key is derived by SHA-256 hashing the `ENCRYPTION_KEY` environment variable, producing a deterministic 32-byte key regardless of the input length.

```
ENCRYPTION_KEY (env string)
        │
        ▼
  SHA-256 Hash  →  32-byte key
        │
        ├── crypto.randomBytes(16)  →  IV (unique per file)
        │
        ▼
  AES-256-CBC Cipher
        │
        ▼
  Encrypted Buffer  +  IV stored in GridFS metadata
```

A fresh 16-byte IV is generated for every upload using `crypto.randomBytes(16)`, ensuring that two uploads of the same file produce completely different ciphertexts.

#### 3.2.2 GridFS Streaming Upload/Download

Files are held in memory by Multer (`memoryStorage`) and then piped as a `Readable` stream into a GridFS upload stream. This avoids writing plaintext to disk at any point:

```
Client multipart/form-data
        │
        ▼
  Multer (memoryStorage)  →  req.file.buffer (plaintext)
        │
        ▼
  encryptBuffer()  →  { encrypted Buffer, iv }
        │
        ▼
  Readable.from(encrypted).pipe(bucket.openUploadStream())
        │
        ▼
  GridFS (uploads.chunks)  ←  binary encrypted chunks
  GridFS (uploads.files)   ←  metadata { iv, mimeType }
```

On download, the process is reversed: chunks are streamed out, concatenated, decrypted with the stored IV, and sent directly to the HTTP response.

#### 3.2.3 JWT Authentication Flow

```
Register / Login
        │
        ▼
  bcrypt.hash(password, 10)  →  stored in users collection
        │
        ▼
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
        │
        ▼
  Token returned to client  →  stored in localStorage
        │
        ▼
  Subsequent requests: Authorization: Bearer <token>
        │
        ▼
  auth middleware: jwt.verify()  →  req.userId attached
```

#### 3.2.4 Share Link Generation

Each file receives a UUID v4 share link at upload time, stored in the `files` collection. The share link is independent of the file's MongoDB `_id`, preventing enumeration attacks. Recipients use the share link to call `/api/files/info/:shareLink` (metadata) and `/api/files/download/:shareLink` (file download) — both public endpoints requiring no authentication.

### 3.3 Data Models

#### User Schema
```javascript
{
  fullName : String  (required, trimmed),
  email    : String  (required, unique, lowercase),
  phone    : String  (required),
  password : String  (bcrypt hashed, min 6 chars),
  createdAt: Date    (default: now)
}
```

#### File Schema
```javascript
{
  originalName  : String    (required),
  encryptedName : String    (required, unique — UUID + extension),
  size          : Number    (bytes),
  mimeType      : String,
  shareLink     : String    (unique UUID v4),
  gridfsId      : ObjectId  (reference to GridFS file),
  uploadedBy    : ObjectId  (ref: User),
  uploadedAt    : Date      (default: now),
  downloads     : Number    (default: 0)
}
```

### 3.4 API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, receive JWT |
| POST | `/api/files/upload` | Yes (JWT) | Upload & encrypt file |
| GET | `/api/files/my-files?search=` | Yes (JWT) | List user's files |
| DELETE | `/api/files/:id` | Yes (JWT) | Delete file + GridFS data |
| GET | `/api/files/info/:shareLink` | No | Get file metadata |
| GET | `/api/files/download/:shareLink` | No | Download decrypted file |

### 3.5 Frontend Architecture

The React.js frontend is a single-page application with four main pages:

| Page | Route | Purpose |
|---|---|---|
| Landing | `/` | Marketing page, feature highlights |
| Register | `/register` | User registration form with validation |
| Login | `/login` | Authentication form |
| Dashboard | `/dashboard` | File upload, list, search, copy share link, delete |
| Shared File | `/share/:shareLink` | Public download page for recipients |

The `api.js` service layer centralizes all HTTP calls and attaches the JWT token automatically via an Axios request interceptor, keeping authentication logic out of individual components.

### 3.6 Technologies Used

| Technology | Version / Standard | Role |
|---|---|---|
| Node.js | v14+ | Backend runtime |
| Express.js | 4.x | REST API framework |
| MongoDB | 5.x+ | Database + GridFS storage |
| Mongoose | 7.x | ODM for MongoDB |
| React.js | 18.x | Frontend SPA framework |
| Axios | 1.x | HTTP client with interceptors |
| JSON Web Token | RFC 7519 | Stateless authentication |
| bcryptjs | — | Password hashing (10 salt rounds) |
| AES-256-CBC | NIST FIPS 197 | File encryption |
| Multer | — | Multipart file parsing |
| UUID v4 | RFC 4122 | Share link & encrypted filename generation |

---

## Chapter 4: Results and Discussion

### 4.1 Key Observations

#### 4.1.1 Security Posture

- **Plaintext never touches disk.** Multer's `memoryStorage` holds the file buffer in RAM; it is encrypted before being written to GridFS. There is no window during which an unencrypted file exists on the filesystem.
- **Per-file IV uniqueness.** `crypto.randomBytes(16)` generates a cryptographically secure random IV for every upload. This means two uploads of the same file produce entirely different ciphertexts, defeating frequency analysis.
- **Key derivation via SHA-256.** The environment variable `ENCRYPTION_KEY` is hashed to produce a fixed 32-byte key, ensuring the cipher always receives a correctly sized key regardless of the variable's length.
- **Capability-based access.** Share links are UUID v4 values (122 bits of entropy). Without the link, there is no way to enumerate or guess file identifiers.

#### 4.1.2 Scalability

- **GridFS chunking** splits files into 255 KB chunks, enabling MongoDB to store files of arbitrary size. The 30 GB limit is enforced at the Multer layer (`MAX_FILE_SIZE` env variable) and can be raised without architectural changes.
- **Streaming I/O** means the server never loads an entire large file into memory during download; chunks are streamed from GridFS directly to the HTTP response.

#### 4.1.3 Functional Completeness

| Feature | Status |
|---|---|
| User registration with validation | Implemented |
| JWT login / logout | Implemented |
| File upload with progress tracking | Implemented |
| AES-256-CBC encryption at rest | Implemented |
| GridFS scalable storage | Implemented |
| Unique share link generation | Implemented |
| Public download with decryption | Implemented |
| File search (case-insensitive regex) | Implemented |
| File deletion (metadata + GridFS) | Implemented |
| Download counter | Implemented |
| Responsive UI (glassmorphism design) | Implemented |

### 4.2 Conceptual Comparisons and Analysis

#### 4.2.1 AES-CBC vs. AES-GCM

AES-256-CBC provides confidentiality but does not provide authenticated encryption — an attacker who can modify the ciphertext may be able to perform a padding oracle attack. AES-256-GCM (Galois/Counter Mode) provides both confidentiality and integrity (authentication tag), and is the modern recommended choice. Migrating from CBC to GCM would require changing only the `encryptBuffer` and `decryptBuffer` functions in `encryption.js`.

#### 4.2.2 Memory Storage vs. Disk Storage for Uploads

Using `multer.memoryStorage()` means the entire file is held in RAM before encryption. For very large files (approaching 30 GB), this could exhaust server memory. A production hardening would use a streaming encryption approach — piping the upload stream through a `crypto.createCipheriv` transform stream directly into GridFS — eliminating the in-memory buffer entirely.

#### 4.2.3 localStorage vs. HttpOnly Cookies for JWT

The current implementation stores the JWT in `localStorage`, which is accessible to JavaScript and therefore vulnerable to XSS attacks. Storing the token in an `HttpOnly` cookie would prevent JavaScript access and is the recommended approach for production systems.

### 4.3 Advantages

1. **Zero plaintext storage** — files are encrypted before any write operation.
2. **No account required for download** — recipients only need the share link.
3. **Self-hosted** — the operator retains full control of encryption keys and data.
4. **Scalable storage** — GridFS handles files well beyond MongoDB's 16 MB document limit.
5. **Stateless backend** — JWT authentication allows horizontal scaling without shared session state.

### 4.4 Limitations

1. **CBC mode lacks integrity protection** — should be upgraded to GCM for production.
2. **In-memory file buffering** — limits practical upload size to available server RAM.
3. **JWT in localStorage** — vulnerable to XSS; should use HttpOnly cookies.
4. **No link expiration** — share links are permanent until the file is deleted.
5. **No virus scanning** — uploaded files are not scanned for malware before storage.
6. **Single encryption key** — all files share one server-side key; per-user keys would provide stronger isolation.

### 4.5 Insights Gained

- Combining MongoDB GridFS with streaming encryption is an effective pattern for handling large encrypted files without specialized object storage infrastructure.
- UUID v4 share links provide a practical, stateless capability-based access control mechanism that requires no additional database lookups for authorization.
- The separation of the IV storage (GridFS file metadata) from the encrypted data (GridFS chunks) is a clean design that keeps decryption self-contained within the download handler.

---

## Chapter 5: Conclusion and Future Scope

### 5.1 Summary of Work

This project designed and implemented a full-stack secure file sharing web application. The system allows authenticated users to upload files of up to 30 GB, which are encrypted using AES-256-CBC before being stored in MongoDB GridFS. Each file is assigned a unique UUID v4 share link that can be distributed to recipients who can download and automatically decrypt the file without requiring an account. The backend is a Node.js/Express.js REST API secured with JWT authentication and bcrypt password hashing. The frontend is a React.js single-page application with real-time upload progress, file management, and search functionality.

### 5.2 Major Learning Outcomes

1. Practical application of symmetric encryption (AES-256-CBC) using Node.js's `crypto` module, including IV generation and management.
2. Understanding of MongoDB GridFS as a scalable binary storage layer and how to integrate it with streaming I/O in Node.js.
3. Implementation of stateless JWT-based authentication and the role of middleware in protecting API routes.
4. Design of capability-based access control using cryptographically random identifiers.
5. Full-stack integration between a React.js frontend and a Node.js REST API, including Axios interceptors for token management.
6. Awareness of the gap between a working implementation and a production-hardened system (CBC vs. GCM, localStorage vs. HttpOnly cookies, memory buffering vs. streaming encryption).

### 5.3 Conclusions

The project successfully demonstrates that a self-hosted, encryption-first file sharing platform can be built with widely available open-source technologies. The architecture ensures that files are never stored in plaintext, share links are computationally infeasible to guess, and the system scales to large files through GridFS chunking. The implementation validates the core security objectives while also identifying concrete areas — authenticated encryption, streaming upload encryption, and secure token storage — where a production deployment would require further hardening.

### 5.4 Future Enhancements

| Enhancement | Description | Priority |
|---|---|---|
| AES-256-GCM migration | Replace CBC with GCM for authenticated encryption, preventing ciphertext tampering | High |
| Streaming encryption | Pipe upload stream through a cipher transform stream into GridFS to eliminate in-memory buffering | High |
| HttpOnly cookie JWT | Move token from localStorage to HttpOnly cookie to mitigate XSS risk | High |
| Link expiration | Add `expiresAt` field to File schema; reject downloads after expiry | Medium |
| Password-protected links | Allow uploader to set a password required for download | Medium |
| AWS S3 / compatible storage | Replace GridFS with S3-compatible object storage for production scalability | Medium |
| Virus scanning | Integrate ClamAV or a cloud scanning API before storing uploaded files | Medium |
| Multi-factor authentication | Add TOTP-based 2FA to the login flow | Medium |
| Per-user encryption keys | Derive a unique encryption key per user using PBKDF2 or Argon2 | High |
| Email notifications | Notify uploader when a share link is accessed | Low |
| File compression | Compress files before encryption to reduce storage footprint | Low |
| Analytics dashboard | Track upload/download statistics per user | Low |
| Blockchain audit log | Record file upload/download events on a blockchain for tamper-evident auditing | Low |

---

*End of Report*
