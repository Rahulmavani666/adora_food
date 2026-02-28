"use client";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { CalendarIcon, Info } from "lucide-react";

/** Accepts both Firestore Timestamp and string "YYYY-MM-DD" */
function parseDateSafe(date: any): Date | null {
  if (!date) return null;
  if (typeof date === "string") {
    // Prevent timezone off-by-one: force midnight local time
    return new Date(`${date}T00:00:00`);
  }
  if (date?.seconds) return new Date(date.seconds * 1000);
  return null;
}

type EventDoc = {
  id: string;
  title: string;
  expect?: string;
  createdBy?: string;
  date: any; // string or Timestamp
  _path?: string; // for dedupe/debug
  orgName:string
};

export default function ClientCalendar() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const month = today.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    setErrors([]);
    const unsubs: Array<() => void> = [];
    const seen = new Map<string, EventDoc>();

    // Listener A: root collection "events"
    try {
      const qRoot = query(collection(db, "events"), orderBy("date", "asc"));
      const unsubA = onSnapshot(
        qRoot,
        (snap) => {
          snap.docs.forEach((doc) => {
            const d = { id: doc.id, ...doc.data(), _path: doc.ref.path } as EventDoc;
            seen.set(doc.ref.path, d);
          });
          setEvents(Array.from(seen.values()));
          setLoading(false);
        },
        (err) => {
          setErrors((e) => [...e, `root(events): ${err.message}`]);
          setLoading(false);
        }
      );
      unsubs.push(unsubA);
    } catch (e: any) {
      setErrors((prev) => [...prev, `root(events) setup: ${e?.message || e}`]);
    }

    // Listener B: events_by_month/{YYYY-MM}/events
    try {
      const qByMonth = query(
        collection(db, "events_by_month", monthKey, "events"),
        orderBy("date", "asc")
      );
      const unsubB = onSnapshot(
        qByMonth,
        (snap) => {
          snap.docs.forEach((doc) => {
            const d = { id: doc.id, ...doc.data(), _path: doc.ref.path } as EventDoc;
            seen.set(doc.ref.path, d);
          });
          setEvents(Array.from(seen.values()));
          setLoading(false);
        },
        (err) => {
          setErrors((e) => [...e, `byMonth(${monthKey}/events): ${err.message}`]);
          setLoading(false);
        }
      );
      unsubs.push(unsubB);
    } catch (e: any) {
      setErrors((prev) => [...prev, `byMonth setup: ${e?.message || e}`]);
    }

    // Optional Listener C: if you store per restaurant under subcollection "events"
    // const unsubC = onSnapshot(
    //   query(collectionGroup(db, "events"), orderBy("date", "asc")),
    //   ...
    // );

    return () => unsubs.forEach((u) => u());
  }, [db, monthKey]);

  // Build days for current month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString()),
  ];
// Filter events to this month (in case root has all months)
  const monthEvents = useMemo(() => {
    return events.filter((e) => {
      const d = parseDateSafe(e.date);
      return (
        d &&
        d.getFullYear() === year &&
        d.getMonth() === month
      );
    });
  }, [events, month, year]);
  


  // inside dayEvents filtering
  // const dayEvents = events.filter((e) => {
  //   let d;
  
  //   if (e.date?.seconds) {
  //     // Firestore Timestamp
  //     d = new Date(e.date.seconds * 1000);
  //   } else {
  //     // Stored as string
  //     d = new Date(e.date);
  //   }
  
  //   return (
  //     d.getFullYear() === year &&
  //     d.getMonth() === month &&
  //     d.getDate() === dayNum
  //   );
  // });
  


  return (
    <section id="calendar">
      <div className="rounded-xl border border-white/10 bg-gray-900/70 p-5 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CalendarIcon size={18} className="text-violet-400" />
            Event Calendar
          </h3>
          <span className="text-sm text-gray-400">
            {today.toLocaleString("default", { month: "long" })} {year}
          </span>
        </div>

        {/* Status */}
        {loading && (
          <div className="mb-3 text-xs text-gray-400">Loading events…</div>
        )}
        {!loading && monthEvents.length === 0 && (
          <div className="mb-3 text-xs text-amber-300">
            No events for {monthKey}. Add one to see it here.
          </div>
        )}
        {errors.length > 0 && (
          <div className="mb-3 text-xs text-rose-300">
            {errors.map((e, i) => (
              <div key={i}>⚠️ {e}</div>
            ))}
          </div>
        )}

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-400 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {cells.map((c, idx) => {
            const dayNum = Number(c);
            const isToday = c && dayNum === today.getDate();

            const dayEvents = monthEvents.filter((ev) => {
              const d = parseDateSafe(ev.date);
              return d && d.getDate() === dayNum;
            });

            return (
              <div
                key={idx}
                className={`h-20 rounded-lg border border-gray-800 flex flex-col items-start p-1 transition-all
                  ${isToday ? "bg-violet-600/30 border-violet-400" : "bg-gray-900 hover:bg-gray-800"}
                `}
              >
                <div
                  className={`text-[11px] self-end ${
                    isToday ? "text-violet-300 font-bold" : "text-gray-400"
                  }`}
                >
                  {c || ""}
                </div>

                {dayEvents.map((ev) => (
                  <button
                    key={ev.id + ev._path}
                    onClick={() => setSelectedEvent(ev)}
                    className="mt-1 w-full text-[10px] px-1 py-[2px] rounded-md bg-amber-400/20 text-amber-300 truncate hover:bg-amber-400/40 transition text-left"
                    title={ev.title}
                  >
                    • {ev.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-80 border border-white/10">
            <h4 className="text-lg font-semibold text-violet-300 mb-2 flex items-center gap-2">
              <Info size={16} /> {selectedEvent.title}
            </h4>
            <p className="text-sm text-gray-300 mb-1">
              📅 Date:{" "}
              {parseDateSafe(selectedEvent.date)?.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {selectedEvent.expect && (
              <p className="text-sm text-gray-300 mb-1">
                ✨ Expected food surplus: {selectedEvent.expect}
              </p>
            )}
            {selectedEvent.orgName && (
              <p className="text-sm text-gray-400">
                organisation name : {selectedEvent.orgName}
              </p>
            )}
            <button
              className="mt-4 w-full bg-violet-600 hover:bg-violet-500 text-white text-sm py-2 rounded-lg transition"
              onClick={() => setSelectedEvent(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
