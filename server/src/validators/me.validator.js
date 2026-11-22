import { z } from 'zod';

export const updateMeSchema = z
  .object({
    full_name: z.string().trim().min(1).max(100).optional(),
    avatar_url: z.string().url().nullable().optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });
