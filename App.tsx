import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, X, Check, Calendar, User, Clock, Edit2, Save, Download, Trash2, Printer
} from "lucide-react";

/* ---------- helpers ---------- */
const uid = () => crypto.getRandomValues(new Uint32Array(1))[0];
const cx = (...v: (string | false | undefined)[]) => v.filter(Boolean).join(" ");
const badgeStatus = (s: string) =>
  ({ completed:"bg-green-100 text-green-800", done:"bg-green-100 text-green-800",
     "in-progress":"bg-yellow-100 text-yellow-800", pending:"bg-yellow-100 text-yellow-800",
     blocked:"bg-red-100 text-red-800", open:"bg-blue-100 text-blue-800" }[s] || "bg-gray-100 text-gray-800");
const badgePriority = (p: string) =>
  ({ high:"bg-red-100 text-red-800", medium:"bg-yellow-100 text-yellow-800", low:"bg-green-100 text-green-800" }[p] || "bg-gray-100 text-gray-800");
const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white";

/* ---------- types ---------- */
type MeetingInfo = { date: string; time: string; attendees: string; location: string };
type AgendaItem = { id:number; topic:string; timeAlloc:string; notes:string };
type Activity   = { id:number; activity:string; status:string; priority:string; dueDate:string };
type Todo       = { id:number; task:string; assignedTo:string; dueDate:string; status:string };
type ActionItem = { id:number; action:string; owner:string; deadline:string; status:string };
type Persist = { meetingInfo:MeetingInfo; agendaItems:AgendaItem[]; dailyActivities:Activity[]; todos:Todo[]; actionItems:ActionItem[]; notes:string };

/* ---------- component ---------- */
export default function App() {
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo>({
    date: new Date().toISOString().split("T")[0], time: "10:00", attendees: "", location: ""
  });
  const [agendaItems, setAgendaItems]   = useState<AgendaItem[]>([{ id: uid(), topic: "", timeAlloc: "10", notes: "" }]);
  const [dailyActivities, setDailyActivities] = useState<Activity[]>([{ id: uid(), activity: "", status: "in-progress", priority: "medium", dueDate: "" }]);
  const [todos, setTodos]               = useState<Todo[]>([{ id: uid(), task: "", assignedTo: "", dueDate: "", status: "pending" }]);
  const [actionItems, setActionItems]   = useState<ActionItem[]>([{ id: uid(), action: "", owner: "", deadline: "", status: "open" }]);
  const [notes, setNotes]               = useState("");

  /* autosave/load */
  useEffect(() => {
    const raw = localStorage.getItem("meeting-agenda-tracker");
    if (!raw) return;
    try {
      const d: Persist = JSON.parse(raw);
      setMeetingInfo(d.meetingInfo);
      setAgendaItems(d.agendaItems.length ? d.agendaItems : [{ id: uid(), topic: "", timeAlloc: "10", notes: "" }]);
      setDailyActivities(d.dailyActivities.length ? d.dailyActivities : [{ id: uid(), activity: "", status: "in-progress", priority: "medium", dueDate: "" }]);
      setTodos(d.todos.length ? d.todos : [{ id: uid(), task: "", assignedTo: "", dueDate: "", status: "pending" }]);
      setActionItems(d.actionItems.length ? d.actionItems : [{ id: uid(), action: "", owner: "", deadline: "", status: "open" }]);
      setNotes(d.notes || "");
    } catch {}
  }, []);
  useEffect(() => {
    const payload: Persist = { meetingInfo, agendaItems, dailyActivities, todos, actionItems, notes };
    localStorage.setItem("meeting-agenda-tracker", JSON.stringify(payload));
  }, [meetingInfo, agendaItems, dailyActivities, todos, actionItems, notes]);

  /* computed */
  const totalAgendaMinutes = useMemo(
    () => agendaItems.reduce((n,a)=> n + Math.max(0, Number(a.timeAlloc || 0)), 0),
    [agendaItems]
  );

  /* list helpers */
  const addRow = <T extends {id:number}>(list:T[], set:(v:T[])=>void, sample:Omit<T,"id">) =>
    set([...list, { id: uid(), ...(sample as any) }]);
  const removeRow = <T extends {id:number}>(list:T[], set:(v:T[])=>void, id:number) =>
    set(list.length > 1 ? list.filter(i => i.id !== id) : list);
  const updateRow = <T extends {id:number}>(list:T[], set:(v:T[])=>void, id:number, field:keyof T, value:any) =>
    set(list.map(i => i.id === id ? { ...i, [field]: value } : i));

  /* export/print/clear */
  const exportJSON = () => {
    const payload: Persist = { meetingInfo, agendaItems, dailyActivities, todos, actionItems, notes };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `meeting-agenda-${meetingInfo.date}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const printPage = () => window.print();
  const clearAll = () => {
    if (!confirm("Clear everything?")) return;
    localStorage.removeItem("meeting-agenda-tracker");
    setMeetingInfo({ date: new Date().toISOString().split("T")[0], time: "10:00", attendees: "", location: "" });
    setAgendaItems([{ id: uid(), topic: "", timeAlloc: "10", notes: "" }]);
    setDailyActivities([{ id: uid(), activity: "", status: "in-progress", priority: "medium", dueDate: "" }]);
    setTodos([{ id: uid(), task: "", assignedTo: "", dueDate: "", status: "pending" }]);
    setActionItems([{ id: uid(), action: "", owner: "", deadline: "", status: "open" }]);
    setNotes("");
  };

  /* UI */
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Sticky topbar */}
      <header className="sticky top-0 z-10 w-full bg-white/80 backdrop-blur border-b border-indigo-200">
        <div className="w-full px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Meeting Agenda & Activity Tracker</h1>
          <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
            <button onClick={exportJSON} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center">
              <Download size={16} className="mr-1" /> Export
            </button>
            <button onClick={printPage} className="px-3 py-2 rounded-md bg-slate-700 text-white hover:bg-slate-800 flex items-center">
              <Printer size={16} className="mr-1" /> Print
            </button>
            <button onClick={clearAll} className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center">
              <Trash2 size={16} className="mr-1" /> Clear
            </button>
          </div>
        </div>
      </header>

      {/* Full-width content */}
      <main className="w-full px-4 md:px-6 py-6">
        {/* Meeting info */}
        <section className="bg-white rounded-xl shadow-md p-5 border border-indigo-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Calendar className="mr-2" size={20} /> Meeting Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <L label="Date">
              <input type="date" className={inputCls} value={meetingInfo.date}
                onChange={(e) => setMeetingInfo({ ...meetingInfo, date: e.target.value })}/>
            </L>
            <L label="Time">
              <input type="time" className={inputCls} value={meetingInfo.time}
                onChange={(e) => setMeetingInfo({ ...meetingInfo, time: e.target.value })}/>
            </L>
            <L label="Attendees">
              <input className={inputCls} placeholder="Names of attendees" value={meetingInfo.attendees}
                onChange={(e) => setMeetingInfo({ ...meetingInfo, attendees: e.target.value })}/>
            </L>
            <L label="Location/Platform">
              <input className={inputCls} placeholder="Office, Zoom, Teams, etc." value={meetingInfo.location}
                onChange={(e) => setMeetingInfo({ ...meetingInfo, location: e.target.value })}/>
            </L>
          </div>
        </section>

        {/* Agenda */}
        <BlockHeader
          icon={<Edit2 size={20} className="mr-2" />}
          title="Agenda Items"
          right={<span className="text-sm text-gray-600">Total: <b>{totalAgendaMinutes}</b> min</span>}
          action={{ label: "Add Item", onClick: () => addRow(agendaItems, setAgendaItems, { topic: "", timeAlloc: "5", notes: "" }) }}
        />
        <div className="space-y-3">
          {agendaItems.map((item, idx) => (
            <Card key={item.id}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold">
                  {idx + 1}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1">
                  <div className="md:col-span-6">
                    <input className={inputCls} placeholder="Topic to discuss" value={item.topic}
                      onChange={(e) => updateRow(agendaItems, setAgendaItems, item.id, "topic", e.target.value)}/>
                  </div>
                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-2 text-gray-500" />
                      <input className={inputCls} type="number" min={1} step={1} value={item.timeAlloc}
                        onChange={(e) => updateRow(
                          agendaItems, setAgendaItems, item.id, "timeAlloc",
                          String(Math.max(1, Number(e.target.value || 0)))
                        )}/>
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <input className={inputCls} placeholder="Quick notes" value={item.notes}
                      onChange={(e) => updateRow(agendaItems, setAgendaItems, item.id, "notes", e.target.value)}/>
                  </div>
                </div>
                <TrashBtn onClick={() => removeRow(agendaItems, setAgendaItems, item.id)} />
              </div>
            </Card>
          ))}
        </div>

        {/* Daily Activities */}
        <BlockHeader
          icon={<Check size={20} className="mr-2" />}
          title="Daily Activities & Progress"
          action={{ label: "Add Activity", color: "green", onClick: () =>
            addRow(dailyActivities, setDailyActivities, { activity: "", status: "in-progress", priority: "medium", dueDate: "" })
          }}
        />
        <div className="space-y-3">
          {dailyActivities.map((item) => (
            <Card key={item.id}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5">
                  <input className={inputCls} placeholder="Activity description" value={item.activity}
                    onChange={(e) => updateRow(dailyActivities, setDailyActivities, item.id, "activity", e.target.value)}/>
                </div>
                <div className="md:col-span-2">
                  <select className={cx(inputCls, badgePriority(item.priority))} value={item.priority}
                    onChange={(e) => updateRow(dailyActivities, setDailyActivities, item.id, "priority", e.target.value)}>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <select className={cx(inputCls, badgeStatus(item.status))} value={item.status}
                    onChange={(e) => updateRow(dailyActivities, setDailyActivities, item.id, "status", e.target.value)}>
                    <option value="completed">Completed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <input type="date" className={inputCls} value={item.dueDate}
                    onChange={(e) => updateRow(dailyActivities, setDailyActivities, item.id, "dueDate", e.target.value)}/>
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <TrashBtn onClick={() => removeRow(dailyActivities, setDailyActivities, item.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* To-Do List */}
        <BlockHeader
          icon={<User size={20} className="mr-2" />}
          title="To-Do List"
          action={{ label: "Add To-Do", color: "purple", onClick: () =>
            addRow(todos, setTodos, { task: "", assignedTo: "", dueDate: "", status: "pending" })
          }}
        />
        <div className="space-y-3">
          {todos.map((item) => (
            <Card key={item.id}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5">
                  <input className={inputCls} placeholder="Task description" value={item.task}
                    onChange={(e) => updateRow(todos, setTodos, item.id, "task", e.target.value)}/>
                </div>
                <div className="md:col-span-3">
                  <input className={inputCls} placeholder="Assigned to" value={item.assignedTo}
                    onChange={(e) => updateRow(todos, setTodos, item.id, "assignedTo", e.target.value)}/>
                </div>
                <div className="md:col-span-2">
                  <input type="date" className={inputCls} value={item.dueDate}
                    onChange={(e) => updateRow(todos, setTodos, item.id, "dueDate", e.target.value)}/>
                </div>
                <div className="md:col-span-1">
                  <select className={cx(inputCls, badgeStatus(item.status))} value={item.status}
                    onChange={(e) => updateRow(todos, setTodos, item.id, "status", e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <TrashBtn onClick={() => removeRow(todos, setTodos, item.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action Items */}
        <BlockHeader
          icon={<Save size={20} className="mr-2" />}
          title="Action Items from Meeting"
          action={{ label: "Add Action", color: "orange", onClick: () =>
            addRow(actionItems, setActionItems, { action: "", owner: "", deadline: "", status: "open" })
          }}
        />
        <div className="space-y-3">
          {actionItems.map((item) => (
            <Card key={item.id}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5">
                  <input className={inputCls} placeholder="Action item" value={item.action}
                    onChange={(e) => updateRow(actionItems, setActionItems, item.id, "action", e.target.value)}/>
                </div>
                <div className="md:col-span-3">
                  <input className={inputCls} placeholder="Owner" value={item.owner}
                    onChange={(e) => updateRow(actionItems, setActionItems, item.id, "owner", e.target.value)}/>
                </div>
                <div className="md:col-span-2">
                  <input type="date" className={inputCls} value={item.deadline}
                    onChange={(e) => updateRow(actionItems, setActionItems, item.id, "deadline", e.target.value)}/>
                </div>
                <div className="md:col-span-1">
                  <select className={cx(inputCls, badgeStatus(item.status))} value={item.status}
                    onChange={(e) => updateRow(actionItems, setActionItems, item.id, "status", e.target.value)}>
                    <option value="open">Open</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="md:col-span-1 flex justify-center">
                  <TrashBtn onClick={() => removeRow(actionItems, setActionItems, item.id)} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Notes */}
        <section className="bg-yellow-50 rounded-xl p-5 border-2 border-yellow-200 mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Meeting Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes, discussions, or important points..."
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent min-h-32 resize-y bg-white"
          />
        </section>
      </main>
    </div>
  );
}

/* ---------- small UI parts ---------- */
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">{children}</div>;
}
function BlockHeader(props: {
  icon: React.ReactNode; title: string; right?: React.ReactNode;
  action?: { label: string; color?: "indigo" | "green" | "purple" | "orange"; onClick: () => void };
}) {
  const color = props.action?.color || "indigo";
  const btn = { indigo:"bg-indigo-600 hover:bg-indigo-700", green:"bg-green-600 hover:bg-green-700",
                purple:"bg-purple-600 hover:bg-purple-700", orange:"bg-orange-600 hover:bg-orange-700" }[color];
  return (
    <div className="mt-8 mb-3 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">{props.icon}{props.title}</h2>
      <div className="flex items-center gap-3">
        {props.right}
        {props.action && (
          <button onClick={props.action.onClick} className={cx("flex items-center px-4 py-2 text-white rounded-md transition", btn)}>
            <Plus size={16} className="mr-1" /> {props.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
function TrashBtn({ onClick }: { onClick: () => void }) {
  return (
    <button title="Remove" onClick={onClick} className="flex-shrink-0 text-red-500 hover:text-red-700 rounded-md p-1" aria-label="Remove">
      <X size={20} />
    </button>
  );
}
