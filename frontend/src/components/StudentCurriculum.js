import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentCurriculum.module.css';
import Sidebar from './StudentSidebar';
import { useStudentData } from '../hooks/useStudentData';
import { curriculumAPI, studentAPI } from '../services/api';
import Loading from './Loading';

const StudentCurriculum = () => {
  const { getUserInfo } = useStudentData();
  const navigate = useNavigate();
  const [curriculumData, setCurriculumData] = useState({});
  const [activeSemester, setActiveSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [studentCurriculumId, setStudentCurriculumId] = useState(null);

  // Fetch student info and curriculum data
  useEffect(() => {
    const fetchStudentAndCurriculum = async () => {
      setLoading(true);
      try {
        // Get logged-in student info
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.studentId) {
          setLoading(false);
          return;
        }
        // Get student details
        const studentRes = await studentAPI.getStudentById(userInfo.studentId);
        const student = studentRes.data;
        setProgramName(student.program?.programName || '');
        setAcademicYear(student.curriculum?.academicYear || '');
        setStudentCurriculumId(student.curriculum?.curriculumID);

        // Get curriculum details for this student's curriculum
        if (student.curriculum?.curriculumID) {
          const curriculumRes = await curriculumAPI.getCurriculumById(student.curriculum.curriculumID);
          const curriculum = curriculumRes.data;
          // Group curriculumDetails by "Year X - 1st/2nd Semester"
          const grouped = {};
          (curriculum.curriculumDetails || []).forEach(detail => {
            const year = detail.YearLevel;
            const sem = detail.Semester;
            const semesterKey = `Year ${year} - ${sem}`;
            if (!grouped[semesterKey]) grouped[semesterKey] = [];
            grouped[semesterKey].push({
              id: detail.course.id,
              courseCode: detail.course.courseCode,
              courseDescription: detail.course.courseDescription,
              units: detail.course.credits,
            });
          });
          setCurriculumData(grouped);
          const semesterKeys = Object.keys(grouped);
          if (semesterKeys.length > 0) setActiveSemester(semesterKeys[0]);
        } else {
          setCurriculumData({});
        }
      } catch (error) {
        setCurriculumData({});
      }
      setLoading(false);
    };
    fetchStudentAndCurriculum();
    // eslint-disable-next-line
  }, []);

  const semesters = Object.keys(curriculumData);

  const getFilteredCourses = (semester) => {
    return curriculumData[semester] || [];
  };

  const calculateSemesterUnits = (semester) => {
    const courses = getFilteredCourses(semester);
    return courses.reduce((total, course) => total + (course.units || 0), 0);
  };

  const calculateTotalUnits = () => {
    return Object.values(curriculumData)
      .flat()
      .reduce((total, course) => total + (course.units || 0), 0);
  };

  // Helper to convert "Year 1 - 1st Semester" to display label (already formatted)
  const getYearSemesterLabel = (semesterKey) => semesterKey;

  return (
    <div className="container">
      <Sidebar userInfo={getUserInfo()} />
      {/* Main Content */}
      <div className="main-content">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span
            className="breadcrumb-link"
            onClick={() => navigate('/student-dashboard')}
          >
            Dashboard
          </span>
          <span className="breadcrumb-separator"> / </span>
          <span className="breadcrumb-current">Curriculum</span>
        </div>

        {/* Header */}
        <div className="header">
          <div>
            <h1 className="page-title">My Curriculum</h1>
            <p className="page-subtitle">
              {programName && academicYear
                ? `${programName} - Academic Year ${academicYear}`
                : ''}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">📚</div>
            <div className="stat-content">
              <h3>Total Subjects</h3>
              <div className="stat-value">{Object.values(curriculumData).flat().length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">🎯</div>
            <div className="stat-content">
              <h3>Total Units</h3>
              <div className="stat-value">{calculateTotalUnits()}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">📅</div>
            <div className="stat-content">
              <h3>Semesters</h3>
              <div className="stat-value">{semesters.length}</div>
            </div>
          </div>
        </div>

        {/* Curriculum Section */}
        <div className="curriculum-section">
          <div className="section-header">
            <h2 className="section-title">Course Curriculum</h2>
          </div>

          <div style={{ height: '20px' }}></div>

          {/* Semester Tabs */}
          <div className="semester-tabs">
            <div className="tab-headers">
              {semesters.map((semester) => (
                <button
                  key={semester}
                  className={`tab-header ${activeSemester === semester ? 'active' : ''}`}
                  onClick={() => setActiveSemester(semester)}
                >
                  {getYearSemesterLabel(semester)}
                  <span className="semester-units">({calculateSemesterUnits(semester)} units)</span>
                </button>
              ))}
            </div>

            <div className="tab-content">
              {loading ? (
                <Loading message="Loading curriculum..." />
              ) : (
                <>
                  <div className="semester-info">
                    <h3 className="semester-title">{getYearSemesterLabel(activeSemester)}</h3>
                    <p className="semester-summary">
                      {getFilteredCourses(activeSemester).length} courses • {calculateSemesterUnits(activeSemester)} total units
                    </p>
                  </div>

                  <div className="table-container">
                    <table className="curriculum-table">
                      <thead>
                        <tr>
                          <th>Course Code</th>
                          <th>Course Description</th>
                          <th>Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredCourses(activeSemester).map(course => (
                          <tr key={course.id || course.courseCode}>
                            <td>
                              <div className="course-code-display">{course.courseCode}</div>
                            </td>
                            <td>
                              <div className="course-description">{course.courseDescription}</div>
                            </td>
                            <td>
                              <div className="course-units">{course.units}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="semester-total">
                          <td><strong>Semester Total</strong></td>
                          <td></td>
                          <td><strong>{calculateSemesterUnits(activeSemester)} units</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCurriculum;