import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StudentGrades.module.css';
import Sidebar from './StudentSidebar';

const StudentGrades = () => {
  // Sample grades data
  const [gradesList, setGradesList] = useState([
    {
      id: 'GRD001',
      course: 'Computer Programming I',
      section: 'CS-101-A',
      instructor: 'Emily Thompson',
      creditUnits: 3,
      midtermGrade: 85,
      finalGrade: 88,
      overallGrade: 86.5,
      letterGrade: 'B+',
      remarks: 'Passed',
      semester: 'Fall 2024',
      status: 'Completed'
    },
    {
      id: 'GRD002',
      course: 'Database Management',
      section: 'IT-201-B',
      instructor: 'James Chen',
      creditUnits: 3,
      midtermGrade: 92,
      finalGrade: 90,
      overallGrade: 91,
      letterGrade: 'A-',
      remarks: 'Passed',
      semester: 'Fall 2024',
      status: 'Completed'
    },
    {
      id: 'GRD003',
      course: 'Business Ethics',
      section: 'BA-105-A',
      instructor: 'Sarah Martinez',
      creditUnits: 2,
      midtermGrade: 78,
      finalGrade: 82,
      overallGrade: 80,
      letterGrade: 'B-',
      remarks: 'Passed',
      semester: 'Fall 2024',
      status: 'Completed'
    },
    {
      id: 'GRD004',
      course: 'Engineering Mathematics',
      section: 'ENG-102-C',
      instructor: 'Michael Roberts',
      creditUnits: 4,
      midtermGrade: 95,
      finalGrade: 93,
      overallGrade: 94,
      letterGrade: 'A',
      remarks: 'Passed',
      semester: 'Fall 2024',
      status: 'Completed'
    },
    {
      id: 'GRD005',
      course: 'General Psychology',
      section: 'PSY-101-A',
      instructor: 'Rachel Williams',
      creditUnits: 3,
      midtermGrade: 72,
      finalGrade: 75,
      overallGrade: 73.5,
      letterGrade: 'C+',
      remarks: 'Passed',
      semester: 'Fall 2024',
      status: 'Completed'
    },
    {
      id: 'GRD006',
      course: 'Data Structures',
      section: 'CS-201-B',
      instructor: 'Emily Thompson',
      creditUnits: 3,
      midtermGrade: 88,
      finalGrade: null,
      overallGrade: null,
      letterGrade: 'INC',
      remarks: 'In Progress',
      semester: 'Spring 2025',
      status: 'Ongoing'
    },
    {
      id: 'GRD007',
      course: 'Network Administration',
      section: 'IT-301-A',
      instructor: 'James Chen',
      creditUnits: 3,
      midtermGrade: 85,
      finalGrade: null,
      overallGrade: null,
      letterGrade: 'INC',
      remarks: 'In Progress',
      semester: 'Spring 2025',
      status: 'Ongoing'
    },
    {
      id: 'GRD008',
      course: 'Financial Accounting',
      section: 'BA-201-C',
      instructor: 'Sarah Martinez',
      creditUnits: 3,
      midtermGrade: 90,
      finalGrade: null,
      overallGrade: null,
      letterGrade: 'INC',
      remarks: 'In Progress',
      semester: 'Spring 2025',
      status: 'Ongoing'
    }
  ]);

  const [selectedSemester, setSelectedSemester] = useState('All Semesters');
  const [searchTerm, setSearchTerm] = useState('');

  // Semester options
  const semesterOptions = ['Fall 2024', 'Spring 2025'];

  // Statistics calculations
  const completedCourses = gradesList.filter(g => g.status === 'Completed');
  const ongoingCourses = gradesList.filter(g => g.status === 'Ongoing');
  
  // Calculate GPA for completed courses only
  const totalGradePoints = completedCourses.reduce((sum, grade) => {
    return sum + (grade.overallGrade * grade.creditUnits);
  }, 0);
  const totalCreditUnits = completedCourses.reduce((sum, grade) => sum + grade.creditUnits, 0);
  const currentGPA = totalCreditUnits > 0 ? (totalGradePoints / totalCreditUnits / 100 * 4).toFixed(2) : '0.00';
  
  const totalUnitsEarned = completedCourses.reduce((sum, grade) => sum + grade.creditUnits, 0);
  const totalUnitsEnrolled = gradesList.reduce((sum, grade) => sum + grade.creditUnits, 0);

  // Determine enrollment status (sample logic - you can modify this based on your requirements)
  const enrollmentStatus = totalUnitsEnrolled >= 18 ? 'Regular' : 'Irregular';

  // Filter grades based on search and semester
  const filteredGrades = gradesList.filter(grade => {
    const matchesSearch = grade.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = selectedSemester === 'All Semesters' || grade.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  // Get letter grade color class
  const getGradeColor = (letterGrade) => {
    if (letterGrade === 'A' || letterGrade === 'A+') return styles.gradeA;
    if (letterGrade === 'A-' || letterGrade === 'B+') return styles.gradeBPlus;
    if (letterGrade === 'B' || letterGrade === 'B-') return styles.gradeB;
    if (letterGrade === 'C+' || letterGrade === 'C') return styles.gradeC;
    if (letterGrade === 'C-' || letterGrade === 'D') return styles.gradeD;
    if (letterGrade === 'F') return styles.gradeF;
    return styles.gradeInc;
  };

  // Navigation
  const navigate = useNavigate();
  const showSection = (section) => {
    switch(section){
      case 'Dashboard':
        navigate('/student-dashboard');
        break;
      case 'StudentSchedule':
        navigate('/student-schedule');
        break;
      case 'Enrollment':
        alert("Enrollment page here");
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

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <Sidebar 
        onNavigate={showSection}
        userInfo={{ name: "John Smith", role: "Student" }}
        sections={[
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
        ]}
      />

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.breadcrumb}>
            <span 
              className={styles.breadcrumbLink} 
              onClick={() => navigate('/student-dashboard')}
            >
              Dashboard
            </span>
            <span className={styles.breadcrumbSeparator}> / </span>
            <span className={styles.breadcrumbCurrent}>My Grades</span>
          </div>
          
          {/* Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>My Grades</h1>
          </div>

          {/* Grades List */}
          <div className={styles.gradesListContainer}>
            <div className={styles.listHeader}>
              <div className={styles.listControls}>
                <h2 className={styles.listTitle}>Academic Records</h2>
                <div className={styles.controls}>
                  <select 
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className={styles.selectInput}
                  >
                    <option>All Semesters</option>
                    {semesterOptions.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
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
              
              {/* Academic Information */}
              <div className={styles.academicInfo}>
                <div className={styles.academicItem}>
                  <span className={styles.academicLabel}>Current GPA:</span>
                  <span className={`${styles.academicValue} ${styles.gpaValue}`}>{currentGPA}</span>
                </div>
                <div className={styles.academicItem}>
                  <span className={styles.academicLabel}>Enrollment Status:</span>
                  <span className={`${styles.academicValue} ${styles.statusBadge} ${enrollmentStatus.toLowerCase() === 'regular' ? styles.statusRegular : styles.statusIrregular}`}>
                    {enrollmentStatus}
                  </span>
                </div>
                <div className={styles.academicItem}>
                  <span className={styles.academicLabel}>Units Earned:</span>
                  <span className={styles.academicValue}>{totalUnitsEarned} / {totalUnitsEnrolled}</span>
                </div>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.gradesTable}>
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course & Section</th>
                    <th>Instructor</th>
                    <th>Units</th>
                    <th>Midterm</th>
                    <th>Final</th>
                    <th>Overall</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                    <th>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((grade, index) => (
                    <tr key={grade.id}>
                      <td className={styles.courseCode}>{grade.id}</td>
                      <td>
                        <div className={styles.courseInfo}>
                          <div className={styles.courseName}>{grade.course}</div>
                          <div className={styles.courseSection}>{grade.section}</div>
                        </div>
                      </td>
                      <td className={styles.instructorName}>{grade.instructor}</td>
                      <td className={styles.creditUnits}>{grade.creditUnits}</td>
                      <td className={styles.gradeScore}>
                        {grade.midtermGrade !== null ? grade.midtermGrade : '-'}
                      </td>
                      <td className={styles.gradeScore}>
                        {grade.finalGrade !== null ? grade.finalGrade : '-'}
                      </td>
                      <td className={styles.gradeScore}>
                        {grade.overallGrade !== null ? grade.overallGrade.toFixed(1) : '-'}
                      </td>
                      <td>
                        <span className={`${styles.letterGrade} ${getGradeColor(grade.letterGrade)}`}>
                          {grade.letterGrade}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.remarksBadge} ${
                          grade.remarks === 'Passed' ? styles.remarksPassed : 
                          grade.remarks === 'Failed' ? styles.remarksFailed : 
                          styles.remarksProgress
                        }`}>
                          {grade.remarks}
                        </span>
                      </td>
                      <td className={styles.semesterInfo}>{grade.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.tableFooter}>
              <div className={styles.tableInfo}>
                Showing {filteredGrades.length} of {gradesList.length} courses
              </div>
              <div className={styles.pagination}>
                <button className={`${styles.pageBtn} ${styles.disabled}`}>Previous</button>
                <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                <button className={styles.pageBtn}>2</button>
                <button className={styles.pageBtn}>Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;