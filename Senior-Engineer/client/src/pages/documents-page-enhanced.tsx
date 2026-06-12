import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useMarkNotificationsRead } from "@/hooks/use-notifications";
import { useSpaceSettings } from "@/hooks/use-space-settings";
import { useDocuments, useCreateDocument, useApproveDocument, useRejectDocument, useSpaceMembers } from "@/hooks/use-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Upload, CheckCircle2, XCircle, Clock, AlertCircle,
  Plus, Eye, Target, FolderOpen, Filter, Download, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UserCardWithPicture } from "@/components/user-card-with-picture";

async function downloadDocument(doc: any, toast: ReturnType<typeof useToast>["toast"]) {
  try {
    const res = await fetch(`/api/documents/${doc.id}/file`, { credentials: "include" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "File not available" }));
      toast({ title: "Download failed", description: err.message ?? "The file could not be downloaded.", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") ?? "";
    const match = cd.match(/filename[^;=\n]*=["']?([^"';\n]+)/i);
    const filename = match ? decodeURIComponent(match[1]) : doc.originalFileName ?? doc.name;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  } catch {
    toast({ title: "Download failed", description: "An unexpected error occurred.", variant: "destructive" });
  }
}

function getStatusIcon(status: string) {
  if (status === "approved") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "rejected") return <XCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-amber-500" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
    rejected: "bg-red-500/10 text-red-700 border-red-500/20",
    submitted: "bg-amber-500/10 text-amber-700 border-amber-400/30",
  };
  return (
    <Badge className={map[status] ?? "bg-muted text-muted-foreground"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// ─── UPLOAD DIALOG ────────────────────────────────────────────────────────────
function UploadDialog({
  open, onClose, spaceId, requiredDocs, documentDeadlines, preselectedType,
}: {
  open: boolean; onClose: () => void; spaceId: number | null;
  requiredDocs: string[]; documentDeadlines?: string[]; preselectedType?: string;
}) {
  const { toast } = useToast();
  const createDocument = useCreateDocument(spaceId);
  const [docType, setDocType] = useState(preselectedType ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const handleUpload = async () => {
    if (!file || !docType) {
      toast({ title: "Missing Information", description: "Please select a document type and upload a file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Please upload files smaller than 5MB.", variant: "destructive" });
      return;
    }
    try {
      await createDocument.mutateAsync({
        spaceId,
        name: file.name,
        type: "requirement",
        documentType: docType,
        file,
      });

      toast({ title: "Document Uploaded", description: "Your document has been submitted for review." });
      onClose();
      setDocType(""); setFile(null); setNotes("");
    } catch {
      toast({ title: "Upload Failed", description: "Failed to upload document. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger>
              <SelectContent>
                {requiredDocs.map((d, i) => (
                  <SelectItem key={i} value={d}>{d}{documentDeadlines?.[i] ? ` (Due: ${documentDeadlines[i]})` : ""}</SelectItem>
                ))}
                <SelectItem value="project">Project Submission</SelectItem>
                <SelectItem value="task">Task Report</SelectItem>
                <SelectItem value="other">Other Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File <span className="text-muted-foreground text-xs">(max 5 MB)</span></Label>
            <Input type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, TXT, JPG, PNG</p>
          </div>
          <div className="space-y-2">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea placeholder="Add any notes about this document..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="resize-none" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleUpload} disabled={createDocument.isPending} className="flex-1">
              {createDocument.isPending ? "Uploading..." : "Upload"}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── STUDENT VIEW ─────────────────────────────────────────────────────────────
function StudentDocuments() {
  const { user } = useAuth();
  const { activeSpace, activeSpaceId } = useSpace();
  const { settings } = useSpaceSettings(activeSpaceId);
  const markRead = useMarkNotificationsRead('documents');
  useEffect(() => { markRead(); }, [markRead]);
  const { data: documents = [] } = useDocuments(activeSpaceId);
  const { toast } = useToast();

  const requiredDocs: string[] = settings?.requiredDocuments ?? [];
  const documentDeadlines: string[] = settings?.documentDeadlines ?? [];

  const myDocs = documents.filter(d => d.uploaderId === user?.id);
  const completedRequired = myDocs.filter(d => requiredDocs.includes(d.documentType) && d.status === "approved").length;
  const completionPct = requiredDocs.length > 0 ? Math.round((completedRequired / requiredDocs.length) * 100) : 0;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [preselectedType, setPreselectedType] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  const openUpload = (type = "") => { setPreselectedType(type); setUploadOpen(true); };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Documents</h1>
            <p className="text-muted-foreground">Manage required documents for <span className="font-medium text-foreground">{activeSpace?.name}</span></p>
          </div>
        </div>
        <Button onClick={() => openUpload()} className="gap-2 shadow-sm hover:-translate-y-0.5 transition-all" data-testid="button-upload-document">
          <Plus className="w-4 h-4" /> Upload Document
        </Button>
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view documents</p>
        </div>
      ) : (
        <>
          {/* Progress */}
          {requiredDocs.length > 0 && (
            <Card className="mb-6 border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">Required Documents Progress</span>
                  </div>
                  <span className="text-2xl font-display font-black text-primary">{completionPct}%</span>
                </div>
                <Progress value={completionPct} className="h-2 mb-1" />
                <p className="text-xs text-muted-foreground">{completedRequired} of {requiredDocs.length} required documents approved</p>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Required checklist */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Required Documents Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px] pr-2">
                  {requiredDocs.length === 0 ? (
                    <div className="text-center py-10">
                      <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No required documents set yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {requiredDocs.map((docType, i) => {
                        const myDoc = myDocs.find(d => d.documentType === docType);
                        const done = myDoc?.status === "approved";
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-muted/20 transition-colors" data-testid={`row-required-doc-${i}`}>
                            <div className="shrink-0">
                              {done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : myDoc ? <Clock className="w-5 h-5 text-amber-500" /> : <div className="w-5 h-5 border-2 border-border rounded" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{docType}</p>
                              {documentDeadlines[i] && <p className="text-xs text-muted-foreground">Due: {documentDeadlines[i]}</p>}
                              {myDoc && (
                                <div className="flex items-center gap-2 mt-1">
                                  <StatusBadge status={myDoc.status} />
                                  <span className="text-xs text-muted-foreground">{format(new Date(myDoc.uploadDate), "MMM d, yyyy")}</span>
                                </div>
                              )}
                            </div>
                            {!done && !myDoc && (
                              <Button size="sm" onClick={() => openUpload(docType)} className="shrink-0">Upload</Button>
                            )}
                            {myDoc && (
                              <Button size="sm" variant="outline" onClick={() => setSelectedDoc(myDoc)} className="shrink-0">
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* All my documents */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="w-5 h-5 text-primary" /> My Submissions ({myDocs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[360px] pr-2">
                  {myDocs.length === 0 ? (
                    <div className="text-center py-10">
                      <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
                      <Button variant="outline" size="sm" onClick={() => openUpload()} className="mt-4 gap-2">
                        <Plus className="w-4 h-4" /> Upload First Document
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myDocs.sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)).map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-muted/20 transition-colors" data-testid={`row-doc-${doc.id}`}>
                          <div className="shrink-0">{getStatusIcon(doc.status)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.documentType}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge status={doc.status} />
                              <span className="text-xs text-muted-foreground">{format(new Date(doc.uploadDate), "MMM d, yyyy")}</span>
                              {doc.fileSize && <span className="text-xs text-muted-foreground">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                            </div>
                            {(doc as any).rejectionReason && (
                              <p className="text-xs text-red-600 mt-1">Reason: {(doc as any).rejectionReason}</p>
                            )}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setSelectedDoc(doc)} className="shrink-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)}
        spaceId={activeSpaceId} requiredDocs={requiredDocs} documentDeadlines={documentDeadlines}
        preselectedType={preselectedType} />

      {/* Document detail dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => { setSelectedDoc(null); setDownloading(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Document Details</DialogTitle></DialogHeader>
          {selectedDoc && (
            <div className="space-y-3 py-2">
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">File Name</Label><p className="font-medium mt-1">{selectedDoc.originalFileName ?? selectedDoc.name}</p></div>
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Document Type</Label><p className="font-medium mt-1">{selectedDoc.documentType}</p></div>
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label><div className="mt-1"><StatusBadge status={selectedDoc.status} /></div></div>
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Uploaded</Label><p className="font-medium mt-1">{selectedDoc.uploadDate ? format(new Date(selectedDoc.uploadDate), "MMMM d, yyyy") : "—"}</p></div>
              {selectedDoc.fileSize && <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">File Size</Label><p className="font-medium mt-1">{(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB</p></div>}
              {selectedDoc.rejectionReason && <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Rejection Reason</Label><p className="font-medium text-red-600 mt-1">{selectedDoc.rejectionReason}</p></div>}
              {selectedDoc.approvedDate && <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Reviewed On</Label><p className="font-medium mt-1">{format(new Date(selectedDoc.approvedDate), "MMMM d, yyyy")}</p></div>}
              <div className="pt-1">
                {selectedDoc.filePath ? (
                  <Button
                    disabled={downloading}
                    onClick={async () => { setDownloading(true); await downloadDocument(selectedDoc, toast); setDownloading(false); }}
                    className="gap-2 w-full"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloading ? "Downloading..." : "Download File"}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No file attached to this document.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── MANAGER VIEW ─────────────────────────────────────────────────────────────
function ManagerDocuments() {
  const { user } = useAuth();
  const { activeSpace, activeSpaceId } = useSpace();
  const markRead = useMarkNotificationsRead('documents');
  useEffect(() => { markRead(); }, [markRead]);
  const { settings } = useSpaceSettings(activeSpaceId);
  const { data: documents = [] } = useDocuments(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const approveDoc = useApproveDocument(activeSpaceId);
  const rejectDoc = useRejectDocument(activeSpaceId);
  const { toast } = useToast();

  const isSupervisor = user?.role === "supervisor";
  const students = members.filter(m => m.user?.role === "student");
  const requiredDocs: string[] = settings?.requiredDocuments ?? [];

  const [filterStudent, setFilterStudent] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  const getName = (uid: number) => members.find(m => m.userId === uid)?.user?.name ?? `User #${uid}`;

  const filtered = (filterStudent === "all" ? documents : documents.filter(d => d.uploaderId === Number(filterStudent)))
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));

  const pendingCount = documents.filter(d => d.status === "submitted").length;

  const handleApprove = async (id: number) => {
    await approveDoc.mutateAsync(id);
    toast({ title: "Document Approved", description: "The document has been approved." });
  };

  const handleReject = async (id: number) => {
    await rejectDoc.mutateAsync(id);
    toast({ title: "Document Rejected", description: "The document has been rejected." });
    setRejectDialogOpen(false);
    setRejectDocId(null);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Documents</h1>
            <p className="text-muted-foreground">
              {isSupervisor ? "Review and approve intern document submissions" : "Monitor intern document submissions"}
            </p>
          </div>
        </div>
        {pendingCount > 0 && isSupervisor && (
          <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5">
            <Clock className="w-3.5 h-3.5 mr-1.5" />{pendingCount} awaiting review
          </Badge>
        )}
      </div>

      {/* Per-student progress */}
      {filterStudent === "all" && students.length > 0 && requiredDocs.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {students.map(m => {
            const sDocs = documents.filter(d => d.uploaderId === m.userId);
            const approved = sDocs.filter(d => requiredDocs.includes(d.documentType) && d.status === "approved").length;
            const pct = Math.round((approved / requiredDocs.length) * 100);
            return (
              <Card key={m.userId} className="border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <UserCardWithPicture user={m.user!} size="sm" />
                    <span className="text-sm font-bold">{approved}/{requiredDocs.length} docs</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">{pct}% required docs approved</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {filterStudent !== "all" && (
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> document{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view documents</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-border/50">
          <Upload className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No documents found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(doc => (
            <Card key={doc.id} className={`border-border/50 shadow-sm transition-all ${doc.status === "submitted" && isSupervisor ? "border-l-4 border-l-amber-400" : ""}`} data-testid={`row-doc-${doc.id}`}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <div className="shrink-0">{getStatusIcon(doc.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <UserCardWithPicture user={members.find(m => m.userId === doc.uploaderId)?.user ?? { id: doc.uploaderId, name: getName(doc.uploaderId) } as any} size="sm" />
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium text-sm truncate max-w-[200px]">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-xs">{doc.documentType}</Badge>
                    <StatusBadge status={doc.status} />
                    <span className="text-xs text-muted-foreground">{format(new Date(doc.uploadDate), "MMM d, yyyy")}</span>
                    {doc.fileSize && <span className="text-xs text-muted-foreground">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>}
                  </div>
                  {(doc as any).rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {(doc as any).rejectionReason}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setSelectedDoc(doc)} title="View details">
                    <Eye className="w-4 h-4" />
                  </Button>
                  {doc.status === "submitted" && isSupervisor && (
                    <>
                      <Button
                        size="sm" variant="outline"
                        className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleApprove(doc.id)}
                        disabled={approveDoc.isPending}
                        data-testid={`button-approve-doc-${doc.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => { setRejectDocId(doc.id); setRejectDialogOpen(true); }}
                        disabled={rejectDoc.isPending}
                        data-testid={`button-reject-doc-${doc.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reject confirmation dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Document</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Are you sure you want to reject this document? The student will be notified and can re-upload.</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => rejectDocId && handleReject(rejectDocId)}
              disabled={rejectDoc.isPending}
              className="flex-1"
            >
              {rejectDoc.isPending ? "Rejecting..." : "Yes, Reject"}
            </Button>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="flex-1">Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document detail dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => { setSelectedDoc(null); setDownloading(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Document Details</DialogTitle></DialogHeader>
          {selectedDoc && (
            <div className="space-y-3 py-2">
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Submitted By</Label><p className="font-medium mt-1">{getName(selectedDoc.uploaderId)}</p></div>
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">File Name</Label><p className="font-medium mt-1">{selectedDoc.originalFileName ?? selectedDoc.name}</p></div>
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Document Type</Label><p className="font-medium mt-1">{selectedDoc.documentType}</p></div>
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label><div className="mt-1"><StatusBadge status={selectedDoc.status} /></div></div>
              <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Uploaded</Label><p className="font-medium mt-1">{selectedDoc.uploadDate ? format(new Date(selectedDoc.uploadDate), "MMMM d, yyyy") : "—"}</p></div>
              {selectedDoc.fileSize && <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">File Size</Label><p className="font-medium mt-1">{(selectedDoc.fileSize / 1024 / 1024).toFixed(2)} MB</p></div>}
              {selectedDoc.rejectionReason && <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Rejection Reason</Label><p className="font-medium text-red-600 mt-1">{selectedDoc.rejectionReason}</p></div>}
              {selectedDoc.approvedDate && <div><Label className="text-xs text-muted-foreground uppercase tracking-wider">Reviewed On</Label><p className="font-medium mt-1">{format(new Date(selectedDoc.approvedDate), "MMMM d, yyyy")}</p></div>}
              <div className="pt-1">
                {selectedDoc.filePath ? (
                  <Button
                    disabled={downloading}
                    onClick={async () => { setDownloading(true); await downloadDocument(selectedDoc, toast); setDownloading(false); }}
                    className="gap-2 w-full"
                  >
                    {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloading ? "Downloading..." : "Download File"}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No file attached to this document.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────
export default function DocumentsPageEnhanced() {
  const { user } = useAuth();
  const isManager = user?.role === "supervisor" || user?.role === "school";
  return isManager ? <ManagerDocuments /> : <StudentDocuments />;
}
