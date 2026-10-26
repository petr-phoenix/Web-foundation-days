. Assumptions & Core MetricsRegistered Users: $10,000,000$ ($10\text{ million}$)
Daily Active Users (DAU): $10\%$ of registered users $= 1,000,000$ ($1\text{ million}$) DAU.
User Behavior:
    Uploads: Each active user uploads $1$ photo/day $\rightarrow 1,000,000\text{ uploads/day}$.
    Feed Views: Each active user views $50$ feed pages/day $\rightarrow 50,000,000\text{ feed views/day}$
File Sizes:Original Photo: $2\text{ MB}$ ($2,000\text{ KB}$)Thumbnail: $50\text{ KB}$ ($0.05\text{ MB}$)Traffic Spikes (Peak Ratio): $2\times$ average QPS to handle daily peak hours.Time Conversion: $1\text{ day} = 86,400\text{ seconds}$.
2. Quantitative EstimatesA. Uploads per Second (Write QPS)$$\text{Average Upload QPS} = \frac{1,000,000 \text{ uploads}}{86,400 \text{ seconds}} \approx \mathbf{11.57 \text{ uploads/sec}}$$$$\text{Peak Upload QPS} = 11.57 \times 2 = \mathbf{23.14 \text{ uploads/sec}}$$
B. Feed Views per Second (Read QPS)$$\text{Average Feed Read QPS} = \frac{50,000,000 \text{ views}}{86,400 \text{ seconds}} \approx \mathbf{578.70 \text{ views/sec}}$$$$\text{Peak Feed Read QPS} = 578.70 \times 2 = \mathbf{1,157.40 \text{ views/sec}}$$
C. Storage Requirements per YearOriginal Photos per day: $1,000,000 \times 2\text{ MB} = 2,000,000\text{ MB} = 2.00\text{ TB/day}$Thumbnails per day: $1,000,000 \times 0.05\text{ MB} = 50,000\text{ MB} = 0.05\text{ TB/day}$Total Media Storage per day: $2.00\text{ TB} + 0.05\text{ TB} = 2.05\text{ TB/day}$$$\text{Total Storage per Year} = 2.05 \text{ TB/day} \times 365 \text{ days} = \mathbf{748.25 \text{ TB/year}}$$
3. Read-Heavy vs. Write-Heavy AnalysisSnapShare is heavily READ-HEAVY.With $50,000,000$ feed page views versus $1,000,000$ photo uploads per day, the system operates at a 50:1 read-to-write ratio. System design priorities must focus on aggressive caching, edge delivery via CDN, and database read replication to prevent database contention under high scroll traffic.
4. Architecture Diagram
[ Client / Mobile App ]
                                           |
                                           v
                               [ Content Delivery Network ] (CDN)
                                           |
                                           v
                                   [ Load Balancer ]
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
        [ App Server Instance 1 ]                     [ App Server Instance 2 ]
             |          |                                  |          |
             |          +---------------+                  |          |
             v                          v                  v          v
   [ Object Storage ]          [ In-Memory Cache ]      [ Message Queue ]
  (Raw Photos / Thumbnails)     (Redis / Feed Cache)     (Kafka / RabbitMQ)
             ^                                                    |
             |                                                    v
             +------------------------------------------- [ Worker Process ]
                                                         (Thumbnail Generator)
                                                                  |
                                                                  v
                                                        [ Primary Database ]
                                                         (Write Operations)
                                                                  |
                                                                  v
                                                        [ Read Replica DB ]
                                                         (Read Operations)

5. Component Problem StatementsContent Delivery Network (CDN): Serves cached thumbnails and full-size photos directly from geographic edge servers close to users, reducing request latency and preventing high egress bandwidth on origin servers.Load Balancer: Distributes incoming user HTTP traffic evenly across multiple application server nodes to ensure high availability and prevent single points of bottleneck.App Servers: Executes core application logic, authenticates requests, processes incoming photo upload metadata, and manages interactions between caches, queues, and databases.In-Memory Cache (e.g., Redis): Holds active user sessions and pre-computed newsfeed timelines in memory to serve high-frequency read traffic with sub-millisecond responses.Primary Database: Serves as the single authoritative source of truth for write operations, storing core relational metadata such as user profiles, follow relationships, and photo indexing records.Read Replica Database: Asynchronously replicates data from the primary database to offload high-volume read queries like user profile retrieval and feed fetches.Object Storage (e.g., AWS S3): Stores raw unstructured binary image files and thumbnails with high durability, scalability, and cost efficiency.Message Queue (e.g., RabbitMQ / AWS SQS): Buffers incoming thumbnail creation jobs asynchronously to decouple client HTTP upload requests from heavy background image processing.Worker Process: Consumes background tasks from the message queue to download, crop, resize, and store photo thumbnails back into object storage without delaying the user's upload response.

6. Step-by-Step Photo Upload FlowClient Request: The user selects a photo on the mobile app, which sends an HTTP POST multipart request containing the raw $2\text{ MB}$ image file through the Load Balancer to an App Server.Raw Storage: The App Server streams the incoming raw $2\text{ MB}$ photo file directly into Object Storage and receives a unique storage key URL.Queue Enqueue: The App Server publishes a job message containing the photo_id and raw image storage URL into the Message Queue.Primary Metadata Persistence: The App Server writes the initial photo record (uploader ID, creation timestamp, raw image URL) into the Primary Database.Immediate Client Response: The App Server returns a 201 Created HTTP response to the client immediately, providing fast UI feedback without waiting for processing.Async Thumbnail Generation: A background Worker Process pulls the message from the Queue, downloads the raw photo from Object Storage, generates a $50\text{ KB}$ thumbnail, and uploads the thumbnail file back to Object Storage.Metadata & Cache Invalidation: The Worker Process updates the photo record in the Primary Database with the thumbnail's URL and invalidates/updates relevant feed entries in the In-Memory Cache.

7. Engineering Trade-offs
Trade-off 1: Synchronous vs. Asynchronous Thumbnail Generation
    Chosen Approach: Asynchronous processing via Message Queue and Worker processes.Pros: Significantly lowers HTTP response latency for uploading users and shields the application servers from CPU spikes during sudden bursts of photo uploads.
    Cons: Introduces eventual consistency—followers might see a newly created photo record in their feed 1–2 seconds before the thumbnail finishes processing, requiring placeholder skeletons in the frontend UI.
    Trade-off 2: Pull Model (Fan-out on Read) vs. Push Model (Fan-out on Write) for FeedsChosen Approach: Pull Model (Fan-out on Read) with Redis caching.
    Pros: Extremely write-efficient during uploads; uploading a photo requires writing only a single row to the database, eliminating massive database write spikes when high-follower accounts upload.
    Cons: Read queries are computationally heavier because rendering a feed requires fetching and merging post IDs from every account a user follows, putting strict dependency on Redis cache hit ratios to maintain performance.