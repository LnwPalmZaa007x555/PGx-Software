import { Request, Response } from "express";
import { supabase } from "../../supabaseClient";

// GET /api/gene
// Return list of genes and their IDs so the frontend can map names -> ids
export async function listGenes(_req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from("Gene")
      .select("gene_id, gene_name")
      .order("gene_id", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  } catch (e: any) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
