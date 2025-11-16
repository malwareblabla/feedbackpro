import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { fabric } from 'fabric';
import ReactPlayer from 'react-player';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

function FileReview() {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState('pencil');
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const playerRef = useRef(null);
  
  // Comment form state
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [commentText, setCommentText] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  
  // Socket.io
  const socketRef = useRef(null);

  useEffect(() => {
    loadFile();
    
    // Setup Socket.io
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('join-file', fileId);
    
    socketRef.current.on('comment-added', (newComment) => {
      if (newComment.file_id === fileId) {
        setComments(prev => [...prev, newComment]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [fileId]);

  useEffect(() => {
    if (file && canvasRef.current && !fabricCanvasRef.current) {
      initCanvas();
    }
  }, [file]);

  const loadFile = async () => {
    try {
      const response = await axios.get(`${API_URL}/files/${fileId}`);
      setFile(response.data);
      setComments(response.data.comments || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading file:', error);
      setLoading(false);
    }
  };

  const initCanvas = () => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: 800,
      height: 600,
      backgroundColor: 'transparent'
    });
    
    canvas.freeDrawingBrush.color = '#667eea';
    canvas.freeDrawingBrush.width = 3;
    
    fabricCanvasRef.current = canvas;

    canvas.on('mouse:down', (e) => {
      if (!drawingMode && file.file_type === 'image') {
        const pointer = canvas.getPointer(e.e);
        setCurrentPosition({ x: pointer.x, y: pointer.y });
      }
    });
  };

  const toggleDrawing = () => {
    if (fabricCanvasRef.current) {
      const newDrawingMode = !drawingMode;
      setDrawingMode(newDrawingMode);
      fabricCanvasRef.current.isDrawingMode = newDrawingMode;
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = 'transparent';
      fabricCanvasRef.current.renderAll();
    }
  };

  const captureDrawing = () => {
    if (fabricCanvasRef.current) {
      const objects = fabricCanvasRef.current.getObjects();
      if (objects.length > 0) {
        return fabricCanvasRef.current.toJSON();
      }
    }
    return null;
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;

    localStorage.setItem('userName', userName);

    const drawingData = captureDrawing();
    
    const commentData = {
      user_name: userName,
      content: commentText,
      timestamp: file.file_type === 'video' && playerRef.current 
        ? playerRef.current.getCurrentTime() 
        : null,
      x_position: currentPosition?.x,
      y_position: currentPosition?.y,
      drawing_data: drawingData
    };

    try {
      await axios.post(`${API_URL}/files/${fileId}/comments`, commentData);
      setCommentText('');
      setCurrentPosition(null);
      clearCanvas();
      setDrawingMode(false);
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const seekToTimestamp = (timestamp) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timestamp);
    }
  };

  const formatTimestamp = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const captureCurrentTime = () => {
    if (playerRef.current && file.file_type === 'video') {
      const time = playerRef.current.getCurrentTime();
      setCurrentTimestamp(time);
    }
  };

  if (loading) {
    return <div className="loading">Loading file...</div>;
  }

  if (!file) {
    return <div className="empty-state">File not found</div>;
  }

  const fileUrl = `${API_URL.replace('/api', '')}${file.url}`;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link 
          to={`/project/${file.project_id}`}
          style={{ color: '#667eea', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}
        >
          ← Back to Project
        </Link>
        <h1 className="dashboard-title">{file.original_name}</h1>
      </div>

      <div className="review-container">
        <div className="media-viewer">
          <div className="canvas-container">
            {file.file_type === 'video' ? (
              <ReactPlayer
                ref={playerRef}
                url={fileUrl}
                controls
                width="100%"
                height="100%"
                style={{ maxHeight: '70vh' }}
              />
            ) : file.file_type === 'image' ? (
              <img 
                src={fileUrl} 
                alt={file.original_name}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
                <p>PDF Viewer</p>
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-block', marginTop: '1rem' }}
                >
                  Open PDF
                </a>
              </div>
            )}
            
            {(file.file_type === 'image' || file.file_type === 'video') && (
              <canvas 
                ref={canvasRef}
                className="drawing-canvas"
                style={{ 
                  pointerEvents: drawingMode ? 'auto' : 'none',
                  opacity: drawingMode ? 1 : 0.5
                }}
              />
            )}
          </div>
        </div>

        <div className="comments-panel">
          <div className="comments-header">
            <span>Comments ({comments.length})</span>
          </div>

          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-user">{comment.user_name}</span>
                  <span className="comment-time">
                    {new Date(comment.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="comment-content">{comment.content}</div>
                {comment.timestamp !== null && (
                  <span 
                    className="comment-timestamp"
                    onClick={() => seekToTimestamp(comment.timestamp)}
                    style={{ cursor: 'pointer' }}
                  >
                    ⏱️ {formatTimestamp(comment.timestamp)}
                  </span>
                )}
                {(comment.x_position !== null || comment.y_position !== null) && (
                  <span className="comment-timestamp">
                    📍 Position marked
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="comment-form">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Add Comment</h3>
            
            {(file.file_type === 'image' || file.file_type === 'video') && (
              <div className="drawing-tools">
                <button 
                  className={`tool-btn ${drawingMode ? 'active' : ''}`}
                  onClick={toggleDrawing}
                >
                  ✏️ {drawingMode ? 'Drawing' : 'Draw'}
                </button>
                <button className="tool-btn" onClick={clearCanvas}>
                  🗑️ Clear
                </button>
                {file.file_type === 'video' && (
                  <button className="tool-btn" onClick={captureCurrentTime}>
                    ⏱️ Mark Time
                  </button>
                )}
              </div>
            )}

            {currentTimestamp !== null && (
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.2)', 
                padding: '0.5rem', 
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                ⏱️ Timestamp: {formatTimestamp(currentTimestamp)}
              </div>
            )}

            {currentPosition && (
              <div style={{ 
                background: 'rgba(102, 126, 234, 0.2)', 
                padding: '0.5rem', 
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                📍 Position marked on image
              </div>
            )}

            <form onSubmit={handleSubmitComment}>
              <div className="form-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  placeholder="Add your feedback..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Post Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileReview;
