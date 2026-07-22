import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Eye,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Pencil,
  Target,
  Users,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import TemplatePreviewSheet from "./TemplatePreviewSheet";
import { templateSrc } from "./emailTemplates";
import "./journey-preview.css";

/**
 * Journey Preview — final step of the objective flow. A scrollable node
 * graph recapping the configuration; each node routes back to its step for
 * editing. Channel nodes have a template node attached beneath them.
 */

export type EditableStep = "goal" | "audience" | "content";

const CHANNELS: {
  id: string;
  name: string;
  offer: string;
  template: string;
  templateId: string;
  icon: typeof Mail;
  tone: string;
}[] = [
  { id: "email", name: "Email", offer: "Second-purchase offer", template: "New launch (1)", templateId: "868", icon: Mail, tone: "purple" },
  { id: "sms", name: "SMS", offer: "Free-shipping nudge", template: "Free shipping SMS", templateId: "742", icon: MessageSquare, tone: "pink" },
  { id: "push", name: "Push notification", offer: "Complete-the-set reminder", template: "Complete set push", templateId: "915", icon: Bell, tone: "blue" },
  { id: "webpush", name: "Web push", offer: "Limited-time comeback offer", template: "Comeback offer", templateId: "603", icon: Globe, tone: "orange" },
];

function StepNode({
  icon: Icon,
  tone,
  title,
  value,
  sub,
  onEdit,
  editable,
}: {
  icon: typeof Target;
  tone: string;
  title: string;
  value: string;
  sub?: string;
  onEdit: () => void;
  editable: boolean;
}) {
  return (
    <div className={`jp-card jp-node tone-${tone}`}>
      <span className="jp-icon">
        <Icon strokeWidth={1.9} />
      </span>
      <div className="jp-card-text">
        <strong>{title}</strong>
        <span>{value}</span>
        {sub ? <small>{sub}</small> : null}
      </div>
      {editable && (
        <button className="jp-edit" onClick={onEdit} aria-label={`Edit ${title}`}>
          <Pencil strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}

export default function JourneyPreview({
  onEdit,
  editable = true,
}: {
  onEdit: (step: EditableStep) => void;
  /** When false (e.g. the performance page), all edit affordances are hidden. */
  editable?: boolean;
}) {
  const [previewChannel, setPreviewChannel] = useState<
    (typeof CHANNELS)[number] | null
  >(null);
  // Start zoomed out so the whole graph (all channels + templates) is visible
  // in the first view; the user can zoom in for detail.
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 1.2;
  const ZOOM_STEP = 0.15;
  const [zoom, setZoom] = useState(0.55);
  const clampZoom = (z: number) =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));

  return (
    <div className="journey-preview">
      <div className="jp-header">
        <div>
          <h1>Journey Preview</h1>
          <p>
            {editable
              ? "A quick view of your configuration. Click any step to go back and edit"
              : "A quick view of your configuration."}
          </p>
        </div>
        <div className="jp-zoom" role="group" aria-label="Zoom controls">
          <button
            type="button"
            className="jp-zoom-btn"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Zoom out"
          >
            <ZoomOut strokeWidth={1.9} />
          </button>
          <span className="jp-zoom-value">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="jp-zoom-btn"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoom in"
          >
            <ZoomIn strokeWidth={1.9} />
          </button>
        </div>
      </div>

      <div className="jp-scroll">
        <div
          className="jp-canvas"
          style={{ ["--jp-zoom" as string]: zoom }}
        >
          {/* Linear chain */}
          <div className="jp-linear">
            <StepNode
              icon={Target}
              tone="blue"
              title="Goal"
              value="Win the second purchase"
              onEdit={() => onEdit("goal")}
              editable={editable}
            />
            <span className="jp-line" />
            <StepNode
              icon={Users}
              tone="purple"
              title="Audience"
              value="All contacts"
              sub="High-intent buyers, Occasional buyers, Price sensitive"
              onEdit={() => onEdit("audience")}
              editable={editable}
            />
            <span className="jp-line" />
            <StepNode
              icon={FileText}
              tone="green"
              title="Content"
              value="4 channels mapped"
              onEdit={() => onEdit("content")}
              editable={editable}
            />
          </div>

          {/* Stem from Content down to the branch bus */}
          <span className="jp-line" />

          {/* Channels + attached template nodes */}
          <div className="jp-tree">
            <ul>
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                return (
                  <li key={c.id}>
                    <div className="jp-branch-inner">
                      <div className={`jp-card jp-chan tone-${c.tone}`}>
                        <span className="jp-icon">
                          <Icon strokeWidth={1.9} />
                        </span>
                        <div className="jp-card-text">
                          <strong>{c.name}</strong>
                          <span>{c.offer}</span>
                        </div>
                        {editable && (
                          <button
                            className="jp-arrow"
                            onClick={() => onEdit("content")}
                            aria-label={`Edit ${c.name}`}
                          >
                            <ArrowRight strokeWidth={1.9} />
                          </button>
                        )}
                      </div>
                      <span className="jp-line" />
                      <button
                        type="button"
                        className="jp-tpl"
                        onClick={() => setPreviewChannel(c)}
                        aria-label={`Preview ${c.template} template`}
                      >
                        <span className="jp-tpl-icon">
                          <FileText strokeWidth={1.8} />
                        </span>
                        <div className="jp-tpl-text">
                          <small>Template</small>
                          <strong>{c.template}</strong>
                        </div>
                        <span className="jp-tpl-eye" aria-hidden>
                          <Eye strokeWidth={1.9} />
                        </span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <TemplatePreviewSheet
        open={previewChannel !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewChannel(null);
        }}
        mappedName={previewChannel?.template ?? ""}
        mappedId={previewChannel?.templateId ?? ""}
        channelName={previewChannel?.name ?? ""}
        templateSrc={templateSrc(previewChannel?.templateId)}
      />
    </div>
  );
}
