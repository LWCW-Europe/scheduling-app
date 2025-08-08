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
      name: "Conference Alpha 2025",
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
      name: "Conference Beta 2025",
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
      name: "Conference Gamma 2025",
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
      const proposals: Array<{
        fields: {
          title: string;
          description: string;
          event: string[];
          hosts: string[];
        };
      }> = [];

      events.forEach((event, eventIndex) => {
        proposals.push({
          fields: {
            title: `Proposal ${eventIndex + 1}-A`,
            description: `A test session proposal for ${eventConfigs[eventIndex].name}`,
            event: [event.id],
            hosts: [guests[eventIndex % guests.length].id],
          },
        });
        proposals.push({
          fields: {
            title: `Proposal ${eventIndex + 1}-B`,
            description: `Another test session proposal for ${eventConfigs[eventIndex].name}`,
            event: [event.id],
            hosts: [guests[(eventIndex + 1) % guests.length].id],
          },
        });
      });

      await base("SessionProposals").create(proposals);
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
