import { useState } from "react";
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
  XCircle, Users, Filter, Eye, Calendar, Tag, User
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

// Simulated document content for preview
const MOCK_CONTENT: Record<string, string[]> = {
  "report": [
    "WEEKLY PROGRESS REPORT",
    "",
    "This document contains the intern's weekly progress summary, including tasks completed, challenges encountered, and goals for the coming week.",
    "",
    "TASKS COMPLETED THIS WEEK:",
    "• Completed initial system research and documentation",
    "• Attended team standup meetings daily",
    "• Submitted daily scrum reports on time",
    "• Reviewed company onboarding materials",
    "",
    "CHALLENGES:",
    "• Getting familiar with the codebase took longer than expected",
    "• Had questions about certain API endpoints (now resolved with supervisor)",
    "",
    "GOALS FOR NEXT WEEK:",
    "• Begin implementation of assigned feature",
    "• Complete at least 2 tasks from the task board",
    "• Submit all daily scrums before 10 AM",
    "",
    "Submitted by: Intern",
    "Reviewed by: Supervisor (pending)",
  ],
  "contract": [
    "MEMORANDUM OF AGREEMENT (MOA)",
    "OJT / Internship Agreement",
    "",
    "This Memorandum of Agreement is entered into by and between:",
    "",
    "THE COMPANY — hereinafter referred to as the 'Host Training Establishment' (HTE)",
    "AND",
    "THE INTERN — hereinafter referred to as the 'Student Trainee'",
    "",
    "TERMS AND CONDITIONS:",
    "1. The student trainee shall render a total of 486 hours of On-the-Job Training.",
    "2. The HTE agrees to provide appropriate workplace training and mentoring.",
    "3. The student trainee shall adhere to the company's policies and code of conduct.",
    "4. Evaluations will be conducted at midterm and at the end of the training period.",
    "5. The HTE shall issue a certificate of completion upon satisfactory performance.",
    "",
    "DURATION: January 2026 – April 2026",
    "",
    "This agreement is signed and acknowledged by all parties.",
  ],
  "other": [
    "ENDORSEMENT LETTER",
    "From: University / School",
    "",
    "To Whom It May Concern,",
    "",
    "This is to certify and endorse the bearer of this letter as a bona fide student of our institution, currently enrolled in the Bachelor of Science program.",
    "",
    "The student is required to complete their On-the-Job Training (OJT) as part of their academic curriculum. We request your good office to accept this student as a trainee in your esteemed organization.",
    "",
    "The school assures that the student has been duly oriented on the proper conduct, ethics, and expectations during the training period.",
    "",
    "For further inquiries, please contact the OJT Coordinator.",
    "",
    "Respectfully,",
    "The OJT Coordinator",
    "College of Information Technology",
  ],
};

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
  doc: Document;
  uploaderName: string;
  isManager: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  approving?: boolean;
  rejecting?: boolean;
  onClose: () => void;
}) {
  const lines = MOCK_CONTENT[doc.type] ?? MOCK_CONTENT["other"];

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
      </div>

      {/* Document content preview */}
      <div className="flex-1 overflow-y-auto bg-muted/20 rounded-xl border border-border/50 p-6 font-mono text-sm leading-7 min-h-64">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-inner p-6 min-h-full">
          {lines.map((line, i) => (
            <p key={i} className={`${line === "" ? "h-4" : ""} ${line === line.toUpperCase() && line.trim().length > 3 ? "font-bold text-foreground" : "text-foreground/80"}`}>
              {line || "\u00A0"}
            </p>
          ))}
          <div className="mt-8 pt-4 border-t border-border/50 text-xs text-muted-foreground italic">
            Note: This is a simulated document preview. In a production environment, the actual file would be displayed here.
          </div>
        </div>
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

// ─── STUDENT ──────────────────────────────────────────────────────────────────
function StudentDocuments() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: allDocs = [] } = useDocuments(activeSpaceId);
const createDoc = useCreateDocument();

  const docs = allDocs.filter(d => d.uploaderId === user?.id);

  const [isOpen, setIsOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("report");

  const handleUpload = async () => {
    if (!name || !activeSpaceId) return;
    await createDoc.mutateAsync({ spaceId: activeSpaceId, uploaderId: user!.id, name, type });
    setIsOpen(false);
    setName("");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">My Documents</h1>
          <p className="text-muted-foreground">Submit and track your internship files</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5" data-testid="button-upload-document">
              <Upload className="w-4 h-4 mr-2" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Document Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Weekly Report – Week 2" data-testid="input-document-name" /></div>
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
                <Label>File (simulated)</Label>
                <Input type="file" className="cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              </div>
              <Button onClick={handleUpload} disabled={createDoc.isPending || !activeSpaceId} className="mt-2" data-testid="button-submit-document">
                {createDoc.isPending ? "Uploading..." : "Upload Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!activeSpaceId ? (
        <div className="flex flex-col items-center justify-center h-52 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center">
          <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Select a space to view your documents</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-xl">
          <FileArchive className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {docs.map(doc => (
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
                  <Eye className="w-3.5 h-3.5" /> Click to view
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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

  const pendingCount = docs.filter(d => d.status === "submitted").length;
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
            {isSupervisor ? "Review and approve intern submissions" : "Monitor intern document submissions"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isSupervisor && (
            <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 text-sm">
              Monitor only — approval is for supervisors
            </Badge>
          )}
          {pendingCount > 0 && isSupervisor && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-sm">
              <Clock className="w-3.5 h-3.5 mr-1.5" />{pendingCount} document{pendingCount > 1 ? "s" : ""} pending review
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filterStudent} onValueChange={setFilterStudent}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {students.map(m => <SelectItem key={m.userId} value={String(m.userId)}>{m.user?.name}</SelectItem>)}
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
          {filtered.map(doc => (
            <Card
              key={doc.id}
              className="border-border/50 shadow-sm hover:shadow-md cursor-pointer transition-all group"
              onClick={() => setPreviewDoc(doc)}
              data-testid={`card-document-${doc.id}`}
            >
              <CardContent className="p-5 flex items-center gap-4 flex-wrap">
                <div className="w-12 h-12 bg-muted/50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">{getDocIcon(doc.type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{doc.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => openUserProfile(members.find(m => m.userId === doc.uploaderId)?.user || { id: doc.uploaderId, name: getName(doc.uploaderId) })}>
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
                  <div className="flex items-center gap-1.5 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Eye className="w-3.5 h-3.5" /> View & Review
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview modal */}
      <Dialog open={!!previewDoc} onOpenChange={open => !open && setPreviewDoc(null)}>
        {previewDoc && (
          <DocumentPreviewModal
            doc={previewDoc}
            uploaderName={getName(previewDoc.uploaderId)}
            isManager={isSupervisor}
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
  const isManager = user?.role === "supervisor" || user?.role === "school";
  return isManager ? <ManagerDocuments /> : <StudentDocuments />;
}
