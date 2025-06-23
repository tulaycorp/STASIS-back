import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StudentGrades.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';

const StudentGrades = () => {
  const { getUserInfo } = useStudentData();
  
  const semesters = [
    '2025-2nd Semester',
    '2024-1st Semester',
    '2023-2nd Semester',
    '2023-1st Semester',
    '2022-2nd Semester',
  ];

  // STATE VARIABLES - Default to the most recent semester
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sample grades data (unchanged)
  const [gradesList, setGradesList] = useState([
    {
      id: 'GRD001', course: 'Computer Programming I', section: 'CS-101-A', instructor: 'Emily Thompson', creditUnits: 3,
      midtermGrade: 85, finalGrade: 88, overallGrade: 86.5, letterGrade: 'B+', remarks: 'Passed',
      semester: '2024-1st Semester', status: 'Completed'
    },
    {
      id: 'GRD002', course: 'Database Management', section: 'IT-201-B', instructor: 'James Chen', creditUnits: 3,
      midtermGrade: 92, finalGrade: 90, overallGrade: 91, letterGrade: 'A-', remarks: 'Passed',
      semester: '2024-1st Semester', status: 'Completed'
    },
    {
      id: 'GRD003', course: 'Business Ethics', section: 'BA-105-A', instructor: 'Sarah Martinez', creditUnits: 2,
      midtermGrade: 78, finalGrade: 82, overallGrade: 80, letterGrade: 'B-', remarks: 'Passed',
      semester: '2024-1st Semester', status: 'Completed'
    },
    {
      id: 'GRD004', course: 'Engineering Mathematics', section: 'ENG-102-C', instructor: 'Michael Roberts', creditUnits: 4,
      midtermGrade: 95, finalGrade: 93, overallGrade: 94, letterGrade: 'A', remarks: 'Passed',
      semester: '2024-1st Semester', status: 'Completed'
    },
    {
      id: 'GRD005', course: 'General Psychology', section: 'PSY-101-A', instructor: 'Rachel Williams', creditUnits: 3,
      midtermGrade: 72, finalGrade: 75, overallGrade: 73.5, letterGrade: 'C+', remarks: 'Passed',
      semester: '2024-1st Semester', status: 'Completed'
    },
    {
      id: 'GRD006', course: 'Data Structures', section: 'CS-201-B', instructor: 'Emily Thompson', creditUnits: 3,
      midtermGrade: 88, finalGrade: null, overallGrade: null, letterGrade: 'INC', remarks: 'In Progress',
      semester: '2025-2nd Semester', status: 'Ongoing'
    },
    {
      id: 'GRD007', course: 'Network Administration', section: 'IT-301-A', instructor: 'James Chen', creditUnits: 3,
      midtermGrade: 85, finalGrade: null, overallGrade: null, letterGrade: 'INC', remarks: 'In Progress',
      semester: '2025-2nd Semester', status: 'Ongoing'
    },
    {
      id: 'GRD008', course: 'Financial Accounting', section: 'BA-201-C', instructor: 'Sarah Martinez', creditUnits: 3,
      midtermGrade: 90, finalGrade: null, overallGrade: null, letterGrade: 'INC', remarks: 'In Progress',
      semester: '2025-2nd Semester', status: 'Ongoing'
    }
  ]);

  const getAcademicYear = (semester) => {
    if (!semester) return 'N/A';
    const year = semester.split('-')[0];
    const semesterType = semester.split('-')[1];
    if (semesterType === '1st Semester') {
      return `${year}-${parseInt(year) + 1}`;
    } else {
      return `${parseInt(year) - 1}-${year}`;
    }
  };

  const formatSemesterDisplay = (semester) => {
    const [year, sem] = semester.split('-');
    return {
      year: year,
      semester: sem,
      academicYear: getAcademicYear(semester)
    };
  };

  const filteredGrades = gradesList.filter(grade => {
    const matchesSearch = grade.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = grade.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const completedCourses = gradesList.filter(g => g.status === 'Completed');
  const totalGradePoints = completedCourses.reduce((sum, grade) => {
    return sum + (grade.overallGrade * grade.creditUnits);
  }, 0);
  const totalCreditUnits = completedCourses.reduce((sum, grade) => sum + grade.creditUnits, 0);
  const currentGPA = totalCreditUnits > 0 ? (totalGradePoints / totalCreditUnits / 100 * 4).toFixed(2) : '0.00';
  const totalUnitsEarned = completedCourses.reduce((sum, grade) => sum + grade.creditUnits, 0);
  const totalUnitsEnrolled = gradesList.reduce((sum, grade) => sum + grade.creditUnits, 0);
  const enrollmentStatus = totalUnitsEnrolled >= 18 ? 'Regular' : 'Irregular';
  
  const handleSemesterSelect = (semester) => {
    setSelectedSemester(semester);
  };
  
  const showArchiveSemester = () => {
    alert("Archive functionality would be implemented here.");
  };

  const navigate = useNavigate();
  const showSection = (section) => {
    switch(section){
      case 'StudentDashboard': 
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
      default: // No action
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Existing Sidebar */}
      <Sidebar 
        onNavigate={showSection}
        userInfo={getUserInfo()}
        sections={[
            { items: [{ id: 'StudentDashboard', label: 'Dashboard', icon: '📊' }] },
            { label: 'Management', items: [
                { id: 'StudentSchedule', label: 'Schedule', icon: '📅' },
                { id: 'Enrollment', label: 'Enrollment', icon: '📝' },
                { id: 'StudentCurriculum', label: 'Curriculum', icon: '📚' },
                { id: 'StudentGrades', label: 'Grades', icon: '📈' }
            ]},
            { label: 'System', items: [{ id: 'StudentSettings', label: 'Settings', icon: '⚙️'}]}
        ]}
      />

      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.breadcrumb}>
            <span className={styles.breadcrumbLink} onClick={() => navigate('/student-dashboard')}>Dashboard</span>
            <span className={styles.breadcrumbSeparator}> / </span>
            <span className={styles.breadcrumbCurrent}>My Grades</span>
          </div>
          
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>My Grades</h1>
            <div className={styles.semesterIndicator}>
              {selectedSemester}
            </div>
          </div>

          <div className={styles.studentContentWrapper}>
            <div className={styles.studentNavSection}>
              <div className={styles.studentNavHeader}>
                <h2 className={styles.studentNavTitle}>Past Semesters</h2>
                <div className={styles.semesterCurrentInfo}>
                  Academic Year: {getAcademicYear(selectedSemester)}
                </div>
              </div>
              <div className={styles.studentNavList}>
                {semesters.map((semester) => {
                  const semesterInfo = formatSemesterDisplay(semester);
                  return (
                    <div
                      key={semester}
                      className={`${styles.studentNavItem} ${selectedSemester === semester ? styles.studentNavItemActive : ''}`}
                      onClick={() => handleSemesterSelect(semester)}
                    >
                      <span className={styles.studentNavIcon}>📅</span>
                      <div className={styles.semesterInfo}>
                        <div className={styles.semesterMain}>{semesterInfo.semester}</div>
                        <div className={styles.semesterYear}>{semesterInfo.year}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.studentNavActions}>
                <button className={styles.studentBtnAddSection} onClick={showArchiveSemester}>
                  Download Transcript
                </button>
              </div>
              <div className={styles.studentNavInfo}>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Selected Semester</div>
                  <div className={styles.studentNavInfoValue}>{selectedSemester}</div>
                </div>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Courses Found</div>
                  <div className={styles.studentNavInfoValue}>{filteredGrades.length}</div>
                </div>
                <div className={styles.studentNavInfoItem}>
                  <div className={styles.studentNavInfoLabel}>Academic Year</div>
                  <div className={styles.studentNavInfoValue}>{getAcademicYear(selectedSemester)}</div>
                </div>
              </div>
            </div>

            <div className={styles.gradesListContainer}>
              <div className={styles.listHeader}>
                <div className={styles.listControls}>
                  <h2 className={styles.listTitle}>Academic Records</h2>
                  <div className={styles.controls}>
                    <input
                      type="text"
                      placeholder="Search courses, instructors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>
                </div>
                
                <div className={styles.academicInfo}>
                  <div className={styles.academicItem}>
                    <span className={styles.academicLabel}>Overall GPA:</span>
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
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((grade) => (
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
                        <td className={styles.gradeScore}>{grade.midtermGrade ?? '-'}</td>
                        <td className={styles.gradeScore}>{grade.finalGrade ?? '-'}</td>
                        <td className={styles.gradeScore}>{grade.overallGrade?.toFixed(1) ?? '-'}</td>
                        <td>
                          <span className={`${styles.remarksBadge} ${grade.remarks === 'Passed' ? styles.remarksPassed : grade.remarks === 'Failed' ? styles.remarksFailed : styles.remarksProgress}`}>
                            {grade.remarks}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableFooter}>
                <div className={styles.tableInfo}>
                  Showing {filteredGrades.length} courses for this semester
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

export default StudentGrades;