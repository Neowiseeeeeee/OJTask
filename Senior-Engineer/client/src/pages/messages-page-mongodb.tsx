import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import {
  useMessages,
  useCreateMessage,
  useSpaceMembers,
  useMarkAsRead,
  useDMConversations,
} from "@/hooks/use-features";
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
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Send,
  Hash,
  FolderOpen,
  MessageSquare,
  MessageSquarePlus,
  MessageCircle,
  Check,
  CheckCheck,
} from "lucide-react";
import { format } from "date-fns";
import { UserCardWithPicture } from "@/components/user-card-with-picture";

type MemberRow = {
  id: number;
  userId: number;
  role: string;
  user: {
    id: number;
    name: string;
    role: string;
    profilePicture?: string | null;
  };
};

const PUBLIC_CHANNELS = [
  { id: "general", label: "general", desc: "Team announcements & updates" },
  { id: "chill", label: "chill", desc: "Casual conversation" },
];

const dmChannelId = (a: number, b: number) =>
  `dm-${Math.min(a, b)}-${Math.max(a, b)}`;

export default function MessagesPageMongoDB() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const { openUserProfile } = useUserProfileModal();

  const [location] = useLocation();
  const urlChannelId =
    location.split("/").pop()?.replace("?channelId=", "") || "general";
  const [channelId, setChannelId] = useState(urlChannelId);

  const { data: messages = [] } = useMessages(activeSpaceId, channelId);
  const { data: dmConversations = [] } = useDMConversations(activeSpaceId);
  const markAsRead = useMarkAsRead(activeSpaceId);
  const createMsg = useCreateMessage();

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours =
        (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) return format(date, "h:mm a");
      if (diffInHours < 24) return format(date, "h:mm a");
      if (diffInHours < 24 * 7) return format(date, "EEE h:mm a");
      return format(date, "MMM d, h:mm a");
    } catch {
      return "Just now";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeSpaceId || !user) return;

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
        timestamp: new Date().toISOString(),
      });
    } catch {
      setContent(txt);
    }
  };

  const openDm = (otherId: number) => {
    if (!user) return;
    if (otherId === user.id) return;

    const ch = dmChannelId(user.id, otherId);
    setChannelId(ch);
    setDmOpen(false);
    setDmSearch("");
  };

  const getChannelLabel = (ch: string) => {
    if (!ch.startsWith("dm-")) return ch;
    const parts = ch.split("-");
    const otherId =
      Number(parts[1]) === user?.id ? Number(parts[2]) : Number(parts[1]);
    const partner = dmConversations.find(p => p.id === otherId);
    return partner?.name ?? `Unknown User`;
  };

  const allDmThreads = Array.from(
    new Set(dmConversations.map(p => p.id)),
  );

  // For search modal - filter members by search term
  const otherMembers = members.filter((m: MemberRow) => m.userId !== user?.id);
  const searchFiltered = dmSearch.trim()
    ? otherMembers.filter((m: MemberRow) =>
        m.user?.name?.toLowerCase().includes(dmSearch.toLowerCase()),
      )
    : otherMembers;

  const getSenderDisplay = (msg: any) => {
    const senderId = msg?.senderId;
    const isMe = Boolean(user?.id && senderId === user.id);

    // members.userId should be the other user's id in the space
    // If members doesn't contain senderId, fall back to embedded sender.
    const m = members.find((mm: MemberRow) => mm.userId === senderId);

    // Prefer embedded sender if backend includes it; otherwise fall back to members lookup.
    const embeddedSender = msg?.sender;

    const displayName = isMe
      ? "You"
      : embeddedSender?.name ?? m?.user?.name ?? `User #${senderId ?? "?"}`;

    const profilePicture = isMe
      ? user?.profilePicture
      : embeddedSender?.profilePicture ?? m?.user?.profilePicture ?? null;

    // If still missing, try member lookup by embedded sender id (handles role-specific payload differences)
    const normalizedSenderId =
      senderId ?? embeddedSender?.id ?? embeddedSender?.userId;

    const m2 = normalizedSenderId
      ? members.find((mm: MemberRow) => mm.userId === normalizedSenderId)
      : undefined;

    const finalName =
      displayName === `User #${senderId ?? "?"}`
        ? embeddedSender?.name ?? m2?.user?.name ?? displayName
        : displayName;

    const finalProfilePicture =
      profilePicture ?? embeddedSender?.profilePicture ?? m2?.user?.profilePicture ?? null;

    return {
      isMe,
      displayName: finalName,
      profilePicture: finalProfilePicture,
    };
  };

  const MessageItem = ({
    msg,
    isPreviousFromSameSender,
  }: {
    msg: any;
    isPreviousFromSameSender: boolean;
  }) => {
    const { isMe, displayName, profilePicture } = getSenderDisplay(msg);

    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}
        >
          {!isPreviousFromSameSender && (
            <div
              className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}
            >
              <div
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  // For now, use the message's embedded sender when available.
                  // Fallback to current user.
                  const senderUser = msg?.sender ?? user;
                  if (!senderUser) return;
                  openUserProfile(senderUser);
                }}
              >
                <Avatar className="w-6 h-6">
                  {profilePicture ? (
                    <AvatarImage src={profilePicture} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="text-xs font-semibold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-xs font-medium text-muted-foreground">
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatMessageTime(msg.timestamp)}
                </span>
              </div>
            </div>
          )}

          <div className="group relative">
            <div
              className={`px-3 py-2 rounded-2xl break-words ${
                isMe
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted border border-border/50 rounded-bl-sm"
              } ${!isPreviousFromSameSender ? "mt-1" : ""}`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>

            {isMe && (
              <div className="flex items-center gap-1 mt-1">
                {msg.isRead ? (
                  <CheckCheck className="w-3 h-3 text-blue-500" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                <span className="text-xs text-muted-foreground">
                  {msg.isRead ? "Read" : "Sent"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-5 animate-in fade-in duration-500">
      {/* Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-1 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">
            Channels
          </h2>
          {PUBLIC_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => setChannelId(ch.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                channelId === ch.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              data-testid={`button-channel-${ch.id}`}
            >
              <Hash className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{ch.label}</div>
                <div className="text-xs text-muted-foreground truncate">{ch.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* DM Section */}
        <div className="mt-4">
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
            const ch = dmChannelId(user!.id, otherId);
            const partner = dmConversations.find(p => p.id === otherId);

            const lastMessage = messages
              .filter((msg: any) => msg.senderId === otherId || msg.senderId === user?.id)
              .sort(
                (a: any, b: any) =>
                  new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
              )[0];

            return (
              <button
                key={ch}
                onClick={() => setChannelId(ch)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left ${
                  channelId === ch
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`button-dm-${otherId}`}
              >
                <Avatar className="w-6 h-6">
                  {partner?.profilePicture ? (
                    <AvatarImage
                      src={partner.profilePicture}
                      alt={partner.name ?? "User"}
                    />
                  ) : null}
                  <AvatarFallback className="text-[10px] font-bold">
                    {(partner?.name ?? "User")?.charAt(0)?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">
                    {partner?.name ?? `Unknown User`}
                  </div>
                  {lastMessage && (
                    <div className="text-xs text-muted-foreground truncate">
                      {lastMessage.senderId === user?.id ? "You: " : ""}
                      {lastMessage.content}
                    </div>
                  )}
                </div>
                {lastMessage && (
                  <div className="text-xs text-muted-foreground">
                    {formatMessageTime(lastMessage.timestamp)}
                  </div>
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

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-3 flex items-center gap-2 pb-3 border-b border-border/50">
          {channelId.startsWith("dm-") ? (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-display font-bold">
                  {getChannelLabel(channelId)}
                </h1>
                <span className="text-sm text-muted-foreground">— Direct Message</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-display font-bold">{channelId}</h1>
                <span className="text-sm text-muted-foreground">
                  — {PUBLIC_CHANNELS.find((c) => c.id === channelId)?.desc}
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
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/30" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm text-muted-foreground/60">
                    Be the first to say something!
                  </p>
                </div>
              ) : (
                messages.map((msg: any, i: number) => {
                  const isPreviousFromSameSender =
                    i > 0 && messages[i - 1].senderId === msg.senderId;
                  return (
                    <MessageItem
                      key={msg.id}
                      msg={msg}
                      isPreviousFromSameSender={isPreviousFromSameSender}
                    />
                  );
                })
              )}
              <div ref={endRef} />
            </div>

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
                  disabled={!content.trim() || (createMsg as any).isPending || !activeSpaceId}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>

      {/* New DM Modal */}
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

            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchFiltered.map((m: MemberRow) => (
                <button
                  key={m.id}
                  onClick={() => openDm(m.userId)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <UserCardWithPicture user={m.user} size="sm" showRole={true} />
                </button>
              ))}

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

