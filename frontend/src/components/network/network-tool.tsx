"use client";

import { useEffect, useState } from "react";
import { ResultPanel } from "@/components/network/result-panel";
import { networkApi, type NetworkApiResponse, type NetworkMode } from "@/lib/network";
import {convertData,downloadTime} from "@/lib/traffic-tools";

const ipModes: NetworkMode[] = ["ip-lookup", "rdap", "reverse-dns", "blacklist", "ip-calculator"];

export function NetworkTool({ mode }: { mode: NetworkMode }) {
  const [ip, setIp] = useState("");
  const [asn, setAsn] = useState("");
  const [hostname, setHostname] = useState("");
  const [selector, setSelector] = useState("default");
  const [url, setUrl] = useState("https://example.com");
  const [recordType, setRecordType] = useState("A");
  const [port, setPort] = useState("443");
  const [cidr, setCidr] = useState("24");
  const [cidrInput, setCidrInput] = useState("");
  const [netmask, setNetmask] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(mode === "my-ip");
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode !== "my-ip") return;
    const controller = new AbortController();
    fetch(networkApi("/my-ip"), { headers: { Accept: "application/json" }, signal: controller.signal })
      .then(async response => {
        const payload = await response.json() as NetworkApiResponse;
        if (!response.ok || !payload.data) throw new Error(payload.message ?? "The lookup could not be completed.");
        return payload.data;
      })
      .then(setResult)
      .catch(caught => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "The network service is unavailable.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [mode]);

  async function request(url: string, options?: RequestInit) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(url, { ...options, headers: { Accept: "application/json", ...(options?.body ? { "Content-Type": "application/json" } : {}) } });
      const payload = await response.json() as NetworkApiResponse;
      if (!response.ok || !payload.data) throw new Error(payload.message ?? "The lookup could not be completed.");
      setResult(payload.data);
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "The network service is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === "ip-lookup") return request(networkApi(`/ip/${encodeURIComponent(ip)}`));
    if (mode === "asn") return request(networkApi(`/asn/${encodeURIComponent(asn)}`));
    if (mode === "rdap") return request(networkApi(`/rdap/${encodeURIComponent(ip)}`));
    if (mode === "reverse-dns") return request(networkApi(`/reverse-dns/${encodeURIComponent(ip)}`));
    if (mode === "hostname") return request(networkApi(`/hostname?hostname=${encodeURIComponent(hostname)}`));
    if (mode === "dns") return request(networkApi(`/dns?hostname=${encodeURIComponent(hostname)}&type=${recordType}`));
    if (mode === "spf" || mode === "dmarc") return request(networkApi(`/email/${mode}?domain=${encodeURIComponent(hostname)}`));
    if (mode === "dkim") return request(networkApi(`/email/dkim?domain=${encodeURIComponent(hostname)}&selector=${encodeURIComponent(selector)}`));
    if (mode === "redirect" || mode === "headers") return request(networkApi(mode === "redirect" ? "/redirect-check" : "/http-headers"), {method:"POST",body:JSON.stringify({url})});
    if (mode === "ssl") return request(networkApi("/ssl-certificate"), {method:"POST",body:JSON.stringify({hostname})});
    const body = mode === "port" ? { host: hostname, port: Number(port) }
      : mode === "blacklist" ? { ip }
        : mode === "subnet" ? { ip, cidr: Number(cidr) }
          : mode === "cidr" ? (cidrInput ? { cidr: cidrInput } : { netmask }) : { ip };
    const path = mode === "port" ? "/port-check" : mode === "blacklist" ? "/blacklist/check" : mode === "subnet" ? "/subnet/calculate" : mode === "cidr" ? "/cidr/calculate" : "/ip/calculate";
    return request(networkApi(path), { method: "POST", body: JSON.stringify(body) });
  }

  if (mode === "my-ip") return <div className="mt-8">{loading && <p className="rounded-2xl border bg-white p-5">Detecting the public address seen by SignalRate…</p>}{error && <ErrorMessage message={error} />}{result && <ResultPanel data={result} copyValue={String(result.ip ?? "")} />}</div>;
  if (mode === "bandwidth" || mode === "download-time") return <TransferCalculator mode={mode}/>;

  return <div className="mt-8"><form onSubmit={submit} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="grid gap-4 sm:grid-cols-[1fr_auto]">{ipModes.includes(mode) && <Field label="IP address"><input required value={ip} onChange={event => setIp(event.target.value)} placeholder="8.8.8.8 or 2001:4860:4860::8888" className="mt-2 w-full rounded-xl border p-3 font-mono" /></Field>}{mode === "asn" && <Field label="Autonomous System Number"><input required value={asn} onChange={event => setAsn(event.target.value)} placeholder="AS15169" className="mt-2 w-full rounded-xl border p-3 font-mono" /></Field>}{["hostname","dns","port","spf","dkim","dmarc","ssl"].includes(mode) && <Field label={mode === "port" ? "Public host or IP" : mode === "ssl" ? "Public TLS hostname" : "Public hostname or domain"}><input required value={hostname} onChange={event => setHostname(event.target.value)} placeholder="example.com" className="mt-2 w-full rounded-xl border p-3 font-mono" /></Field>}{mode === "dkim"&&<Field label="DKIM selector"><input required value={selector} onChange={e=>setSelector(e.target.value)} className="mt-2 w-full rounded-xl border p-3 font-mono"/></Field>}{["redirect","headers"].includes(mode)&&<Field label="Public HTTP or HTTPS URL"><input required type="url" value={url} onChange={e=>setUrl(e.target.value)} className="mt-2 w-full rounded-xl border p-3 font-mono"/></Field>}{mode === "dns" && <Field label="Record type"><select value={recordType} onChange={event => setRecordType(event.target.value)} className="mt-2 w-full rounded-xl border p-3">{["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA"].map(type => <option key={type}>{type}</option>)}</select></Field>}{mode === "port" && <Field label="Single port"><input required type="number" min="1" max="65535" value={port} onChange={event => setPort(event.target.value)} className="mt-2 w-full rounded-xl border p-3" /></Field>}{mode === "subnet" && <><Field label="IPv4 address"><input required value={ip} onChange={event => setIp(event.target.value)} placeholder="192.168.1.10" className="mt-2 w-full rounded-xl border p-3 font-mono" /></Field><Field label="CIDR prefix"><input required type="number" min="0" max="32" value={cidr} onChange={event => setCidr(event.target.value)} className="mt-2 w-full rounded-xl border p-3" /></Field></>}{mode === "cidr" && <><Field label="IPv4 CIDR"><input value={cidrInput} onChange={event => { setCidrInput(event.target.value); if (event.target.value) setNetmask(""); }} placeholder="192.168.1.10/24" className="mt-2 w-full rounded-xl border p-3 font-mono" /></Field><Field label="Or netmask"><input value={netmask} onChange={event => { setNetmask(event.target.value); if (event.target.value) setCidrInput(""); }} placeholder="255.255.255.0" className="mt-2 w-full rounded-xl border p-3 font-mono" /></Field></>}<button disabled={loading} className="self-end rounded-xl bg-[#315efb] px-5 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Checking…" : "Run lookup"}</button></div></form>{error && <ErrorMessage message={error} />}{result && <ResultPanel data={result} />}</div>;
}

function TransferCalculator({mode}:{mode:"bandwidth"|"download-time"}){const[value,setValue]=useState("100");const[unit,setUnit]=useState(mode==="bandwidth"?"Mbit":"MB");const[target,setTarget]=useState(mode==="bandwidth"?"Gbit":"Mbit");const[speed,setSpeed]=useState("100");const[result,setResult]=useState<Record<string,unknown>|null>(null);const[error,setError]=useState("");const units=["bit","Kbit","Mbit","Gbit","byte","KB","MB","GB","TB"];function calculate(e:React.FormEvent){e.preventDefault();try{setResult(mode==="bandwidth"?{input:Number(value),input_unit:unit,result:convertData(Number(value),unit,target),result_unit:target,convention:"decimal SI; 8 bits per byte"}:{file_size:Number(value),file_unit:unit,speed_mbit_per_second:Number(speed),...downloadTime(Number(value),unit,Number(speed),"Mbit")});setError("")}catch(caught){setResult(null);setError(caught instanceof Error?caught.message:"Invalid values.")}}return <div className="mt-8"><form onSubmit={calculate} className="grid gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-2"><Field label={mode==="bandwidth"?"Rate or amount":"File size"}><input type="number" min="0" required value={value} onChange={e=>setValue(e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></Field><Field label="Unit"><select value={unit} onChange={e=>setUnit(e.target.value)} className="mt-2 w-full rounded-xl border p-3">{units.map(v=><option key={v}>{v}</option>)}</select></Field>{mode==="bandwidth"?<Field label="Convert to"><select value={target} onChange={e=>setTarget(e.target.value)} className="mt-2 w-full rounded-xl border p-3">{units.map(v=><option key={v}>{v}</option>)}</select></Field>:<Field label="Connection speed (Mbit/s)"><input type="number" min="0.01" required value={speed} onChange={e=>setSpeed(e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></Field>}<button className="self-end rounded-xl bg-[#315efb] px-5 py-3 font-semibold text-white">Calculate locally</button></form>{error&&<ErrorMessage message={error}/>} {result&&<ResultPanel data={result}/>}</div>}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0 text-sm font-semibold">{label}{children}</label>;
}

function ErrorMessage({ message }: { message: string }) {
  return <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-rose-800">{message}</p>;
}
