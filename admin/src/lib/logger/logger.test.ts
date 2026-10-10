import { createLoggerConfig, shouldLog } from "./logger.config";
import { createFrontendLogger, redactValue, REDACTED, sanitizeUrl } from "./index";

describe("admin logger", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("suppresses debug in production", () => {
    const config = createLoggerConfig("test", "production");
    expect(shouldLog(config, "debug")).toBe(false);
    expect(shouldLog(config, "warn")).toBe(true);

    const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    const log = createFrontendLogger("test", "production");
    log.debug("hidden");
    log.warn("visible");
    expect(debugSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("redacts secrets and sanitizes URLs", () => {
    expect((redactValue({ refreshToken: "r" }) as { refreshToken: string }).refreshToken).toBe(
      REDACTED,
    );
    expect(decodeURIComponent(sanitizeUrl("/x?token=abc"))).toContain(REDACTED);
  });
});
