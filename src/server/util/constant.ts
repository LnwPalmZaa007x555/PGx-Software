const PK_FIELD_BY_TABLE: Record<string, string> = {
  CYP2C9:  "CYP2C9_Id",
  CYP2C19: "CYP2C19_Id",
  CYP2D6:  "CYP2D6_Id",
  CYP3A5:  "CYP3A5_Id",
  VKORC1:  "VKORC1_Id",
  TPMT:    "TPMT_Id",
  HLA_B:   "HLA_B_Id",
};
export { PK_FIELD_BY_TABLE };

// คืนค่าวันเวลาปัจจุบันในรูปแบบ ISO string ของโซนเวลา Bangkok
export function nowBangkokISO(): string {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000; // +7 ชั่วโมง
  const bangkok = new Date(now.getTime() + offset);

  // แปลงเป็นสตริง ISO แล้วแทน Z ด้วย +07:00
  return bangkok.toISOString().replace("Z", "+07:00");
}

// แปลง timestamptz (UTC) ที่อ่านมาจาก DB ให้เป็นสตริงเวลาไทยอ่านง่าย
export function toBangkokString(d: string | Date): string {
  return new Date(d).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
}
