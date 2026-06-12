import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useMessages, useCreateMessage, useSpaceMembers, useMarkAsRead, useDMConversations } from "@/hooks/use-features";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserSearch } from "@/components/user-search";
import { Send, Hash, FolderOpen, MessageSquare, MessageCircle, MessageSquarePlus, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

type MemberRow = { id: number; userId: number; role: string; user: { id: number; name: string; role: string } };

const PUBLIC_CHANNELS = [
  { id: "general", label: "general", desc: "Team announcements & updates" },
  { id: "chill",   label: "chill",   desc: "Casual conversation" },
];

const dmChannelId = (a: number, b: number) => `dm-${Math.min(a, b)}-${Math.max(a, b)}`;

export default function MessagesPage() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: members = [] } = useSpaceMembers(activeSpaceId);

const [location] = useLocation();
  const urlChannelId = location.split("/").pop()?.replace("?channelId=", "") || "general";
  const [channelId, setChannelId] = useState(urlChannelId);

  const { data: allMessages = [] } = useMessages(activeSpaceId, channelId);
  const { data: dmConversations = [] } = useDMConversations(activeSpaceId);
  const markAsRead = useMarkAsRead(activeSpaceId);
const createMsg = useCreateMessage();

  // Mark as read when switching channels (debounced)
  useEffect(() => {
    if (activeSpaceId && channelId && markAsRead) {
      const timer = setTimeout(() => {
        markAsRead.mutate({ channelId });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [channelId, activeSpaceId, markAsRead]);

  const [content, setContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const [dmOpen, setDmOpen] = useState(false);
  const [dmSearch, setDmSearch] = useState("");

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [allMessages]);

  // Filter messages to only include senders who are in the space
  const memberUserIds = new Set(members.map((m: MemberRow) => m.userId));
  const messages = allMessages.filter(msg => memberUserIds.has(msg.senderId));

  const getSenderName = (msg: any) => {
    if (msg.senderId === user?.id) return "You";
    return msg.sender?.name ?? "Unknown User";
  };
  
  const getInitial = (msg: any) => {
    if (msg.senderId === user?.id) return user?.name?.charAt(0)?.toUpperCase() ?? "?";
    return (msg.sender?.name ?? "User")?.charAt(0)?.toUpperCase() ?? "?";
  };

  const getSenderPicture = (msg: any) => {
    return msg.sender?.profilePicture ?? null;
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return format(date, "EEE HH:mm");
      return format(date, "MMM d, yyyy HH:mm");
    } catch {
      return "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeSpaceId) return;
    const txt = content;
    setContent("");
    try {
      await createMsg.mutateAsync({ spaceId: activeSpaceId, senderId: user!.id, channelId, content: txt });
    } catch { setContent(txt); }
  };

  const openDm = (otherId: number) => {
    if (otherId === user?.id) return;
    const ch = dmChannelId(user!.id, otherId);
    setChannelId(ch);
    setDmOpen(false);
    setDmSearch("");
  };

  const otherMembers = members.filter((m: MemberRow) => m.userId !== user?.id);
  const searchFiltered = dmSearch.trim()
    ? otherMembers.filter((m: MemberRow) => m.user?.name?.toLowerCase().includes(dmSearch.toLowerCase()))
    : otherMembers;

  const getChannelLabel = (ch: string) => {
    if (!ch.startsWith("dm-")) return ch;
    const parts = ch.split("-");
    const otherId = Number(parts[1]) === user?.id ? Number(parts[2]) : Number(parts[1]);
    const partner = dmConversations.find(p => p.id === otherId);
    return partner?.name ?? `Unknown User`;
  };

  // DM thread list - only shows people with actual conversations
  const allDmThreads = Array.from(new Set(
    dmConversations.map(p => p.id)
  ));

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-5 animate-in fade-in duration-500">
      {/* ── Sidebar ── */}
      <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">Channels</h2>
        {PUBLIC_CHANNELS.map(ch => (
          <button
            key={ch.id}
            onClick={() => setChannelId(ch.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${channelId === ch.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            data-testid={`button-channel-${ch.id}`}
          >
            <Hash className="w-4 h-4 shrink-0" />{ch.label}
          </button>
        ))}

        {/* DM Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Direct Messages</h2>
            <button
              onClick={() => setDmOpen(true)}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/10"
              title="New message"
              data-testid="button-new-dm"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {allDmThreads.map(otherId => {
            const ch = dmChannelId(user!.id, otherId);
            const partner = dmConversations.find(p => p.id === otherId);
            return (
              <button
                key={ch}
                onClick={() => setChannelId(ch)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left ${channelId === ch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                data-testid={`button-dm-${otherId}`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${channelId === ch ? "bg-primary text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                  {(partner?.name ?? "User")?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <span className="truncate">{partner?.name ?? `Unknown User`}</span>
              </button>
            );
          })}

          {allDmThreads.length === 0 && (
            <button onClick={() => setDmOpen(true)} className="w-full text-left px-3 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              + Find someone to message
            </button>
          )}
        </div>


      </div>

      {/* ── Main Chat ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-3 flex items-center gap-2 pb-3 border-b border-border/50">
          {channelId.startsWith("dm-") ? (
            <><MessageCircle className="w-5 h-5 text-primary" /><h1 className="text-xl font-display font-bold">{getChannelLabel(channelId)}</h1><span className="text-sm text-muted-foreground ml-1">— Direct Message</span></>
          ) : (
            <><Hash className="w-5 h-5 text-primary" /><h1 className="text-xl font-display font-bold">{channelId}</h1><span className="text-sm text-muted-foreground ml-1">— {PUBLIC_CHANNELS.find(c => c.id === channelId)?.desc}</span></>
          )}
        </div>

        {!activeSpaceId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">Select a space to start chatting</p>
          </div>
        ) : (
          <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-md bg-card/50 backdrop-blur-sm">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm text-muted-foreground/60">Be the first to say something!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  const showHeader = i === 0 || messages[i - 1].senderId !== msg.senderId;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`} data-testid={`message-${msg.id}`}>
                      {showHeader && (
                        <div className={`flex items-center gap-1.5 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                          <Avatar className={`w-6 h-6 ${isMe ? "order-2" : ""}`}>
                            {msg.sender?.profilePicture ? (
                              <AvatarImage src={msg.sender.profilePicture} alt={msg.sender?.name ?? "User"} />
                            ) : null}
                            <AvatarFallback className="text-xs font-bold">{getInitial(msg)}</AvatarFallback>
                          </Avatar>
                          <div className={`flex items-center gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-xs font-semibold text-muted-foreground">{getSenderName(msg)}</span>
                            <span className="text-xs text-muted-foreground/60 flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(msg.timestamp)}</span>
                          </div>
                        </div>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/20" : "bg-muted border border-border/50 rounded-tl-sm shadow-sm"}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>
            <div className="p-4 bg-background border-t border-border/50">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input value={content} onChange={e => setContent(e.target.value)} placeholder={channelId.startsWith("dm-") ? `Message ${getChannelLabel(channelId)}...` : `Message #${channelId}...`} className="flex-1 rounded-full px-4 border-border/50 focus-visible:ring-primary/20" data-testid="input-message" />
                <Button type="submit" size="icon" className="rounded-full shadow-sm" disabled={!content.trim() || createMsg.isPending || !activeSpaceId} data-testid="button-send-message">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>

      {/* ── New DM Modal ── */}
      <Dialog open={dmOpen} onOpenChange={setDmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Direct Message</DialogTitle></DialogHeader>
          <div className="mt-4">
            <UserSearch
              placeholder="Search users to message..."
              spaceId={activeSpaceId || undefined}
              onMessage={(userId) => {
                openDm(userId);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
