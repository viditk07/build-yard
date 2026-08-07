import { useCallback, useEffect, useState } from "react";
import {
  getCategoryStates,
  getProject,
  listProjectDocuments,
  listProjects,
  subscribeProjectStore,
} from "@/lib/project-store";
import type { CategoryState, Project, ProjectDocument } from "@/lib/project-types";

export function useProjects(): { projects: Project[]; ready: boolean } {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setProjects(listProjects());
      setReady(true);
    };
    refresh();
    return subscribeProjectStore(refresh);
  }, []);

  return { projects, ready };
}

export function useProjectWorkspace(projectId: string): {
  project: Project | undefined;
  documents: ProjectDocument[];
  categoryStates: CategoryState[];
  ready: boolean;
  refresh: () => void;
} {
  const [project, setProject] = useState<Project>();
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [categoryStates, setCategoryStates] = useState<CategoryState[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setProject(getProject(projectId));
    setDocuments(listProjectDocuments(projectId));
    setCategoryStates(getCategoryStates(projectId));
    setReady(true);
  }, [projectId]);

  useEffect(() => {
    refresh();
    return subscribeProjectStore(refresh);
  }, [refresh]);

  return { project, documents, categoryStates, ready, refresh };
}
