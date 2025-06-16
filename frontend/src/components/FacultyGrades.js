import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FacultyGrades.module.css';
import Sidebar from './FacultySidebar';

const FacultyGrades = () => {
  
  const programs = [
    'Computer Science',
    'Information Technology',
    'Business Administration',
    'Engineering',
    'Psychology',
  ];

  const sections = [
    'All Sections',
    'CS-101-A',
    'CS-201-B', 
    'IT-201-B',
    'IT-301-A',
    'BA-105-A',
    'BA-201-C',
    'ENG-102-C',
    'PSY-101-A'
  ];

  const [selectedProgram, setSelectedProgram] = useState(programs[0]);
  const [selectedSection, setSelectedSection] = useState(sections[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStudents, setShowStudents] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  const [gradesList, setGradesList] = useState([
    {
      id: 'GRD001', 
      course: 'Computer Programming I', 
      section: 'CS-101-A', 
      creditUnits: 3,
      program: 'Computer Science', 
      status: 'Completed',
      students: [
        { id: 'STU001', name: 'John Doe', midterm: 85, final: 88, overall: 86.5 },
        { id: 'STU002', name: 'Jane Smith', midterm: 92, final: 90, overall: 91 },
        { id: 'STU003', name: 'Mike Johnson', midterm: 78, final: 82, overall: 80 }
      ]
    },
    {
      id: 'GRD006', 
      course: 'Data Structures', 
      section: 'CS-201-B', 
      creditUnits: 3,
      program: 'Computer Science', 
      status: 'Ongoing',
      students: [
        { id: 'STU012', name: 'Kevin Wang', midterm: 88, final: null, overall: null },
        { id: 'STU013', name: 'Amy Liu', midterm: 85, final: null, overall: null }
      ]
    }
  ]);

  const [studentsGrades, setStudentsGrades] = useState({});

  const filteredGrades = gradesList.filter(grade => {
    const matchesSearch = grade.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = grade.program === selectedProgram;
    const matchesSection = selectedSection === 'All Sections' || grade.section === selectedSection;
    return matchesSearch && matchesProgram && matchesSection;
  });

  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setShowStudents(false);
    setSelectedCourse(null);
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const handleRowClick = (course) => {
    setSelectedCourse(course);
    setShowStudents(true);
  };

  const handleBackToCourses = () => {
    setShowStudents(false);
    setSelectedCourse(null);
  };

  const handleGradeChange = (studentId, field, value) => {
    setStudentsGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleSaveGrades = (studentId, studentName) => {
    alert(`Grades saved successfully for ${studentName} (${studentId})!`);
  };
  
  const navigate = useNavigate();
  const showSection = (section) => {
    switch(section){
      case 'FacultyDashboard':
        navigate('/faculty-dashboard');
        break;
      case 'FacultySchedule':
        navigate('/faculty-schedule');
        break;
        case 'FacultyGrades':
          navigate('/faculty-grades');
        break;
      case 'FacultySettings':
        navigate('/faculty-settings');
        break;
      default:
        // No action for unknown sections
    }
  };

  if (showStudents && selectedCourse) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar 
        onNavigate={showSection}
        userInfo={{ name: "John Smith", role: "Student" }}
        sections={[
          {
            items: [{ id: 'FacultyDashboard', label: 'Dashboard', icon: '📊' }]
          },
          {
            label: 'Management',
            items: [
              { id: 'FacultySchedule', label: 'Schedule', icon: '📅' },
              { id: 'FacultyGrades', label: 'Grades', icon: '📈' }
            ]
          },
          {
            label: 'System',
            items: [
              { id: 'FacultySettings', label: 'Settings', icon: '⚙️'}
            ]
          }
        ]}
      />

        <div className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.breadcrumb}>
              <span className={styles.breadcrumbLink} onClick={() => navigate('/student-dashboard')}>Dashboard</span>
              <span className={styles.breadcrumbSeparator}> / </span>
              <span className={styles.breadcrumbLink} onClick={handleBackToCourses}>My Grades</span>
              <span className={styles.breadcrumbSeparator}> / </span>
              <span className={styles.breadcrumbCurrent}>{selectedCourse.course}</span>
            </div>
            
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>
                <button 
                  onClick={handleBackToCourses}
                  style={{background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', marginRight: '16px'}}
                >
                  ← Back
                </button>
                {selectedCourse.course} - {selectedCourse.section}
              </h1>
            </div>

            <div className={styles.gradesListContainer}>
              <div className={styles.listHeader}>
                <div className={styles.listControls}>
                  <h2 className={styles.listTitle}>Student Grades</h2>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.gradesTable}>
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Midterm Grade</th>
                      <th>Final Grade</th>
                      <th>Overall Grade</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                    <tbody>
                      {selectedCourse.students.map((student) => (
                        <tr key={student.id}>
                          <td><div className={`${styles.cellContent} ${styles.cellCentered}`}><span className={styles.courseCode}>{student.id}</span></div></td>
                          <td><div className={styles.cellContent}>{student.name}</div></td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <input
                                type="number" min="0" max="100"
                                defaultValue={student.midterm ?? ''}
                                onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)}
                                style={{width: '80px', textAlign: 'center', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da'}}
                              />
                            </div>
                          </td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <input
                                type="number" min="0" max="100"
                                defaultValue={student.final ?? ''}
                                onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)}
                                disabled={selectedCourse.status === 'Ongoing'}
                                style={{width: '80px', textAlign: 'center', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da'}}
                              />
                            </div>
                          </td>
                          <td><div className={`${styles.cellContent} ${styles.cellCentered} ${styles.gradeScore}`}>{student.overall?.toFixed(1) ?? '-'}</div></td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <button 
                                onClick={() => handleSaveGrades(student.id, student.name)}
                                style={{backgroundColor: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}}
                              >
                                Save
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar 
        onNavigate={showSection}
        userInfo={{ name: "John Smith", role: "Student" }}
        sections={[
            { items: [{ id: 'StudentDashboard', label: 'Dashboard', icon: '📊' }] },
            { label: 'Management', items: [
                { id: 'StudentSchedule', label: 'Schedule', icon: '📅' },
                { id: 'Enrollment', label: 'Enrollment', icon: '📝' },
                { id: 'StudentCurriculum', label: 'Curriculum', icon: '📚' },
                { id: 'StudentGrades', label: 'Grades', icon: '📈' }
            ]},
            { label: 'System', items: [{ id: 'StudentSettings', label: 'Settings', icon: '⚙️'}]}
        ]}
      />

      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => navigate('/student-dashboard')}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}> / </span>
            <span className={styles.breadcrumbCurrent}>Grades</span>
          </div>
          
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Academic Records</h1>
          </div>

          <div className={styles.studentContentWrapper}>
            <div className={styles.studentNavSection}>
              <div className={styles.studentNavHeader}>
                <h2 className={styles.studentNavTitle}>Programs</h2>
                <div className={styles.semesterCurrentInfo}>
                  Academic Programs Available
                </div>
              </div>
              <div className={styles.studentNavList}>
                {programs.map((program) => (
                  <div
                    key={program}
                    className={`${styles.studentNavItem} ${selectedProgram === program ? styles.studentNavItemActive : ''}`}
                    onClick={() => handleProgramSelect(program)}
                  >
                    <div className={styles.semesterInfo}>
                      <div className={styles.semesterMain}>{program}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.studentNavInfo}>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Selected Program</div>
                  <div className={styles.studentNavInfoValue}>{selectedProgram}</div>
                </div>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Courses Found</div>
                  <div className={styles.studentNavInfoValue}>{filteredGrades.length}</div>
                </div>
              </div>
            </div>

            <div className={styles.gradesListContainer}>
              <div className={styles.listHeader}>
                <div className={styles.listControls}>
                  <h2 className={styles.listTitle}>Academic Records</h2>
                  <div className={styles.controls}>
                    <select
                      value={selectedSection}
                      onChange={handleSectionChange}
                      className={styles.selectInput}
                    >
                      {sections.map((section) => (
                        <option key={section} value={section}>
                          {section}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.gradesTable}>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course & Section</th>
                      <th>Units</th>
                      <th>Instructor</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                      {filteredGrades.map((grade) => (
                        <tr 
                          key={grade.id} 
                          onClick={() => handleRowClick(grade)}
                          className={styles.clickableRow}
                        >
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <div className={styles.courseCode}>{grade.id}</div>
                            </div>
                          </td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <div className={styles.courseInfo}>
                                <div className={styles.courseName}>{grade.course}</div>
                                <div className={styles.courseSection}>{grade.section}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered} ${styles.creditUnits}`}>
                              {grade.creditUnits}
                            </div>
                          </td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered} ${styles.instructorName}`}>
                              Dr. Alan Turing
                            </div>
                          </td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <span className={`${styles.remarksBadge} ${grade.status === 'Completed' ? styles.remarksPassed : styles.remarksProgress}`}>
                                {grade.status}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <div className={styles.tableInfo}>
                  Showing {filteredGrades.length} courses
                </div>
                <div className={styles.pagination}>
                  <button className={`${styles.pageBtn} ${styles.disabled}`}>Previous</button>
                  <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                  <button className={styles.pageBtn}>Next</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyGrades;