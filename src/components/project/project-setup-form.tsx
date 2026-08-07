import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, CalendarDays, MapPin, Ruler } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/project-store";
import type { ProjectInput, UnitSystem } from "@/lib/project-types";

const initialForm: ProjectInput = {
  name: "",
  address: "",
  pinCode: "",
  buildingType: "Low-rise residential house",
  floorCount: 1,
  builtUpArea: 0,
  unitSystem: "metric",
  constructionMethod: "RCC frame with masonry infill",
  targetStartDate: "",
};

export function ProjectSetupForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ProjectInput>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const update = <Key extends keyof ProjectInput>(key: Key, value: ProjectInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.pinCode.trim()) {
      toast.error("Add the project name, address and PIN code to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const project = createProject({
        ...form,
        name: form.name.trim(),
        address: form.address.trim(),
        pinCode: form.pinCode.trim(),
      });
      toast.success("Project created", {
        description: "Your drawing checklist is ready.",
      });
      await navigate({ to: "/projects/$projectId/drawings", params: { projectId: project.id } });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "mt-2";

  return (
    <form onSubmit={submit} className="surface-card rounded-2xl p-5 sm:p-7">
      <div className="flex items-start gap-3 border-b border-border pb-5">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Building2 className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Project basics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These details establish the drawing checklist and procurement context.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="project-name">Project name</Label>
          <Input
            id="project-name"
            className={inputClass}
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="e.g. Mehta Residence"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="project-address">Site address</Label>
          <div className="relative mt-2">
            <MapPin className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              id="project-address"
              className="pl-9"
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Street, locality and city"
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="project-pin">Delivery PIN code</Label>
          <Input
            id="project-pin"
            className={inputClass}
            value={form.pinCode}
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            onChange={(event) => update("pinCode", event.target.value.replace(/\D/g, ""))}
            placeholder="6-digit PIN code"
            required
          />
        </div>
        <div>
          <Label htmlFor="building-type">Building type</Label>
          <select
            id="building-type"
            className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.buildingType}
            onChange={(event) => update("buildingType", event.target.value)}
          >
            <option>Low-rise residential house</option>
            <option>Villa / bungalow</option>
            <option>Small apartment building</option>
            <option>Other residential</option>
          </select>
        </div>
        <div>
          <Label htmlFor="floor-count">Number of floors</Label>
          <Input
            id="floor-count"
            className={inputClass}
            type="number"
            min={1}
            max={10}
            value={form.floorCount}
            onChange={(event) => update("floorCount", Math.max(1, Number(event.target.value)))}
            required
          />
        </div>
        <div>
          <Label htmlFor="built-up-area">Approximate built-up area</Label>
          <div className="relative mt-2">
            <Ruler className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              id="built-up-area"
              className="pr-14 pl-9"
              type="number"
              min={1}
              value={form.builtUpArea || ""}
              onChange={(event) => update("builtUpArea", Math.max(0, Number(event.target.value)))}
              required
            />
            <span className="pointer-events-none absolute top-2 right-3 text-xs text-muted-foreground">
              {form.unitSystem === "metric" ? "m²" : "ft²"}
            </span>
          </div>
        </div>
        <div>
          <Label htmlFor="unit-system">Measurement system</Label>
          <select
            id="unit-system"
            className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.unitSystem}
            onChange={(event) => update("unitSystem", event.target.value as UnitSystem)}
          >
            <option value="metric">Metric (m, m², m³)</option>
            <option value="imperial">Imperial (ft, ft², ft³)</option>
          </select>
        </div>
        <div>
          <Label htmlFor="construction-method">Construction method</Label>
          <select
            id="construction-method"
            className="mt-2 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.constructionMethod}
            onChange={(event) => update("constructionMethod", event.target.value)}
          >
            <option>RCC frame with masonry infill</option>
            <option>Load-bearing masonry</option>
            <option>Steel frame</option>
            <option>Not decided</option>
          </select>
        </div>
        <div>
          <Label htmlFor="target-date">Target construction start</Label>
          <div className="relative mt-2">
            <CalendarDays className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              id="target-date"
              className="pl-9"
              type="date"
              value={form.targetStartDate}
              onChange={(event) => update("targetStartDate", event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Files stay in this browser for this MVP. Server storage replaces this adapter later.
        </p>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create project"} <ArrowRight className="size-4" />
        </Button>
      </div>
    </form>
  );
}
