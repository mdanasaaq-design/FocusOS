import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeHabitList, subscribeHabitLogs, setHabitLog, setHabitList } from "../lib/data";
import { last30Days, todayKey, currentStreak } from "../lib/dates";

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState({});
  const [newHabit, setNewHabit] = useState("");
  const days = last30Days();
  const today = todayKey();

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeHabitList(user.uid, setHabits);
    const u2 = subscribeHabitLogs(user.uid, setLogs);
    return () => {
      u1();
      u2();
    };
  }, [user]);

  async function toggle(habitId, dateKey) {
    const current = !!logs[dateKey]?.[habitId];
    await setHabitLog(user.uid, dateKey, habitId, !current);
  }

  async function addHabit(e) {
    e.preventDefault();
    if (!newHabit.trim()) return;
    const id = newHabit.trim().toLowerCase().replace(/\s+/g, "-");
    await setHabitList(user.uid, [...habits, { id, name: newHabit.trim() }]);
    setNewHabit("");
  }

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-2xl font-display font-semibold">Habits</h2>
        <p className="text-xs text-parchment-300 mt-1">
          Last 30 days — every tick is saved permanently to Firestore.
        </p>
      </header>

      <form onSubmit={addHabit} className="card p-4 flex items-center gap-3">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          placeholder="Add a new habit (e.g. Duha Prayer)"
          className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
        />
        <button
          type="submit"
          className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
        >
          Add
        </button>
      </form>

      <div className="card p-5 overflow-x-auto">
        <table className="w-full text-xs border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th className="text-left text-parchment-300 font-medium pb-2 sticky left-0 bg-ink-800 pr-3">
                Habit
              </th>
              {days.map((d) => (
                <th
                  key={d}
                  className={`px-1 pb-2 font-normal ${d === today ? "text-brass-400" : "text-parchment-300"}`}
                >
                  {new Date(d + "T00:00:00").getDate()}
                </th>
              ))}
              <th className="pb-2 text-parchment-300 font-medium pl-3">Streak</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id}>
                <td className="pr-3 sticky left-0 bg-ink-800 whitespace-nowrap text-parchment-100 font-medium py-1">
                  {h.name}
                </td>
                {days.map((d) => {
                  const checked = !!logs[d]?.[h.id];
                  return (
                    <td key={d} className="text-center px-1">
                      <button
                        onClick={() => toggle(h.id, d)}
                        className={`w-5 h-5 rounded-md border transition-colors ${
                          checked
                            ? "bg-teal-500 border-teal-500"
                            : "border-ink-600 hover:border-brass-500"
                        }`}
                      />
                    </td>
                  );
                })}
                <td className="pl-3 text-brass-400 font-semibold">
                  {currentStreak(logs, h.id)}d
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {habits.length === 0 && (
          <p className="text-sm text-parchment-300 text-center py-6">
            No habits yet — add one above.
          </p>
        )}
      </div>
    </div>
  );
}
