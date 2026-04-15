const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const fileController = require('../controllers/fileController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 32212254720 }
});

router.post('/upload', auth, upload.single('file'), fileController.uploadFile);
router.get('/my-files', auth, fileController.getUserFiles);
router.get('/shared/meta/:shareLink', fileController.getFileMeta);
router.get('/shared/:shareLink', fileController.getSharedFile);
router.get('/preview/:shareLink', fileController.previewFile);
router.delete('/:id', auth, fileController.deleteFile);
router.get('/info/:shareLink', fileController.getFileInfo);
router.get('/download/:shareLink', fileController.downloadFile);

module.exports = router;
