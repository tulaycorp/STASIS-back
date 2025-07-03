import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FacultyGrades.module.css';
import Sidebar from '../FacultySidebar';
import { useFacultyData } from '../../hooks/useFacultyData';
import { 
  courseSectionAPI, 
  enrolledCourseAPI
} from '../../services/api';

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

  // Toast state
  const [toast, setToast] = useState(null);

  // Add loading state management to prevent duplicate calls
  const [isInitializing, setIsInitializing] = useState(false);

  // Fetch initial data on component mount
  useEffect(() => {
    if (facultyData) {
      fetchInitialData();
    }
  }, [facultyData]);

  // Effect to update the course/section sidebars when a program or section filter changes
  useEffect(() => {
    console.log('=== FILTERING EFFECT TRIGGERED ===');
    console.log('selectedProgram:', selectedProgram);
    console.log('gradesList.length:', gradesList.length);
    console.log('selectedSectionFilter:', selectedSectionFilter);
    
    if (selectedProgram && gradesList.length > 0) {
      console.log('Filtering courses for program:', selectedProgram);
      console.log('Available grades list:', gradesList);
      
      const programCoursesRaw = gradesList.filter(grade => {
        console.log(`Checking grade program: '${grade.program}' against selected: '${selectedProgram}'`);
        const matches = grade.program.trim().toLowerCase() === selectedProgram.trim().toLowerCase();
        console.log('Match result:', matches);
        return matches;
      });

      console.log('Program courses raw:', programCoursesRaw);

      // Derive unique sections for the selected program
      const uniqueSections = ['All Sections', ...new Set(programCoursesRaw.map(course => course.section))];
      console.log('Unique sections:', uniqueSections);
      setProgramSections(uniqueSections);

      // Filter courses based on the section filter
      const filteredProgramCourses = selectedSectionFilter === 'All Sections'
        ? programCoursesRaw
        : programCoursesRaw.filter(course => course.section === selectedSectionFilter);

      console.log('Filtered program courses:', filteredProgramCourses);

      const newCourseList = filteredProgramCourses.map(grade => ({
        id: grade.id, 
        name: grade.course, 
        section: grade.section
      }));
      
      console.log('New course list:', newCourseList);
      setCourses(newCourseList);

      // Only deselect if the course is not in the filtered list AND we're not in the middle of saving grades
      if (selectedCourseId && 
          !newCourseList.some(c => c.id === selectedCourseId) && 
          !Object.values(studentsGrades).some(g => g.hasChanges)) {
        console.log('Deselecting course because it is not in the filtered list');
        setSelectedCourseId(null);
        setSelectedCourse(null);
      }
    } else if (gradesList.length > 0 && !selectedProgram) {
      console.log('No program selected but grades list exists, showing all courses');
      // If no program is selected but we have grades, show all courses
      const allCourses = gradesList.map(grade => ({
        id: grade.id, 
        name: grade.course, 
        section: grade.section
      }));
      console.log('All courses:', allCourses);
      setCourses(allCourses);
    } else {
      console.log('No courses to show - either no program selected or no grades list');
      setCourses([]);
    }
  }, [selectedProgram, selectedSectionFilter, gradesList, selectedCourseId]);

  // Track changes separately to avoid dependency array issues
  useEffect(() => {
    const hasUnsavedChanges = Object.values(studentsGrades).some(g => g.hasChanges);
    if (hasUnsavedChanges && selectedCourseId) {
      // Keep the current course selected if there are unsaved changes
      const courseExists = courses.some(c => c.id === selectedCourseId);
      if (!courseExists) {
        console.log('Course not in filtered list but keeping selection due to unsaved changes');
      }
    }
  }, [studentsGrades, selectedCourseId, courses]);

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

  // Fetch programs and course sections based on faculty's assigned sections
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
      
      // Get faculty ID
      const facultyId = facultyData?.facultyID || facultyData?.facultyId;
      
      if (!facultyData || !facultyId) {
        console.warn('Faculty information not available, cannot fetch grades.');
        setError('Faculty information not available. Please log in again.');
        setLoading(false);
        return;
      }

      // CORRECTED LOGIC: Get faculty's assigned course sections, then get student enrollments for those sections
      console.log('Fetching faculty assigned sections for faculty ID:', facultyId);
      
      // Get all course sections assigned to this faculty with full details
      const sectionsResponse = await courseSectionAPI.getSectionsByFaculty(facultyId);
      console.log('Faculty sections response:', sectionsResponse);
      
      const facultySections = sectionsResponse.data || [];
      console.log('Faculty assigned sections:', facultySections);
      
      if (facultySections.length === 0) {
        console.log('No sections assigned to this faculty');
        setPrograms([]);
        setGradesList([]);
        setLoading(false);
        setIsInitializing(false);
        return;
      }

      // Extract unique programs from the faculty's assigned sections
      const uniquePrograms = [...new Set(facultySections.map(section => {
        const programName = section.program?.programName || 
                          section.course?.program?.programName || 
                          'Unknown Program';
        console.log('Program name for section:', section.sectionID, programName);
        return programName;
      }))].filter(program => program !== 'Unknown Program');

      console.log('Unique programs:', uniquePrograms);

      // Create program objects
      const programsData = uniquePrograms.map((programName, index) => ({
        id: index + 1,
        name: programName,
        programName: programName
      }));

      console.log('Programs from faculty sections:', programsData);
      setPrograms(programsData);

      if (programsData.length > 0) {
        const firstProgramName = programsData[0].name;
        setSelectedProgram(firstProgramName);
        console.log('Selected program:', firstProgramName);
      }

      // Now get student enrollments for each of the faculty's sections
      const sectionMap = new Map();
      
      // Process each section and fetch student enrollments
      for (const section of facultySections) {
        console.log('=== PROCESSING SECTION ===');
        console.log('Section details:', section);
        console.log('Section ID:', section.sectionID);
        console.log('Course:', section.course?.courseDescription);
        console.log('Section Name:', section.sectionName);
        console.log('Program:', section.program?.programName);
        
        // Create section data with empty students array initially
        const sectionData = {
          id: section.sectionID,
          course: section.course?.courseDescription || section.course?.courseCode || 'Unknown Course',
          section: section.sectionName,
          creditUnits: section.course?.credits || 3,
          program: section.program?.programName || 'Unknown Program',
          status: section.status || 'ACTIVE',
          instructor: `${section.faculty?.firstName} ${section.faculty?.lastName}`,
          students: []
        };
        
        console.log('Created section data:', sectionData);
        
        // Try to fetch students for this section
        try {
          console.log('Fetching enrollments for section:', section.sectionID);
          const enrolledResponse = await enrolledCourseAPI.getEnrolledCoursesBySection(section.sectionID);
          console.log('Enrolled response:', enrolledResponse);
          
          if (enrolledResponse?.data && Array.isArray(enrolledResponse.data) && enrolledResponse.data.length > 0) {
            const enrolledData = enrolledResponse.data;
            console.log(`Raw enrollments for section ${section.sectionID}:`, enrolledData);
            
            // Log the structure of the first enrollment to understand the data
            console.log('Sample enrollment structure:', JSON.stringify(enrolledData[0], null, 2));
            
            // Process enrolled students with better error handling
            const students = enrolledData.map(enrollment => {
              try {
                console.log('Processing enrollment:', enrollment);
                
                // Check if enrollment has the basic structure
                if (!enrollment) {
                  console.warn('Null enrollment found');
                  return null;
                }

                // Extract student data from enrollment
                const student = enrollment.semesterEnrollment?.student;
                if (!student) {
                  console.warn('No student data found in enrollment:', enrollment);
                  return null;
                }

                console.log('Student data found:', student);
                
                // Create student object with comprehensive fallbacks
                const studentData = {
                  id: student.id,
                  name: `${student.lastName || 'Unknown'}, ${student.firstName || 'Unknown'}`,
                  email: student.email || '',
                  yearLevel: student.yearLevel || student.year_level || '',
                  program: student.program?.programName || 'Unknown Program',
                  midterm: enrollment.grade?.midtermGrade || null,
                  final: enrollment.grade?.finalGrade || null,
                  weightedAverage: enrollment.grade?.overallGrade || null,
                  enrollmentId: enrollment.enrolledCourseID,
                  enrollmentStatus: enrollment.status || 'PENDING',
                  semesterEnrollmentId: enrollment.semesterEnrollment?.semesterEnrollmentID,
                  remark: enrollment.grade?.remark || 'INCOMPLETE'
                };

                console.log('Successfully processed student data:', studentData);
                return studentData;
              } catch (error) {
                console.error('Error processing enrollment:', error);
                console.error('Enrollment that caused error:', enrollment);
                return null;
              }
            }).filter(student => student !== null); // Remove null entries
          
            console.log('Processed students for section:', students);
            sectionData.students = students;
          } else {
            console.warn('No enrollments found for section:', section.sectionID);
          }
          
        } catch (err) {
          console.error(`Error fetching enrollments for section ${section.sectionID}:`, err);
          // Section will have empty students array
        }
        
        // Always add the section to the map (with or without students)
        sectionMap.set(section.sectionID, sectionData);
      }

      const processedGrades = Array.from(sectionMap.values());
      console.log('=== FINAL PROCESSED GRADES ===');
      console.log('Total sections processed:', processedGrades.length);
      
      // Enhanced logging for debugging
      processedGrades.forEach((grade, index) => {
        console.log(`Section ${index + 1}:`, {
          id: grade.id,
          course: grade.course,
          section: grade.section,
          program: grade.program,
          studentCount: grade.students.length,
          students: grade.students.map(s => ({ id: s.id, name: s.name }))
        });
      });
      
      // Validate that we have valid data before setting state
      if (processedGrades.length === 0) {
        console.warn('No processed grades found - this might indicate a data processing issue');
        setError('No course sections found for this faculty member.');
      } else {
        const totalStudents = processedGrades.reduce((sum, grade) => sum + grade.students.length, 0);
        console.log(`Successfully processed ${processedGrades.length} sections with ${totalStudents} total students`);
      }
      
      setGradesList(processedGrades);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load course data. Please try again.');
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  // Add this helper function near the top, after your useState hooks
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleProgramSelect = (programName) => {
    setSelectedProgram(programName);
    setSelectedSectionFilter('All Sections'); // Reset section filter when program changes
  };

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleGradeChange = (studentId, field, value) => {
    const student = selectedCourse.students.find(s => s.id === studentId);
    if (!student || !student.enrollmentId) return;

    const grades = studentsGrades[studentId] || {};
    const updatedGrades = {
      ...grades,
      [field]: field === 'remark' ? value : (parseFloat(value) || null)
    };

    // Calculate new weighted average if both grades are present
    let newWeightedAverage = student.weightedAverage; // Keep existing if not calculated
    const midtermGrade = field === 'midterm' ? parseFloat(value) : (grades.midterm ?? student.midterm);
    const finalGrade = field === 'final' ? parseFloat(value) : (grades.final ?? student.final);
    
    if (midtermGrade !== null && finalGrade !== null) {
      newWeightedAverage = (midtermGrade + finalGrade) / 2;
    }

    // Only update local state - no backend save
    setStudentsGrades(prev => ({
      ...prev,
      [studentId]: {
        ...updatedGrades,
        weightedAverage: newWeightedAverage,
        enrollmentId: student.enrollmentId,
        hasChanges: true // Mark this student's grades as changed
      }
    }));
  };

  // New function to handle encoding/saving all changed grades
  const handleEncodeGrades = async () => {
    const changedStudents = Object.entries(studentsGrades).filter(([_, grades]) => grades.hasChanges);
    
    if (changedStudents.length === 0) {
      alert('No grades have been changed');
      return;
    }

    console.log('=== ENCODING GRADES ===');
    console.log('Changed students:', changedStudents);
    console.log('Current gradesList before update:', gradesList);
    console.log('Selected course:', selectedCourse);

    try {
      setSaveLoading(prev => ({
        ...prev,
        all: true
      }));

      // Save each student's grades
      for (const [studentId, grades] of changedStudents) {
        const updateData = {
          midtermGrade: grades.midterm,
          finalGrade: grades.final,
          overallGrade: grades.weightedAverage,
          remark: grades.remark || 'INCOMPLETE'
        };

        console.log(`Updating grades for student ${studentId}:`, updateData);
        await enrolledCourseAPI.updateGrades(grades.enrollmentId, updateData);
        console.log(`Successfully updated grades for student ${studentId}`);
      }

      // Create a deep copy of gradesList to avoid mutation issues
      const updatedGradesList = JSON.parse(JSON.stringify(gradesList));
      
      // Find and update the current course section
      const currentSectionIndex = updatedGradesList.findIndex(grade => grade.id === selectedCourse.id);
      
      if (currentSectionIndex !== -1) {
        console.log('Found matching grade section, updating students...');
        const currentSection = updatedGradesList[currentSectionIndex];
        
        // Update students with new grades while preserving all students
        currentSection.students = currentSection.students.map(student => {
          const updatedGrades = studentsGrades[student.id];
          if (updatedGrades?.hasChanges) {
            console.log(`Updating student ${student.id} with new grades:`, updatedGrades);
            return {
              ...student,
              midterm: updatedGrades.midterm ?? student.midterm,
              final: updatedGrades.final ?? student.final,
              weightedAverage: updatedGrades.weightedAverage ?? student.weightedAverage,
              remark: updatedGrades.remark ?? student.remark
            };
          }
          return student; // Keep unchanged students exactly as they are
        });
        
        console.log('Updated students count:', currentSection.students.length);
      }
      
      // Update the state with the new gradesList
      setGradesList(updatedGradesList);
      
      // Update the selectedCourse to reflect the changes
      if (currentSectionIndex !== -1) {
        setSelectedCourse(updatedGradesList[currentSectionIndex]);
      }

      // Clear all temporary grades after successful update
      setStudentsGrades({});
      
      console.log('=== ENCODING COMPLETE ===');
      showToast('All grades have been successfully encoded!', 'success');
    } catch (err) {
      console.error('Error encoding grades:', err);
      showToast('Failed to encode some grades. Please try again.', 'error');
    } finally {
      setSaveLoading(prev => ({
        ...prev,
        all: false
      }));
    }
  };

  const filteredStudents = selectedCourse
    ? selectedCourse.students.filter(student => {
        const searchTermLower = studentSearchTerm.toLowerCase();
        return student.name.toLowerCase().includes(searchTermLower) || 
               String(student.id).toLowerCase().includes(searchTermLower);
      })
    : [];

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar userInfo={getUserInfo()}/>
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
        <Sidebar userInfo={getUserInfo()}/>
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
      <Sidebar userInfo={getUserInfo()}/>
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
                    {(() => {
                      console.log('=== TABLE RENDERING DEBUG ===');
                      console.log('selectedCourse:', selectedCourse);
                      console.log('selectedCourse?.students:', selectedCourse?.students);
                      console.log('selectedCourse?.students?.length:', selectedCourse?.students?.length);
                      console.log('filteredStudents:', filteredStudents);
                      console.log('filteredStudents.length:', filteredStudents.length);
                      console.log('studentSearchTerm:', studentSearchTerm);
                      
                      if (!selectedCourse) {
                        console.log('Showing: Please select a course');
                        return (
                          <tr>
                            <td colSpan="7" className={styles.placeholderCell}>
                              Please select a course to view student grades.
                            </td>
                          </tr>
                        );
                      }
                      
                      if (!selectedCourse.students || selectedCourse.students.length === 0) {
                        console.log('Showing: No students enrolled');
                        return (
                          <tr>
                            <td colSpan="7" className={styles.placeholderCell}>
                              No students enrolled in this course.
                            </td>
                          </tr>
                        );
                      }
                      
                      if (filteredStudents.length === 0) {
                        console.log('Showing: No students match search criteria');
                        return (
                          <tr>
                            <td colSpan="7" className={styles.placeholderCell}>
                              No students match your search criteria.
                            </td>
                          </tr>
                        );
                      }
                      
                      console.log('Showing student rows for:', filteredStudents.length, 'students');
                      return filteredStudents.map((student) => {
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
                                  className={`${styles.gradeInput} ${studentsGrades[student.id]?.hasChanges ? styles.changed : ''}`}
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
                                  className={`${styles.gradeInput} ${studentsGrades[student.id]?.hasChanges ? styles.changed : ''}`}
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
                                  value={studentsGrades[student.id]?.remark || student.remark || 'INCOMPLETE'}
                                  onChange={(e) => handleGradeChange(student.id, 'remark', e.target.value)}
                                  className={`${styles.remarkSelect} ${studentsGrades[student.id]?.hasChanges ? styles.changed : ''}`}
                                >
                                  <option value="INCOMPLETE">INCOMPLETE</option>
                                  <option value="PASS">PASS</option>
                                  <option value="FAIL">FAIL</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Add Encode Grades button */}
              {selectedCourse && Object.values(studentsGrades).some(g => g.hasChanges) && (
                <div className={styles.encodeGradesContainer}>
                  <button
                    onClick={handleEncodeGrades}
                    className={styles.encodeGradesButton}
                    disabled={saveLoading.all}
                  >
                    {saveLoading.all ? 'Encoding...' : 'Encode Grades'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyGrades;
