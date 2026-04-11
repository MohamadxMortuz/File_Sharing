const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  encryptedName: { type: String, required: true, unique: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  shareLink: { type: String, required: true, unique: true },
  gridfsId: { type: mongoose.Schema.Types.ObjectId, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
  downloads: { type: Number, default: 0 }
});

module.exports = mongoose.model('File', fileSchema);
