import { describe, it, expect } from "vitest";
import { voteChoiceToEmoji, VoteChoice } from "@/app/votes";

describe("voteChoiceToEmoji", () => {
  it("interested → ❤️", () =>
    expect(voteChoiceToEmoji(VoteChoice.interested)).toBe("❤️"));

  it("maybe → ⭐", () =>
    expect(voteChoiceToEmoji(VoteChoice.maybe)).toBe("⭐"));

  it("skip → 👋🏽", () => expect(voteChoiceToEmoji(VoteChoice.skip)).toBe("👋🏽"));
});
