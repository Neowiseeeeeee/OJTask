import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSpace } from "@/hooks/use-space";
import { useSpaceSettings, type SpaceSettingsData } from "@/hooks/use-space-settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Settings, FileText, Clock, Users, ClipboardList, Award, 
  Building2, MessageSquare, Target, Plus, Trash2, Save, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const DEFAULT_SETTINGS: SpaceSettingsData = {
  totalRequiredHours: 486,
  requiredDocuments: [],
  documentDeadlines: [],
  dailyHoursMin: 1,
  dailyHoursMax: 8,
  weeklyHoursMin: 20,
  weeklyHoursMax: 40,
  requiredAttendanceDays: 5,
  allowedAbsences: 2,
  scrumFrequency: "daily",
  scrumTimeRequirement: "end_of_day",
  evaluationFrequency: "monthly",
  evaluationCriteria: [],
  companyPolicies: "",
  workingHours: "9:00 AM - 6:00 PM",
  breakDuration: 60,
  communicationChannels: [],
  reportingStructure: ""
};

function OJTRequirements({ settings, onChange }: { 
  settings: SpaceSettingsData; 
  onChange: (settings: SpaceSettingsData) => void;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          OJT Completion Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="total-required-hours">Total Required Hours for OJT Completion</Label>
          <Input
            id="total-required-hours"
            type="number"
            min="1"
            max="2000"
            value={settings.totalRequiredHours}
            onChange={(e) => onChange({ ...settings, totalRequiredHours: parseInt(e.target.value) || 486 })}
            placeholder="e.g., 486"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Total hours a student must complete to finish their OJT program
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentRequirements({ settings, onChange }: { 
  settings: SpaceSettingsData; 
  onChange: (settings: SpaceSettingsData) => void;
}) {
  const [newDocument, setNewDocument] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  const addDocument = () => {
    if (newDocument.trim()) {
      onChange({
        ...settings,
        requiredDocuments: [...settings.requiredDocuments, newDocument.trim()],
        documentDeadlines: [...settings.documentDeadlines, newDeadline.trim()]
      });
      setNewDocument("");
      setNewDeadline("");
    }
  };

  const removeDocument = (index: number) => {
    onChange({
      ...settings,
      requiredDocuments: settings.requiredDocuments.filter((_, i) => i !== index),
      documentDeadlines: settings.documentDeadlines.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Document Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {settings.requiredDocuments.map((doc, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{doc}</p>
                {settings.documentDeadlines[index] && (
                  <p className="text-xs text-muted-foreground">Deadline: {settings.documentDeadlines[index]}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeDocument(index)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="new-document">Document Type</Label>
              <Input
                id="new-document"
                placeholder="e.g., Resume, Portfolio, Certificate"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-deadline">Deadline Description</Label>
              <Input
                id="new-deadline"
                placeholder="e.g., Within 2 weeks of start"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addDocument} className="w-full mt-3 gap-2">
            <Plus className="w-4 h-4" /> Add Document Requirement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeRequirements({ settings, onChange }: { 
  settings: SpaceSettingsData; 
  onChange: (settings: SpaceSettingsData) => void;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Time Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="daily-hours-min">Daily Hours (Min)</Label>
            <Input
              id="daily-hours-min"
              type="number"
              min="1"
              max="12"
              value={settings.dailyHoursMin}
              onChange={(e) => onChange({ ...settings, dailyHoursMin: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div>
            <Label htmlFor="daily-hours-max">Daily Hours (Max)</Label>
            <Input
              id="daily-hours-max"
              type="number"
              min="1"
              max="12"
              value={settings.dailyHoursMax}
              onChange={(e) => onChange({ ...settings, dailyHoursMax: parseInt(e.target.value) || 8 })}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weekly-hours-min">Weekly Hours (Min)</Label>
            <Input
              id="weekly-hours-min"
              type="number"
              min="1"
              max="60"
              value={settings.weeklyHoursMin}
              onChange={(e) => onChange({ ...settings, weeklyHoursMin: parseInt(e.target.value) || 20 })}
            />
          </div>
          <div>
            <Label htmlFor="weekly-hours-max">Weekly Hours (Max)</Label>
            <Input
              id="weekly-hours-max"
              type="number"
              min="1"
              max="60"
              value={settings.weeklyHoursMax}
              onChange={(e) => onChange({ ...settings, weeklyHoursMax: parseInt(e.target.value) || 40 })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="working-hours">Standard Working Hours</Label>
          <Input
            id="working-hours"
            placeholder="e.g., 9:00 AM - 6:00 PM"
            value={settings.workingHours}
            onChange={(e) => onChange({ ...settings, workingHours: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="break-duration">Break Duration (minutes)</Label>
          <Input
            id="break-duration"
            type="number"
            min="0"
            max="120"
            value={settings.breakDuration}
            onChange={(e) => onChange({ ...settings, breakDuration: parseInt(e.target.value) || 60 })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function AttendanceRequirements({ settings, onChange }: { 
  settings: SpaceSettingsData; 
  onChange: (settings: SpaceSettingsData) => void;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Attendance Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="required-days">Required Days per Week</Label>
          <Input
            id="required-days"
            type="number"
            min="1"
            max="7"
            value={settings.requiredAttendanceDays}
            onChange={(e) => onChange({ ...settings, requiredAttendanceDays: parseInt(e.target.value) || 5 })}
          />
        </div>
        
        <div>
          <Label htmlFor="allowed-absences">Allowed Absences per Month</Label>
          <Input
            id="allowed-absences"
            type="number"
            min="0"
            max="10"
            value={settings.allowedAbsences}
            onChange={(e) => onChange({ ...settings, allowedAbsences: parseInt(e.target.value) || 2 })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ScrumRequirements({ settings, onChange }: { 
  settings: SpaceSettingsData; 
  onChange: (settings: SpaceSettingsData) => void;
}) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Scrum Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="scrum-frequency">Scrum Frequency</Label>
          <Select value={settings.scrumFrequency} onValueChange={(value) => onChange({ ...settings, scrumFrequency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="scrum-time">Scrum Time Requirement</Label>
          <Select value={settings.scrumTimeRequirement} onValueChange={(value) => onChange({ ...settings, scrumTimeRequirement: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning (Start of Day)</SelectItem>
              <SelectItem value="end_of_day">End of Day</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function EvaluationRequirements({ settings, onChange }: { 
  settings: SpaceSettingsData; 
  onChange: (settings: SpaceSettingsData) => void;
}) {
  const [newCriteria, setNewCriteria] = useState("");

  const addCriteria = () => {
    if (newCriteria.trim()) {
      onChange({
        ...settings,
        evaluationCriteria: [...settings.evaluationCriteria, newCriteria.trim()]
      });
      setNewCriteria("");
    }
  };

  const removeCriteria = (index: number) => {
    onChange({
      ...settings,
      evaluationCriteria: settings.evaluationCriteria.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Evaluation Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="evaluation-frequency">Evaluation Frequency</Label>
          <Select value={settings.evaluationFrequency} onValueChange={(value) => onChange({ ...settings, evaluationFrequency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Custom Evaluation Criteria</Label>
          <div className="space-y-2 mt-2">
            {settings.evaluationCriteria.map((criteria, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <span className="flex-1 text-sm">{criteria}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCriteria(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="Add evaluation criteria"
              value={newCriteria}
              onChange={(e) => setNewCriteria(e.target.value)}
            />
            <Button onClick={addCriteria} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CompanyPolicies({ settings, onChange }: { 
  settings: SpaceSettingsData; 
  onChange: (settings: SpaceSettingsData) => void;
}) {
  const [newChannel, setNewChannel] = useState("");

  const addChannel = () => {
    if (newChannel.trim()) {
      onChange({
        ...settings,
        communicationChannels: [...settings.communicationChannels, newChannel.trim()]
      });
      setNewChannel("");
    }
  };

  const removeChannel = (index: number) => {
    onChange({
      ...settings,
      communicationChannels: settings.communicationChannels.filter((_, i) => i !== index)
    });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Company Policies & Communication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="company-policies">Company Policies & Rules</Label>
          <Textarea
            id="company-policies"
            placeholder="Enter company rules, regulations, and policies..."
            className="min-h-[100px]"
            value={settings.companyPolicies}
            onChange={(e) => onChange({ ...settings, companyPolicies: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="reporting-structure">Reporting Structure</Label>
          <Textarea
            id="reporting-structure"
            placeholder="Describe the reporting hierarchy and process..."
            className="min-h-[80px]"
            value={settings.reportingStructure}
            onChange={(e) => onChange({ ...settings, reportingStructure: e.target.value })}
          />
        </div>

        <div>
          <Label>Communication Channels</Label>
          <div className="space-y-2 mt-2">
            {settings.communicationChannels.map((channel, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="flex-1 text-sm">{channel}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeChannel(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="Add communication channel"
              value={newChannel}
              onChange={(e) => setNewChannel(e.target.value)}
            />
            <Button onClick={addChannel} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SpaceAdminPage() {
  const { user } = useAuth();
  const { activeSpace, activeSpaceId } = useSpace();
  const { toast } = useToast();
  const { settings, isLoading, updateSettings, isUpdating } = useSpaceSettings(activeSpaceId);
  const [localSettings, setLocalSettings] = useState<SpaceSettingsData>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local settings when loaded from API
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Only allow space owners and supervisors to access
  const canAccess = user && (user.role === "admin" || user.role === "supervisor" || activeSpace?.ownerId === user.id);

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access space settings.</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      
      toast({
        title: "Settings Saved",
        description: "Space standards have been updated successfully.",
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateLocalSettings = (newSettings: SpaceSettingsData) => {
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-display font-bold">Space Administration</h1>
        </div>
        <p className="text-muted-foreground ml-13">
          Configure standards and requirements for <span className="font-medium text-foreground">{activeSpace?.name}</span>
        </p>
      </div>

      <ScrollArea className="max-h-[calc(100vh-200px)]">
        <div className="space-y-6">
          <OJTRequirements settings={localSettings} onChange={updateLocalSettings} />
          <DocumentRequirements settings={localSettings} onChange={updateLocalSettings} />
          <TimeRequirements settings={localSettings} onChange={updateLocalSettings} />
          <AttendanceRequirements settings={localSettings} onChange={updateLocalSettings} />
          <ScrumRequirements settings={localSettings} onChange={updateLocalSettings} />
          <EvaluationRequirements settings={localSettings} onChange={updateLocalSettings} />
          <CompanyPolicies settings={localSettings} onChange={updateLocalSettings} />
        </div>
      </ScrollArea>

      {hasChanges && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            size="lg"
            className="gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
