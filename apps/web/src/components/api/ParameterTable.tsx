import { localize, type Locale, type Param } from "@thai-open-api/schema";
import { createT } from "../../i18n/index.ts";

export function ParameterTable({ params, locale }: { params: Param[]; locale: Locale }) {
  const t = createT(locale);
  if (params.length === 0) return <p className="text-small text-ink-2">{t("api.noParams")}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-left text-small">
        <thead>
          <tr className="border-b border-line text-caption text-ink-2">
            <th scope="col" className="py-2 pr-4 font-medium">{t("api.paramName")}</th>
            <th scope="col" className="py-2 pr-4 font-medium">{t("api.paramIn")}</th>
            <th scope="col" className="py-2 pr-4 font-medium">{t("api.paramType")}</th>
            <th scope="col" className="py-2 font-medium">{t("api.paramDescription")}</th>
          </tr>
        </thead>
        <tbody>
          {params.map((param) => (
            <tr key={param.name} className="border-b border-line align-top last:border-0">
              <td className="py-3 pr-4">
                <code className="font-medium">{param.name}</code>
                <div className="text-caption text-ink-2">{param.required ? t("api.required") : t("api.optional")}</div>
              </td>
              <td className="py-3 pr-4 text-ink-2">{param.in}</td>
              <td className="py-3 pr-4 text-ink-2">{param.type}</td>
              <td className="py-3">
                <p>{localize(param.description, locale)}</p>
                {param.default !== undefined && <p className="text-caption text-ink-2">{t("api.defaultValue", { value: param.default })}</p>}
                {param.enum && <p className="text-caption text-ink-2">{param.enum.join(" · ")}</p>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
