import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import { getAccountBySlug, getBookingOptions } from "@/lib/booking";
import { BookingFlow } from "@/components/booking/BookingFlow";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const account = await getAccountBySlug(params.slug);
  return {
    title: account ? `Reservar · ${account.businessName}` : "Reservar",
  };
}

export default async function ReservarPage({
  params,
}: {
  params: { slug: string };
}) {
  const account = await getAccountBySlug(params.slug);
  if (!account) notFound();
  const options = await getBookingOptions(account.ownerId);

  return (
    <AppProviders initialSkin={account.businessType}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-skin','${account.businessType}');`,
        }}
      />
      <BookingFlow
        account={{
          slug: account.slug,
          businessName: account.businessName,
          publicPhone: account.publicPhone,
        }}
        options={options}
      />
    </AppProviders>
  );
}
