import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileService } from '../services/api';
import './Dashboard.css';

const API_BASE = 'http://localhost:5001/api';

const FILE_ICONS = {
  image: '🖼️', video: '🎬', audio: '🎵', pdf: '📄',
  zip: '🗜️', word: '📝', excel: '📊', text: '📃', default: '📁'
};

const getFileIcon = (mimeType = '', name = '') => {
  if (mimeType.startsWith('image')) return FILE_ICONS.image;
  if (mimeType.startsWith('video')) return FILE_ICONS.video;
  if (mimeType.startsWith('audio')) return FILE_ICONS.audio;
  if (mimeType.includes('pdf')) return FILE_ICONS.pdf;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return FILE_ICONS.zip;
  if (mimeType.includes('word') || name.endsWith('.docx')) return FILE_ICONS.word;
  if (mimeType.includes('excel') || name.endsWith('.xlsx')) return FILE_ICONS.excel;
  if (mimeType.startsWith('text')) return FILE_ICONS.text;
  return FILE_ICONS.default;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharedLink, setSharedLink] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchFiles = useCallback(async (searchTerm = '') => {
    try {
      setLoading(true);
      const response = await fileService.getMyFiles(searchTerm);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    setUser(JSON.parse(userData));
    fetchFiles();
  }, [navigate, fetchFiles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchFiles(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchFiles]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    setUploadProgress(0);
    try {
      await fileService.upload(formData, (progressEvent) => {
        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      });
      fetchFiles(search);
    } catch (error) {
      alert('Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await fileService.deleteFile(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      alert('Delete failed');
    }
  };

  const copyLink = (file) => {
    navigator.clipboard.writeText(file.shareLink);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const extractShareId = (input) => {
    const trimmed = input.trim();
    return trimmed.includes('/share/') ? trimmed.split('/share/')[1] : trimmed;
  };

  const handleSharedLinkChange = async (e) => {
    const val = e.target.value;
    setSharedLink(val);
    setLinkPreview(null);
    const shareId = extractShareId(val);
    if (!shareId) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API_BASE}/files/info/${shareId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLinkPreview({
        fileName: data.originalName,
        size: data.size,
        type: data.mimeType
      });
    } catch {
      setLinkPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreview = () => {
    const shareId = extractShareId(sharedLink);
    window.open(`${API_BASE}/files/preview/${shareId}`, '_blank');
  };

  const handleSharedDownload = async () => {
    const shareId = extractShareId(sharedLink);
    setDownloading(true);
    try {
      const response = await fetch(`${API_BASE}/files/download/${shareId}`);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const filename = linkPreview?.fileName || 'file';
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      setSharedLink('');
      setLinkPreview(null);
    } catch {
      alert('Invalid or expired link');
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="logo">🔒 SecureShare</div>
        <div className="user-section">
          <span>👤 {user?.fullName}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Upload Section */}
        <div className="upload-section">
          <h2>Upload File</h2>
          <div className="upload-box">
            <input type="file" id="file-input" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-icon">{uploading ? '⏳' : '📁'}</div>
              <p>{uploading ? `Uploading... ${uploadProgress}%` : 'Click to select file'}</p>
              <span>Up to 30GB • Encrypted & stored in MongoDB</span>
            </label>
            {uploading && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>{uploadProgress}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Shared Link Download Section */}
        <div className="shared-download-section">
          <h2>Download via Shared Link</h2>
          <div className="shared-download-box">
            <div className="shared-input-row">
              <input
                type="text"
                className="shared-link-input"
                placeholder="Paste shared link here..."
                value={sharedLink}
                onChange={handleSharedLinkChange}
                disabled={downloading}
              />
              <button
                className="btn-shared-preview"
                onClick={handlePreview}
                disabled={!linkPreview || downloading}
              >
                👁️ Preview
              </button>
              <button
                className="btn-shared-download"
                onClick={handleSharedDownload}
                disabled={!sharedLink.trim() || downloading}
              >
                {downloading ? 'Downloading...' : '⬇️ Download'}
              </button>
            </div>
            {previewLoading && <div className="link-preview-loading">Looking up file...</div>}
            {linkPreview && (
              <div className="link-preview">
                <span className="link-preview-icon">{getFileIcon(linkPreview.type, linkPreview.fileName)}</span>
                <div className="link-preview-info">
                  <span className="link-preview-name">{linkPreview.fileName}</span>
                  <div className="link-preview-meta">
                    <span className="meta-badge">📦 {formatFileSize(linkPreview.size)}</span>
                    <span className="meta-badge type-badge">{linkPreview.type?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Files Section */}
        <div className="files-section">
          <div className="files-header">
            <h2>My Files <span className="file-count">({files.length})</span></h2>
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
              {search && <button className="clear-search" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="no-files">
              <div style={{ fontSize: '48px' }}>{search ? '🔍' : '📭'}</div>
              <p>{search ? `No files matching "${search}"` : 'No files uploaded yet'}</p>
            </div>
          ) : (
            <div className="files-list">
              {files.map((file) => (
                <div key={file.id} className="file-card">
                  <div className="file-icon-large">{getFileIcon(file.mimeType, file.originalName)}</div>
                  <div className="file-info">
                    <h3 title={file.originalName}>{file.originalName}</h3>
                    <div className="file-meta">
                      <span className="meta-badge">📦 {formatFileSize(file.size)}</span>
                      <span className="meta-badge">📅 {new Date(file.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="meta-badge">⬇️ {file.downloads} downloads</span>
                      <span className="meta-badge type-badge">{file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
                    </div>
                    <div className="share-link-preview" title={file.shareLink}>
                      🔗 {file.shareLink}
                    </div>
                  </div>
                  <div className="file-actions">
                    <button onClick={() => copyLink(file)} className={`btn-copy ${copiedId === file.id ? 'copied' : ''}`}>
                      {copiedId === file.id ? '✅ Copied!' : '🔗 Copy Link'}
                    </button>
                    <button onClick={() => handleDelete(file.id)} className="btn-delete">🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
