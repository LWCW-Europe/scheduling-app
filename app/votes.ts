export enum VoteChoice {
  interested = "interested",
  maybe = "maybe",
  skip = "skip",
}

export type Vote = {
  proposal: string;
  guest: string;
  choice: VoteChoice;
};
