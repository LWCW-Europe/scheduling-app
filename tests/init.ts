import Airtable from 'airtable';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Read from ".env" file.
dotenv.config({ path: path.resolve(__dirname, '.env') });

const apiKey = process.env.AIRTABLE_API_KEY!;
const baseId = process.env.AIRTABLE_BASE_ID!;

if (!apiKey || !baseId) {
  throw new Error('Missing Airtable config: check AIRTABLE_API_KEY and AIRTABLE_BASE_ID');
}

const base = new Airtable({ apiKey }).base(baseId);

const allTables = ['Events', 'Sessions', 'Guests', 'Locations', 'Days', 'RSVPs']

// Example schema setup: "Users" and "Projects" tables
async function clearTable(tableName: string) {
  const records = await base(tableName).select().all();
  const deleteChunks = [];
  for (let i = 0; i < records.length; i += 10) {
    deleteChunks.push(records.slice(i, i + 10));
  }

  for (const chunk of deleteChunks) {
    await base(tableName).destroy(chunk.map(r => r.id));
  }
}

async function seedGuests() {
  return await base('Guests').create([
    { fields: { Name: 'Alice Test', Email: 'alice@test.com' } },
    { fields: { Name: 'Bob Test', Email: 'bob@test.com' } }
  ]);
}

async function seedEvents() {
  return await base('Events').create([
    { fields: { 
        Name: 'Test Conference',
        Description: "Test Conference",
        Website: "http://example.com",
        Start: "2024-01-01",
        End: "2024-01-02",
     } },
  ]);
}

async function seedSessions(eventId: string, locationIds: string[]) {
  return await base('Sessions').create([
    { fields: { 
        Title: 'Session 1 AliceIsGoing',
        "Start time": "2024-01-01T09:00",
        "End time": "2024-01-01T10:00",
        Location: [locationIds[0]],
        Event: [eventId],
    } },
    { fields: { 
        Title: 'Session 2 AliceIsNotGoing', 
        "Start time": "2024-01-01T10:00",
        "End time": "2024-01-01T11:00",
        Location: [locationIds[1]],
        Event: [eventId],
    } }
  ]);
}

async function seedLocations() {
  return await base('Locations').create([
    { fields: { 
        Name: 'Test Room 1',
        Bookable: true,
    } },
    { fields: { 
        Name: 'Test Room 2' 
    } }
  ]);
}

async function seedRSVPs(guestIDs: string[], sessionIDs: string[]) {
  return await base('RSVPs').create([
    { fields: { Session: [sessionIDs[0]], Guest: [guestIDs[0]] } },
    { fields: { Session: [sessionIDs[1]], Guest: [guestIDs[1]] } }
  ]);
}

async function seedDays() {
  return await base('Days').create([
    { fields: { 
        Name: 'Test Day 1',
        Start: '2024-01-01T08:30',
        End: '2024-01-01T18:30',
        "Start bookings": "2024-01-01T09:00",
        "End bookings": "2024-01-01T18:00",
    } },
    { fields: { 
        Name: 'Test Day 2',
        Start: '2024-01-02T08:30',
        End: '2024-01-02T16:00',
        "Start bookings": "2024-01-02T09:00",
        "End bookings": "2024-01-02T12:00",
    } }
  ]);
}


async function initTestData() {
  console.log('Clearing old data...');
  for (const tableName of allTables) {
    console.log(`Clearing table: ${tableName}`);
    await clearTable(tableName);
  }

  console.log('Seeding Events...');
  const eventRecords = await seedEvents();

  console.log('Seeding Days...');
  const dayRecords = await seedDays();

  console.log('Seeding Locations...');
  const locationRecords = await seedLocations();

  console.log('Seeding Guests...');
  const guestRecords = await seedGuests();

  console.log('Seeding Sessions...');
  const sessionRecords = await seedSessions(eventRecords[0].id, locationRecords.map(l => l.id));

  console.log('Seeding RSVPs...');
  const rsvpRecords = await seedRSVPs(guestRecords.map(u => u.id), sessionRecords.map(s => s.id));

  console.log('Test data initialized.');
  return {
    events: eventRecords,
    days: dayRecords,
    locations: locationRecords,
    guests: guestRecords,
    sessions: sessionRecords,
    rsvps: rsvpRecords,
  }
}

async function globalSetup() {
  console.log('📦 Seeding test database...');
  const testData = await initTestData();
  console.log('✅ Test DB ready.');
  await fs.writeFile(path.resolve(__dirname, 'test-data.json'), JSON.stringify(testData, null, 2));
}

export default globalSetup;