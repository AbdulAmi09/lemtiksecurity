import { useEffect, useMemo, useState } from "react";

export type OfficerPermissionKey = "location" | "notifications" | "camera" | "microphone";
type OfficerPermissionStatus = "pending" | "granted" | "denied" | "skipped";

type PermissionConfig = {
  key: OfficerPermissionKey;
  title: string;
  description: string;
  required: boolean;
};

const STORAGE_KEY = "lemtik:officer-permissions:v1";

const PERMISSIONS: PermissionConfig[] = [
  {
    key: "location",
    title: "Location",
    description:
      "Lemtik needs your location to track patrols, confirm check-ins, and help dispatch you to incidents.",
    required: true,
  },
  {
    key: "notifications",
    title: "Notifications",
    description:
      "Lemtik sends alerts when you are dispatched or when a patrol check-in is approaching.",
    required: false,
  },
  {
    key: "camera",
    title: "Camera",
    description:
      "Lemtik uses the camera to photograph incident evidence at the scene.",
    required: false,
  },
  {
    key: "microphone",
    title: "Microphone",
    description:
      "Lemtik uses the microphone to record voice notes at incident scenes.",
    required: false,
  },
];

const INITIAL_STATE: Record<OfficerPermissionKey, OfficerPermissionStatus> = {
  location: "pending",
  notifications: "pending",
  camera: "pending",
  microphone: "pending",
};

function readStoredPermissions() {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<Record<OfficerPermissionKey, OfficerPermissionStatus>>;
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return INITIAL_STATE;
  }
}

export function useOfficerPermissions() {
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<Record<OfficerPermissionKey, OfficerPermissionStatus>>(INITIAL_STATE);

  useEffect(() => {
    setStatus(readStoredPermissions());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
  }, [hydrated, status]);

  const currentStep = useMemo(
    () => PERMISSIONS.find((step) => status[step.key] === "pending" || status[step.key] === "denied") ?? null,
    [status],
  );

  const completed = useMemo(
    () =>
      PERMISSIONS.every((step) => {
        const value = status[step.key];
        return value === "granted" || (!step.required && value === "skipped");
      }),
    [status],
  );

  const setPermission = (key: OfficerPermissionKey, value: OfficerPermissionStatus) => {
    setStatus((current) => ({ ...current, [key]: value }));
  };

  const requestCurrent = async () => {
    if (!currentStep || typeof window === "undefined") return false;

    if (currentStep.key === "location") {
      if (!navigator.geolocation) {
        setPermission("location", "denied");
        return false;
      }
      return await new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            setPermission("location", "granted");
            resolve(true);
          },
          () => {
            setPermission("location", "denied");
            resolve(false);
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
      });
    }

    if (currentStep.key === "notifications") {
      if (!("Notification" in window)) {
        setPermission("notifications", "skipped");
        return true;
      }
      const result = await Notification.requestPermission();
      if (result === "granted") {
        setPermission("notifications", "granted");
        return true;
      }
      setPermission("notifications", "denied");
      return false;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermission(currentStep.key, "skipped");
      return true;
    }

    try {
      const stream =
        currentStep.key === "camera"
          ? await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          : await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach((track) => track.stop());
      setPermission(currentStep.key, "granted");
      return true;
    } catch {
      setPermission(currentStep.key, "denied");
      return false;
    }
  };

  const skipCurrent = () => {
    if (!currentStep || currentStep.required) return;
    setPermission(currentStep.key, "skipped");
  };

  const reset = () => {
    setStatus(INITIAL_STATE);
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  };

  return {
    permissions: PERMISSIONS,
    currentStep,
    completed,
    status,
    requestCurrent,
    skipCurrent,
    reset,
  };
}
