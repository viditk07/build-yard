import { AlertTriangle, CheckCircle2, PackageCheck, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/catalog";
import {
  calculateElementTakeoff,
  getMatchedOffer,
  type MaterialRequirement,
  type ModelElementSnapshot,
} from "@/lib/takeoff";

const quantity = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

const confidenceClass: Record<MaterialRequirement["confidence"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-red-200 bg-red-50 text-red-800",
};

export type TakeoffPanelProps = {
  element?: ModelElementSnapshot;
  className?: string;
};

export function TakeoffPanel({ element, className }: TakeoffPanelProps) {
  const { add } = useCart();
  const takeoff = element ? calculateElementTakeoff(element) : undefined;

  if (!element || !takeoff) {
    return (
      <Card className={className}>
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <PackageCheck className="size-8 text-muted-foreground" />
          <div>
            <p className="font-display font-semibold">Select a model element</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Its approved IFC quantities will be converted into material requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const addRequirement = (requirement: MaterialRequirement) => {
    add(requirement.productId, requirement.orderQuantity);
    toast.success("Material added to cart", {
      description: `${quantity(requirement.orderQuantity)} × ${requirement.unit}`,
    });
  };

  return (
    <Card className={className}>
      <CardHeader className="space-y-3 border-b">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-spec text-muted-foreground">Selected element</p>
            <CardTitle className="mt-1 text-lg">{element.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {element.ifcClass} · {element.storey ?? "Unassigned storey"}
            </p>
          </div>
          <Badge variant={takeoff.procurementReady ? "default" : "outline"}>
            {takeoff.procurementReady ? "Procurement ready" : "Review required"}
          </Badge>
        </div>
        {takeoff.recipeId && (
          <p className="text-xs text-muted-foreground">
            Recipe {takeoff.recipeId} v{takeoff.recipeVersion} · Model{" "}
            {element.modelRevision ?? "draft"}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {takeoff.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <ul className="space-y-1 text-xs">
                {takeoff.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {takeoff.requirements.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No calculable material requirements are available for this element yet.
          </p>
        ) : (
          takeoff.requirements.map((requirement) => {
            const offer = getMatchedOffer(requirement);
            return (
              <article key={requirement.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-semibold">
                      {requirement.genericName}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {requirement.specification}
                    </p>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${confidenceClass[requirement.confidence]}`}
                  >
                    {requirement.confidence} · {requirement.confidenceScore}%
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Calculated + waste</dt>
                    <dd className="num mt-0.5 font-semibold">
                      {quantity(requirement.requiredQuantity)} {requirement.unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Order quantity</dt>
                    <dd className="num mt-0.5 font-semibold">
                      {quantity(requirement.orderQuantity)} {requirement.unit}
                    </dd>
                  </div>
                </dl>

                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Formula & provenance
                  </summary>
                  <p className="mt-2 leading-relaxed">{requirement.formula}</p>
                  {requirement.assumptions.map((assumption) => (
                    <p key={assumption} className="mt-1 leading-relaxed">
                      Assumption: {assumption}
                    </p>
                  ))}
                </details>

                {offer && (
                  <div className="mt-4 flex items-end justify-between gap-3 border-t pt-3">
                    <div>
                      <p className="text-xs font-medium">{offer.supplier.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {offer.match.stockStatus === "available" ? "In stock" : "Confirm stock"} ·{" "}
                        {offer.supplier.city}
                      </p>
                      <p className="num mt-1 font-display font-semibold">
                        {formatINR(offer.match.estimatedSubtotal)}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => addRequirement(requirement)}>
                      <ShoppingCart /> Add
                    </Button>
                  </div>
                )}
              </article>
            );
          })
        )}

        {takeoff.procurementReady && (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="size-4" />
            Approved quantities and current catalog stock satisfy this element.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
