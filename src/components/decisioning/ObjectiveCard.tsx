import { useNavigate } from "react-router-dom";
import {
  Archive,
  CheckCircle2,
  Copy,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuSeparator,
  ActionMenuTrigger,
} from "@/components/ui/action-menu";
import {
  useDecisioningSetup,
  type LaunchedObjective,
} from "@/contexts/DecisioningSetupContext";

/**
 * A launched objective, rendered as the card from the Figma design: gradient
 * thumbnail + status badge, title, description, key stats, a "View live
 * performance" CTA, and a three-dot menu with objective actions
 * (edit / duplicate / pause / archive / delete).
 */
export default function ObjectiveCard({ objective }: { objective: LaunchedObjective }) {
  const navigate = useNavigate();
  const {
    duplicateObjective,
    pauseObjective,
    resumeObjective,
    archiveObjective,
    deleteObjective,
  } = useDecisioningSetup();

  const draft = objective.status === "draft";
  const paused = objective.status === "paused";
  const live = objective.status === "live";

  const stats = [
    { label: "Goal: ", value: objective.goal },
    { label: "Channels: ", value: objective.channels },
    { label: "Revenue generated: ", value: objective.revenue },
  ];

  return (
    <div
      className={`relative flex w-[363px] max-w-full flex-col gap-8 overflow-hidden rounded-[8px] p-[25px] font-manrope ${
        live ? "" : "border border-[#DDE2EE]"
      }`}
      style={{
        boxShadow: live ? "0px 0px 10px 2px rgba(0,196,140,0.16)" : "none",
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.9) 100%), linear-gradient(90deg, #ffffff 12%, #bfe2ff 68%, rgba(10,143,253,0.3) 100%)",
      }}
    >
      {/* Only live objectives get the travelling "snake" green border (same
          shimmer as the Ask co-marketer CTA). Draft and paused cards fall back
          to the static grey border set above. */}
      {live && <span aria-hidden="true" className="snake-border snake-border--green" />}

      <div className="relative flex flex-col gap-4">
        {/* Thumbnail + status + menu */}
        <div className="flex items-start justify-between">
          <div
            className="flex h-[68px] w-[96px] items-center justify-center rounded-[8px] shadow-[inset_0px_4px_6px_0px_rgba(255,255,255,0.6)]"
            style={{
              backgroundImage:
                "linear-gradient(35deg, #010818 20%, #0160de 51%, #f08fe9 84%)",
            }}
          >
            <Sparkles className="h-4 w-4 text-white" strokeWidth={1.8} />
          </div>

          <div className="flex items-center gap-2">
            {draft ? (
              <span className="flex h-5 items-center gap-1 rounded-[4px] border border-[#DDE2EE] bg-[#EEF1F7] px-2 py-0.5 text-[12px] font-medium text-[#6F6F8D]">
                Draft
              </span>
            ) : (
              <span
                className="flex h-5 items-center gap-1 rounded-[4px] py-0.5 pl-1 pr-2 text-[12px] font-medium text-white"
                style={{ background: paused ? "#8A8AA3" : "#30B756" }}
              >
                <span className="h-2 w-2 rounded-full bg-white" />
                {paused ? "Paused" : "Live"}
              </span>
            )}

            <ActionMenu>
              <ActionMenuTrigger asChild>
                <button
                  aria-label="Objective actions"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#6F6F8D] transition-colors hover:bg-[#EEF1F7] hover:text-[#17173A]"
                >
                  <MoreVertical className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </button>
              </ActionMenuTrigger>
              <ActionMenuContent align="end" side="bottom">
                <ActionMenuItem
                  icon={Pencil}
                  onSelect={() => navigate("/decisioning-engine/objective/new")}
                >
                  Edit objective
                </ActionMenuItem>
                <ActionMenuItem
                  icon={Copy}
                  onSelect={() => duplicateObjective(objective.id)}
                >
                  Duplicate objective
                </ActionMenuItem>
                {/* Pause/resume only applies to running objectives, not drafts. */}
                {!draft &&
                  (paused ? (
                    <ActionMenuItem
                      icon={Play}
                      onSelect={() => resumeObjective(objective.id)}
                    >
                      Resume objective
                    </ActionMenuItem>
                  ) : (
                    <ActionMenuItem
                      icon={Pause}
                      onSelect={() => pauseObjective(objective.id)}
                    >
                      Pause objective
                    </ActionMenuItem>
                  ))}
                <ActionMenuSeparator />
                <ActionMenuItem
                  icon={Archive}
                  onSelect={() => archiveObjective(objective.id)}
                >
                  Archive objective
                </ActionMenuItem>
                <ActionMenuItem
                  icon={Trash2}
                  variant="danger"
                  onSelect={() => deleteObjective(objective.id)}
                >
                  Delete objective
                </ActionMenuItem>
              </ActionMenuContent>
            </ActionMenu>
          </div>
        </div>

        {/* Title + description — the title sits at its natural height (no
            reserved gap); the description reserves 2 lines so the metrics below
            still line up across cards. */}
        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 text-[18px] font-bold leading-[26px] text-[#17173A]">
            {objective.title}
          </h3>
          <p className="line-clamp-2 min-h-[44px] text-[14px] leading-[22px] text-[#6F6F8D]">
            {objective.description}
          </p>
        </div>

        {/* Stats — Goal, Channels, Revenue generated. Drafts render the same
            three rows so every card state stays the same height; any value the
            user hasn't set yet falls back to a hyphen. */}
        <div className="flex flex-col gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${draft ? "text-[#C9D0E0]" : "text-[#00C48C]"}`}
                strokeWidth={1.8}
              />
              <p className="text-[12px] leading-4 text-[#17173A]">
                {s.label}
                <span className="font-bold">{s.value || "—"}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA — pinned to the bottom (mt-auto) so cards of any state that get
          stretched to a shared row height keep the button flush at the base.
          Drafts resume setup; live/paused objectives open performance. */}
      <button
        onClick={() =>
          draft
            ? navigate("/decisioning-engine/objective/new")
            : navigate("/decisioning-engine/objective/performance", {
                state: { objective },
              })
        }
        className="mt-auto flex h-11 w-full items-center justify-center rounded-[6px] border border-[#0A8FFD] bg-white text-[14px] font-semibold uppercase tracking-[0.42px] text-[#17173A] shadow-[inset_0px_-1px_0px_0px_#bdbdbd,inset_-1px_0px_0px_0px_#dcdcdc,inset_1px_0px_0px_0px_#dcdcdc,inset_0px_1px_0px_0px_#dcdcdc] transition-colors hover:bg-[#F4F8FF]"
      >
        {draft ? "Update objective" : "View live performance"}
      </button>
    </div>
  );
}
