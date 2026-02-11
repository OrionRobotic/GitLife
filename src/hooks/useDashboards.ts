import { useState, useEffect, useCallback } from "react";
import type { Dashboard } from "@/types/dashboard";

const STORAGE_KEY = "gitlife-dashboards";
const ACTIVE_KEY = "gitlife-active-dashboard";
const DEFAULT_TAB_KEY = "gitlife-default-tab";

interface DefaultTabConfig {
  name: string;
  color: string;
  habitIds: string[];
}

const DEFAULT_TAB_DEFAULTS: DefaultTabConfig = {
  name: "GitLife",
  color: "#fb923c", // orange-400
  habitIds: [],
};

function loadDefaultTab(): DefaultTabConfig {
  try {
    const raw = localStorage.getItem(DEFAULT_TAB_KEY);
    return raw ? { ...DEFAULT_TAB_DEFAULTS, ...JSON.parse(raw) } : DEFAULT_TAB_DEFAULTS;
  } catch {
    return DEFAULT_TAB_DEFAULTS;
  }
}

function loadDashboards(): Dashboard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadActiveDashboardId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function useDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>(loadDashboards);
  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(
    loadActiveDashboardId
  );
  const [defaultTab, setDefaultTab] = useState<DefaultTabConfig>(loadDefaultTab);

  // Sync dashboards to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
  }, [dashboards]);

  // Sync active dashboard id to localStorage
  useEffect(() => {
    if (activeDashboardId) {
      localStorage.setItem(ACTIVE_KEY, activeDashboardId);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [activeDashboardId]);

  // Sync default tab config to localStorage
  useEffect(() => {
    localStorage.setItem(DEFAULT_TAB_KEY, JSON.stringify(defaultTab));
  }, [defaultTab]);

  const updateDefaultTab = useCallback(
    (name: string, color: string, habitIds: string[]) => {
      setDefaultTab({ name, color, habitIds });
    },
    []
  );

  const createDashboard = useCallback(
    (name: string, habitIds: string[], color: string) => {
      const newDashboard: Dashboard = {
        id: crypto.randomUUID(),
        name,
        habitIds,
        color,
      };
      setDashboards((prev) => [...prev, newDashboard]);
      setActiveDashboardId(newDashboard.id);
    },
    []
  );

  const updateDashboard = useCallback(
    (id: string, name: string, habitIds: string[], color: string) => {
      setDashboards((prev) =>
        prev.map((d) => (d.id === id ? { ...d, name, habitIds, color } : d))
      );
    },
    []
  );

  const deleteDashboard = useCallback(
    (id: string) => {
      setDashboards((prev) => prev.filter((d) => d.id !== id));
      setActiveDashboardId((prev) => (prev === id ? null : prev));
    },
    []
  );

  const activeDashboard =
    dashboards.find((d) => d.id === activeDashboardId) ?? null;

  return {
    dashboards,
    activeDashboardId,
    activeDashboard,
    setActiveDashboardId,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    defaultTab,
    updateDefaultTab,
  };
}
