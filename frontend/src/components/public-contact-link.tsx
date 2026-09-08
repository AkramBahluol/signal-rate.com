import Link from "next/link";

import { contactEmail } from "@/lib/site";

const className = "font-semibold text-blue-700 underline";

export function PublicContactLink() {
  if (!contactEmail) {
    return <Link className={className} href="/contact">contact page</Link>;
  }

  return <a className={className} href={`mailto:${contactEmail}`}>{contactEmail}</a>;
}
