# Secure File Sharing System with Scalable Storage

Enterprise-grade file sharing platform supporting files up to 30GB with AES encryption.

## 🎯 Features

- **User Authentication**: JWT-based secure authentication
- **Large File Support**: Upload files up to 30GB with chunking
- **AES Encryption**: Military-grade 256-bit encryption
- **Secure Links**: Unique shareable links for each file
- **Search Functionality**: Find files quickly
- **Responsive Design**: Works on desktop and mobile
- **Real-time Progress**: Upload progress tracking

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- MongoDB
- JWT Authentication
- Bcrypt password hashing
- AES-256-CBC encryption
- Multer for file uploads

**Frontend:**
- React.js
- React Router
- Axios
- Modern CSS with glassmorphism

## 📁 Project Structure

```
secure-file-sharing/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── fileController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── File.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── files.js
│   ├── utils/
│   │   └── encryption.js
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── pages/
    │   │   ├── Landing.js
    │   │   ├── Landing.css
    │   │   ├── Register.js
    │   │   ├── Login.js
    │   │   ├── Auth.css
    │   │   ├── Dashboard.js
    │   │   ├── Dashboard.css
    │   │   ├── SharedFile.js
    │   │   └── SharedFile.css
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or cloud)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd secure-file-sharing/backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-file-sharing
JWT_SECRET=your_jwt_secret_key_change_in_production
ENCRYPTION_KEY=32_byte_encryption_key_change_this
MAX_FILE_SIZE=32212254720
NODE_ENV=development
```

4. Start MongoDB (if local):
```bash
mongod
```

5. Start backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd secure-file-sharing/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start React development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 📄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Files (Protected)
- `POST /api/files/upload` - Upload file
- `GET /api/files/my-files?search=` - Get user's files
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/info/:shareLink` - Get file info
- `GET /api/files/download/:shareLink` - Download file

## 🔐 Security Features

1. **Password Hashing**: Bcrypt with salt rounds
2. **JWT Tokens**: Secure authentication with 7-day expiry
3. **AES Encryption**: Files encrypted before storage
4. **Protected Routes**: Middleware authentication
5. **CORS**: Configured for security
6. **Input Validation**: Express-validator

## 📱 Pages

1. **Landing Page** - Hero section with features
2. **Register** - User registration with validation
3. **Login** - User authentication
4. **Dashboard** - File upload, management, search
5. **Shared File Access** - Download files via link

## 🎨 Design Features

- Glassmorphism effects
- Gradient backgrounds
- Soft shadows
- Rounded corners
- Smooth animations
- Mobile responsive
- Progress indicators

## 🔄 Usage Flow

1. User registers/logs in
2. Upload files from dashboard
3. System encrypts and stores files
4. Generate unique share link
5. Copy and share link
6. Recipients access file via link
7. Download with automatic decryption

## 📊 MongoDB Schema

### User Schema
```javascript
{
  fullName: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  createdAt: Date
}
```

### File Schema
```javascript
{
  originalName: String,
  encryptedName: String (unique),
  size: Number,
  mimeType: String,
  shareLink: String (unique),
  uploadedBy: ObjectId (ref: User),
  uploadedAt: Date,
  downloads: Number
}
```

## 🚀 Future Enhancements

- Multi-factor authentication
- AWS S3 integration
- File expiration dates
- Password-protected links
- File compression
- Virus scanning
- Email notifications
- Analytics dashboard
- Blockchain verification
- AI-based recommendations

## 📝 Notes

- Default max file size: 30GB
- Files are encrypted at rest
- Temporary decrypted files are deleted after download
- JWT tokens expire after 7 days
- Search is case-insensitive

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env

**File Upload Fails:**
- Check MAX_FILE_SIZE setting
- Ensure uploads directory exists
- Verify disk space

**CORS Issues:**
- Check backend CORS configuration
- Verify frontend API_URL in api.js

## 📄 License

MIT License - Feel free to use for personal or commercial projects.
