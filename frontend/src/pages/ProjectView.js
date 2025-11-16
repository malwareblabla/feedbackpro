import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ProjectView() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/${projectId}`);
      setProject(response.data);
      setFiles(response.data.files || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading project:', error);
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    await uploadFiles(droppedFiles);
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await uploadFiles(selectedFiles);
  };

  const uploadFiles = async (filesToUpload) => {
    setUploading(true);
    
    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        await axios.post(`${API_URL}/projects/${projectId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    setUploading(false);
    loadProject();
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'video': return '🎥';
      case 'image': return '🖼️';
      case 'application': return '📄';
      default: return '📁';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="loading">Loading project...</div>;
  }

  if (!project) {
    return <div className="empty-state">Project not found</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: '#667eea', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
          ← Back to Dashboard
        </Link>
        <h1 className="dashboard-title">{project.name}</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>
          {project.description}
        </p>
      </div>

      <div
        className={`upload-area ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="upload-icon">☁️</div>
        <div className="upload-text">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </div>
        <div className="upload-hint">
          Supports videos, images, and PDFs up to 500MB
        </div>
        <input
          id="file-input"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="video/*,image/*,.pdf"
        />
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>No files yet. Upload your first file to start reviewing!</p>
        </div>
      ) : (
        <div className="files-grid">
          {files.map(file => (
            <Link 
              key={file.id}
              to={`/review/${file.id}`}
              className="file-card"
            >
              <div className="file-thumbnail">
                {getFileIcon(file.file_type)}
              </div>
              <div className="file-info">
                <div className="file-name">{file.original_name}</div>
                <div className="file-meta">
                  <span>{file.file_type}</span>
                  <span>{formatFileSize(file.file_size)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectView;
