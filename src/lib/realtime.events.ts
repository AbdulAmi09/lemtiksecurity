import { useEffect, useRef, useState } from "react";

export type RealtimeRoom = `org:${string}` | `officer:${string}`;

export type RealtimeEventName =
  | "incident:created"
  | "incident:updated"
  | "officer:pinged"
  | "autonomous:approved"
  | "patrol:checkin"
  | "incident:new"
  | "alert:inventory"
  | "alert:patrol:missed"
  | "agent:analysis:ready"
  | "autonomous:executed"
  | "autonomous:reverted"
  | "officer:location"
  | "officer:dispatch"
  | "officer:ping"
  | "shift:reminder"
  | "incident:assigned";

export type RealtimeEventDetail<T = unknown> = {
  room: RealtimeRoom;
  event: RealtimeEventName;
  payload: T;
  at: string;
};

const CHANNEL_PREFIX = "lemtik.realtime.";
const LOCAL_EVENT = "lemtik:realtime";

function canUseDom() {
  return typeof window !== "undefined";
}

export function orgRoom(orgId: string) {
  return `org:${orgId}` as const;
}

export function officerRoom(officerId: string) {
  return `officer:${officerId}` as const;
}

export function publishRealtimeEvent<T = unknown>(room: RealtimeRoom, event: RealtimeEventName, payload: T) {
  if (!canUseDom()) return;
  const detail: RealtimeEventDetail<T> = { room, event, payload, at: new Date().toISOString() };
  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(`${CHANNEL_PREFIX}${room}`);
      channel.postMessage(detail);
      channel.close();
    }
  } catch {
    // Ignore and fall back to the local event bus.
  }
  window.dispatchEvent(new CustomEvent<RealtimeEventDetail<T>>(LOCAL_EVENT, { detail }));
}

export function useRealtimeRoomEvents<T = unknown>(
  room: RealtimeRoom | null,
  handler: (event: RealtimeEventDetail<T>) => void,
) {
  const handlerRef = useRef(handler);
  const [supported] = useState(() => canUseDom());

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!supported || !room) return;
    const bc = "BroadcastChannel" in window ? new BroadcastChannel(`${CHANNEL_PREFIX}${room}`) : null;
    const onMessage = (detail: RealtimeEventDetail<T>) => {
      if (detail.room === room) handlerRef.current(detail);
    };
    const onLocal = (e: Event) => {
      const detail = (e as CustomEvent<RealtimeEventDetail<T>>).detail;
      if (detail?.room === room) handlerRef.current(detail);
    };
    bc?.addEventListener("message", (message) => onMessage(message.data as RealtimeEventDetail<T>));
    window.addEventListener(LOCAL_EVENT, onLocal as EventListener);
    return () => {
      bc?.close();
      window.removeEventListener(LOCAL_EVENT, onLocal as EventListener);
    };
  }, [room, supported]);
}

export function useRealtimeEventFeed<T = unknown>(room: RealtimeRoom | null, maxItems = 6) {
  const [events, setEvents] = useState<Array<RealtimeEventDetail<T>>>([]);
  useRealtimeRoomEvents<T>(room, (event) => {
    setEvents((current) => [event, ...current].slice(0, maxItems));
  });
  return events;
}
