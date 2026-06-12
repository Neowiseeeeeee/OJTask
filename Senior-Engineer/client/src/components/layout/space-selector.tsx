import { useState } from "react";
import { useSpace } from "@/hooks/use-space";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Users, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function SpaceSelector() {
  const { spaces, activeSpaceId, setActiveSpaceId, createSpace, joinSpace, isLoading } = useSpace();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceType, setNewSpaceType] = useState<"official" | "private">("private");
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = async () => {
    if (!newSpaceName.trim()) return;
    try {
      await createSpace({
        name: newSpaceName,
        type: newSpaceType,
        ownerId: user!.id,
        joinCode: newSpaceType === "official" ? generateJoinCode() : null
      });
      toast({ title: "Success", description: "Space created successfully." });
      setIsCreateOpen(false);
      setNewSpaceName("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

// Helper function to generate user-friendly join codes
function generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinSpace({ joinCode });
      toast({ title: "Success", description: "Joined space successfully." });
      setIsJoinOpen(false);
      setJoinCode("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (isLoading) return <div className="h-10 bg-muted animate-pulse rounded-md" />;

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={activeSpaceId?.toString() || ""}
        onValueChange={(val) => setActiveSpaceId(parseInt(val, 10))}
      >
        <SelectTrigger className="w-full bg-background border-border/50 hover:bg-accent/50 transition-colors">
          <SelectValue placeholder="Select a Space" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Your Spaces</SelectLabel>
            {spaces.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">No spaces yet</div>
            ) : (
              spaces.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{s.name}</span>
                    {s.type === 'official' ? <Shield className="w-3 h-3 ml-2 text-primary" /> : <Users className="w-3 h-3 ml-2 text-muted-foreground" />}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
              <Plus className="w-3 h-3 mr-1" /> Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
              <DialogDescription>Setup a new environment for tracking.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Space Name</Label>
                <Input id="name" value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} placeholder="e.g., Summer Internship 2024" />
              </div>
              {user?.role !== 'student' && (
                <div className="grid gap-2">
                  <Label>Space Type</Label>
                  <RadioGroup value={newSpaceType} onValueChange={(v: "official"|"private") => setNewSpaceType(v)}>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer" onClick={() => setNewSpaceType("official")}>
                      <RadioGroupItem value="official" id="r1" />
                      <Label htmlFor="r1" className="cursor-pointer">Official Space (Generates Join Code)</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer" onClick={() => setNewSpaceType("private")}>
                      <RadioGroupItem value="private" id="r2" />
                      <Label htmlFor="r2" className="cursor-pointer">Private Space (Personal tracking)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Create Space</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 text-xs h-8">
              <Users className="w-3 h-3 mr-1" /> Join
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Official Space</DialogTitle>
              <DialogDescription>Enter the code provided by your supervisor.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Join Code</Label>
                <Input id="code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g., X7B9K2" className="uppercase" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleJoin}>Join Space</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
