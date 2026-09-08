import type { ReactNode } from "react";
import { DataAllowance, PriceDisplay, VerificationBadge } from "@/components/mobile-plan";
import type { MobilePlan } from "@/lib/types";

export function PlanTable({ plans }: { plans: MobilePlan[] }) {
  const rows: [string, (plan: MobilePlan) => ReactNode][] = [
    ["Price", (plan) => <PriceDisplay plan={plan} />], ["Data", (plan) => <DataAllowance plan={plan} />],
    ["5G", (plan) => plan.five_g ? "Yes" : "No"], ["eSIM", (plan) => plan.esim ? "Yes" : "No"],
    ["Calls", (plan) => plan.unlimited_calls ? "Unlimited" : plan.calls_allowance_minutes ?? "Not stated"],
    ["SMS", (plan) => plan.unlimited_sms ? "Unlimited" : plan.sms_allowance ?? "Not stated"],
    ["Hotspot", (plan) => plan.hotspot_allowed === null ? "Not stated" : plan.hotspot_allowed ? "Included" : "No"],
    ["Roaming", (plan) => plan.roaming_notes ?? (plan.roaming ? "Included (scope not stated)" : "Not stated")],
    ["Contract", (plan) => plan.contract_length_months ? `${plan.contract_length_months} months` : "Not stated"],
    ["Activation", (plan) => `${plan.currency ?? "GBP"} ${plan.activation_fee}`],
    ["Last verified", (plan) => <VerificationBadge status={plan.verification_status} date={plan.last_verified_at} />],
  ];
  return <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead><tr><th className="p-4">Feature</th>{plans.map(plan => <th className="p-4" key={plan.id}>{plan.operator.brand ?? plan.operator.name}<br /><span className="text-slate-500">{plan.name}</span></th>)}</tr></thead><tbody>{rows.map(([label,value]) => <tr className="border-t" key={label}><th className="p-4">{label}</th>{plans.map(plan => <td className="p-4" key={plan.id}>{value(plan)}</td>)}</tr>)}</tbody></table></div>;
}
