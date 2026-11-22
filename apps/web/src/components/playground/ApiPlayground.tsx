import { localize, renderSample, resolveParams, sampleRequest, type Locale } from "@thai-open-api/schema";
import { Check, Copy, Eraser, LoaderCircle, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SITE, STORAGE, storageKey } from "../../config/site.ts";
import { createT } from "../../i18n/index.ts";
import { callPlayground, initialValues, type PlaygroundApi } from "../../lib/playground.ts";
import { Button } from "../ui/Button.tsx";
import { Dialog } from "../ui/Dialog.tsx";
import { Field, Input, Select } from "../ui/Field.tsx";
import { cx } from "../ui/cx.ts";
import { useCopy } from "../ui/useCopy.ts";
import { ResponseViewer, type ViewState } from "./ResponseViewer.tsx";

const store = (kind: "local" | "session"): Storage | null => {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};
const read = (kind: "local" | "session", key: string) => {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const write = (kind: "local" | "session", key: string, value: string | null) => {
  try {
    if (value === null) store(kind)?.removeItem(key);
    else store(kind)?.setItem(key, value);
  } catch {
    /* storage blocked: the key simply is not remembered */
  }
};

export function ApiPlayground({ api, locale }: { api: PlaygroundApi; locale: Locale }) {
  const t = createT(locale);
  const keyed = api.auth.type === "apiKey";
  const unavailable = SITE.playgroundUrl === "";
  const keyStore = storageKey(STORAGE.playgroundKey, api.id);

  const [endpointId, setEndpointId] = useState(api.endpoints[0].id);
  const [valuesById, setValuesById] = useState<Record<string, Record<string, string>>>(() => Object.fromEntries(api.endpoints.map((e) => [e.id, initialValues(e)])));
  const [authValue, setAuthValue] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [tab, setTab] = useState<"request" | "response">("request");
  const [view, setView] = useState<ViewState>({ phase: "idle" });
  const { copied, copy } = useCopy();
  const consent = useRef(false);

  const endpoint = api.endpoints.find((e) => e.id === endpointId) ?? api.endpoints[0];
  const values = valuesById[endpoint.id];

  useEffect(() => {
    const remembered = read("local", STORAGE.playgroundRemember) === "true";
    setRemember(remembered);
    setAuthValue(read(remembered ? "local" : "session", keyStore) ?? "");
    consent.current = read("session", STORAGE.playgroundConsent) === "1";
  }, [keyStore]);

  const persistKey = (value: string, keep: boolean) => {
    write("local", keyStore, keep && value ? value : null);
    write("session", keyStore, !keep && value ? value : null);
  };

  const validation = useMemo(() => resolveParams(endpoint.params, values), [endpoint, values]);
  const fieldError = (name: string) => (submitted && !validation.ok && validation.name === name ? validation.message : undefined);
  const request = useMemo(() => sampleRequest(api, endpoint, values), [api, endpoint, values]);
  const curl = request ? renderSample("curl", request) : null;

  const run = async () => {
    setView({ phase: "loading" });
    setTab("response");
    const params = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ""));
    const result = await callPlayground({ apiId: api.id, endpointId: endpoint.id, params, authValue: keyed ? authValue : undefined });
    setView({ phase: "done", result });
  };

  const send = () => {
    setSubmitted(true);
    if (!validation.ok || (keyed && !authValue)) return;
    if (keyed && !consent.current) return setConfirming(true);
    void run();
  };

  const confirm = () => {
    consent.current = true;
    write("session", STORAGE.playgroundConsent, "1");
    setConfirming(false);
    void run();
  };

  const setValue = (name: string, value: string) => setValuesById((all) => ({ ...all, [endpoint.id]: { ...all[endpoint.id], [name]: value } }));
  const busy = view.phase === "loading";

  return (
    <section aria-labelledby="playground-title" className="rounded-lg border border-line bg-surface shadow-card">
      <header className="flex flex-col gap-3 border-b border-line p-4">
        <h2 id="playground-title" className="text-h4 font-semibold">{t("playground.title")}</h2>
        {api.endpoints.length > 1 && (
          <Field label={t("playground.endpoint")} htmlFor="pg-endpoint">
            <Select id="pg-endpoint" value={endpoint.id} onChange={(e) => { setEndpointId(e.target.value); setSubmitted(false); setView({ phase: "idle" }); }}>
              {api.endpoints.map((e) => <option key={e.id} value={e.id}>{localize(e.title, locale)}</option>)}
            </Select>
          </Field>
        )}
        <div role="tablist" aria-label={t("playground.mobileTabs")} className="flex gap-1 md:hidden">
          {(["request", "response"] as const).map((name) => (
            <button key={name} role="tab" type="button" aria-selected={tab === name} aria-controls={`pg-${name}-panel`} tabIndex={tab === name ? 0 : -1} onClick={() => setTab(name)} className={cx("h-10 flex-1 rounded-md text-small font-medium", tab === name ? "bg-brand-100 text-brand-800" : "text-ink-2")}>
              {t(`playground.${name}`)}
            </button>
          ))}
        </div>
      </header>

      <div id="pg-request-panel" role="tabpanel" className={cx("flex flex-col gap-4 p-4", tab === "request" ? "flex" : "hidden md:flex")}>
        <p className="flex items-center gap-2 rounded-md bg-subtle px-3 py-2 font-mono text-code">
          <span className="rounded bg-brand-100 px-1.5 text-caption font-medium text-brand-800">{endpoint.method}</span>
          <span className="break-all">{endpoint.path}</span>
        </p>

        {endpoint.params.length > 0 && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-small font-semibold">{t("playground.params")}</legend>
            {endpoint.params.map((param) => {
              const id = `pg-${endpoint.id}-${param.name}`;
              return (
                <Field key={param.name} htmlFor={id} label={`${param.name}${param.required ? " *" : ""}`} hint={localize(param.description, locale)} error={fieldError(param.name)}>
                  {param.enum ? (
                    <Select id={id} value={values[param.name] ?? ""} onChange={(e) => setValue(param.name, e.target.value)} aria-invalid={Boolean(fieldError(param.name))}>
                      {!param.required && <option value="" />}
                      {param.enum.map((v) => <option key={v} value={v}>{v}</option>)}
                    </Select>
                  ) : (
                    <Input id={id} value={values[param.name] ?? ""} onChange={(e) => setValue(param.name, e.target.value)} placeholder={param.default ?? ""} aria-invalid={Boolean(fieldError(param.name))} autoComplete="off" spellCheck={false} />
                  )}
                </Field>
              );
            })}
          </fieldset>
        )}

        {keyed && (
          <fieldset className="flex flex-col gap-3">
            <Field label={t("playground.keyLabel")} htmlFor="pg-key" hint={t("playground.keyHint")} error={submitted && !authValue ? t("playground.keyRequired") : undefined}>
              <Input id="pg-key" type="password" value={authValue} autoComplete="off" spellCheck={false} onChange={(e) => { setAuthValue(e.target.value); persistKey(e.target.value, remember); }} />
            </Field>
            <label className="flex items-start gap-2 text-small">
              <input type="checkbox" className="mt-1 size-4" checked={remember} onChange={(e) => { setRemember(e.target.checked); write("local", STORAGE.playgroundRemember, e.target.checked ? "true" : null); persistKey(authValue, e.target.checked); }} />
              <span>
                {t("playground.remember")}
                <span className="block text-caption text-ink-2">{t("playground.rememberHint")}</span>
              </span>
            </label>
            {/* Always rendered (disabled when empty) so typing a key never shifts the buttons below it. */}
            <Button variant="ghost" className="self-start" disabled={!authValue} icon={<Eraser aria-hidden size={14} />} onClick={() => { setAuthValue(""); persistKey("", remember); }}>
              {t("playground.forget")}
            </Button>
          </fieldset>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={send} disabled={busy || unavailable} icon={busy ? <LoaderCircle aria-hidden size={16} className="anim-spin" /> : <Play aria-hidden size={16} />}>
            {busy ? t("playground.sending") : t("playground.send")}
          </Button>
          {endpoint.params.length > 0 && (
            <Button variant="secondary" onClick={() => { setValuesById((all) => ({ ...all, [endpoint.id]: initialValues(endpoint) })); setSubmitted(false); }}>
              {t("playground.tryExample")}
            </Button>
          )}
          <Button variant="secondary" disabled={!curl} onClick={() => curl && copy(curl)} icon={copied ? <Check aria-hidden size={14} /> : <Copy aria-hidden size={14} />}>
            <span aria-live="polite">{copied ? t("playground.copied") : t("playground.copyCurl")}</span>
          </Button>
        </div>
      </div>

      <div id="pg-response-panel" role="tabpanel" className={cx("border-t border-line p-4", tab === "response" ? "block" : "hidden md:block")}>
        <h3 className="mb-3 text-small font-semibold">{t("playground.response")}</h3>
        <ResponseViewer state={view} locale={locale} unavailable={unavailable} />
      </div>

      <Dialog open={confirming} onClose={() => setConfirming(false)} title={t("playground.confirmTitle")} labelledBy="pg-confirm-title">
        <p className="text-small text-ink-2">{t("playground.confirmBody", { provider: localize(api.providerName, locale) })}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirming(false)}>{t("playground.cancel")}</Button>
          <Button onClick={confirm}>{t("playground.confirmSend")}</Button>
        </div>
      </Dialog>
    </section>
  );
}
