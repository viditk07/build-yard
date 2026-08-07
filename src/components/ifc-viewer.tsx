import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  Box,
  Eye,
  EyeOff,
  Focus,
  Footprints,
  Hand,
  Home,
  Maximize2,
  MousePointer2,
  Scan,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Box3, Color, Mesh, MeshStandardMaterial, Vector2, Vector3 } from "three";
import type { Material, Object3D } from "three";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

type NavigationMode = "select" | "pan" | "walk";
type StandardView = "isometric" | "top" | "front" | "right";

type ViewerRuntime = {
  setModel: (model: LoadedIfcModel | null) => void;
  clearSelection: () => void;
  setNavigationMode: (mode: NavigationMode) => void;
  frameAll: () => void;
  zoom: (factor: number) => void;
  focusSelection: () => void;
  setView: (view: StandardView) => void;
  isolateSelection: () => void;
  hideSelection: () => void;
  showAll: () => void;
  enterWalk: () => void;
  lockWalk: () => void;
  dispose: () => void;
};

const HIGHLIGHT_MATERIAL = new MeshStandardMaterial({
  color: new Color("#f59e0b"),
  emissive: new Color("#7c2d12"),
  emissiveIntensity: 0.6,
  roughness: 0.45,
  metalness: 0.05,
  transparent: true,
  opacity: 0.94,
  depthWrite: true,
});

const modeHelp: Record<NavigationMode, string> = {
  select:
    "Click to select · Drag or Shift+middle drag to orbit · Middle/right drag to pan · Wheel to zoom",
  pan: "Drag to pan · Wheel to zoom",
  walk: "Mouse to look · W A S D or arrows to move · Q/E for height · Shift for speed",
};

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
  callbackRef: RefObject<IfcViewerProps["onStatusChange"]>,
) {
  update(status);
  callbackRef.current?.(status);
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
  wide = false,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={`flex h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-secondary"
          } ${wide ? "sm:min-w-20" : "min-w-9"}`}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Browser-only IFC viewer with BIM-style navigation, walkthrough, and semantic selection. */
export function IfcViewer({
  source,
  className = "",
  onSelectionChange,
  onSummaryChange,
  onStatusChange,
}: IfcViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<ViewerRuntime | null>(null);
  const modelRef = useRef<LoadedIfcModel | null>(null);
  const navigationModeRef = useRef<NavigationMode>("select");
  const selectionCallbackRef = useRef(onSelectionChange);
  const summaryCallbackRef = useRef(onSummaryChange);
  const statusCallbackRef = useRef(onStatusChange);
  const [status, updateStatus] = useState<IfcViewerStatus>({ state: "idle" });
  const [selected, setSelected] = useState<IfcElementMetadata | null>(null);
  const [navigationMode, setNavigationMode] = useState<NavigationMode>("select");
  const [walkLocked, setWalkLocked] = useState(false);
  const [visibilityModified, setVisibilityModified] = useState(false);

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
      const { PointerLockControls } =
        await import("three/examples/jsm/controls/PointerLockControls.js");
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#e9e8e3");
      const camera = new THREE.PerspectiveCamera(50, 1, 0.02, 50_000);
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
      renderer.domElement.style.touchAction = "none";
      renderer.domElement.tabIndex = 0;
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.075;
      controls.screenSpacePanning = true;
      controls.zoomToCursor = true;
      controls.minDistance = 0.05;
      controls.minPolarAngle = 0.04;
      controls.maxPolarAngle = Math.PI * 0.96;
      controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
      controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
      controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

      const walkControls = new PointerLockControls(camera, renderer.domElement);
      walkControls.pointerSpeed = 0.85;
      walkControls.minPolarAngle = 0.15;
      walkControls.maxPolarAngle = Math.PI - 0.15;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x6f6a61, 2.35));
      const sun = new THREE.DirectionalLight(0xffffff, 2.5);
      sun.position.set(18, 28, 12);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0xdbeafe, 0.85);
      fill.position.set(-15, 10, -12);
      scene.add(fill);

      const grid = new THREE.GridHelper(200, 100, 0x9e978b, 0xcec9bf);
      grid.position.y = -0.01;
      scene.add(grid);

      let activeModel: LoadedIfcModel | null = null;
      let activeMode: NavigationMode = navigationModeRef.current;
      let selectedExpressID: number | null = null;
      let highlightedMeshes: Array<{ mesh: Mesh; material: Material | Material[] }> = [];
      let pointerStart: { x: number; y: number; button: number } | null = null;
      let walkSpeed = 2;
      const pressedKeys = new Set<string>();
      const raycaster = new THREE.Raycaster();
      const pointer = new Vector2();
      const clock = new THREE.Clock();

      const clearSelection = () => {
        for (const { mesh, material } of highlightedMeshes) mesh.material = material;
        highlightedMeshes = [];
        selectedExpressID = null;
        setSelected(null);
        selectionCallbackRef.current?.(null);
      };

      const visibleModelBounds = () => {
        if (!activeModel) return null;
        const bounds = new Box3();
        activeModel.group.traverse((object) => {
          if (object instanceof Mesh && object.visible) bounds.expandByObject(object);
        });
        return bounds.isEmpty() ? activeModel.bounds.clone() : bounds;
      };

      const frameBounds = (bounds: Box3, direction?: Vector3) => {
        if (bounds.isEmpty()) return;
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        const radius = Math.max(size.length() / 2, 0.5);
        const distance = radius / Math.tan((camera.fov * Math.PI) / 360);
        const viewDirection =
          direction?.clone().normalize() ??
          camera.position.clone().sub(controls.target).normalize();
        if (viewDirection.lengthSq() < 0.01) viewDirection.set(1, 0.8, 1).normalize();
        camera.position.copy(center).addScaledVector(viewDirection, distance * 1.2);
        camera.near = Math.max(radius / 20_000, 0.01);
        camera.far = Math.max(radius * 200, 2_000);
        camera.updateProjectionMatrix();
        controls.target.copy(center);
        controls.maxDistance = distance * 15;
        controls.update();
      };

      const frameAll = () => {
        const bounds = visibleModelBounds();
        if (!bounds) return;
        camera.up.set(0, 1, 0);
        frameBounds(bounds, new Vector3(1, 0.8, 1));
      };

      const elementBounds = (expressID: number) => {
        if (!activeModel) return null;
        const bounds = new Box3();
        activeModel.group.traverse((object) => {
          if (!(object instanceof Mesh) || !object.visible) return;
          if (expressIDFromObject(object) === expressID) bounds.expandByObject(object);
        });
        return bounds.isEmpty() ? null : bounds;
      };

      const focusSelection = () => {
        if (selectedExpressID === null) return;
        const bounds = elementBounds(selectedExpressID);
        if (!bounds) return;
        const direction = camera.position.clone().sub(controls.target).normalize();
        frameBounds(bounds, direction);
      };

      const selectAt = (event: PointerEvent, focusAfterSelection = false) => {
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
        selectedExpressID = expressID;
        setSelected(element);
        selectionCallbackRef.current?.(element);
        const pickedBounds = elementBounds(expressID);
        if (pickedBounds) {
          controls.target.copy(pickedBounds.getCenter(new Vector3()));
          controls.update();
        }
        if (focusAfterSelection) focusSelection();
      };

      const positionInsideModel = () => {
        if (!activeModel) return;
        const bounds = activeModel.bounds;
        const center = bounds.getCenter(new Vector3());
        const size = bounds.getSize(new Vector3());
        const eyeHeight = Math.min(Math.max(size.y * 0.45, 1.55), Math.max(size.y - 0.2, 1.55));
        camera.up.set(0, 1, 0);
        camera.position.set(center.x, bounds.min.y + eyeHeight, center.z + size.z * 0.18);
        camera.lookAt(center.x, camera.position.y, center.z - Math.max(size.z, 1));
        camera.updateMatrixWorld(true);
        walkSpeed = Math.max(size.length() * 0.18, 1.5);
      };

      const setNavigationMode = (mode: NavigationMode) => {
        if (activeMode === "walk" && mode !== "walk" && walkControls.isLocked) {
          walkControls.unlock();
        }
        activeMode = mode;
        navigationModeRef.current = mode;
        pressedKeys.clear();
        controls.enabled = mode !== "walk";
        controls.enableRotate = mode !== "pan";
        controls.enablePan = true;
        controls.mouseButtons.LEFT = mode === "pan" ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE;
        controls.touches.ONE = mode === "pan" ? THREE.TOUCH.PAN : THREE.TOUCH.ROTATE;
        camera.fov = mode === "walk" ? 65 : 50;
        camera.updateProjectionMatrix();
        renderer.domElement.style.cursor =
          mode === "walk" ? "crosshair" : mode === "pan" ? "grab" : "pointer";
        if (mode !== "walk") {
          const direction = camera.getWorldDirection(new Vector3());
          const bounds = visibleModelBounds();
          const distance = Math.max(bounds?.getSize(new Vector3()).length() ?? 5, 1) * 0.45;
          controls.target.copy(camera.position).addScaledVector(direction, distance);
          controls.update();
        }
      };

      const setView = (view: StandardView) => {
        const bounds = visibleModelBounds();
        if (!bounds) return;
        camera.up.set(0, 1, 0);
        const direction = new Vector3(1, 0.8, 1);
        if (view === "top") {
          direction.set(0, 1, 0);
          camera.up.set(0, 0, -1);
        } else if (view === "front") {
          direction.set(0, 0, 1);
        } else if (view === "right") {
          direction.set(1, 0, 0);
        }
        frameBounds(bounds, direction);
      };

      const setModel = (model: LoadedIfcModel | null) => {
        clearSelection();
        if (activeModel) scene.remove(activeModel.group);
        activeModel = model;
        setVisibilityModified(false);
        if (!model) return;
        scene.add(model.group);
        model.group.updateMatrixWorld(true);
        const size = model.bounds.getSize(new Vector3());
        const radius = Math.max(size.length() / 2, 1);
        grid.position.y = model.bounds.min.y - Math.max(size.y * 0.002, 0.01);
        grid.scale.setScalar(Math.max(radius / 100, 0.2));
        frameAll();
      };

      const showOnlySelection = () => {
        if (!activeModel || selectedExpressID === null) return;
        activeModel.group.traverse((object) => {
          if (object instanceof Mesh) {
            object.visible = expressIDFromObject(object) === selectedExpressID;
          }
        });
        setVisibilityModified(true);
        focusSelection();
      };

      const hideSelection = () => {
        if (!activeModel || selectedExpressID === null) return;
        const idToHide = selectedExpressID;
        for (const { mesh, material } of highlightedMeshes) mesh.material = material;
        highlightedMeshes = [];
        activeModel.group.traverse((object) => {
          if (object instanceof Mesh && expressIDFromObject(object) === idToHide) {
            object.visible = false;
          }
        });
        selectedExpressID = null;
        setSelected(null);
        selectionCallbackRef.current?.(null);
        setVisibilityModified(true);
      };

      const showAll = () => {
        if (!activeModel) return;
        activeModel.group.traverse((object) => {
          object.visible = true;
        });
        setVisibilityModified(false);
        frameAll();
      };

      const zoom = (factor: number) => {
        if (!controls.enabled) return;
        const offset = camera.position.clone().sub(controls.target);
        const distance = Math.max(controls.minDistance, offset.length() * factor);
        camera.position.copy(controls.target).addScaledVector(offset.normalize(), distance);
        controls.update();
      };

      const enterWalk = () => {
        setNavigationMode("walk");
        positionInsideModel();
        walkControls.lock();
      };

      const onPointerDown = (event: PointerEvent) => {
        renderer.domElement.focus({ preventScroll: true });
        if (activeMode === "walk") {
          if (!walkControls.isLocked) walkControls.lock();
          return;
        }
        if (activeMode === "select" && event.button === 0) {
          pointerStart = { x: event.clientX, y: event.clientY, button: event.button };
        }
      };

      const onNavigationPointerDown = (event: PointerEvent) => {
        if (event.button === 1) {
          controls.mouseButtons.MIDDLE = event.shiftKey ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
        }
      };

      const onPointerUp = (event: PointerEvent) => {
        if (activeMode !== "select" || !pointerStart || pointerStart.button !== event.button) {
          pointerStart = null;
          return;
        }
        const movement = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
        pointerStart = null;
        if (movement <= 4) selectAt(event);
      };

      const onDoubleClick = (event: MouseEvent) => {
        if (activeMode !== "select" || event.button !== 0) return;
        selectAt(event as PointerEvent, true);
      };

      const onKeyDown = (event: KeyboardEvent) => {
        const key = event.key.toLocaleLowerCase();
        if (activeMode !== "walk") {
          if (document.activeElement !== renderer.domElement) return;
          if (key === "f") {
            event.preventDefault();
            focusSelection();
          } else if (key === "escape") {
            clearSelection();
          }
          return;
        }
        if (
          [
            "w",
            "a",
            "s",
            "d",
            "q",
            "e",
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "shift",
          ].includes(key)
        ) {
          event.preventDefault();
          pressedKeys.add(key);
        }
      };

      const onKeyUp = (event: KeyboardEvent) => {
        pressedKeys.delete(event.key.toLocaleLowerCase());
      };

      const onWindowBlur = () => pressedKeys.clear();

      const onWalkLock = () => setWalkLocked(true);
      const onWalkUnlock = () => setWalkLocked(false);
      renderer.domElement.addEventListener("pointerdown", onNavigationPointerDown, true);
      renderer.domElement.addEventListener("pointerdown", onPointerDown);
      renderer.domElement.addEventListener("pointerup", onPointerUp);
      renderer.domElement.addEventListener("dblclick", onDoubleClick);
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", onWindowBlur);
      walkControls.addEventListener("lock", onWalkLock);
      walkControls.addEventListener("unlock", onWalkUnlock);

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
        const delta = Math.min(clock.getDelta(), 0.05);
        if (activeMode === "walk" && walkControls.isLocked) {
          const speed = walkSpeed * (pressedKeys.has("shift") ? 2.5 : 1) * delta;
          if (pressedKeys.has("w") || pressedKeys.has("arrowup")) walkControls.moveForward(speed);
          if (pressedKeys.has("s") || pressedKeys.has("arrowdown")) {
            walkControls.moveForward(-speed);
          }
          if (pressedKeys.has("a") || pressedKeys.has("arrowleft")) {
            walkControls.moveRight(-speed);
          }
          if (pressedKeys.has("d") || pressedKeys.has("arrowright")) {
            walkControls.moveRight(speed);
          }
          if (pressedKeys.has("q")) camera.position.y -= speed;
          if (pressedKeys.has("e")) camera.position.y += speed;
          if (activeModel) {
            camera.position.y = THREE.MathUtils.clamp(
              camera.position.y,
              activeModel.bounds.min.y + 0.1,
              activeModel.bounds.max.y + 3,
            );
          }
        } else {
          controls.update();
        }
        renderer.render(scene, camera);
        animationFrame = requestAnimationFrame(render);
      };
      render();

      runtimeRef.current = {
        setModel,
        clearSelection,
        setNavigationMode,
        frameAll,
        zoom,
        focusSelection,
        setView,
        isolateSelection: showOnlySelection,
        hideSelection,
        showAll,
        enterWalk,
        lockWalk: () => walkControls.lock(),
        dispose: () => cleanup(),
      };
      setNavigationMode(navigationModeRef.current);
      if (modelRef.current) setModel(modelRef.current);

      cleanup = () => {
        cancelAnimationFrame(animationFrame);
        observer.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onNavigationPointerDown, true);
        renderer.domElement.removeEventListener("pointerdown", onPointerDown);
        renderer.domElement.removeEventListener("pointerup", onPointerUp);
        renderer.domElement.removeEventListener("dblclick", onDoubleClick);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onWindowBlur);
        walkControls.removeEventListener("lock", onWalkLock);
        walkControls.removeEventListener("unlock", onWalkUnlock);
        if (walkControls.isLocked) walkControls.unlock();
        clearSelection();
        if (activeModel) scene.remove(activeModel.group);
        controls.dispose();
        walkControls.dispose();
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
    setVisibilityModified(false);
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

  const activateMode = (mode: NavigationMode) => {
    navigationModeRef.current = mode;
    setNavigationMode(mode);
    if (mode === "walk") runtimeRef.current?.enterWalk();
    else runtimeRef.current?.setNavigationMode(mode);
  };

  const runStandardView = (view: StandardView) => {
    activateMode("select");
    runtimeRef.current?.setView(view);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        ref={containerRef}
        className={`relative min-h-80 overflow-hidden rounded-xl bg-secondary fullscreen:h-screen fullscreen:min-h-screen fullscreen:rounded-none ${className}`}
        data-ifc-viewer-state={status.state}
      >
        <div ref={mountRef} className="absolute inset-0" />

        {status.state === "ready" && (
          <>
            <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-6rem)] flex-wrap items-center gap-1 rounded-lg border border-border bg-background/95 p-1 shadow-md backdrop-blur">
              <ToolButton
                label="Inspect: click to select, drag to orbit"
                active={navigationMode === "select"}
                onClick={() => activateMode("select")}
                wide
              >
                <MousePointer2 className="size-4" />
                <span className="hidden sm:inline">Inspect</span>
              </ToolButton>
              <ToolButton
                label="Pan across the view"
                active={navigationMode === "pan"}
                onClick={() => activateMode("pan")}
                wide
              >
                <Hand className="size-4" />
                <span className="hidden sm:inline">Pan</span>
              </ToolButton>
              <ToolButton
                label="Walk inside the building"
                active={navigationMode === "walk"}
                onClick={() => activateMode("walk")}
                wide
              >
                <Footprints className="size-4" />
                <span className="hidden sm:inline">Walk</span>
              </ToolButton>
              <span className="mx-0.5 h-6 w-px bg-border" />
              <ToolButton
                label="Fit model in view"
                onClick={() => runtimeRef.current?.frameAll()}
                wide
              >
                <Home className="size-4" />
                <span className="hidden sm:inline">Fit</span>
              </ToolButton>
              <ToolButton
                label="Zoom in"
                disabled={navigationMode === "walk"}
                onClick={() => runtimeRef.current?.zoom(0.72)}
              >
                <ZoomIn className="size-4" />
              </ToolButton>
              <ToolButton
                label="Zoom out"
                disabled={navigationMode === "walk"}
                onClick={() => runtimeRef.current?.zoom(1.38)}
              >
                <ZoomOut className="size-4" />
              </ToolButton>
              <ToolButton
                label="Full screen"
                onClick={() => void containerRef.current?.requestFullscreen()}
              >
                <Maximize2 className="size-4" />
              </ToolButton>
            </div>

            <div className="absolute right-3 top-3 z-10 w-[82px] rounded-lg border border-border bg-background/95 p-1.5 shadow-md backdrop-blur">
              <div className="mb-1 flex items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Box className="size-3" /> Views
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(
                  [
                    ["top", "Top"],
                    ["front", "Front"],
                    ["right", "Right"],
                    ["isometric", "3D"],
                  ] as const
                ).map(([view, label]) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => runStandardView(view)}
                    className="h-7 rounded bg-secondary text-[10px] font-semibold hover:bg-primary hover:text-primary-foreground"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

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

        {navigationMode === "walk" && status.state === "ready" && !walkLocked && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/20 p-6 backdrop-blur-[1px]">
            <div className="max-w-sm rounded-2xl border border-white/20 bg-background/95 p-6 text-center shadow-xl">
              <Footprints className="mx-auto size-8 text-primary" />
              <p className="mt-3 text-base font-semibold">Walk inside the building</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Use W A S D or arrow keys to move, the mouse to look, Q/E to change height, Shift to
                move faster, and Esc to release the mouse.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => runtimeRef.current?.lockWalk()}
                  className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Start / resume walk
                </button>
                <button
                  type="button"
                  onClick={() => activateMode("select")}
                  className="h-9 rounded-md border border-border bg-background px-4 text-xs font-semibold hover:bg-secondary"
                >
                  Exit walk
                </button>
              </div>
            </div>
          </div>
        )}

        {navigationMode === "walk" && walkLocked && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary-foreground/90 drop-shadow" />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-primary-foreground/90 drop-shadow" />
          </div>
        )}

        {!selected && navigationMode === "select" && status.state === "ready" && (
          <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-sm rounded-xl border border-primary/20 bg-background/95 p-3 shadow-md backdrop-blur">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <MousePointer2 className="size-4 text-primary" /> Start by selecting an element
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Click a wall, slab, column, door, or service. Drag anywhere to orbit, use the wheel to
              zoom, and middle/right-drag to pan.
            </p>
          </div>
        )}

        {selected && navigationMode !== "walk" && (
          <div className="absolute bottom-4 left-4 z-10 max-w-[calc(100%-2rem)] rounded-xl border border-border bg-background/95 p-3 shadow-md backdrop-blur">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">
                  {selected.name ?? formatIfcTypeName(selected.typeName)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatIfcTypeName(selected.typeName)} · IFC #{selected.expressID}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <ToolButton
                  label="Focus selected element"
                  onClick={() => runtimeRef.current?.focusSelection()}
                >
                  <Focus className="size-4" />
                </ToolButton>
                <ToolButton
                  label="Isolate selected element"
                  onClick={() => runtimeRef.current?.isolateSelection()}
                >
                  <Scan className="size-4" />
                </ToolButton>
                <ToolButton
                  label="Hide selected element"
                  onClick={() => runtimeRef.current?.hideSelection()}
                >
                  <EyeOff className="size-4" />
                </ToolButton>
              </div>
            </div>
          </div>
        )}

        {visibilityModified && status.state === "ready" && navigationMode !== "walk" && (
          <button
            type="button"
            onClick={() => runtimeRef.current?.showAll()}
            className="absolute bottom-4 right-4 z-10 flex h-9 items-center gap-2 rounded-lg border border-border bg-background/95 px-3 text-xs font-semibold shadow-md hover:bg-secondary"
          >
            <Eye className="size-4 text-primary" /> Show all
          </button>
        )}

        {status.state === "ready" && (
          <span className="pointer-events-none absolute bottom-3 right-3 max-w-[min(520px,calc(100%-2rem))] rounded bg-background/80 px-2 py-1 text-right text-[10px] text-muted-foreground backdrop-blur">
            {navigationMode === "walk" && walkLocked
              ? `${modeHelp.walk} · Esc to release`
              : modeHelp[navigationMode]}
            {navigationMode === "select" ? " · Double-click or F to focus" : ""}
          </span>
        )}
      </div>
    </TooltipProvider>
  );
}
