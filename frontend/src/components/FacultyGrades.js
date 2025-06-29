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
  const [courses, setCourses] = useState([]);
  const [programSections, setProgramSections] = useState(['All Sections']);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('All Sections');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [studentsGrades, setStudentsGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveLoading, setSaveLoading] = useState({});

  // Fetch initial data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Effect to update the course/section sidebars when a program or section filter changes
  useEffect(() => {
    if (selectedProgram) {
      const programCoursesRaw = gradesList.filter(grade => grade.program === selectedProgram);

      // Derive unique sections for the selected program
      const uniqueSections = ['All Sections', ...new Set(programCoursesRaw.map(course => course.section))];
      setProgramSections(uniqueSections);

      // Filter courses based on the section filter
      const filteredProgramCourses = selectedSectionFilter === 'All Sections'
        ? programCoursesRaw
        : programCoursesRaw.filter(course => course.section === selectedSectionFilter);

      const newCourseList = filteredProgramCourses.map(grade => ({
        id: grade.id, 
        name: grade.course, 
        section: grade.section
      }));
      setCourses(newCourseList);

      // If the currently selected course is not in the new filtered list, deselect it
      if (selectedCourseId && !newCourseList.some(c => c.id === selectedCourseId)) {
        setSelectedCourseId(null);
        setSelectedCourse(null);
      }
    }
  }, [selectedProgram, selectedSectionFilter, gradesList, selectedCourseId]);

  // Effect to update the main table when a course is selected
  useEffect(() => {
    if (selectedCourseId) {
      const courseData = gradesList.find(grade => grade.id === selectedCourseId);
      setSelectedCourse(courseData);
      setStudentSearchTerm(''); // Clear search when changing course
    } else {
      setSelectedCourse(null);
    }
  }, [selectedCourseId, gradesList]);

  // Fetch programs and course sections
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const programsResponse = await programAPI.getAllPrograms();
      const programsData = programsResponse.data.data || programsResponse.data;
      setPrograms(programsData);
      
      if (programsData.length > 0) {
        const firstProgramName = programsData[0].name || programsData[0].programName;
        setSelectedProgram(firstProgramName);
      }

      const sectionsResponse = await courseSectionAPI.getAllSections();
      const sectionsData = sectionsResponse.data.data || sectionsResponse.data;
      
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
        const enrolledStudents = await fetchEnrolledStudents(section.id);
        const gradeItem = {
          id: section.courseCode || `SEC${section.id}`,
          course: section.courseName || section.course?.courseName || 'Unknown Course',
          section: section.sectionName,
          creditUnits: section.course?.creditUnits || section.creditUnits || 3,
          program: section.course?.program?.name || section.course?.program?.programName || 'Unknown Program',
          status: section.status || 'Active',
          instructor: section.faculty ? `${section.faculty.firstName} ${section.faculty.lastName}` : 'Dr. Alan Turing',
          students: enrolledStudents,
          sectionId: section.id
        };
        processedGrades.push(gradeItem);
      } catch (err) { 
        console.error(`Error processing section ${section.id}:`, err); 
      }
    }
    return processedGrades;
  };

  // Fetch enrolled students for a specific section
  const fetchEnrolledStudents = async (sectionId) => {
    try {
      const enrolledResponse = await enrolledCourseAPI.getAllEnrolledCourses();
      const allEnrolled = enrolledResponse.data.data || enrolledResponse.data;
      const sectionEnrolled = allEnrolled.filter(e => 
        e.courseSectionId === sectionId || e.courseSection?.id === sectionId
      );
      const students = [];
      for (const enrollment of sectionEnrolled) {
        try {
          const studentId = enrollment.studentId || enrollment.student?.id;
          if (studentId) {
            const studentResponse = await studentAPI.getStudentById(studentId);
            const student = studentResponse.data.data || studentResponse.data;
            students.push({
              id: student.studentId || student.id,
              name: `${student.lastName}, ${student.firstName}`,
              midterm: enrollment.midtermGrade || null,
              final: enrollment.finalGrade || null,
              weightedAverage: enrollment.overallGrade || null,
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

  const handleProgramSelect = (programName) => {
    setSelectedProgram(programName);
    setSelectedSectionFilter('All Sections'); // Reset section filter when program changes
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleGradeChange = (studentId, field, value) => {
    setStudentsGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: parseFloat(value) || null
      }
    }));
  };

  const handleSaveGrades = async (studentId, studentName) => {
    try {
      setSaveLoading(prev => ({ ...prev, [studentId]: true }));
      const grades = studentsGrades[studentId] || {};
      const student = selectedCourse.students.find(s => s.id === studentId);
      if (!student || !student.enrollmentId) {
        throw new Error('Student enrollment not found');
      }

      let newWeightedAverage = student.weightedAverage;
      const midtermGrade = grades.midterm ?? student.midterm;
      const finalGrade = grades.final ?? student.final;
      if (midtermGrade !== null && finalGrade !== null) {
        newWeightedAverage = (midtermGrade * 0.5) + (finalGrade * 0.5);
      }
      
      const updateData = { 
        midtermGrade, 
        finalGrade, 
        overallGrade: newWeightedAverage 
      };
      await enrolledCourseAPI.updateGrades(student.enrollmentId, updateData);

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
                        weightedAverage: newWeightedAverage 
                      } 
                    : s
                ) 
              }
            : grade
        )
      );
      
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
  
  const getRemark = (grade, midterm, final) => {
    if (grade === null || midterm === null || final === null) {
      return { text: 'In Progress', className: styles.remarksProgress };
    }
    if (grade >= 75) {
      return { text: 'Passed', className: styles.remarksPassed };
    }
    return { text: 'Failed', className: styles.remarksFailed };
  };

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
        break;
    }
  };

  const filteredStudents = selectedCourse
    ? selectedCourse.students.filter(student => {
        const searchTermLower = studentSearchTerm.toLowerCase();
        return student.name.toLowerCase().includes(searchTermLower) || 
               String(student.id).toLowerCase().includes(searchTermLower);
      })
    : [];
  
  const sidebarProps = { 
    onNavigate: showSection, 
    userInfo: getUserInfo(), 
    sections: [ 
      { 
        items: [
          { id: 'FacultyDashboard', label: 'Dashboard', icon: '📊' }
        ] 
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
    ] 
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar {...sidebarProps} />
        <div className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <h1 className={styles.pageTitle}>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar {...sidebarProps} />
        <div className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <h1 className={styles.pageTitle}>Error</h1>
            <p style={{color: 'red'}}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar {...sidebarProps} />
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.breadcrumb}>
            <span 
              className={styles.breadcrumbLink} 
              onClick={() => navigate('/faculty-dashboard')}
            >
              Dashboard
            </span>
            <span className={styles.breadcrumbSeparator}> / </span>
            <span className={styles.breadcrumbCurrent}>Grades</span>
          </div>
          
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Academic Records</h1>
          </div>
          
          <div className={styles.studentContentWrapper}>
            <div>
              <div className={styles.studentNavSection}>
                <div className={styles.studentNavHeader}>
                  <h2 className={styles.studentNavTitle}>Programs</h2>
                </div>
                <div className={styles.studentNavList}>
                  {programs.map((program) => {
                    const programName = program.name || program.programName;
                    return (
                      <div 
                        key={program.id} 
                        className={`${styles.studentNavItem} ${
                          selectedProgram === programName ? styles.studentNavItemActive : ''
                        }`} 
                        onClick={() => handleProgramSelect(programName)}
                      >
                        <div className={styles.semesterInfo}>
                          <div className={styles.semesterMain}>{programName}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className={`${styles.studentNavSection} ${styles.courseSidebar}`}>
                <div className={styles.studentNavHeader}>
                  <h2 className={styles.studentNavTitle}>Courses</h2>
                </div>
                <div className={styles.studentNavList}>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <div 
                        key={course.id} 
                        className={`${styles.studentNavItem} ${
                          selectedCourseId === course.id ? styles.studentNavItemActive : ''
                        }`} 
                        onClick={() => handleCourseSelect(course.id)}
                      >
                        <div className={styles.semesterInfo}>
                          <div className={styles.semesterMain}>{course.name}</div>
                          <div className={styles.courseSectionLabel}>{course.section}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noCoursesMessage}>No courses found.</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className={styles.gradesListContainer}>
              <div className={styles.listHeader}>
                <div className={styles.headerCourseInfo}>
                  <h2 className={styles.headerCourseName}>
                    {selectedCourse ? selectedCourse.course : 'Select a Course'}
                  </h2>
                  {selectedCourse && (
                    <span className={styles.headerCourseUnits}>
                      {selectedCourse.creditUnits} Units
                    </span>
                  )}
                </div>
                <div className={styles.headerControls}>
                  <select 
                    value={selectedSectionFilter} 
                    onChange={(e) => setSelectedSectionFilter(e.target.value)} 
                    className={styles.filterSelect} 
                    disabled={!selectedProgram}
                  >
                    {programSections.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Search Students..." 
                    value={studentSearchTerm} 
                    onChange={(e) => setStudentSearchTerm(e.target.value)} 
                    className={styles.searchInput} 
                    disabled={!selectedCourse} 
                  />
                </div>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.gradesTable}>
                  <thead>
                    <tr>
                      <th rowSpan="2">Student ID</th>
                      <th rowSpan="2">Student Name (Last Name, First Name)</th>
                      <th rowSpan="2">Section</th>
                      <th colSpan="3">Student Grades</th>
                      <th rowSpan="2">Remarks</th>
                      <th rowSpan="2">Actions</th>
                    </tr>
                    <tr>
                      <th>Midterm</th>
                      <th>Finals</th>
                      <th>Weighted Avg.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!selectedCourse ? (
                      <tr>
                        <td colSpan="8" className={styles.placeholderCell}>
                          Please select a course to view student grades.
                        </td>
                      </tr>
                    ) : selectedCourse.students.length === 0 ? (
                      <tr>
                        <td colSpan="8" className={styles.placeholderCell}>
                          No students enrolled in this course.
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="8" className={styles.placeholderCell}>
                          No students match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const remark = getRemark(student.weightedAverage, student.midterm, student.final);
                        return (
                          <tr key={student.id}>
                            <td>
                              <div className={styles.cellContent}>
                                <span className={styles.studentIdLabel}>{student.id}</span>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.cellContent} ${styles.studentName}`}>
                                {student.name}
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>{selectedCourse.section}</div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="0.1" 
                                  defaultValue={student.midterm ?? ''} 
                                  onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)} 
                                  className={styles.gradeInput} 
                                />
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <input 
                                  type="number" 
                                  min="0" 
                                  max="100" 
                                  step="0.1" 
                                  defaultValue={student.final ?? ''} 
                                  onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)} 
                                  className={styles.gradeInput} 
                                />
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.cellContent} ${styles.gradeScore}`}>
                                {student.weightedAverage?.toFixed(1) ?? 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <span className={`${styles.remarksBadge} ${remark.className}`}>
                                  {remark.text}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <button 
                                  onClick={() => handleSaveGrades(student.id, student.name)} 
                                  disabled={saveLoading[student.id]} 
                                  className={styles.saveButton}
                                >
                                  {saveLoading[student.id] ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyGrades;