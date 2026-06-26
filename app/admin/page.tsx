import Link from "next/link";
import { AddFamilyForm } from "@/components/admin/add-family-form";
import { CopyInviteButton } from "@/components/admin/copy-invite-button";
import { SignOutForm } from "@/components/admin/sign-out-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { requireAdminUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/admin";
import {
  deleteFamilyAction,
  updateFamilyAction,
} from "@/lib/actions/families";

const statLabels = {
  totalFamilies: "Families",
  totalInvitedGuests: "Invited guests",
  totalAttending: "Attending",
  totalNotAttending: "Not attending",
  totalPending: "Pending",
};

export default async function AdminDashboardPage() {
  await requireAdminUser();
  const { stats, families } = await getDashboardData();

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin dashboard</p>
          <h1>Wedding invitations</h1>
        </div>
        <SignOutForm />
      </header>

      <section className="stats-grid" aria-label="RSVP summary">
        {Object.entries(stats).map(([key, value]) => (
          <article className="stat-card" key={key}>
            <span>{statLabels[key as keyof typeof statLabels]}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Families</p>
              <h2>Add a private invite</h2>
            </div>
          </div>
          <AddFamilyForm />
        </article>

        <article className="panel panel--wide">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Guest lists</p>
              <h2>Families and RSVP status</h2>
            </div>
          </div>

          {families.length === 0 ? (
            <div className="empty-state">
              <p>No families yet.</p>
              <span>Add the first family to generate a private invitation link.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Family</th>
                    <th>Guests</th>
                    <th>Invite link</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {families.map((family) => (
                    <tr key={family.id}>
                      <td>
                        <form action={updateFamilyAction} className="inline-edit-form">
                          <input type="hidden" name="familyId" value={family.id} />
                          <input
                            name="familyName"
                            defaultValue={family.family_name}
                            aria-label="Family name"
                            required
                          />
                          <SubmitButton variant="secondary" pendingLabel="Saving...">
                            Save
                          </SubmitButton>
                        </form>
                      </td>
                      <td>
                        <div className="guest-summary">
                          <strong>{family.guests.length}</strong>
                          <span>
                            {family.guests.filter((guest) => guest.attending === true).length} yes
                          </span>
                          <span>
                            {family.guests.filter((guest) => guest.attending === false).length} no
                          </span>
                          <span>
                            {family.guests.filter((guest) => guest.attending === null).length} pending
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="copy-row">
                          <code>{family.inviteLink}</code>
                          <CopyInviteButton inviteLink={family.inviteLink} />
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            className="button button--secondary"
                            href={`/admin/families/${family.id}`}
                          >
                            Manage
                          </Link>
                          <form action={deleteFamilyAction}>
                            <input type="hidden" name="familyId" value={family.id} />
                            <SubmitButton variant="danger" pendingLabel="Deleting...">
                              Delete
                            </SubmitButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      {families.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Recent guest statuses</p>
              <h2>All guests</h2>
            </div>
          </div>
          <div className="guest-chip-list">
            {families.flatMap((family) =>
              family.guests.map((guest) => (
                <span className="guest-chip" key={guest.id}>
                  {guest.guest_name}
                  <StatusBadge attending={guest.attending} />
                </span>
              )),
            )}
          </div>
        </section>
      )}
    </main>
  );
}
