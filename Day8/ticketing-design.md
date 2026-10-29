# TicketHub System Design

## 1. Clarify Requirements

**Functional Requirements:**
*   Users can view a list of upcoming concerts and events.
*   Users can search for specific events.
*   Users can view available seats for an event.
*   Users can reserve seats and purchase tickets.
*   The system must prevent two users from buying the exact same seat.

**Non-Functional Requirements:**
*   **High Consistency:** Financial transactions and seat reservations must be strictly consistent (ACID compliant) to prevent double-booking.
*   **High Availability (Normal operations):** 99.9% uptime during regular traffic.
*   **High Performance:** Page loads should be under 1 second to ensure a smooth user experience.
*   **Scalability & Resiliency:** The system must gracefully handle massive traffic spikes during popular concert ticket drops without crashing.

## 2. Estimate the Scale

**Given Facts:**
*   Registered Users: 2,000,000
*   Normal Day Traffic: 50,000 visitors, viewing 10 pages each.
*   Normal Day Sales: 5,000 tickets.
*   Popular Concert Drop: 200,000 people competing for 20,000 seats in the first 10 minutes.

**Normal Traffic Estimates:**
*   **Read Requests:** 50,000 users * 10 pages = 500,000 requests per day. 
    *   500,000 / 86,400 seconds ≈ **6 Requests Per Second (RPS)** on average.
*   **Write Requests (Purchases):** 5,000 tickets / 86,400 ≈ **0.05 RPS**.
*   This is a highly read-heavy system under normal conditions (Read:Write ratio of ~100:1).

**Popular Concert Traffic Estimates:**
*   **Peak Traffic:** 200,000 users in 10 minutes (600 seconds).
*   **Peak RPS:** 200,000 / 600 = **~333 RPS** of concurrent users actively trying to lock seats and hit checkout simultaneously. (Note: The actual read RPS will be much higher as these users frantically refresh the page, easily hitting 5,000+ RPS).
*   **Storage:** Assuming 1KB per booking and 100 bytes per seat. Storing 2 million users and millions of historical tickets will require a few gigabytes of relational data. Storage is not our primary bottleneck; compute and database concurrency are.

## 3. Design the API

Here are five core RESTful endpoints required for the system:

1.  `GET /v1/events`
    *   Retrieves a paginated list of active events.
    *   Parameters: `search_query`, `date_from`, `date_to`, `page`.
2.  `GET /v1/events/{event_id}`
    *   Retrieves details for a specific event (artist, venue, timing).
3.  `GET /v1/events/{event_id}/seats`
    *   Retrieves the current map and availability status of seats for the event.
4.  `POST /v1/bookings/reserve`
    *   Temporarily locks a seat for a user (e.g., for 5 minutes) while they complete payment.
    *   Payload: `{"event_id": 123, "seat_ids": [45, 46], "user_id": 987}`
5.  `POST /v1/bookings/confirm`
    *   Confirms the purchase of reserved seats after successful payment.
    *   Payload: `{"reservation_id": "abc-123", "payment_token": "tok_xyz"}`

## 4. Design the Data Model

We will use a Relational Database (like PostgreSQL) because ACID properties are strictly required for ticketing.

**1. Users Table**
*   `user_id` (Primary Key, UUID)
*   `name` (VARCHAR)
*   `email` (VARCHAR, Unique)
*   `password_hash` (VARCHAR)

**2. Events Table**
*   `event_id` (Primary Key, UUID)
*   `title` (VARCHAR)
*   `start_time` (TIMESTAMP)
*   `venue_name` (VARCHAR)
*   `status` (Enum: UPCOMING, ON_SALE, SOLD_OUT)

**3. Seats Table**
*   `seat_id` (Primary Key, UUID)
*   `event_id` (Foreign Key -> Events)
*   `seat_label` (VARCHAR - e.g., "A-12")
*   `status` (Enum: AVAILABLE, RESERVED, BOOKED)
*   `price` (DECIMAL)

**4. Bookings Table**
*   `booking_id` (Primary Key, UUID)
*   `user_id` (Foreign Key -> Users)
*   `event_id` (Foreign Key -> Events)
*   `total_price` (DECIMAL)
*   `status` (Enum: PENDING_PAYMENT, CONFIRMED, CANCELLED)
*   `created_at` (TIMESTAMP)

*Relationships:* An Event has many Seats. A User has many Bookings. A Booking links to specific Seats (via a mapping table `Booking_Seats` if multiple seats are bought, though omitted here for simplicity).

## 5. High-Level Architecture

*   **Content Delivery Network (CDN):** Serves static assets (images, CSS, JS) and caches the basic event details and static seat maps to absorb read-heavy traffic.
*   **Load Balancer:** Distributes incoming API requests across multiple web servers.
*   **Web / App Servers (Auto-scaling):** Stateless backend services running the application logic. 
*   **Caching Layer (Redis):** Caches the dynamic seat availability status. When a user requests `GET /events/{id}/seats`, it serves from Redis instead of hitting the database directly.
*   **Virtual Waiting Room (Queue):** When a popular concert drops, traffic is routed to a waiting room component. Users are placed in a queue (e.g., using Redis or a dedicated service) and trickled into the main booking application at a rate the database can safely handle.
*   **Primary/Replica Database (PostgreSQL):** The primary DB handles all writes (reservations, bookings). Read replicas handle read queries (user profiles, order history) that miss the cache.

**Surviving the Big Sale:**
When 200,000 users hit the site, the CDN absorbs the initial page loads. When they try to buy, the Load Balancer routes them to the Virtual Waiting Room. Only a controlled subset (e.g., 500 users at a time) are allowed to hit the App Servers and attempt a `POST /bookings/reserve`. This protects the PostgreSQL database from connection exhaustion and deadlocks. 

## 6. Bottlenecks and Trade-offs

**Preventing Double-Booking (The core challenge):**
To prevent two people from buying the same seat, we use **Database Row-Level Locking**. When User A tries to reserve Seat 12, the system executes:
`SELECT * FROM Seats WHERE seat_id = 12 AND status = 'AVAILABLE' FOR UPDATE;`
If successful, it immediately updates the status to 'RESERVED'. If User B tries to reserve the same seat simultaneously, their query will block until User A's transaction completes, at which point User B will see the status is no longer 'AVAILABLE' and their request will fail gracefully. We can also supplement this with a Redis Distributed Lock for a faster, in-memory check before hitting the DB.

**Trade-offs:**
1.  **Consistency over Availability (CP over AP):** 
    *   *Trade-off:* In a distributed system failure, we prioritize strict consistency over availability. If the database partitions or slows down, we will block users from buying rather than risk selling the same seat twice.
    *   *What we gave up:* Maximum uptime during severe network issues. We'd rather the system return an error than double-book a customer.
2.  **Virtual Queue vs. Immediate Access:**
    *   *Trade-off:* We implemented a Virtual Waiting Room to protect the database. 
    *   *What we gave up:* Real-time, instant access for all users. Users experience artificial friction (waiting in line) even if the system might technically have the capacity to handle a few more concurrent requests. We traded absolute minimum latency for overall system stability.

**What breaks first?**
Without the waiting room, the **Database Connection Pool** breaks first. 200,000 users clicking "Reserve" simultaneously would open thousands of DB connections, causing the database to run out of memory, crash, or experience severe lock contention (deadlocks) on the `Seats` table.