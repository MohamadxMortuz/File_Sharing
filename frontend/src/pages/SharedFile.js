import React, { useState } from 'react';
import { fileService } from '../services/api';
import './SharedFile.css';

const SharedFile = () => {
  const [shareLink, setShareLink] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const linkParts = shareLink.split('/');
      const linkId = linkParts[linkParts.length - 1];
      
      const response = await fileService.getFileInfo(linkId);
      setFileInfo(response.data);
    } catch (err) {
      setError('File not found or invalid link');
      setFileInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const linkParts = shareLink.split('/');
    const linkId = linkParts[linkParts.length - 1];
    window.open(fileService.downloadFile(linkId), '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="shared-file-container">
      <div className="shared-file-card">
        <h2>Access Shared File</h2>
        <p className="subtitle">Paste the share link to view and download the file</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Share Link</label>
            <input
              type="text"
              value={shareLink}
              onChange={(e) => setShareLink(e.target.value)}
              placeholder="https://example.com/share/..."
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Loading...' : 'Access File'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        {fileInfo && (
          <div className="file-preview">
            <h3>File Information</h3>
            <div className="file-details">
              <p><strong>Name:</strong> {fileInfo.originalName}</p>
              <p><strong>Size:</strong> {formatFileSize(fileInfo.size)}</p>
              <p><strong>Uploaded:</strong> {new Date(fileInfo.uploadedAt).toLocaleString()}</p>
              <p><strong>Uploaded by:</strong> {fileInfo.uploadedBy}</p>
            </div>
            <button onClick={handleDownload} className="btn-download">
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedFile;
