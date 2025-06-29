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
  const { getUserInfo, facultyData } = useFacultyData();
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
    if (facultyData) {
      fetchInitialData();
    }
  }, [facultyData]);

  // Add loading state management to prevent duplicate calls
  const [isInitializing, setIsInitializing] = useState(false);

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
    if (!facultyData || isInitializing) {
      if (!facultyData) {
        setError('Faculty information not available. Please log in again.');
        setLoading(false);
      }
      return;
    }
    
    try {
      setIsInitializing(true);
      setLoading(true);
      setError(null);
      
      console.log('Faculty data:', facultyData);
      console.log('Faculty data keys:', facultyData ? Object.keys(facultyData) : 'No faculty data');
      
      // Get faculty ID using the same approach as FacultySchedule
      const facultyId = facultyData?.facultyID || facultyData?.facultyId;
      
      if (!facultyData || !facultyId) {
        console.warn('Faculty information not available, cannot fetch grades.');
        setError('Faculty information not available. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Loading sections for faculty ID:', facultyId);
      
      // Fetch only sections assigned to this faculty
      const sectionsResponse = await courseSectionAPI.getSectionsByFaculty(facultyId);
      const sectionsData = Array.isArray(sectionsResponse.data) ? sectionsResponse.data : 
                          (sectionsResponse.data.data || sectionsResponse.data.sections || []);
      
      console.log('Faculty-specific sections loaded:', sectionsData.length);
      console.log('Sections data:', sectionsData);
      
      if (sectionsData.length === 0) {
        setError('No courses assigned to this faculty member.');
        setLoading(false);
        return;
      }
      
      // Extract unique programs from faculty's assigned sections
      const facultyPrograms = [...new Set(sectionsData
        .map(section => section.program?.programName || section.course?.program || 'Unknown Program')
        .filter(program => program !== 'Unknown Program')
      )];
      
      // Create program objects for the sidebar
      const programsData = facultyPrograms.map((programName, index) => ({
        id: index + 1,
        name: programName,
        programName: programName
      }));
      
      setPrograms(programsData);
      
      if (programsData.length > 0) {
        const firstProgramName = programsData[0].name || programsData[0].programName;
        setSelectedProgram(firstProgramName);
      }
      
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
        const enrolledStudents = await fetchEnrolledStudents(section.sectionID || section.id);
        const gradeItem = {
          id: section.sectionID || section.id,
          course: section.course?.courseDescription || section.course?.courseCode || 'Unknown Course',
          section: section.sectionName,
          creditUnits: section.course?.credits || 3,
          program: section.program?.programName || section.course?.program || 'Unknown Program',
          status: section.status || 'Active',
          instructor: section.faculty ? `${section.faculty.firstName} ${section.faculty.lastName}` : 'Dr. Alan Turing',
          students: enrolledStudents,
          sectionId: section.sectionID || section.id
        };
        processedGrades.push(gradeItem);
      } catch (err) { 
        console.error(`Error processing section ${section.id}:`, err); 
      }
    }
    return processedGrades;
  };

  // Fetch enrolled students for a specific section with caching
  const fetchEnrolledStudents = async (sectionId) => {
    const cacheKey = `section_${sectionId}_students`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    try {
      const enrolledResponse = await enrolledCourseAPI.getEnrolledCoursesBySection(sectionId);
      const sectionEnrolled = enrolledResponse.data || [];
      
      const students = sectionEnrolled
        .map(enrollment => {
          const student = enrollment.semesterEnrollment?.student;
          if (!student) return null;
          
          const gradeValue = enrollment.grade?.gradeValue || null;
          
          return {
            id: student.id,
            name: `${student.lastName}, ${student.firstName}`,
            email: student.email,
            yearLevel: student.year_level,
            program: student.program?.programName || 'Unknown Program',
            midterm: enrollment.midtermGrade || null,
            final: enrollment.finalGrade || null,
            weightedAverage: enrollment.overallGrade || gradeValue || null,
            enrollmentId: enrollment.enrolledCourseID,
            enrollmentStatus: enrollment.status,
            semesterEnrollmentId: enrollment.semesterEnrollment?.semesterEnrollmentID,
            remark: enrollment.remark || 'INCOMPLETE'
          };
        })
        .filter(Boolean);
      
      sessionStorage.setItem(cacheKey, JSON.stringify(students));
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

  const handleGradeChange = async (studentId, field, value) => {
    const student = selectedCourse.students.find(s => s.id === studentId);
    if (!student || !student.enrollmentId) return;

    const grades = studentsGrades[studentId] || {};
    const updatedGrades = {
      ...grades,
      [field]: field === 'remark' ? value : (parseFloat(value) || null)
    };

    // Calculate new weighted average if both grades are present
    let newWeightedAverage = null;
    const midtermGrade = field === 'midterm' ? parseFloat(value) : (grades.midterm ?? student.midterm);
    const finalGrade = field === 'final' ? parseFloat(value) : (grades.final ?? student.final);
    
    if (midtermGrade !== null && finalGrade !== null) {
      newWeightedAverage = (midtermGrade + finalGrade) / 2;
    }

    // Update local state
    setStudentsGrades(prev => ({
      ...prev,
      [studentId]: {
        ...updatedGrades,
        weightedAverage: newWeightedAverage
      }
    }));

    // Save to backend
    try {
      const updateData = {
        midtermGrade: midtermGrade,
        finalGrade: finalGrade,
        overallGrade: newWeightedAverage,
        remark: updatedGrades.remark || 'INCOMPLETE'
      };
      
      await enrolledCourseAPI.updateGrades(student.enrollmentId, updateData);

      // Update gradesList state to reflect changes
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
                        weightedAverage: newWeightedAverage,
                        remark: updateData.remark
                      } 
                    : s
                ) 
              }
            : grade
        )
      );
    } catch (err) {
      console.error('Error saving grade:', err);
    }
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
      const remark = grades.remark || 'INCOMPLETE';
      
      if (midtermGrade !== null && finalGrade !== null) {
        newWeightedAverage = (midtermGrade + finalGrade) / 2;
      }
      
      const updateData = { 
        midtermGrade, 
        finalGrade, 
        overallGrade: newWeightedAverage,
        remark
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
                        weightedAverage: newWeightedAverage,
                        remark: updateData.remark
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
                        <td colSpan="7" className={styles.placeholderCell}>
                          Please select a course to view student grades.
                        </td>
                      </tr>
                    ) : selectedCourse.students.length === 0 ? (
                      <tr>
                        <td colSpan="7" className={styles.placeholderCell}>
                          No students enrolled in this course.
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className={styles.placeholderCell}>
                          No students match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((student) => {
                        const currentGrades = studentsGrades[student.id] || {};
                        const displayedMidterm = currentGrades.midterm ?? student.midterm;
                        const displayedFinal = currentGrades.final ?? student.final;
                        const displayedWeightedAverage = currentGrades.weightedAverage ?? student.weightedAverage;
                        
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
                                  min="1" 
                                  max="5" 
                                  step="0.01" 
                                  value={displayedMidterm ?? ''} 
                                  onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)} 
                                  className={styles.gradeInput} 
                                />
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="5" 
                                  step="0.01" 
                                  value={displayedFinal ?? ''} 
                                  onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)} 
                                  className={styles.gradeInput} 
                                />
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.cellContent} ${styles.gradeScore}`}>
                                {displayedWeightedAverage?.toFixed(2) ?? 'N/A'}
                              </div>
                            </td>
                            <td>
                              <div className={styles.cellContent}>
                                <select
                                  value={studentsGrades[student.id]?.remark || 'INCOMPLETE'}
                                  onChange={(e) => handleGradeChange(student.id, 'remark', e.target.value)}
                                  className={styles.remarkSelect}
                                >
                                  <option value="INCOMPLETE">INCOMPLETE</option>
                                  <option value="PASS">PASS</option>
                                  <option value="FAIL">FAIL</option>
                                </select>
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