import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import {
  attachRequestMetadata,
  isCanceledError,
  logAxiosFailure,
  logAxiosSuccess,
  REQUEST_ID_HEADER,
  type LoggedAxiosConfig,
} from "@/services/api/axios-logging";
import * as loggerModule from "@/lib/logger";

describe("admin axios logging helpers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("attaches correlation id", () => {
    const config = {
      headers: {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      },
      url: "/auth/me",
    } as unknown as InternalAxiosRequestConfig;

    const next = attachRequestMetadata(config);
    expect(next.metadata?.requestId).toBeTruthy();
    expect((config.headers.set as jest.Mock).mock.calls[0]?.[0]).toBe(REQUEST_ID_HEADER);
  });

  it("logs failures with status and skips cancelled as errors", () => {
    const warnSpy = jest.spyOn(loggerModule.logger, "warn").mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(loggerModule.logger, "error").mockImplementation(() => undefined);
    const debugSpy = jest.spyOn(loggerModule.logger, "debug").mockImplementation(() => undefined);

    const cancelled = new AxiosError("canceled");
    cancelled.code = "ERR_CANCELED";
    cancelled.name = "CanceledError";
    expect(isCanceledError(cancelled)).toBe(true);
    logAxiosFailure(cancelled);
    expect(debugSpy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    const clientError = new AxiosError("nope");
    clientError.response = {
      status: 403,
      data: {},
      headers: { "x-request-id": "admin-req-1" },
      config: {} as InternalAxiosRequestConfig,
      statusText: "",
    } as AxiosResponse;
    clientError.config = {
      method: "post",
      url: "/admin/x",
      metadata: { startTime: Date.now(), requestId: "admin-req-1" },
    } as LoggedAxiosConfig;
    logAxiosFailure(clientError);
    expect(warnSpy).toHaveBeenCalled();
  });

  it("logs success without dumping response bodies", () => {
    const debugSpy = jest.spyOn(loggerModule.logger, "debug").mockImplementation(() => undefined);
    logAxiosSuccess({
      status: 200,
      data: { accessToken: "secret" },
      headers: {},
      config: {
        method: "get",
        url: "/dashboard",
        metadata: { startTime: Date.now(), requestId: "r1" },
      } as LoggedAxiosConfig,
      statusText: "OK",
    } as AxiosResponse);
    expect(JSON.stringify(debugSpy.mock.calls)).not.toContain("secret");
  });
});
