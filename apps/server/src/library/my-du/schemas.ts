import { z } from "zod";

const responseError = "Unexpected My DU response.";

export const credentialsSchema = z.object({
  access_token: z
    .string()
    .min(1)
    .regex(/^[^\r\n;]+$/),
  refresh_token: z
    .string()
    .min(1)
    .regex(/^[^\r\n;]+$/),
});

export type MyDuCredentials = z.infer<typeof credentialsSchema>;

const classTimeSchema = z.object({
  id: z.number().int().safe(),
  title: z.string(),
});

const lessonSchema = z.object({
  uid: z.number().int().safe(),
  classTime: classTimeSchema,
  subjectName: z.string(),
  lessonType: z.string(),
  online: z.boolean(),
  classroom: z.string().nullish(),
  building: z.string().nullish(),
  teacherName: z.string().nullish(),
  replacementTeacherName: z.string().nullish(),
});

// My DU fills every free period of the weekly grid with an item whose fields are all null.
const emptySlotSchema = z.object({ uid: z.null() });

export const scheduleWeekSchema = z.object({
  studyYear: z.number().int().safe(),
  term: z.number().int().safe(),
  weekNumber: z.number().int().safe(),
  slots: z.array(
    z.object({
      weekDay: z.object({ id: z.number().int().min(1).max(7) }),
      items: z.array(z.union([lessonSchema, emptySlotSchema])),
    }),
  ),
});

export const termLengthSchema = z.object({
  value: z.coerce.number().int().min(1).max(30),
});

export function parseMyDuResponse<T>(schema: z.ZodType<T>, value: z.input<typeof schema>): T {
  const result = schema.safeParse(value);

  // Keep the Zod issues as the cause so sync logs show which field My DU changed.
  if (!result.success) throw new Error(responseError, { cause: result.error });

  return result.data;
}
