import { useEffect, useMemo, useState } from "react";
import {
  addGuest,
  deleteGuest,
  subscribeFamily,
  subscribeGuests,
  updateFamilyName,
  updateGuestName,
  updateGuestRsvpStatus,
} from "../lib/families";
import PaginationControls, {
  getPageCount,
  getPaginatedItems,
} from "../components/admin/PaginationControls.jsx";
import { buildInviteLink } from "../lib/firebase";

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

function getStatus(guest) {
  if (!guest.responded) {
    return "pending";
  }

  return guest.attending ? "confirmed" : "declined";
}

function getFamilyStatusDetails(family, guests) {
  const respondedCount = guests.filter((guest) => guest.responded).length;

  if (guests.length === 0) {
    return { code: "pending", label: "Pending setup" };
  }

  if (respondedCount === guests.length) {
    return { code: "completed", label: "Completed" };
  }

  if (respondedCount > 0) {
    return { code: "partial", label: "Partial" };
  }

  if (family.openedAt || family.status === "opened") {
    return { code: "opened", label: "Opened" };
  }

  return { code: "not_opened", label: "Not opened" };
}

function GuestTableRow({ familyId, guest }) {
  const [name, setName] = useState(guest.name);
  const [responseStatus, setResponseStatus] = useState(getStatus(guest));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusSaving, setIsStatusSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setName(guest.name);
    }
  }, [guest.name, isEditing]);

  useEffect(() => {
    setResponseStatus(getStatus(guest));
  }, [guest.attending, guest.responded]);

  async function saveGuest() {
    if (!name.trim()) {
      setError("Guest name is required.");
      return;
    }

    if (name === guest.name) {
      setIsEditing(false);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await updateGuestName(familyId, guest.id, name);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function cancelEdit() {
    setName(guest.name);
    setError("");
    setIsEditing(false);
  }

  async function removeGuest() {
    const isConfirmed = window.confirm(`Delete ${guest.name || "this guest"}?`);

    if (!isConfirmed) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await deleteGuest(familyId, guest.id);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(event) {
    const nextStatus = event.target.value;
    const previousStatus = responseStatus;

    setResponseStatus(nextStatus);
    setError("");
    setIsStatusSaving(true);

    try {
      await updateGuestRsvpStatus(familyId, guest.id, nextStatus);
    } catch (statusError) {
      setResponseStatus(previousStatus);
      setError(statusError.message);
    } finally {
      setIsStatusSaving(false);
    }
  }

  return (
    <tr>
      <td>
        <input
          className="admin-table-input"
          disabled={!isEditing || isSaving}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              saveGuest();
            }

            if (event.key === "Escape") {
              cancelEdit();
            }
          }}
        />
        {error && <p className="admin-table-error">{error}</p>}
      </td>
      <td>
        <select
          className="admin-table-select"
          disabled={isSaving || isStatusSaving}
          value={responseStatus}
          onChange={handleStatusChange}
          aria-label={`RSVP status for ${guest.name}`}
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Attending</option>
          <option value="declined">Not attending</option>
        </select>
      </td>
      <td>
        {responseStatus === "pending"
          ? "-"
          : responseStatus === "confirmed"
            ? "Yes"
            : "No"}
      </td>
      <td>{guest.responded ? formatDate(guest.updatedAt) : "-"}</td>
      <td>
        <div className="admin-table-actions">
          {isEditing ? (
            <>
              <button
                className="admin-button admin-button--small admin-button--primary"
                disabled={isSaving}
                type="button"
                onClick={saveGuest}
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
            className="admin-button admin-button--small admin-button--danger"
            disabled={isSaving}
            type="button"
            onClick={removeGuest}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function FamilyDetailPage({ familyId, navigate }) {
  const [family, setFamily] = useState(null);
  const [guests, setGuests] = useState([]);
  const [familyName, setFamilyName] = useState("");
  const [isFamilyEditing, setIsFamilyEditing] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [isFamilyLoading, setIsFamilyLoading] = useState(true);
  const [isGuestsLoading, setIsGuestsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const inviteLink = useMemo(
    () => (family ? buildInviteLink(family) : ""),
    [family],
  );
  const canCopy = guests.length > 0;
  const familyStatus = family
    ? getFamilyStatusDetails(family, guests)
    : { code: "pending", label: "Pending setup" };
  const pageCount = useMemo(
    () => getPageCount(guests.length, pageSize),
    [guests.length, pageSize],
  );
  const paginatedGuests = useMemo(
    () => getPaginatedItems(guests, page, pageSize),
    [guests, page, pageSize],
  );

  useEffect(() => {
    return subscribeFamily(
      familyId,
      (nextFamily) => {
        setFamily(nextFamily);
        if (!isFamilyEditing) {
          setFamilyName(nextFamily?.familyName || "");
        }
        setIsFamilyLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsFamilyLoading(false);
      },
    );
  }, [familyId, isFamilyEditing]);

  useEffect(() => {
    return subscribeGuests(
      familyId,
      (nextGuests) => {
        setGuests(nextGuests);
        setIsGuestsLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setIsGuestsLoading(false);
      },
    );
  }, [familyId]);

  useEffect(() => {
    setPage(1);
  }, [familyId, pageSize]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  async function saveFamilyName() {
    if (!familyName.trim()) {
      setError("Family name is required.");
      return;
    }

    if (familyName === family?.familyName) {
      setIsFamilyEditing(false);
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await updateFamilyName(familyId, familyName);
      setIsFamilyEditing(false);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function cancelFamilyEdit() {
    setFamilyName(family?.familyName || "");
    setError("");
    setIsFamilyEditing(false);
  }

  async function copyInviteLink() {
    if (!canCopy) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function handleAddGuest(event) {
    event.preventDefault();

    if (!guestName.trim()) {
      setError("Guest name is required.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      await addGuest(familyId, guestName);
      setGuestName("");
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isFamilyLoading) {
    return (
      <section className="admin-panel">
        <p className="admin-muted">Loading family...</p>
      </section>
    );
  }

  if (!family) {
    return (
      <section className="admin-panel admin-empty-state">
        <h2>Family not found.</h2>
        <button
          className="admin-button admin-button--primary"
          type="button"
          onClick={() => navigate("/admin/families")}
        >
          Back to Families
        </button>
      </section>
    );
  }

  return (
    <div className="admin-workspace">
      <div className="admin-page-title">
        <div>
          <p className="admin-eyebrow">Family Details</p>
          <h1>{family.familyName}</h1>
        </div>
        <button
          className="admin-button admin-button--ghost"
          type="button"
          onClick={() => navigate("/admin/families")}
        >
          Back to Families
        </button>
      </div>

      {error && (
        <p className="admin-alert admin-alert--error" role="alert">
          {error}
        </p>
      )}

      <section className="admin-panel">
        <div className="admin-family-detail-grid">
          <div className="admin-family-name-editor">
            <label>
              <span>Family Name</span>
              <input
                disabled={!isFamilyEditing || isSaving}
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    saveFamilyName();
                  }

                  if (event.key === "Escape") {
                    cancelFamilyEdit();
                  }
                }}
              />
            </label>
            <div className="admin-table-actions">
              {isFamilyEditing ? (
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
                    onClick={cancelFamilyEdit}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="admin-button admin-button--small"
                  type="button"
                  onClick={() => setIsFamilyEditing(true)}
                >
                  Edit Family Name
                </button>
              )}
            </div>
          </div>
          <div className="admin-status-panel">
            <span>Invitation Status</span>
            <strong className={`admin-status-pill admin-status-pill--${familyStatus.code}`}>
              {familyStatus.label}
            </strong>
          </div>
          <div className="admin-link-preview">
            <span>Invitation Link</span>
            <code>{canCopy ? inviteLink : "Add guests first"}</code>
          </div>
          <button
            className="admin-button admin-button--primary"
            disabled={!canCopy || isSaving}
            title={
              canCopy
                ? "Copy invitation link"
                : "Add at least one guest before copying invitation."
            }
            type="button"
            onClick={copyInviteLink}
          >
            {canCopy ? (copied ? "Copied" : "Copy Link") : "Add guests first"}
          </button>
        </div>
      </section>

      <section className="admin-panel">
        <form className="admin-create-form" onSubmit={handleAddGuest}>
          <label>
            <span>Add Guest</span>
            <input
              placeholder="Guest name"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
            />
          </label>
          <button className="admin-button admin-button--primary" disabled={isSaving}>
            Add Guest
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <p className="admin-eyebrow">Guests</p>
            <h2>Guest Table</h2>
          </div>
          <span className="admin-count-pill">{guests.length} guests</span>
        </div>

        {isGuestsLoading ? (
          <p className="admin-muted">Loading guests...</p>
        ) : guests.length === 0 ? (
          <div className="admin-empty-state">
            <h2>No guests yet.</h2>
            <p>Add at least one guest before copying the invitation link.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Status</th>
                    <th>Attending</th>
                    <th>Last Response Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGuests.map((guest) => (
                    <GuestTableRow familyId={familyId} guest={guest} key={guest.id} />
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={guests.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </section>
    </div>
  );
}
