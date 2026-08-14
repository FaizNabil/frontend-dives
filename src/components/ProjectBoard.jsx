import '../styles/ProjectBoard.css';
import { 
  Search, Bell, Grid, Filter, ChevronDown, Plus, MoreHorizontal, Calendar 
} from 'lucide-react';
import CreateProjectModal from './CreateProjectModal';
import { useState } from 'react';

const API_URL = 'http://localhost:4000/api/projects';
const ProjectBoard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  return (
    <div className="board-wrapper">
      {/* --- TOP NAVBAR KHUSUS BOARD --- */}
      <header className="board-navbar">
        <h2>PROJECT WORKSPACE BOARD</h2>
        <div className="board-actions">
          <div className="search-box">
            <Search size={16} className="text-gray" />
            <input type="text" placeholder="Search projects..." />
          </div>
          <button className="icon-btn position-relative">
            <Bell size={20} />
            <span className="dot-indicator"></span>
          </button>
          <button className="icon-btn"><Grid size={20} /></button>
          <img src="https://i.pravatar.cc/150?img=11" alt="User" className="avatar" />
        </div>
      </header>

      {/* --- TOOLBAR (Filter & Create) --- */}
      <div className="board-toolbar">
        <div className="filter-group">
          <button className="toolbar-btn">
            <Filter size={14} /> Filter By: Active Status
          </button>
          <button className="toolbar-btn">
            Sort: Deadline <ChevronDown size={14} />
          </button>
        </div>
        <button className="create-new-btn"
        onClick={()=> setIsModalOpen(true)}
        >
          <Plus className='btn-click' 
          size={16} /> CREATE NEW PROJECT
        </button>
        
      </div>

      {/* --- KANBAN COLUMNS --- */}
      <div className="kanban-container">
        
        {/* Kolom 1: Design & Planning */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>DESIGN & PLANNING <span className="count">4</span></h3>
            <MoreHorizontal size={16} className="text-gray cursor-pointer" />
          </div>
          
          <div className="kanban-card">
            <div className="card-image bg-img-1"></div>
            <div className="card-body">
              <span className="badge badge-residential">RESIDENTIAL</span>
              <h4>Veridian Heights Phase II</h4>
              <p className="client-text">Client: Skyline Properties</p>
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>PROGRESS</span>
                  <span>45%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{width: '45%'}}></div></div>
              </div>
            </div>
            <div className="card-footer">
              <span className="date"><Calendar size={12} /> Aug 2026</span>
              <img src="https://i.pravatar.cc/150?img=12" alt="Assignee" className="assignee-avatar" />
            </div>
          </div>

          <div className="kanban-card">
            <div className="card-image bg-img-2"></div>
            <div className="card-body">
              <span className="badge badge-commercial">COMMERCIAL</span>
              <h4>Axis Tech Headquarters</h4>
              <p className="client-text">Client: Axis Global Corp</p>
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>PROGRESS</span>
                  <span>12%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{width: '12%'}}></div></div>
              </div>
            </div>
            <div className="card-footer">
              <span className="date"><Calendar size={12} /> Dec 2026</span>
              <img src="https://i.pravatar.cc/150?img=12" alt="Assignee" className="assignee-avatar" />
            </div>
          </div>

          <button className="add-task-btn"><Plus size={14} /> Add Task</button>
        </div>

        {/* Kolom 2: Procurement */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>PROCUREMENT <span className="count">3</span></h3>
            <MoreHorizontal size={16} className="text-gray cursor-pointer" />
          </div>
          
          <div className="kanban-card">
            <div className="card-image bg-img-3"></div>
            <div className="card-body">
              <span className="badge badge-commercial">COMMERCIAL</span>
              <h4>Grand Plaza Materials</h4>
              <p className="client-text">Client: Metropolis Dev</p>
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>PROGRESS</span>
                  <span>80%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{width: '80%'}}></div></div>
              </div>
            </div>
            <div className="card-footer">
              <span className="date"><Calendar size={12} /> Oct 2025</span>
              <img src="https://i.pravatar.cc/150?img=33" alt="Assignee" className="assignee-avatar" />
            </div>
          </div>
        </div>

        {/* Kolom 3: Construction */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>CONSTRUCTION <span className="count">5</span></h3>
            <MoreHorizontal size={16} className="text-gray cursor-pointer" />
          </div>
          
          <div className="kanban-card highlighted-card">
            <div className="card-image bg-img-4"></div>
            <div className="card-body">
              <span className="badge badge-commercial">COMMERCIAL</span>
              <h4>Central Hub Foundation</h4>
              <p className="client-text">Client: Federal Infrastructure</p>
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>PROGRESS</span>
                  <span>32%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{width: '32%'}}></div></div>
              </div>
            </div>
            <div className="card-footer">
              <span className="date"><Calendar size={12} /> Jan 2026</span>
              <img src="https://i.pravatar.cc/150?img=47" alt="Assignee" className="assignee-avatar" />
            </div>
          </div>

          <div className="kanban-card">
            <div className="card-image bg-img-5"></div>
            <div className="card-body">
              <span className="badge badge-residential">RESIDENTIAL</span>
              <h4>Skyline Towers B1</h4>
              <p className="client-text">Client: Elite Realty Group</p>
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>PROGRESS</span>
                  <span>68%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{width: '68%'}}></div></div>
              </div>
            </div>
            <div className="card-footer">
              <span className="date"><Calendar size={12} /> Mar 2026</span>
              <img src="https://i.pravatar.cc/150?img=47" alt="Assignee" className="assignee-avatar" />
            </div>
          </div>
        </div>

        {/* Kolom 4: Finishing */}
        <div className="kanban-column">
          <div className="column-header">
            <h3>FINISHING <span className="count">2</span></h3>
            <MoreHorizontal size={16} className="text-gray cursor-pointer" />
          </div>
          
          <div className="kanban-card">
            <div className="card-image bg-img-6"></div>
            <div className="card-body">
              <span className="badge badge-residential">RESIDENTIAL</span>
              <h4>The Onyx Penthouse</h4>
              <p className="client-text">Client: Private Investor</p>
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>PROGRESS</span>
                  <span>98%</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{width: '98%'}}></div></div>
              </div>
            </div>
            <div className="card-footer">
              <span className="date"><Calendar size={12} /> Sep 2024</span>
              <img src="https://i.pravatar.cc/150?img=11" alt="Assignee" className="assignee-avatar" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectBoard;