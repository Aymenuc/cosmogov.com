"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
interface RoomSummary {
  code: string;
  topic: string;
}
const message = (err: unknown) =>
  err instanceof Error ? err.message : "Connection interrupted. Try again.";
async function request(path: string, body?: Record<string, unknown>) {
  const res = await fetch(
    path,
    body
      ? {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
        }
      : { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "The room is unavailable.");
  return data;
}

export function useRoom<V extends { code: string; stage: string; now: number }>(
  host: boolean,
  initialCode: string,
  endpoint: string,
  hostPath: string,
  joinPath: string,
) {
  const router = useRouter();
  const code = initialCode.trim().toUpperCase();
  const [room, setRoom] = useState<V | null>(null);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const active = room?.code === code ? room : null;
  const joined = Boolean(active);
  const done = active?.stage === "recap";
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      let again = false;
      try {
        if (!code) {
          if (host) {
            const list = await request(endpoint);
            if (!stopped) setRooms(list);
          }
        } else {
          const res = await fetch(
            endpoint +
              "?code=" +
              encodeURIComponent(code) +
              (host ? "&host=1" : ""),
            { cache: "no-store" },
          );
          if (!(res.status === 403 && !host && !joined)) {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (!stopped)
              setRoom((old) =>
                old && old.code === code && old.now > data.now ? old : data,
              );
            again = data.stage !== "recap";
          }
        }
        if (!stopped) setError("");
      } catch (err) {
        if (!stopped) setError(message(err));
        again = joined && !done;
      } finally {
        if (!stopped) {
          setLoaded(true);
          if (again) timer = setTimeout(poll, document.hidden ? 6500 : 2200);
        }
      }
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [code, host, joined, done, endpoint]);
  const [formError, setFormError] = useState("");
  const send: (action: Record<string, unknown>) => Promise<boolean> = async (
    action,
  ) => {
    if (busy) return false;
    setBusy(true);
    setFormError("");
    try {
      const data = await request(endpoint, { code, ...action });
      setRoom(data);
      setError("");
      if (data.code !== code)
        router.push((host ? hostPath : joinPath) + "?room=" + data.code, {
          scroll: false,
        });
      return true;
    } catch (err) {
      setFormError(message(err));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { active, code, rooms, busy, loaded, error: formError || error, send };
}
