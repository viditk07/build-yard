import { useEffect, useRef, useState } from "react";
import { Box3, Color, Mesh, MeshStandardMaterial, Vector2, Vector3 } from "three";
import type { Material, Object3D } from "three";
import type {
  IfcElementMetadata,
  IfcModelSummary,
  IfcSource,
  IfcViewerStatus,
  LoadedIfcModel,
} from "@/lib/ifc-types";
import { formatIfcTypeName } from "@/lib/ifc-utils";

export type IfcViewerProps = {
  source: IfcSource | null;
  className?: string;
  onSelectionChange?: (element: IfcElementMetadata | null) => void;
  onSummaryChange?: (summary: IfcModelSummary | null) => void;
  onStatusChange?: (status: IfcViewerStatus) => void;
};

type ViewerRuntime = {
  setModel: (model: LoadedIfcModel | null) => void;
  clearSelection: () => void;
  dispose: () => void;
};

const HIGHLIGHT_MATERIAL = new MeshStandardMaterial({
  color: new Color("#f59e0b"),
  emissive: new Color("#7c2d12"),
  emissiveIntensity: 0.45,
  roughness: 0.55,
  metalness: 0.05,
  transparent: true,
  opacity: 0.9,
  depthWrite: true,
});

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "The IFC model could not be loaded.";
}

function expressIDFromObject(object: Object3D | undefined): number | null {
  let current = object;
  while (current) {
    const value = current.userData["ifcExpressID"] as unknown;
    if (typeof value === "number") return value;
    current = current.parent ?? undefined;
  }
  return null;
}

function setStatus(
  status: IfcViewerStatus,
  update: (status: IfcViewerStatus) => void,
  callbackRef: React.RefObject<IfcViewerProps["onStatusChange"]>,
) {
  update(status);
  callbackRef.current?.(status);
}

/** Browser-only IFC model viewer with orbit controls and semantic selection. */
export function IfcViewer({
  source,
  className = "",
  onSelectionChange,
  onSummaryChange,
  onStatusChange,
}: IfcViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ViewerRuntime | null>(null);
  const modelRef = useRef<LoadedIfcModel | null>(null);
  const selectionCallbackRef = useRef(onSelectionChange);
  const summaryCallbackRef = useRef(onSummaryChange);
  const statusCallbackRef = useRef(onStatusChange);
  const [status, updateStatus] = useState<IfcViewerStatus>({ state: "idle" });
  const [selected, setSelected] = useState<IfcElementMetadata | null>(null);

  useEffect(() => {
    selectionCallbackRef.current = onSelectionChange;
    summaryCallbackRef.current = onSummaryChange;
    statusCallbackRef.current = onStatusChange;
  }, [onSelectionChange, onStatusChange, onSummaryChange]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    let cleanup = () => {};

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#eceae4");
      const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 50_000);
      camera.position.set(10, 8, 12);

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        setStatus(
          { state: "error", message: "3D preview needs a browser with WebGL enabled." },
          updateStatus,
          statusCallbackRef,
        );
        return;
      }
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.screenSpacePanning = true;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x776f61, 2.15));
      const sun = new THREE.DirectionalLight(0xffffff, 2.4);
      sun.position.set(18, 28, 12);
      scene.add(sun);

      const grid = new THREE.GridHelper(200, 100, 0xb7b0a2, 0xd7d2c9);
      grid.position.y = -0.01;
      scene.add(grid);

      let activeModel: LoadedIfcModel | null = null;
      let highlightedMeshes: Array<{ mesh: Mesh; material: Material | Material[] }> = [];
      const raycaster = new THREE.Raycaster();
      const pointer = new Vector2();

      const clearSelection = () => {
        for (const { mesh, material } of highlightedMeshes) mesh.material = material;
        highlightedMeshes = [];
        setSelected(null);
        selectionCallbackRef.current?.(null);
      };

      const frameModel = (bounds: Box3) => {
        if (bounds.isEmpty()) return;
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        const radius = Math.max(size.length() / 2, 1);
        const distance = radius / Math.tan((camera.fov * Math.PI) / 360);
        camera.position
          .copy(center)
          .add(new Vector3(1, 0.8, 1).normalize().multiplyScalar(distance * 1.25));
        camera.near = Math.max(radius / 10_000, 0.01);
        camera.far = Math.max(radius * 100, 2_000);
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        controls.maxDistance = distance * 12;
        controls.update();
        grid.position.y = bounds.min.y - Math.max(size.y * 0.002, 0.01);
        grid.scale.setScalar(Math.max(radius / 100, 0.2));
      };

      const setModel = (model: LoadedIfcModel | null) => {
        clearSelection();
        if (activeModel) scene.remove(activeModel.group);
        activeModel = model;
        if (!model) return;
        scene.add(model.group);
        model.group.updateMatrixWorld(true);
        frameModel(model.bounds);
      };

      const onPointerDown = (event: PointerEvent) => {
        if (!activeModel) return;
        const bounds = renderer.domElement.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        pointer.set(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
        );
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(activeModel.group, true)[0];
        const expressID = expressIDFromObject(hit?.object);
        clearSelection();
        if (expressID === null) return;

        const element = activeModel.getElement(expressID);
        if (!element) return;
        activeModel.group.traverse((object) => {
          if (!(object instanceof Mesh)) return;
          if (expressIDFromObject(object) !== expressID) return;
          highlightedMeshes.push({ mesh: object, material: object.material });
          object.material = HIGHLIGHT_MATERIAL;
        });
        setSelected(element);
        selectionCallbackRef.current?.(element);
      };
      renderer.domElement.addEventListener("pointerdown", onPointerDown);

      const resize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(mount);

      let animationFrame = 0;
      const render = () => {
        controls.update();
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(render);
      };
      render();

      runtimeRef.current = {
        setModel,
        clearSelection,
        dispose: () => cleanup(),
      };
      if (modelRef.current) setModel(modelRef.current);

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        clearSelection();
        if (activeModel) scene.remove(activeModel.group);
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
        runtimeRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let currentModel: LoadedIfcModel | null = null;

    modelRef.current?.dispose();
    modelRef.current = null;
    runtimeRef.current?.setModel(null);
    setSelected(null);
    selectionCallbackRef.current?.(null);
    summaryCallbackRef.current?.(null);

    if (!source) {
      setStatus({ state: "idle" }, updateStatus, statusCallbackRef);
      return () => controller.abort();
    }

    void (async () => {
      try {
        const wasmAsset = await import("web-ifc/web-ifc.wasm?url");
        const { loadIfcModel } = await import("@/lib/ifc-loader");
        currentModel = await loadIfcModel(source, {
          wasmUrl: wasmAsset.default,
          signal: controller.signal,
          onProgress: (progress) =>
            setStatus({ state: "loading", progress }, updateStatus, statusCallbackRef),
        });
        if (controller.signal.aborted) {
          currentModel.dispose();
          return;
        }
        modelRef.current = currentModel;
        runtimeRef.current?.setModel(currentModel);
        setStatus(
          { state: "ready", summary: currentModel.summary },
          updateStatus,
          statusCallbackRef,
        );
        summaryCallbackRef.current?.(currentModel.summary);
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus(
          { state: "error", message: errorMessage(error) },
          updateStatus,
          statusCallbackRef,
        );
      }
    })();

    return () => {
      controller.abort();
      if (currentModel) {
        if (modelRef.current === currentModel) modelRef.current = null;
        runtimeRef.current?.setModel(null);
        currentModel.dispose();
      }
    };
  }, [source]);

  return (
    <div
      className={`relative min-h-80 overflow-hidden rounded-xl bg-secondary ${className}`}
      data-ifc-viewer-state={status.state}
    >
      <div ref={mountRef} className="absolute inset-0" />

      {status.state === "idle" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          Select an IFC file to inspect the building model.
        </div>
      )}

      {status.state === "loading" && (
        <div className="absolute left-4 top-4 max-w-xs rounded-lg border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
          <p className="text-xs font-medium">{status.progress.message}</p>
          {status.progress.total > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{
                  width: `${Math.min(100, (status.progress.completed / status.progress.total) * 100)}%`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {status.state === "error" && (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="max-w-md rounded-lg border border-destructive/30 bg-background/95 p-4 text-center shadow-sm">
            <p className="text-sm font-semibold text-destructive">Could not load IFC model</p>
            <p className="mt-1 text-xs text-muted-foreground">{status.message}</p>
          </div>
        </div>
      )}

      {selected && (
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-lg border border-border bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold">
            {selected.name ?? formatIfcTypeName(selected.typeName)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatIfcTypeName(selected.typeName)} · IFC #{selected.expressID}
          </p>
        </div>
      )}

      <span className="pointer-events-none absolute bottom-3 right-3 rounded bg-background/75 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur">
        Drag to orbit · Scroll to zoom · Click to inspect
      </span>
    </div>
  );
}
