import { z } from "zod";
import { HEALTH, HEALTH_REASONS, STATUSES } from "./constants.ts";

const status = z.enum(STATUSES);
const when = z.iso.datetime();

/** Shape of data/status.json. It crosses a trust boundary (the status-data branch), so it is validated. */
export const StatusFileSchema = z.object({
  generatedAt: when,
  apis: z.record(
    z.string().max(64),
    z.object({
      status,
      checkedAt: when,
      latencyMs: z.number().nonnegative().optional(),
      endpoints: z
        .array(
          z.object({
            endpointId: z.string().max(64),
            status,
            reason: z.enum(HEALTH_REASONS),
            checkedAt: when,
            httpStatus: z.number().int().optional(),
            latencyMs: z.number().nonnegative().optional(),
            exampleVerified: z.boolean(),
          }),
        )
        .max(100),
      history: z.array(z.object({ t: when, status, latencyMs: z.number().nonnegative().optional() })).max(HEALTH.historyLength),
    }),
  ),
});
