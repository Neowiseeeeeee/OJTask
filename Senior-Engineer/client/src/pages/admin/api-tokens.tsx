import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Copy, Trash2, Plus, Eye, EyeOff } from "lucide-react";

interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsed?: string;
  status: "active" | "revoked";
  permissions: string[];
}

export default function AdminApiTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([
    {
      id: "1",
      name: "Mobile App Integration",
      token: "sk_live_1234567890abcdef",
      createdAt: "2026-04-01",
      lastUsed: "2026-04-02 14:32",
      status: "active",
      permissions: ["read:users", "read:spaces", "read:analytics"]
    },
    {
      id: "2",
      name: "Third Party Service",
      token: "sk_live_abcdefghijklmnop",
      createdAt: "2026-03-15",
      lastUsed: "2026-03-28 09:15",
      status: "active",
      permissions: ["read:spaces", "write:logs"]
    }
  ]);

  const [showTokens, setShowTokens] = useState<Set<string>>(new Set());
  const [newTokenName, setNewTokenName] = useState("");

  const toggleTokenVisibility = (tokenId: string) => {
    setShowTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) newSet.delete(tokenId);
      else newSet.add(tokenId);
      return newSet;
    });
  };

  const createToken = () => {
    if (!newTokenName.trim()) return;
    const newToken: ApiToken = {
      id: Date.now().toString(),
      name: newTokenName,
      token: `sk_live_${Math.random().toString(36).substr(2, 16)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: "active",
      permissions: ["read:users", "read:spaces"]
    };
    setTokens([...tokens, newToken]);
    setNewTokenName("");
  };

  const revokeToken = (tokenId: string) => {
    setTokens(tokens.map(t => 
      t.id === tokenId ? { ...t, status: "revoked" as const } : t
    ));
  };

  const deleteToken = (tokenId: string) => {
    setTokens(tokens.filter(t => t.id !== tokenId));
    setShowTokens(prev => {
      const newSet = new Set(prev);
      newSet.delete(tokenId);
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">API Token Management</h1>
        <p className="text-muted-foreground mt-2">Create and manage API tokens for third-party integrations</p>
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800/30">
        <CardHeader>
          <CardTitle className="text-base">Create New Token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter token name (e.g., Mobile App Integration)"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === "Enter" && createToken()}
            />
            <Button 
              onClick={createToken}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Tokens are used to authenticate API requests. Keep them secret and rotate regularly.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Active Tokens ({tokens.filter(t => t.status === "active").length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tokens.filter(t => t.status === "active").length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No active tokens. Create one to get started.</p>
            ) : (
              tokens.filter(t => t.status === "active").map((token) => (
                <div key={token.id} className="border border-border/50 rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm">{token.name}</h3>
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      </div>
                      
                      <div className="bg-muted rounded px-3 py-2 font-mono text-xs mb-3 flex items-center justify-between group relative">
                        <span className="text-muted-foreground select-none">
                          {showTokens.has(token.id) ? token.token : '••••••••••••••••••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => toggleTokenVisibility(token.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity mr-2"
                          title="Toggle visibility"
                        >
                          {showTokens.has(token.id) ? (
                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                        <div>
                          <p className="font-semibold text-foreground/70">Created</p>
                          <p>{token.createdAt}</p>
                        </div>
                        {token.lastUsed && (
                          <div>
                            <p className="font-semibold text-foreground/70">Last Used</p>
                            <p>{token.lastUsed}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {token.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(token.token)}
                        className="text-xs"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeToken(token.id)}
                        className="text-xs text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {tokens.filter(t => t.status === "revoked").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revoked Tokens ({tokens.filter(t => t.status === "revoked").length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tokens.filter(t => t.status === "revoked").map((token) => (
                <div key={token.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-muted-foreground line-through">{token.name}</p>
                      <p className="text-xs text-muted-foreground">Revoked on {token.createdAt}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteToken(token.id)}
                    className="text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/30">
        <CardHeader>
          <CardTitle className="text-base">Security Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <div className="flex gap-3">
            <span className="text-lg">🔐</span>
            <div>
              <p className="font-semibold text-foreground">Never share your tokens</p>
              <p>Treat API tokens like passwords. Don't commit them to version control.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">🔄</span>
            <div>
              <p className="font-semibold text-foreground">Rotate regularly</p>
              <p>Create new tokens and revoke old ones every 3-6 months.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-lg">👀</span>
            <div>
              <p className="font-semibold text-foreground">Monitor usage</p>
              <p>Check the "Last Used" timestamp to detect suspicious activity.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
