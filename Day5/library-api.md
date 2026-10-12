# Library Books REST API Specification

This document details the RESTful API endpoints for managing book resources in the library system.

---

## Resource Endpoints

### 1. List All Books
* **HTTP Method:** `GET`
* **Path:** `/api/v1/books`
* **Description:** Retrieves a paginated list of all books in the library.
* **Success Status Code:** `200 OK`

---

### 2. List Books by Author
* **HTTP Method:** `GET`
* **Path:** `/api/v1/books?author={authorName}`
* **Description:** Filters and returns all books written by the specified author.
* **Success Status Code:** `200 OK`

---

### 3. Get Single Book
* **HTTP Method:** `GET`
* **Path:** `/api/v1/books/:id`
* **Description:** Retrieves detailed information for a single book by its ID.
* **Success Status Code:** `200 OK`

---

### 4. Create New Book
* **HTTP Method:** `POST`
* **Path:** `/api/v1/books`
* **Description:** Adds a new book resource to the library catalogue.
* **Request Body Example:**
  ```json
  {
    "title": "Think like Monk",
    "author": "Jay Shetty",
    "isbn": "9780743273565",
    "publishedYear": 2020,
    "copiesAvailable": 5
  }