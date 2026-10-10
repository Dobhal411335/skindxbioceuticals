import { getAuthErrorMessage, resolveAuthMessage } from "@/features/auth/auth-errors";

describe("auth error messages", () => {
  it("keeps a specific backend conflict message", () => {
    expect(
      getAuthErrorMessage({
        message:
          "An account with this email already exists. Sign in with your password, then link Google from account settings.",
        statusCode: 409,
        code: null,
        details: null,
      }),
    ).toMatch(/sign in with your password/i);
  });

  it("maps generic 409 responses to a friendly message", () => {
    expect(
      resolveAuthMessage({
        message: "Conflict",
        statusCode: 409,
        code: null,
        details: null,
      }),
    ).toMatch(/account with this email already exists/i);
  });

  it("maps rate-limit responses", () => {
    expect(
      resolveAuthMessage({
        message: "Too Many Requests",
        statusCode: 429,
        code: null,
        details: null,
      }),
    ).toMatch(/too many attempts/i);
  });
});
