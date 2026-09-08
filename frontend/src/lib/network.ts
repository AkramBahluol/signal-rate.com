export type {NetworkMode} from "@/lib/network-tools";
export type NetworkApiResponse={data:Record<string,unknown>|null;message?:string;errors?:Record<string,string[]>};
export const networkApi=(path:string)=>`${process.env.NEXT_PUBLIC_API_URL??"http://localhost:8000"}/api/v1/network${path}`;
