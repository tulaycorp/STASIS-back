import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FacultyGrades.module.css';
import Sidebar from '../FacultySidebar';
import { useFacultyData } from '../../hooks/useFacultyData';
import { 
  courseSectionAPI, 
  enrolledCourseAPI,
  scheduleAPI,
  facultyGradesAPI
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
        name: `${grade.course} - ${grade.section}`, // Include section name in display
        section: grade.section,
        course: grade.course,
        schedule: grade.schedule || null
      }));
      
      console.log('New course list:', newCourseList);
      setCourses(newCourseList);

      // Only deselect if the course is not in the filtered list AND we're not in the middle of saving grades
      if (selectedCourseId && 
          !newCourseList.some(c => c.id === selectedCourseId) && 
          !Object.values(studentsGrades).some(g => g.hasChanges && g.courseId === selectedCourseId)) {
        console.log('Deselecting course because it is not in the filtered list');
        setSelectedCourseId(null);
        setSelectedCourse(null);
      }
    } else if (gradesList.length > 0 && !selectedProgram) {
      console.log('No program selected but grades list exists, showing all courses');
      // If no program is selected but we have grades, show all courses
      const allCourses = gradesList.map(grade => ({
        id: grade.id, 
        name: `${grade.course} - ${grade.section}`, // Include section name in display
        section: grade.section,
        course: grade.course,
        schedule: grade.schedule || null
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

  // Function to fetch students for a selected course
  const fetchStudentsForCourse = async (courseId) => {
    try {
      console.log('Fetching students for course/section ID:', courseId);
      
      // Use the new faculty grades API to fetch students for this section
      const response = await facultyGradesAPI.getSectionStudents(courseId);
      console.log('Students response:', response);
      
      if (response?.data && Array.isArray(response.data)) {
        const enrolledStudents = response.data;
        console.log('Raw enrolled students:', enrolledStudents);
        
        // Process enrolled students to match the expected format
        const processedStudents = enrolledStudents.map(student => {
          // The backend now returns a flattened structure
          if (!student.id) {
            console.warn('No student ID found in data:', student);
            return null;
          }
          
          return {
            id: student.id,
            name: `${student.lastName || 'Unknown'}, ${student.firstName || 'Unknown'}`,
            email: student.email || '',
            yearLevel: student.yearLevel || '',
            program: student.programName || 'Unknown Program',
            midterm: student.midtermGrade || null,
            final: student.finalGrade || null,
            weightedAverage: student.overallGrade || null,
            enrollmentId: student.enrolledCourseID,
            enrollmentStatus: student.status || 'PENDING',
            semesterEnrollmentId: student.semesterEnrollmentID,
            remark: student.remark || 'INCOMPLETE'
          };
        }).filter(student => student !== null);
        
        console.log('Processed students:', processedStudents);
        
        // Update the selected course with the fetched students
        const courseData = gradesList.find(grade => grade.id === courseId);
        if (courseData) {
          const updatedCourseData = {
            ...courseData,
            students: processedStudents
          };
          setSelectedCourse(updatedCourseData);
          console.log('Updated selectedCourse with students:', updatedCourseData);
        }
        
      } else {
        console.warn('No students found or invalid response format');
        const courseData = gradesList.find(grade => grade.id === courseId);
        if (courseData) {
          setSelectedCourse({
            ...courseData,
            students: []
          });
        }
      }
      
    } catch (error) {
      console.error('Error fetching students for course:', error);
      const courseData = gradesList.find(grade => grade.id === courseId);
      if (courseData) {
        setSelectedCourse({
          ...courseData,
          students: []
        });
      }
    }
  };

  // Effect to update the main table when a course is selected
  useEffect(() => {
    if (selectedCourseId) {
      setStudentSearchTerm(''); // Clear search when changing course
    } else {
      setSelectedCourse(null);
    }
  }, [selectedCourseId]);

  // Simplified fetch initial data using the new faculty grades API
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
      
      // Get faculty ID
      const facultyId = facultyData?.facultyID || facultyData?.facultyId;
      
      if (!facultyData || !facultyId) {
        console.warn('Faculty information not available, cannot fetch grades.');
        setError('Faculty information not available. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('Fetching faculty sections for faculty ID:', facultyId);
      
      // Get faculty sections with grade summary using the new API
      const sectionsResponse = await facultyGradesAPI.getFacultySections(facultyId);
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
        // For the new API response, get program from course description prefix or infer from course code
        const courseCode = section.courseCode || '';
        const courseDescription = section.courseDescription || '';
        
        // Try to extract program name from course code (e.g., "CS" from "CS101")
        const programMatch = courseCode.match(/^[A-Z]+/);
        const programName = programMatch ? programMatch[0] : 
                          (courseDescription.includes('Computer') ? 'Computer Science' :
                           courseDescription.includes('Engineering') ? 'Engineering' :
                           courseDescription.includes('Business') ? 'Business' :
                           'General Education');
        
        console.log('Program name for section:', section.sectionId, programName);
        return programName;
      }))];

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

      // Convert sections to the expected format (without students for now)
      const processedGrades = facultySections.map(section => {
        console.log('Processing section summary:', section);
        
        // Determine program from course code
        const courseCode = section.courseCode || '';
        const programMatch = courseCode.match(/^[A-Z]+/);
        const programName = programMatch ? programMatch[0] : 
                          (section.courseDescription?.includes('Computer') ? 'Computer Science' :
                           section.courseDescription?.includes('Engineering') ? 'Engineering' :
                           section.courseDescription?.includes('Business') ? 'Business' :
                           'General Education');
        
        return {
          id: section.sectionId,
          course: section.courseDescription || section.courseCode || 'Unknown Course',
          section: section.sectionName,
          creditUnits: 3, // Default credits
          program: programName,
          status: 'ACTIVE',
          instructor: facultyData.firstName + ' ' + facultyData.lastName,
          enrolledStudentsCount: section.enrolledStudentsCount || 0,
          studentsWithGrades: section.studentsWithGrades || 0,
          students: [] // Students will be fetched separately when a section is selected
        };
      });

      console.log('=== FINAL PROCESSED GRADES ===');
      console.log('Total sections processed:', processedGrades.length);
      
      // Enhanced logging for debugging
      processedGrades.forEach((grade, index) => {
        console.log(`Section ${index + 1}:`, {
          id: grade.id,
          course: grade.course,
          section: grade.section,
          program: grade.program,
          enrolledCount: grade.enrolledStudentsCount,
          studentsWithGrades: grade.studentsWithGrades
        });
      });
      
      // Validate that we have valid data before setting state
      if (processedGrades.length === 0) {
        console.warn('No processed grades found - this might indicate a data processing issue');
        setError('No course sections found for this faculty member.');
      } else {
        console.log(`Successfully processed ${processedGrades.length} sections`);
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

  const handleCourseSelect = async (courseId) => {
    console.log('=== COURSE SELECTION ===');
    console.log('Selected course ID (section ID):', courseId);
    
    setSelectedCourseId(courseId);
    
    // Find the SPECIFIC SECTION from gradesList
    const sectionData = gradesList.find(grade => grade.id === courseId);
    if (!sectionData) {
      console.error('Section not found in gradesList:', courseId);
      return;
    }
    
    console.log('Found section data:', sectionData);
    console.log('Section name:', sectionData.section);
    console.log('Section ID for API call:', courseId);
    
    // Fetch students for this SPECIFIC SECTION
    try {
      console.log('Fetching students for section ID:', courseId);
      const studentsResponse = await facultyGradesAPI.getSectionStudents(courseId);
      console.log('Students response for section', sectionData.section, ':', studentsResponse);
      
      const studentsData = studentsResponse.data || [];
      console.log(`Raw students data for section ${sectionData.section}:`, studentsData);
      
      // Process the students data to match the expected format
      const processedStudents = studentsData.map((studentDto, index) => {
        console.log('Processing student DTO for section', sectionData.section, ':', studentDto);
        
        // Validate student ID and provide fallbacks
        const studentId = studentDto.id || studentDto.studentId || `student-${index}`;
        const enrollmentId = studentDto.enrolledCourseID || studentDto.enrollmentId || `enrollment-${index}`;
        
        if (!studentDto.id && !studentDto.studentId) {
          console.warn('Student DTO missing ID, using fallback:', studentId, studentDto);
        }
        
        return {
          id: studentId,
          name: `${studentDto.lastName || 'Unknown'}, ${studentDto.firstName || 'Unknown'}`,
          email: studentDto.email || '',
          yearLevel: studentDto.yearLevel || '',
          program: studentDto.programName || 'Unknown Program',
          midterm: studentDto.midtermGrade || null,
          final: studentDto.finalGrade || null,
          weightedAverage: studentDto.overallGrade || null,
          enrollmentId: enrollmentId,
          enrollmentStatus: studentDto.status || 'PENDING',
          semesterEnrollmentId: studentDto.semesterEnrollmentID,
          remark: studentDto.remark || 'INCOMPLETE'
        };
      }).filter(student => student.id); // Remove any students without valid IDs
      
      console.log(`Processed ${processedStudents.length} students for section ${sectionData.section}:`, processedStudents);
      
      // Debug: Check for duplicate IDs
      const studentIds = processedStudents.map(s => s.id);
      const duplicateIds = studentIds.filter((id, index) => studentIds.indexOf(id) !== index);
      if (duplicateIds.length > 0) {
        console.warn('Found duplicate student IDs:', duplicateIds);
      }
      
      // Create updated section data with ONLY these students
      const updatedSection = {
        ...sectionData,
        students: processedStudents
      };
      
      console.log('Updated section with students:', {
        id: updatedSection.id,
        section: updatedSection.section,
        course: updatedSection.course,
        studentCount: updatedSection.students.length,
        students: updatedSection.students.map(s => ({ id: s.id, name: s.name, section: sectionData.section }))
      });
      
      setSelectedCourse(updatedSection);
      
      // Also update the gradesList to cache the students for this specific section
      setGradesList(prevGradesList => 
        prevGradesList.map(grade => 
          grade.id === courseId 
            ? { ...grade, students: processedStudents }
            : grade
        )
      );
      
      console.log(`Successfully loaded ${processedStudents.length} students for section: ${sectionData.section}`);
      
    } catch (error) {
      console.error('Error fetching students for section:', error);
      // Set the course without students
      setSelectedCourse({
        ...sectionData,
        students: []
      });
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    const student = selectedCourse.students.find(s => s.id === studentId);
    if (!student) {
      console.error(`Student with ID ${studentId} not found in selected course`);
      return;
    }
    
    if (!student.enrollmentId) {
      console.error(`No enrollment ID found for student ${studentId}:`, student);
      showToast(`Cannot update grades for student ${studentId}: No enrollment ID found`, 'error');
      return;
    }

    console.log(`=== GRADE CHANGE DEBUG ===`);
    console.log(`Updating ${field} for student ${studentId} (enrollmentId: ${student.enrollmentId}) in course ${selectedCourse.id} to: ${value}`);
    console.log(`Selected course ID: ${selectedCourse.id}`);
    console.log(`Selected course name: ${selectedCourse.name || selectedCourse.course}`);

    // Create a unique key for this student in this specific course
    const studentCourseKey = `${studentId}-${selectedCourse.id}`;
    console.log(`Student-course key: ${studentCourseKey}`);
    
    const grades = studentsGrades[studentCourseKey] || {};
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

    const gradeData = {
      ...updatedGrades,
      weightedAverage: newWeightedAverage,
      enrollmentId: student.enrollmentId,
      studentId: studentId,
      courseId: selectedCourse.id,
      hasChanges: true // Mark this student's grades as changed
    };

    console.log(`Storing grade data for key ${studentCourseKey}:`, gradeData);

    // Only update local state - no backend save
    setStudentsGrades(prev => ({
      ...prev,
      [studentCourseKey]: gradeData
    }));
  };

  // New function to handle encoding/saving all changed grades
  const handleEncodeGrades = async () => {
    if (!selectedCourse) {
      showToast('No course selected', 'error');
      return;
    }

    console.log('=== ENCODING GRADES DEBUG ===');
    console.log('Selected course ID:', selectedCourse.id);
    console.log('Selected course:', selectedCourse);
    console.log('All studentsGrades entries:', Object.entries(studentsGrades));
    
    // Filter to only get changes for the current selected course with extra validation
    const changedStudents = Object.entries(studentsGrades).filter(([key, grades]) => {
      const hasChanges = grades.hasChanges === true;
      const courseMatches = grades.courseId === selectedCourse.id;
      const keyMatchesCourse = key.endsWith(`-${selectedCourse.id}`);
      
      console.log(`Checking student key: ${key}`);
      console.log(`  - hasChanges: ${hasChanges}`);
      console.log(`  - courseMatches: ${courseMatches} (${grades.courseId} === ${selectedCourse.id})`);
      console.log(`  - keyMatchesCourse: ${keyMatchesCourse}`);
      
      return hasChanges && courseMatches && keyMatchesCourse;
    });
    
    console.log('Filtered changed students:', changedStudents);
    
    if (changedStudents.length === 0) {
      showToast('No grades have been changed for this course', 'error');
      return;
    }

    console.log('=== ENCODING GRADES ===');
    console.log('Changed students for course:', selectedCourse.id);
    console.log('Changed students count:', changedStudents.length);
    console.log('Changed students data:', changedStudents);

    try {
      setSaveLoading(prev => ({
        ...prev,
        all: true
      }));

      let successCount = 0;
      let errorCount = 0;

      // Save each student's grades
      for (const [studentCourseKey, grades] of changedStudents) {
        try {
          // Additional validation: ensure the student exists in the current course
          // The key format is "studentId-courseId", where courseId can be a complex string
          // We need to extract studentId from the beginning and courseId from the rest
          
          // Find the first dash to separate studentId from courseId
          const firstDashIndex = studentCourseKey.indexOf('-');
          if (firstDashIndex === -1) {
            console.error(`Invalid key format: ${studentCourseKey}`);
            errorCount++;
            continue;
          }
          
          const studentIdStr = studentCourseKey.substring(0, firstDashIndex);
          const courseIdStr = studentCourseKey.substring(firstDashIndex + 1);
          const studentId = parseInt(studentIdStr);
          
          console.log(`Parsing key: ${studentCourseKey}`);
          console.log(`  - studentId: ${studentId}`);
          console.log(`  - courseId: ${courseIdStr}`);
          console.log(`  - selectedCourse.id: ${selectedCourse.id}`);
          
          if (courseIdStr !== selectedCourse.id) {
            console.error(`Course ID mismatch for key ${studentCourseKey}: ${courseIdStr} !== ${selectedCourse.id}`);
            errorCount++;
            continue;
          }
          
          const studentInCourse = selectedCourse.students.find(s => s.id === studentId);
          if (!studentInCourse) {
            console.error(`Student ${studentId} not found in selected course ${selectedCourse.id}`);
            errorCount++;
            continue;
          }
          
          // Validate enrollment ID
          if (!grades.enrollmentId) {
            console.error(`No enrollment ID found for student key ${studentCourseKey}`);
            errorCount++;
            continue;
          }

          const updateData = {
            midtermGrade: grades.midterm,
            finalGrade: grades.final,
            overallGrade: grades.weightedAverage,
            remark: grades.remark || 'INCOMPLETE'
          };

          console.log(`Updating grades for student key ${studentCourseKey} with enrollment ID ${grades.enrollmentId}:`, updateData);
          
          const response = await facultyGradesAPI.updateGrades(grades.enrollmentId, updateData);
          console.log(`API response for student key ${studentCourseKey}:`, response);
          
          if (response && (response.status === 200 || response.status === 204)) {
            console.log(`Successfully updated grades for student key ${studentCourseKey}`);
            successCount++;
          } else {
            console.error(`Unexpected response for student key ${studentCourseKey}:`, response);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating grades for student key ${studentCourseKey}:`, error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          errorCount++;
        }
      }

      console.log(`Encoding complete: ${successCount} successful, ${errorCount} failed`);

      if (successCount > 0) {
        // Create a deep copy of gradesList to avoid mutation issues
        const updatedGradesList = JSON.parse(JSON.stringify(gradesList));
        
        // Find and update the current course section
        const currentSectionIndex = updatedGradesList.findIndex(grade => grade.id === selectedCourse.id);
        
        if (currentSectionIndex !== -1) {
          console.log('Found matching grade section, updating students...');
          const currentSection = updatedGradesList[currentSectionIndex];
          
          // Update students with new grades while preserving all students
          currentSection.students = currentSection.students.map(student => {
            const studentCourseKey = `${student.id}-${selectedCourse.id}`;
            const updatedGrades = studentsGrades[studentCourseKey];
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

        // Clear only the temporary grades for this course
        setStudentsGrades(prev => {
          const newGrades = { ...prev };
          changedStudents.forEach(([key]) => {
            delete newGrades[key];
          });
          return newGrades;
        });
      }
      
      console.log('=== ENCODING COMPLETE ===');
      
      if (errorCount === 0) {
        showToast(`All ${successCount} grades have been successfully encoded!`, 'success');
      } else if (successCount > 0) {
        showToast(`${successCount} grades encoded successfully, ${errorCount} failed. Please check console for details.`, 'error');
      } else {
        showToast(`Failed to encode all grades. Please check console for details.`, 'error');
      }
    } catch (err) {
      console.error('Error encoding grades:', err);
      showToast('Failed to encode grades. Please try again.', 'error');
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
                          <div className={styles.semesterSub}>Section: {course.section}</div>
                          {course.schedule && (
                            <div className={styles.scheduleInfo}>
                              {course.schedule.day} {course.schedule.startTime}-{course.schedule.endTime}
                            </div>
                          )}
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
                    <div className={styles.headerCourseDetails}>
                      <span className={styles.headerCourseUnits}>
                        {selectedCourse.creditUnits} Units
                      </span>
                      {selectedCourse.schedule && (
                        <span className={styles.headerScheduleInfo}>
                          {selectedCourse.schedule.day} {selectedCourse.schedule.startTime}-{selectedCourse.schedule.endTime} ({selectedCourse.schedule.room})
                        </span>
                      )}
                    </div>
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
              
              {/* Current Section Display */}
              {selectedCourse && (
                <div className={styles.sectionInfo}>
                  <h3>Section: {selectedCourse.section} - {selectedCourse.course}</h3>
                  <p>Students: {selectedCourse.students?.length || 0} enrolled</p>
                </div>
              )}
              
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
                      console.log('selectedCourse?.id:', selectedCourse?.id);
                      console.log('selectedCourse?.section:', selectedCourse?.section);
                      console.log('selectedCourse?.course:', selectedCourse?.course);
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
                      return filteredStudents.map((student, index) => {
                        const studentCourseKey = `${student.id}-${selectedCourse.id}`;
                        const currentGrades = studentsGrades[studentCourseKey] || {};
                        const displayedMidterm = currentGrades.midterm ?? student.midterm;
                        const displayedFinal = currentGrades.final ?? student.final;
                        const displayedWeightedAverage = currentGrades.weightedAverage ?? student.weightedAverage;
                        
                        // Create a unique key with fallback
                        const uniqueKey = student.id ? `${student.id}-${selectedCourse.id}` : `student-${index}-${selectedCourse.id}`;
                        
                        return (
                          <tr key={uniqueKey}>
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
                                  className={`${styles.gradeInput} ${studentsGrades[studentCourseKey]?.hasChanges ? styles.changed : ''}`}
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
                                  className={`${styles.gradeInput} ${studentsGrades[studentCourseKey]?.hasChanges ? styles.changed : ''}`}
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
                                  value={studentsGrades[studentCourseKey]?.remark || student.remark || 'INCOMPLETE'}
                                  onChange={(e) => handleGradeChange(student.id, 'remark', e.target.value)}
                                  className={`${styles.remarkSelect} ${studentsGrades[studentCourseKey]?.hasChanges ? styles.changed : ''}`}
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
              {selectedCourse && (() => {
                const changedStudentsCount = Object.values(studentsGrades).filter(g => 
                  g.hasChanges && g.courseId === selectedCourse.id
                ).length;
                
                return changedStudentsCount > 0 ? (
                  <div className={styles.encodeGradesContainer}>
                    <button
                      onClick={handleEncodeGrades}
                      className={styles.encodeGradesButton}
                      disabled={saveLoading.all}
                    >
                      {saveLoading.all ? 'Encoding...' : `Encode Grades (${changedStudentsCount} student${changedStudentsCount !== 1 ? 's' : ''})`}
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notifications */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default FacultyGrades;
