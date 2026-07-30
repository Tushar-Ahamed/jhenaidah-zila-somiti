export function isApprovalRequired(): boolean {
  try {
    const val = localStorage.getItem('jhenaidah_setting_approval_required');
    if (val !== null) {
      return val === 'true';
    }
  } catch {
    // ignore
  }
  return true; // Default: Approval mode ON for high security
}

export function setApprovalRequired(required: boolean): void {
  try {
    localStorage.setItem('jhenaidah_setting_approval_required', String(required));
  } catch {
    // ignore
  }
}
