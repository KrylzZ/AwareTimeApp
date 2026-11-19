import { showAuthToast } from "./authToast";

afterEach(() => {
  jest.useRealTimers();
});

test("replaces the previous toast and dismisses the auth toast after its timeout", () => {
  jest.useFakeTimers();
  const toast = {
    dismiss: jest.fn(),
    success: jest.fn(() => "auth-toast"),
  };

  showAuthToast(toast, "Logged out successfully");

  expect(toast.dismiss).toHaveBeenCalledTimes(1);
  expect(toast.success).toHaveBeenCalledWith("Logged out successfully", {
    autoClose: false,
  });

  jest.advanceTimersByTime(1799);
  expect(toast.dismiss).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(1);
  expect(toast.dismiss).toHaveBeenCalledWith("auth-toast");
});
