# BuildYard demo project files

These intentionally small files exercise the browser-local upload, drawing register,
IFC viewer, element selection, takeoff, supplier matching, and cart workflow.

## Suggested upload mapping

| File                           | Upload section               | Required? |
| ------------------------------ | ---------------------------- | --------- |
| `sample-floor-plan.dxf`        | Architectural drawings       | No        |
| `sample-house-elements.ifc`    | IFC building model           | Yes       |
| `sample-structural-plan.dxf`   | Structural drawings          | No        |
| `sample-plumbing-plan.dxf`     | Plumbing drawings            | No        |
| `sample-electrical-plan.dxf`   | Electrical drawings          | No        |
| `sample-material-schedule.csv` | Specifications and schedules | No        |

The IFC model contains a wall, floor slab, and column in metre units. Select each object
in the model workspace to exercise different material recipes. All geometry, quantities,
prices, and notes are synthetic and must not be used for construction or procurement.
