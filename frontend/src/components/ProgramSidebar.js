import React from 'react';
import './ProgramSidebar.css';

const ProgramSidebar = ({
  programs = [
    'BS Computer Science',
    'BS Information Technology',
    'BS Information Systems',
    'BS Entertainment and Multimedia Computing'
  ],
  selectedProgram = 'BS Computer Science',
  onProgramSelect,
  onAddSection,
  totalCount = 0,
  countLabel = 'Items'
}) => {
  return (
    <div className="program-sidebar">
      <div className="program-sidebar-header">
        <h3>Programs</h3>
      </div>
      
      <div className="program-list">
        {programs.map((program) => (
          <div
            key={program}
            className={`program-item ${selectedProgram === program ? 'active' : ''}`}
            onClick={() => onProgramSelect(program)}
          >
            {program}
          </div>
        ))}
      </div>

      <div className="program-sidebar-actions">
        <button className="btn-add-section" onClick={onAddSection}>
          Add New Section
        </button>
      </div>

      <div className="program-info">
        <div className="program-info-item">
          <div className="program-info-label">{selectedProgram}</div>
          <div className="program-info-value">Total {countLabel}: {totalCount}</div>
        </div>
      </div>
    </div>
  );
};

export default ProgramSidebar;
