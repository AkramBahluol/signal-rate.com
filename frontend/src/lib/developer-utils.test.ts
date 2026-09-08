import {describe,expect,it} from "vitest";
import {decodeBase64,decodeHtml,decodeJwt,diffLines,encodeBase64,encodeHtml,generateHash,generateSlug,generateUuidV4,timestampToDates,transformJson,transformUrl,validateJson,validateUuid} from "./developer-utils";

describe("JSON utilities",()=>{
  it("validates and formats nested JSON without changing numeric tokens",()=>{const input='{"nested":{"items":[true,null]},"large":9007199254740993}';expect(validateJson(input).valid).toBe(true);expect(transformJson(input)).toContain('"items": [');expect(transformJson(input)).toContain("9007199254740993");expect(transformJson(input,true)).toBe(input);});
  it("reports invalid JSON with a useful location",()=>{const result=validateJson('{\n  "name": "SignalRate",\n}');expect(result.valid).toBe(false);if(!result.valid){expect(result.message.length).toBeGreaterThan(0);expect(result.line).toBeGreaterThanOrEqual(2);}});
});

describe("encoding utilities",()=>{
  it("round-trips Base64 Unicode",()=>{const value="مرحبا 世界 👋";expect(decodeBase64(encodeBase64(value))).toBe(value);expect(decodeBase64(encodeBase64(value,true),true)).toBe(value);});
  it("rejects invalid Base64",()=>expect(()=>decodeBase64("%%%" )).toThrow(/valid Base64/));
  it("round-trips URL Unicode and rejects malformed escapes",()=>{const value="مرحبا world/世界";expect(transformUrl(transformUrl(value,"encode","component"),"decode","component")).toBe(value);expect(()=>transformUrl("%E0%A4%A","decode","component")).toThrow(/malformed/);});
  it("encodes and decodes HTML entities as text",()=>{const value='<script title="a&b">';expect(encodeHtml(value)).toBe("&lt;script title=&quot;a&amp;b&quot;&gt;");expect(decodeHtml("&lt;b&gt;&#x1F44B;&lt;/b&gt;")).toBe("<b>👋</b>");});
});

describe("token and identifier utilities",()=>{
  it("decodes a structurally valid JWT",()=>{const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE3MDAwMDAwMDB9.signature";const result=decodeJwt(token);expect(result.header.alg).toBe("HS256");expect(result.payload.sub).toBe("123");expect(result.claims.iat).toBe("2023-11-14T22:13:20.000Z");});
  it("rejects malformed JWTs",()=>expect(()=>decodeJwt("not-a-token")).toThrow(/three/));
  it("generates and validates UUID v4",()=>{const uuid=generateUuidV4();expect(uuid).toMatch(/^[0-9a-f-]{36}$/);expect(validateUuid(uuid)).toMatchObject({valid:true,version:4});expect(validateUuid(`{${uuid}}`).valid).toBe(true);expect(validateUuid("invalid").valid).toBe(false);});
});

describe("time, hash, diff, and slug utilities",()=>{
  it("handles Unix seconds and milliseconds",()=>{expect(timestampToDates("0","seconds").iso).toBe("1970-01-01T00:00:00.000Z");expect(timestampToDates("1700000000000","milliseconds").seconds).toBe(1700000000);expect(timestampToDates("-1","seconds").iso).toBe("1969-12-31T23:59:59.000Z");});
  it("matches the SHA-256 abc test vector",async()=>expect(await generateHash("abc","SHA-256")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"));
  it("produces a basic line diff",()=>expect(diffLines("same\nold","same\nnew")).toEqual([{type:"same",text:"same"},{type:"removed",text:"old"},{type:"added",text:"new"}]));
  it("generates slugs while retaining non-Latin text",()=>{expect(generateSlug("  Hello, Signal Rate!  ")).toBe("hello-signal-rate");expect(generateSlug("أدوات المطورين 2026")).toBe("أدوات-المطورين-2026");expect(generateSlug("Hello World",{separator:"_",lowercase:false})).toBe("Hello_World");});
});
