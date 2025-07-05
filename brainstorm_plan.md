# Plan to Fix Calendar and Schedule Integration in StudentDashboard

## Current Issues Analysis:
1. **StudentDashboard.js** has a hardcoded `scheduleData` array that doesn't reflect actual student schedule
2. The calendar component doesn't integrate with the schedule data
3. "Upcoming Schedule" section shows static data instead of dynamic schedule based on selected date
4. No connection between calendar date selection and schedule display
5. Missing integration with the actual enrolled courses API that's already working in StudentSchedule.js

## Required Changes:

### 1. Import Required Dependencies
- Import `enrolledCourseAPI` from services/api.js
- Import `useEffect` for data fetching
- Import `useStudentData` hook (already imported)

### 2. Replace Static Schedule Data with Dynamic Data
- Remove hardcoded `scheduleData` array
- Add state for actual schedule data: `scheduleList`
- Add loading state for schedule fetching
- Fetch enrolled courses using the same logic as StudentSchedule.js

### 3. Integrate Calendar with Schedule
- Modify calendar day click handler to update selected date
- Filter schedule data based on selected calendar date
- Show schedule for the selected day instead of hardcoded "upcoming" schedule

### 4. Update Schedule Display Logic
- Change "Upcoming Schedule" to "Schedule"
- Filter schedule items based on selected date
- Map day names to match the schedule data format
- Handle empty schedule states gracefully

### 5. Add Helper Functions
- `getDayName()` - Convert date to day name (Monday, Tuesday, etc.)
- `formatTime()` - Format time display (already exists in StudentSchedule.js)
- `getScheduleForDate()` - Filter schedule for specific date

### 6. Update State Management
- Add `scheduleList` state for storing fetched schedule data
- Add `scheduleLoading` state for loading indicator
- Modify `selectedDate` to work with schedule filtering
- Add error handling for schedule fetching

### 7. UI Updates
- Change section title from "Upcoming Schedule" to "Schedule"
- Add loading state display in schedule section
- Add empty state when no classes for selected day
- Ensure calendar highlighting works correctly

## Implementation Steps:
1. Add necessary imports and state variables
2. Implement schedule data fetching logic (copy from StudentSchedule.js)
3. Create helper functions for date/day conversion
4. Update calendar click handler to filter schedule
5. Modify schedule display component
6. Update section title and styling
7. Add loading and empty states
8. Test calendar-schedule integration

## Expected Result:
- Calendar shows current month with clickable dates
- Clicking a date shows the schedule for that specific day
- "Schedule" section displays actual enrolled courses for selected date
- Today's date is highlighted and shows today's schedule by default
- Loading states and empty states are handled gracefully
