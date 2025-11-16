import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects`);
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading projects:', error);
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/projects`, newProject);
      setNewProject({ name: '', description: '' });
      setShowNewProject(false);
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Your Projects</h1>
        <button className="btn-primary" onClick={() => setShowNewProject(true)}>
          + New Project
        </button>
      </div>

      {showNewProject && (
        <div style={{
          background: 'rgba(30, 30, 30, 0.8)',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Create New Project</h2>
          <form onSubmit={createProject}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Project Name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="Project Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn-primary">Create Project</button>
              <button type="button" className="btn-secondary" onClick={() => setShowNewProject(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <Link 
              key={project.id} 
              to={`/project/${project.id}`}
              className="project-card"
            >
              <div className="project-card-header">
                <div style={{ fontSize: '2rem' }}>🎬</div>
              </div>
              <h3 className="project-name">{project.name}</h3>
              <p className="project-description">
                {project.description || 'No description'}
              </p>
              <div className="project-meta">
                <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
