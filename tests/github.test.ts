import { describe, it, expect } from "vitest";
import { parseGitHubUrl } from "../lib/github";

describe("parseGitHubUrl", () => {
  it("parses standard HTTPS GitHub repository URLs", () => {
    expect(parseGitHubUrl("https://github.com/TwilitRealm/dusk")).toEqual({
      owner: "TwilitRealm",
      repo: "dusk",
    });
  });

  it("parses URLs with .git suffix", () => {
    expect(parseGitHubUrl("https://github.com/TwilitRealm/dusk.git")).toEqual({
      owner: "TwilitRealm",
      repo: "dusk",
    });
  });

  it("parses URLs with trailing slashes", () => {
    expect(parseGitHubUrl("https://github.com/TwilitRealm/dusk/")).toEqual({
      owner: "TwilitRealm",
      repo: "dusk",
    });
  });

  it("parses URLs with branch or tree paths", () => {
    expect(
      parseGitHubUrl("https://github.com/TwilitRealm/dusk/tree/main")
    ).toEqual({
      owner: "TwilitRealm",
      repo: "dusk",
    });
  });

  it("parses URLs without protocol or with www", () => {
    expect(parseGitHubUrl("github.com/TwilitRealm/dusk")).toEqual({
      owner: "TwilitRealm",
      repo: "dusk",
    });
    expect(parseGitHubUrl("https://www.github.com/TwilitRealm/dusk")).toEqual({
      owner: "TwilitRealm",
      repo: "dusk",
    });
  });

  it("returns null for non-GitHub or invalid URLs", () => {
    expect(parseGitHubUrl("https://gitlab.com/owner/repo")).toBeNull();
    expect(parseGitHubUrl("https://bitbucket.org/owner/repo")).toBeNull();
    expect(parseGitHubUrl("not-a-url")).toBeNull();
    expect(parseGitHubUrl("")).toBeNull();
    // @ts-expect-error test invalid types
    expect(parseGitHubUrl(undefined)).toBeNull();
  });
});
