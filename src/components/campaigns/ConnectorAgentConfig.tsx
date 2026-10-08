import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import Dropdown from "./Dropdown";

/**
 * Connector Agent — shown inside AgentNodeConfig once the Connector agent is
 * picked from the agent list. One structured drawer, not a step-by-step
 * conversation: intent up top, the full API request (method/URL/params/
 * headers/authorization) below it, a "Test API" action, then the discovered
 * response fields to expose to the journey. A mocked "Test API" call (this
 * app has no live backend — every co-marketer interaction here is scripted,
 * see ChatInterface.tsx) stands in for a real one; the fields the user
 * checks become this node's output for later journey steps (e.g. a
 * Condition node's "loyalty_points > 50"). Built entirely from this app's
 * existing input/button/label styles — no new components.
 */

export type ConnectorMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ConnectorKeyValue {
  key: string;
  name: string;
  value: string;
}

/** One field discovered in a "Test API" response. */
export interface ConnectorResponseField {
  name: string;
  type: "Number" | "Text";
  value: string;
}

export interface ConnectorAgentSetting {
  method: ConnectorMethod;
  url: string;
  params: ConnectorKeyValue[];
  headers: ConnectorKeyValue[];
  auth: ConnectorKeyValue[];
  /** Discovered by "Test API" — empty until tested. */
  availableFields: ConnectorResponseField[];
  /** Which discovered fields (by name) this node hands to later journey steps. */
  selectedFields: string[];
}

export function isConnectorConfigured(s: ConnectorAgentSetting | undefined): boolean {
  return !!s && s.selectedFields.length > 0;
}

/** What a real "Test API" call would discover — mocked, shaped after the
 *  loyalty-points example in the Connector Agent's own spec. */
const MOCK_RESPONSE_FIELDS: ConnectorResponseField[] = [
  { name: "loyalty_points", type: "Number", value: "72" },
  { name: "customer_id", type: "Text", value: "12345" },
  { name: "tier", type: "Text", value: "Gold" },
];

let kvSeq = 0;
const newKeyValue = (): ConnectorKeyValue => ({ key: `kv${++kvSeq}`, name: "", value: "" });

function emptyConnectorSetting(): ConnectorAgentSetting {
  return { method: "GET", url: "", params: [], headers: [], auth: [], availableFields: [], selectedFields: [] };
}

type KeyValueList = "params" | "headers" | "auth";

export default function ConnectorAgentConfig({
  initial,
  onCancel,
  onSave,
}: {
  initial?: ConnectorAgentSetting;
  onCancel: () => void;
  /** Called with the sentence to show on the canvas node (the goal, in the
   *  user's own words) and the raw setting, so re-opening pre-fills it. */
  onSave: (nodeLabel: string, setting: ConnectorAgentSetting) => void;
}) {
  const [setting, setSetting] = useState<ConnectorAgentSetting>(initial ?? emptyConnectorSetting());
  const [testState, setTestState] = useState<"idle" | "testing" | "success">(
    setting.availableFields.length > 0 ? "success" : "idle",
  );
  // The moment a test succeeds, the response can be well below the fold
  // (Method/URL/Params/Headers/Auth all sit above it) — scroll it straight
  // into view instead of leaving the user to notice and scroll manually.
  const responseRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (testState === "success") responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [testState]);

  // Any edit to the actual request (method, URL, params, headers, auth)
  // invalidates a prior successful test — its discovered fields came from
  // whatever was configured *then*, which no longer matches. Goal text is
  // exempt: it's just a description, not part of the request that was
  // tested.
  const mutateConfig = (updater: (s: ConnectorAgentSetting) => ConnectorAgentSetting) => {
    const hadTestedFields = setting.availableFields.length > 0;
    setSetting((s) => {
      const next = updater(s);
      return hadTestedFields ? { ...next, availableFields: [], selectedFields: [] } : next;
    });
    if (hadTestedFields) setTestState("idle");
  };

  const addRow = (list: KeyValueList) => mutateConfig((s) => ({ ...s, [list]: [...s[list], newKeyValue()] }));
  const updateRow = (list: KeyValueList, key: string, patch: Partial<ConnectorKeyValue>) =>
    mutateConfig((s) => ({ ...s, [list]: s[list].map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const removeRow = (list: KeyValueList, key: string) =>
    mutateConfig((s) => ({ ...s, [list]: s[list].filter((r) => r.key !== key) }));

  const runTest = () => {
    setTestState("testing");
    window.setTimeout(() => {
      setSetting((s) => ({
        ...s,
        availableFields: MOCK_RESPONSE_FIELDS,
        selectedFields: s.selectedFields.length ? s.selectedFields : [MOCK_RESPONSE_FIELDS[0].name],
      }));
      setTestState("success");
    }, 900);
  };

  const toggleField = (name: string) =>
    setSetting((s) => ({
      ...s,
      selectedFields: s.selectedFields.includes(name)
        ? s.selectedFields.filter((f) => f !== name)
        : [...s.selectedFields, name],
    }));

  const canSave = isConnectorConfigured(setting);
  // The canvas card's task line, now that there's no free-typed intent to
  // show there — the request itself (e.g. "GET /loyalty/points") is a more
  // accurate summary than a generic placeholder would be.
  const handleSave = () => onSave(setting.url.trim() ? `${setting.method} ${setting.url.trim()}` : "Use an external API", setting);

  return (
    <>
      {/* Header */}
      <div className="flex items-start gap-3 px-6 pt-6">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #9449DF 0%, #2F68E5 100%)" }}
        >
          <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2} />
        </span>
        <div className="flex-1">
          <h2 className="font-manrope text-[16px] font-bold leading-tight text-[#17173A]">Connector Agent</h2>
          <p className="mt-1 font-manrope text-[12.5px] text-[#6F6F8D]">
            Connect your Journey to an external system.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center text-[#6F6F8D] transition-colors hover:text-[#17173A]"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-3 border-t border-[#EBEBF5]" />

      {/* Body — one structured form: the full API request, test, then the
          response fields to expose to the journey. */}
      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div>
          <p className="font-manrope text-[13px] font-bold uppercase tracking-[0.06em] text-[#6F6F8D]">
            API Request
          </p>

          <label className="mt-3 block font-manrope text-[13.5px] font-bold text-[#17173A]">Method</label>
          <Dropdown
            value={setting.method}
            onChange={(v) => mutateConfig((s) => ({ ...s, method: v as ConnectorMethod }))}
            options={["GET", "POST", "PUT", "DELETE"]}
            widthClass="mt-2 w-[140px]"
          />

          <label className="mt-4 block font-manrope text-[13.5px] font-bold text-[#17173A]">Webhook URL</label>
          <input
            value={setting.url}
            onChange={(e) => mutateConfig((s) => ({ ...s, url: e.target.value }))}
            placeholder="Enter API endpoint"
            className="mt-2 h-10 w-full rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[13.5px] text-[#17173A] outline-none placeholder:text-[#9494AE] focus:border-[#B9C4DD]"
          />

          <label className="mt-4 block font-manrope text-[13.5px] font-bold text-[#17173A]">Parameters</label>
          <KeyValueRows
            rows={setting.params}
            onChange={(key, patch) => updateRow("params", key, patch)}
            onAdd={() => addRow("params")}
            onRemove={(key) => removeRow("params", key)}
            addLabel="Add parameter"
            keyPlaceholder="customer_id"
            valuePlaceholder="{{customer.id}}"
          />

          <label className="mt-4 block font-manrope text-[13.5px] font-bold text-[#17173A]">Headers</label>
          <KeyValueRows
            rows={setting.headers}
            onChange={(key, patch) => updateRow("headers", key, patch)}
            onAdd={() => addRow("headers")}
            onRemove={(key) => removeRow("headers", key)}
            addLabel="Add header"
            keyPlaceholder="Content-Type"
            valuePlaceholder="application/json"
          />

          <label className="mt-4 block font-manrope text-[13.5px] font-bold text-[#17173A]">Authorization</label>
          <KeyValueRows
            rows={setting.auth}
            onChange={(key, patch) => updateRow("auth", key, patch)}
            onAdd={() => addRow("auth")}
            onRemove={(key) => removeRow("auth", key)}
            addLabel="Configure"
            keyPlaceholder="Authorization"
            valuePlaceholder="Bearer {{API_KEY}}"
          />
        </div>

        <div className="mt-5 border-t border-[#EBEBF5] pt-5">
          <button
            type="button"
            onClick={runTest}
            disabled={testState === "testing" || setting.url.trim() === ""}
            className="dc-btn dc-btn-primary"
          >
            {testState === "testing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Testing…
              </>
            ) : (
              "Test API"
            )}
          </button>

          {testState === "success" && (
            <div ref={responseRef} className="mt-4">
              <p className="flex items-center gap-1.5 font-manrope text-[13.5px] font-semibold text-[#00B27E]">
                <Check className="h-4 w-4" strokeWidth={2.5} />
                API response received
              </p>

              <div className="mt-3 flex flex-col gap-1.5">
                {setting.availableFields.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center justify-between rounded-md border border-[#DDE2EE] bg-[#FBFCFF] px-3 py-2"
                  >
                    <span className="font-manrope text-[13px] font-semibold text-[#17173A]">{field.name}</span>
                    <span className="font-manrope text-[12.5px] text-[#6F6F8D]">
                      {field.type} · {field.value}
                    </span>
                  </div>
                ))}
              </div>

              <label className="mt-5 block font-manrope text-[14px] font-bold text-[#17173A]">
                Output to Journey
              </label>
              <div className="mt-2 flex flex-col gap-2">
                {setting.availableFields.map((field) => {
                  const checked = setting.selectedFields.includes(field.name);
                  return (
                    <button
                      key={field.name}
                      type="button"
                      onClick={() => toggleField(field.name)}
                      className="flex items-center gap-2.5 rounded-md border border-[#DDE2EE] px-3 py-2 text-left transition-colors hover:border-[#B9C4DD] hover:bg-[#F5F9FF]"
                    >
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-sm border ${
                          checked ? "border-[#2F68E5] bg-[#2F68E5]" : "border-[#B9C4DD] bg-white"
                        }`}
                      >
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className="font-manrope text-[13.5px] text-[#17173A]">{field.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#EBEBF5]" />

      {/* Footer */}
      <div className="flex items-center justify-end px-6 py-4">
        <button type="button" disabled={!canSave} onClick={handleSave} className="dc-btn dc-btn-primary">
          Save
        </button>
      </div>
    </>
  );
}


/** One "+ Add" key/value editor, reused for parameters, headers, and
 *  authorization — same dashed "+" affordance ConditionConfig already uses
 *  for "Add another condition". Rows stay hidden until "+" is tapped, so
 *  none of these technical fields show until the user actually needs them. */
function KeyValueRows({
  rows,
  onChange,
  onAdd,
  onRemove,
  addLabel,
  keyPlaceholder,
  valuePlaceholder,
}: {
  rows: ConnectorKeyValue[];
  onChange: (key: string, patch: Partial<ConnectorKeyValue>) => void;
  onAdd: () => void;
  onRemove: (key: string) => void;
  addLabel: string;
  keyPlaceholder: string;
  valuePlaceholder: string;
}) {
  return (
    <div className="mt-2">
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                value={row.name}
                onChange={(e) => onChange(row.key, { name: e.target.value })}
                placeholder={keyPlaceholder}
                className="h-9 min-w-0 flex-1 rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[13px] text-[#17173A] outline-none placeholder:text-[#9494AE] focus:border-[#B9C4DD]"
              />
              <span className="shrink-0 text-[#6F6F8D]">→</span>
              <input
                value={row.value}
                onChange={(e) => onChange(row.key, { value: e.target.value })}
                placeholder={valuePlaceholder}
                className="h-9 min-w-0 flex-1 rounded-md border border-[#DDE2EE] bg-white px-3 font-manrope text-[13px] text-[#17173A] outline-none placeholder:text-[#9494AE] focus:border-[#B9C4DD]"
              />
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onRemove(row.key)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#FDECEA] hover:text-[#D92D20]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onAdd}
        className={`flex items-center gap-1.5 rounded-md border border-dashed border-[#DDE2EE] px-3 py-2 font-manrope text-[13px] font-semibold text-[#2F68E5] transition-colors hover:border-[#B9C4DD] hover:bg-[#F5F9FF] ${
          rows.length > 0 ? "mt-2" : ""
        }`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        {addLabel}
      </button>
    </div>
  );
}
