import { useEffect, useMemo, useState } from "react";
import PaginationControls, {
  getPageCount,
  getPaginatedItems,
} from "../components/admin/PaginationControls.jsx";
import { useFamilySummaries } from "../hooks/useFamilySummaries";
import { updateGuestRsvpStatus } from "../services/backend";
import { exportRows } from "../lib/spreadsheets";

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Declined", value: "declined" },
];

const sortOptions = [
  { label: "Recently Responded", value: "recent" },
  { label: "Oldest", value: "oldest" },
  { label: "Family Name", value: "family" },
];

function formatDate(value) {
  const date = value?.toDate?.();

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getGuestStatus(guest) {
  if (!guest.responded) {
    return "pending";
  }

  return guest.attending ? "confirmed" : "declined";
}

function getGuestRows(families) {
  return families.flatMap((family) =>
    family.guests.map((guest) => ({
      ...guest,
      familyName: family.familyName,
      familyId: family.id,
      respondedMillis: guest.responded
        ? guest.updatedAt?.toMillis?.() || guest.createdAt?.toMillis?.() || 0
        : 0,
      status: getGuestStatus(guest),
    })),
  );
}

function filterAndSortRows(rows, { search, statusFilter, sort }) {
  const searchTerm = search.trim().toLowerCase();

  return rows
    .filter((row) => {
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        row.familyName.toLowerCase().includes(searchTerm) ||
        row.name.toLowerCase().includes(searchTerm);

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "oldest") {
        return a.respondedMillis - b.respondedMillis;
      }

      if (sort === "family") {
        return a.familyName.localeCompare(b.familyName) || a.name.localeCompare(b.name);
      }

      return b.respondedMillis - a.respondedMillis;
    });
}

function buildExportRows(rows) {
  return [
    ["Family Name", "Guest Name", "Status", "Attending", "Last Updated"],
    ...rows.map((row) => [
      row.familyName,
      row.name,
      row.status === "confirmed"
        ? "Confirmed"
        : row.status === "declined"
          ? "Declined"
          : "Pending",
      row.responded ? (row.attending ? "Yes" : "No") : "",
      formatDate(row.updatedAt),
    ]),
  ];
}

function RsvpStatusSelect({ row }) {
  const [status, setStatus] = useState(row.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(row.status);
  }, [row.status]);

  async function handleChange(event) {
    const nextStatus = event.target.value;
    const previousStatus = status;

    setStatus(nextStatus);
    setError("");
    setIsSaving(true);

    try {
      await updateGuestRsvpStatus(row.familyId, row.id, nextStatus);
    } catch (statusError) {
      setStatus(previousStatus);
      setError(statusError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <select
        className="admin-table-select"
        disabled={isSaving}
        value={status}
        onChange={handleChange}
        aria-label={`RSVP status for ${row.name}`}
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Attending</option>
        <option value="declined">Not attending</option>
      </select>
      {error && <p className="admin-table-error">{error}</p>}
    </>
  );
}

export default function RsvpDashboardPage() {
  const { families, isLoading, error } = useFamilySummaries();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const rows = useMemo(() => getGuestRows(families), [families]);
  const filteredRows = useMemo(
    () => filterAndSortRows(rows, { search, statusFilter, sort }),
    [rows, search, sort, statusFilter],
  );
  const pageCount = useMemo(
    () => getPageCount(filteredRows.length, pageSize),
    [filteredRows.length, pageSize],
  );
  const paginatedRows = useMemo(
    () => getPaginatedItems(filteredRows, page, pageSize),
    [filteredRows, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize, search, sort, statusFilter]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  function exportCurrent(format) {
    exportRows(buildExportRows(filteredRows), "rsvp-status", format);
  }

  return (
    <div className="admin-workspace">
      <div className="admin-page-title">
        <div>
          <p className="admin-eyebrow">Responses</p>
          <h1>RSVP Dashboard</h1>
        </div>
        <div className="admin-row-actions">
          <button className="admin-button" type="button" onClick={() => exportCurrent("csv")}>
            Export CSV
          </button>
          <button className="admin-button" type="button" onClick={() => exportCurrent("xlsx")}>
            Export Excel
          </button>
        </div>
      </div>

      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}

      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-segmented" aria-label="Filter RSVP responses">
            {filterOptions.map((filter) => (
              <button
                className={statusFilter === filter.value ? "is-active" : ""}
                type="button"
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <input
            className="admin-search-input"
            placeholder="Search family or guest"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {sortOptions.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="admin-muted">Loading RSVP responses...</p>
        ) : filteredRows.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No matching responses.</h2>
            <p>Try a different filter or search term.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Family</th>
                    <th>Guest</th>
                    <th>Status</th>
                    <th>Attending</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row) => (
                    <tr key={`${row.familyId}-${row.id}`}>
                      <td>{row.familyName}</td>
                      <td>{row.name}</td>
                      <td>
                        <RsvpStatusSelect row={row} />
                      </td>
                      <td>{row.responded ? (row.attending ? "Yes" : "No") : "-"}</td>
                      <td>{formatDate(row.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={filteredRows.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </section>
    </div>
  );
}
