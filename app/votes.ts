export { VoteChoice } from "@/db/repositories/interfaces";
export type { Vote } from "@/db/repositories/interfaces";

import { VoteChoice } from "@/db/repositories/interfaces";

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
