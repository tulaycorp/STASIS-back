import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Making API request to:', config.baseURL + config.url);
    console.log('Request method:', config.method);
    console.log('Request data:', config.data);
    
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for debugging and error handling
api.interceptors.response.use(
  (response) => {
    console.log('API response received:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    
    // Don't redirect on auth errors during development
    if (error.response?.status === 401) {
      console.warn('Authentication error - token may be invalid');
    }
    
    return Promise.reject(error);
  }
);

// Course API endpoints
export const courseAPI = {
  // Get all courses
  getAllCourses: () => {
    console.log('Calling getAllCourses API...');
    return api.get('/courses');
  },
  
  // Get course by ID
  getCourseById: (id) => api.get(`/courses/${id}`),
  
  // Create new course
  createCourse: (courseData) => {
    console.log('Calling createCourse API with data:', courseData);
    return api.post('/courses', courseData);
  },
  
  // Update course
  updateCourse: (id, courseData) => {
    console.log('Calling updateCourse API for ID:', id, 'with data:', courseData);
    return api.put(`/courses/${id}`, courseData);
  },
  
  // Delete course
  deleteCourse: (id) => {
    console.log('Calling deleteCourse API for ID:', id);
    return api.delete(`/courses/${id}`);
  },
};

// Course Sections API endpoints
export const courseSectionAPI = {
  // Get all sections
  getAllSections: () => api.get('/course-sections'),
  
  // Create new section
  createSection: (sectionData) => {
    console.log('Calling createSection API with data:', sectionData);
    return api.post('/course-sections', sectionData);
  },
  
  // Update section
  updateSection: (id, sectionData) => api.put(`/course-sections/${id}`, sectionData),
  
  // Delete section
  deleteSection: (id) => api.delete(`/course-sections/${id}`),
};

// Enrolled Courses API endpoints
export const enrolledCourseAPI = {
  // Get all enrolled courses
  getAllEnrolledCourses: () => api.get('/enrolled-courses'),
  
  // Get enrolled course by ID
  getEnrolledCourseById: (id) => api.get(`/enrolled-courses/${id}`),
  
  // Get enrolled courses by semester enrollment
  getEnrolledCoursesBySemester: (semesterEnrollmentId) => 
    api.get(`/enrolled-courses/semester-enrollment/${semesterEnrollmentId}`),
  
  // Create enrollment
  createEnrollment: (enrollmentData) => api.post('/enrolled-courses', enrollmentData),
};

// Test connection function
export const testConnection = async () => {
  try {
    const response = await api.get('/courses');
    console.log('Connection test successful:', response.status);
    return { success: true, status: response.status };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error.message, 
      code: error.code,
      status: error.response?.status 
    };
  }
};

export default api;
