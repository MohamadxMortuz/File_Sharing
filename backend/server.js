require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getBucket } = require('./config/db');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Secure File Sharing API' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
