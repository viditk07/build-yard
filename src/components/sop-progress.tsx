import { AlertCircle, CheckCircle2, Circle, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  buildProjectSop,
  sopCompletion,
  type SopReadiness,
  type WorkPackageStatus,
} from "@/lib/sop";

const iconForStatus = (status: WorkPackageStatus) => {
  if (status === "complete") return CheckCircle2;
  if (status === "blocked") return LockKeyhole;
  if (status === "awaiting-approval") return AlertCircle;
  return Circle;
};

export type SopProgressProps = {
  readiness: SopReadiness;
  statuses?: Partial<Record<string, WorkPackageStatus>>;
  className?: string;
};

export function SopProgress({ readiness, statuses = {}, className }: SopProgressProps) {
  const workPackages = buildProjectSop(readiness, statuses);
  const completion = sopCompletion(workPackages);

  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-spec text-muted-foreground">Project SOP</p>
            <CardTitle className="mt-1">Construction work packages</CardTitle>
          </div>
          <span className="num font-display text-2xl font-semibold">{completion}%</span>
        </div>
        <Progress value={completion} className="mt-3" />
      </CardHeader>
      <CardContent className="pt-5">
        <ol className="space-y-1">
          {workPackages.map((workPackage) => {
            const StatusIcon = iconForStatus(workPackage.status);
            return (
              <li key={workPackage.id} className="rounded-lg px-2 py-3 hover:bg-muted/60">
                <div className="flex items-start gap-3">
                  <StatusIcon
                    className={`mt-0.5 size-4 shrink-0 ${
                      workPackage.status === "complete"
                        ? "text-emerald-600"
                        : workPackage.status === "blocked"
                          ? "text-muted-foreground"
                          : "text-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-display text-sm font-semibold">{workPackage.name}</p>
                      <Badge variant="outline" className="capitalize">
                        {workPackage.status.replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {workPackage.summary}
                    </p>
                    {workPackage.blockers.length > 0 && (
                      <p className="mt-2 text-xs text-amber-700">{workPackage.blockers[0]}</p>
                    )}
                    {workPackage.holdPoints.length > 0 && workPackage.status !== "blocked" && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Next hold point: {workPackage.holdPoints[0]}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
