import { useMemo } from "react";
import { useFamilySummaries } from "../hooks/useFamilySummaries";
import { getDashboardStatsFromSummaries } from "../services/backend";

const statusOrder = [
  { value: "pending", label: "Pending setup" },
  { value: "not_opened", label: "Not opened" },
  { value: "opened", label: "Opened" },
  { value: "partial", label: "Partial" },
  { value: "completed", label: "Completed" },
  { value: "declined", label: "Declined" },
];

function formatMillis(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function SummaryCard({ label, value }) {
  return (
    <article className="admin-stat-card admin-stat-card--compact">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DashboardTable({ title, eyebrow, families, emptyText, navigate }) {
  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <p className="admin-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>

      {families.length === 0 ? (
        <div className="admin-empty-state">
          <h2>{emptyText}</h2>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-data-table admin-data-table--compact">
            <thead>
              <tr>
                <th>Family</th>
                <th>Status</th>
                <th>Guests</th>
                <th>Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {families.map((family) => (
                <tr key={family.id}>
                  <td>{family.familyName}</td>
                  <td>
                    <span className={`admin-status-pill admin-status-pill--${family.status}`}>
                      {family.invitationStatus}
                    </span>
                  </td>
                  <td>{family.guestsCount}</td>
                  <td>{formatMillis(family.lastUpdatedMillis)}</td>
                  <td>
                    <button
                      className="admin-button admin-button--small"
                      type="button"
                      onClick={() => navigate(`/admin/families/${family.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminDashboardPage({ navigate }) {
  const { families, isLoading, error } = useFamilySummaries();
  const stats = useMemo(() => getDashboardStatsFromSummaries(families), [families]);
  const statusCounts = useMemo(
    () =>
      statusOrder.map((status) => ({
        ...status,
        count: families.filter((family) => family.status === status.value).length,
      })),
    [families],
  );
  const recentFamilies = useMemo(
    () =>
      [...families]
        .sort((a, b) => b.lastUpdatedMillis - a.lastUpdatedMillis)
        .slice(0, 8),
    [families],
  );

  return (
    <div className="admin-workspace">
      <div className="admin-page-title">
        <div>
          <p className="admin-eyebrow">Overview</p>
          <h1>Wedding Admin</h1>
        </div>
        <div className="admin-row-actions">
          <button
            className="admin-button admin-button--primary"
            type="button"
            onClick={() => navigate("/admin/families")}
          >
            Manage Families
          </button>
          <button
            className="admin-button"
            type="button"
            onClick={() => navigate("/admin/rsvps")}
          >
            View RSVPs
          </button>
        </div>
      </div>

      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}

      <section className="admin-stat-grid admin-stat-grid--crm">
        <SummaryCard label="Total Families" value={stats.totalFamilies} />
        <SummaryCard label="Total Guests" value={stats.totalGuests} />
        <SummaryCard label="Confirmed Guests" value={stats.attending} />
        <SummaryCard label="Declined Guests" value={stats.notAttending} />
        <SummaryCard label="Pending Guests" value={stats.pending} />
      </section>

      {isLoading ? (
        <section className="admin-panel">
          <p className="admin-muted">Loading dashboard...</p>
        </section>
      ) : (
        <>
          <section className="admin-dashboard-grid">
            <div className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <p className="admin-eyebrow">Status</p>
                  <h2>Invitation Progress</h2>
                </div>
              </div>
              <div className="admin-status-overview">
                {statusCounts.map((status) => (
                  <div className="admin-status-overview__item" key={status.value}>
                    <span
                      className={`admin-status-pill admin-status-pill--${status.value}`}
                    >
                      {status.label}
                    </span>
                    <strong>{status.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel__header">
                <div>
                  <p className="admin-eyebrow">Workflow</p>
                  <h2>Quick Actions</h2>
                </div>
              </div>
              <div className="admin-dashboard-actions">
                <button
                  className="admin-button admin-button--primary"
                  type="button"
                  onClick={() => navigate("/admin/families")}
                >
                  Add Families
                </button>
                <button
                  className="admin-button"
                  type="button"
                  onClick={() => navigate("/admin/families")}
                >
                  Import Guests
                </button>
                <button
                  className="admin-button"
                  type="button"
                  onClick={() => navigate("/admin/rsvps")}
                >
                  Review Responses
                </button>
              </div>
            </div>
          </section>

          <DashboardTable
            emptyText="No families yet."
            eyebrow="Recent"
            families={recentFamilies}
            navigate={navigate}
            title="Recently Updated"
          />
        </>
      )}
    </div>
  );
}
