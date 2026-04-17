import { test, expect } from "./fixture";
import { SqliteLocationsRepository } from "../../db/repositories/sqlite/locations";

const base = {
  name: "Main Hall",
  imageUrl: "",
  description: "Big room",
  capacity: 100,
  color: "#ff0000",
  hidden: false,
  bookable: true,
  sortIndex: 1,
};

test("create and find by id", async ({ db }) => {
  const repo = new SqliteLocationsRepository(db);
  const created = await repo.create(base);
  expect(created.id).toBeTruthy();

  const found = await repo.findById(created.id);
  expect(found?.name).toBe("Main Hall");
  expect(found?.capacity).toBe(100);
  expect(found?.bookable).toBe(true);
  expect(found?.areaDescription).toBeUndefined();
});

test("listVisible excludes hidden locations", async ({ db }) => {
  const repo = new SqliteLocationsRepository(db);
  await repo.create({ ...base, name: "Visible", hidden: false });
  await repo.create({ ...base, name: "Hidden", hidden: true });

  const visible = await repo.listVisible();
  expect(visible.map((l) => l.name)).toContain("Visible");
  expect(visible.map((l) => l.name)).not.toContain("Hidden");
});

test("listBookable returns only visible+bookable locations sorted by index", async ({
  db,
}) => {
  const repo = new SqliteLocationsRepository(db);
  await repo.create({ ...base, name: "B", bookable: true, sortIndex: 2 });
  await repo.create({ ...base, name: "A", bookable: true, sortIndex: 1 });
  await repo.create({
    ...base,
    name: "NotBookable",
    bookable: false,
    sortIndex: 0,
  });

  const bookable = await repo.listBookable();
  expect(bookable.map((l) => l.name)).not.toContain("NotBookable");
  expect(bookable[0].name).toBe("A");
  expect(bookable[1].name).toBe("B");
});

test("areaDescription round-trips", async ({ db }) => {
  const repo = new SqliteLocationsRepository(db);
  const created = await repo.create({ ...base, areaDescription: "North wing" });
  const found = await repo.findById(created.id);
  expect(found?.areaDescription).toBe("North wing");
});
