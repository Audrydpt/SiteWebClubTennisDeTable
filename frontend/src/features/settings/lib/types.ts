import { z } from 'zod';

// Définition des schémas Zod
// Structure commune de base
// Change the baseForensicSchema definition
const baseVMSSchema = z.object({
  // Change this to use a min validation instead of nonempty
  type: z.string(z.enum(['Genetec', 'Milestone'])),
  ip: z.string().ip(),
  port: z.number().int().min(1).max(65535),
});

// Schéma pour Milestone
export const milestoneVMSSchema = baseVMSSchema.extend({
  type: z.literal('Milestone'),
  username: z.string().min(1),
  password: z.string().min(1),
});

// Schéma pour Genetec
export const genetecVMSSchema = baseVMSSchema.extend({
  type: z.literal('Genetec'),
});

// Union des schémas pour la validation
export const vmsSchema = z.discriminatedUnion('type', [
  milestoneVMSSchema,
  genetecVMSSchema,
]);

// Types inférés à partir des schémas
export type MilestoneVMSFormValues = z.infer<typeof milestoneVMSSchema>;
export type GenetecVMSFormValues = z.infer<typeof genetecVMSSchema>;
export type VMSFormValues = z.infer<typeof vmsSchema>;

export const aiSchema = z.object({
  ip: z.string().min(7).ip(),
  port: z.number().int().min(1).max(65535),
  object: z.string().min(1),
  vehicle: z.string().min(1),
  person: z.string().min(1),
});

export type AISettings = z.infer<typeof aiSchema>;
