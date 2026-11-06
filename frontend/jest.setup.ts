import "@testing-library/jest-dom";

process.env.NEXT_PUBLIC_SITE_CODE = "COM";
process.env.SITE_FETCH_SECRET = "test-site-fetch-secret-min-32-chars!";
process.env.NEXT_PUBLIC_API_URL = "http://localhost:5000/api/v1";
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID =
  "test-google-client-id.apps.googleusercontent.com";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});
