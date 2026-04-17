export type Day = {
  id: string;
  start: Date;
  end: Date;
  startBookings: Date;
  endBookings: Date;
  eventId?: string;
};

export interface DaysRepository {
  list(): Promise<Day[]>;
  listByEvent(eventId: string): Promise<Day[]>;
  findById(id: string): Promise<Day | undefined>;
  create(data: Omit<Day, "id">): Promise<Day>;
}
