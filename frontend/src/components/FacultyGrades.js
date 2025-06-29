import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FacultyGrades.module.css';
import Sidebar from './FacultySidebar';
import { useFacultyData } from '../hooks/useFacultyData';
import { 
  courseSectionAPI, 
  programAPI, 
  enrolledCourseAPI,
  studentAPI 
} from '../services/api';

const FacultyGrades = () => {
  const { getUserInfo } = useFacultyData();
  const navigate = useNavigate();
  
  // State management
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState(['All Sections']);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSection, setSelectedSection] = useState('All Sections');
  const [searchTerm, setSearchTerm] = useState('');
  const [showStudents, setShowStudents] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [gradesList, setGradesList] = useState([]);
  const [studentsGrades, setStudentsGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState({});

  // Fetch initial data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch programs and course sections
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch programs
      const programsResponse = await programAPI.getAllPrograms();
      const programsData = programsResponse.data.data || programsResponse.data;
      setPrograms(programsData);
      
      if (programsData.length > 0) {
        setSelectedProgram(programsData[0].name || programsData[0].programName);
      }

      // Fetch all course sections
      const sectionsResponse = await courseSectionAPI.getAllSections();
      const sectionsData = sectionsResponse.data.data || sectionsResponse.data;
      
      // Extract unique section names
      const uniqueSections = ['All Sections', ...new Set(sectionsData.map(section => section.sectionName))];
      setSections(uniqueSections);

      // Process course sections into grades format
      const processedGrades = await processCourseSections(sectionsData);
      setGradesList(processedGrades);

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load course data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Process course sections and add student enrollment data
  const processCourseSections = async (sectionsData) => {
    const processedGrades = [];

    for (const section of sectionsData) {
      try {
        // Fetch enrolled students for this section
        const enrolledStudents = await fetchEnrolledStudents(section.id);
        
        const gradeItem = {
          id: section.courseCode || `SEC${section.id}`,
          course: section.courseName || section.course?.courseName || 'Unknown Course',
          section: section.sectionName,
          creditUnits: section.course?.creditUnits || section.creditUnits || 3,
          program: section.course?.program?.name || section.course?.program?.programName || 'Unknown Program',
          status: section.status || 'Active',
          instructor: section.faculty ? 
            `${section.faculty.firstName} ${section.faculty.lastName}` : 
            'Dr. Alan Turing', // Fallback instructor
          students: enrolledStudents,
          sectionId: section.id
        };

        processedGrades.push(gradeItem);
      } catch (err) {
        console.error(`Error processing section ${section.id}:`, err);
        // Add section even if student fetch fails
        processedGrades.push({
          id: section.courseCode || `SEC${section.id}`,
          course: section.courseName || 'Unknown Course',
          section: section.sectionName,
          creditUnits: section.creditUnits || 3,
          program: 'Unknown Program',
          status: section.status || 'Active',
          instructor: 'Dr. Alan Turing',
          students: [],
          sectionId: section.id
        });
      }
    }

    return processedGrades;
  };

  // Fetch enrolled students for a specific section
  const fetchEnrolledStudents = async (sectionId) => {
    try {
      // This would depend on your API structure
      // You might need to modify this based on how your enrolled courses API works
      const enrolledResponse = await enrolledCourseAPI.getAllEnrolledCourses();
      const allEnrolled = enrolledResponse.data.data || enrolledResponse.data;
      
      // Filter enrolled courses for this section
      const sectionEnrolled = allEnrolled.filter(enrollment => 
        enrollment.courseSectionId === sectionId || 
        enrollment.courseSection?.id === sectionId
      );

      // Fetch student details and format for grades
      const students = [];
      for (const enrollment of sectionEnrolled) {
        try {
          const studentId = enrollment.studentId || enrollment.student?.id;
          if (studentId) {
            const studentResponse = await studentAPI.getStudentById(studentId);
            const student = studentResponse.data.data || studentResponse.data;
            
            students.push({
              id: student.studentId || student.id,
              name: `${student.firstName} ${student.lastName}`,
              midterm: enrollment.midtermGrade || null,
              final: enrollment.finalGrade || null,
              overall: enrollment.overallGrade || null,
              enrollmentId: enrollment.id
            });
          }
        } catch (studentErr) {
          console.error('Error fetching student details:', studentErr);
        }
      }

      return students;
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
      return [];
    }
  };

  // Filter grades based on selected criteria
  const filteredGrades = gradesList.filter(grade => {
    const matchesSearch = grade.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProgram = !selectedProgram || grade.program === selectedProgram;
    const matchesSection = selectedSection === 'All Sections' || grade.section === selectedSection;
    return matchesSearch && matchesProgram && matchesSection;
  });

  // Handle program selection
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setShowStudents(false);
    setSelectedCourse(null);
  };

  // Handle section change
  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  // Handle row click to show students
  const handleRowClick = (course) => {
    setSelectedCourse(course);
    setShowStudents(true);
  };

  // Handle back to courses
  const handleBackToCourses = () => {
    setShowStudents(false);
    setSelectedCourse(null);
  };

  // Handle grade change
  const handleGradeChange = (studentId, field, value) => {
    setStudentsGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: parseFloat(value) || null
      }
    }));
  };

  // Save grades to API
  const handleSaveGrades = async (studentId, studentName) => {
    try {
      setSaveLoading(prev => ({ ...prev, [studentId]: true }));
      
      const grades = studentsGrades[studentId] || {};
      const student = selectedCourse.students.find(s => s.id === studentId);
      
      if (!student || !student.enrollmentId) {
        throw new Error('Student enrollment not found');
      }

      // Calculate overall grade if both midterm and final are provided
      let overallGrade = null;
      if (grades.midterm !== null && grades.final !== null) {
        overallGrade = (grades.midterm + grades.final) / 2;
      }

      // Update the enrolled course record with new grades
      const updateData = {
        midtermGrade: grades.midterm ?? student.midterm,
        finalGrade: grades.final ?? student.final,
        overallGrade: overallGrade ?? student.overall
      };

      // Use the imported enrolledCourseAPI to update grades
      await enrolledCourseAPI.updateGrades(student.enrollmentId, updateData);

      // Update local state
      setGradesList(prevGrades => 
        prevGrades.map(grade => 
          grade.id === selectedCourse.id 
            ? {
                ...grade,
                students: grade.students.map(s => 
                  s.id === studentId 
                    ? { 
                        ...s, 
                        midterm: updateData.midtermGrade,
                        final: updateData.finalGrade,
                        overall: updateData.overallGrade
                      }
                    : s
                )
              }
            : grade
        )
      );

      // Update selected course
      setSelectedCourse(prev => ({
        ...prev,
        students: prev.students.map(s => 
          s.id === studentId 
            ? { 
                ...s, 
                midterm: updateData.midtermGrade,
                final: updateData.finalGrade,
                overall: updateData.overallGrade
              }
            : s
        )
      }));

      // Clear temporary grades
      setStudentsGrades(prev => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });

      alert(`Grades saved successfully for ${studentName}!`);
    } catch (err) {
      console.error('Error saving grades:', err);
      alert(`Failed to save grades for ${studentName}. Please try again.`);
    } finally {
      setSaveLoading(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Navigation handler
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

  // Loading state
  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar 
          onNavigate={showSection}
          userInfo={getUserInfo()}
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
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Loading...</h1>
            </div>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading course data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar 
          onNavigate={showSection}
          userInfo={getUserInfo()}
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
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Error</h1>
            </div>
            <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
              <p>{error}</p>
              <button 
                onClick={fetchInitialData}
                style={{
                  marginTop: '1rem',
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student grades view
  if (showStudents && selectedCourse) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar 
          onNavigate={showSection}
          userInfo={getUserInfo()}
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
              <span className={styles.breadcrumbLink} onClick={() => navigate('/faculty-dashboard')}>Dashboard</span>
              <span className={styles.breadcrumbSeparator}> / </span>
              <span className={styles.breadcrumbLink} onClick={handleBackToCourses}>Grades</span>
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
                    {selectedCourse.students.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                          No students enrolled in this course
                        </td>
                      </tr>
                    ) : (
                      selectedCourse.students.map((student) => (
                        <tr key={student.id}>
                          <td><div className={`${styles.cellContent} ${styles.cellCentered}`}><span className={styles.courseCode}>{student.id}</span></div></td>
                          <td><div className={styles.cellContent}>{student.name}</div></td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <input
                                type="number" min="0" max="100" step="0.1"
                                defaultValue={student.midterm ?? ''}
                                onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)}
                                style={{width: '80px', textAlign: 'center', padding: '8px', borderRadius: '4px', border: '1px solid #ced4da'}}
                              />
                            </div>
                          </td>
                          <td>
                            <div className={`${styles.cellContent} ${styles.cellCentered}`}>
                              <input
                                type="number" min="0" max="100" step="0.1"
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
                                disabled={saveLoading[student.id]}
                                style={{
                                  backgroundColor: saveLoading[student.id] ? '#6c757d' : '#28a745', 
                                  color: 'white', 
                                  border: 'none', 
                                  padding: '6px 12px', 
                                  borderRadius: '4px', 
                                  cursor: saveLoading[student.id] ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {saveLoading[student.id] ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main courses view
  return (
    <div className={styles.dashboardContainer}>
      <Sidebar 
        onNavigate={showSection}
        userInfo={getUserInfo()}
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
            <span className={styles.breadcrumbLink} onClick={() => navigate('/faculty-dashboard')}>Dashboard</span>
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
                    key={program.id}
                    className={`${styles.studentNavItem} ${selectedProgram === (program.name || program.programName) ? styles.studentNavItemActive : ''}`}
                    onClick={() => handleProgramSelect(program.name || program.programName)}
                  >
                    <div className={styles.semesterInfo}>
                      <div className={styles.semesterMain}>{program.name || program.programName}</div>
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
                    {filteredGrades.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                          No courses found for the selected criteria
                        </td>
                      </tr>
                    ) : (
                      filteredGrades.map((grade) => (
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
                              {grade.instructor}
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
                      ))
                    )}
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