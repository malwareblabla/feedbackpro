const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Database setup
const db = new sqlite3.Database('./feedbackpro.db', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp REAL,
    x_position REAL,
    y_position REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS annotations (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL,
    drawing_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (comment_id) REFERENCES comments(id)
  )`);
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Routes

// Get all projects
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create new project
app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  const id = uuidv4();

  db.run(
    'INSERT INTO projects (id, name, description) VALUES (?, ?, ?)',
    [id, name, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id, name, description });
    }
  );
});

// Get project by ID
app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM projects WHERE id = ?', [id], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.all('SELECT * FROM files WHERE project_id = ? ORDER BY created_at DESC', [id], (err, files) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ ...project, files });
    });
  });
});

// Upload file to project
app.post('/api/projects/:id/upload', upload.single('file'), (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileId = uuidv4();
  const fileType = file.mimetype.split('/')[0]; // video, image, application

  db.run(
    'INSERT INTO files (id, project_id, filename, original_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)',
    [fileId, id, file.filename, file.originalname, fileType, file.size],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const fileData = {
        id: fileId,
        project_id: id,
        filename: file.filename,
        original_name: file.originalname,
        file_type: fileType,
        file_size: file.size,
        url: `/uploads/${file.filename}`
      };

      io.emit('file-uploaded', fileData);
      res.json(fileData);
    }
  );
});

// Get file details
app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM files WHERE id = ?', [id], (err, file) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    db.all('SELECT * FROM comments WHERE file_id = ? ORDER BY created_at ASC', [id], (err, comments) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ ...file, url: `/uploads/${file.filename}`, comments });
    });
  });
});

// Add comment to file
app.post('/api/files/:id/comments', (req, res) => {
  const { id } = req.params;
  const { user_name, content, timestamp, x_position, y_position, drawing_data } = req.body;
  
  const commentId = uuidv4();

  db.run(
    'INSERT INTO comments (id, file_id, user_name, content, timestamp, x_position, y_position) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [commentId, id, user_name, content, timestamp || null, x_position || null, y_position || null],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const commentData = {
        id: commentId,
        file_id: id,
        user_name,
        content,
        timestamp,
        x_position,
        y_position
      };

      // Save annotation if provided
      if (drawing_data) {
        const annotationId = uuidv4();
        db.run(
          'INSERT INTO annotations (id, comment_id, drawing_data) VALUES (?, ?, ?)',
          [annotationId, commentId, JSON.stringify(drawing_data)],
          (err) => {
            if (err) console.error('Error saving annotation:', err);
          }
        );
        commentData.drawing_data = drawing_data;
      }

      io.emit('comment-added', commentData);
      res.json(commentData);
    }
  );
});

// Socket.io real-time events
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-file', (fileId) => {
    socket.join(`file-${fileId}`);
    console.log(`Client joined file: ${fileId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 FeedbackPro API running on http://localhost:${PORT}`);
});
