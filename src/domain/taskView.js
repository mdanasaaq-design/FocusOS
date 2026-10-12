const PRIORITY_RANK = { high: 0, normal: 1, low: 2 };

/** Pure task-view projection. It never mutates source records or configuration. */
export function buildTaskView(items = [], config = {}) {
  const allTasks = items.filter((item) => item?.capability === "tasks" && item?.type === "task");
  const filteredTasks = allTasks.filter((task) => {
    const status = config.statusFilter || "open";
    const priorityFilter = config.priorityFilter || "all";
    if (status === "open" && task.status === "completed") return false;
    if (status === "completed" && task.status !== "completed") return false;
    if (priorityFilter !== "all" && (task.priority || "normal") !== priorityFilter) return false;
    return true;
  });

  const timestamp = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() || 0 : 0);
  const tasks = [...filteredTasks].sort((a, b) => {
    const field = config.sortBy || "dueDate";
    let comparison = 0;
    if (field === "title") comparison = String(a.title || "").localeCompare(String(b.title || ""));
    else if (field === "priority") comparison = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
    else if (field === "createdAt") comparison = timestamp(a.createdAt) - timestamp(b.createdAt);
    else comparison = String(a.dueDate || a.date || "").localeCompare(String(b.dueDate || b.date || ""));
    return config.sortDirection === "desc" ? -comparison : comparison;
  });

  const groupBy = config.groupBy || "none";
  const groups = [];
  if (groupBy === "none") {
    groups.push({ key: "all", label: "", tasks });
  } else {
    const buckets = new Map();
    for (const task of tasks) {
      const raw = groupBy === "status" ? (task.status === "completed" ? "Completed" : "Open")
        : groupBy === "priority" ? (task.priority || "normal")
        : (task.dueDate || "No due date");
      const label = raw.charAt(0).toUpperCase() + raw.slice(1);
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(task);
    }
    for (const [label, grouped] of [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      groups.push({ key: label, label, tasks: grouped });
    }
  }

  return {
    allTasks,
    tasks,
    groups,
    openCount: allTasks.filter((task) => task.status !== "completed").length,
  };
}
