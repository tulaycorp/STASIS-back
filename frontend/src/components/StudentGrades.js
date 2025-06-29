import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './StudentGrades.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';
import { enrolledCourseAPI } from '../services/api'; // Make sure this exists and is correct

const StudentGrades = () => {
  const { getUserInfo } = useStudentData();
  const userInfo = getUserInfo();
  const studentId = userInfo?.studentId;

  const semesters = [];

  // STATE VARIABLES
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradesList, setGradesList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch grades from backend
  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    enrolledCourseAPI.getEnrolledCoursesByStudent
      ? enrolledCourseAPI.getEnrolledCoursesByStudent(studentId)
          .then(res => {
            // Transform backend data to match the expected structure
            const backendGrades = (res.data || []).map(ec => ({
              id: ec.section?.course?.courseCode || ec.enrolledCourseID || '',
              course: ec.section?.course?.courseDescription || '',
              section: ec.section?.sectionName || '',
              instructor: ec.section?.faculty
                ? `${ec.section.faculty.firstName} ${ec.section.faculty.lastName}`
                : '',
              creditUnits: ec.section?.course?.credits || 0,
              midtermGrade: ec.grade?.midtermGrade ?? null,
              finalGrade: ec.grade?.finalGrade ?? null,
              overallGrade: ec.grade?.gradeValue ?? null,
              letterGrade: ec.grade?.letterGrade ?? '',
              remarks: ec.grade?.remarks ??
                (ec.grade?.gradeValue != null
                  ? (ec.grade.gradeValue >= 60 ? 'Passed' : 'Failed')
                  : 'In Progress'),
              semester: ec.semesterEnrollment?.semester || '',
              status: ec.status || '',
            }));
            setGradesList(backendGrades);
          })
          .catch(() => setGradesList([]))
          .finally(() => setLoading(false))
      : setGradesList([]); // fallback if API not defined
  }, [studentId]);

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
    const matchesSearch = (grade.course || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grade.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grade.instructor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (grade.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = grade.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  });

  const completedCourses = gradesList.filter(g => g.status === 'Completed');
  const totalGradePoints = completedCourses.reduce((sum, grade) => {
    return sum + ((grade.overallGrade || 0) * (grade.creditUnits || 0));
  }, 0);
  const totalCreditUnits = completedCourses.reduce((sum, grade) => sum + (grade.creditUnits || 0), 0);
  const currentGPA = totalCreditUnits > 0 ? (totalGradePoints / totalCreditUnits / 100 * 4).toFixed(2) : '0.00';
  const totalUnitsEarned = completedCourses.reduce((sum, grade) => sum + (grade.creditUnits || 0), 0);
  const totalUnitsEnrolled = gradesList.reduce((sum, grade) => sum + (grade.creditUnits || 0), 0);
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
                {loading ? (
                  <div className={styles.loading}>Loading grades...</div>
                ) : (
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
                          <td className={styles.gradeScore}>{grade.overallGrade != null ? Number(grade.overallGrade).toFixed(1) : '-'}</td>
                          <td>
                            <span className={`${styles.remarksBadge} ${grade.remarks === 'Passed' ? styles.remarksPassed : grade.remarks === 'Failed' ? styles.remarksFailed : styles.remarksProgress}`}>
                              {grade.remarks}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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