import apiClient from "./apiClient";
import { meRequest } from "./auth";

export type GeneKey =
  | "CYP2C19"
  | "CYP2C9"
  | "CYP2D6"
  | "CYP3A5"
  | "VKORC1"
  | "TPMT"
  | "HLA-B*15:02";

type GeneRow = { gene_id: number; gene_name: string };

let geneIdCache: Record<string, number> | null = null;
let geneNameByIdCache: Record<number, string> | null = null;

async function ensureGeneIdMap(): Promise<Record<string, number>> {
  if (geneIdCache) return geneIdCache;
  const { data } = await apiClient.get<GeneRow[]>("/gene");
  geneIdCache = {};
  for (const g of data) {
    // Normalize keys to match our GeneKey set where possible
    // DB uses HLA_B but UI uses HLA-B*15:02 as a panel; map both
    geneIdCache[g.gene_name] = g.gene_id;
    if (g.gene_name === "HLA_B") geneIdCache["HLA-B*15:02"] = g.gene_id;
  }
  return geneIdCache;
}

export async function fetchGeneNameByIdMap(): Promise<Record<number, string>> {
  if (geneNameByIdCache) return geneNameByIdCache;
  const { data } = await apiClient.get<GeneRow[]>("/gene");
  const map: Record<number, string> = {};
  for (const g of data) {
    map[g.gene_id] = g.gene_name === "HLA_B" ? "HLA-B*15:02" : g.gene_name;
  }
  geneNameByIdCache = map;
  return map;
}

function uiKeyToRoute(geneKey: GeneKey): string {
  switch (geneKey) {
    case "CYP2C19": return "/cyp2c19";
    case "CYP2C9": return "/cyp2c9";
    case "CYP2D6": return "/cyp2d6";
    case "CYP3A5": return "/cyp3a5";
    case "VKORC1": return "/vkorc1";
    case "TPMT": return "/tpmt";
    case "HLA-B*15:02": return "/hlab";
    default: return "";
  }
}

// Map UI marker names to backend column names used in saveToResult controllers
function mapMarkersToBackend(geneKey: GeneKey, values: Record<string, string>): Record<string, string> {
  switch (geneKey) {
    case "CYP2C19":
      return {
        CYPx2_681G: values["CYP2C19*2 (681G>A)"] || "",
        CYPx3_636G: values["CYP2C19*3 (636G>A)"] || "",
        CYPx17_806C: values["CYP2C19*17 (-806C>T)"] || "",
      };
    case "CYP2C9":
      return {
        CYP2C9x2_430C: values["CYP2C9*2 (430C>T)"] || "",
        CYP2C9x3_1075A: values["CYP2C9*3 (1075A>C)"] || "",
      };
    case "CYP2D6":
      return {
        CYP2D6x4_1847G: values["CYP2D6*4 (1847G>A)"] || "",
        CYP2D6x10_100C: values["CYP2D6*10 (100C>T)"] || "",
        CYP2D6x41_2989G: values["CYP2D6*41 (2989G>A)"] || "",
        CNV_Intron: values["CNV intron 2"] || "",
        CNV_Exon: values["CNV exon 9"] || "",
      };
    case "CYP3A5":
      return {
        CYP3A5x3_6986A: values["CYP3A5*3 (6986A>G)"] || "",
      };
    case "VKORC1":
      return {
        VKORC1_1173C: values["VKORC1 (1173C>T)"] || "",
        VKORC1_1639G: values["VKORC1 (-1639G>A)"] || "",
      };
    case "TPMT":
      return {
        TPMTx3C_719A: values["TPMT*3C (719A>G)"] || "",
      };
    case "HLA-B*15:02":
      return {
        HLA_Gene: "HLA-B*15:02",
        status: values["HLA-B*15:02 status"] || "",
      };
    default:
      return {};
  }
}

export async function saveGeneResult(
  geneKey: GeneKey,
  patientId: number,
  markerValues: Record<string, string>
) {
  const staff = await meRequest();
  const map = await ensureGeneIdMap();

  // Try both UI key and DB table key
  const geneId = map[geneKey] ?? map[geneKey.replace("-", "_")] ?? map[geneKey.toUpperCase()];
  if (!geneId) {
    throw new Error(`Gene id not found for ${geneKey}. Please ensure the Gene table has this gene.`);
  }

  const route = uiKeyToRoute(geneKey);
  if (!route) throw new Error(`Unsupported gene: ${geneKey}`);

  const payload = {
    Patient_Id: patientId,
    geneid: geneId,
    staff_id: staff.Staff_Id,
    ...mapMarkersToBackend(geneKey, markerValues),
  } as Record<string, any>;

  const { data } = await apiClient.post(`${route}/save`, payload);
  return data;
}
