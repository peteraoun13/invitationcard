import { useEffect, useMemo, useState } from "react";
import {
  createFamilyWithGuests,
  deleteFamily,
  getDashboardStatsFromSummaries,
  importFamiliesWithGuests,
  updateFamilyName,
} from "../lib/families";
import PaginationControls, {
  getPageCount,
  getPaginatedItems,
} from "../components/admin/PaginationControls.jsx";
import { buildInviteLink } from "../lib/firebase";
import { exportRows, parseGuestImportFile } from "../lib/spreadsheets";
import { useFamilySummaries } from "../hooks/useFamilySummaries";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Not Opened", value: "not_opened" },
  { label: "Opened", value: "opened" },
  { label: "Partial", value: "partial" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

const sortOptions = [
  { label: "Family A-Z", value: "family-asc" },
  { label: "Family Z-A", value: "family-desc" },
  { label: "Recently Added", value: "created-desc" },
  { label: "Recently Updated", value: "updated-desc" },
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

function getFilteredFamilies(families, { search, statusFilter, sort }) {
  const searchTerm = search.trim().toLowerCase();

  return families
    .filter((family) => {
      const matchesStatus =
        statusFilter === "all" || family.status === statusFilter;
      const matchesSearch =
        !searchTerm ||
        family.familyName.toLowerCase().includes(searchTerm) ||
        family.guests.some((guest) => guest.name.toLowerCase().includes(searchTerm));

      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sort === "family-asc") {
        return a.familyName.localeCompare(b.familyName);
      }

      if (sort === "family-desc") {
        return b.familyName.localeCompare(a.familyName);
      }

      if (sort === "updated-desc") {
        return b.lastUpdatedMillis - a.lastUpdatedMillis;
      }

      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    });
}

function buildExportRows(families) {
  return [
    [
      "Family Name",
      "Guest Name",
      "Status",
      "Attending",
      "Invitation Link",
      "Family Last Updated",
      "Guest Last Updated",
    ],
    ...families.flatMap((family) => {
      const inviteLink = family.guestsCount > 0 ? buildInviteLink(family) : "";

      if (family.guests.length === 0) {
        return [
          [
            family.familyName,
            "",
            "No Guests",
            "",
            "",
            formatDate(family.updatedAt),
            "",
          ],
        ];
      }

      return family.guests.map((guest) => [
        family.familyName,
        guest.name,
        guest.responded
          ? guest.attending
            ? "Confirmed"
            : "Declined"
          : "Pending",
        guest.responded ? (guest.attending ? "Yes" : "No") : "",
        inviteLink,
        formatDate(family.updatedAt),
        formatDate(guest.updatedAt),
      ]);
    }),
  ];
}

function SummaryCard({ label, value }) {
  return (
    <article className="admin-stat-card admin-stat-card--compact">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function CreateFamilyPanel({ onSaved }) {
  const [familyName, setFamilyName] = useState("");
  const [guestNames, setGuestNames] = useState([""]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function updateGuestName(index, value) {
    setGuestNames((current) =>
      current.map((guestName, guestIndex) =>
        guestIndex === index ? value : guestName,
      ),
    );
  }

  function addGuestRow() {
    setGuestNames((current) => [...current, ""]);
  }

  function removeGuestRow(index) {
    setGuestNames((current) =>
      current.length === 1
        ? [""]
        : current.filter((_, guestIndex) => guestIndex !== index),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanGuests = guestNames.map((guestName) => guestName.trim()).filter(Boolean);

    if (!familyName.trim()) {
      setError("Family name is required.");
      return;
    }

    if (cleanGuests.length === 0) {
      setError("Add at least one guest before saving the family.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await createFamilyWithGuests(familyName, cleanGuests);
      setFamilyName("");
      setGuestNames([""]);
      onSaved?.();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <p className="admin-eyebrow">Create</p>
          <h2>Family and Guests</h2>
        </div>
      </div>

      <form className="admin-family-create" onSubmit={handleSubmit}>
        <label>
          <span>Family Name</span>
          <input
            placeholder="Nassar"
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
          />
        </label>

        <div className="admin-guest-builder">
          <span>Guests</span>
          {guestNames.map((guestName, index) => (
            <div className="admin-guest-builder__row" key={index}>
              <input
                placeholder="Guest name"
                value={guestName}
                onChange={(event) => updateGuestName(index, event.target.value)}
              />
              <button
                className="admin-icon-button"
                type="button"
                aria-label="Remove guest"
                onClick={() => removeGuestRow(index)}
              >
                -
              </button>
            </div>
          ))}
          <button className="admin-button admin-button--ghost" type="button" onClick={addGuestRow}>
            Add Guest
          </button>
        </div>

        {error && (
          <p className="admin-alert admin-alert--error" role="alert">
            {error}
          </p>
        )}

        <button className="admin-button admin-button--primary" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Family"}
        </button>
      </form>
    </section>
  );
}

function ImportPanel({ families, onImported }) {
  const [previewFamilies, setPreviewFamilies] = useState([]);
  const [errors, setErrors] = useState([]);
  const [result, setResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const existingFamilyNames = useMemo(
    () => new Set(families.map((family) => family.familyName.trim().toLowerCase())),
    [families],
  );
  const duplicateFamilies = previewFamilies.filter((family) =>
    existingFamilyNames.has(family.familyName.trim().toLowerCase()),
  );
  const duplicateGuestLabels = previewFamilies.flatMap((family) => {
    const seen = new Set();

    return family.guests
      .map((guestName) => {
        const guestKey = guestName.trim().toLowerCase();

        if (seen.has(guestKey)) {
          return `${family.familyName}: ${guestName}`;
        }

        seen.add(guestKey);
        return "";
      })
      .filter(Boolean);
  });

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const parsed = await parseGuestImportFile(file);
      setPreviewFamilies(parsed.families);
      setErrors(parsed.errors);
      setResult(null);
    } catch (parseError) {
      setPreviewFamilies([]);
      setErrors([parseError.message]);
      setResult(null);
    } finally {
      event.target.value = "";
    }
  }

  function updatePreviewFamily(index, familyName) {
    setPreviewFamilies((current) =>
      current.map((family, familyIndex) =>
        familyIndex === index ? { ...family, familyName } : family,
      ),
    );
  }

  function updatePreviewGuest(familyIndex, guestIndex, guestName) {
    setPreviewFamilies((current) =>
      current.map((family, currentFamilyIndex) =>
        currentFamilyIndex === familyIndex
          ? {
              ...family,
              guests: family.guests.map((guest, currentGuestIndex) =>
                currentGuestIndex === guestIndex ? guestName : guest,
              ),
            }
          : family,
      ),
    );
  }

  async function handleImport() {
    setIsImporting(true);
    setResult(null);

    try {
      const importResult = await importFamiliesWithGuests(previewFamilies);
      setResult(importResult);
      setPreviewFamilies([]);
      onImported?.();
    } catch (importError) {
      setErrors([importError.message]);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <p className="admin-eyebrow">Import</p>
          <h2>Excel or CSV</h2>
        </div>
        <label className="admin-button admin-button--ghost admin-file-button">
          Import Excel
          <input accept=".xlsx,.csv" type="file" onChange={handleFileChange} />
        </label>
      </div>

      <p className="admin-muted">
        Use columns: Family Name, Guest Name. Guests are grouped automatically.
      </p>

      {errors.length > 0 && (
        <div className="admin-import-result admin-import-result--error">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      {previewFamilies.length > 0 && (
        <div className="admin-import-preview">
          <div className="admin-import-summary">
            <span>{previewFamilies.length} families</span>
            <span>
              {previewFamilies.reduce((total, family) => total + family.guests.length, 0)} guests
            </span>
            <span>{duplicateFamilies.length} duplicate families</span>
            <span>{duplicateGuestLabels.length} duplicate guests</span>
          </div>

          <div className="admin-import-preview__list">
            {previewFamilies.map((family, familyIndex) => (
              <article className="admin-import-family" key={family.id}>
                <input
                  value={family.familyName}
                  onChange={(event) =>
                    updatePreviewFamily(familyIndex, event.target.value)
                  }
                />
                <div>
                  {family.guests.map((guestName, guestIndex) => (
                    <input
                      value={guestName}
                      key={`${family.id}-${guestIndex}`}
                      onChange={(event) =>
                        updatePreviewGuest(familyIndex, guestIndex, event.target.value)
                      }
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>

          <button
            className="admin-button admin-button--primary"
            disabled={isImporting}
            type="button"
            onClick={handleImport}
          >
            {isImporting ? "Importing..." : "Save Import"}
          </button>
        </div>
      )}

      {result && (
        <div className="admin-import-result">
          <p>Families created: {result.familiesCreated}</p>
          <p>Guests created: {result.guestsCreated}</p>
          <p>Duplicate families: {result.duplicateFamilies.length}</p>
          <p>Duplicate guests: {result.duplicateGuests.length}</p>
          <p>Errors: {result.errors.length}</p>
        </div>
      )}
    </section>
  );
}

function FamilyTableRow({ family, navigate }) {
  const [familyName, setFamilyName] = useState(family.familyName);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const canCopy = family.guestsCount > 0;

  useEffect(() => {
    if (!isEditing) {
      setFamilyName(family.familyName);
    }
  }, [family.familyName, isEditing]);

  async function saveFamilyName() {
    if (!familyName.trim()) {
      setError("Family name is required.");
      return;
    }

    if (familyName === family.familyName) {
      setIsEditing(false);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await updateFamilyName(family.id, familyName);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEdit() {
    setFamilyName(family.familyName);
    setError("");
    setIsEditing(false);
  }

  async function copyInviteLink() {
    if (!canCopy) {
      return;
    }

    await navigator.clipboard.writeText(buildInviteLink(family));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleDelete() {
    const isConfirmed = window.confirm(`Delete ${family.familyName} and all guests?`);

    if (!isConfirmed) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await deleteFamily(family.id);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <input
          className="admin-table-input"
          disabled={!isEditing || isSaving}
          value={familyName}
          onChange={(event) => setFamilyName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              saveFamilyName();
            }

            if (event.key === "Escape") {
              cancelEdit();
            }
          }}
        />
        {error && <p className="admin-table-error">{error}</p>}
      </td>
      <td>{family.guestsCount}</td>
      <td>{family.confirmed}</td>
      <td>{family.declined}</td>
      <td>{family.pending}</td>
      <td>
        <span className={`admin-status-pill admin-status-pill--${family.status}`}>
          {family.invitationStatus}
        </span>
      </td>
      <td>{formatMillis(family.lastUpdatedMillis)}</td>
      <td>
        <div className="admin-table-actions">
          <button
            className="admin-button admin-button--small"
            type="button"
            onClick={() => navigate(`/admin/families/${family.id}`)}
          >
            View
          </button>
          {isEditing ? (
            <>
              <button
                className="admin-button admin-button--small admin-button--primary"
                disabled={isSaving}
                type="button"
                onClick={saveFamilyName}
              >
                {isSaving ? "Saving" : "Save"}
              </button>
              <button
                className="admin-button admin-button--small admin-button--ghost"
                disabled={isSaving}
                type="button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="admin-button admin-button--small"
              disabled={isSaving}
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          )}
          <button
            className="admin-button admin-button--small admin-button--ghost"
            disabled={!canCopy}
            title={
              canCopy
                ? "Copy invitation link"
                : "Add at least one guest before copying invitation."
            }
            type="button"
            onClick={copyInviteLink}
          >
            {canCopy ? (copied ? "Copied" : "Copy Invitation") : "Add guests first"}
          </button>
          <button
            className="admin-button admin-button--small admin-button--danger"
            disabled={isSaving}
            type="button"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function FamiliesPage({ navigate }) {
  const { families, isLoading, error } = useFamilySummaries();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("created-desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const stats = useMemo(() => getDashboardStatsFromSummaries(families), [families]);
  const filteredFamilies = useMemo(
    () => getFilteredFamilies(families, { search, statusFilter, sort }),
    [families, search, sort, statusFilter],
  );
  const pageCount = useMemo(
    () => getPageCount(filteredFamilies.length, pageSize),
    [filteredFamilies.length, pageSize],
  );
  const paginatedFamilies = useMemo(
    () => getPaginatedItems(filteredFamilies, page, pageSize),
    [filteredFamilies, page, pageSize],
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
    exportRows(buildExportRows(filteredFamilies), "wedding-rsvp-export", format);
  }

  return (
    <div className="admin-workspace">
      <div className="admin-page-title">
        <div>
          <p className="admin-eyebrow">Families</p>
          <h1>Guest Management</h1>
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

      <section className="admin-stat-grid admin-stat-grid--crm">
        <SummaryCard label="Total Families" value={stats.totalFamilies} />
        <SummaryCard label="Total Guests" value={stats.totalGuests} />
        <SummaryCard label="Confirmed Guests" value={stats.attending} />
        <SummaryCard label="Declined Guests" value={stats.notAttending} />
        <SummaryCard label="Pending Guests" value={stats.pending} />
      </section>

      <div className="admin-grid-2">
        <CreateFamilyPanel />
        <ImportPanel families={families} />
      </div>

      <section className="admin-panel">
        <div className="admin-toolbar">
          <div className="admin-segmented" aria-label="Filter families">
            {statusFilters.map((filter) => (
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
          <p className="admin-muted">Loading families...</p>
        ) : filteredFamilies.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No matching families.</h2>
            <p>Adjust filters or import your guest spreadsheet.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Family Name</th>
                    <th>Guests Count</th>
                    <th>Confirmed</th>
                    <th>Declined</th>
                    <th>Pending</th>
                    <th>Invitation Status</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFamilies.map((family) => (
                    <FamilyTableRow
                      family={family}
                      key={family.id}
                      navigate={navigate}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={filteredFamilies.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </section>
    </div>
  );
}
