import dayjs, { type Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";
import updateLocale from "dayjs/plugin/updateLocale";
import advancedFormat from "dayjs/plugin/advancedFormat";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import localizedFormat from "dayjs/plugin/localizedFormat";
import isoWeek from "dayjs/plugin/isoWeek";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
import "dayjs/locale/en";

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);
dayjs.extend(advancedFormat);
dayjs.extend(quarterOfYear);
dayjs.extend(localizedFormat);
dayjs.extend(isoWeek);
dayjs.extend(utc);
dayjs.extend(duration);

type TDate = string | number | Date | Dayjs;

export { dayjs, type TDate };
