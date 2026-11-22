import { LOCALES, type Locale } from "@thai-open-api/schema";
import type { APIRoute, GetStaticPaths } from "astro";
import { getSummaries } from "../../lib/catalog.ts";

export const getStaticPaths: GetStaticPaths = () => LOCALES.map((lang) => ({ params: { lang } }));

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(getSummaries(params.lang as Locale)), { headers: { "content-type": "application/json" } });
