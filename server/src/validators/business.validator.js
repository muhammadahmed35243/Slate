import { z } from 'zod';

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM (24h)');
const range = z.tuple([time, time]).refine(([a, b]) => a < b, 'Opening time must be before closing time');
const day = z.array(range).max(4);

// {"mon":[["09:00","13:00"],["14:00","18:00"]], "sun":[]}. Missing day = closed.
export const hoursSchema = z
  .object({ mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day })
  .partial()
  .strict();

const fields = {
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().max(60).nullable(),
  website_url: z.string().url().nullable(),
  address: z.string().trim().max(300).nullable(),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  phone: z.string().trim().max(30).nullable(),
  hours: hoursSchema,
  timezone: z.string().trim().min(1).max(60),
};

export const createBusinessSchema = z
  .object(fields)
  .partial()
  .required({ name: true })
  .strict();

export const updateBusinessSchema = z
  .object(fields)
  .partial()
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

export const businessIdParams = z.object({ businessId: z.string().uuid('Invalid business id') });
