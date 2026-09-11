import { formatDate } from "@/lib/format";
import { ramcoMemberForListing } from "@/lib/ramco";
import type { Listing } from "@/lib/types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="kicker">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  );
}

export function RamcoMemberCard({ listing }: { listing: Listing }) {
  const member = ramcoMemberForListing(listing);

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="kicker">Listing agent</p>
        <div className="flex shrink-0 items-center gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--bg-soft)] px-2.5 py-1.5">
          <img src="/ramco-logo.png" alt="RAMCO" width={88} height={23} className="h-6 w-auto" />
          <span className="text-xs font-semibold text-[var(--ok)]">Connected</span>
        </div>
      </div>
      <h2 className="stat mt-3 text-[1.45rem]">
        {member.name}, {member.memberType}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
        {member.officeName} · {member.primaryAssociation}
      </p>

      <div className="mt-5 grid gap-4 border-t border-[var(--line)] pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Member status" value={member.status} />
        <Field label="NRDS ID" value={member.nrdsId} />
        <Field label="Member join date" value={formatDate(member.joinedAt)} />
        <Field label="License" value={member.licenseNumber} />
        <Field label="Office ID" value={member.officeId} />
        <Field label="State association" value={member.stateAssociation} />
        <Field label="Dues paid through" value={formatDate(member.duesPaidThrough)} />
        <Field label="Last RAMCO sync" value={formatDate(member.lastSyncedAt)} />
        <Field label="Phone" value={member.phone} />
        <Field label="Email" value={member.email} />
        {member.designations.length > 0 ? (
          <Field label="Designations" value={member.designations.join(" · ")} />
        ) : null}
      </div>
    </section>
  );
}
