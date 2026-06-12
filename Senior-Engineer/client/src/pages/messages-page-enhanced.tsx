import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useMessages, useCreateMessage, useSpaceMembers, useMarkAsRead, useDMConversations } from "@/hooks/use-features";
import { useUserProfileModal } from "@/hooks/use-user-profile-modal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserSearch } from "@/components/user-search";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Hash, FolderOpen, MessageSquare, MessageCircle, MessageSquarePlus, Clock, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { UserCardWithPicture } from "@/components/user-card-with-picture";

type MemberRow = { id: number; userId: number; role: string; user: { id: number; name: string; role: string } };

const PUBLIC_CHANNELS = [
  { id: "general", label: "general", desc: "Team announcements & updates" },
  { id: "chill",   label: "chill",   desc: "Casual conversation" },
];

const dmChannelId = (a: number, b: number) => `dm-${Math.min(a, b)}-${Math.max(a, b)}`;

export default function MessagesPageEnhanced() {
  const { user } = useAuth();
  const { activeSpaceId } = useSpace();
  const { data: members = [] } = useSpaceMembers(activeSpaceId);
  const { openUserProfile } = useUserProfileModal();

  const [location] = useLocation();
  const urlChannelId = location.split("/").pop()?.replace("?channelId=", "") || "general";
  const [channelId, setChannelId] = useState(urlChannelId);

  const { data: messages = [] } = useMessages(activeSpaceId, channelId);
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

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const getSenderInfo = (msg: any) => {
    const senderId = msg?.senderId;
    const isMe = Boolean(user?.id && senderId === user.id);
    const m = members.find((mm: MemberRow) => mm.userId === senderId);

    const name = isMe ? "You" : msg?.sender?.name ?? m?.user?.name ?? `User #${senderId}`;
    const profilePicture = isMe
      ? user?.profilePicture
      : msg?.sender?.profilePicture ?? m?.user?.profilePicture;

    return {
      name,
      profilePicture,
      isMe,
      user: isMe ? { id: user?.id, name, profilePicture } : m?.user
    };
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return format(date, "h:mm a");
      } else if (diffInHours < 24) {
        return format(date, "h:mm a");
      } else if (diffInHours < 24 * 7) {
        return format(date, "EEE h:mm a");
      } else {
        return format(date, "MMM d, h:mm a");
      }
    } catch {
      return "Just now";
    }
  };

  const getInitial = (msg: any) => {
    const info = getSenderInfo(msg);
    return info.name.charAt(0).toUpperCase();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeSpaceId) return;
    const txt = content;
    setContent("");
    try {
      // For DM channels, extract the recipient ID
      let recipientId = null;
      if (channelId.startsWith("dm-")) {
        const parts = channelId.split("-");
        const otherId = Number(parts[1]) === user?.id ? Number(parts[2]) : Number(parts[1]);
        recipientId = otherId;
      }

      await createMsg.mutateAsync({ 
        spaceId: activeSpaceId, 
        senderId: user!.id, 
        recipientId: recipientId || 0, // Use 0 for channel messages
        channelId, 
        content: txt,
        timestamp: new Date().toISOString()
      });
    } catch { setContent(txt); }
  };

  const openDm = (otherId: number) => {
    if (otherId === user?.id) return;
    const ch = dmChannelId(user!.id, otherId);
    setChannelId(ch);
    setDmOpen(false);
    setDmSearch("");
  };

  const getChannelLabel = (ch: string) => {
    if (!ch.startsWith("dm-")) return ch;
    const parts = ch.split("-");
    const otherId = Number(parts[1]) === user?.id ? Number(parts[2]) : Number(parts[1]);
    const partner = dmConversations.find(p => p.id === otherId);
    return partner?.name ?? `Unknown User`;
  };

  // Ensure all DM threads are pre-populated from conversations
  const allDmThreads = Array.from(new Set(
    dmConversations.map(p => p.id)
  ));

  // For search modal - filter members by search term
  const otherMembers = members.filter((m: MemberRow) => m.userId !== user?.id);
  const searchFiltered = dmSearch.trim()
    ? otherMembers.filter((m: MemberRow) => m.user?.name?.toLowerCase().includes(dmSearch.toLowerCase()))
    : otherMembers;

  const MessageBubble = ({ msg, showHeader, isPreviousFromSameSender }: {
    msg: any; 
    showHeader: boolean; 
    isPreviousFromSameSender: boolean;
  }) => {
    const senderInfo = getSenderInfo(msg);
    const isMe = senderInfo.isMe;
    
    return (
      <div 
        key={msg.id} 
        className={`w-full flex ${isMe ? "justify-end" : "justify-start"} ${!isPreviousFromSameSender ? "mb-4" : "mb-1"}`}
        data-testid={`message-${msg.id}`}
      >
        <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
          {showHeader && (
            <div className={`flex items-center gap-2 mb-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <div 
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => !isMe && senderInfo.user && openUserProfile(senderInfo.user)}
              >
                <Avatar className="w-8 h-8">
                  {senderInfo.profilePicture ? (
                    <AvatarImage src={senderInfo.profilePicture} alt={senderInfo.name} />
                  ) : null}
                  <AvatarFallback className="font-semibold bg-gradient-to-br from-primary to-primary/70 text-white">
                    {getInitial(msg)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-sm font-semibold text-foreground">
                  {senderInfo.name}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatMessageTime(msg.timestamp)}
                </span>
              </div>
            </div>
          )}
          
          <div className="group relative">
            <div 
              className={`px-4 py-2.5 rounded-2xl ${
                isMe 
                  ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/20" 
                  : "bg-muted border border-border/50 rounded-tl-sm shadow-sm"
              } ${!showHeader && !isPreviousFromSameSender ? "mt-1" : ""}`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            
            {/* Message status indicators for sent messages */}
            {isMe && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                {msg.isRead ? (
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span className="text-xs">
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">Channels</h2>
          {PUBLIC_CHANNELS.map(ch => (
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Direct Messages</h2>
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
            const lastMessage = messages
              .filter(msg => msg.senderId === otherId || msg.senderId === user?.id)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
            
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
                <div className="relative">
                  <Avatar className="w-6 h-6">
                    {partner?.profilePicture ? (
                      <AvatarImage src={partner.profilePicture} alt={partner?.name ?? "User"} />
                    ) : null}
                    <AvatarFallback className="text-[10px] font-bold">
                      {(partner?.name ?? "User")?.charAt(0)?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator could be added here */}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{partner?.name ?? `Unknown User`}</div>
                  {lastMessage && (
                    <div className="text-xs text-muted-foreground truncate">
                      {lastMessage.senderId === user?.id ? "You: " : ""}{lastMessage.content}
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
                <h1 className="text-xl font-display font-bold">{getChannelLabel(channelId)}</h1>
                <span className="text-sm text-muted-foreground">Direct Message</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-primary" />
              <div>
                <h1 className="text-xl font-display font-bold">{channelId}</h1>
                <span className="text-sm text-muted-foreground">
                  {PUBLIC_CHANNELS.find(c => c.id === channelId)?.desc}
                </span>
              </div>
            </div>
          )}
        </div>

        {!activeSpaceId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">Select a space to start chatting</p>
          </div>
        ) : (
          <Card className="flex-1 flex flex-col overflow-hidden border-border/50 shadow-md bg-card/50 backdrop-blur-sm">
            <div className="flex-1 overflow-y-auto p-6">
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
                  const isPreviousFromSameSender = i > 0 && messages[i - 1].senderId === msg.senderId;
                  
                  return (
                    <MessageBubble 
                      key={msg.id} 
                      msg={msg} 
                      showHeader={showHeader}
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
                  onChange={e => setContent(e.target.value)} 
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
                  disabled={!content.trim() || createMsg.isPending || !activeSpaceId} 
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
              onChange={e => setDmSearch(e.target.value)}
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
