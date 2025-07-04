# STASIS Security Implementation and Data Isolation Summary

## Spring Security Implementation (Without JWT)

### 1. Dependencies Added
- Added `spring-boot-starter-security` to pom.xml

### 2. Security Configuration
- **SecurityConfig.java**: Configured session-based authentication with role-based access control
- **CustomUserDetailsService.java**: Implements UserDetailsService to load user details from database
- **PasswordEncoder**: Uses BCryptPasswordEncoder for secure password hashing

### 3. Authentication Endpoints
- `POST /api/auth/login` - Authenticate users with username/password/role
- `POST /api/auth/logout` - Logout and clear security context

### 4. Role-Based Access Control
- **ADMIN**: Full access to all endpoints
- **FACULTY**: Access to grade management, course sections, student enrollments
- **STUDENT**: Access to own data only (enrollments, grades)

### 5. Password Migration
- **PasswordEncodingMigration.java**: Automatically encodes existing plaintext passwords on startup

## Data Isolation Implementation

### 1. Entity Relationship Updates

#### Student Model
- Changed from `@OneToOne` to `@OneToMany` relationship with SemesterEnrollment
- Prevents sharing of enrollment data between students

#### SemesterEnrollment Model
- Added `@OneToMany` relationship with EnrolledCourse
- Added proper fetch strategies (LAZY) to prevent unnecessary data loading
- Added repository method to find by student ID and status

#### EnrolledCourse Model
- Enhanced relationship constraints with `nullable = false`
- Added `unique = true` constraint on Grade relationship
- Improved fetch strategies for better performance

#### Grade Model
- Added back-reference to EnrolledCourse for bidirectional relationship
- Ensures each grade belongs to exactly one enrollment

### 2. Service Layer Improvements

#### EnrolledCourseService
- **createUniqueGrade()**: Creates grades that are unique to each enrollment
- **getEnrolledCoursesByStudentWithIsolation()**: Ensures student-specific data retrieval
- **findOrCreateCurrentSemesterEnrollment()**: Prevents shared semester enrollments
- Updated all grade update methods to ensure uniqueness

### 3. Repository Enhancements

#### SemesterEnrollmentRepository
- Added `findByStudent_IdAndStatus()` method for proper student filtering

#### EnrolledCourseRepository
- All queries use proper JOIN FETCH to avoid N+1 problems
- Student-specific queries ensure data isolation

### 4. Security Service
- **SecurityService.java**: Provides user authorization checks
- `isCurrentUser()`: Validates student access to own data
- `isCurrentFaculty()`: Validates faculty access to own data
- `getCurrentStudentId()` / `getCurrentFacultyId()`: Helper methods for current user context

### 5. Controller Security Annotations

#### EnrolledCourseController
- `@PreAuthorize` annotations on all endpoints
- Student endpoints check `@securityService.isCurrentUser(#studentId)`
- Faculty endpoints check `@securityService.isCurrentFaculty(#facultyId)`
- Grade modification restricted to FACULTY and ADMIN roles

## Key Security Features

1. **Session-Based Authentication**: No JWT tokens, uses Spring Security sessions
2. **Password Encryption**: BCrypt hashing for all passwords
3. **Role-Based Authorization**: Method-level security with @PreAuthorize
4. **Data Isolation**: Each student's data is completely separate
5. **Audit Trail**: Last login tracking for users

## API Endpoint Security Matrix

| Endpoint | ADMIN | FACULTY | STUDENT |
|----------|-------|---------|---------|
| GET /api/enrolled-courses | ✓ | ✗ | ✗ |
| GET /api/enrolled-courses/student/{id} | ✓ | ✗ | ✓ (own only) |
| GET /api/enrolled-courses/faculty/{id} | ✓ | ✓ (own only) | ✗ |
| PUT /api/enrolled-courses/{id}/grades | ✓ | ✓ | ✗ |
| POST /api/auth/login | ✓ | ✓ | ✓ |
| POST /api/auth/logout | ✓ | ✓ | ✓ |

## Database Schema Impact

### New Constraints Added
- `EnrolledCourse.grade` relationship now has `unique = true`
- `SemesterEnrollment.student` relationship has `nullable = false`
- `EnrolledCourse.semesterEnrollment` relationship has `nullable = false`

### Relationship Changes
- Student -> SemesterEnrollment: OneToOne → OneToMany
- SemesterEnrollment -> EnrolledCourse: Added explicit OneToMany
- Grade -> EnrolledCourse: Added back-reference OneToOne

## Running the Secure Application

### Windows
```bash
run_secure.bat
```

### Linux/Mac
```bash
chmod +x run_secure.sh
./run_secure.sh
```

## Testing Data Isolation

1. Create multiple students with enrollments
2. Login as Student A and verify you only see Student A's data
3. Login as Student B and verify you only see Student B's data
4. Verify that grade updates for Student A don't affect Student B

## Migration Notes

- Existing passwords will be automatically encrypted on first startup
- Existing data relationships will be maintained but properly isolated
- All API calls now require authentication
- Frontend applications need to handle session-based authentication instead of token-based
