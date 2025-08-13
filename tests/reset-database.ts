import Airtable from "airtable";
import dotenv from "dotenv";
import path from "path";

// Load environment-specific config
const envFile =
  process.env.NODE_ENV === "test" ? ".env.test.local" : ".env.local";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const apiKey = process.env.AIRTABLE_API_KEY!;
const baseId = process.env.AIRTABLE_BASE_ID!;

if (!apiKey || !baseId) {
  throw new Error(
    `Missing Airtable config: check AIRTABLE_API_KEY and AIRTABLE_BASE_ID in ${envFile}`
  );
}

// Safety check: prevent accidental production resets
if (process.env.NODE_ENV === "production" || baseId.includes("prod")) {
  throw new Error("🚨 SAFETY: Cannot reset production database!");
}

const base = new Airtable({ apiKey }).base(baseId);

const allTables = [
  "Events",
  "Sessions",
  "Guests",
  "Locations",
  "Days",
  "RSVPs",
  "SessionProposals",
  // Don't clear: "Migrations"
];

var _seedForRandom = 42;
function seededRandom() {
  var x = Math.sin(_seedForRandom++) * 10000;
  return x - Math.floor(x);
}

async function clearTable(tableName: string) {
  console.log(`🧹 Clearing table: ${tableName}`);

  try {
    const records = await base(tableName).select().all();

    if (records.length === 0) {
      console.log(`  ✅ Table ${tableName} already empty`);
      return;
    }

    // Delete in chunks of 10 (Airtable limit)
    const deleteChunks = [];
    for (let i = 0; i < records.length; i += 10) {
      deleteChunks.push(records.slice(i, i + 10));
    }

    for (const chunk of deleteChunks) {
      await base(tableName).destroy(chunk.map((r) => r.id));
    }

    console.log(`  ✅ Cleared ${records.length} records from ${tableName}`);
  } catch (error: any) {
    if (error.message?.includes("TABLE_NOT_FOUND")) {
      console.log(`  ⚠️  Table ${tableName} doesn't exist (skipping)`);
    } else {
      throw error;
    }
  }
}

// Helper function to generate dynamic dates
function generateEventDates() {
  const today = new Date();

  // Each phase is 2 weeks (14 days), today should be in the middle (day 7)
  const phaseDuration = 14; // days
  const middleOffset = 7; // days from phase start to today

  // Event 1: Currently in proposal phase
  const event1ProposalStart = new Date(today);
  event1ProposalStart.setDate(today.getDate() - middleOffset);
  const event1ProposalEnd = new Date(event1ProposalStart);
  event1ProposalEnd.setDate(event1ProposalStart.getDate() + phaseDuration);

  const event1VotingStart = new Date(event1ProposalEnd);
  const event1VotingEnd = new Date(event1VotingStart);
  event1VotingEnd.setDate(event1VotingStart.getDate() + phaseDuration);

  const event1SchedulingStart = new Date(event1VotingEnd);
  const event1SchedulingEnd = new Date(event1SchedulingStart);
  event1SchedulingEnd.setDate(event1SchedulingStart.getDate() + phaseDuration);

  // Event 1 starts 1 week after scheduling phase ends
  const event1Start = new Date(event1SchedulingEnd);
  event1Start.setDate(event1SchedulingEnd.getDate() + 7);
  const event1End = new Date(event1Start);
  event1End.setDate(event1Start.getDate() + 2); // 3-day event

  // Event 2: Currently in voting phase
  const event2VotingStart = new Date(today);
  event2VotingStart.setDate(today.getDate() - middleOffset);
  const event2VotingEnd = new Date(event2VotingStart);
  event2VotingEnd.setDate(event2VotingStart.getDate() + phaseDuration);

  const event2ProposalStart = new Date(event2VotingStart);
  event2ProposalStart.setDate(event2VotingStart.getDate() - phaseDuration);
  const event2ProposalEnd = new Date(event2VotingStart);

  const event2SchedulingStart = new Date(event2VotingEnd);
  const event2SchedulingEnd = new Date(event2SchedulingStart);
  event2SchedulingEnd.setDate(event2SchedulingStart.getDate() + phaseDuration);

  // Event 2 starts 1 week after scheduling phase ends
  const event2Start = new Date(event2SchedulingEnd);
  event2Start.setDate(event2SchedulingEnd.getDate() + 7);
  const event2End = new Date(event2Start);
  event2End.setDate(event2Start.getDate() + 2);

  // Event 3: Currently in scheduling phase
  const event3SchedulingStart = new Date(today);
  event3SchedulingStart.setDate(today.getDate() - middleOffset);
  const event3SchedulingEnd = new Date(event3SchedulingStart);
  event3SchedulingEnd.setDate(event3SchedulingStart.getDate() + phaseDuration);

  const event3VotingStart = new Date(event3SchedulingStart);
  event3VotingStart.setDate(event3SchedulingStart.getDate() - phaseDuration);
  const event3VotingEnd = new Date(event3SchedulingStart);

  const event3ProposalStart = new Date(event3VotingStart);
  event3ProposalStart.setDate(event3VotingStart.getDate() - phaseDuration);
  const event3ProposalEnd = new Date(event3VotingStart);

  // Event 3 starts 1 week after scheduling phase ends
  const event3Start = new Date(event3SchedulingEnd);
  event3Start.setDate(event3SchedulingEnd.getDate() + 7);
  const event3End = new Date(event3Start);
  event3End.setDate(event3Start.getDate() + 2);

  return [
    {
      name: "Conference Alpha",
      description: "Event currently in proposal phase",
      start: event1Start,
      end: event1End,
      proposalPhaseStart: event1ProposalStart,
      proposalPhaseEnd: event1ProposalEnd,
      votingPhaseStart: event1VotingStart,
      votingPhaseEnd: event1VotingEnd,
      schedulingPhaseStart: event1SchedulingStart,
      schedulingPhaseEnd: event1SchedulingEnd,
    },
    {
      name: "Conference Beta",
      description: "Event currently in voting phase",
      start: event2Start,
      end: event2End,
      proposalPhaseStart: event2ProposalStart,
      proposalPhaseEnd: event2ProposalEnd,
      votingPhaseStart: event2VotingStart,
      votingPhaseEnd: event2VotingEnd,
      schedulingPhaseStart: event2SchedulingStart,
      schedulingPhaseEnd: event2SchedulingEnd,
    },
    {
      name: "Conference Gamma",
      description: "Event currently in scheduling phase",
      start: event3Start,
      end: event3End,
      proposalPhaseStart: event3ProposalStart,
      proposalPhaseEnd: event3ProposalEnd,
      votingPhaseStart: event3VotingStart,
      votingPhaseEnd: event3VotingEnd,
      schedulingPhaseStart: event3SchedulingStart,
      schedulingPhaseEnd: event3SchedulingEnd,
    },
  ];
}

// Helper function to generate diverse session proposals
function generateSessionProposals(
  events: Airtable.Records<Airtable.FieldSet>,
  eventConfigs: any[],
  guests: Airtable.Records<Airtable.FieldSet>
) {
  const proposals: Array<{
    fields: {
      title: string;
      description: string;
      durationMinutes?: number;
      event: string[];
      hosts: string[];
    };
  }> = [];

  // Predefined session proposal templates for variety
  const sessionTemplates = [
    {
      title: "Building Scalable Web Applications with Modern React",
      description:
        "Dive deep into the latest React patterns and best practices for building scalable applications. We'll cover state management, performance optimization, and modern tooling.",
    },
    {
      title:
        "The Future of AI: Transforming Industries Through Machine Learning",
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

  // Generate proposals for each event
  events.forEach((event, eventIndex) => {
    const eventName = eventConfigs[eventIndex].name;
    const numProposals = 8 + eventIndex * 2; // 8, 10, 12 proposals per event

    for (let i = 0; i < numProposals; i++) {
      const template = sessionTemplates[i % sessionTemplates.length];
      const hostIndex = (eventIndex + i) % guests.length;

      const hostProbability = seededRandom();
      let hostIds: string[];
      if (hostProbability < 0.2) {
        // 20% probability: no host
        hostIds = [];
      } else if (hostProbability < 0.4) {
        // 20% probability: multiple hosts
        hostIds = [
          guests[hostIndex].id,
          guests[(hostIndex + 1) % guests.length].id,
        ];
      } else {
        // 60% probability: one host
        hostIds = [guests[hostIndex].id];
      }

      const possibleDurations = [undefined, 30, 60, 90, 120, 150, 180];

      // Customize title and description based on event
      const customizedTitle =
        i < sessionTemplates.length
          ? template.title
          : `${template.title} - ${eventName} Special Edition`;

      const customizedDescription =
        i < sessionTemplates.length
          ? template.description
          : `${template.description}\n\nThis special edition for ${eventName} will include additional content tailored to our community's interests and current industry trends.`;

      proposals.push({
        fields: {
          title: customizedTitle,
          description: customizedDescription,
          durationMinutes:
            possibleDurations[
              Math.floor(seededRandom() * possibleDurations.length)
            ],
          event: [event.id],
          hosts: hostIds,
        },
      });
    }

    // Add a few event-specific proposals
    const eventSpecificProposals = [
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

    eventSpecificProposals.forEach((proposal, proposalIndex) => {
      const hostIndex = (eventIndex + proposalIndex) % guests.length;
      proposals.push({
        fields: {
          title: proposal.title,
          description: proposal.description,
          durationMinutes: 30,
          event: [event.id],
          hosts: [guests[hostIndex].id],
        },
      });
    });
  });

  return proposals;
}

async function seedTestData() {
  console.log("🌱 Seeding test data...");

  const eventConfigs = generateEventDates();
  console.log(`📅 Generated dynamic dates for ${eventConfigs.length} events`);
  console.log(`🗓️  Today is: ${new Date().toISOString().split("T")[0]}`);

  try {
    // Create test guests
    console.log("  📝 Creating test guests...");
    const guests = await base("Guests").create([
      { fields: { Name: "Alice Test", Email: "alice@test.com" } },
      { fields: { Name: "Bob Test", Email: "bob@test.com" } },
      { fields: { Name: "Charlie Test", Email: "charlie@test.com" } },
    ]);
    console.log(`  ✅ Created ${guests.length} guests`);

    // Create test locations
    console.log("  📍 Creating test locations...");
    const locations = await base("Locations").create([
      {
        fields: {
          Name: "Main Hall",
          Capacity: 100,
          Bookable: true,
          Index: 1,
          Color: "blue",
        },
      },
      {
        fields: {
          Name: "Room A",
          Capacity: 30,
          Bookable: true,
          Index: 2,
          Color: "green",
        },
      },
      {
        fields: {
          Name: "Room B",
          Capacity: 25,
          Bookable: true,
          Index: 3,
          Color: "red",
        },
      },
    ]);
    console.log(`  ✅ Created ${locations.length} locations`);

    // Create test events with dynamic dates
    console.log("  🎪 Creating test events...");
    const events = await base("Events").create(
      eventConfigs.map((config, index) => ({
        fields: {
          Name: config.name,
          Description: config.description,
          Website: `test-event-${index + 1}.example.com`,
          Start: config.start.toISOString().split("T")[0],
          End: config.end.toISOString().split("T")[0],
          Guests: guests.map((g) => g.id),
          Locations: locations.map((l) => l.id),
          proposalPhaseStart: config.proposalPhaseStart.toISOString(),
          proposalPhaseEnd: config.proposalPhaseEnd.toISOString(),
          votingPhaseStart: config.votingPhaseStart.toISOString(),
          votingPhaseEnd: config.votingPhaseEnd.toISOString(),
          schedulingPhaseStart: config.schedulingPhaseStart.toISOString(),
          schedulingPhaseEnd: config.schedulingPhaseEnd.toISOString(),
        },
      }))
    );
    console.log(`  ✅ Created ${events.length} events`);

    // Create test days for each event
    console.log("  📅 Creating test days...");
    const allDays = [];

    for (let eventIndex = 0; eventIndex < events.length; eventIndex++) {
      const event = events[eventIndex];
      const config = eventConfigs[eventIndex];

      for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
        const dayStart = new Date(config.start);
        dayStart.setDate(config.start.getDate() + dayIndex);
        dayStart.setHours(8, 0, 0, 0); // 8 AM

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(18, 0, 0, 0); // 6 PM

        const bookingStart = new Date(dayStart);
        bookingStart.setHours(9, 0, 0, 0); // 9 AM

        const bookingEnd = new Date(dayStart);
        bookingEnd.setHours(17, 0, 0, 0); // 5 PM

        allDays.push({
          fields: {
            Name: `Day ${dayIndex + 1}`,
            Start: dayStart.toISOString(),
            End: dayEnd.toISOString(),
            "Start bookings": bookingStart.toISOString(),
            "End bookings": bookingEnd.toISOString(),
            Event: [event.id],
          },
        });
      }
    }

    const days = await base("Days").create(allDays);
    console.log(
      `  ✅ Created ${days.length} days across ${events.length} events`
    );

    // Create test session proposals (only if table exists)
    const hasSessionProposals = await tableExists("SessionProposals");
    if (hasSessionProposals) {
      console.log("  💡 Creating test session proposals...");
      const proposals = generateSessionProposals(events, eventConfigs, guests);

      // Create proposals in batches of 10 (Airtable limit)
      const proposalChunks = [];
      for (let i = 0; i < proposals.length; i += 10) {
        proposalChunks.push(proposals.slice(i, i + 10));
      }

      for (const chunk of proposalChunks) {
        await base("SessionProposals").create(chunk);
      }

      console.log(
        `  ✅ Created ${proposals.length} session proposals across ${events.length} events`
      );
    } else {
      console.log("  ⚠️  SessionProposals table doesn't exist, skipping...");
    }

    // Create test sessions with dynamic times
    console.log("  🎯 Creating test sessions...");
    const sessions: Array<{
      fields: {
        Title: string;
        Description: string;
        Event: string[];
        Location: string[];
        "Start time": string;
        "End time": string;
        Hosts: string[];
      };
    }> = [];

    events.forEach((event, eventIndex) => {
      const config = eventConfigs[eventIndex];
      const startTime = new Date(config.start);
      startTime.setHours(9, 0, 0, 0); // 9 AM on first day

      const endTime = new Date(startTime);
      endTime.setHours(10, 0, 0, 0); // 10 AM

      sessions.push({
        fields: {
          Title: `Opening Keynote - ${config.name}`,
          Description: `Welcome to ${config.name}`,
          Event: [event.id],
          Location: [locations[0].id], // Main Hall
          "Start time": startTime.toISOString(),
          "End time": endTime.toISOString(),
          Hosts: [guests[eventIndex % guests.length].id],
        },
      });
    });

    await base("Sessions").create(sessions);
    console.log(
      `  ✅ Created ${sessions.length} sessions across ${events.length} events`
    );
  } catch (error: any) {
    console.error(`❌ Failed during test data seeding: ${error.message}`);
    throw error;
  }

  console.log("✅ Test data seeded successfully");
}

// Helper function to check if table exists
async function tableExists(tableName: string): Promise<boolean> {
  try {
    await base(tableName).select({ maxRecords: 1 }).firstPage();
    return true;
  } catch (error: any) {
    if (
      error.message?.includes("not authorized") ||
      error.message?.includes("TABLE_NOT_FOUND")
    ) {
      return false;
    }
    throw error;
  }
}

async function resetDatabase() {
  try {
    console.log("🔄 Resetting test database to known state...");
    console.log(`📍 Base ID: ${baseId}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

    // Clear all tables
    for (const tableName of allTables) {
      await clearTable(tableName);
    }

    // Seed fresh test data
    await seedTestData();

    console.log("🎉 Database reset completed successfully!");
  } catch (error: any) {
    console.error("❌ Database reset failed:", error.message);

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase();
}

export { resetDatabase, clearTable, seedTestData };
