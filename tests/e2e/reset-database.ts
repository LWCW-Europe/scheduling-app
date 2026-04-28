import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "fs";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { DateTime } from "luxon";
import * as schema from "@/db/schema";
import { VoteChoice } from "@/db/repositories/interfaces";

const TZ = "Europe/Berlin";

// Returns a UTC Date representing the given clock time on a specific day in Berlin.
// dayOffset is added to baseDate's Berlin calendar date before setting the time.
function berlinTime(
  baseDate: Date,
  dayOffset: number,
  hour: number,
  minute = 0
): Date {
  return DateTime.fromJSDate(baseDate)
    .setZone(TZ)
    .plus({ days: dayOffset })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toJSDate();
}

const mode = process.env.NODE_ENV ?? "dev";
const envFileLocal = path.resolve(process.cwd(), `.env.${mode}.local`);
const envFileShared = path.resolve(process.cwd(), `.env.${mode}`);
const envFile = fs.existsSync(envFileLocal)
  ? envFileLocal
  : fs.existsSync(envFileShared)
    ? envFileShared
    : null;
if (envFile) dotenv.config({ path: envFile });

const dbUrl = process.env.DATABASE_URL ?? "file:./data.db";

if (process.env.NODE_ENV === "production" || dbUrl.includes("prod")) {
  throw new Error("🚨 SAFETY: Cannot reset production database!");
}

function openDb() {
  const sqlite = new Database(dbUrl.replace(/^file:/, ""));
  const db = drizzle(sqlite, { schema });
  const migrationsFolder = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../drizzle"
  );
  migrate(db, { migrationsFolder });
  return db;
}

let _seedForRandom = 42;
function seededRandom() {
  const x = Math.sin(_seedForRandom++) * 10000;
  return x - Math.floor(x);
}

function generateEventDates() {
  const today = new Date();
  const phaseDuration = 14;
  const middleOffset = 7;

  // Event 1: Currently in proposal phase
  const e1PropStart = new Date(today);
  e1PropStart.setDate(today.getDate() - middleOffset);
  const e1PropEnd = new Date(e1PropStart);
  e1PropEnd.setDate(e1PropStart.getDate() + phaseDuration);
  const e1VoteStart = new Date(e1PropEnd);
  const e1VoteEnd = new Date(e1VoteStart);
  e1VoteEnd.setDate(e1VoteStart.getDate() + phaseDuration);
  const e1SchedStart = new Date(e1VoteEnd);
  const e1SchedEnd = new Date(e1SchedStart);
  e1SchedEnd.setDate(e1SchedStart.getDate() + phaseDuration);
  const e1Start = new Date(e1SchedEnd);
  e1Start.setDate(e1SchedEnd.getDate() + 7);
  const e1End = new Date(e1Start);
  e1End.setDate(e1Start.getDate() + 2);

  // Event 2: Currently in voting phase
  const e2VoteStart = new Date(today);
  e2VoteStart.setDate(today.getDate() - middleOffset);
  const e2VoteEnd = new Date(e2VoteStart);
  e2VoteEnd.setDate(e2VoteStart.getDate() + phaseDuration);
  const e2PropStart = new Date(e2VoteStart);
  e2PropStart.setDate(e2VoteStart.getDate() - phaseDuration);
  const e2PropEnd = new Date(e2VoteStart);
  const e2SchedStart = new Date(e2VoteEnd);
  const e2SchedEnd = new Date(e2SchedStart);
  e2SchedEnd.setDate(e2SchedStart.getDate() + phaseDuration);
  const e2Start = new Date(e2SchedEnd);
  e2Start.setDate(e2SchedEnd.getDate() + 7);
  const e2End = new Date(e2Start);
  e2End.setDate(e2Start.getDate() + 2);

  // Event 3: Currently in scheduling phase
  const e3SchedStart = new Date(today);
  e3SchedStart.setDate(today.getDate() - middleOffset);
  const e3SchedEnd = new Date(e3SchedStart);
  e3SchedEnd.setDate(e3SchedStart.getDate() + phaseDuration);
  const e3VoteStart = new Date(e3SchedStart);
  e3VoteStart.setDate(e3SchedStart.getDate() - phaseDuration);
  const e3VoteEnd = new Date(e3SchedStart);
  const e3PropStart = new Date(e3VoteStart);
  e3PropStart.setDate(e3VoteStart.getDate() - phaseDuration);
  const e3PropEnd = new Date(e3VoteStart);
  const e3Start = new Date(e3SchedEnd);
  e3Start.setDate(e3SchedEnd.getDate() + 7);
  const e3End = new Date(e3Start);
  e3End.setDate(e3Start.getDate() + 2);

  return [
    {
      name: "Conference Alpha",
      description: "Event currently in proposal phase",
      start: e1Start,
      end: e1End,
      proposalPhaseStart: e1PropStart,
      proposalPhaseEnd: e1PropEnd,
      votingPhaseStart: e1VoteStart,
      votingPhaseEnd: e1VoteEnd,
      schedulingPhaseStart: e1SchedStart,
      schedulingPhaseEnd: e1SchedEnd,
    },
    {
      name: "Conference Beta",
      description: "Event currently in voting phase",
      start: e2Start,
      end: e2End,
      proposalPhaseStart: e2PropStart,
      proposalPhaseEnd: e2PropEnd,
      votingPhaseStart: e2VoteStart,
      votingPhaseEnd: e2VoteEnd,
      schedulingPhaseStart: e2SchedStart,
      schedulingPhaseEnd: e2SchedEnd,
    },
    {
      name: "Conference Gamma",
      description: "Event currently in scheduling phase",
      start: e3Start,
      end: e3End,
      proposalPhaseStart: e3PropStart,
      proposalPhaseEnd: e3PropEnd,
      votingPhaseStart: e3VoteStart,
      votingPhaseEnd: e3VoteEnd,
      schedulingPhaseStart: e3SchedStart,
      schedulingPhaseEnd: e3SchedEnd,
    },
  ];
}

const sessionTemplates = [
  {
    title: "Building Scalable Web Applications with Modern React",
    description:
      "Dive deep into the latest React patterns and best practices for building scalable applications. We'll cover state management, performance optimization, and modern tooling.",
  },
  {
    title: "The Future of AI: Transforming Industries Through Machine Learning",
    description:
      "Artificial Intelligence is reshaping every industry from healthcare to finance. In this comprehensive session, we'll explore the current state of AI technology, emerging trends, and practical applications that are driving innovation.\n\nWe'll discuss real-world case studies, ethical considerations, and the skills needed to thrive in an AI-driven world. Whether you're a beginner or experienced professional, you'll gain valuable insights into how AI can transform your work and industry.\n\nTopics covered include natural language processing, computer vision, predictive analytics, and the intersection of AI with other emerging technologies like blockchain and IoT.",
  },
  {
    title: "Workshop: Hands-on Docker and Kubernetes",
    description:
      "A practical workshop on containerization and orchestration. Bring your laptop and get ready to deploy!",
  },
  {
    title: "Design Systems: Creating Consistency at Scale",
    description:
      "Learn how to build and maintain design systems that scale across teams and products.",
  },
  {
    title:
      "Cybersecurity in the Age of Remote Work: Protecting Your Digital Assets",
    description:
      "The shift to remote work has fundamentally changed the cybersecurity landscape. Traditional perimeter-based security models are no longer sufficient when employees access company resources from home networks, coffee shops, and co-working spaces.\n\nThis session will provide a comprehensive overview of modern cybersecurity challenges and solutions. We'll explore zero-trust architecture, endpoint protection strategies, and the human element of cybersecurity. Attendees will learn practical techniques for securing remote work environments, implementing multi-factor authentication, and creating security awareness programs.\n\nWe'll also discuss emerging threats like sophisticated phishing attacks, ransomware targeting remote workers, and supply chain vulnerabilities. Real-world examples and case studies will illustrate both successful security implementations and costly breaches, providing actionable insights for organizations of all sizes.",
  },
  {
    title: "Microservices Architecture: Lessons from the Trenches",
    description:
      "Real-world experiences with microservices: what works, what doesn't, and when to avoid them entirely.",
  },
  {
    title: "Sustainable Software Development: Green Coding Practices",
    description:
      "How to reduce the environmental impact of your code through efficient algorithms and sustainable practices.",
  },
  {
    title: "Building Inclusive Tech Teams: Beyond Diversity Hiring",
    description:
      "Creating truly inclusive environments requires more than diverse hiring. This session explores psychological safety, inclusive leadership, and systemic changes needed for equity in tech.\n\nWe'll examine unconscious bias in technical interviews, the importance of sponsorship vs mentorship, and how to build cultures where everyone can thrive. Participants will leave with concrete strategies for fostering inclusion at every level of their organization.",
  },
  {
    title: "API Design: RESTful vs GraphQL vs gRPC",
    description:
      "A comparative analysis of different API paradigms with practical examples and use cases.",
  },
  {
    title:
      "The Psychology of User Experience: Understanding Human-Computer Interaction",
    description:
      "User experience design is fundamentally about understanding human psychology and behavior. This session delves into cognitive psychology principles that drive effective UX design, including mental models, cognitive load theory, and decision-making processes.\n\nWe'll explore how users actually interact with digital interfaces, common usability heuristics, and the science behind user research methods. Through interactive exercises and real-world examples, attendees will learn to apply psychological principles to create more intuitive and engaging user experiences.\n\nTopics include attention and perception, memory limitations, emotional design, accessibility considerations, and cross-cultural UX patterns. Perfect for designers, developers, and product managers looking to create more human-centered digital products.",
  },
  {
    title: "Blockchain Beyond Cryptocurrency: Practical Applications",
    description:
      "Exploring real-world blockchain applications in supply chain, healthcare, and digital identity.",
  },
  {
    title: "Performance Optimization: Making Your Apps Lightning Fast",
    description:
      "Techniques for optimizing web and mobile applications for speed and efficiency.",
  },
  {
    title: "Open Source Sustainability: Funding and Community Building",
    description:
      "The open source ecosystem faces sustainability challenges as projects grow in complexity and importance. This session examines successful funding models, from corporate sponsorship to foundation grants to innovative approaches like GitHub Sponsors.\n\nWe'll discuss community building strategies, maintainer burnout prevention, and the economic realities of supporting critical infrastructure projects. Case studies will include successful projects that have achieved sustainable funding and community growth.",
  },
  {
    title: "DevOps Culture: Breaking Down Silos",
    description:
      "How to foster collaboration between development and operations teams for better software delivery.",
  },
  {
    title: "Machine Learning Ethics: Bias, Fairness, and Accountability",
    description:
      "As machine learning systems become more prevalent in decision-making processes, ethical considerations become paramount. This session explores algorithmic bias, fairness metrics, and accountability frameworks.\n\nWe'll examine real-world cases where ML systems have perpetuated or amplified societal biases, and discuss practical approaches for building more equitable AI systems. Topics include data bias, model interpretability, fairness-aware machine learning, and the legal and regulatory landscape surrounding AI ethics.",
  },
];

function clearAll() {
  console.log("🧹 Clearing all tables...");
  const db = openDb();
  db.delete(schema.votes).run();
  db.delete(schema.rsvps).run();
  db.delete(schema.sessionLocations).run();
  db.delete(schema.sessionHosts).run();
  db.delete(schema.sessions).run();
  db.delete(schema.proposalHosts).run();
  db.delete(schema.sessionProposals).run();
  db.delete(schema.days).run();
  db.delete(schema.eventGuests).run();
  db.delete(schema.eventLocations).run();
  db.delete(schema.events).run();
  db.delete(schema.locations).run();
  db.delete(schema.guests).run();
  console.log("  ✅ All tables cleared");
}

function seedTestData() {
  console.log("🌱 Seeding test data...");
  const db = openDb();

  const eventConfigs = generateEventDates();
  console.log(`📅 Generated dynamic dates for ${eventConfigs.length} events`);
  console.log(`🗓️  Today is: ${new Date().toISOString().split("T")[0]}`);

  // Guests
  console.log("  📝 Creating test guests...");
  const guestRows = [
    { id: nanoid(), name: "Alice Test", email: "alice@test.com" },
    { id: nanoid(), name: "Bob Test", email: "bob@test.com" },
    { id: nanoid(), name: "Charlie Test", email: "charlie@test.com" },
  ];
  db.insert(schema.guests).values(guestRows).run();
  console.log(`  ✅ Created ${guestRows.length} guests`);

  // Locations
  console.log("  📍 Creating test locations...");
  const locationRows = [
    {
      id: nanoid(),
      name: "Main Hall",
      capacity: 100,
      bookable: true,
      sortIndex: 1,
      color: "blue",
      imageUrl: "",
      description: "",
      hidden: false,
    },
    {
      id: nanoid(),
      name: "Room A",
      capacity: 30,
      bookable: true,
      sortIndex: 2,
      color: "green",
      imageUrl: "",
      description: "",
      hidden: false,
    },
    {
      id: nanoid(),
      name: "Room B",
      capacity: 25,
      bookable: true,
      sortIndex: 3,
      color: "red",
      imageUrl: "",
      description: "",
      hidden: false,
    },
  ];
  db.insert(schema.locations).values(locationRows).run();
  console.log(`  ✅ Created ${locationRows.length} locations`);

  // Events
  console.log("  🎪 Creating test events...");
  const eventRows = eventConfigs.map((config, index) => ({
    id: nanoid(),
    name: config.name,
    description: config.description,
    website: `test-event-${index + 1}.example.com`,
    start: config.start.toISOString(),
    end: config.end.toISOString(),
    proposalPhaseStart: config.proposalPhaseStart.toISOString(),
    proposalPhaseEnd: config.proposalPhaseEnd.toISOString(),
    votingPhaseStart: config.votingPhaseStart.toISOString(),
    votingPhaseEnd: config.votingPhaseEnd.toISOString(),
    schedulingPhaseStart: config.schedulingPhaseStart.toISOString(),
    schedulingPhaseEnd: config.schedulingPhaseEnd.toISOString(),
    timezone: TZ,
    maxSessionDuration: 120,
  }));
  db.insert(schema.events).values(eventRows).run();
  console.log(`  ✅ Created ${eventRows.length} events`);

  // Link all guests and locations to all events
  const eventGuestRows = eventRows.flatMap((ev) =>
    guestRows.map((g) => ({ eventId: ev.id, guestId: g.id }))
  );
  const eventLocationRows = eventRows.flatMap((ev) =>
    locationRows.map((l) => ({ eventId: ev.id, locationId: l.id }))
  );
  db.insert(schema.eventGuests).values(eventGuestRows).run();
  db.insert(schema.eventLocations).values(eventLocationRows).run();

  // Days (3 per event, 09:00–18:00 Berlin, bookable 09:00–17:30 Berlin)
  console.log("  📅 Creating test days...");
  const dayRows = eventRows.flatMap((ev, eventIndex) => {
    const config = eventConfigs[eventIndex];
    return [0, 1, 2].map((dayIndex) => ({
      id: nanoid(),
      start: berlinTime(config.start, dayIndex, 9, 0).toISOString(),
      end: berlinTime(config.start, dayIndex, 18, 0).toISOString(),
      startBookings: berlinTime(config.start, dayIndex, 9, 0).toISOString(),
      endBookings: berlinTime(config.start, dayIndex, 17, 30).toISOString(),
      eventId: ev.id,
    }));
  });
  db.insert(schema.days).values(dayRows).run();
  console.log(
    `  ✅ Created ${dayRows.length} days across ${eventRows.length} events`
  );

  // Session proposals
  console.log("  💡 Creating test session proposals...");
  const proposalRows: (typeof schema.sessionProposals.$inferInsert)[] = [];
  const proposalHostRows: (typeof schema.proposalHosts.$inferInsert)[] = [];

  eventRows.forEach((ev, eventIndex) => {
    const eventName = eventConfigs[eventIndex].name;
    const numProposals = 8 + eventIndex * 2; // 8, 10, 12

    for (let i = 0; i < numProposals; i++) {
      const template = sessionTemplates[i % sessionTemplates.length];
      const hostIndex = (eventIndex + i) % guestRows.length;
      const hostProbability = seededRandom();
      let hostIds: string[];
      if (hostProbability < 0.2) {
        hostIds = [];
      } else if (hostProbability < 0.4) {
        hostIds = [
          guestRows[hostIndex].id,
          guestRows[(hostIndex + 1) % guestRows.length].id,
        ];
      } else {
        hostIds = [guestRows[hostIndex].id];
      }

      const possibleDurations = [undefined, 30, 60, 90, 120, 150, 180];
      const duration =
        possibleDurations[
          Math.floor(seededRandom() * possibleDurations.length)
        ];

      const title =
        i < sessionTemplates.length
          ? template.title
          : `${template.title} - ${eventName} Special Edition`;
      const description =
        i < sessionTemplates.length
          ? template.description
          : `${template.description}\n\nThis special edition for ${eventName} will include additional content tailored to our community's interests and current industry trends.`;

      const proposalId = nanoid();
      proposalRows.push({
        id: proposalId,
        eventId: ev.id,
        title,
        description,
        durationMinutes: duration ?? null,
        createdTime: new Date().toISOString(),
      });
      for (const guestId of hostIds) {
        proposalHostRows.push({ proposalId, guestId });
      }
    }

    // Event-specific proposals
    const eventSpecific = [
      {
        title: `${eventName} Lightning Talks: Community Showcase`,
        description: `A fast-paced session featuring 5-minute lightning talks from ${eventName} attendees. This is your chance to share a quick tip, tool, or technique with the community.\n\nWe'll have 8-10 speakers covering diverse topics chosen by community vote. Past lightning talks have covered everything from productivity hacks to cutting-edge research findings. Whether you're a first-time speaker or seasoned presenter, lightning talks provide a low-pressure environment to share your expertise.\n\nSubmit your lightning talk proposal during the event - we'll be accepting submissions right up until the session begins!`,
      },
      {
        title: `Networking & Coffee Chat: Connect with ${eventName} Peers`,
        description: `An informal networking session designed to help ${eventName} attendees connect over coffee and conversation. This isn't a structured presentation - instead, we'll facilitate small group discussions around shared interests and challenges.\n\nWhether you're looking for career advice, collaboration opportunities, or just want to meet like-minded professionals, this session provides a welcoming environment for meaningful connections.`,
      },
      {
        title: `${eventName} Panel: Industry Leaders Share Their Insights`,
        description: `Join us for an engaging panel discussion featuring industry leaders and ${eventName} community members. Our panelists will share their perspectives on current trends, future predictions, and career advice.\n\nThis interactive session includes audience Q&A, so come prepared with your questions! Topics will be driven by audience interest but typically cover emerging technologies, leadership challenges, and navigating career transitions in tech.`,
      },
    ];

    eventSpecific.forEach((p, pIndex) => {
      const proposalId = nanoid();
      const guestId = guestRows[(eventIndex + pIndex) % guestRows.length].id;
      proposalRows.push({
        id: proposalId,
        eventId: ev.id,
        title: p.title,
        description: p.description,
        durationMinutes: 30,
        createdTime: new Date().toISOString(),
      });
      proposalHostRows.push({ proposalId, guestId });
    });
  });

  db.insert(schema.sessionProposals).values(proposalRows).run();
  if (proposalHostRows.length > 0) {
    db.insert(schema.proposalHosts).values(proposalHostRows).run();
  }
  console.log(
    `  ✅ Created ${proposalRows.length} session proposals across ${eventRows.length} events`
  );

  // Votes (for Beta and Gamma events)
  console.log("  🗳️  Creating test votes...");
  const voteChoices = [
    { choice: VoteChoice.interested, weight: 40 },
    { choice: VoteChoice.maybe, weight: 35 },
    { choice: VoteChoice.skip, weight: 25 },
  ];

  const voteRows: (typeof schema.votes.$inferInsert)[] = [];

  // Event-specific proposals have deterministic titles and are used as clean
  // test targets — skip them when seeding votes so tests start from a
  // known "no prior vote" state.
  const eventSpecificTitlePatterns = [
    /Lightning Talks: Community Showcase$/,
    /^Networking & Coffee Chat: /,
    /Panel: Industry Leaders Share Their Insights$/,
  ];

  eventRows.forEach((ev, eventIndex) => {
    const eventName = eventConfigs[eventIndex].name;
    if (eventName !== "Conference Beta" && eventName !== "Conference Gamma") {
      return;
    }

    const eventProposals = proposalRows.filter(
      (p) =>
        p.eventId === ev.id &&
        !eventSpecificTitlePatterns.some((re) => re.test(p.title))
    );

    guestRows.forEach((guest) => {
      eventProposals.forEach((proposal) => {
        const isHost = proposalHostRows.some(
          (ph) => ph.proposalId === proposal.id && ph.guestId === guest.id
        );
        if (!isHost && seededRandom() < 0.4) {
          const randomValue = seededRandom() * 100;
          let cumulativeWeight = 0;
          let selectedChoice = VoteChoice.interested;
          for (const { choice, weight } of voteChoices) {
            cumulativeWeight += weight;
            if (randomValue <= cumulativeWeight) {
              selectedChoice = choice;
              break;
            }
          }
          voteRows.push({
            id: nanoid(),
            proposalId: proposal.id,
            guestId: guest.id,
            choice: selectedChoice,
          });
        }
      });
    });
  });

  if (voteRows.length > 0) {
    db.insert(schema.votes).values(voteRows).run();
  }
  console.log(`  ✅ Created ${voteRows.length} votes`);

  // Sessions (one keynote + lunch blockers per event)
  console.log("  🎯 Creating test sessions...");
  const sessionRows: (typeof schema.sessions.$inferInsert)[] = [];
  const sessionHostRows: (typeof schema.sessionHosts.$inferInsert)[] = [];
  const sessionLocationRows: (typeof schema.sessionLocations.$inferInsert)[] =
    [];

  eventRows.forEach((ev, eventIndex) => {
    const config = eventConfigs[eventIndex];

    // Opening keynote: 09:00–10:30 Berlin on day 1
    const keynoteId = nanoid();
    sessionRows.push({
      id: keynoteId,
      title: `Opening Keynote - ${config.name}`,
      description: `Welcome to ${config.name}`,
      startTime: berlinTime(config.start, 0, 9, 0).toISOString(),
      endTime: berlinTime(config.start, 0, 10, 30).toISOString(),
      eventId: ev.id,
      capacity: 0,
      attendeeScheduled: false,
      blocker: false,
      closed: false,
    });
    sessionHostRows.push({
      sessionId: keynoteId,
      guestId: guestRows[eventIndex % guestRows.length].id,
    });
    sessionLocationRows.push({
      sessionId: keynoteId,
      locationId: locationRows[0].id,
    });

    // Lunch blockers: 12:30–14:00 Berlin, all rooms, all 3 days
    for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
      const lunchId = nanoid();
      sessionRows.push({
        id: lunchId,
        title: "Lunch Break",
        description: "",
        startTime: berlinTime(config.start, dayIndex, 12, 30).toISOString(),
        endTime: berlinTime(config.start, dayIndex, 14, 0).toISOString(),
        eventId: ev.id,
        capacity: 0,
        attendeeScheduled: false,
        blocker: true,
        closed: false,
      });
      for (const loc of locationRows) {
        sessionLocationRows.push({ sessionId: lunchId, locationId: loc.id });
      }
    }
  });

  db.insert(schema.sessions).values(sessionRows).run();
  if (sessionHostRows.length > 0) {
    db.insert(schema.sessionHosts).values(sessionHostRows).run();
  }
  if (sessionLocationRows.length > 0) {
    db.insert(schema.sessionLocations).values(sessionLocationRows).run();
  }
  console.log(
    `  ✅ Created ${sessionRows.length} sessions across ${eventRows.length} events`
  );

  console.log("✅ Test data seeded successfully");
}

function resetDatabase() {
  try {
    console.log("🔄 Resetting test database to known state...");
    console.log(`📍 Database: ${dbUrl}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "dev"}`);

    clearAll();
    seedTestData();

    console.log("🎉 Database reset completed successfully!");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Database reset failed:", message);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  resetDatabase();
}

export { resetDatabase, clearAll, seedTestData };
