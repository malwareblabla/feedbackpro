import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { fabric } from 'fabric';
import ReactPlayer from 'react-player';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

function FileReview() {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const playerRef = useRef(null);
  const imageRef = useRef(null);
  
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
    if (file && (file.file_type === 'image' || file.file_type === 'video')) {
      setTimeout(() => {
        initCanvas();
      }, 500);
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
    if (!canvasRef.current || fabricCanvasRef.current) return;

    // Get image/video dimensions
    let width = 800;
    let height = 600;
    
    if (imageRef.current) {
      width = imageRef.current.offsetWidth;
      height = imageRef.current.offsetHeight;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: width,
      height: height,
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

  const changeColor = (color) => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
      fabricCanvasRef.current._isErasing = false;
    }
  };

  const changeBrushSize = (size) => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.freeDrawingBrush.width = parseInt(size);
    }
  };

  const toggleEraser = () => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      
      if (canvas._isErasing) {
        canvas.freeDrawingBrush.color = canvas._lastColor || '#667eea';
        canvas.freeDrawingBrush.width = 3;
        canvas._isErasing = false;
      } else {
        canvas._lastColor = canvas.freeDrawingBrush.color;
        canvas.freeDrawingBrush.color = '#ffffff';
        canvas.freeDrawingBrush.width = 20;
        canvas._isErasing = true;
      }
    }
  };

  const undo = () => {
    if (fabricCanvasRef.current) {
      const objects = fabricCanvasRef.current.getObjects();
      if (objects.length > 0) {
        fabricCanvasRef.current.remove(objects[objects.length - 1]);
        fabricCanvasRef.current.renderAll();
      }
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

  const captureCurrentTime = () => {
    if (playerRef.current && file.file_type === 'video') {
      const time = playerRef.current.getCurrentTime();
      setCurrentTimestamp(time);
    }
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
      setCurrentTimestamp(null);
      clearCanvas();
      setDrawingMode(false);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.isDrawingMode = false;
      }
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
                ref={imageRef}
                src={fileUrl} 
                alt={file.original_name}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
                onLoad={() => initCanvas()}
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
              <div className={`canvas-overlay ${drawingMode ? 'active' : ''}`}>
                <canvas ref={canvasRef} />
              </div>
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
                    {new Date(comment.created_at).toLocaleString()}
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
                  ✏️ {drawingMode ? 'Stop' : 'Draw'}
                </button>
                
                {drawingMode && (
                  <>
                    <select 
                      className="tool-btn"
                      onChange={(e) => changeColor(e.target.value)}
                      defaultValue="#667eea"
                    >
                      <option value="#667eea">🟣 Purple</option>
                      <option value="#ff0000">🔴 Red</option>
                      <option value="#00ff00">🟢 Green</option>
                      <option value="#0000ff">🔵 Blue</option>
                      <option value="#ffff00">🟡 Yellow</option>
                      <option value="#000000">⚫ Black</option>
                    </select>
                    
                    <button className="tool-btn" onClick={toggleEraser}>
                      🧹 Eraser
                    </button>
                    
                    <select 
                      className="tool-btn"
                      onChange={(e) => changeBrushSize(e.target.value)}
                      defaultValue="3"
                    >
                      <option value="1">⚪ Thin</option>
                      <option value="3">⚫ Normal</option>
                      <option value="5">⬤ Thick</option>
                      <option value="10">⚫⚫ Very Thick</option>
                    </select>
                  </>
                )}
                
                <button className="tool-btn" onClick={undo}>
                  ↩️ Undo
                </button>
                
                <button className="tool-btn" onClick={clearCanvas}>
                  🗑️ Clear
                </button>
              </div>
            )}

            {file.file_type === 'video' && (
              <button 
                type="button"
                className="btn-secondary"
                onClick={captureCurrentTime}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                ⏱️ Mark Current Time
              </button>
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
