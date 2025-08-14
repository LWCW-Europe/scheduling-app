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

export function voteChoiceToEmoji(choice: VoteChoice): string {
  switch (choice) {
    case VoteChoice.interested:
      return "❤️";
    case VoteChoice.maybe:
      return "⭐";
    case VoteChoice.skip:
      return "👋🏽";
  }
}
