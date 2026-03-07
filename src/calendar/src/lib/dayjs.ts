import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";

dayjs.extend(weekday);

export { dayjs };

export type { Dayjs };
