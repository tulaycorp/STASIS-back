import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentEnrollment.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';
import { 
  curriculumAPI, 
  curriculumDetailAPI, 
  courseSectionAPI, 
  enrolledCourseAPI,
  studentAPI 
} from '../services/api';

function StudentEnrollment(props) {
  const [toast, setToast] = useState(null);

  // Call this function to show a toast
  const showToast = (message, type = "") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500); // Hide after 4.5s
  };


  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getUserInfo } = useStudentData();
  const navigate = useNavigate();
  
  // Student and curriculum data
  const { studentData, loading: studentLoading, error: studentError } = useStudentData();
  const [currentCurriculum, setCurrentCurriculum] = useState(null);
  const [curriculumCourses, setCurriculumCourses] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState('available');
  const [selectedYearLevel, setSelectedYearLevel] = useState('current');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  
  // New state for bulk enrollment
  const [selectedCourses, setSelectedCourses] = useState({}); // courseId -> sectionId mapping
  const [selectedSections, setSelectedSections] = useState({}); // courseId -> section object mapping

  // Fetch curriculum and enrollment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!studentData?.id) {
          throw new Error('No student data available');
        }

        console.log('Fetching data for student:', studentData);

        // First get the student's curriculum
        const studentResponse = await studentAPI.getStudentById(studentData.id);
        const student = studentResponse.data;
        console.log('Student data fetched:', student);

        if (!student.curriculum?.curriculumID) {
          throw new Error('No curriculum assigned to student');
        }

        // Fetch curriculum details
        const curriculumResponse = await curriculumAPI.getCurriculumById(student.curriculum.curriculumID);
        setCurrentCurriculum(curriculumResponse.data);
        console.log('Curriculum fetched:', curriculumResponse.data);

        // Fetch curriculum courses with details
        const curriculumDetailsResponse = await curriculumDetailAPI.getDetailsByCurriculum(student.curriculum.curriculumID);
        const curriculumDetails = curriculumDetailsResponse.data;
        console.log('Curriculum details fetched:', curriculumDetails);

        // Transform curriculum details to include full course information
        const coursesWithDetails = curriculumDetails.map(detail => {
          console.log('Processing curriculum detail:', detail);
          console.log('Course in detail:', detail.course);
          
          if (!detail.course) {
            console.error('No course found in curriculum detail:', detail);
            return null;
          }
          
          return {
            curriculumDetailId: detail.curriculumDetailID,
            courseId: detail.course.id,
            courseCode: detail.course.courseCode,
            courseName: detail.course.courseDescription,
            description: detail.course.courseDescription,
            yearLevel: detail.YearLevel || detail.yearLevel,
            semester: detail.Semester || detail.semester,
            credits: detail.course.credits
          };
        }).filter(course => course !== null);
        
        setCurriculumCourses(coursesWithDetails);
        console.log('Transformed curriculum courses:', coursesWithDetails);

        // Fetch available sections
        const sectionsResponse = await courseSectionAPI.getAllSections();
        setAvailableSections(sectionsResponse.data);
        console.log('Sections fetched:', sectionsResponse.data);

        // Fetch student's current enrollments
        try {
          console.log('Fetching enrollments for student ID:', studentData.id);
          const enrollmentsResponse = await enrolledCourseAPI.getEnrolledCoursesByStudent(studentData.id);
          console.log('Raw enrollments response:', enrollmentsResponse);
          console.log('Enrollments data:', enrollmentsResponse.data);
          console.log('Number of enrollments:', enrollmentsResponse.data?.length || 0);
          
          // Log each enrollment for debugging
          if (enrollmentsResponse.data && enrollmentsResponse.data.length > 0) {
            enrollmentsResponse.data.forEach((enrollment, index) => {
              console.log(`Enrollment ${index + 1}:`, {
                id: enrollment.enrolledCourseID,
                status: enrollment.status,
                section: enrollment.section,
                semesterEnrollment: enrollment.semesterEnrollment
              });
            });
          }
          
          setMyEnrollments(enrollmentsResponse.data || []);
        } catch (enrollmentError) {
          console.error('Failed to fetch enrollments:', enrollmentError);
          console.error('Error details:', {
            message: enrollmentError.message,
            response: enrollmentError.response?.data,
            status: enrollmentError.response?.status
          });
          setMyEnrollments([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching enrollment data:', err);
        if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
          setError('Unable to connect to server. Please check if the backend is running on http://localhost:8080');
        } else {
          setError(err.message || 'Failed to load enrollment data');
        }
        setLoading(false);
      }
    };

    if (studentData && !studentLoading) {
      fetchData();
    }
  }, [studentData, studentLoading]);

    // Get courses available for enrollment based on student type
    const getAvailableCoursesForEnrollment = () => {
      if (!studentData || !curriculumCourses.length) {
        console.log('Missing required data for enrollment:', {
          hasStudentData: !!studentData,
          curriculumCoursesLength: curriculumCourses.length
        });
        return [];
      }

      console.log('Getting available courses for enrollment...');
      console.log('Curriculum courses:', curriculumCourses);

      // Filter curriculum courses based on semester selection
      let eligibleCourses = curriculumCourses.filter(curriculumDetail => {
        const semesterCondition = selectedSemester === 'all' || 
          curriculumDetail.semester === selectedSemester || 
          curriculumDetail.semester === Number(selectedSemester);
        
        // Check if student is not already enrolled in this course
        const notCurrentlyEnrolled = !myEnrollments.some(e => 
          e.section?.course?.id === curriculumDetail.courseId && e.status === 'Enrolled'
        );

        console.log('Course filter check:', {
          courseId: curriculumDetail.courseId,
          courseName: curriculumDetail.courseName,
          semester: curriculumDetail.semester,
          semesterCondition,
          notCurrentlyEnrolled
        });

        return semesterCondition && notCurrentlyEnrolled;
      });

      console.log('Eligible courses after filtering:', eligibleCourses);

      // Add available sections to each course (sections are optional)
      return eligibleCourses.map(curriculumDetail => {
        // Find matching sections for this course
        const courseSections = availableSections.filter(section => {
          // Debug the structure of each section to understand what we're working with
          console.log(`Checking section ${section.sectionID || section.id} for course ${curriculumDetail.courseId}:`, {
            sectionCourseId: section.course?.id,
            directCourseId: section.courseId,
            course_id: section.course_id,
            course: section.course,
            status: section.status,
            scheduleStatus: section.schedule?.status
          });
          
          // Convert IDs to strings for comparison to avoid type mismatches
          const courseIdStr = String(curriculumDetail.courseId);
          
          // Check if section has course object with matching ID
          if (section.course && (String(section.course.id) === courseIdStr || String(section.course.courseID) === courseIdStr)) {
            return true;
          }
          
          // Check if section has courseId field directly
          if (section.courseId && String(section.courseId) === courseIdStr) {
            return true;
          }
          
          // Check if section has course_id field
          if (section.course_id && String(section.course_id) === courseIdStr) {
            return true;
          }
          
          return false;
        });
        
        console.log('Sections found for course', curriculumDetail.courseId, ':', courseSections.length);
        if (courseSections.length > 0) {
          console.log('First matching section:', courseSections[0]);
        }
        
        return {
          ...curriculumDetail,
          availableSections: courseSections
        };
      });
      // Don't filter out courses without sections - show all curriculum courses
    };

  // Filter courses based on search
  const filteredCourses = getAvailableCoursesForEnrollment().filter(course => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      course.courseCode?.toLowerCase().includes(searchLower) ||
      course.courseName?.toLowerCase().includes(searchLower) ||
      course.description?.toLowerCase().includes(searchLower)
    );
  });

  // Handle enrollment
  const handleEnroll = (section) => {
    setSelectedSection(section);
    setShowEnrollModal(true);
  };

  const confirmEnrollment = async () => {
    if (!selectedSection) return;

    try {
      setEnrollmentLoading(true);

      const enrollmentData = {
        studentId: studentData.id,
        courseSectionId: selectedSection.sectionID,
        status: 'Enrolled'
      };

      const response = await enrolledCourseAPI.createEnrollment(enrollmentData);
      const newEnrollment = response.data;

      setMyEnrollments(prev => [...prev, newEnrollment]);
      
      setShowEnrollModal(false);
      setSelectedSection(null);
      showToast('Successfully enrolled in the course!', 'success');
    } catch (error) {
      console.error('Enrollment error:', error);
      showToast('Failed to enroll in course. Please try again.', 'error'); 
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Handle bulk enrollment
  const handleBulkEnroll = async () => {
    const selectedCount = Object.keys(selectedCourses).length;
    if (selectedCount === 0) return;

    if (!window.confirm(`Are you sure you want to enroll in ${selectedCount} course(s)?`)) return;

    try {
      setEnrollmentLoading(true);
      const enrollmentPromises = [];

      // Create enrollment for each selected course
      for (const [courseId, sectionId] of Object.entries(selectedCourses)) {
        const enrollmentData = {
          studentId: studentData.id,
          courseSectionId: parseInt(sectionId),
          status: 'Enrolled'
        };
        enrollmentPromises.push(enrolledCourseAPI.createEnrollment(enrollmentData));
      }

      // Wait for all enrollments to complete
      const responses = await Promise.all(enrollmentPromises);
      const newEnrollments = responses.map(response => response.data);

      // Update state
      setMyEnrollments(prev => [...prev, ...newEnrollments]);
      setSelectedCourses({});
      setSelectedSections({});

      showToast(`Successfully enrolled in ${selectedCount} course(s)!`, 'success'); // replaced alert
    } catch (error) {
      console.error('Bulk enrollment error:', error);
      showToast('Failed to enroll in some courses. Please try again.', 'error'); // replaced alert
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Handle drop
  const handleDrop = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;

    try {
      await enrolledCourseAPI.deleteEnrollment(enrollmentId);
      
      // Remove from enrollments
      setMyEnrollments(prev => prev.filter(e => e.enrolledCourseID !== enrollmentId));
      showToast('Course dropped successfully!', 'success');
    } catch (error) {
      console.error('Drop error:', error);
      showToast('Failed to drop course. Please try again.', 'error');
    }
  };

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      return time; // Return original if formatting fails
    }
  };

  // Get year level options for irregular students
  const getYearLevelOptions = () => {
    if (!studentData) return [];
    
    const options = [{ value: 'current', label: `Up to Year ${studentData.year_level}` }];
    for (let i = 1; i <= studentData.year_level; i++) {
      options.push({ value: i.toString(), label: `Year ${i}` });
    }
    return options;
  };

  // Statistics calculations
  const totalAvailableCourses = filteredCourses.length;
  const myTotalCredits = myEnrollments.reduce((sum, enrollment) => {
    const credits = enrollment.section?.course?.credits || 0;
    return sum + credits;
  }, 0);

  if (loading || studentLoading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading enrollment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || studentError) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={getUserInfo()} />
        <div className="main-content">
          <div className="error-container">
            <h2>Error Loading Enrollment Data</h2>
            <p>{error || studentError}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar userInfo={getUserInfo()} />

      {/* Main Content */}
      <div className="main-content">
        <div className="content-wrapper">
          <div className="breadcrumb">
            <span 
              className="breadcrumb-link" 
              onClick={() => navigate('/student-dashboard')}
            >
              Dashboard
            </span>
            <span className="breadcrumb-separator"> / </span>
            <span className="breadcrumb-current">Enrollment</span>
          </div>
          
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">Course Enrollment</h1>
            <div className="student-info">
              <p><strong>Program:</strong> {studentData?.program?.programName || 'N/A'}</p>
              <p><strong>Year Level:</strong> {studentData?.year_level}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Available Courses</div>
              <div className="stat-value">{totalAvailableCourses}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Enrolled Courses</div>
              <div className="stat-value">{myEnrollments.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Credits</div>
              <div className="stat-value">{myTotalCredits}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Curriculum</div>
              <div className="stat-value">{studentData?.curriculum?.curriculumName || 'N/A'}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`page-btn ${selectedTab === 'available' ? 'active' : ''}`}
              onClick={() => setSelectedTab('available')}
            >
              Available Courses
            </button>
            <button 
              className={`page-btn ${selectedTab === 'enrolled' ? 'active' : ''}`}
              onClick={() => setSelectedTab('enrolled')}
            >
              My Enrollments ({myEnrollments.length})
            </button>
          </div>

          {/* Course List */}
          <div className="schedule-list-container">
            <div className="list-header" style={{ marginBottom: '20px' }}>
              <div className="list-controls">
                <h2 className="list-title">
                  {selectedTab === 'available' ? 'Available Courses' : 'My Enrollments'}
                </h2>
                {selectedTab === 'available' && (
                  <div className="controls">
                    <select 
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="select-input"
                    >
                      <option value="all">All Semesters</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                      <option value="3">Summer</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                )}
              </div>
            </div>

            {selectedTab === 'available' && (
              <div className="enrollment-actions" style={{ marginBottom: '20px' }}>
                <button 
                  className="btn-primary"
                  onClick={handleBulkEnroll}
                  disabled={Object.keys(selectedCourses).length === 0 || enrollmentLoading}
                >
                  {enrollmentLoading ? 'Enrolling...' : `Enroll Now (${Object.keys(selectedCourses).length} courses)`}
                </button>
              </div>
            )}

            <div className="table-container">
              {selectedTab === 'available' ? (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Year/Semester</th>
                      <th>Credits</th>
                      <th>Schedule</th>
                      <th>Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          No courses available for enrollment
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course) => (
                        <tr key={course.curriculumDetailId}>
                          <td>{course.courseCode}</td>
                          <td>
                            <div className="schedule-info">
                              <div className="schedule-course">{course.courseName}</div>
                              {course.description && (
                                <div className="schedule-section">{course.description}</div>
                              )}
                            </div>
                          </td>
                          <td>Year {course.yearLevel} - Sem {course.semester}</td>
                          <td className="font-semibold">{course.credits}</td>
                          <td>
                              <select
                                className="form-select"
                                value={selectedCourses[course.courseId] || ''}
                                onChange={(e) => {
                                  const sectionId = e.target.value;
                                  if (!sectionId) {
                                    // If no section is selected, remove from both states
                                    const { [course.courseId]: _, ...restCourses } = selectedCourses;
                                    const { [course.courseId]: __, ...restSections } = selectedSections;
                                    setSelectedCourses(restCourses);
                                    setSelectedSections(restSections);
                                    return;
                                  }
                                  
                                  const section = availableSections.find(s => s.sectionID.toString() === sectionId);
                                  if (section) {
                                    setSelectedCourses(prev => ({
                                      ...prev,
                                      [course.courseId]: sectionId
                                    }));
                                    setSelectedSections(prev => ({
                                      ...prev,
                                      [course.courseId]: section
                                    }));
                                  }
                                }}
                              >
                                <option value="">Select Schedule</option>
                                {course.availableSections && course.availableSections.length > 0 ? (
                                  course.availableSections
                                    .filter(section => 
                                      section.status === 'Active' || 
                                      section.status === 'ACTIVE' ||
                                      section.schedule?.status === 'Active' || 
                                      section.schedule?.status === 'ACTIVE'
                                    )
                                    .map(section => (
                                      <option 
                                        key={section.sectionID} 
                                        value={section.sectionID}
                                      >
                                        {section.sectionName} - {section.schedule?.day || 'TBA'} {formatTime(section.schedule?.startTime)}-{formatTime(section.schedule?.endTime)} {section.schedule?.room ? `• ${section.schedule.room}` : ''}
                                      </option>
                                    ))
                                ) : null}
                              </select>
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={!!selectedCourses[course.courseId]}
                              onChange={(e) => {
                                if (!e.target.checked) {
                                  const { [course.courseId]: _, ...rest } = selectedCourses;
                                  const { [course.courseId]: __, ...sectionsRest } = selectedSections;
                                  setSelectedCourses(rest);
                                  setSelectedSections(sectionsRest);
                                }
                              }}
                              disabled={!course.availableSections?.length || !selectedCourses[course.courseId]}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Section</th>
                      <th>Schedule</th>
                      <th>Credits</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No enrollments found
                        </td>
                      </tr>
                    ) : (
                      myEnrollments.map((enrollment) => (
                        <tr key={enrollment.enrolledCourseID}>
                          <td>{enrollment.section?.course?.courseCode || 'N/A'}</td>
                          <td>
                            <div className="schedule-info">
                              <div className="schedule-course">{enrollment.section?.course?.courseName || enrollment.section?.course?.courseDescription || 'N/A'}</div>
                            </div>
                          </td>
                          <td>{enrollment.section?.sectionName || 'N/A'}</td>
                          <td>
                            <div className="time-info">
                              <div className="time-period">
                                {formatTime(enrollment.section?.schedule?.startTime)} - {formatTime(enrollment.section?.schedule?.endTime)}
                              </div>
                              <div className="day-info">{enrollment.section?.schedule?.day || 'TBA'}</div>
                            </div>
                          </td>
                          <td className="font-semibold">{enrollment.section?.course?.credits || 0}</td>
                          <td>
                            <span className="status-badge status-active">
                              {enrollment.status}
                            </span>
                          </td>
                          <td>
                            {enrollment.status === 'Enrolled' && (
                              <button 
                                className="btn-primary"
                                onClick={() => handleDrop(enrollment.enrolledCourseID)}
                              >
                                Drop
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="table-footer">
              <div className="table-info">
                {selectedTab === 'available' 
                  ? `Showing ${filteredCourses.length} available courses`
                  : `Showing ${myEnrollments.length} enrollments`
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Confirmation Modal */}
      {showEnrollModal && selectedSection && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Enrollment</h3>
            </div>
            <div className="modal-content">
              <div className="enrollment-details">
                <p><strong>Course:</strong> {selectedSection.course?.courseCode} - {selectedSection.course?.courseName}</p>
                <p><strong>Section:</strong> {selectedSection.sectionName}</p>
                <p><strong>Instructor:</strong> {selectedSection.faculty?.firstName} {selectedSection.faculty?.lastName}</p>
                <p><strong>Schedule:</strong> {selectedSection.schedule?.day || 'TBA'}, {formatTime(selectedSection.schedule?.startTime)} - {formatTime(selectedSection.schedule?.endTime)}</p>
                <p><strong>Room:</strong> {selectedSection.schedule?.room || 'TBA'}</p>
                <p><strong>Credits:</strong> {selectedSection.course?.credits}</p>
                <p><strong>Capacity:</strong> {selectedSection.enrolledCount || 0}/{selectedSection.capacity}</p>
                <br />
                <p>Are you sure you want to enroll in this section?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowEnrollModal(false)}
                disabled={enrollmentLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={confirmEnrollment}
                disabled={enrollmentLoading}
              >
                {enrollmentLoading ? 'Enrolling...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div id="toast-container">
        {toast && (
          <div className={`toast${toast.type ? " " + toast.type : ""}`}>
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEnrollment;