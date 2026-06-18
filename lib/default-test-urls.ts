/** Default Fillout form used for testing when admin has not configured URLs yet. */
export const DEFAULT_TEST_FORM_URL = "https://testpersona.fillout.com/t/dvkVLQihgGus";

export function resolveTestUrl(configuredUrl: string) {
  return configuredUrl.trim() || DEFAULT_TEST_FORM_URL;
}
