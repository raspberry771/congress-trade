import type { ActivityItem } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function ActivityStrip({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="muted">No Congress activity seeded for this member yet.</p>;
  }

  return (
    <div className="activityList">
      {items.map((item) => (
        <article className="activityItem" key={`${item.type}-${item.title}-${item.date}`}>
          <span className={`chip type${item.type}`}>{item.type}</span>
          <div>
            <h4>{item.title}</h4>
            <p>
              {formatDate(item.date)} · {item.outlet}
              {item.scaffold ? " · scaffold" : ""}
            </p>
          </div>
          <a
            className="linkOut"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View source
          </a>
        </article>
      ))}
    </div>
  );
}
