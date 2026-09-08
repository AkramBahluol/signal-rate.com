export const finite = (value: number) =>
  Number.isFinite(value) ? value : null;
export function percentage(mode: string, a: number, b: number) {
  switch (mode) {
    case "of":
      return finite((a * b) / 100);
    case "ratio":
      return b === 0 ? null : finite((a / b) * 100);
    case "change":
      return a === 0 ? null : finite(((b - a) / Math.abs(a)) * 100);
    case "increase":
      return finite(a * (1 + b / 100));
    case "decrease":
      return finite(a * (1 - b / 100));
    default:
      return null;
  }
}
export function exactAge(birth: Date, on: Date) {
  if (birth > on) return null;
  let years = on.getUTCFullYear() - birth.getUTCFullYear(),
    months = on.getUTCMonth() - birth.getUTCMonth(),
    days = on.getUTCDate() - birth.getUTCDate();
  if (days < 0) {
    months--;
    days += new Date(
      Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), 0),
    ).getUTCDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  const totalDays = Math.floor(
    (Date.UTC(on.getUTCFullYear(), on.getUTCMonth(), on.getUTCDate()) -
      Date.UTC(
        birth.getUTCFullYear(),
        birth.getUTCMonth(),
        birth.getUTCDate(),
      )) /
      86400000,
  );
  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    totalMonths: years * 12 + months,
  };
}
export function dateDifference(from: Date, to: Date) {
  const sign = to >= from ? 1 : -1;
  const a = sign === 1 ? from : to,
    b = sign === 1 ? to : from;
  const age = exactAge(a, b)!;
  return { ...age, sign };
}
export function addCalendar(
  date: Date,
  amount: number,
  unit: "days" | "weeks" | "months" | "years",
) {
  const d = new Date(date);
  if (unit === "days" || unit === "weeks")
    d.setUTCDate(d.getUTCDate() + amount * (unit === "weeks" ? 7 : 1));
  else {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    if (unit === "months") d.setUTCMonth(d.getUTCMonth() + amount);
    else d.setUTCFullYear(d.getUTCFullYear() + amount);
    d.setUTCDate(
      Math.min(
        day,
        new Date(
          Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
        ).getUTCDate(),
      ),
    );
  }
  return d;
}
export function timeDifference(a: string, b: string) {
  const seconds = (v: string) => {
    const [h = 0, m = 0, s = 0] = v.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };
  let d = seconds(b) - seconds(a);
  if (d < 0) d += 86400;
  return d;
}
export function shiftTime(value: string, deltaSeconds: number) {
  const start = timeDifference("00:00:00", value);
  const v = (((start + deltaSeconds) % 86400) + 86400) % 86400;
  return [Math.floor(v / 3600), Math.floor((v % 3600) / 60), v % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
export function loan(principal: number, annualRate: number, months: number) {
  if (principal < 0 || annualRate < 0 || months <= 0) return null;
  const r = annualRate / 1200,
    payment =
      r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
  let balance = principal;
  const schedule = Array.from({ length: months }, (_, i) => {
    const interest = r === 0 ? 0 : balance * r;
    const paidPrincipal =
      i === months - 1 ? balance : Math.min(balance, payment - interest);
    balance = Math.max(0, balance - paidPrincipal);
    return {
      number: i + 1,
      payment: i === months - 1 ? paidPrincipal + interest : payment,
      principal: paidPrincipal,
      interest,
      balance,
    };
  });
  return {
    payment,
    totalPayments: schedule.reduce((s, x) => s + x.payment, 0),
    totalInterest: schedule.reduce((s, x) => s + x.interest, 0),
    schedule,
  };
}
export function compound(
  principal: number,
  annualRate: number,
  years: number,
  contribution = 0,
  frequency = 12,
  compoundings = 12,
) {
  if (
    [principal, annualRate, years, contribution].some((v) => v < 0) ||
    frequency <= 0 ||
    compoundings <= 0
  )
    return null;
  const rows = [];
  let balance = principal,
    totalContributions = principal;
  for (let year = 1; year <= Math.ceil(years); year++) {
    const periods = Math.min(1, years - year + 1) * compoundings;
    for (let i = 0; i < periods; i++) {
      balance *= 1 + annualRate / 100 / compoundings;
      const adds = frequency / compoundings;
      balance += contribution * adds;
      totalContributions += contribution * adds;
    }
    rows.push({
      year,
      balance,
      contributions: totalContributions,
      interest: balance - totalContributions,
    });
  }
  return {
    balance,
    totalContributions,
    interest: balance - totalContributions,
    rows,
  };
}
const linear = (factor: number) => (v: number) => v * factor;
export const units = {
  length: {
    m: linear(1),
    km: linear(1000),
    mi: linear(1609.344),
    ft: linear(0.3048),
  },
  mass: { kg: linear(1), lb: linear(0.45359237) },
  speed: {
    "m/s": linear(1),
    "km/h": linear(1 / 3.6),
    mph: linear(0.44704),
    Mbps: linear(125000),
    "MB/s": linear(1e6),
  },
  data: {
    B: linear(1),
    KB: linear(1e3),
    MB: linear(1e6),
    GB: linear(1e9),
    KiB: linear(1024),
    MiB: linear(1048576),
    GiB: linear(1073741824),
  },
  temperature: {
    C: (v: number) => v,
    F: (v: number) => ((v - 32) * 5) / 9,
    K: (v: number) => v - 273.15,
  },
} as const;
export function convertUnit(
  category: keyof typeof units,
  value: number,
  from: string,
  to: string,
) {
  const group = units[category] as Record<string, (v: number) => number>;
  if (!group[from] || !group[to]) return null;
  const base = group[from](value);
  if (category === "temperature") {
    if (to === "C") return base;
    if (to === "F") return (base * 9) / 5 + 32;
    return base + 273.15;
  }
  const factor = group[to](1);
  return base / factor;
}
export function dataUsage(hoursPerDay: number, gbPerHour: number) {
  const daily = hoursPerDay * gbPerHour;
  return { daily, weekly: daily * 7, monthly: daily * 30 };
}
