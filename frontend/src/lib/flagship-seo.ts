import type { Metadata } from "next";
import { alternates } from "./i18n";
import { fullyLocalizedFlagshipPaths } from "./localized-routes";

export type FlagshipSeoPage = {
  path: string;
  title: string;
  heading: string;
  description: string;
  primaryIntent: string;
  queryCluster: string[];
  sections: { heading: string; body: string[] }[];
  faqs: { question: string; answer: string }[];
  related: { path: string; label: string; context: string }[];
};

const pages: FlagshipSeoPage[] = [
  {
    path: "/network/speed-test",
    title: "Internet Speed Test: Download, Upload, Ping & Jitter",
    heading: "Internet Speed Test",
    description: "Test download speed, upload speed, ping, and jitter from your browser to Cloudflare. Start a private, on-demand internet speed test with no saved results.",
    primaryIntent: "internet speed test",
    queryCluster: ["download speed test", "upload speed test", "ping test", "internet jitter test"],
    sections: [
      { heading: "How to read your internet speed test", body: ["Download and upload are measured in megabits per second (Mbps). Ping is the round-trip delay while the connection is idle, and jitter shows how much consecutive latency samples vary.", "A fast download result does not guarantee low delay. Video calls and games often benefit more from stable latency and low jitter than from very high peak throughput."] },
      { heading: "Why speed test results change", body: ["Wi-Fi signal, VPNs, device load, other household traffic, peering, and temporary congestion can affect a run. Compare several tests at different times and use Ethernet when diagnosing an access line.", "Test traffic goes directly between your browser and Cloudflare. SignalRate does not proxy or store the measurements."] },
    ],
    faqs: [
      { question: "What is a good internet speed?", answer: "A good result depends on the activity and number of users. Streaming needs sustained download capacity, cloud backups need upload capacity, and calls or games depend heavily on low, stable latency." },
      { question: "Why is Wi-Fi slower than my plan speed?", answer: "Distance, walls, interference, channel congestion, and older Wi-Fi hardware can reduce throughput before traffic reaches your internet connection." },
      { question: "Does this test save my result?", answer: "No. The test starts only when you choose it, runs from your browser to Cloudflare, and SignalRate does not store the result." },
    ],
    related: [
      { path: "/network/ping-test", label: "Ping & Latency Test", context: "Focus on connection delay and jitter." },
      { path: "/network/bandwidth-calculator", label: "Bandwidth Calculator", context: "Convert network rates and transferred data." },
      { path: "/network/download-time-calculator", label: "Download Time Calculator", context: "Estimate a transfer from file size and speed." },
      { path: "/network/what-is-my-ip", label: "What Is My IP?", context: "See the public IP used by this connection." },
    ],
  },
  {
    path: "/network/what-is-my-ip",
    title: "What Is My IP Address? Check Your Public IPv4 or IPv6",
    heading: "What Is My IP Address?",
    description: "See the public IPv4 or IPv6 address visible to websites, plus source-labelled network details such as reverse DNS and approximate provider information.",
    primaryIntent: "what is my IP",
    queryCluster: ["my IP address", "public IP", "IPv4 address", "IPv6 address"],
    sections: [
      { heading: "What your public IP address means", body: ["Your public IP is the address that reaches SignalRate. It may belong to your router, mobile carrier, VPN, proxy, or an organization rather than directly to one device.", "IPv4 uses a shorter dotted format, while IPv6 provides a much larger address space. Some connections can use both and the address shown depends on how this request reached the site."] },
      { heading: "Location and privacy limits", body: ["IP-based provider and location data is approximate. It can identify a network or broad area, but it does not reveal a precise home address and should not be treated as proof of identity.", "A VPN can change the public address websites observe. Local addresses such as 192.168.x.x are private network addresses and are not the public IP shown here."] },
    ],
    faqs: [
      { question: "Is my public IP the same on every device?", answer: "Devices behind the same router often share one public IPv4 address, while IPv6 addressing and mobile networks can behave differently." },
      { question: "Can an IP address reveal my exact location?", answer: "No. IP geolocation is approximate and may reflect a provider, gateway, or nearby city rather than a device's exact location." },
      { question: "Why did my IP address change?", answer: "Providers may assign dynamic addresses, and reconnecting, changing networks, using mobile data, or enabling a VPN can change the address websites see." },
    ],
    related: [
      { path: "/network/ip-lookup", label: "IP Address Lookup", context: "Inspect a different public IP address." },
      { path: "/network/asn-lookup", label: "ASN Lookup", context: "Identify the network announcing an IP." },
      { path: "/network/reverse-dns", label: "Reverse DNS Lookup", context: "Check the PTR hostname for an address." },
      { path: "/network/speed-test", label: "Internet Speed Test", context: "Measure the current connection." },
    ],
  },
  {
    path: "/developer-tools/password-generator",
    title: "Secure Password Generator: Create Strong Random Passwords",
    heading: "Secure Password Generator",
    description: "Create strong random passwords locally with your browser's cryptographic generator. Choose length and character sets without uploading or storing the result.",
    primaryIntent: "password generator",
    queryCluster: ["strong password generator", "random password generator", "secure password generator", "password maker"],
    sections: [
      { heading: "How the secure password generator works", body: ["Characters are selected with the browser cryptographic random generator rather than a predictable pseudo-random shortcut. You control length and the permitted character groups.", "The entropy estimate describes the theoretical search space for the selected settings. It is not a guarantee against phishing, malware, account recovery attacks, or a service storing passwords poorly."] },
      { heading: "Create a stronger password", body: ["Prefer a long, unique password for every account. A password manager makes unique credentials practical and reduces the temptation to reuse memorable patterns.", "If a site limits symbols or length, adjust the options here but keep as much length and variety as the site accepts. Never reuse a generated password on another account."] },
    ],
    faqs: [
      { question: "Are generated passwords sent to SignalRate?", answer: "No. Generation happens locally in your browser, and the password is not uploaded, logged, or stored by SignalRate." },
      { question: "How long should a random password be?", answer: "Longer is generally stronger. Use the longest unique password the service and your password manager support; 16 or more random characters is a practical starting point for many accounts." },
      { question: "Should every account have a different password?", answer: "Yes. Unique passwords prevent a breach at one service from exposing accounts elsewhere." },
    ],
    related: [
      { path: "/developer-tools/hash-generator", label: "Hash Generator", context: "Create SHA-2 digests locally." },
      { path: "/developer-tools/uuid-generator", label: "UUID Generator", context: "Generate random identifiers, not passwords." },
      { path: "/developer-tools/jwt-decoder", label: "JWT Decoder", context: "Inspect token content without asserting trust." },
      { path: "/network/ssl-checker", label: "SSL Certificate Checker", context: "Inspect a site's HTTPS certificate." },
    ],
  },
  {
    path: "/tools/time-zone-converter",
    title: "Time Zone Converter: Convert World Times Accurately",
    heading: "Time Zone Converter",
    description: "Convert a date and time between IANA time zones with daylight-saving rules. Compare world times accurately for meetings, travel, and remote work.",
    primaryIntent: "time zone converter",
    queryCluster: ["timezone converter", "world time converter", "convert time zones", "meeting time converter"],
    sections: [
      { heading: "Convert time zones with daylight-saving rules", body: ["Choose the source date, time, and IANA zone, then select the destination zone. The converter applies the offset in effect for that date rather than assuming a fixed difference.", "Named zones such as Europe/London are safer for future scheduling than abbreviations such as CST, which can be ambiguous and may not describe daylight-saving changes."] },
      { heading: "Avoid common scheduling mistakes", body: ["A local time can be skipped or repeated when clocks change. If a meeting matters, include the date, named time zone, and an unambiguous UTC reference in the invitation.", "Time-zone rules can change by government decision. Recheck future events close to the date, especially around seasonal clock changes."] },
    ],
    faqs: [
      { question: "Does the converter account for daylight saving time?", answer: "Yes. It uses browser-supported IANA time-zone rules for the selected date, so the applicable seasonal offset is used." },
      { question: "Why can the offset between two cities change?", answer: "Regions start and end daylight saving time on different dates, and some regions do not use it at all." },
      { question: "What is an IANA time zone?", answer: "It is a named region such as America/New_York that carries historical and current clock rules, unlike a fixed UTC offset." },
    ],
    related: [
      { path: "/developer-tools/unix-timestamp", label: "Unix Timestamp Converter", context: "Convert epoch values to readable dates." },
      { path: "/calculators/date-calculator", label: "Date Calculator", context: "Add, subtract, or compare calendar dates." },
      { path: "/calculators/time-calculator", label: "Time Calculator", context: "Calculate elapsed times and durations." },
      { path: "/calculators/age-calculator", label: "Age Calculator", context: "Find calendar-aware age and next birthday." },
    ],
  },
  {
    path: "/network/is-it-down",
    title: "Is It Down? Check Website Availability",
    heading: "Is It Down? Website Availability Checker",
    description: "Check whether a public website is reachable from SignalRate's server. See the HTTP response and timing without confusing a local browser issue with a wider outage.",
    primaryIntent: "is it down",
    queryCluster: ["website down checker", "is website down", "site availability checker", "check website status"],
    sections: [
      { heading: "What the website availability check tells you", body: ["The checker requests the public URL from SignalRate's server and reports the observed HTTP response and timing. A successful result means the site answered from that check location at that moment.", "A failed result can indicate DNS, TLS, connection, timeout, or HTTP problems. It does not by itself prove that every visitor is affected."] },
      { heading: "Local problem or wider outage?", body: ["If SignalRate can reach the site but your browser cannot, try another network, disable a VPN temporarily, check DNS, and review browser or firewall errors.", "If both checks fail, inspect DNS records, certificate validity, redirects, and the origin service. Repeat the check before drawing conclusions from a temporary network error."] },
    ],
    faqs: [
      { question: "Does one failed check prove a website is down for everyone?", answer: "No. The result represents one check location and moment. Regional routing, DNS, firewall rules, or temporary failures can affect users differently." },
      { question: "Can the checker test private or local addresses?", answer: "No. Only public destinations are accepted; private, loopback, link-local, and unsafe resolved addresses are blocked." },
      { question: "What does an HTTP error mean?", answer: "A response such as 404 or 500 proves the server answered, but the requested resource or application may still be unavailable." },
    ],
    related: [
      { path: "/network/dns-lookup", label: "DNS Lookup", context: "Verify the domain's public DNS records." },
      { path: "/network/ssl-checker", label: "SSL Certificate Checker", context: "Check certificate names and expiry." },
      { path: "/network/redirect-checker", label: "Redirect Checker", context: "Follow the site's HTTP redirect chain." },
      { path: "/network/http-header-checker", label: "HTTP Header Checker", context: "Inspect the final response headers." },
    ],
  },
  {
    path: "/network/ping-test",
    title: "Ping Test: Check Internet Latency & Jitter",
    heading: "Ping Test & Internet Latency Checker",
    description: "Run a browser ping test to measure latency and jitter to Cloudflare. Compare connection responsiveness without storing your results.",
    primaryIntent: "ping test",
    queryCluster: ["latency test", "internet ping test", "jitter test", "connection response time"],
    sections: [
      { heading: "Understand ping, latency, and jitter", body: ["Latency is the round-trip time for a small request, reported in milliseconds. Lower values generally feel more responsive in calls, games, remote desktops, and interactive websites.", "Jitter describes variation between latency samples. A stable connection can be more usable than one with a lower best result but frequent spikes."] },
      { heading: "What this browser ping test measures", body: ["Browsers cannot send traditional ICMP echo packets, so this tool measures timed web requests to Cloudflare infrastructure. It is useful for connection responsiveness but is not an ICMP ping to an arbitrary server.", "Wi-Fi interference, VPNs, device load, routing, and congestion can change the result. Run several samples and compare wired and wireless connections when troubleshooting."] },
    ],
    faqs: [
      { question: "What is the difference between ping and latency?", answer: "Ping is commonly used as shorthand for a latency measurement. Traditional ping uses ICMP, while this browser tool times web requests because browsers cannot send ICMP packets." },
      { question: "What causes high jitter?", answer: "Congestion, unstable Wi-Fi, competing traffic, overloaded equipment, and changing network routes can make delay vary between samples." },
      { question: "Does a low ping mean my download is fast?", answer: "No. Latency measures responsiveness, while throughput measures how much data moves per second. Test both when diagnosing a connection." },
    ],
    related: [
      { path: "/network/speed-test", label: "Internet Speed Test", context: "Measure throughput alongside latency." },
      { path: "/network/is-it-down", label: "Is It Down?", context: "Check a public website from SignalRate's server." },
      { path: "/network/dns-lookup", label: "DNS Lookup", context: "Inspect the public DNS records for a domain." },
      { path: "/network/bandwidth-calculator", label: "Bandwidth Calculator", context: "Convert rates and data quantities." },
    ],
  },
  {
    path: "/calculators/percentage-calculator",
    title: "Percentage Calculator: Percent, Change & Difference",
    heading: "Percentage Calculator",
    description: "Calculate a percentage of a number, what percent one value is of another, percentage change, and percentage increase or decrease with clear formulas.",
    primaryIntent: "percentage calculator",
    queryCluster: ["calculate percentage", "percentage change calculator", "percentage increase", "percentage difference"],
    sections: [
      { heading: "Choose the percentage calculation you need", body: ["Use percentage of a number for questions such as 15% of 80. Use what percent for questions such as 12 is what percent of 48. Percentage change compares an old value with a new value.", "The displayed formula keeps the calculation auditable. Percentage points are different: a rate moving from 20% to 25% rises by 5 percentage points but by 25 percent relative to the original rate."] },
      { heading: "Percentage change and zero values", body: ["Percentage change divides the difference by the original value. When the original value is zero, ordinary percentage change is undefined because division by zero has no finite result.", "Round only the final result when accuracy matters. Rounding intermediate values can produce avoidable differences in financial, scientific, or reporting work."] },
    ],
    faqs: [
      { question: "How do I calculate a percentage of a number?", answer: "Divide the percentage by 100, then multiply by the number. For example, 15% of 80 is 0.15 × 80 = 12." },
      { question: "How is percentage change calculated?", answer: "Subtract the old value from the new value, divide by the old value, and multiply by 100. A zero old value makes the standard formula undefined." },
      { question: "What is the difference between percent and percentage points?", answer: "Percentage points describe the absolute gap between two percentages; percent change measures that gap relative to the starting percentage." },
    ],
    related: [
      { path: "/calculators/compound-interest-calculator", label: "Compound Interest Calculator", context: "Model growth over repeated periods." },
      { path: "/calculators/loan-calculator", label: "Loan Payment Calculator", context: "Estimate payment and interest totals." },
      { path: "/calculators/unit-converter", label: "Unit Converter", context: "Convert measurements accurately." },
      { path: "/calculators/data-usage-calculator", label: "Data Usage Calculator", context: "Estimate recurring internet usage." },
    ],
  },
  {
    path: "/calculators/currency-converter",
    title: "Currency Converter Using ECB Reference Rates",
    heading: "Currency Converter",
    description: "Convert major currencies using cached European Central Bank reference rates. See the rate source and reference date before using the result.",
    primaryIntent: "currency converter",
    queryCluster: ["exchange rate calculator", "convert currencies", "ECB exchange rates", "currency conversion"],
    sections: [
      { heading: "How the currency conversion is calculated", body: ["SignalRate converts through the shared base values in the published ECB reference-rate set. The tool shows the source and reference date so you can distinguish a reference conversion from a live trading quote.", "Reference rates are normally published on working days and may remain unchanged on weekends or holidays. The cached data avoids presenting an unknown or fabricated rate when the source is unavailable."] },
      { heading: "Reference rate versus the amount you pay", body: ["Banks, card issuers, exchanges, and money-transfer services can add spreads, commissions, or fixed fees. Their settlement time and rate may differ from the ECB reference rate.", "Use the result for an indicative comparison, then confirm the provider's final quote before a purchase, transfer, accounting entry, or financial decision."] },
    ],
    faqs: [
      { question: "Are these live foreign-exchange trading rates?", answer: "No. The converter uses cached ECB reference rates and displays their reference date; it is not a real-time market feed or executable quote." },
      { question: "Why is my bank's conversion different?", answer: "A bank or payment provider may use a different rate time and add a spread, fee, or card-network adjustment." },
      { question: "Can I use the result for a financial transaction?", answer: "Treat it as an informative estimate. Confirm the actual rate and fees with the service executing the transaction." },
    ],
    related: [
      { path: "/calculators/percentage-calculator", label: "Percentage Calculator", context: "Calculate markups, discounts, and changes." },
      { path: "/calculators/loan-calculator", label: "Loan Payment Calculator", context: "Estimate fixed-rate repayments." },
      { path: "/calculators/compound-interest-calculator", label: "Compound Interest Calculator", context: "Estimate long-term compound growth." },
      { path: "/calculators/unit-converter", label: "Unit Converter", context: "Convert common measurements." },
    ],
  },
  {
    path: "/network/ssl-checker",
    title: "SSL Certificate Checker: Expiry, Issuer & Hostname",
    heading: "SSL Certificate Checker",
    description: "Check the TLS certificate served by a public hostname. Review expiry, validity dates, issuer, and covered domain names without bypassing network safety controls.",
    primaryIntent: "SSL checker",
    queryCluster: ["SSL certificate checker", "certificate expiry checker", "TLS checker", "HTTPS certificate check"],
    sections: [
      { heading: "What the SSL certificate check covers", body: ["The checker connects to a public HTTPS hostname and reports the certificate it receives, including validity dates, issuer, and subject alternative names. This helps identify an expired certificate or hostname mismatch.", "Modern HTTPS uses TLS even though the older term SSL remains common. A valid certificate confirms part of the encrypted connection setup; it does not prove that a website or its content is trustworthy."] },
      { heading: "Certificate expiry and chain limitations", body: ["Renew certificates before expiry and verify that the server presents the intended certificate after deployment. Load balancers, regional edges, and CDNs can present different chains, so test the hostname clients actually use.", "The observation is made from SignalRate's check location at one moment. Client trust stores and network paths can differ, so independently verify critical production changes."] },
    ],
    faqs: [
      { question: "What happens when an SSL certificate expires?", answer: "Browsers and clients normally show a security warning or reject the connection because the certificate is outside its validity period." },
      { question: "Does a valid certificate mean a website is safe?", answer: "No. It helps authenticate the hostname and encrypt transport, but it does not validate the site's business, content, or application security." },
      { question: "Why does the certificate include several domain names?", answer: "Subject alternative names allow one certificate to cover multiple hostnames. The requested hostname must match one of the permitted names." },
    ],
    related: [
      { path: "/network/certificate-chain-checker", label: "Certificate Chain Checker", context: "Inspect the certificates served in the chain." },
      { path: "/network/tls-version-checker", label: "TLS Version Checker", context: "Test TLS 1.2 and TLS 1.3 support." },
      { path: "/network/https-checker", label: "HTTPS Checker", context: "Review redirects, certificate validity, and HSTS." },
      { path: "/network/redirect-checker", label: "Redirect Checker", context: "Follow HTTP and HTTPS redirects." },
    ],
  },
  {
    path: "/developer-tools/json-formatter",
    title: "JSON Formatter & Beautifier: Validate or Minify JSON",
    heading: "JSON Formatter & Beautifier",
    description: "Format, beautify, validate, or minify JSON locally in your browser. Find syntax errors without uploading source code or data to SignalRate.",
    primaryIntent: "JSON formatter",
    queryCluster: ["JSON beautifier", "pretty print JSON", "JSON validator", "minify JSON"],
    sections: [
      { heading: "Format and validate JSON safely", body: ["Pretty printing adds indentation and line breaks without changing parsed values. Minifying removes insignificant whitespace for a compact representation. Both operations run in your browser.", "Validation checks the strict JSON grammar and reports parsing errors. Common problems include trailing commas, single-quoted strings, unquoted property names, and invalid escape sequences."] },
      { heading: "Formatting does not validate a data model", body: ["Syntactically valid JSON can still have missing fields, unexpected types, or values an application rejects. Use a JSON Schema validator or application-specific checks when structure and business rules matter.", "Review sensitive data before copying it elsewhere. SignalRate does not upload or store the editor input, but your own clipboard and browser environment remain under your control."] },
    ],
    faqs: [
      { question: "Does JSON formatting change the data?", answer: "Formatting changes whitespace around parsed JSON values. It does not intentionally rename keys or change strings, numbers, booleans, arrays, objects, or null values." },
      { question: "Why is my JSON invalid?", answer: "Typical causes are trailing commas, single quotes, comments, unquoted keys, malformed numbers, or invalid backslash escapes, none of which strict JSON permits." },
      { question: "Is the JSON uploaded to a server?", answer: "No. Formatting, validation, and minification run locally in your browser, and SignalRate does not store the input." },
    ],
    related: [
      { path: "/developer-tools/json-validator", label: "JSON Validator", context: "Focus on syntax and error location." },
      { path: "/developer-tools/json-yaml-converter", label: "JSON ↔ YAML Converter", context: "Convert structured data locally." },
      { path: "/developer-tools/csv-json-converter", label: "CSV ↔ JSON Converter", context: "Convert rows and object arrays." },
      { path: "/developer-tools/text-diff", label: "Text Diff", context: "Compare formatted outputs line by line." },
    ],
  },
];

export const flagshipSeoByPath = Object.fromEntries(pages.map((page) => [page.path, page])) as Record<string, FlagshipSeoPage | undefined>;
export const flagshipPaths = new Set(pages.map((page) => page.path));
export const flagshipSeoPages = pages;

export function flagshipMetadata(path: string): Metadata | undefined {
  const page = flagshipSeoByPath[path];
  if (!page) return undefined;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: page.path, ...(fullyLocalizedFlagshipPaths.has(path)?{languages:alternates(path)}:{}) },
    openGraph: { title: `${page.title} | SignalRate`, description: page.description, url: page.path, type: "website" },
  };
}
