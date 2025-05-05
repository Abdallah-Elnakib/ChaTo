import dayjs from 'dayjs';
// eslint-disable-next-line import/no-unresolved
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export function fromNow(dateString: string): string {
  return dayjs(dateString).fromNow();
}
