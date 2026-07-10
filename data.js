/**
 * data.js — Single source of truth for all portfolio content.
 * To add a new blog post, job, project etc., just append to the
 * relevant array below. No HTML changes needed.
 */
const DATA = {

  /* ─── PROFILE ─────────────────────────────────────────────── */
  profile: {
    initials : 'RR',
    name     : 'Rahul Ray',
    title    : 'Software Engineer',
    org      : 'ICAR – IASRI, New Delhi',
    bio      : [
      'Software Engineer at ICAR-IASRI, New Delhi, working on backend systems for large-scale genomic data platforms. Specializing in Python, FastAPI, and distributed systems, with a focus on building production-grade APIs, AI/RAG pipelines, and cloud-native architectures on AWS.',
      "Off the clock, I'm usually implementing distributed-systems algorithms from scratch, just to see how they actually work under the hood."
    ],
    email    : 'Rahulrayconnect@gmail.com',
    linkedin : 'https://www.linkedin.com/in/r4hulray',
    github   : 'https://github.com/R4hulR',
  },

  /* ─── EXPERIENCE ───────────────────────────────────────────── */
  experience: [
    {
      date    : 'Dec 2024 – Present',
      title   : 'Software Engineer',
      subtitle: '(Young Professional-II, IT)',
      org     : 'ICAR – Indian Agricultural Statistics Research Institute (IASRI)',
      bullets : [
        'Architected backend services for ASHOKA HPC Hub, designing RESTful APIs managing access to a 1.5 PB genomic data lake for the National Agricultural Bioinformatics Grid (NABG).',
        'Led migration of data processing modules from Laravel to asynchronous FastAPI microservices, significantly improving throughput for I/O-heavy tasks.',
        'Optimized MySQL schemas with composite indexing strategies, eliminating full-table scans and reducing query latency for multi-terabyte datasets.',
        'Implemented JWT authentication and RBAC for a secure API layer, enabling mobile-to-cloud data synchronization for field researchers.',
      ],
    },
    {
      date    : 'Aug 2023 – Nov 2024',
      title   : 'Independent Backend Engineering Researcher',
      org     : 'Self-Directed',
      bullets : [
        '<b>Enterprise RAG System:</b> Built a production-ready Q&amp;A API using FastAPI and Docker with asynchronous document ingestion into ChromaDB; deployed on AWS (EC2, S3) with an Nginx reverse proxy.',
        '<b>Scalargrad Engine:</b> Implemented a custom Python autograd engine from first principles using Directed Acyclic Graphs (DAGs) for gradient backpropagation; validated correctness against PyTorch.',
      ],
    },
    {
      date    : 'Jun 2022 – Jul 2022',
      title   : 'Android Development Intern',
      org     : 'IIT BHU',
      bullets : [
        'Built a real-time news aggregation app in Java using Retrofit; improved performance and UX by integrating Picasso for asynchronous image loading and caching.',
      ],
    },
  ],

  /* ─── EDUCATION ────────────────────────────────────────────── */
  education: [
    {
      date  : 'Aug 2019 – Jun 2023',
      degree: 'B.Tech, Computer Science and Engineering',
      org   : 'Assam University',
      gpa   : 'CGPA: 7.43 / 10',
    },
  ],

  /* ─── SKILLS ───────────────────────────────────────────────── */
  skills: [
    {
      group: 'Languages & Frameworks',
      chips: ['Python', 'FastAPI', 'SQL', 'Docker', 'LangChain', 'Java'],
    },
    {
      group: 'Cloud & AI',
      chips: ['AWS (EC2, S3, IAM)', 'PostgreSQL / MySQL', 'ChromaDB (Vector)', 'Redis', 'RAG Systems', 'CI/CD'],
    },
  ],

  /* ─── PROJECTS ─────────────────────────────────────────────── */
  projects: [
    {
      title: 'Raft Consensus Algorithm',
      href : 'https://github.com/R4hulR/raft-consensus',
      meta : 'Personal Project · May 2025',
      desc : 'Implemented Raft consensus from scratch — leader election with randomized timeouts, log replication with majority quorum commits, and automatic failover on leader crash. Built a TCP/HTTP transport layer using FastAPI for inter-node communication, plus a live browser visualization of node states, term numbers, and the state machine in real time.',
      tech : 'Python · FastAPI · Distributed Systems',
    },
    {
      title: 'Gossip Protocol — Peer-to-Peer Failure Detector',
      href : 'https://github.com/R4hulR/gossip-protocol',
      meta : 'Personal Project · April 2025',
      desc : 'Built a gossip-based distributed failure detector with epidemic propagation over UDP, decentralized membership tracking, and eventual consistency via heartbeat merge — achieving sub-15s failure detection across N nodes converging in O(log N) rounds.',
      tech : 'Python · UDP Sockets · Threading · Distributed Systems',
    },
    {
      title: 'Enterprise RAG System for Document Intelligence',
      href : 'https://github.com/R4hulR/RAG',
      meta : 'Personal Project · July 2024',
      desc : "Production-ready RAG API for semantic search over PDFs using Google's Gemma LLM, with asynchronous ingestion into ChromaDB and deployment on AWS EC2 via Docker Compose + Nginx.",
      tech : 'FastAPI · Docker · AWS · ChromaDB · LangChain',
    },
    {
      title: 'Scalargrad — Autograd Engine & Neural Network Library',
      href : 'https://github.com/R4hulR/Scalargrad',
      meta : 'Personal Project · January 2024',
      desc : "Compact scalar-based autograd engine and neural network library built from first principles, inspired by Karpathy's micrograd. Implements backpropagation via DAGs, validated against PyTorch.",
      tech : 'Python · NumPy',
    },
  ],

  /* ─── BLOG ─────────────────────────────────────────────────── *
   *  Add new posts here. Each entry renders as a card inside     *
   *  the Internet Explorer window automatically.                 *
   * ─────────────────────────────────────────────────────────── */
  blog: [
    {
      title  : 'What is an Open Service Broker and How Do You Build One?',
      url    : 'https://medium.com/@R4hulRay/what-is-an-open-service-broker-and-how-do-you-build-one-b60ea0d2ae2a',
      date   : 'Medium · 2024',
      summary: 'A deep dive into the Open Service Broker API spec — what it is, why it exists, and a hands-on walkthrough of building a fully compliant broker from scratch using Python and FastAPI.',
      // Full article content rendered inside the IE window.
      // Paste your article HTML/text here. Basic HTML tags (<h2>, <p>, <code>, <pre>, <ul>, <li>) are supported.
      content: `
        <h2>What is an Open Service Broker?</h2>
        <p>The Open Service Broker (OSB) API is a specification that defines a standard way for platforms
        (like Kubernetes or Cloud Foundry) to provision, bind, and deprovision backing services — think
        databases, message queues, or caches — through a uniform HTTP interface.</p>

        <p>Instead of every cloud platform inventing its own integration format, OSB gives service providers
        one API surface to implement and lets any OSB-compatible platform consume it automatically.</p>

        <h2>Why Does It Matter?</h2>
        <p>Before OSB, adding a new managed service to a platform required deep, platform-specific integration
        work. With OSB, you write the broker once and any compliant platform can discover, provision, and
        bind your service with zero custom code on their end.</p>

        <h2>The Core Concepts</h2>
        <ul>
          <li><b>Catalog</b> — the broker advertises its available services and plans via <code>GET /v2/catalog</code>.</li>
          <li><b>Provision</b> — a platform creates a service instance via <code>PUT /v2/service_instances/:id</code>.</li>
          <li><b>Bind</b> — credentials are issued to an app via <code>PUT /v2/service_instances/:id/service_bindings/:bid</code>.</li>
          <li><b>Deprovision / Unbind</b> — cleanup via the corresponding DELETE endpoints.</li>
        </ul>

        <h2>Building One with Python + FastAPI</h2>
        <p>FastAPI's automatic OpenAPI generation and async support make it an ideal fit for implementing the
        OSB spec. Each endpoint maps cleanly to a route, and Pydantic models enforce the request/response
        shapes defined in the spec.</p>

        <pre><code>@app.get("/v2/catalog")
async def catalog():
    return {"services": [...]}

@app.put("/v2/service_instances/{instance_id}")
async def provision(instance_id: str, body: ProvisionRequest):
    # create the resource, return dashboard_url
    ...</code></pre>

        <p>
          ➜ <a href="https://medium.com/@R4hulRay/what-is-an-open-service-broker-and-how-do-you-build-one-b60ea0d2ae2a"
               target="_blank" rel="noopener">Read the full article on Medium</a>
        </p>
      `,
    },
    // Add more blog posts below ↓
    // {
    //   title  : 'My Next Post',
    //   url    : 'https://medium.com/@R4hulRay/...',
    //   date   : 'Medium · 2025',
    //   summary: 'Short description shown on the card.',
    //   content: `<h2>...</h2><p>...</p>`,
    // },
  ],

};
