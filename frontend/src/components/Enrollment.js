import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Enrollment.module.css';
import Sidebar from './StudentSidebar';

const Enrollment = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Student and curriculum data
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
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  const navigate = useNavigate();

  // Hardcoded data
  const hardcodedStudentData = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    yearLevel: 2,
    studentType: 'Regular',
    programId: 1
  };

  const hardcodedCurriculum = {
    curriculumId: 1,
    programName: 'Bachelor of Science in Computer Science',
    status: 'Active'
  };

  const hardcodedCurriculumCourses = [
    {
      curriculumDetailId: 1,
      courseId: 1,
      courseCode: 'CS101',
      courseName: 'Introduction to Programming',
      description: 'Basic programming concepts and problem solving',
      yearLevel: 2,
      semester: 1,
      credits: 3
    },
    {
      curriculumDetailId: 2,
      courseId: 2,
      courseCode: 'MATH201',
      courseName: 'Discrete Mathematics',
      description: 'Mathematical foundations for computer science',
      yearLevel: 2,
      semester: 1,
      credits: 3
    }
  ];

  const hardcodedAvailableSections = [
    {
      courseSectionId: 1,
      courseId: 1,
      courseCode: 'CS101',
      courseName: 'Introduction to Programming',
      sectionName: 'CS101-A',
      day: 'MWF',
      timeFrom: '08:00',
      timeTo: '09:00',
      room: 'Room 101',
      instructorName: 'Dr. Smith',
      capacity: 30,
      enrolledCount: 15,
      status: 'Active',
      credits: 3
    },
    {
      courseSectionId: 2,
      courseId: 1,
      courseCode: 'CS101',
      courseName: 'Introduction to Programming',
      sectionName: 'CS101-B',
      day: 'TTH',
      timeFrom: '10:00',
      timeTo: '11:30',
      room: 'Room 102',
      instructorName: 'Prof. Johnson',
      capacity: 25,
      enrolledCount: 20,
      status: 'Active',
      credits: 3
    },
    {
      courseSectionId: 3,
      courseId: 2,
      courseCode: 'MATH201',
      courseName: 'Discrete Mathematics',
      sectionName: 'MATH201-A',
      day: 'MWF',
      timeFrom: '13:00',
      timeTo: '14:00',
      room: 'Room 201',
      instructorName: 'Dr. Brown',
      capacity: 35,
      enrolledCount: 10,
      status: 'Active',
      credits: 3
    }
  ];

  const hardcodedMyEnrollments = [
    {
      enrolledCourseId: 1,
      studentId: 1,
      courseId: 1,
      courseSectionId: 1,
      sectionName: 'CS101-A',
      day: 'MWF',
      timeFrom: '08:00',
      timeTo: '09:00',
      room: 'Room 101',
      status: 'Enrolled',
      enrollmentDate: '2024-01-15'
    }
  ];

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setStudentData(hardcodedStudentData);
      setCurrentCurriculum(hardcodedCurriculum);
      setCurriculumCourses(hardcodedCurriculumCourses);
      setAvailableSections(hardcodedAvailableSections);
      setMyEnrollments(hardcodedMyEnrollments);
      setLoading(false);
    }, 1000);
  }, []);

  // Get courses available for enrollment based on student type
  const getAvailableCoursesForEnrollment = () => {
    if (!studentData || !curriculumCourses.length || !availableSections.length) {
      return [];
    }

    const isRegular = studentData.studentType === 'Regular';
    const currentYear = studentData.yearLevel;

    let eligibleCourses = [];

    if (isRegular) {
      // Regular students: only courses for their current year and semester
      eligibleCourses = curriculumCourses.filter(course => 
        course.yearLevel === currentYear && 
        (selectedSemester === 'all' || course.semester === Number(selectedSemester))
      );
    } else {
      // Irregular students: courses from current year and below, minus completed courses
      const completedCourseIds = myEnrollments
        .filter(e => e.status === 'Completed' || (e.finalGrade && e.finalGrade >= 75))
        .map(e => e.courseId);

      eligibleCourses = curriculumCourses.filter(course => {
        const yearCondition = selectedYearLevel === 'current' 
          ? course.yearLevel <= currentYear 
          : course.yearLevel === parseInt(selectedYearLevel);
        
        const semesterCondition = selectedSemester === 'all' || course.semester === Number(selectedSemester);
        const notCompleted = !completedCourseIds.includes(course.courseId);
        const notCurrentlyEnrolled = !myEnrollments.some(e => 
          e.courseId === course.courseId && e.status === 'Enrolled'
        );

        return yearCondition && semesterCondition && notCompleted && notCurrentlyEnrolled;
      });
    }

    // Match with available sections
    return eligibleCourses.map(course => {
      const courseSections = availableSections.filter(section => 
        section.courseId === course.courseId
      );
      return {
        ...course,
        availableSections: courseSections
      };
    }).filter(course => course.availableSections.length > 0);
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

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newEnrollment = {
        enrolledCourseId: myEnrollments.length + 1,
        studentId: studentData.id,
        courseId: selectedSection.courseId,
        courseSectionId: selectedSection.courseSectionId,
        sectionName: selectedSection.sectionName,
        day: selectedSection.day,
        timeFrom: selectedSection.timeFrom,
        timeTo: selectedSection.timeTo,
        room: selectedSection.room,
        status: 'Enrolled',
        enrollmentDate: new Date().toISOString()
      };

      setMyEnrollments([...myEnrollments, newEnrollment]);
      
      // Update section enrolled count
      setAvailableSections(prevSections => 
        prevSections.map(section => 
          section.courseSectionId === selectedSection.courseSectionId
            ? { ...section, enrolledCount: section.enrolledCount + 1 }
            : section
        )
      );
      
      setShowEnrollModal(false);
      setSelectedSection(null);
      alert('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Failed to enroll in course. Please try again.');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  // Handle drop
  const handleDrop = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const droppedEnrollment = myEnrollments.find(e => e.enrolledCourseId === enrollmentId);
      
      // Remove from enrollments
      setMyEnrollments(myEnrollments.filter(e => e.enrolledCourseId !== enrollmentId));
      
      // Update section enrolled count
      if (droppedEnrollment) {
        setAvailableSections(prevSections => 
          prevSections.map(section => 
            section.courseSectionId === droppedEnrollment.courseSectionId
              ? { ...section, enrolledCount: Math.max(0, section.enrolledCount - 1) }
              : section
          )
        );
      }
      
      alert('Course dropped successfully!');
    } catch (error) {
      console.error('Drop error:', error);
      alert('Failed to drop course. Please try again.');
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
    
    const options = [{ value: 'current', label: `Up to Year ${studentData.yearLevel}` }];
    for (let i = 1; i <= studentData.yearLevel; i++) {
      options.push({ value: i.toString(), label: `Year ${i}` });
    }
    return options;
  };

  // Statistics calculations
  const totalAvailableCourses = filteredCourses.length;
  const myTotalCredits = myEnrollments.reduce((sum, enrollment) => {
    const course = curriculumCourses.find(c => c.courseId === enrollment.courseId);
    return sum + (course?.credits || 0);
  }, 0);

  // Navigation
  const showSection = (section) => {
    switch(section){
      case 'Dashboard':
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
        break;
    }
  };

  const sidebarSections = [
    {
      items: [{ id: 'Dashboard', label: 'Dashboard', icon: '📊' }]
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
  ];

  if (loading) {
    return (
      <div className="dashboard-container">
        <Sidebar 
          onNavigate={showSection}
          userInfo={{ 
            name: studentData ? `${studentData.firstName} ${studentData.lastName}` : "Loading...", 
            role: "Student" 
          }}
          sections={sidebarSections}
        />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading enrollment data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Sidebar 
          onNavigate={showSection}
          userInfo={{ name: "Student", role: "Student" }}
          sections={sidebarSections}
        />
        <div className="main-content">
          <div className="error-container">
            <h2>Error Loading Enrollment Data</h2>
            <p>{error}</p>
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
      <Sidebar 
        onNavigate={showSection}
        userInfo={{ 
          name: `${studentData?.firstName} ${studentData?.lastName}`, 
          role: `${studentData?.studentType} Student` 
        }}
        sections={sidebarSections}
      />

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
              <p><strong>Program:</strong> {currentCurriculum?.programName || 'N/A'}</p>
              <p><strong>Year Level:</strong> {studentData?.yearLevel}</p>
              <p><strong>Student Type:</strong> {studentData?.studentType}</p>
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
              <div className="stat-label">Student Type</div>
              <div className="stat-value">{studentData?.studentType}</div>
            </div>
          </div>
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`btn-secondary ${selectedTab === 'available' ? 'active' : ''}`}
              onClick={() => setSelectedTab('available')}
            >
              Available Courses
            </button>
            <button 
              className={`btn-secondary ${selectedTab === 'enrolled' ? 'active' : ''}`}
              onClick={() => setSelectedTab('enrolled')}
            >
              My Enrollments ({myEnrollments.length})
            </button>
          </div>

          {/* Course List */}
          <div className="schedule-list-container">
            <div className="list-header">
              <div className="list-controls">
                <h2 className="list-title">
                  {selectedTab === 'available' ? 'Available Courses' : 'My Enrollments'}
                </h2>
                {selectedTab === 'available' && (
                  <div className="controls">
                    {studentData?.studentType === 'Irregular' && (
                      <select 
                        value={selectedYearLevel}
                        onChange={(e) => setSelectedYearLevel(e.target.value)}
                        className="select-input"
                      >
                        {getYearLevelOptions().map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
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

            <div className="table-container">
              {selectedTab === 'available' ? (
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Year/Semester</th>
                      <th>Credits</th>
                      <th>Available Sections</th>
                      <th>Action</th>
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
                        <React.Fragment key={course.curriculumDetailId || course.id}>
                          {course.availableSections.map((section, index) => (
                            <tr key={`${course.curriculumDetailId}-${section.courseSectionId}`}>
                              {index === 0 && (
                                <>
                                  <td rowSpan={course.availableSections.length}>
                                    {course.courseCode}
                                  </td>
                                  <td rowSpan={course.availableSections.length}>
                                    <div className="schedule-info">
                                      <div className="schedule-course">{course.courseName}</div>
                                      {course.description && (
                                        <div className="schedule-section">{course.description}</div>
                                      )}
                                    </div>
                                  </td>
                                  <td rowSpan={course.availableSections.length}>
                                    Year {course.yearLevel} - Sem {course.semester}
                                  </td>
                                  <td rowSpan={course.availableSections.length} className="font-semibold">
                                    {course.credits}
                                  </td>
                                </>
                              )}
                              <td>
                                <div className="section-info">
                                  <div className="section-name">{section.sectionName}</div>
                                  <div className="schedule-time">
                                    {section.day} • {formatTime(section.timeFrom)} - {formatTime(section.timeTo)}
                                  </div>
                                  <div className="room-info">{section.room} • {section.instructorName}</div>
                                  <div className="capacity-info">
                                    {section.enrolledCount || 0}/{section.capacity} enrolled
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button 
                                  className={`btn-primary ${(section.enrolledCount >= section.capacity) ? 'disabled' : ''}`}
                                  onClick={() => handleEnroll(section)}
                                  disabled={section.enrolledCount >= section.capacity}
                                >
                                  {section.enrolledCount >= section.capacity ? 'Full' : 'Enroll'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
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
                      myEnrollments.map((enrollment) => {
                        const course = curriculumCourses.find(c => c.courseId === enrollment.courseId);
                        return (
                          <tr key={enrollment.enrolledCourseId}>
                            <td>{course?.courseCode || 'N/A'}</td>
                            <td>
                              <div className="schedule-info">
                                <div className="schedule-course">{course?.courseName || 'N/A'}</div>
                              </div>
                            </td>
                            <td>{enrollment.sectionName || 'N/A'}</td>
                            <td>
                              <div className="time-info">
                                <div className="time-period">
                                  {formatTime(enrollment.timeFrom)} - {formatTime(enrollment.timeTo)}
                                </div>
                                <div className="day-info">{enrollment.day} • {enrollment.room}</div>
                              </div>
                            </td>
                            <td className="font-semibold">{course?.credits || 0}</td>
                            <td>
                              <span className="status-badge status-active">
                                {enrollment.status}
                              </span>
                            </td>
                            <td>
                              {enrollment.status === 'Enrolled' && (
                                <button 
                                  className="btn-primary"
                                  onClick={() => handleDrop(enrollment.enrolledCourseId)}
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
                <p><strong>Course:</strong> {selectedSection.courseCode} - {selectedSection.courseName}</p>
                <p><strong>Section:</strong> {selectedSection.sectionName}</p>
                <p><strong>Instructor:</strong> {selectedSection.instructorName}</p>
                <p><strong>Schedule:</strong> {selectedSection.day}, {formatTime(selectedSection.timeFrom)} - {formatTime(selectedSection.timeTo)}</p>
                <p><strong>Room:</strong> {selectedSection.room}</p>
                <p><strong>Credits:</strong> {selectedSection.credits}</p>
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
    </div>
  );
};

export default Enrollment;