import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import type { IfcAPI, IfcGeometry, PlacedGeometry } from "web-ifc";
import type {
  IfcElementMetadata,
  IfcLoadProgress,
  IfcModelSummary,
  IfcSource,
  LoadedIfcModel,
} from "./ifc-types";
import {
  elementMetadataFromLine,
  estimateIfcQuantitiesFromBounds,
  type IfcLineLike,
} from "./ifc-utils";

export type LoadIfcModelOptions = {
  /** URL emitted by importing `web-ifc/web-ifc.wasm?url`. */
  wasmUrl: string;
  onProgress?: (progress: IfcLoadProgress) => void;
  signal?: AbortSignal;
};

type ElementRecord = {
  typeCode: number;
  typeName: string;
};

function report(callback: LoadIfcModelOptions["onProgress"], progress: IfcLoadProgress) {
  callback?.(progress);
}

function throwIfAborted(signal: AbortSignal | undefined) {
  if (signal?.aborted) throw new DOMException("IFC loading was cancelled.", "AbortError");
}

async function sourceToBytes(source: IfcSource): Promise<Uint8Array> {
  if (source instanceof Uint8Array) {
    return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
  }
  if (source instanceof ArrayBuffer) return new Uint8Array(source);
  return new Uint8Array(await source.arrayBuffer());
}

function geometryFromIfc(api: IfcAPI, geometry: IfcGeometry) {
  const vertexData = api.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
  const indexData = api.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());

  // web-ifc interleaves each position with its normal: x, y, z, nx, ny, nz.
  const vertices = new Float32Array(vertexData);
  const indices = new Uint32Array(indexData);
  const interleavedVertices = new InterleavedBuffer(vertices, 6);
  const result = new BufferGeometry();
  result.setAttribute("position", new InterleavedBufferAttribute(interleavedVertices, 3, 0, false));
  result.setAttribute("normal", new InterleavedBufferAttribute(interleavedVertices, 3, 3, false));
  result.setIndex(new BufferAttribute(indices, 1));
  result.computeBoundingBox();
  return result;
}

function materialKey(placed: PlacedGeometry) {
  const { x, y, z, w } = placed.color;
  return `${x.toFixed(4)}:${y.toFixed(4)}:${z.toFixed(4)}:${w.toFixed(4)}`;
}

function createMaterial(placed: PlacedGeometry) {
  const alpha = Math.max(0, Math.min(1, placed.color.w));
  return new MeshStandardMaterial({
    color: new Color(placed.color.x, placed.color.y, placed.color.z),
    metalness: 0.05,
    roughness: 0.82,
    opacity: alpha,
    transparent: alpha < 0.999,
    depthWrite: alpha >= 0.999,
  });
}

function readLine(api: IfcAPI, modelID: number, expressID: number): IfcLineLike | null {
  try {
    const line = api.GetLine(modelID, expressID) as unknown;
    return typeof line === "object" && line !== null ? (line as IfcLineLike) : null;
  } catch {
    return null;
  }
}

/**
 * Parses an IFC source and returns a Three.js scene group with semantic IDs.
 * The returned object owns WASM/model/Three resources and must be disposed.
 */
export async function loadIfcModel(
  source: IfcSource,
  options: LoadIfcModelOptions,
): Promise<LoadedIfcModel> {
  const { IfcAPI } = await import("web-ifc");
  throwIfAborted(options.signal);
  report(options.onProgress, {
    stage: "initializing",
    completed: 0,
    total: 1,
    message: "Starting the IFC geometry engine…",
  });

  const api = new IfcAPI();
  let modelID: number | null = null;
  const group = new Group();
  group.name = "IFC model";
  // IFC coordinates are Z-up; BuildYard's Three.js views are Y-up.
  group.rotation.x = -Math.PI / 2;

  const geometries = new Map<number, BufferGeometry>();
  const materials = new Map<string, MeshStandardMaterial>();
  const elements = new Map<number, ElementRecord>();
  const elementBounds = new Map<number, Box3>();
  const metadata = new Map<number, IfcElementMetadata>();
  let disposed = false;

  const disposeThreeResources = () => {
    for (const geometry of geometries.values()) geometry.dispose();
    for (const material of materials.values()) material.dispose();
    geometries.clear();
    materials.clear();
    group.clear();
  };

  try {
    await api.Init((path) => (path.endsWith(".wasm") ? options.wasmUrl : path), true);
    throwIfAborted(options.signal);
    report(options.onProgress, {
      stage: "initializing",
      completed: 1,
      total: 1,
      message: "IFC geometry engine is ready.",
    });

    const bytes = await sourceToBytes(source);
    throwIfAborted(options.signal);
    report(options.onProgress, {
      stage: "opening",
      completed: 0,
      total: 1,
      message: "Reading IFC entities…",
    });

    modelID = api.OpenModel(bytes, {
      COORDINATE_TO_ORIGIN: true,
      CIRCLE_SEGMENTS: 16,
    });
    if (modelID < 0) throw new Error("The IFC file could not be opened.");
    const schema = api.GetModelSchema(modelID);
    report(options.onProgress, {
      stage: "opening",
      completed: 1,
      total: 1,
      message: `Opened ${schema || "IFC"} model.`,
    });

    let triangleCount = 0;
    let placedGeometryCount = 0;
    const typeCounts: Record<string, number> = {};

    api.StreamAllMeshes(modelID, (flatMesh, index, total) => {
      throwIfAborted(options.signal);
      const line = readLine(api, modelID!, flatMesh.expressID);
      const typeCode = line?.type ?? 0;
      const typeName = api.GetNameFromTypeCode(typeCode) || "IFCUNKNOWN";
      elements.set(flatMesh.expressID, { typeCode, typeName });
      typeCounts[typeName] = (typeCounts[typeName] ?? 0) + 1;

      for (let position = 0; position < flatMesh.geometries.size(); position += 1) {
        const placed = flatMesh.geometries.get(position);
        let threeGeometry = geometries.get(placed.geometryExpressID);
        if (!threeGeometry) {
          const ifcGeometry = api.GetGeometry(modelID!, placed.geometryExpressID);
          try {
            threeGeometry = geometryFromIfc(api, ifcGeometry);
          } finally {
            ifcGeometry.delete();
          }
          geometries.set(placed.geometryExpressID, threeGeometry);
        }

        const key = materialKey(placed);
        let material = materials.get(key);
        if (!material) {
          material = createMaterial(placed);
          materials.set(key, material);
        }

        const mesh = new Mesh(threeGeometry, material);
        mesh.name = `${typeName} #${flatMesh.expressID}`;
        mesh.matrixAutoUpdate = false;
        mesh.matrix.copy(new Matrix4().fromArray(placed.flatTransformation));
        mesh.userData["ifcExpressID"] = flatMesh.expressID;
        mesh.userData["ifcType"] = typeName;
        group.add(mesh);

        const localBounds = threeGeometry.boundingBox;
        if (localBounds) {
          const transformedBounds = localBounds.clone().applyMatrix4(mesh.matrix);
          const accumulatedBounds = elementBounds.get(flatMesh.expressID);
          if (accumulatedBounds) accumulatedBounds.union(transformedBounds);
          else elementBounds.set(flatMesh.expressID, transformedBounds);
        }
        triangleCount += (threeGeometry.index?.count ?? 0) / 3;
        placedGeometryCount += 1;
      }

      report(options.onProgress, {
        stage: "geometry",
        completed: index + 1,
        total,
        message: `Building model geometry (${Math.min(index + 1, total)} of ${total})…`,
      });
    });

    throwIfAborted(options.signal);
    group.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(group);
    const summary: IfcModelSummary = {
      schema,
      elementCount: elements.size,
      geometryCount: placedGeometryCount,
      triangleCount: Math.round(triangleCount),
      typeCounts: Object.freeze({ ...typeCounts }),
    };

    report(options.onProgress, {
      stage: "metadata",
      completed: elements.size,
      total: elements.size,
      message: `Indexed ${elements.size.toLocaleString()} selectable elements.`,
    });
    report(options.onProgress, {
      stage: "ready",
      completed: 1,
      total: 1,
      message: "Model is ready.",
    });

    return {
      group,
      bounds,
      summary,
      getElement: (expressID) => {
        if (disposed || modelID === null) return null;
        const record = elements.get(expressID);
        if (!record) return null;
        const cached = metadata.get(expressID);
        if (cached) return cached;
        const line = readLine(api, modelID, expressID);
        const baseElement = line
          ? elementMetadataFromLine(line, expressID, (typeCode) =>
              api.GetNameFromTypeCode(typeCode),
            )
          : {
              expressID,
              typeCode: record.typeCode,
              typeName: record.typeName,
              globalId: null,
              name: null,
              description: null,
              objectType: null,
              predefinedType: null,
            };
        const geometryBounds = elementBounds.get(expressID);
        const element = geometryBounds
          ? {
              ...baseElement,
              estimatedQuantities: estimateIfcQuantitiesFromBounds(
                geometryBounds.getSize(new Vector3()),
                record.typeName,
              ),
            }
          : baseElement;
        metadata.set(expressID, element);
        return element;
      },
      dispose: () => {
        if (disposed) return;
        disposed = true;
        disposeThreeResources();
        if (modelID !== null) api.CloseModel(modelID);
        modelID = null;
        metadata.clear();
        elements.clear();
        elementBounds.clear();
      },
    };
  } catch (error) {
    disposeThreeResources();
    if (modelID !== null) api.CloseModel(modelID);
    throw error;
  }
}
