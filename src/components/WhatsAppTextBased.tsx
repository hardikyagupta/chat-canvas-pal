import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EngagementScore } from '@/components/EngagementScore';

interface WhatsAppTextBasedProps {
  data?: {
    header: string;
    body: string;
    footer: string;
    cta1?: {
      buttonType: string;
      ctaText: string;
      websiteLink?: string;
      country?: string;
      phoneNumber?: string;
    };
    cta2?: {
      buttonType: string;
      ctaText: string;
      websiteLink?: string;
      country?: string;
      phoneNumber?: string;
    };
    cta3?: {
      buttonType: string;
      ctaText: string;
      websiteLink?: string;
      country?: string;
      phoneNumber?: string;
    };
  };
  onDataChange?: (data: any) => void;
}

export function WhatsAppTextBased({ data, onDataChange }: WhatsAppTextBasedProps) {
  const [openCtaPopover, setOpenCtaPopover] = useState<'cta1' | 'cta2' | 'cta3' | null>(null);
  
  const defaultData = {
    header: "💖 OMG Valentine's is HERE!! 💖",
    body: "Hey bestie!! 🥰 Can't even... our Valentine's collection is SO cute it's literally criminal!! 💅✨ Like, we're talking major heart-eyes vibes and your crush is def gonna notice 👀💖",
    footer: "P.S. Your bestie's gonna be JEALOUS 🤩",
    cta1: {
      buttonType: "Website",
      ctaText: "Shop Now! 🛍️",
      websiteLink: "https://example.com/shop-now"
    },
    cta2: {
      buttonType: "Website",
      ctaText: "Browse Collection 💫",
      websiteLink: "https://example.com/browse-collection"
    },
    cta3: {
      buttonType: "Website",
      ctaText: "Browse Collection 💫",
      websiteLink: ""
    }
  };

  const currentData = data || defaultData;

  const updateField = (field: string, value: any) => {
    const newData = { ...currentData, [field]: value };
    onDataChange?.(newData);
  };

  const updateCtaField = (ctaKey: 'cta1' | 'cta2' | 'cta3', field: string, value: string) => {
    const newData = { ...currentData };
    const cta = newData[ctaKey];
    if (cta) {
      (cta as any)[field] = value;
      
      if (field === 'buttonType') {
        if (value === 'Website') {
          (cta as any).country = undefined;
          (cta as any).phoneNumber = undefined;
          (cta as any).websiteLink = (cta as any).websiteLink || '';
        } else if (value === 'Call phone number') {
          (cta as any).websiteLink = undefined;
          (cta as any).country = (cta as any).country || '';
          (cta as any).phoneNumber = (cta as any).phoneNumber || '';
        }
      }
    }
    onDataChange?.(newData);
  };

  return (
    <div className="space-y-5 bg-white">
      <h3 className="text-sm font-medium text-foreground">Content agent suggests:</h3>
      
      {/* Header */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          Header
          <span className="text-red-500 text-xs">*</span>
        </Label>
        <Input
          value={currentData.header}
          onChange={(e) => updateField('header', e.target.value)}
          placeholder="Enter header text..."
          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          Body
          <span className="text-red-500 text-xs">*</span>
        </Label>
        <Textarea
          value={currentData.body}
          onChange={(e) => updateField('body', e.target.value)}
          placeholder="Enter body text..."
          className="border-border shadow-none resize-none min-h-[100px] focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
        />
      </div>

      {/* Footer */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          Footer
          <span className="text-red-500 text-xs">*</span>
        </Label>
        <Input
          value={currentData.footer}
          onChange={(e) => updateField('footer', e.target.value)}
          placeholder="Enter footer text..."
          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
        />
      </div>

      {/* CTAs */}
      <div className="space-y-4">
        {(['cta1', 'cta2', 'cta3'] as const).map((ctaKey, index) => {
          const cta = currentData[ctaKey];
          if (!cta) return null;
          
          return (
            <div key={ctaKey} className="space-y-3 p-3 border border-border rounded-lg bg-white dark:bg-gray-800/20">
              <Label className="text-sm font-medium text-foreground">
                CTA {index + 1}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {/* Button type */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Button type
                  </Label>
                  <Popover open={openCtaPopover === ctaKey} onOpenChange={(isOpen) => setOpenCtaPopover(isOpen ? ctaKey : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCtaPopover === ctaKey}
                        className="w-full justify-between border-border bg-gray-50 hover:bg-gray-50 hover:outline-slate-200 focus:bg-gray-50 focus:outline-slate-300 text-foreground hover:text-foreground text-xs dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
                      >
                        {cta.buttonType || "Select type..."}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border shadow-lg" align="start">
                      <div className="p-1">
                        {["Website", "Call phone number"].map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              updateCtaField(ctaKey, 'buttonType', option);
                              setOpenCtaPopover(null);
                            }}
                            className={cn(
                              "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                              cta.buttonType === option
                                ? "bg-[var(--color-royal-pale)]"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <span className="font-medium text-xs">{option}</span>
                            {cta.buttonType === option && (
                              <Check className="h-4 w-4 text-[var(--color-navy)]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* CTA text */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    CTA text
                  </Label>
                  <Input
                    value={cta.ctaText}
                    onChange={(e) => updateCtaField(ctaKey, 'ctaText', e.target.value)}
                    placeholder="Enter CTA text"
                    className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                  />
                </div>

                {/* Dynamic fields */}
                {cta.buttonType === "Website" && (
                  <div className="space-y-2 col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Website link
                    </Label>
                    <Input
                      value={cta.websiteLink || ''}
                      onChange={(e) => updateCtaField(ctaKey, 'websiteLink', e.target.value)}
                      placeholder="https://example.com"
                      className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                    />
                  </div>
                )}

                {cta.buttonType === "Call phone number" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Country
                      </Label>
                      <Input
                        value={(cta as any).country || ''}
                        onChange={(e) => updateCtaField(ctaKey, 'country', e.target.value)}
                        placeholder="+1"
                        className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Phone number
                      </Label>
                      <Input
                        value={(cta as any).phoneNumber || ''}
                        onChange={(e) => updateCtaField(ctaKey, 'phoneNumber', e.target.value)}
                        placeholder="800-555-0199"
                        className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Border separator */}
      <div className="border-t border-border my-2"></div>
      
      {/* Engagement Score */}
      <div className="w-full">
        <EngagementScore score={85} />
      </div>
    </div>
  );
}
