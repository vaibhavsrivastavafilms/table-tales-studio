"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import VendorProfilePanel from "@/components/os/procurement/VendorProfilePanel";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";

export default function VendorDetailView({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const { db } = useProcurement();
  const vendor = db.vendors.find((v) => v.id === vendorId);

  if (!vendor) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <PageHeader title="Vendor not found" />
        <Link href="/os/procurement/vendors" className="text-sm text-[var(--os-accent)]">
          Back to vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          eyebrow="Vendor"
          title={vendor.name}
          description="Profile, documents, analytics, ledger, disputes, credit notes, and recovery."
        />
        <button
          type="button"
          onClick={() => router.push("/os/procurement/vendors")}
          className="text-sm text-[var(--os-accent)] hover:underline"
        >
          All vendors
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="os-card p-4 text-sm md:col-span-1">
          <p>
            <span className="text-[var(--os-fg-muted-on-card)]">GST</span>{" "}
            {vendor.gstNumber ?? "—"}
          </p>
          <p className="mt-2">
            <span className="text-[var(--os-fg-muted-on-card)]">PAN</span>{" "}
            {vendor.panNumber ?? "—"}
          </p>
          <p className="mt-2">
            <span className="text-[var(--os-fg-muted-on-card)]">Contact</span>{" "}
            {vendor.contactPerson ?? "—"}
          </p>
          <p className="mt-2">
            <span className="text-[var(--os-fg-muted-on-card)]">Phone</span>{" "}
            {vendor.phone ?? "—"}
          </p>
          <p className="mt-2">
            <span className="text-[var(--os-fg-muted-on-card)]">Email</span>{" "}
            {vendor.email ?? "—"}
          </p>
          <p className="mt-2">
            <span className="text-[var(--os-fg-muted-on-card)]">Terms</span>{" "}
            {vendor.paymentTermsDays} credit days
          </p>
          <p className="mt-2">
            <span className="text-[var(--os-fg-muted-on-card)]">Address</span>{" "}
            {vendor.address ?? "—"}
          </p>
        </div>
        <div className="md:col-span-2">
          <VendorProfilePanel vendorId={vendorId} />
        </div>
      </div>
    </div>
  );
}
