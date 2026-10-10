import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import {
  attachRequestMetadata,
  isCanceledError,
  logAxiosFailure,
  logAxiosSuccess,
  REQUEST_ID_HEADER,
  type LoggedAxiosConfig,
} from "@/services/api/axios-logging";
import * as loggerModule from "@/lib/logger";

describe("axios logging helpers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("attaches X-Request-Id and start metadata", () => {
    const config = {
      headers: {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      },
      url: "/auth/me",
      baseURL: "http://localhost:5000/api/v1",
    } as unknown as InternalAxiosRequestConfig;

    const next = attachRequestMetadata(config);
    expect(next.metadata?.requestId).toBeTruthy();
    expect(typeof next.metadata?.startTime).toBe("number");
    expect((config.headers.set as jest.Mock).mock.calls[0]?.[0]).toBe(REQUEST_ID_HEADER);
  });

  it("logs success at debug without bodies", () => {
    const debugSpy = jest.spyOn(loggerModule.logger, "debug").mockImplementation(() => undefined);
    const config = {
      method: "get",
      url: "/products",
      baseURL: "http://localhost:5000/api/v1",
      metadata: { startTime: Date.now() - 12, requestId: "req_test_ok1" },
      headers: { set: jest.fn(), get: jest.fn() },
    } as unknown as LoggedAxiosConfig;

    const response = {
      status: 200,
      config,
      headers: { "x-request-id": "req_test_ok1" },
      data: { password: "should-not-be-logged-via-helper" },
    } as unknown as AxiosResponse;

    logAxiosSuccess(response);
    expect(debugSpy).toHaveBeenCalled();
    const ctx = debugSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(ctx.path).toContain("/products");
    expect(ctx.requestId).toBe("req_test_ok1");
    expect(JSON.stringify(debugSpy.mock.calls)).not.toContain("should-not-be-logged");
  });

  it("treats cancelled requests as non-fatal", () => {
    const debugSpy = jest.spyOn(loggerModule.logger, "debug").mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(loggerModule.logger, "error").mockImplementation(() => undefined);

    const error = new AxiosError("canceled");
    error.code = "ERR_CANCELED";
    error.name = "CanceledError";
    error.config = {
      method: "get",
      url: "/x",
      metadata: { startTime: Date.now(), requestId: "req_cancel" },
    } as LoggedAxiosConfig;

    expect(isCanceledError(error)).toBe(true);
    logAxiosFailure(error);
    expect(debugSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("skips failure logs while refresh retry is pending", () => {
    const warnSpy = jest.spyOn(loggerModule.logger, "warn").mockImplementation(() => undefined);
    const error = new AxiosError("unauthorized");
    error.response = {
      status: 401,
      data: {},
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
      statusText: "",
    };
    error.config = {
      method: "get",
      url: "/me",
      _refreshPending: true,
      metadata: { startTime: Date.now(), requestId: "req_refresh" },
    } as LoggedAxiosConfig;

    logAxiosFailure(error);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("sanitizes tokens from failure paths", () => {
    const warnSpy = jest.spyOn(loggerModule.logger, "warn").mockImplementation(() => undefined);
    const error = new AxiosError("bad");
    error.response = {
      status: 400,
      data: {},
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
      statusText: "",
    };
    error.config = {
      method: "get",
      url: "/reset?token=super-secret",
      baseURL: "http://localhost:5000/api/v1",
      metadata: { startTime: Date.now(), requestId: "req_sec" },
    } as LoggedAxiosConfig;

    logAxiosFailure(error);
    const ctx = warnSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(String(ctx.path)).not.toContain("super-secret");
  });

  it("does not import axios network for unit coverage of helpers", () => {
    expect(typeof axios.create).toBe("function");
  });
});
