import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import {
  useCreateMessage,
  useDMConversations,
  useMarkAsRead,
  useMessages,
  useSpaceMembers,
} from "@/hooks/use-features";
import { useUnreadMessages, useUnreadPerChannel } from "@/hooks/use-unread-messages";
import { useUserProfileModal } from "@/hooks/use-user-profile-modal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBadge } from "@/components/notification-badge";
import {
  Send,
  Hash,
  FolderOpen,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Check,
  CheckCheck,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PUBLIC_CHANNELS = [
  { id: "general", label: "general", desc: "Team announcements & updates" },
  { id: "chill", label: "chill", desc: "Casual conversation" },
];

const dmChannelId = (a: number, b: number) =>
  `dm-${Math.min(a, b)}-${Math.max(a, b)}`;

function formatMessageTime(ts: string) {
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return "";
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return format(date, "h:mm a");
    if (diffHours < 24 * 7) return format(date, "EEE h:mm a");
    return format(date, "MMM d, h:mm a");
  } catch {
    return "";
  }
}

// ─── MessageItem is outside MessagesPageStandardized to avoid "Invalid hook call" ───

type MessageItemProps = {
  msg: any;
  isPreviousFromSameSender: boolean;
  currentUserId: number;
  currentUserProfilePicture?: string | null;
  currentUserName: string;
  onAvatarClick?: (userId: number) => void;
};

function MessageItem({
  msg,
  isPreviousFromSameSender,
  currentUserId,
  currentUserProfilePicture,
  currentUserName,
  onAvatarClick,
}: MessageItemProps) {
  const senderId = msg?.senderId;
  const isMe = senderId != null && Number(senderId) === Number(currentUserId);

  const name = isMe
    ? "You"
    : msg?.sender?.name ?? `User #${senderId ?? "?"}`;
  const profilePicture = isMe
    ? currentUserProfilePicture
    : msg?.sender?.profilePicture ?? null;
  const initial = (name ?? "?").charAt(0).toUpperCase();

  // A message is "unread" when it came from someone else and hasn't been read yet
  const isUnread = !isMe && msg?.isRead === false;

  return (
    <div className={cn("flex mb-1", isMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isMe ? "items-end" : "items-start",
        )}
      >
        {!isPreviousFromSameSender && (
          <div
            className={cn(
              "flex items-center gap-2 mb-1",
              isMe ? "flex-row-reverse" : "",
            )}
          >
            <Avatar
              className={cn(
                "w-6 h-6 shrink-0",
                !isMe && onAvatarClick && "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all rounded-full",
              )}
              onClick={() => {
                if (!isMe && onAvatarClick && senderId != null) {
                  onAvatarClick(Number(senderId));
                }
              }}
            >
              {profilePicture ? (
                <AvatarImage src={profilePicture} alt={name} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "text-xs",
                isUnread
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground",
              )}
            >
              {name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(msg.timestamp)}
            </span>
          </div>
        )}

        <div
          className={cn(
            "px-3 py-2 rounded-2xl break-words",
            isMe
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted border border-border/50 rounded-bl-sm",
            isUnread && !isMe && "ring-1 ring-primary/40",
          )}
          style={{ wordBreak: "break-word" }}
        >
          <p
            className={cn(
              "text-sm leading-relaxed whitespace-pre-wrap",
              isUnread && "font-semibold",
            )}
          >
            {msg.content}
          </p>
        </div>

        {isMe && (
          <div className="flex items-center gap-1 mt-0.5">
            {msg.isRead ? (
              <CheckCheck className="w-3 h-3 text-blue-400" />
            ) : (
              <Check className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {msg.isRead ? "Read" : "Sent"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────

export default function MessagesPageStandardized() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: members = [] } = useSpaceMembers(activeSpaceId);

  const [location] = useLocation();
  const urlChannelId =
    location.split("/").pop()?.replace("?channelId=", "") || "general";
  const [channelId, setChannelId] = useState(urlChannelId);

  const { data: messages = [] } = useMessages(activeSpaceId, channelId);
  const { data: dmConversations = [] } = useDMConversations(activeSpaceId);
  const { data: totalUnread = 0 } = useUnreadMessages();
  const { data: unreadPerChannel = {} } = useUnreadPerChannel(activeSpaceId);
  const markAsRead = useMarkAsRead(activeSpaceId);
  const createMsg = useCreateMessage();
  const { openUserProfile } = useUserProfileModal();

  const [content, setContent] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const [dmOpen, setDmOpen] = useState(false);
  const [dmSearch, setDmSearch] = useState("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when switching channels (debounced 500 ms)
  useEffect(() => {
    if (!activeSpaceId || !channelId) return;
    const timer = setTimeout(() => {
      markAsRead.mutate({ channelId });
    }, 500);
    return () => clearTimeout(timer);
  }, [channelId, activeSpaceId]);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a: any, b: any) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
    [messages],
  );

  // Collect all DM partner IDs from conversations + current messages
  const allDmThreads = useMemo(() => {
    const ids = new Set<number>();
    for (const p: any of dmConversations as any[]) {
      if (typeof p?.id === "number") ids.add(p.id);
      if (typeof p?.userId === "number") ids.add(p.userId);
    }
    for (const m: any of sortedMessages as any[]) {
      if (!user?.id || typeof m.channelId !== "string") continue;
      if (!m.channelId.startsWith("dm-")) continue;
      const parts = m.channelId.split("-");
      const a = Number(parts[1]);
      const b = Number(parts[2]);
      if (a === user.id) ids.add(b);
      else if (b === user.id) ids.add(a);
    }
    return Array.from(ids);
  }, [dmConversations, sortedMessages, user?.id]);

  const otherMembers = useMemo(
    () => members.filter((m: any) => m.userId !== user?.id),
    [members, user?.id],
  );

  const searchFiltered = useMemo(() => {
    const q = dmSearch.trim().toLowerCase();
    return q
      ? otherMembers.filter((m: any) =>
          m.user?.name?.toLowerCase().includes(q),
        )
      : otherMembers;
  }, [dmSearch, otherMembers]);

  // Last message per DM channel (for sidebar previews)
  const lastMessagePerDm = useMemo(() => {
    const map: Record<string, any> = {};
    for (const m of sortedMessages as any[]) {
      if (typeof m.channelId === "string" && m.channelId.startsWith("dm-")) {
        map[m.channelId] = m;
      }
    }
    return map;
  }, [sortedMessages]);

  const resolvePartnerName = (otherId: number): string => {
    // Try DM conversations first
    const fromDm = dmConversations.find((p: any) => p.id === otherId);
    if (fromDm?.name) return fromDm.name;
    // Fall back to space members list
    const fromMembers = members.find((m: any) => m.userId === otherId);
    const u = fromMembers?.user;
    if (u) {
      if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
      if (u.name) return u.name;
      if (u.username) return u.username;
    }
    return `User #${otherId}`;
  };

  const getChannelLabel = (ch: string) => {
    if (!ch.startsWith("dm-")) return ch;
    const parts = ch.split("-");
    const otherId =
      Number(parts[1]) === user?.id ? Number(parts[2]) : Number(parts[1]);
    return resolvePartnerName(otherId);
  };

  const openDm = (otherId: number) => {
    if (!user || otherId === user.id) return;
    const ch = dmChannelId(user.id, otherId);
    setDmOpen(false);
    setDmSearch("");
    // Set channel after dialog closes to avoid layout conflicts
    setTimeout(() => setChannelId(ch), 0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeSpaceId || !user) return;
    setSendError(null);
    const txt = content;
    setContent("");

    try {
      let recipientId = 0;
      if (channelId.startsWith("dm-")) {
        const parts = channelId.split("-");
        const otherId =
          Number(parts[1]) === user.id ? Number(parts[2]) : Number(parts[1]);
        recipientId = otherId;
      }

      await createMsg.mutateAsync({
        spaceId: activeSpaceId,
        senderId: user.id,
        recipientId,
        channelId,
        content: txt,
      });
    } catch (err: any) {
      setContent(txt);
      setSendError(err?.message ?? "Failed to send message. Please try again.");
    }
  };

  const [showMobileSidebar, setShowMobileSidebar] = useState(true);

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-9.5rem)] md:h-[calc(100vh-8rem)] flex gap-5 animate-in fade-in duration-500">
      {/* ── Left Sidebar ───────────────────────────────────────────────────── */}
      <div className={`${showMobileSidebar ? "flex" : "hidden"} md:flex w-full md:w-64 shrink-0 flex-col gap-1 overflow-y-auto`}>
        {/* Mobile back button when a channel is selected */}
        <div className="md:hidden flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Channels & Messages</span>
        </div>
        {/* Public channels */}
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">
            Channels
          </h2>
          {PUBLIC_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => { setChannelId(ch.id); setShowMobileSidebar(false); }}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left",
                channelId === ch.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
              data-testid={`button-channel-${ch.id}`}
            >
              <Hash className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{ch.label}</div>
                <div className="text-xs text-muted-foreground/70 truncate">
                  {ch.desc}
                </div>
              </div>
              {(unreadPerChannel[ch.id] ?? 0) > 0 && (
                <NotificationBadge count={unreadPerChannel[ch.id]} />
              )}
            </button>
          ))}
        </div>

        {/* DM threads */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Direct Messages
            </h2>
            <button
              onClick={() => setDmOpen(true)}
              className="text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-primary/10"
              title="New message"
              data-testid="button-new-dm"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {allDmThreads.map((otherId) => {
            const ch = dmChannelId(user.id, otherId);
            const partnerName = resolvePartnerName(otherId);
            const partnerMember = members.find((m: any) => m.userId === otherId);
            const partnerPic =
              dmConversations.find((p: any) => p.id === otherId)?.profilePicture
              ?? partnerMember?.user?.profilePicture
              ?? null;
            const lastMsg = lastMessagePerDm[ch];
            const unread = unreadPerChannel[ch] ?? 0;
            const isActive = channelId === ch;

            return (
              <button
                key={ch}
                onClick={() => { setChannelId(ch); setShowMobileSidebar(false); }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  unread > 0 && !isActive && "font-semibold text-foreground",
                )}
                data-testid={`button-dm-${otherId}`}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-7 h-7">
                    {partnerPic ? (
                      <AvatarImage src={partnerPic} alt={partnerName} />
                    ) : null}
                    <AvatarFallback className="text-[10px] font-bold">
                      {partnerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {unread > 0 && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "truncate",
                      unread > 0 && !isActive && "font-semibold text-foreground",
                    )}
                  >
                    {partnerName}
                  </div>
                  {lastMsg && (
                    <div className="text-xs text-muted-foreground truncate">
                      {lastMsg.senderId === user.id ? "You: " : ""}
                      {lastMsg.content}
                    </div>
                  )}
                </div>
                {unread > 0 && !isActive && (
                  <NotificationBadge count={unread} className="shrink-0" />
                )}
              </button>
            );
          })}

          {allDmThreads.length === 0 && (
            <button
              onClick={() => setDmOpen(true)}
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              + Find someone to message
            </button>
          )}
        </div>
      </div>

      {/* ── Main Chat ───────────────────────────────────────────────────────── */}
      <div className={`${showMobileSidebar ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0`}>
        <div className="mb-3 flex items-center gap-2 pb-3 border-b border-border/50">
          {/* Mobile back button */}
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Back to channels"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          {channelId.startsWith("dm-") ? (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-display font-bold">
                  {getChannelLabel(channelId)}
                </h1>
                <span className="text-sm text-muted-foreground">
                  Direct Message
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-display font-bold">{channelId}</h1>
                <span className="text-sm text-muted-foreground">
                  {PUBLIC_CHANNELS.find((c) => c.id === channelId)?.desc}
                </span>
              </div>
            </div>
          )}
        </div>

        {!activeSpaceId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">
              Select a space to start chatting
            </p>
          </div>
        ) : (
          <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-md bg-card/50 backdrop-blur-sm">
            <div className="flex-1 overflow-y-auto p-6">
              {sortedMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm text-muted-foreground/60">
                    Be the first to say something!
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {sortedMessages.map((msg: any, i: number) => {
                    const isPrev =
                      i > 0 &&
                      sortedMessages[i - 1].senderId === msg.senderId;
                    return (
                      <MessageItem
                        key={msg.id ?? i}
                        msg={msg}
                        isPreviousFromSameSender={isPrev}
                        currentUserId={user.id}
                        currentUserProfilePicture={user.profilePicture}
                        currentUserName={user.name}
                        onAvatarClick={(userId) => {
                          const member = members.find((m: any) => m.userId === userId);
                          openUserProfile(
                            member?.user ?? { id: userId, name: `User #${userId}`, username: `user_${userId}` }
                          );
                        }}
                      />
                    );
                  })}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {sendError && (
              <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
                <p className="text-xs text-destructive">{sendError}</p>
              </div>
            )}

            <div className="p-4 bg-background border-t border-border/50">
              <form onSubmit={handleSend} className="flex gap-2">
                <Input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    channelId.startsWith("dm-")
                      ? `Message ${getChannelLabel(channelId)}...`
                      : `Message #${channelId}...`
                  }
                  className="flex-1 rounded-full px-4 border-border/50 focus-visible:ring-primary/20"
                  data-testid="input-message"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-full shadow-sm"
                  disabled={
                    !content.trim() || createMsg.isPending || !activeSpaceId
                  }
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>

      {/* ── New DM Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={dmOpen} onOpenChange={setDmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start a conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search team members..."
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              className="w-full"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searchFiltered.map((m: any) => {
                const memberUser = m.user;
                const displayName =
                  memberUser?.firstName && memberUser?.lastName
                    ? `${memberUser.firstName} ${memberUser.lastName}`
                    : memberUser?.name || memberUser?.username || `User #${m.userId}`;
                const initial = displayName.charAt(0).toUpperCase();
                const role = memberUser?.role || m.role;
                return (
                  <button
                    key={m.userId}
                    onClick={() => openDm(m.userId)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="w-9 h-9 shrink-0">
                      {memberUser?.profilePicture ? (
                        <AvatarImage src={memberUser.profilePicture} alt={displayName} />
                      ) : null}
                      <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white text-sm">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm leading-tight truncate">
                        {displayName}
                      </span>
                      {role && (
                        <span className="text-xs text-muted-foreground capitalize">
                          {role}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {searchFiltered.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No members found
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
