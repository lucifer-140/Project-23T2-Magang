// RPS submission shape returned by GET /api/rps
export type RpsSubmission = {
  id: string;
  matkulName: string;
  matkulCode: string;
  dosenName: string;
  koordinatorName: string | null;
  status: string;
  isKoordinatorApproved: boolean;
  fileName: string | null;
  fileUrl: string | null;
  koordinatorNotes: string | null;
  kaprodiNotes: string | null;
  koordinatorSignedPdfUrl: string | null;
  finalPdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

// Assignment row (dosen × matkul)
export type RpsAssignment = {
  dosenName: string;
  matkulName: string;
  rpsId: string | null;
  defaultStatus: string;
  isKoordinatorApproved?: boolean;
};

// Full response envelope from GET /api/rps (kaprodi & koordinator)
export type RpsApiResponse = {
  submissions: RpsSubmission[];
  assignments: RpsAssignment[];
};

// Dosen-specific row from GET /api/rps (role DOSEN)
export type MatkulRps = {
  matkulId: string;
  matkulCode: string;
  matkulName: string;
  sks: number;
  rpsId: string | null;
  status: string;
  isKoordinatorApproved: boolean;
  fileName: string | null;
  fileUrl: string | null;
  notes: string | null;
  koordinatorNotes: string | null;
  kaprodiNotes: string | null;
  finalPdfUrl: string | null;
  updatedAt: string | null;
};

// GET /api/change-requests
export type ChangeRequest = {
  id: string;
  matkulId: string;
  matkulName: string;
  matkulCode: string;
  currentSks: number;
  proposedName: string | null;
  proposedCode: string | null;
  proposedSks: number | null;
  reason: string | null;
  status: string;
  createdAt: string;
};

// GET /api/logs
export type LogEntry = {
  id: string;
  timestamp: string;
  level: string;
  levelColor: string;
  message: string;
  actor: string;
  action: string;
};
