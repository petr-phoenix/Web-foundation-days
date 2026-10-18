-- Enable foreign key constraint checking in SQLite
PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. CREATE TABLE STATEMENTS
-- ==========================================

-- Table: students
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

-- Table: courses
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

-- Table: enrolments (Join Table)
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    enrolled_at DATE NOT NULL DEFAULT (CURRENT_DATE),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    CONSTRAINT unique_student_course UNIQUE (student_id, course_id)
);

-- ==========================================
-- 2. INSERT SAMPLE DATA
-- ==========================================

-- Insert 4 Students (Diana Prince left unenrolled to test Query 4)
INSERT INTO students (first_name, last_name, email) VALUES
('Alice', 'Smith', 'alice.smith@example.com'),
('Bob', 'Jones', 'bob.jones@example.com'),
('Charlie', 'Brown', 'charlie.brown@example.com'),
('Diana', 'Prince', 'diana.prince@example.com');

-- Insert 3 Courses
INSERT INTO courses (course_name, code) VALUES
('Database Systems', 'CS101'),
('Web Development', 'CS102'),
('Data Structures', 'CS103');

-- Insert 5 Enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'),   -- Alice -> Database Systems
(1, 2, 'B+'),  -- Alice -> Web Development
(2, 1, 'B'),   -- Bob -> Database Systems
(2, 3, 'A-'),  -- Bob -> Data Structures
(3, 2, 'A');   -- Charlie -> Web Development

-- ==========================================
-- 3. REQUIRED QUERIES
-- ==========================================

-- Query 1: All courses for one student (by name)
SELECT 
    s.first_name,
    s.last_name,
    c.code,
    c.course_name,
    e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.first_name = 'Alice' AND s.last_name = 'Smith';

-- Query 2: All students on one course
SELECT 
    c.course_name,
    s.first_name,
    s.last_name,
    s.email,
    e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE c.course_name = 'Database Systems';

-- Query 3: The number of students per course
SELECT 
    c.course_id,
    c.code,
    c.course_name,
    COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.code, c.course_name;

-- Query 4: Students who have no enrolments
SELECT 
    s.student_id,
    s.first_name,
    s.last_name,
    s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1 AND course_id = 2;

-- Verification query for the updated grade
SELECT 
    s.first_name,
    s.last_name,
    c.course_name,
    e.grade
FROM enrolments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE e.student_id = 1 AND e.course_id = 2;