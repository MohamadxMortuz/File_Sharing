const File = require('../models/File');
const { getBucket } = require('../config/db');
const { encryptBuffer, decryptBuffer } = require('../utils/encryption');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Readable } = require('stream');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const bucket = getBucket();
    const { encrypted, iv } = encryptBuffer(req.file.buffer);

    const encryptedName = uuidv4() + path.extname(req.file.originalname);

    // Upload encrypted buffer to GridFS
    const uploadStream = bucket.openUploadStream(encryptedName, {
      metadata: { iv: iv.toString('hex'), mimeType: req.file.mimetype }
    });

    await new Promise((resolve, reject) => {
      Readable.from(encrypted).pipe(uploadStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    const file = new File({
      originalName: req.file.originalname,
      encryptedName,
      size: req.file.size,
      mimeType: req.file.mimetype,
      shareLink: uuidv4(),
      uploadedBy: req.userId,
      gridfsId: uploadStream.id
    });

    await file.save();

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: file._id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        shareLink: `${req.protocol}://${req.get('host')}/share/${file.shareLink}`,
        uploadedAt: file.uploadedAt,
        downloads: file.downloads
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

exports.getUserFiles = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { uploadedBy: req.userId };
    if (search) query.originalName = { $regex: search, $options: 'i' };

    const files = await File.find(query).sort({ uploadedAt: -1 });

    res.json({
      files: files.map(file => ({
        id: file._id,
        originalName: file.originalName,
        size: file.size,
        mimeType: file.mimeType,
        shareLink: `${req.protocol}://${req.get('host')}/share/${file.shareLink}`,
        uploadedAt: file.uploadedAt,
        downloads: file.downloads
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareLink: req.params.shareLink });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const bucket = getBucket();

    // Read encrypted data from GridFS
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(file.gridfsId);

    await new Promise((resolve, reject) => {
      downloadStream.on('data', chunk => chunks.push(chunk));
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });

    const encryptedBuffer = Buffer.concat(chunks);

    // Get IV from GridFS file metadata
    const gridfsFiles = await bucket.find({ _id: file.gridfsId }).toArray();
    const iv = Buffer.from(gridfsFiles[0].metadata.iv, 'hex');

    const decrypted = decryptBuffer(encryptedBuffer, iv);

    file.downloads += 1;
    await file.save();

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.send(decrypted);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.id, uploadedBy: req.userId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Delete from GridFS
    const bucket = getBucket();
    await bucket.delete(file.gridfsId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'File deletion failed' });
  }
};

exports.previewFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareLink: req.params.shareLink });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const bucket = getBucket();
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(file.gridfsId);

    await new Promise((resolve, reject) => {
      downloadStream.on('data', chunk => chunks.push(chunk));
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });

    const encryptedBuffer = Buffer.concat(chunks);
    const gridfsFiles = await bucket.find({ _id: file.gridfsId }).toArray();
    const iv = Buffer.from(gridfsFiles[0].metadata.iv, 'hex');
    const decrypted = decryptBuffer(encryptedBuffer, iv);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': 'inline'
    });
    res.send(decrypted);
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'File preview failed' });
  }
};

exports.getSharedFile = async (req, res) => {
  try {
    const file = await File.findOne({ shareLink: req.params.shareLink });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const bucket = getBucket();
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(file.gridfsId);

    await new Promise((resolve, reject) => {
      downloadStream.on('data', chunk => chunks.push(chunk));
      downloadStream.on('end', resolve);
      downloadStream.on('error', reject);
    });

    const encryptedBuffer = Buffer.concat(chunks);
    const gridfsFiles = await bucket.find({ _id: file.gridfsId }).toArray();
    const iv = Buffer.from(gridfsFiles[0].metadata.iv, 'hex');
    const decrypted = decryptBuffer(encryptedBuffer, iv);

    file.downloads += 1;
    await file.save();

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`
    });
    res.send(decrypted);
  } catch (error) {
    console.error('Shared download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
};

exports.getFileMeta = async (req, res) => {
  try {
    const file = await File.findOne({ shareLink: req.params.shareLink });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json({ fileName: file.originalName, size: file.size, type: file.mimeType });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file info' });
  }
};

exports.getFileInfo = async (req, res) => {
  try {
    const file = await File.findOne({ shareLink: req.params.shareLink }).populate('uploadedBy', 'fullName');
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.json({
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      uploadedBy: file.uploadedBy.fullName,
      downloads: file.downloads
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch file info' });
  }
};
