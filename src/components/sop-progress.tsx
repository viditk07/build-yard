import { ArrowRight, CheckCircle2, Circle, CirclePlay, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  buildProjectSop,
  sopCompletion,
  type ProjectWorkPackage,
  type SopReadiness,
  type WorkPackageStatus,
} from "@/lib/sop";

export type SopProgressProps = {
  readiness: SopReadiness;
  statuses?: Partial<Record<string, WorkPackageStatus>>;
  onStatusChange?: (workPackageId: string, status: WorkPackageStatus) => void;
  className?: string;
};

function blockerGuidance(blocker: string): string {
  if (blocker.includes("IFC model")) return "Approve the IFC model in step 1 above.";
  if (blocker.includes("takeoff")) return "Select an element and mark its takeoff reviewed.";
  if (blocker.includes("Supplier")) return "Add at least one reviewed material to the cart.";
  if (blocker.includes("Previous")) return "Finish the current work package first.";
  if (blocker.includes("Drawing")) return "Resolve the starred drawing sections.";
  return blocker;
}

function ActionButton({
  workPackage,
  onStatusChange,
}: {
  workPackage: ProjectWorkPackage;
  onStatusChange?: SopProgressProps["onStatusChange"];
}) {
  if (!onStatusChange || workPackage.status === "blocked" || workPackage.status === "complete") {
    return null;
  }
  if (workPackage.status === "ready") {
    const preflight = workPackage.id === "pre-construction";
    return (
      <Button
        onClick={() => onStatusChange(workPackage.id, preflight ? "complete" : "in-progress")}
      >
        {preflight ? <CheckCircle2 /> : <CirclePlay />}
        {preflight ? "Complete pre-construction checks" : `Start ${workPackage.name}`}
      </Button>
    );
  }
  return (
    <Button onClick={() => onStatusChange(workPackage.id, "complete")}>
      <CheckCircle2 /> Mark package complete
    </Button>
  );
}

export function SopProgress({
  readiness,
  statuses = {},
  onStatusChange,
  className,
}: SopProgressProps) {
  const workPackages = buildProjectSop(readiness, statuses);
  const completion = sopCompletion(workPackages);
  const currentIndex = workPackages.findIndex((workPackage) => workPackage.status !== "complete");
  const current = currentIndex >= 0 ? workPackages[currentIndex] : undefined;

  return (
    <Card id="project-sop" className={className}>
      <CardHeader className="border-b">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-spec text-muted-foreground">Project SOP</p>
            <CardTitle className="mt-1">What happens next</CardTitle>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              One current action is shown at a time. Complete it to unlock the next construction
              package.
            </p>
          </div>
          <span className="num font-display text-2xl font-semibold">{completion}%</span>
        </div>
        <Progress value={completion} className="mt-3" />
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {current ? (
          <section
            className={`rounded-xl border p-4 ${
              current.status === "blocked"
                ? "border-amber-200 bg-amber-50/70"
                : "border-primary/25 bg-primary/5"
            }`}
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Your next action
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">{current.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{current.summary}</p>
                {current.blockers.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {current.blockers.map((blocker) => (
                      <li key={blocker} className="flex items-start gap-2 text-xs text-amber-800">
                        <ArrowRight className="mt-0.5 size-3.5 shrink-0" />
                        {blockerGuidance(blocker)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="shrink-0">
                <ActionButton workPackage={current} onStatusChange={onStatusChange} />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800">
            <CheckCircle2 className="mx-auto size-7" />
            <h3 className="mt-2 font-semibold">All SOP packages completed</h3>
          </section>
        )}

        <ol className="divide-y divide-border rounded-xl border border-border">
          {workPackages.map((workPackage, index) => {
            const complete = workPackage.status === "complete";
            const isCurrent = index === currentIndex;
            return (
              <li
                key={workPackage.id}
                className={`flex items-start gap-3 p-4 ${isCurrent ? "bg-primary/5" : ""}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    complete
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {complete ? <CheckCircle2 className="size-4" /> : workPackage.sequence + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{workPackage.name}</p>
                    <Badge variant="outline">
                      {complete
                        ? "Completed"
                        : isCurrent
                          ? workPackage.status === "blocked"
                            ? "Action needed"
                            : "Current"
                          : "Upcoming"}
                    </Badge>
                  </div>
                  {isCurrent && workPackage.holdPoints.length > 0 && (
                    <p className="mt-1.5 flex items-start gap-2 text-xs text-muted-foreground">
                      <ListChecks className="mt-0.5 size-3.5 shrink-0" /> Hold point:{" "}
                      {workPackage.holdPoints[0]}
                    </p>
                  )}
                </div>
                {!complete && !isCurrent && (
                  <Circle className="mt-1 size-4 text-muted-foreground/50" />
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
