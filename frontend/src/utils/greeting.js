/**
 * Returns the appropriate i18n key for the current time of day:
 * 'good_morning' (before 12:00)
 * 'good_afternoon' (12:00 - 17:00)
 * 'good_evening' (after 17:00)
 */
export const getTimeAwareGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'good_morning';
  if (hour < 17) return 'good_afternoon';
  return 'good_evening';
};

export default getTimeAwareGreetingKey;
