import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Mail, BellRing, MessageSquare, Pencil } from 'lucide-react';

interface ContentAgentClarificationProps {
  onGenerateContent: () => void;
  showGenerateButton?: boolean;
  promptTemplateExists?: boolean;
}

export function ContentAgentClarification({ onGenerateContent, showGenerateButton = false, promptTemplateExists = true }: ContentAgentClarificationProps) {
  const [editMode, setEditMode] = useState(true);
  // Radio button state - default to "questionaire" 
  const [selectionMode, setSelectionMode] = useState<string>("questionaire");
  
  const [promptTemplate, setPromptTemplate] = useState<string>("quirky-teenagers");
  const [intent, setIntent] = useState<string>(promptTemplateExists ? "engage" : "promote");
  const [audience, setAudience] = useState<string>(promptTemplateExists ? "Teenagers who are tech savvy" : "Beauty enthusiasts and fragrance lovers aged 25-40");
  const [tone, setTone] = useState<string>(promptTemplateExists ? "enthusiastic" : "enthusiastic");
  const [remarks, setRemarks] = useState<string>(promptTemplateExists ? "Content style should be quirky and funny, it should be highly engaging especially for teenagers" : "Emphasize limited time offers and personalized recommendations. Include valentine's day emoji and romantic language.");
  const [showAdvancedFields, setShowAdvancedFields] = useState<boolean>(false);
  
  // State for when templates don't exist
  const [saveForLater, setSaveForLater] = useState(true);
  const [templateName, setTemplateName] = useState("Custom Campaign Template");

  // State for accordion fields
  // WhatsApp fields
  const [whatsappCategory, setWhatsappCategory] = useState("marketing");
  const [whatsappLayout, setWhatsappLayout] = useState("rich-media");
  const [whatsappLanguage, setWhatsappLanguage] = useState("english-us");
  const [whatsappPersonalization, setWhatsappPersonalization] = useState("First name");
  const [whatsappCTACount, setWhatsappCTACount] = useState("2");
  const [whatsappRemarks, setWhatsappRemarks] = useState("Content style should be quirky and funny");

  // App Push fields  
  const [appPushLayout, setAppPushLayout] = useState("overlay");
  const [appPushLanguage, setAppPushLanguage] = useState("english-us");
  const [appPushPersonalization, setAppPushPersonalization] = useState("First name");
  const [appPushCTACount, setAppPushCTACount] = useState("2");
  const [appPushRemarks, setAppPushRemarks] = useState("Content style should be quirky and funny");

  // Email fields
  const [emailRemarks, setEmailRemarks] = useState("");

  // Save as template fields
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  
  // State for showing expanded fields in template mode
  const [showTemplateFields, setShowTemplateFields] = useState(false);

  // Template configurations
  const templateConfigs = {
    "quirky-teenagers": {
      intent: "engage",
      audience: "Teenagers who are tech savvy",
      tone: "enthusiastic",
      remarks: "Content style should be quirky and funny, it should be highly engaging especially for teenagers"
    },
    "formal-seniors": {
      intent: "inform",
      audience: "Senior citizens and mature adults",
      tone: "formal",
      remarks: "Content should be respectful, clear, and easy to understand with professional language"
    },
    "global-neutral": {
      intent: "inform",
      audience: "Global audience across all demographics",
      tone: "professional",
      remarks: "Content should be culturally neutral, accessible, and avoid region-specific references"
    },
    "custom": {
      intent: "promote",
      audience: "",
      tone: "friendly",
      remarks: ""
    }
  };

  // Auto-fill fields when template changes
  useEffect(() => {
    const config = templateConfigs[promptTemplate as keyof typeof templateConfigs];
    if (config) {
      setIntent(config.intent);
      setAudience(config.audience);
      setTone(config.tone);
      setRemarks(config.remarks);
    }
    
    // Show advanced fields immediately for custom, hide for preset templates
    if (promptTemplate === "custom") {
      setShowAdvancedFields(true);
    } else {
      setShowAdvancedFields(false);
    }
  }, [promptTemplate]);

  if (!editMode) {
    return (
      <div className="space-y-4 relative group">
        <div className="space-y-3">
          <div className="flex">
            <div className="w-32 font-medium text-sm text-muted-foreground">Prompt template:</div>
            <div className="flex-1 text-sm">
              {promptTemplate === "quirky-teenagers" && "Quirky for teenagers"}
              {promptTemplate === "formal-seniors" && "Formal seniors"}
              {promptTemplate === "global-neutral" && "Global neutral audience"}
              {promptTemplate === "custom" && "Custom"}
            </div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium text-sm text-muted-foreground">Intent:</div>
            <div className="flex-1 text-sm">{intent.charAt(0).toUpperCase() + intent.slice(1)}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium text-sm text-muted-foreground">Target audience:</div>
            <div className="flex-1 text-sm">{audience || "Not specified"}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium text-sm text-muted-foreground">Tone:</div>
            <div className="flex-1 text-sm">{tone.charAt(0).toUpperCase() + tone.slice(1)}</div>
          </div>
          
          <div className="flex">
            <div className="w-32 font-medium text-sm text-muted-foreground">Additional remarks:</div>
            <div className="flex-1 text-sm">{remarks || "None"}</div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setEditMode(true)}
            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    );
  }

  // Alternative UI when prompt templates don't exist
  if (!promptTemplateExists) {
    return (
      <div className="space-y-4">
        <p className="text-sm">Let's now create the campaign content. Give me a few quick inputs in the fields below, and I'll spin them into compelling and engaging content for every segment.</p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Intent</Label>
            <Select 
              value={intent}
              onValueChange={setIntent}
            >
              <SelectTrigger 
                className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border"
              >
                <SelectValue placeholder="Select intent" />
              </SelectTrigger>
              <SelectContent className="p-0 shadow-md border-border">
                <SelectGroup>
                  {["inform", "promote", "educate", "engage", "convert"].map((item) => (
                    <SelectItem 
                      key={item} 
                      value={item}
                      className="py-2 capitalize text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Target audience</Label>
            <Input 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Enter target audience"
              className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Tone</Label>
            <Select 
              value={tone}
              onValueChange={setTone}
            >
              <SelectTrigger 
                className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border"
              >
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent className="p-0 shadow-md border-border">
                <SelectGroup>
                  {["formal", "friendly", "casual", "professional", "enthusiastic"].map((item) => (
                    <SelectItem 
                      key={item} 
                      value={item}
                      className="py-2 capitalize text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                    >
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Additional remarks</Label>
            <Textarea 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter additional remarks"
              className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-for-later"
                checked={saveForLater}
                onCheckedChange={(checked) => setSaveForLater(checked as boolean)}
                className="data-[state=checked]:bg-[var(--color-navy)] data-[state=checked]:border-[var(--color-navy)] border-border"
              />
              <Label htmlFor="save-for-later" className="text-sm font-medium text-muted-foreground">
                Save this for later
              </Label>
            </div>
            
            {saveForLater && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Prompt template name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                  className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">Alright. Choose your setup style: step through questions for more detail, or use a saved template to get going:</p>
      
      {/* Radio buttons for selection mode */}
      <RadioGroup value={selectionMode} onValueChange={setSelectionMode} className="flex flex-row gap-6">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="questionaire" id="questionaire" className="border-[var(--color-navy)] text-[var(--color-navy)]" />
          <Label htmlFor="questionaire" className="text-sm font-medium text-foreground cursor-pointer">Fill questionaire</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="template" id="template" className="border-[var(--color-navy)] text-[var(--color-navy)]" />
          <Label htmlFor="template" className="text-sm font-medium text-foreground cursor-pointer">Use a saved template</Label>
        </div>
      </RadioGroup>
      
      <div className="space-y-4">
        {/* Show prompt template dropdown only when "Use a saved template" is selected */}
        {selectionMode === "template" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Prompt template</Label>
            {!showTemplateFields ? (
              <div className="flex items-center gap-2">
                <Select 
                  value={promptTemplate}
                  onValueChange={setPromptTemplate}
                >
                  <SelectTrigger 
                    className="flex-1 border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border"
                  >
                    <SelectValue placeholder="Select prompt template" />
                  </SelectTrigger>
                  <SelectContent className="p-0 shadow-md border-border">
                    <SelectGroup>
                      <SelectItem 
                        value="quirky-teenagers"
                        className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                      >
                        Quirky for teenagers
                      </SelectItem>
                      <SelectItem 
                        value="formal-seniors"
                        className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                      >
                        Formal seniors
                      </SelectItem>
                      <SelectItem 
                        value="global-neutral"
                        className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                      >
                        Global neutral audience
                      </SelectItem>
                      <SelectItem 
                        value="custom"
                        className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                      >
                        Custom
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateFields(true)}
                  className="h-9 w-9 p-0 border border-border hover:bg-muted hover:border-border"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <Select 
                value={promptTemplate}
                onValueChange={setPromptTemplate}
              >
                <SelectTrigger 
                  className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border"
                >
                  <SelectValue placeholder="Select prompt template" />
                </SelectTrigger>
                <SelectContent className="p-0 shadow-md border-border">
                  <SelectGroup>
                    <SelectItem 
                      value="quirky-teenagers"
                      className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                    >
                      Quirky for teenagers
                    </SelectItem>
                    <SelectItem 
                      value="formal-seniors"
                      className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                    >
                      Formal seniors
                    </SelectItem>
                    <SelectItem 
                      value="global-neutral"
                      className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                    >
                      Global neutral audience
                    </SelectItem>
                    <SelectItem 
                      value="custom"
                      className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                    >
                      Custom
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Show expanded fields when Edit button is clicked in template mode */}
        {selectionMode === "template" && showTemplateFields && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Target audience</Label>
              <Input 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Enter target audience" 
                className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Tone</Label>
              <Select 
                value={tone}
                onValueChange={setTone}
              >
                <SelectTrigger 
                  className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border"
                >
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent className="p-0 shadow-md border-border">
                  <SelectGroup>
                    {["formal", "friendly", "casual", "professional", "enthusiastic"].map((item) => (
                      <SelectItem 
                        key={item} 
                        value={item}
                        className="py-2 capitalize text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Additional remarks</Label>
              <Textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any specific requirements or preferences" 
                className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
              />
            </div>

            {/* Channel-specific accordions - same as questionnaire mode */}
            <div className="border rounded-lg overflow-hidden">
              <Accordion type="single" collapsible defaultValue="email" className="w-full">
                
                <AccordionItem value="email" className="border-b-0 last:border-0">
                  <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-surface-0">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center text-muted-foreground">
                        <Mail className="h-5 w-5" />
                      </span>
                      <span>Email</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-surface-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Additional remarks for Email</Label>
                        <Textarea 
                          value={emailRemarks}
                          onChange={(e) => setEmailRemarks(e.target.value)}
                          placeholder="Any specific requirements for email content" 
                          className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="whatsapp" className="border-b-0 last:border-0">
                  <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-surface-0">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-5 w-5" />
                      </span>
                      <span>WhatsApp</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-surface-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                        <Select value={whatsappCategory} onValueChange={setWhatsappCategory}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="marketing" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Marketing</SelectItem>
                              <SelectItem value="utility" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Utility</SelectItem>
                              <SelectItem value="authentication" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Authentication</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Layout</Label>
                        <Select value={whatsappLayout} onValueChange={setWhatsappLayout}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="rich-media" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Rich media</SelectItem>
                              <SelectItem value="text-only" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Text only</SelectItem>
                              <SelectItem value="location" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Location</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Language</Label>
                        <Select value={whatsappLanguage} onValueChange={setWhatsappLanguage}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="english-us" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English US</SelectItem>
                              <SelectItem value="english-uk" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English UK</SelectItem>
                              <SelectItem value="spanish" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Spanish</SelectItem>
                              <SelectItem value="french" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">French</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Personalization</Label>
                        <Input 
                          value={whatsappPersonalization}
                          onChange={(e) => setWhatsappPersonalization(e.target.value)}
                          placeholder="Enter personalization field" 
                          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Number of CTAs</Label>
                        <Select value={whatsappCTACount} onValueChange={setWhatsappCTACount}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select number of CTAs" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="1" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">1</SelectItem>
                              <SelectItem value="2" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">2</SelectItem>
                              <SelectItem value="3" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">3</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Additional remarks for WhatsApp</Label>
                        <Textarea 
                          value={whatsappRemarks}
                          onChange={(e) => setWhatsappRemarks(e.target.value)}
                          placeholder="Any specific requirements for WhatsApp content" 
                          className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="app-push" className="border-b-0 last:border-0">
                  <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-surface-0">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center text-muted-foreground">
                        <BellRing className="h-5 w-5" />
                      </span>
                      <span>App push</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-surface-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Layout</Label>
                        <Select value={appPushLayout} onValueChange={setAppPushLayout}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="overlay" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Overlay</SelectItem>
                              <SelectItem value="banner" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Banner</SelectItem>
                              <SelectItem value="modal" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Modal</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Language</Label>
                        <Select value={appPushLanguage} onValueChange={setAppPushLanguage}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="english-us" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English US</SelectItem>
                              <SelectItem value="english-uk" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English UK</SelectItem>
                              <SelectItem value="spanish" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Spanish</SelectItem>
                              <SelectItem value="french" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">French</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Personalization</Label>
                        <Input 
                          value={appPushPersonalization}
                          onChange={(e) => setAppPushPersonalization(e.target.value)}
                          placeholder="Enter personalization field" 
                          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Number of CTAs</Label>
                        <Select value={appPushCTACount} onValueChange={setAppPushCTACount}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select number of CTAs" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="1" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">1</SelectItem>
                              <SelectItem value="2" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">2</SelectItem>
                              <SelectItem value="3" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">3</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Additional remarks for App push</Label>
                        <Textarea 
                          value={appPushRemarks}
                          onChange={(e) => setAppPushRemarks(e.target.value)}
                          placeholder="Any specific requirements for App push content" 
                          className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>

            {/* Save as template section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="save-template-edit" 
                  checked={saveAsTemplate}
                  onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
                  className="data-[state=checked]:bg-[var(--color-navy)] data-[state=checked]:border-[var(--color-navy)] border-border"
                />
                <Label htmlFor="save-template-edit" className="text-sm font-medium text-foreground cursor-pointer">
                  Save this as a template
                </Label>
              </div>
              
              {saveAsTemplate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Prompt template name</Label>
                  <Input 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name" 
                    className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
                  />
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Show individual fields when "Fill questionaire" is selected */}
        {selectionMode === "questionaire" && (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Target audience</Label>
              <Input 
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Enter target audience" 
                className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Tone</Label>
              <Select 
                value={tone}
                onValueChange={setTone}
              >
                <SelectTrigger 
                  className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border"
                >
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent className="p-0 shadow-md border-border">
                  <SelectGroup>
                    {["formal", "friendly", "casual", "professional", "enthusiastic"].map((item) => (
                      <SelectItem 
                        key={item} 
                        value={item}
                        className="py-2 capitalize text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Additional remarks</Label>
              <Textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any specific requirements or preferences" 
                className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
              />
            </div>

            {/* Channel-specific accordions */}
            <div className="border rounded-lg overflow-hidden">
              <Accordion type="single" collapsible defaultValue="email" className="w-full">
                
                <AccordionItem value="email" className="border-b-0 last:border-0">
                  <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-surface-0">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center text-muted-foreground">
                        <Mail className="h-5 w-5" />
                      </span>
                      <span>Email</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-surface-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Additional remarks for Email</Label>
                        <Textarea 
                          value={emailRemarks}
                          onChange={(e) => setEmailRemarks(e.target.value)}
                          placeholder="Any specific requirements for email content" 
                          className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="whatsapp" className="border-b-0 last:border-0">
                  <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-surface-0">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-5 w-5" />
                      </span>
                      <span>WhatsApp</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-surface-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                        <Select value={whatsappCategory} onValueChange={setWhatsappCategory}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="marketing" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Marketing</SelectItem>
                              <SelectItem value="utility" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Utility</SelectItem>
                              <SelectItem value="authentication" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Authentication</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Layout</Label>
                        <Select value={whatsappLayout} onValueChange={setWhatsappLayout}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="rich-media" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Rich media</SelectItem>
                              <SelectItem value="text-only" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Text only</SelectItem>
                              <SelectItem value="location" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Location</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Language</Label>
                        <Select value={whatsappLanguage} onValueChange={setWhatsappLanguage}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="english-us" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English US</SelectItem>
                              <SelectItem value="english-uk" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English UK</SelectItem>
                              <SelectItem value="spanish" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Spanish</SelectItem>
                              <SelectItem value="french" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">French</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Personalization</Label>
                        <Input 
                          value={whatsappPersonalization}
                          onChange={(e) => setWhatsappPersonalization(e.target.value)}
                          placeholder="Enter personalization field" 
                          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Number of CTAs</Label>
                        <Select value={whatsappCTACount} onValueChange={setWhatsappCTACount}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select number of CTAs" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="1" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">1</SelectItem>
                              <SelectItem value="2" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">2</SelectItem>
                              <SelectItem value="3" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">3</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Additional remarks for WhatsApp</Label>
                        <Textarea 
                          value={whatsappRemarks}
                          onChange={(e) => setWhatsappRemarks(e.target.value)}
                          placeholder="Any specific requirements for WhatsApp content" 
                          className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="app-push" className="border-b-0 last:border-0">
                  <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-surface-0">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center text-muted-foreground">
                        <BellRing className="h-5 w-5" />
                      </span>
                      <span>App push</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 py-3 bg-surface-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Layout</Label>
                        <Select value={appPushLayout} onValueChange={setAppPushLayout}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select layout" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="overlay" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Overlay</SelectItem>
                              <SelectItem value="banner" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Banner</SelectItem>
                              <SelectItem value="modal" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Modal</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Language</Label>
                        <Select value={appPushLanguage} onValueChange={setAppPushLanguage}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="english-us" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English US</SelectItem>
                              <SelectItem value="english-uk" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">English UK</SelectItem>
                              <SelectItem value="spanish" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">Spanish</SelectItem>
                              <SelectItem value="french" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">French</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Personalization</Label>
                        <Input 
                          value={appPushPersonalization}
                          onChange={(e) => setAppPushPersonalization(e.target.value)}
                          placeholder="Enter personalization field" 
                          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Number of CTAs</Label>
                        <Select value={appPushCTACount} onValueChange={setAppPushCTACount}>
                          <SelectTrigger className="w-full border-border bg-background shadow-none focus:border-border focus:ring-0 hover:border-border">
                            <SelectValue placeholder="Select number of CTAs" />
                          </SelectTrigger>
                          <SelectContent className="p-0 shadow-md border-border">
                            <SelectGroup>
                              <SelectItem value="1" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">1</SelectItem>
                              <SelectItem value="2" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">2</SelectItem>
                              <SelectItem value="3" className="py-2 text-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-muted data-[state=checked]:text-foreground">3</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-muted-foreground">Additional remarks for App push</Label>
                        <Textarea 
                          value={appPushRemarks}
                          onChange={(e) => setAppPushRemarks(e.target.value)}
                          placeholder="Any specific requirements for App push content" 
                          className="border-border shadow-none resize-none min-h-[80px] focus:border-border focus:ring-0 hover:border-border"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>

            {/* Save as template section */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="save-template" 
                  checked={saveAsTemplate}
                  onCheckedChange={(checked) => setSaveAsTemplate(checked === true)}
                  className="data-[state=checked]:bg-[var(--color-navy)] data-[state=checked]:border-[var(--color-navy)] border-border"
                />
                <Label htmlFor="save-template" className="text-sm font-medium text-foreground cursor-pointer">
                  Save this as a template
                </Label>
              </div>
              
              {saveAsTemplate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Prompt template name</Label>
                  <Input 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name" 
                    className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 