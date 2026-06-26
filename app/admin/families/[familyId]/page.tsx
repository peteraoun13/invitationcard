import Link from "next/link";
import { notFound } from "next/navigation";
import { AddGuestForm } from "@/components/admin/add-guest-form";
import { CopyInviteButton } from "@/components/admin/copy-invite-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { requireAdminUser } from "@/lib/auth";
import { getFamilyDetail } from "@/lib/data/admin";
import {
  regenerateFamilyTokenAction,
  updateFamilyAction,
} from "@/lib/actions/families";
import { deleteGuestAction, updateGuestAction } from "@/lib/actions/guests";

type FamilyDetailPageProps = {
  params: Promise<{
    familyId: string;
  }>;
};

export default async function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  await requireAdminUser();

  const { familyId } = await params;
  const family = await getFamilyDetail(familyId);

  if (!family) {
    notFound();
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <Link className="back-link" href="/admin">
            Back to dashboard
          </Link>
          <p className="eyebrow">Family management</p>
          <h1>{family.family_name}</h1>
        </div>
      </header>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Family</p>
              <h2>Invite details</h2>
            </div>
          </div>

          <form action={updateFamilyAction} className="panel-form">
            <input type="hidden" name="familyId" value={family.id} />
            <label className="field">
              <span>Family name</span>
              <input name="familyName" defaultValue={family.family_name} required />
            </label>
            <SubmitButton variant="secondary" pendingLabel="Saving...">
              Save name
            </SubmitButton>
          </form>

          <div className="copy-row copy-row--stacked">
            <span>Private invitation link</span>
            <code>{family.inviteLink}</code>
            <CopyInviteButton inviteLink={family.inviteLink} />
          </div>

          <form action={regenerateFamilyTokenAction} className="panel-form">
            <input type="hidden" name="familyId" value={family.id} />
            <input type="hidden" name="familyName" value={family.family_name} />
            <SubmitButton variant="danger" pendingLabel="Generating...">
              Generate new secure link
            </SubmitButton>
            <p className="muted small">
              This invalidates the previous private link for this family.
            </p>
          </form>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Guests</p>
              <h2>Add guest</h2>
            </div>
          </div>
          <AddGuestForm familyId={family.id} />
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">RSVP list</p>
            <h2>Guests in this family</h2>
          </div>
        </div>

        {family.guests.length === 0 ? (
          <div className="empty-state">
            <p>No guests in this family yet.</p>
            <span>Add each invited guest so the RSVP page can show only this family.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {family.guests.map((guest) => (
                  <tr key={guest.id}>
                    <td>
                      <form action={updateGuestAction} className="inline-edit-form">
                        <input type="hidden" name="familyId" value={family.id} />
                        <input type="hidden" name="guestId" value={guest.id} />
                        <input
                          name="guestName"
                          defaultValue={guest.guest_name}
                          aria-label="Guest name"
                          required
                        />
                        <SubmitButton variant="secondary" pendingLabel="Saving...">
                          Save
                        </SubmitButton>
                      </form>
                    </td>
                    <td>
                      <StatusBadge attending={guest.attending} />
                    </td>
                    <td>
                      <form action={deleteGuestAction}>
                        <input type="hidden" name="familyId" value={family.id} />
                        <input type="hidden" name="guestId" value={guest.id} />
                        <SubmitButton variant="danger" pendingLabel="Deleting...">
                          Delete
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">History</p>
            <h2>RSVP submissions</h2>
          </div>
        </div>

        {family.submissions.length === 0 ? (
          <div className="empty-state">
            <p>No RSVP submission yet.</p>
            <span>When this family responds, the submission will appear here.</span>
          </div>
        ) : (
          <div className="submission-list">
            {family.submissions.map((submission) => (
              <article className="submission-item" key={submission.id}>
                <strong>
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(submission.submitted_at))}
                </strong>
                <p>{submission.notes || "No notes added."}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
