import { z } from "zod";
import {
  AUTH_LOCATIONS,
  CATEGORIES,
  JSON_VALUE_TYPES,
  LICENSE_TYPES,
  LIMITS,
  PARAM_LOCATIONS,
  PARAM_TYPES,
  RESPONSE_FORMATS,
  SOURCES,
} from "./constants.ts";
import { LocalizedText } from "./locale.ts";
import { resolveParams } from "./params.ts";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "use lower-case kebab-case").max(64);
const isoDate = z.iso.date();
const httpUrl = z.url({ protocol: /^https?$/ });

export const ParamSchema = z.strictObject({
  name: z.string().regex(/^[A-Za-z_][A-Za-z0-9_.-]*$/).max(64),
  in: z.enum(PARAM_LOCATIONS),
  type: z.enum(PARAM_TYPES).default("string"),
  required: z.boolean().default(false),
  description: LocalizedText,
  enum: z.array(z.string()).min(1).optional(),
  pattern: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  default: z.string().optional(),
});
export type Param = z.infer<typeof ParamSchema>;

const HealthCheckSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("json"),
    path: z.string().min(1),
    type: z.enum(JSON_VALUE_TYPES),
    minItems: z.number().int().min(1).optional(),
    optional: z.boolean().default(false),
  }),
  z.strictObject({
    kind: z.literal("text"),
    contains: z.string().min(1),
    optional: z.boolean().default(false),
  }),
]);
export type HealthCheck = z.infer<typeof HealthCheckSchema>;

export const EndpointSchema = z.strictObject({
  id: slug,
  method: z.literal("GET").default("GET"),
  path: z.string().regex(/^\/[^\s?#]*$/, "must start with / and contain no query string"),
  title: LocalizedText,
  description: LocalizedText,
  params: z.array(ParamSchema).default([]),
  response: z
    .strictObject({
      format: z.enum(RESPONSE_FORMATS).default("json"),
      sample: z.string().max(4_000).optional(),
    })
    .default({ format: "json" }),
  /** Values used by "Try it", the code samples and the health check. */
  example: z.record(z.string(), z.string()).default({}),
  playground: z.boolean().default(true),
  health: z
    .strictObject({
      checks: z.array(HealthCheckSchema).default([]),
      slowMs: z.number().int().positive().optional(),
    })
    .default({ checks: [] }),
});
export type Endpoint = z.infer<typeof EndpointSchema>;

const AuthSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("none") }),
  z.strictObject({
    type: z.literal("apiKey"),
    in: z.enum(AUTH_LOCATIONS),
    name: z.string().regex(/^[A-Za-z][A-Za-z0-9_-]*$/),
    signupUrl: httpUrl,
  }),
]);
export type Auth = z.infer<typeof AuthSchema>;

const LicenseSchema = z.strictObject({
  type: z.enum(LICENSE_TYPES),
  name: LocalizedText.optional(),
  url: httpUrl.optional(),
  /** true only after a human read the licence / terms of use. */
  verified: z.boolean().default(false),
});

const IP_LITERAL = /^(\d{1,3}\.){3}\d{1,3}$|^\[.*\]$/;

export const ApiEntrySchema = z
  .strictObject({
    id: slug,
    name: LocalizedText,
    provider: z.strictObject({ name: LocalizedText, url: httpUrl }),
    description: LocalizedText,
    category: z.enum(CATEGORIES),
    source: z.enum(SOURCES),
    auth: AuthSchema.default({ type: "none" }),
    baseUrl: httpUrl,
    /** Only for plain-http upstreams; https is required otherwise. */
    allowInsecure: z.boolean().default(false),
    /** Extra hosts a redirect may legitimately land on. */
    redirectHosts: z.array(z.string()).default([]),
    docsUrl: httpUrl.optional(),
    license: LicenseSchema,
    rateLimit: LocalizedText.optional(),
    tags: z.array(z.string().min(1)).default([]),
    featured: z.boolean().default(false),
    /** Date a human last checked docs, licence and endpoints. */
    reviewedAt: isoDate,
    maxResponseBytes: z
      .number()
      .int()
      .positive()
      .max(LIMITS.hardMaxResponseBytes)
      .default(LIMITS.defaultMaxResponseBytes),
    endpoints: z.array(EndpointSchema).min(1),
    changelog: z.array(z.strictObject({ date: isoDate, note: LocalizedText })).default([]),
  })
  .superRefine((api, ctx) => {
    const issue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: "custom", message, path });

    const base = new URL(api.baseUrl);
    if (base.protocol === "http:" && !api.allowInsecure) issue("http base URL requires allowInsecure: true", ["baseUrl"]);
    if (IP_LITERAL.test(base.hostname) || base.hostname === "localhost") issue("base URL must use a public hostname", ["baseUrl"]);
    if (base.username || base.password || base.search || base.hash) issue("base URL must not carry credentials, query or fragment", ["baseUrl"]);

    const seen = new Set<string>();
    api.endpoints.forEach((endpoint, i) => {
      const at = (...rest: (string | number)[]) => ["endpoints", i, ...rest];
      if (seen.has(endpoint.id)) issue(`duplicate endpoint id "${endpoint.id}"`, at("id"));
      seen.add(endpoint.id);

      const inPath = [...endpoint.path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
      const declared = endpoint.params.filter((p) => p.in === "path").map((p) => p.name);
      for (const name of inPath) if (!declared.includes(name)) issue(`path placeholder {${name}} has no matching path param`, at("path"));
      for (const name of declared) {
        if (!inPath.includes(name)) issue(`path param "${name}" is not used in the path`, at("params"));
      }
      for (const param of endpoint.params) {
        if (param.in === "path" && !param.required) issue(`path param "${param.name}" must be required`, at("params"));
      }

      const resolved = resolveParams(endpoint.params, endpoint.example);
      if (!resolved.ok) issue(`example is invalid: ${resolved.name} ${resolved.message}`, at("example"));
    });
  });

export type ApiEntry = z.infer<typeof ApiEntrySchema>;
