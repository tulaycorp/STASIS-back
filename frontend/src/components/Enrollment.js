import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Enrollment.module.css';
import Sidebar from './StudentSidebar';
import { 
  studentAPI, 
  curriculumAPI, 
  curriculumDetailAPI,
  courseSectionAPI,
  enrolledCourseAPI
} from '../services/api';

const Enrollment = () => {
  // State management for data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
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
  const [actionLoading, setActionLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError('');
      // In a real app, get this from an Auth Context: const { user } = useAuth(); const studentId = user.id;
      const studentId = 1;

      try {
        // Step 1: Fetch student data
        const studentRes = await studentAPI.getStudentById(studentId);
        const student = studentRes.data;
        setStudentData(student);

        if (!student.programId || !student.curriculumId) {
          throw new Error('Student is not assigned to a program or curriculum.');
        }

        // Step 2: Fetch all other required data in parallel
        const [
          curriculumRes, 
          curriculumDetailsRes, 
          sectionsRes, 
          enrollmentsRes
        ] = await Promise.all([
          curriculumAPI.getCurriculumById(student.curriculumId),
          curriculumDetailAPI.getDetailsByCurriculum(student.curriculumId),
          courseSectionAPI.getSectionsByProgram(student.programId),
          enrolledCourseAPI.getEnrolledCoursesByStudent(student.id)
        ]);

        setCurrentCurriculum(curriculumRes.data);
        setCurriculumCourses(curriculumDetailsRes.data);
        setAvailableSections(sectionsRes.data);
        setMyEnrollments(enrollmentsRes.data);

      } catch (err) {
        console.error("Failed to fetch enrollment data:", err);
        setError(err.response?.data?.message || err.message || "Could not load enrollment data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []); // Empty dependency array to run only once on mount

  // Memoize course filtering to optimize performance
  const availableCoursesForEnrollment = useMemo(() => {
    if (!studentData || !curriculumCourses.length || !availableSections.length) return [];

    const isRegular = studentData.studentType === 'Regular';
    const currentYear = studentData.yearLevel;

    // Get IDs of courses student is already enrolled in or has completed
    const enrolledCourseIds = new Set(myEnrollments.map(e => e.courseId));
    // Assume completed courses are also in `myEnrollments` with a 'Completed' status
    const completedCourseIds = new Set(
        myEnrollments.filter(e => e.status === 'Completed').map(e => e.courseId)
    );

    let eligibleCourses = [];

    if (isRegular) {
      eligibleCourses = curriculumCourses.filter(course => 
        course.yearLevel === currentYear && 
        !enrolledCourseIds.has(course.courseId) &&
        (selectedSemester === 'all' || course.semester === Number(selectedSemester))
      );
    } else { // Irregular
      eligibleCourses = curriculumCourses.filter(course => {
        const yearCondition = selectedYearLevel === 'current' 
          ? course.yearLevel <= currentYear 
          : course.yearLevel === parseInt(selectedYearLevel, 10);
        
        const semesterCondition = selectedSemester === 'all' || course.semester === Number(selectedSemester);
        
        return yearCondition && semesterCondition && !completedCourseIds.has(course.courseId) && !enrolledCourseIds.has(course.courseId);
      });
    }

    // Match eligible courses with available sections
    return eligibleCourses.map(course => ({
      ...course,
      availableSections: availableSections.filter(section => 
        section.courseId === course.courseId && section.status === 'Active'
      ),
    })).filter(course => course.availableSections.length > 0);

  }, [studentData, curriculumCourses, availableSections, myEnrollments, selectedYearLevel, selectedSemester]);
  
  const filteredCourses = useMemo(() => {
    if (!searchTerm) return availableCoursesForEnrollment;
    const searchLower = searchTerm.toLowerCase();
    return availableCoursesForEnrollment.filter(course =>
      course.courseCode?.toLowerCase().includes(searchLower) ||
      course.courseName?.toLowerCase().includes(searchLower)
    );
  }, [availableCoursesForEnrollment, searchTerm]);

  // --- ACTIONS (Enroll / Drop) ---

  const handleEnroll = (section) => {
    setSelectedSection(section);
    setShowEnrollModal(true);
  };

  const confirmEnrollment = async () => {
    if (!selectedSection || !studentData) return;
    setActionLoading(true);
    try {
      const enrollmentData = {
        studentId: studentData.id,
        courseSectionId: selectedSection.courseSectionId,
      };
      const response = await enrolledCourseAPI.createEnrollment(enrollmentData);
      
      // Update state to reflect the change immediately
      setMyEnrollments(prev => [...prev, response.data]);
      setAvailableSections(prev => prev.map(s => 
        s.courseSectionId === selectedSection.courseSectionId 
          ? { ...s, enrolledCount: s.enrolledCount + 1 } 
          : s
      ));
      
      setShowEnrollModal(false);
      setSelectedSection(null);
      alert('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      alert(error.response?.data?.message || 'Failed to enroll. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDrop = async (enrollment) => {
    if (!window.confirm(`Are you sure you want to drop ${enrollment.courseCode}?`)) return;
    setActionLoading(true);
    try {
      await enrolledCourseAPI.deleteEnrollment(enrollment.enrolledCourseId);

      // Update state to reflect the change immediately
      setMyEnrollments(prev => prev.filter(e => e.enrolledCourseId !== enrollment.enrolledCourseId));
      setAvailableSections(prev => prev.map(s => 
        s.courseSectionId === enrollment.courseSectionId
          ? { ...s, enrolledCount: Math.max(0, s.enrolledCount - 1) }
          : s
      ));
      
      alert('Course dropped successfully!');
    } catch (error) {
      console.error('Drop error:', error);
      alert(error.response?.data?.message || 'Failed to drop course. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return time;
    }
  };
  
  const getYearLevelOptions = () => {
    if (!studentData) return [];
    const options = [{ value: 'current', label: `Up to Year ${studentData.yearLevel}` }];
    for (let i = 1; i <= studentData.yearLevel; i++) {
      options.push({ value: i.toString(), label: `Year ${i}` });
    }
    return options;
  };

  const myTotalCredits = useMemo(() => {
    return myEnrollments.reduce((sum, enrollment) => {
      const course = curriculumCourses.find(c => c.courseId === enrollment.courseId);
      return sum + (course?.credits || 0);
    }, 0);
  }, [myEnrollments, curriculumCourses]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={{ name: "Loading...", role: "Student" }} />
        <div className="main-content"><div className="loading-container"><div className="loading-spinner"></div><p>Loading enrollment data...</p></div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar userInfo={{ name: "Error", role: "Student" }} />
        <div className="main-content"><div className="error-container"><h2>Error Loading Data</h2><p>{error}</p><button onClick={() => window.location.reload()}>Retry</button></div></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar 
        onNavigate={path => navigate(path)}
        userInfo={{ 
          name: `${studentData?.firstName} ${studentData?.lastName}`, 
          role: `${studentData?.studentType} Student` 
        }}
      />
      <div className="main-content">
        <div className="content-wrapper">
          {/* Header and Stats... */}
          <div className="page-header">
            <h1 className="page-title">Course Enrollment</h1>
            <div className="student-info">
              <p><strong>Program:</strong> {currentCurriculum?.programName || 'N/A'}</p>
              <p><strong>Year Level:</strong> {studentData?.yearLevel}</p>
              <p><strong>Student Type:</strong> {studentData?.studentType}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Available Courses</div>
              <div className="stat-value">{filteredCourses.length}</div>
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
              <div className="stat-label">Student Type</div>
              <div className="stat-value">{studentData?.studentType}</div>
            </div>
          </div>
          
          {/* Tab Navigation and Content... */}
          <div className="tab-navigation">
            <button className={`btn-secondary ${selectedTab === 'available' ? 'active' : ''}`} onClick={() => setSelectedTab('available')}>Available Courses</button>
            <button className={`btn-secondary ${selectedTab === 'enrolled' ? 'active' : ''}`} onClick={() => setSelectedTab('enrolled')}>My Enrollments ({myEnrollments.length})</button>
          </div>

          <div className="schedule-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">{selectedTab === 'available' ? 'Available Courses' : 'My Enrollments'}</h2>
                {selectedTab === 'available' && (
                  <div className="controls">
                    {studentData?.studentType === 'Irregular' && (
                      <select value={selectedYearLevel} onChange={(e) => setSelectedYearLevel(e.target.value)} className="select-input">
                        {getYearLevelOptions().map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    )}
                    <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="select-input">
                      <option value="all">All Semesters</option>
                      <option value="1">1st Semester</option>
                      <option value="2">2nd Semester</option>
                      <option value="3">Summer</option>
                    </select>
                    <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
                  </div>
                )}
              </div>
            </div>

            <div className="table-container">
              {selectedTab === 'available' ? (
                // Available Courses Table
                <table className="schedule-table">
                  {/* ... thead ... */}
                  <thead><tr><th>Course</th><th>Details</th><th>Sections</th></tr></thead>
                  <tbody>
                    {filteredCourses.length === 0 ? (
                      <tr><td colSpan="3" className="text-center">No courses available that match your criteria.</td></tr>
                    ) : (
                      filteredCourses.map(course => (
                        <tr key={course.curriculumDetailId}>
                          <td>
                            <div className="course-primary-info">
                              <span className="course-code">{course.courseCode}</span>
                              <span className="course-name">{course.courseName}</span>
                            </div>
                          </td>
                          <td>
                            <div className="course-secondary-info">
                              <span>Year {course.yearLevel}, Sem {course.semester}</span>
                              <span>{course.credits} Credits</span>
                            </div>
                          </td>
                          <td>
                            <div className="sections-list">
                              {course.availableSections.map(section => (
                                <div key={section.courseSectionId} className="section-item">
                                  <div className="section-details">
                                    <strong>{section.sectionName}</strong>
                                    <span>{section.day} {formatTime(section.timeFrom)} - {formatTime(section.timeTo)}</span>
                                    <span>{section.instructorName} • {section.room}</span>
                                    <span>{section.enrolledCount}/{section.capacity} Slots</span>
                                  </div>
                                  <button 
                                    className={`btn-primary ${(section.enrolledCount >= section.capacity) ? 'disabled' : ''}`}
                                    onClick={() => handleEnroll(section)}
                                    disabled={actionLoading || section.enrolledCount >= section.capacity}
                                  >
                                    {section.enrolledCount >= section.capacity ? 'Full' : 'Enroll'}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                // My Enrollments Table
                <table className="schedule-table">
                  {/* ... thead ... */}
                  <thead><tr><th>Course</th><th>Section</th><th>Schedule</th><th>Credits</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {myEnrollments.length === 0 ? (
                      <tr><td colSpan="6" className="text-center">You are not enrolled in any courses.</td></tr>
                    ) : (
                      myEnrollments.map(enrollment => {
                        const course = curriculumCourses.find(c => c.courseId === enrollment.courseId);
                        return (
                          <tr key={enrollment.enrolledCourseId}>
                            <td>{course?.courseCode || 'N/A'}<br/>{course?.courseName || ''}</td>
                            <td>{enrollment.sectionName}</td>
                            <td>{enrollment.day}<br/>{formatTime(enrollment.timeFrom)} - {formatTime(enrollment.timeTo)}<br/>{enrollment.room}</td>
                            <td className="font-semibold">{course?.credits || 0}</td>
                            <td><span className={`status-badge status-${enrollment.status.toLowerCase()}`}>{enrollment.status}</span></td>
                            <td>
                              {enrollment.status === 'Enrolled' && (
                                <button className="btn-danger" onClick={() => handleDrop(enrollment)} disabled={actionLoading}>Drop</button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && selectedSection && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header"><h3 className="modal-title">Confirm Enrollment</h3></div>
            <div className="modal-content">
              <div className="enrollment-details">
                <p><strong>Course:</strong> {selectedSection.courseCode} - {selectedSection.courseName}</p>
                <p><strong>Section:</strong> {selectedSection.sectionName}</p>
                <p><strong>Schedule:</strong> {selectedSection.day}, {formatTime(selectedSection.timeFrom)} - {formatTime(selectedSection.timeTo)} in {selectedSection.room}</p>
                <p><strong>Instructor:</strong> {selectedSection.instructorName}</p>
                <p><strong>Credits:</strong> {selectedSection.credits}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEnrollModal(false)} disabled={actionLoading}>Cancel</button>
              <button className="btn-primary" onClick={confirmEnrollment} disabled={actionLoading}>{actionLoading ? 'Processing...' : 'Confirm Enrollment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollment;