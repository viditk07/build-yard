import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Upload, Undo2, Trash2, Scissors, Box, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { detectWallRects, type WallRect } from "@/lib/plan-trace";


export const Route = createFileRoute("/visualiser/")({
  head: () => ({
    meta: [
      { title: "3D Floor Plan Visualiser — BuildYard" },
      {
        name: "description",
        content:
          "Upload your floor plan or drawing, trace the walls and see an instant 3D walkthrough model of your home.",
      },
      { property: "og:title", content: "3D Floor Plan Visualiser — BuildYard" },
      {
        property: "og:description",
        content: "Turn a floor plan drawing into a 3D model in your browser.",
      },
    ],
  }),
  component: Visualiser,
});

type Pt = { x: number; y: number };
type Chain = Pt[];

function Visualiser() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [aspect, setAspect] = useState(1);
  const [chains, setChains] = useState<Chain[]>([]);
  const [draft, setDraft] = useState<Chain>([]);
  const [planWidth, setPlanWidth] = useState(12);
  const [wallHeight, setWallHeight] = useState(3);
  const [thickness, setThickness] = useState(0.23);
  const [autoRects, setAutoRects] = useState<WallRect[]>([]);
  const [autoOn, setAutoOn] = useState(true);
  const [sensitivity, setSensitivity] = useState(1);
  const [detecting, setDetecting] = useState(false);
  const planeRef = useRef<HTMLDivElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);

  const runDetect = useCallback((img: HTMLImageElement, sens: number) => {
    setDetecting(true);
    // let the spinner paint before the synchronous pixel pass
    window.setTimeout(() => {
      try {
        const rects = detectWallRects(img, { sensitivity: sens });
        setAutoRects(rects);
        if (rects.length) toast.success(`Detected walls from your plan — ${rects.length} shapes extruded.`);
        else toast.message("No walls detected — try raising the sensitivity or trace manually.");
      } catch {
        toast.error("Could not read that image. Try a PNG or JPG export of the plan.");
      } finally {
        setDetecting(false);
      }
    }, 30);
  }, []);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image of your plan (PNG or JPG).");
      return;
    }
    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => {
      setAspect(probe.naturalHeight / probe.naturalWidth || 1);
      imgElRef.current = probe;
      runDetect(probe, sensitivity);
    };
    probe.src = url;
    setImgSrc(url);
    setChains([]);
    setDraft([]);
    setAutoRects([]);
  };


  const addPoint = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = planeRef.current;
    if (!el || !imgSrc) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setDraft((d) => [...d, { x, y }]);
  };

  const endChain = useCallback(() => {
    setDraft((d) => {
      if (d.length > 1) setChains((c) => [...c, d]);
      return [];
    });
  }, []);

  const undo = () => {
    if (draft.length) setDraft((d) => d.slice(0, -1));
    else setChains((c) => c.slice(0, -1));
  };

  const segments = useMemo(() => {
    const all: Array<[Pt, Pt]> = [];
    for (const c of [...chains, draft]) {
      for (let i = 1; i < c.length; i++) all.push([c[i - 1]!, c[i]!]);
    }
    return all;
  }, [chains, draft]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-spec text-primary">Plan to 3D</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Floor plan visualiser</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Upload a drawing or floor plan — the walls are detected automatically and
        extruded into a 3D model you can orbit. Fine-tune with the sensitivity slider
        or trace extra walls by hand. Everything runs in your browser.
      </p>


      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="surface-card rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                <Upload className="size-4" /> Upload plan
              </span>
            </label>
            <Button variant="outline" size="sm" onClick={endChain} disabled={draft.length < 2}>
              <Scissors className="size-4" /> End wall run
            </Button>
            <Button variant="outline" size="sm" onClick={undo} disabled={!segments.length}>
              <Undo2 className="size-4" /> Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChains([]);
                setDraft([]);
              }}
              disabled={!segments.length}
            >
              <Trash2 className="size-4" /> Clear
            </Button>
            <Button
              variant={autoOn ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoOn((v) => !v)}
              disabled={!imgSrc}
            >
              <Wand2 className="size-4" /> Auto walls {autoOn ? "on" : "off"}
            </Button>
          </div>

          {imgSrc && autoOn && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-spec whitespace-nowrap text-muted-foreground">
                Detection sensitivity
              </span>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.05}
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                onMouseUp={() =>
                  imgElRef.current && runDetect(imgElRef.current, sensitivity)
                }
                onTouchEnd={() =>
                  imgElRef.current && runDetect(imgElRef.current, sensitivity)
                }
                className="h-1.5 w-full accent-primary"
              />
              <span className="text-xs tabular-nums text-muted-foreground">
                {detecting ? "…" : autoRects.length}
              </span>
            </div>
          )}


          <div
            ref={planeRef}
            onClick={addPoint}
            onDoubleClick={endChain}
            className="relative mt-4 aspect-[4/3] w-full cursor-crosshair overflow-hidden rounded-lg border border-border bg-secondary"
          >
            {imgSrc ? (
              <img
                src={imgSrc}
                alt="Uploaded floor plan"
                className="pointer-events-none absolute inset-0 size-full object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Upload a floor plan image to start tracing walls.
              </div>
            )}
            <svg
              className="pointer-events-none absolute inset-0 size-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {autoOn &&
                autoRects.map((r, i) => (
                  <rect
                    key={`a${i}`}
                    x={r.x * 100}
                    y={r.y * 100}
                    width={r.w * 100}
                    height={r.h * 100}
                    fill="var(--color-primary)"
                    opacity={0.35}
                  />
                ))}

              {segments.map(([a, b], i) => (
                <line
                  key={i}
                  x1={a.x * 100}
                  y1={a.y * 100}
                  x2={b.x * 100}
                  y2={b.y * 100}
                  stroke="var(--color-primary)"
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {[...chains.flat(), ...draft].map((p, i) => (
                <circle
                  key={i}
                  cx={p.x * 100}
                  cy={p.y * 100}
                  r={0.7}
                  fill="var(--color-primary)"
                />
              ))}
            </svg>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <NumberField
              label="Plan width (m)"
              value={planWidth}
              min={2}
              max={80}
              step={0.5}
              onChange={setPlanWidth}
            />
            <NumberField
              label="Wall height (m)"
              value={wallHeight}
              min={2}
              max={6}
              step={0.1}
              onChange={setWallHeight}
            />
            <NumberField
              label="Wall thickness (m)"
              value={thickness}
              min={0.08}
              max={0.6}
              step={0.01}
              onChange={setThickness}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Click to drop wall points, double-click to finish a run. Set the plan width
            to the real overall width of the drawing so the 3D model is to scale.
          </p>
        </section>

        <section className="surface-card overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Box className="size-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">3D model</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {autoOn && autoRects.length
                ? `auto-detected + ${segments.length} traced`
                : `${segments.length} wall${segments.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <Scene
            segments={segments}
            autoRects={autoOn ? autoRects : []}
            aspect={aspect}
            planWidth={planWidth}
            wallHeight={wallHeight}
            thickness={thickness}
            imgSrc={imgSrc}
          />

        </section>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="block">
      <span className="text-spec text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || min)}
        className="mt-1.5 w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-sm"
      />
    </label>
  );
}

type RebuildArgs = {
  segments: Array<[Pt, Pt]>;
  autoRects: WallRect[];
  aspect: number;
  planWidth: number;
  wallHeight: number;
  thickness: number;
  imgSrc: string | null;
};

function Scene(props: RebuildArgs) {
  const { segments, autoRects, aspect, planWidth, wallHeight, thickness, imgSrc } = props;
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ rebuild: (args: RebuildArgs) => void } | null>(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );
      const mount = mountRef.current;
      if (disposed || !mount) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#eceae4");

      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.set(12, 12, 16);

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true });
      } catch {
        setFailed(true);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.maxPolarAngle = Math.PI / 2.05;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9382, 1.5));
      const sun = new THREE.DirectionalLight(0xffffff, 1.6);
      sun.position.set(10, 18, 8);
      scene.add(sun);

      const group = new THREE.Group();
      scene.add(group);

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xf2efe8,
        roughness: 0.9,
      });
      const loader = new THREE.TextureLoader();

      const unitBox = new THREE.BoxGeometry(1, 1, 1);

      const rebuild = (args: RebuildArgs) => {

        group.clear();
        const depth = args.planWidth * args.aspect;

        const floorMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 1,
        });
        if (args.imgSrc) floorMat.map = loader.load(args.imgSrc);
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(args.planWidth, depth),
          floorMat,
        );
        floor.rotation.x = -Math.PI / 2;
        group.add(floor);

        const grid = new THREE.GridHelper(
          Math.max(args.planWidth, depth) * 1.6,
          24,
          0xc9c4b8,
          0xdedad1,
        );
        grid.position.y = -0.01;
        group.add(grid);

        if (args.autoRects.length) {
          const inst = new THREE.InstancedMesh(unitBox, wallMat, args.autoRects.length);
          const m = new THREE.Matrix4();
          const q = new THREE.Quaternion();
          const pos = new THREE.Vector3();
          const scl = new THREE.Vector3();
          let n = 0;
          for (const r of args.autoRects) {
            const w = Math.max(r.w * args.planWidth, args.thickness * 0.5);
            const d = Math.max(r.h * depth, args.thickness * 0.5);
            pos.set(
              (r.x + r.w / 2 - 0.5) * args.planWidth,
              args.wallHeight / 2,
              (r.y + r.h / 2 - 0.5) * depth,
            );
            scl.set(w, args.wallHeight, d);
            m.compose(pos, q, scl);
            inst.setMatrixAt(n++, m);
          }
          inst.count = n;
          inst.instanceMatrix.needsUpdate = true;
          group.add(inst);
        }


        for (const [a, b] of args.segments) {
          const ax = (a.x - 0.5) * args.planWidth;
          const az = (a.y - 0.5) * depth;
          const bx = (b.x - 0.5) * args.planWidth;
          const bz = (b.y - 0.5) * depth;
          const len = Math.hypot(bx - ax, bz - az);
          if (len < 0.01) continue;
          const wall = new THREE.Mesh(
            new THREE.BoxGeometry(len, args.wallHeight, args.thickness),
            wallMat,
          );
          wall.position.set((ax + bx) / 2, args.wallHeight / 2, (az + bz) / 2);
          wall.rotation.y = -Math.atan2(bz - az, bx - ax);
          group.add(wall);
        }
      };

      apiRef.current = { rebuild };
      setReady(true);

      const resize = () => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(mount);

      let raf = 0;
      const tick = () => {
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        controls.dispose();
        renderer.dispose();
        mount.removeChild(renderer.domElement);
        apiRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    apiRef.current?.rebuild({
      segments,
      autoRects,
      aspect,
      planWidth,
      wallHeight,
      thickness,
      imgSrc,
    });
  }, [ready, segments, autoRects, aspect, planWidth, wallHeight, thickness, imgSrc]);


  return (
    <div className="relative h-[420px] w-full lg:h-[560px]">
      <div ref={mountRef} className="size-full" />
      {failed && (
        <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
          3D preview needs a browser with WebGL enabled.
        </p>
      )}
    </div>
  );
}
