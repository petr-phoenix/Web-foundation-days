School Database System Design

## 1. Table Explanations
* **`students`**: Stores master records for registered students (`student_id`, `first_name`, `last_name`, `email`).
* **`courses`**: Stores master catalog information for offered courses (`course_id`, `course_name`, `code`).
* **`enrolments`**: Acts as a join table linking `students` and `courses`, holding relationship-specific metadata like `grade` and `enrolled_at`.

## 2. Relationships & Entity Rationale
* **One-to-Many Relationships**:
  * `students` to `enrolments`: A single student can have **many** enrolment records.
  * `courses` to `enrolments`: A single course can have **many** enrolment records.
* **Many-to-Many Relationship**:
  * The primary interaction between `students` and `courses` is **many-to-many** (a student takes multiple courses; a course hosts multiple students).
* **Why a Join Table is Required**: Relational databases cannot represent direct many-to-many relationships without breaking First Normal Form or duplicating data. The `enrolments` join table decomposes the many-to-many relationship into two standard one-to-many links and provides a clean home for attributes tied strictly to the interaction (e.g., student grade).

## 3. Recommended Index
* **Index SQL**: `CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);`
* **Reasoning**: While SQLite automatically indexes the primary key (`student_id`, `course_id`) composite constraint, queries filtering or joining by `course_id` alone (such as listing all students in a course or counting class rosters) will trigger full table scans as rows grow. Adding an index on `course_id` speeds up course-centric JOINs and `GROUP BY` aggregations significantly.

## 4. Technology Choice: SQL vs NoSQL
A relational SQL database is the best architectural choice for a school management system. Academic enrollment records require strict referential integrity, schema constraints, and ACID compliance to guarantee that students cannot receive grades for nonexistent courses or double-enroll on the same class. Relational databases easily handle relational reporting queries—such as rosters, GPAs, and unassigned students—without introducing data duplication or risky, uncoordinated document updates across application services.