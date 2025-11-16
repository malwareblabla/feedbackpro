# 🎬 FeedbackPro

Professional project review and feedback system similar to Frame.io and Filestage.

## 🚀 Features

### Core Features (MVP)
- ✅ **Multi-format Support**: Videos, images, and PDFs
- ✅ **Real-time Comments**: Live commenting with Socket.io
- ✅ **Timestamp Comments**: Add comments at specific video timestamps
- ✅ **Drawing Annotations**: Draw directly on images and paused video frames
- ✅ **Position Markers**: Click to mark specific positions on images
- ✅ **Project Management**: Organize files into projects
- ✅ **Drag & Drop Upload**: Easy file uploading
- ✅ **Version Control**: Track file versions

### Technical Stack

**Backend:**
- Node.js + Express
- SQLite database
- Socket.io for real-time features
- Multer for file uploads

**Frontend:**
- React 18
- Fabric.js for canvas drawing
- React Player for video playback
- Axios for API calls
- Socket.io client

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🎯 Usage

### Creating a Project
1. Click "+ New Project" on the dashboard
2. Enter project name and description
3. Click "Create Project"

### Uploading Files
1. Open a project
2. Drag and drop files or click the upload area
3. Supported formats: MP4, MOV, AVI (video), JPG, PNG, GIF (images), PDF

### Reviewing Files
1. Click on any file in a project
2. **For Videos:**
   - Play/pause the video
   - Click "Mark Time" to capture current timestamp
   - Add comments that link to specific moments
3. **For Images:**
   - Click "Draw" to enable drawing mode
   - Draw annotations directly on the image
   - Click on the image to mark a position
   - Add comments linked to positions
4. **For PDFs:**
   - Open in new tab for viewing

### Adding Comments
1. Enter your name (saved in browser)
2. Optionally:
   - Mark timestamp (video)
   - Draw annotations (video/image)
   - Click position (image)
3. Type your feedback
4. Click "Post Comment"

### Real-time Collaboration
- Comments appear instantly for all users viewing the same file
- Live updates when new files are uploaded

## 📁 Project Structure

```
feedbackpro/
├── backend/
│   ├── server.js           # Main Express server
│   ├── package.json        # Backend dependencies
│   ├── uploads/            # Uploaded files storage
│   └── feedbackpro.db      # SQLite database
│
└── frontend/
    ├── public/
    │   └── index.html      # HTML template
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.js    # Projects list
    │   │   ├── ProjectView.js  # Single project view
    │   │   └── FileReview.js   # File review interface
    │   ├── App.js          # Main app component
    │   ├── App.css         # Global styles
    │   └── index.js        # React entry point
    └── package.json        # Frontend dependencies
```

## 🗄️ Database Schema

### Projects
- `id` (TEXT, PRIMARY KEY)
- `name` (TEXT)
- `description` (TEXT)
- `created_at` (DATETIME)

### Files
- `id` (TEXT, PRIMARY KEY)
- `project_id` (TEXT, FOREIGN KEY)
- `filename` (TEXT)
- `original_name` (TEXT)
- `file_type` (TEXT) - 'video', 'image', or 'application'
- `file_size` (INTEGER)
- `version` (INTEGER)
- `created_at` (DATETIME)

### Comments
- `id` (TEXT, PRIMARY KEY)
- `file_id` (TEXT, FOREIGN KEY)
- `user_name` (TEXT)
- `content` (TEXT)
- `timestamp` (REAL) - video timestamp in seconds
- `x_position` (REAL) - image position X
- `y_position` (REAL) - image position Y
- `created_at` (DATETIME)

### Annotations
- `id` (TEXT, PRIMARY KEY)
- `comment_id` (TEXT, FOREIGN KEY)
- `drawing_data` (TEXT) - JSON data from Fabric.js
- `created_at` (DATETIME)

## 🚀 Next Steps for Production

### Phase 1: Enhanced MVP (1-2 months)
- [ ] User authentication (JWT)
- [ ] Team management & permissions
- [ ] Email notifications
- [ ] File versioning UI
- [ ] Enhanced PDF viewer
- [ ] Video thumbnail generation (FFmpeg)
- [ ] Search & filter

### Phase 2: Business Features (2-3 months)
- [ ] Approval workflow
- [ ] Status tracking (pending, approved, rejected)
- [ ] @mentions in comments
- [ ] Reply threads
- [ ] File comparison view
- [ ] Export comments as PDF
- [ ] Activity timeline

### Phase 3: Scale & Monetization (3-6 months)
- [ ] Cloud storage integration (AWS S3)
- [ ] CDN for file delivery
- [ ] Video transcoding
- [ ] Mobile apps (React Native)
- [ ] API for integrations
- [ ] Slack/Teams integration
- [ ] White-label option

## 💰 Business Model

### Freemium Tiers

**Free**
- 5GB storage
- 2 projects
- Unlimited collaborators
- Basic features

**Pro ($29/month)**
- 100GB storage
- Unlimited projects
- Priority support
- Advanced annotations
- Version history

**Team ($99/month)**
- 500GB storage
- Team management
- Custom branding
- API access
- SSO integration

**Enterprise (Custom)**
- Unlimited storage
- White-label
- On-premise option
- Dedicated support
- SLA guarantee

## 🎯 Target Market

### Primary Audience
1. **Video Production Studios** - Review dailies, rough cuts
2. **Marketing Agencies** - Client feedback on campaigns
3. **Design Teams** - Design review and iteration
4. **E-learning Companies** - Course content review

### Go-to-Market Strategy
1. **Product Hunt launch** - Generate initial buzz
2. **Content marketing** - "How to streamline creative feedback"
3. **Free trial** - 14 days, no credit card
4. **Partnerships** - Integrate with popular tools (Asana, Monday.com)
5. **Affiliate program** - 20% recurring commission

## 🛠️ Development Tips

### Adding New File Types
1. Update `file_type` detection in backend
2. Add renderer in `FileReview.js`
3. Update file icons in `ProjectView.js`

### Customizing Drawing Tools
Edit Fabric.js configuration in `FileReview.js`:
```javascript
canvas.freeDrawingBrush.color = '#667eea';
canvas.freeDrawingBrush.width = 3;
```

### Changing Storage Location
Modify multer configuration in `server.js`:
```javascript
destination: (req, file, cb) => {
  cb(null, 'your-custom-path/');
}
```

## 📝 API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project with files

### Files
- `POST /api/projects/:id/upload` - Upload file
- `GET /api/files/:id` - Get file with comments

### Comments
- `POST /api/files/:id/comments` - Add comment

### WebSocket Events
- `join-file` - Join file room
- `comment-added` - New comment notification
- `file-uploaded` - New file notification

## 🐛 Troubleshooting

**Backend won't start:**
- Check if port 5000 is available
- Ensure Node.js version is 16+

**Frontend can't connect to backend:**
- Verify backend is running on port 5000
- Check CORS settings in `server.js`

**Files won't upload:**
- Check uploads directory permissions
- Verify file size limits (default 500MB)

**Drawing not working:**
- Ensure Fabric.js is properly loaded
- Check canvas initialization in console

## 📄 License

MIT License - Feel free to use for commercial projects

## 🤝 Contributing

This is a starter template. Fork and customize for your needs!

## 📞 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ for creative teams who deserve better feedback tools**
