import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EngagementScore } from '@/components/EngagementScore';

interface CarouselItem {
  id: string;
  messageBubble: string;
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
  imageUrl: string;
}

interface WhatsAppCarouselBasedProps {
  data?: {
    items: CarouselItem[];
  };
  onDataChange?: (data: any) => void;
}

export function WhatsAppCarouselBased({ data, onDataChange }: WhatsAppCarouselBasedProps) {
  const [openCtaPopover, setOpenCtaPopover] = useState<{ itemId: string; ctaKey: string } | null>(null);
  const [activeCard, setActiveCard] = useState<string>("card1");
  
  const defaultData = {
    items: [
      {
        id: "card1",
        messageBubble: "Last Chance! End of Season Sale!",
        header: "💖 OMG Valentine's is HERE!! 💖",
        body: "Hey bestie!! 🥰 Can't even... our Valentine's collection is SO cute it's literally criminal!! 💅✨ Like, we're talking major heart-eyes vibes and your crush is def gonna notice 👀💖",
        footer: "P.S. Your bestie's gonna be JEALOUS 😘",
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
        imageUrl: "https://example.com/teen-deals-promo.jpg"
      },
      {
        id: "card2",
        messageBubble: "Special Offer!",
        header: "New Arrivals",
        body: "Check out our latest collection",
        footer: "Limited time offer",
        cta1: {
          buttonType: "Website",
          ctaText: "Shop Now",
          websiteLink: "https://example.com/shop"
        },
        cta2: {
          buttonType: "Website",
          ctaText: "Learn More",
          websiteLink: "https://example.com/learn"
        },
        imageUrl: "https://example.com/image2.jpg"
      },
      {
        id: "card3",
        messageBubble: "Flash Sale!",
        header: "Flash Sale",
        body: "Don't miss out on these deals",
        footer: "Ends soon",
        cta1: {
          buttonType: "Website",
          ctaText: "Shop Now",
          websiteLink: "https://example.com/shop"
        },
        cta2: {
          buttonType: "Website",
          ctaText: "Learn More",
          websiteLink: "https://example.com/learn"
        },
        imageUrl: "https://example.com/image3.jpg"
      },
      {
        id: "card4",
        messageBubble: "Final Days!",
        header: "Final Days",
        body: "Last chance to get these items",
        footer: "Hurry up!",
        cta1: {
          buttonType: "Website",
          ctaText: "Shop Now",
          websiteLink: "https://example.com/shop"
        },
        cta2: {
          buttonType: "Website",
          ctaText: "Learn More",
          websiteLink: "https://example.com/learn"
        },
        imageUrl: "https://example.com/image4.jpg"
      }
    ]
  };

  const currentData = data || defaultData;
  const activeItem = currentData.items.find(item => item.id === activeCard) || currentData.items[0];

  const updateItemField = (itemId: string, field: string, value: any) => {
    const newData = { ...currentData };
    const itemIndex = newData.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      newData.items[itemIndex] = { ...newData.items[itemIndex], [field]: value };
      onDataChange?.(newData);
    }
  };

  const updateItemCtaField = (itemId: string, ctaKey: 'cta1' | 'cta2', field: string, value: string) => {
    const newData = { ...currentData };
    const itemIndex = newData.items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      const cta = newData.items[itemIndex][ctaKey];
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
    }
  };

  return (
    <div className="w-full max-w-[873px] space-y-5 bg-white">
      {/* Content agent suggests and Card navigation */}
      <div className="w-56 flex flex-col justify-start items-start gap-3.5">
        <div className="self-stretch justify-start text-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Content agent suggests:</div>
        <div 
          className="self-stretch rounded-sm outline outline-[0.50px] outline-offset-[-0.50px] outline-slate-100 inline-flex justify-start items-center overflow-hidden"
          style={{
            width: '220px',
            height: '26px',
            border: '0.5px solid #F2F5F9',
            borderRadius: '2px',
            boxSizing: 'border-box'
          }}
        >
          {currentData.items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setActiveCard(item.id)}
              className={cn(
                "flex justify-center items-center cursor-pointer",
                activeCard === item.id 
                  ? "bg-[#143F93]" 
                  : "bg-white"
              )}
              style={{
                width: '55px',
                height: '26px',
                padding: '4px 8px',
                gap: '10px'
              }}
            >
              <div 
                className={cn(
                  "justify-start font-['Manrope']",
                  activeCard === item.id 
                    ? "text-white" 
                    : "text-[#64748B]"
                )}
                style={{
                  width: '39px',
                  height: '18px',
                  fontSize: '12px',
                  fontWeight: '600',
                  lineHeight: '18px',
                  letterSpacing: '0.42px',
                  fontStyle: 'normal'
                }}>
                Card {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form fields for active card */}
      <div className="self-stretch flex flex-col justify-start items-start gap-4">
        {/* Message bubble */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="flex flex-col justify-start items-start gap-1">
              <div className="justify-start">
                <span className="text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Message bubble </span>
                <span className="text-red-500 text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">*</span>
              </div>
            </div>
            <Input
              value={activeItem.messageBubble}
              onChange={(e) => updateItemField(activeCard, 'messageBubble', e.target.value)}
              placeholder="Enter message bubble text..."
              className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
            />
          </div>
        </div>

        {/* Header */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="flex flex-col justify-start items-start gap-1">
              <div className="justify-start">
                <span className="text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Header </span>
                <span className="text-red-500 text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">*</span>
              </div>
            </div>
            <Input
              value={activeItem.header}
              onChange={(e) => updateItemField(activeCard, 'header', e.target.value)}
              placeholder="Enter header text..."
              className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
            />
          </div>
        </div>

        {/* Body */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="flex flex-col justify-start items-start gap-1">
              <div className="justify-start">
                <span className="text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Body </span>
                <span className="text-red-500 text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">*</span>
              </div>
            </div>
            <Textarea
              value={activeItem.body}
              onChange={(e) => updateItemField(activeCard, 'body', e.target.value)}
              placeholder="Enter body text..."
              className="border-border shadow-none resize-none min-h-[100px] focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="self-stretch flex flex-col justify-start items-start gap-6">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <div className="flex flex-col justify-start items-start gap-1">
              <div className="justify-start">
                <span className="text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Footer </span>
                <span className="text-red-500 text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">*</span>
              </div>
            </div>
            <Input
              value={activeItem.footer}
              onChange={(e) => updateItemField(activeCard, 'footer', e.target.value)}
              placeholder="Enter footer text..."
              className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
            />
          </div>
        </div>

        {/* CTA 1 */}
        <div className="self-stretch p-4 bg-white dark:bg-gray-800/20 rounded border border-border flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch flex flex-col justify-start items-start gap-3.5">
            <div className="justify-start text-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">CTA 1</div>
            <div className="self-stretch inline-flex justify-start items-start gap-6">
              <div className="flex-1 inline-flex flex-col justify-start items-start gap-6">
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Button type</div>
                  </div>
                  <Popover open={openCtaPopover?.itemId === activeCard && openCtaPopover?.ctaKey === 'cta1'} onOpenChange={(isOpen) => setOpenCtaPopover(isOpen ? { itemId: activeCard, ctaKey: 'cta1' } : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCtaPopover?.itemId === activeCard && openCtaPopover?.ctaKey === 'cta1'}
                        className="w-full justify-between border-border bg-gray-50 hover:bg-gray-50 hover:outline-slate-200 focus:bg-gray-50 focus:outline-slate-300 text-foreground hover:text-foreground text-xs dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
                      >
                        {activeItem.cta1?.buttonType || "Select type..."}
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border shadow-lg" align="start">
                      <div className="p-1">
                        {["Website", "Call phone number"].map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              updateItemCtaField(activeCard, 'cta1', 'buttonType', option);
                              setOpenCtaPopover(null);
                            }}
                            className={cn(
                              "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                              activeItem.cta1?.buttonType === option
                                ? "bg-[#E7F0FF]"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <span className="font-medium text-xs">{option}</span>
                            {activeItem.cta1?.buttonType === option && (
                              <Check className="h-4 w-4 text-[#143F93]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex-1 inline-flex flex-col justify-start items-start gap-6">
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">CTA text </div>
                  </div>
                  <Input
                    value={activeItem.cta1?.ctaText || ''}
                    onChange={(e) => updateItemCtaField(activeCard, 'cta1', 'ctaText', e.target.value)}
                    placeholder="Enter CTA text"
                    className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                  />
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start gap-6">
              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                <div className="flex flex-col justify-start items-start gap-1">
                  <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Website link</div>
                </div>
                <Input
                  value={activeItem.cta1?.websiteLink || ''}
                  onChange={(e) => updateItemCtaField(activeCard, 'cta1', 'websiteLink', e.target.value)}
                  placeholder="https://example.com"
                  className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CTA 2 */}
        <div className="self-stretch p-4 bg-white dark:bg-gray-800/20 rounded border border-border flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch flex flex-col justify-start items-start gap-3.5">
            <div className="justify-start text-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">CTA 2</div>
            <div className="self-stretch inline-flex justify-start items-start gap-6">
              <div className="flex-1 inline-flex flex-col justify-start items-start gap-6">
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Button type</div>
                  </div>
                  <Popover open={openCtaPopover?.itemId === activeCard && openCtaPopover?.ctaKey === 'cta2'} onOpenChange={(isOpen) => setOpenCtaPopover(isOpen ? { itemId: activeCard, ctaKey: 'cta2' } : null)}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCtaPopover?.itemId === activeCard && openCtaPopover?.ctaKey === 'cta2'}
                        className="w-full justify-between border-border bg-gray-50 hover:bg-gray-50 hover:outline-slate-200 focus:bg-gray-50 focus:outline-slate-300 text-foreground hover:text-foreground text-xs dark:bg-gray-900/40 dark:hover:bg-gray-900/60"
                      >
                        {activeItem.cta2?.buttonType || "Select type..."}
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border shadow-lg" align="start">
                      <div className="p-1">
                        {["Website", "Call phone number"].map((option) => (
                          <div
                            key={option}
                            onClick={() => {
                              updateItemCtaField(activeCard, 'cta2', 'buttonType', option);
                              setOpenCtaPopover(null);
                            }}
                            className={cn(
                              "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                              activeItem.cta2?.buttonType === option
                                ? "bg-[#E7F0FF]"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <span className="font-medium text-xs">{option}</span>
                            {activeItem.cta2?.buttonType === option && (
                              <Check className="h-4 w-4 text-[#143F93]" />
                            )}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex-1 inline-flex flex-col justify-start items-start gap-6">
                <div className="self-stretch flex flex-col justify-start items-start gap-2">
                  <div className="flex flex-col justify-start items-start gap-1">
                    <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">CTA text </div>
                  </div>
                  <Input
                    value={activeItem.cta2?.ctaText || ''}
                    onChange={(e) => updateItemCtaField(activeCard, 'cta2', 'ctaText', e.target.value)}
                    placeholder="Enter CTA text"
                    className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                  />
                </div>
              </div>
            </div>
            <div className="self-stretch flex flex-col justify-start items-start gap-6">
              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                <div className="flex flex-col justify-start items-start gap-1">
                  <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Website link</div>
                </div>
                <Input
                  value={activeItem.cta2?.websiteLink || ''}
                  onChange={(e) => updateItemCtaField(activeCard, 'cta2', 'websiteLink', e.target.value)}
                  placeholder="https://example.com"
                  className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image URL */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="flex flex-col justify-start items-start gap-1">
            <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Image URL</div>
          </div>
          <Input
            value={activeItem.imageUrl}
            onChange={(e) => updateItemField(activeCard, 'imageUrl', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border text-xs bg-gray-50 dark:bg-gray-900/40"
          />
        </div>

        {/* Image Preview */}
        <div className="self-stretch flex flex-col justify-start items-start gap-2">
          <div className="flex flex-col justify-start items-start gap-1">
            <div className="justify-start text-muted-foreground text-sm font-semibold font-['Manrope'] leading-tight tracking-wide">Image Preview</div>
          </div>
          <img 
            className="w-72 h-40 object-cover rounded" 
            src={activeItem.imageUrl || "https://placehold.co/290x153"} 
            alt="Preview"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/290x153";
            }}
          />
        </div>
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
