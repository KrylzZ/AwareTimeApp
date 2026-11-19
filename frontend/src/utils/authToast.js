const AUTH_TOAST_DURATION = 1800;

export function showAuthToast(toast, message) {
  toast.dismiss();
  const toastId = toast.success(message, { autoClose: false });
  window.setTimeout(() => toast.dismiss(toastId), AUTH_TOAST_DURATION);
}
