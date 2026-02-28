"use client";
import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc,getDoc,addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Plus, CalendarIcon } from "lucide-react";
import { Timestamp } from "firebase/firestore";


export default function EventIntegration({ today, year, cells, eventPrompts, setForm }: any) {
 
     
   const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [expect, setExpect] = useState("");
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const user = auth.currentUser;

if (user) {
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.data();

  

    await addDoc(collection(db, "events"), {
      title,
      date: Timestamp.fromDate(new Date(date)),
      expect,
      createdAt: Timestamp.now(),
      createdBy:  auth.currentUser?.uid,
      orgName: userData?.orgName || "Unknown", // ✅ save orgName
    });


  }
    setTitle("");
    setDate("");
    setExpect("");
  };

  return (
    <section id="events" className="rounded-2xl border border-gray-800 bg-gray-900/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Event Integration</h3>
        <span className="text-xs text-gray-400">Auto-prompts after big events</span>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Mini calendar */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-300">
              {today.toLocaleString("default", { month: "long" })} {year}
            </div>
            <CalendarIcon size={16} className="text-violet-400" />
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-400 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((c: any, idx: number) => {
              const dayNum = Number(c);
              const isToday = c && dayNum === today.getDate();
              const prompt = eventPrompts.find((e: any) => e.day === dayNum);

              return (
                <div
                  key={idx}
                  className={`h-16 rounded-lg border border-gray-800 flex flex-col items-center justify-start p-1 ${
                    isToday ? "bg-violet-600/20" : "bg-gray-900"
                  }`}
                >
                  <div
                    className={`self-end text-[11px] ${
                      isToday ? "text-violet-300" : "text-gray-400"
                    }`}
                  >
                    {c || ""}
                  </div>

                  {prompt && (
                    <div className="mt-1 w-full text-[10px] text-left text-amber-300">
                      • {prompt.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Prompts + Add Event Form */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="text-sm font-medium mb-3">Upcoming Event Prompts</div>

          {/* Existing Prompts */}
          <div className="space-y-3 mb-4">
            {eventPrompts.map((e: any) => (
              <div
                key={e.day}
                className="rounded-lg border border-gray-800 bg-gray-900 p-3"
              >
                <div className="text-sm">
                  {e.title} • {today.toLocaleString("default", { month: "short" })} {e.day}
                </div>
                <div className="text-xs text-amber-300">{e.expect}</div>
                <button
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 px-3 py-1.5 text-xs"
                  onClick={() =>
                    setForm((f: any) => ({
                      ...f,
                      item: "Event Surplus (Assorted)",
                      window: "Post event 8–10 PM",
                    }))
                  }
                >
                  <Plus size={14} /> Pre-fill Add Form
                </button>
              </div>
            ))}
          </div>

          {/* ➕ Add Event Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-gray-800 p-2 text-sm"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg bg-gray-800 p-2 text-sm"
            />
            <textarea
              placeholder="Expected surplus (e.g., 200 meals, drinks)"
              value={expect}
              onChange={(e) => setExpect(e.target.value)}
              className="w-full rounded-lg bg-gray-800 p-2 text-sm"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 px-4 py-2 text-sm"
            >
              Add Event
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
