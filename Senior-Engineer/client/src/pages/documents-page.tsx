import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useDocuments, useCreateDocument, useApproveDocument, useRejectDocument, useSpaceMembers } from "@/hooks/use-features";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Document } from "@shared/schema";
import {
  FileText, Upload, FileSignature, FileArchive, FolderOpen, CheckCircle, Clock,
  XCircle, Filter, Eye, Calendar, Tag, User, Download, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { useUserProfileModal } from "@/hooks/use-user-profile-modal";

const getDocIcon = (t: string, size = "w-7 h-7") => {
  switch (t) {
    case "report": return <FileText className={`${size} text-blue-500`} />;
    case "contract": return <FileSignature className={`${size} text-emerald-500`} />;
    default: return <FileArchive className={`${size} text-slate-500`} />;
  }
};

const statusBadge = (status: string) => {
  if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
  return <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]"><Clock className="w-3 h-3 mr-1" />Pending Review</Badge>;
};

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentPreviewModal({
  doc,
  uploaderName,
  isManager,
  onApprove,
  onReject,
  approving,
  rejecting,
  onClose,
}: {
  doc: Document & { originalFileName?: string | null };
  uploaderName: string;
  isManager: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  approving?: boolean;
  rejecting?: boolean;
  onClose: () => void;
}) {
  const hasFile = !!(doc as any).filePath;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = `/api/documents/${doc.id}/file`;
    a.download = (doc as any).originalFileName ?? doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          {getDocIcon(doc.type, "w-5 h-5")}
          <span className="truncate">{doc.name}</span>
        </DialogTitle>
      </DialogHeader>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm py-2 border-y border-border/50">
        <div className="flex items-center gap-1.5 text-muted-foreground"><User className="w-3.5 h-3.5" /><span>Submitted by <span className="font-semibold text-foreground">{uploaderName}</span></span></div>
        <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /><span>{format(new Date(doc.uploadDate + "T00:00:00"), "MMMM d, yyyy")}</span></div>
        <div className="flex items-center gap-1.5 text-muted-foreground"><Tag className="w-3.5 h-3.5" /><span className="capitalize">{doc.type}</span></div>
        <div>{statusBadge(doc.status)}</div>
        {(doc as any).fileSize && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileArchive className="w-3.5 h-3.5" />
            <span>{formatBytes((doc as any).fileSize)}</span>
          </div>
        )}
      </div>

      {/* File info / download */}
      <div className="flex-1 overflow-y-auto">
        {hasFile ? (
          <div className="flex flex-col items-center justify-center gap-5 py-10 bg-muted/20 rounded-xl border border-border/50 min-h-48">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              {getDocIcon(doc.type, "w-8 h-8")}
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">
                {(doc as any).originalFileName ?? doc.name}
              </p>
              {(doc as any).fileSize && (
                <p className="text-sm text-muted-foreground mt-0.5">{formatBytes((doc as any).fileSize)}</p>
              )}
            </div>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Download File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 bg-muted/20 rounded-xl border border-border/50 min-h-48 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium text-muted-foreground">No file attached</p>
              <p className="text-sm text-muted-foreground/70 mt-1">This document was submitted without a file attachment.</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions for manager */}
      {isManager && doc.status === "submitted" && (
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onReject} disabled={rejecting} className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30" data-testid={`button-reject-doc-${doc.id}`}>
            <XCircle className="w-4 h-4 mr-2" /> {rejecting ? "Rejecting..." : "Reject Document"}
          </Button>
          <Button onClick={onApprove} disabled={approving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" data-testid={`button-approve-doc-${doc.id}`}>
            <CheckCircle className="w-4 h-4 mr-2" /> {approving ? "Approving..." : "Approve Document"}
          </Button>
        </div>
      )}
      {isManager && doc.status !== "submitted" && (
        <div className="text-center text-sm text-muted-foreground py-1">
          This document has already been <span className="font-semibold capitalize">{doc.status}</span>.
        </div>
      )}
    </DialogContent>
  );
}

// ─── UPLOAD DIALOG ──────────────────────────────────────────────────────────
function UploadDocumentDialog({
  spaceId,
  userId,
  isSupervisor = false,
}: {
  spaceId: number;
  userId: number;
  isSupervisor?: boolean;
}) {
  const createDoc = useCreateDocument();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("report");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    setError("");
    if (!name.trim()) { setError("Please enter a document name."); return; }
    if (!file) { setError("Please select a file to upload."); return; }
    try {
      await createDoc.mutateAsync({ spaceId, uploaderId: userId, name: name.trim(), type, file });
      setIsOpen(false);
      setName("");
      setType("report");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setError(e.message ?? "Upload failed. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setError(""); setFile(null); setName(""); } }}>
      <DialogTrigger asChild>
        <Button className="shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5" data-testid="button-upload-document">
          <Upload className="w-4 h-4 mr-2" />
          {isSupervisor ? "Share Document" : "Upload Document"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSupervisor ? "Share Document with Students" : "Upload Document"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Document Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={isSupervisor ? "e.g., Training Certificate – June 2026" : "e.g., Weekly Report – Week 2"}
              data-testid="input-document-name"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger data-testid="select-document-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="report">Progress Report</SelectItem>
                <SelectItem value="contract">Contract / MOA</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File <span className="text-red-500">*</span></Label>
            <Input
              ref={fileRef}
              type="file"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            {file && (
              <p className="text-xs text-muted-foreground">{file.name} · {formatBytes(file.size)}</p>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </p>
          )}
          <Button onClick={handleUpload} disabled={createDoc.isPending} className="mt-2" data-testid="button-submit-document">
            {createDoc.isPending ? "Uploading..." : isSupervisor ? "Share Document" : "Upload Document"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── STUDENT ──────────────────────────────────────────────────────────────────
function StudentDocuments() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: allDocs = [] } = useDocuments(activeSpaceId);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const myDocs = allDocs.filter(d => d.uploaderId === user?.id);
  const sharedDocs = allDocs.filter(d => d.uploaderId !== user?.id);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">My Documents</h1>
          <p className="text-muted-foreground">Submit and track your internship files</p>
        </div>
        {activeSpaceId && (
          <UploadDocumentDialog spaceId={activeSpaceId} userId={user!.id} />
        )}
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view your documents</p>
        </div>
      ) : (
        <>
          {/* Shared by supervisors */}
          {sharedDocs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Shared with You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sharedDocs.map(doc => (
                  <Card
                    key={doc.id}
                    className="hover:shadow-md border-border/50 shadow-sm cursor-pointer group transition-all hover:-translate-y-0.5 border-primary/20 bg-primary/5"
                    onClick={() => setPreviewDoc(doc)}
                    data-testid={`card-document-${doc.id}`}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{getDocIcon(doc.type)}</div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{doc.name}</h3>
                      <div className="flex items-center justify-between w-full text-xs px-3 py-2 bg-muted/40 rounded-lg border border-border/50 mb-3">
                        <span className="text-muted-foreground">{format(new Date(doc.uploadDate + "T00:00:00"), "MMM d, yyyy")}</span>
                        {statusBadge(doc.status)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="w-3.5 h-3.5" /> Click to download
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* My uploaded documents */}
          <div>
            {sharedDocs.length > 0 && (
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-muted-foreground" />
                My Submissions
              </h2>
            )}
            {myDocs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-xl">
                <FileArchive className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No documents uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myDocs.map(doc => (
                  <Card
                    key={doc.id}
                    className="hover:shadow-md border-border/50 shadow-sm cursor-pointer group transition-all hover:-translate-y-0.5"
                    onClick={() => setPreviewDoc(doc)}
                    data-testid={`card-document-${doc.id}`}
                  >
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{getDocIcon(doc.type)}</div>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">{doc.name}</h3>
                      <div className="flex items-center justify-between w-full text-xs px-3 py-2 bg-muted/40 rounded-lg border border-border/50 mb-3">
                        <span className="text-muted-foreground">{format(new Date(doc.uploadDate + "T00:00:00"), "MMM d, yyyy")}</span>
                        {statusBadge(doc.status)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {(doc as any).filePath ? <><Download className="w-3.5 h-3.5" /> Click to download</> : <><Eye className="w-3.5 h-3.5" /> Click to view</>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Preview modal */}
      <Dialog open={!!previewDoc} onOpenChange={open => !open && setPreviewDoc(null)}>
        {previewDoc && (
          <DocumentPreviewModal
            doc={previewDoc}
            uploaderName="You"
            isManager={false}
            onClose={() => setPreviewDoc(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

// ─── MANAGER ──────────────────────────────────────────────────────────────────
function ManagerDocuments() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: docs = [] } = useDocuments(activeSpaceId);
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const { openUserProfile } = useUserProfileModal();
  const approveDoc = useApproveDocument(activeSpaceId);
  const rejectDoc = useRejectDocument(activeSpaceId);
  const isSupervisor = user?.role === "supervisor" || user?.role === "school";

  const [filterStudent, setFilterStudent] = useState("all");
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  const students = members.filter(m => m.user?.role === "student");
  const getName = (uploaderId: number) => members.find(m => m.userId === uploaderId)?.user?.name ?? `User #${uploaderId}`;
  const getInitial = (uploaderId: number) => (members.find(m => m.userId === uploaderId)?.user?.name ?? "?").charAt(0).toUpperCase();

  const pendingCount = docs.filter(d => d.status === "submitted" && d.uploaderId !== user?.id).length;
  const filtered = filterStudent === "all" ? docs : docs.filter(d => d.uploaderId === Number(filterStudent));

  const handleApprove = async (docId: number) => {
    await approveDoc.mutateAsync(docId);
    setPreviewDoc(prev => prev ? { ...prev, status: "approved" } : null);
  };
  const handleReject = async (docId: number) => {
    await rejectDoc.mutateAsync(docId);
    setPreviewDoc(prev => prev ? { ...prev, status: "rejected" } : null);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Documents</h1>
          <p className="text-muted-foreground">
            {isSupervisor ? "Review intern submissions and share documents" : "Monitor intern document submissions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeSpaceId && (
            <UploadDocumentDialog spaceId={activeSpaceId} userId={user!.id} isSupervisor />
          )}
          {!isSupervisor && (
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-sm">
              Monitor only — approval is for supervisors
            </Badge>
          )}
          {pendingCount > 0 && isSupervisor && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-sm">
              <Clock className="w-3.5 h-3.5 mr-1.5" />{pendingCount} pending review
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {members.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view documents</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-xl">
          <FileArchive className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No documents found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(doc => {
            const isMyUpload = doc.uploaderId === user?.id;
            return (
              <Card
                key={doc.id}
                className={`border-border/50 shadow-sm hover:shadow-md cursor-pointer transition-all group ${isMyUpload ? "border-primary/20 bg-primary/5" : ""}`}
                onClick={() => setPreviewDoc(doc)}
                data-testid={`card-document-${doc.id}`}
              >
                <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                  <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">{getDocIcon(doc.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{doc.name}</h3>
                      {isMyUpload && <Badge variant="outline" className="text-xs text-primary border-primary/30 shrink-0">Shared by you</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="cursor-pointer hover:scale-105 transition-transform" onClick={e => { e.stopPropagation(); openUserProfile(members.find(m => m.userId === doc.uploaderId)?.user || { id: doc.uploaderId, name: getName(doc.uploaderId) }); }}>
                        <Avatar className="w-5 h-5">
                          {members.find(m => m.userId === doc.uploaderId)?.user?.profilePicture ? (
                            <AvatarImage src={members.find(m => m.userId === doc.uploaderId)?.user?.profilePicture || ""} alt={getName(doc.uploaderId)} />
                          ) : null}
                          <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white text-[10px]">
                            {getInitial(doc.uploaderId)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-xs text-muted-foreground">{getName(doc.uploaderId)} · {format(new Date(doc.uploadDate + "T00:00:00"), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(doc.status)}
                    {(doc as any).filePath && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <Download className="w-3 h-3" /> File
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Eye className="w-3.5 h-3.5" /> View
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      <Dialog open={!!previewDoc} onOpenChange={open => !open && setPreviewDoc(null)}>
        {previewDoc && (
          <DocumentPreviewModal
            doc={previewDoc}
            uploaderName={getName(previewDoc.uploaderId)}
            isManager={isSupervisor && previewDoc.uploaderId !== user?.id}
            onApprove={() => handleApprove(previewDoc.id)}
            onReject={() => handleReject(previewDoc.id)}
            approving={approveDoc.isPending}
            rejecting={rejectDoc.isPending}
            onClose={() => setPreviewDoc(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const isManager = user?.role === "supervisor" || user?.role === "school" || user?.role === "admin";
  return isManager ? <ManagerDocuments /> : <StudentDocuments />;
}
