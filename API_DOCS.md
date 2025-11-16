# 🔧 API Documentation & Extension Guide

## REST API Endpoints

### Base URL
```
http://localhost:5000/api
```

---

## Projects

### List all projects
```http
GET /api/projects
```

**Response:**
```json
[
  {
    "id": "uuid-here",
    "name": "Project Name",
    "description": "Project description",
    "created_at": "2025-01-15T10:30:00Z"
  }
]
```

### Create project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "id": "new-uuid",
  "name": "New Project",
  "description": "Optional description"
}
```

### Get project details
```http
GET /api/projects/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Project Name",
  "description": "Description",
  "created_at": "2025-01-15T10:30:00Z",
  "files": [
    {
      "id": "file-uuid",
      "filename": "stored-name.mp4",
      "original_name": "my-video.mp4",
      "file_type": "video",
      "file_size": 15728640,
      "version": 1,
      "created_at": "2025-01-15T11:00:00Z"
    }
  ]
}
```

---

## Files

### Upload file
```http
POST /api/projects/:id/upload
Content-Type: multipart/form-data

file: [binary data]
```

**Response:**
```json
{
  "id": "file-uuid",
  "project_id": "project-uuid",
  "filename": "stored-name.mp4",
  "original_name": "my-video.mp4",
  "file_type": "video",
  "file_size": 15728640,
  "url": "/uploads/stored-name.mp4"
}
```

### Get file details
```http
GET /api/files/:id
```

**Response:**
```json
{
  "id": "file-uuid",
  "project_id": "project-uuid",
  "filename": "stored-name.mp4",
  "original_name": "my-video.mp4",
  "file_type": "video",
  "file_size": 15728640,
  "url": "/uploads/stored-name.mp4",
  "comments": [
    {
      "id": "comment-uuid",
      "file_id": "file-uuid",
      "user_name": "John Doe",
      "content": "Great work!",
      "timestamp": 15.5,
      "x_position": null,
      "y_position": null,
      "created_at": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

## Comments

### Add comment
```http
POST /api/files/:id/comments
Content-Type: application/json

{
  "user_name": "John Doe",
  "content": "This needs adjustment",
  "timestamp": 30.5,           // Optional: for video
  "x_position": 250,            // Optional: for images
  "y_position": 300,            // Optional: for images
  "drawing_data": {             // Optional: Fabric.js JSON
    "version": "5.3.0",
    "objects": [...]
  }
}
```

**Response:**
```json
{
  "id": "comment-uuid",
  "file_id": "file-uuid",
  "user_name": "John Doe",
  "content": "This needs adjustment",
  "timestamp": 30.5,
  "x_position": 250,
  "y_position": 300
}
```

---

## WebSocket Events

### Connect
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
```

### Join file room
```javascript
socket.emit('join-file', fileId);
```

### Listen for new comments
```javascript
socket.on('comment-added', (comment) => {
  console.log('New comment:', comment);
  // Update UI
});
```

### Listen for new files
```javascript
socket.on('file-uploaded', (file) => {
  console.log('New file:', file);
  // Update UI
});
```

---

## 🚀 Extension Ideas

### 1. User Authentication

**Add to backend/server.js:**
```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Save to database
  db.run(
    'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
    [uuidv4(), email, hashedPassword, name],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id }, 'your-secret-key', { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  });
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Protect routes
app.get('/api/projects', authenticateToken, (req, res) => {
  // Your existing code
});
```

### 2. Email Notifications

**Install nodemailer:**
```bash
npm install nodemailer
```

**Add to backend/server.js:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendCommentNotification(file, comment) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: file.project_owner_email, // Add this field
    subject: `New comment on ${file.original_name}`,
    html: `
      <h2>New Feedback</h2>
      <p><strong>${comment.user_name}</strong> commented:</p>
      <p>${comment.content}</p>
      <a href="http://yourdomain.com/review/${file.id}">View File</a>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Call after adding comment
sendCommentNotification(file, comment);
```

### 3. Version Control

**Update database schema:**
```javascript
db.run(`ALTER TABLE files ADD COLUMN parent_version_id TEXT`);

// Upload new version
app.post('/api/files/:id/new-version', upload.single('file'), (req, res) => {
  const { id } = req.params; // Parent file ID
  const file = req.file;
  
  // Get current version number
  db.get('SELECT version FROM files WHERE id = ?', [id], (err, parent) => {
    const newVersion = parent.version + 1;
    const fileId = uuidv4();
    
    db.run(
      'INSERT INTO files (id, project_id, filename, original_name, file_type, file_size, version, parent_version_id) SELECT ?, project_id, ?, ?, ?, ?, ?, ? FROM files WHERE id = ?',
      [fileId, file.filename, file.originalname, file.mimetype.split('/')[0], file.size, newVersion, id, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: fileId, version: newVersion });
      }
    );
  });
});
```

### 4. Approval Workflow

**Add status to files:**
```javascript
db.run(`ALTER TABLE files ADD COLUMN status TEXT DEFAULT 'pending'`);

// Approve file
app.post('/api/files/:id/approve', (req, res) => {
  const { id } = req.params;
  const { approver_name } = req.body;
  
  db.run(
    'UPDATE files SET status = "approved" WHERE id = ?',
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Log approval
      db.run(
        'INSERT INTO approvals (id, file_id, approver_name, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [uuidv4(), id, approver_name]
      );
      
      res.json({ status: 'approved' });
    }
  );
});

// Reject file
app.post('/api/files/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  db.run(
    'UPDATE files SET status = "rejected" WHERE id = ?',
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ status: 'rejected' });
    }
  );
});
```

### 5. Video Transcoding (FFmpeg)

**Install fluent-ffmpeg:**
```bash
npm install fluent-ffmpeg
```

**Add to backend/server.js:**
```javascript
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// Generate thumbnail
function generateThumbnail(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: ['00:00:01'],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '320x240'
      })
      .on('end', resolve)
      .on('error', reject);
  });
}

// After file upload
if (fileType === 'video') {
  const thumbnailPath = `uploads/thumb_${fileId}.jpg`;
  await generateThumbnail(`uploads/${file.filename}`, thumbnailPath);
  
  db.run(
    'UPDATE files SET thumbnail = ? WHERE id = ?',
    [thumbnailPath, fileId]
  );
}
```

### 6. Cloud Storage (AWS S3)

**Install AWS SDK:**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Replace local storage:**
```javascript
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function uploadToS3(file) {
  const fileStream = fs.createReadStream(file.path);
  
  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/${file.filename}`,
    Body: fileStream,
    ContentType: file.mimetype
  };
  
  await s3Client.send(new PutObjectCommand(uploadParams));
  
  // Delete local file
  fs.unlinkSync(file.path);
  
  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/uploads/${file.filename}`;
}

// In upload endpoint
const s3Url = await uploadToS3(req.file);
```

### 7. Slack Integration

**Install Slack SDK:**
```bash
npm install @slack/web-api
```

**Send notifications to Slack:**
```javascript
const { WebClient } = require('@slack/web-api');

const slack = new WebClient(process.env.SLACK_TOKEN);

async function notifySlack(channelId, file, comment) {
  await slack.chat.postMessage({
    channel: channelId,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*New Comment on ${file.original_name}*\n>${comment.content}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View File' },
            url: `http://yourdomain.com/review/${file.id}`
          }
        ]
      }
    ]
  });
}
```

---

## 🧪 Testing Examples

### Unit Test Example (Jest)
```javascript
// __tests__/api.test.js
const request = require('supertest');
const app = require('../server');

describe('Projects API', () => {
  it('should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        name: 'Test Project',
        description: 'Test Description'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Project');
  });
  
  it('should list all projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

---

## 📊 Analytics Integration

**Add Google Analytics to frontend:**
```javascript
// src/utils/analytics.js
export const trackEvent = (category, action, label) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
};

// Usage
trackEvent('File', 'Upload', fileType);
trackEvent('Comment', 'Add', 'WithTimestamp');
```

---

## 🔐 Security Best Practices

1. **Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

2. **File Validation:**
```javascript
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'image/jpeg', 'image/png', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ storage, fileFilter });
```

3. **Sanitize Inputs:**
```javascript
const validator = require('validator');

app.post('/api/projects', (req, res) => {
  const name = validator.escape(req.body.name);
  const description = validator.escape(req.body.description);
  // Use sanitized values
});
```

---

**Need more examples? Check the GitHub repository or contact support!**
