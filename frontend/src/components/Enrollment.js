import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Enrollment.module.css';
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

  // Add the showSection function
  const showSection = (section) => {
    switch(section){
      case 'StudentDashboard':
        navigate('/student-dashboard');
        break;
      case 'StudentSchedule':
        navigate('/student-schedule');
        break;
      case 'Enrollment':
        navigate('/enrollment');
        break;
      case 'StudentCurriculum':
        navigate('/student-curriculum');
        break;
      case 'StudentGrades':
        navigate('/student-grades');
        break;
      case 'StudentSettings':
        navigate('/student-settings');
        break;
      default:
        // No action for unknown sections
    }
  };

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
      <div className={styles.dashboardContainer}>
        <Sidebar 
          onNavigate={showSection}
          userInfo={{ name: "Loading...", role: "Student" }}
          sections={[
            {
              items: [{ id: 'StudentDashboard', label: 'Dashboard', icon: '📊' }]
            },
            {
              label: 'Management',
              items: [
                { id: 'StudentSchedule', label: 'Schedule', icon: '📅' },
                { id: 'Enrollment', label: 'Enrollment', icon: '📝' },
                { id: 'StudentCurriculum', label: 'Curriculum', icon: '📚' },
                { id: 'StudentGrades', label: 'Grades', icon: '📈' }
              ]
            },
            {
              label: 'System',
              items: [
                { id: 'StudentSettings', label: 'Settings', icon: '⚙️'}
              ]
            }
          ]}
        />
        <div className={styles.mainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading enrollment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar 
          onNavigate={showSection}
          userInfo={{ name: "Error", role: "Student" }}
          sections={[
            {
              items: [{ id: 'StudentDashboard', label: 'Dashboard', icon: '📊' }]
            },
            {
              label: 'Management',
              items: [
                { id: 'StudentSchedule', label: 'Schedule', icon: '📅' },
                { id: 'Enrollment', label: 'Enrollment', icon: '📝' },
                { id: 'StudentCurriculum', label: 'Curriculum', icon: '📚' },
                { id: 'StudentGrades', label: 'Grades', icon: '📈' }
              ]
            },
            {
              label: 'System',
              items: [
                { id: 'StudentSettings', label: 'Settings', icon: '⚙️'}
              ]
            }
          ]}
        />
        <div className={styles.mainContent}>
          <div className={styles.errorContainer}>
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar 
        onNavigate={showSection}
        userInfo={{ 
          name: `${studentData?.firstName} ${studentData?.lastName}`, 
          role: `${studentData?.studentType} Student` 
        }}
        sections={[
          {
            items: [{ id: 'StudentDashboard', label: 'Dashboard', icon: '📊' }]
          },
          {
            label: 'Management',
            items: [
              { id: 'StudentSchedule', label: 'Schedule', icon: '📅' },
              { id: 'Enrollment', label: 'Enrollment', icon: '📝' },
              { id: 'StudentCurriculum', label: 'Curriculum', icon: '📚' },
              { id: 'StudentGrades', label: 'Grades', icon: '📈' }
            ]
          },
          {
            label: 'System',
            items: [
              { id: 'StudentSettings', label: 'Settings', icon: '⚙️'}
            ]
          }
        ]}
      />
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Course Enrollment</h1>
            <div className={styles.studentInfo}>
              <p><strong>Program:</strong> {currentCurriculum?.programName || 'N/A'}</p>
              <p><strong>Year Level:</strong> {studentData?.yearLevel}</p>
              <p><strong>Student Type:</strong> {studentData?.studentType}</p>
            </div>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Available Courses</div>
              <div className={styles.statValue}>{filteredCourses.length}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Enrolled Courses</div>
              <div className={styles.statValue}>{myEnrollments.length}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Credits</div>
              <div className={styles.statValue}>{myTotalCredits}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Student Type</div>
              <div className={styles.statValue}>{studentData?.studentType}</div>
            </div>
          </div>
          
          <div className={styles.tabNavigation}>
            <button 
              className={`${styles.tabBtn} ${selectedTab === 'available' ? styles.active : ''}`} 
              onClick={() => setSelectedTab('available')}
            >
              Available Courses
            </button>
            <button 
              className={`${styles.tabBtn} ${selectedTab === 'enrolled' ? styles.active : ''}`} 
              onClick={() => setSelectedTab('enrolled')}
            >
              My Enrollments ({myEnrollments.length})
            </button>
          </div>

          <div className={styles.scheduleListContainer}>
            <div className={styles.listHeader}>
              <div className={styles.listControls}>
                <h2 className={styles.listTitle}>
                  {selectedTab === 'available' ? 'Available Courses' : 'My Enrollments'}
                </h2>
                {selectedTab === 'available' && (
                  <div className={styles.controls}>
                    {studentData?.studentType === 'Irregular' && (
                      <select 
                        value={selectedYearLevel} 
                        onChange={(e) => setSelectedYearLevel(e.target.value)} 
                        className={styles.selectInput}
                      >
                        {getYearLevelOptions().map(option => 
                          <option key={option.value} value={option.value}>{option.label}</option>
                        )}
                      </select>
                    )}
                    <select 
                      value={selectedSemester} 
                      onChange={(e) => setSelectedSemester(e.target.value)} 
                      className={styles.selectInput}
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
                      className={styles.searchInput} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className={styles.tableContainer}>
              {selectedTab === 'available' ? (
                <table className={styles.scheduleTable}>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Details</th>
                      <th>Sections</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan="3" className={styles.textCenter}>
                          No courses available that match your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map(course => (
                        <tr key={course.curriculumDetailId}>
                          <td>
                            <div className={styles.coursePrimaryInfo}>
                              <span className={styles.courseCode}>{course.courseCode}</span>
                              <span className={styles.courseName}>{course.courseName}</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.courseSecondaryInfo}>
                              <span>Year {course.yearLevel}, Sem {course.semester}</span>
                              <span>{course.credits} Credits</span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.sectionsList}>
                              {course.availableSections.map(section => (
                                <div key={section.courseSectionId} className={styles.sectionItem}>
                                  <div className={styles.sectionDetails}>
                                    <strong>{section.sectionName}</strong>
                                    <span>{section.day} {formatTime(section.timeFrom)} - {formatTime(section.timeTo)}</span>
                                    <span>{section.instructorName} • {section.room}</span>
                                    <span>{section.enrolledCount}/{section.capacity} Slots</span>
                                  </div>
                                  <button 
                                    className={`${styles.btnPrimary} ${(section.enrolledCount >= section.capacity) ? styles.disabled : ''}`}
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
                <table className={styles.scheduleTable}>
                  <thead>
                    <tr>
                      <th>Course</th>
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
                        <td colSpan="6" className={styles.textCenter}>
                          You are not enrolled in any courses.
                        </td>
                      </tr>
                    ) : (
                      myEnrollments.map(enrollment => {
                        const course = curriculumCourses.find(c => c.courseId === enrollment.courseId);
                        return (
                          <tr key={enrollment.enrolledCourseId}>
                            <td>
                              {course?.courseCode || 'N/A'}<br/>
                              {course?.courseName || ''}
                            </td>
                            <td>{enrollment.sectionName}</td>
                            <td>
                              {enrollment.day}<br/>
                              {formatTime(enrollment.timeFrom)} - {formatTime(enrollment.timeTo)}<br/>
                              {enrollment.room}
                            </td>
                            <td className={styles.fontSemibold}>{course?.credits || 0}</td>
                            <td>
                              <span className={`${styles.statusBadge} ${styles.statusEnrolled}`}>
                                {enrollment.status}
                              </span>
                            </td>
                            <td>
                              {enrollment.status === 'Enrolled' && (
                                <button 
                                  className={styles.btnDanger} 
                                  onClick={() => handleDrop(enrollment)} 
                                  disabled={actionLoading}
                                >
                                  Drop
                                </button>
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

      {showEnrollModal && selectedSection && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Enrollment</h3>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.enrollmentDetails}>
                <p><strong>Course:</strong> {selectedSection.courseCode} - {selectedSection.courseName}</p>
                <p><strong>Section:</strong> {selectedSection.sectionName}</p>
                <p><strong>Schedule:</strong> {selectedSection.day}, {formatTime(selectedSection.timeFrom)} - {formatTime(selectedSection.timeTo)} in {selectedSection.room}</p>
                <p><strong>Instructor:</strong> {selectedSection.instructorName}</p>
                <p><strong>Credits:</strong> {selectedSection.credits}</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary} 
                onClick={() => setShowEnrollModal(false)} 
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className={styles.btnPrimary} 
                onClick={confirmEnrollment} 
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Confirm Enrollment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollment;