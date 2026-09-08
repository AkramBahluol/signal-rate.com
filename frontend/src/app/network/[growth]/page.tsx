import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GrowthToolPage } from "@/components/growth-tool-page";
import { alternates } from "@/lib/i18n";
import { growthByPath, growthTools } from "@/lib/growth-tools";
type Props = { params: Promise<{ growth: string }> };
export function generateStaticParams() {
  return growthTools
    .filter((t) => t.path.startsWith("/network/") && !t.kind.endsWith("-reuse"))
    .map((t) => ({ growth: t.path.split("/").at(-1)! }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = growthByPath[`/network/${(await params).growth}`];
  return t
    ? {
        title: t.title,
        description: t.description,
        alternates: { canonical: t.path, languages: alternates(t.path) },
      }
    : {};
}
export default async function Page({ params }: Props) {
  const t = growthByPath[`/network/${(await params).growth}`];
  if (!t) notFound();
  return <GrowthToolPage tool={t} />;
}
