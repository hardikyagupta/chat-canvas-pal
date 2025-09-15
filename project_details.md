# Project Details for Netcore Multi-agent

This document provides a high-level overview of the project's file structure and the purpose of key files and directories. It is intended to help LLMs and developers quickly understand where to find specific code or make changes.

## Root Directory

- **`.DS_Store`**: macOS specific file, can be ignored.
- **`.gitignore`**: Specifies intentionally untracked files that Git should ignore.
- **`bun.lockb`**: Lockfile for `bun` package manager, ensuring reproducible installs.
- **`components.json`**: Configuration for `shadcn/ui` components.
- **`eslint.config.js`**: Configuration for ESLint, a code linter for JavaScript/TypeScript.
- **`index.html`**: The main HTML entry point for the application (likely for a Vite setup).
- **`package-lock.json`**: Lockfile for `npm` package manager, ensuring reproducible installs.
- **`package.json`**: Defines project metadata, scripts, and dependencies.
- **`postcss.config.js`**: Configuration for PostCSS, a tool for transforming CSS with JavaScript.
- **`README.md`**: Provides general information about the project.
- **`tailwind.config.ts`**: Configuration file for Tailwind CSS.
- **`tsconfig.app.json`**: TypeScript configuration specific to the application code.
- **`tsconfig.json`**: Root TypeScript configuration for the project.
- **`tsconfig.node.json`**: TypeScript configuration for Node.js specific parts (e.g., build scripts).
- **`vite.config.ts`**: Configuration file for Vite, a fast frontend build tool.

## `app/` Directory (Likely Next.js App Router)

- **`layout.tsx`**: Defines the root layout for the Next.js application. This is likely the new Next.js app directory `layout.tsx`.

## `components/` Directory (Root level)

- **`theme-provider.tsx`**: Component for managing and providing theme (e.g., light/dark mode) to the application.

## `public/` Directory

Contains static assets that are served directly.
- **`lovable-uploads/`**: Contains user-uploaded image files.
- Image files (e.g., `gif1frameavatar.png`, `avatarGIF.gif`, `background.png`, `user-avatar.png`, `placeholder.svg`).
- **`robots.txt`**: Instructions for web crawlers.
- **`favicon.ico`**: Favicon for the website.

## `src/` Directory

This is the main source code directory.

### `src/app/` (Likely main application source for Vite, or another Next.js app dir)

- **`page.tsx`**: Represents the main page content for a route (likely the root page `/`). This seems like a Next.js app directory page.
- **`layout.tsx`**: Defines the layout for this specific part of the application. This seems like a Next.js app directory layout.
- **`globals.css`**: Global CSS styles for the application.

### `src/components/`

Contains reusable UI components.
- **`ChatInterface.tsx`**: Core component for the chat UI. Features both Collaborative and Autonomous modes with mode switching functionality. Includes comprehensive mock workflows for both modes, with Autonomous mode supporting end-to-end campaign creation without user interruption. Supports mode switching confirmation popup to preserve user conversations. **Dev Mode Integration**: Features developer options panel in the Chat history sidebar with animation control toggle and code-like styling (`<dev_options>`) for easy identification during development.
- **`ChatMessage.tsx`**: Component for displaying individual chat messages.
- **`ContentAgentClarification.tsx`**: Enhanced component for gathering user input to clarify content generation requirements. Features prompt templates system with pre-configured options (Quirky for teenagers, Formal seniors, Global neutral audience, Custom) that auto-fill Intent, Target audience, Tone, and Additional remarks fields. Includes conditional UI showing/hiding advanced fields with a "Modify" button for preset templates, and immediate field access for custom templates.
- **`ContentAgentResponse.tsx`**: Component for displaying generated content including subject lines for emails. **Autonomous Mode Refinements**: Features distinct content structures for Collaborative vs Autonomous modes. In Autonomous mode, removed template selection UI from Email accordion and "Content agent suggests:" labels from all accordions for streamlined UX. Updated segment selection labels to "Preview content for segment:" for better user guidance. **Collaborative Mode Stability**: Fixed critical rendering issues in collaborative mode by removing complex React components with hooks and undefined object references that were causing modal crashes. **Template Thumbnail Preview (Latest)**: Added visual thumbnail previews for existing templates in collaborative mode email accordion. When users select pre-existing templates (e.g., "Winter Sale Template"), a seasonal-themed thumbnail appears below the dropdown showing template preview with matching size to recommended template thumbnails. Features complete thumbnail data for all 8 existing templates with appropriate icons, gradients, and seasonal themes. Thumbnails are display-only and automatically hide when recommended templates are selected.
- **`ContentAgentRationale.tsx`**: **NEW COMPONENT** - Displays content agent's reasoning and rationale for content generation decisions. Features "Continue" button that triggers the next step in the collaborative workflow. Includes proper error handling and state management integration with ChatInterface message flow.
- **`ModeSwitchConfirmation.tsx`**: Modal component for confirming mode switches between Collaborative and Autonomous modes. Displays user-friendly confirmation dialog with proper spacing (32px padding, 16px title-to-content gap, 32px content-to-buttons gap). Follows Figma design specifications with custom styling, proper z-index layering, and reassuring messaging about conversation preservation.
- **`MarketingAgentsOverlay.tsx`**: UI component likely related to displaying marketing agent information or an overlay.
- **`AvatarStack.tsx`**: Component for displaying a stack of avatars.
- **`SystemMessage.tsx`**: Component for displaying system-generated messages in the chat.
- **`ChatInput.tsx`**: Component for the chat input field and related controls.

#### `src/components/ui/`

Likely contains `shadcn/ui` components or custom UI primitives.
- **`accordion.tsx`**: Accordion component.
- **`alert-dialog.tsx`**: Alert dialog component.
- **`alert.tsx`**: Alert message component.
- **`aspect-ratio.tsx`**: Component for maintaining aspect ratio.
- **`avatar.tsx`**: Avatar display component.
- **`badge.tsx`**: Badge component.
- **`breadcrumb.tsx`**: Breadcrumb navigation component.
- **`button.tsx`**: Button component.
- **`calendar.tsx`**: Calendar component.
- **`card.tsx`**: Card component.
- **`carousel.tsx`**: Image or content carousel component.
- **`chart.tsx`**: Charting component.
- **`checkbox.tsx`**: Checkbox component.
- **`collapsible.tsx`**: Collapsible content component.
- **`command.tsx`**: Command palette or search component.
- **`context-menu.tsx`**: Context menu component.
- **`dialog.tsx`**: Dialog or modal component.
- **`drawer.tsx`**: Drawer (slide-out panel) component.
- **`dropdown-menu.tsx`**: Dropdown menu component.
- **`form.tsx`**: Components and utilities for building forms.
- **`hover-card.tsx`**: Card that appears on hover.
- **`input-otp.tsx`**: Input field for one-time passwords.
- **`input.tsx`**: Standard input field component.
- **`label.tsx`**: Label component for form elements.
- **`menubar.tsx`**: Menu bar component.
- **`navigation-menu.tsx`**: Navigation menu component.
- **`pagination.tsx`**: Pagination component.
- **`popover.tsx`**: Popover component.
- **`progress.tsx`**: Progress bar component.
- **`radio-group.tsx`**: Radio button group component.
- **`resizable.tsx`**: Component for creating resizable panels/elements.
- **`scroll-area.tsx`**: Scrollable area component.
- **`select.tsx`**: Select dropdown component.
- **`separator.tsx`**: Visual separator component.
- **`sheet.tsx`**: Sheet (bottom/side panel) component.
- **`sidebar.tsx`**: Sidebar component.
- **`skeleton.tsx`**: Skeleton loading placeholder component.
- **`slider.tsx`**: Slider component.
- **`sonner.tsx`**: Toast notification component (likely from Sonner library).
- **`switch.tsx`**: Switch toggle component.
- **`table.tsx`**: Table component.
- **`tabs.tsx`**: Tabs component.
- **`textarea.tsx`**: Textarea input component.
- **`toast.tsx`**: Toast notification display component.
- **`toaster.tsx`**: Container for displaying toasts.
- **`toggle-group.tsx`**: Group of toggle buttons.
- **`toggle.tsx`**: Toggle button component.
- **`tooltip.tsx`**: Tooltip component.
- **`use-toast.ts`**: Hook for triggering toast notifications.

### `src/data/`

Contains static data or data-fetching logic.
- **`agents.ts`**: Likely contains data or definitions related to "agents" (e.g., AI agents, user roles).

### `src/hooks/`

Contains custom React hooks.
- **`use-mobile.tsx`**: Hook to detect if the application is being viewed on a mobile device.
- **`use-toast.ts`**: Another hook for toast notifications, potentially a different implementation or extension of the one in `src/components/ui/`.

### `src/lib/`

Contains utility functions and helper modules.
- **`utils.ts`**: General utility functions for the application.

### `src/pages/` (Likely for a Vite/React SPA setup, or older Next.js pages router)

Contains page components if not using Next.js App Router exclusively.
- **`Index.tsx`**: Main entry page for a section or the entire app if not using `src/app/page.tsx` as the primary.
- **`NotFound.tsx`**: Component for the 404 Not Found page.

### Other `src/` files

- **`index.css`**: Global CSS styles or entry point for CSS.
- **`main.tsx`**: Main entry point for the React application (typical for Vite).
- **`vite-env.d.ts`**: TypeScript definitions for Vite environment variables.
- **`App.css`**: CSS specific to the main `App` component.
- **`App.tsx`**: Root React component of the application, often sets up routing and global providers.

## Ambiguities and Potential Structure Notes:

- The project appears to be a React application, likely built with Vite or Next.js.
- There's a mix of files that suggest both Vite (`index.html`, `src/main.tsx`, `vite.config.ts`) and Next.js App Router (`app/layout.tsx`, `src/app/page.tsx`, `src/app/layout.tsx`). It's possible it's a Next.js project where `index.html` and `vite.config.ts` might be remnants or used for a specific part like Storybook.
    - The `app/` directory at the root and `src/app/` suggest Next.js App Router.
    - The `src/pages/` directory suggests either a Vite + React Router setup or an older Next.js `pages` directory.
- The `components/` directory at the root and `src/components/` serve similar purposes. It's common to have one primary components directory, often `src/components/`.
- `src/hooks/use-toast.ts` and `src/components/ui/use-toast.ts` seem duplicative or serve slightly different purposes.

## Recent Updates

### Autonomous Mode Implementation (Latest Session)
- **Autonomous Workflow**: Implemented complete autonomous mode flow based on `public/Autonomous Workflow.txt` specifications
- **Mode Switching**: Added seamless mode switching between Collaborative and Autonomous modes with user confirmation
- **Text Formatting**: Fixed bold text rendering issues by replacing markdown `**bold**` with HTML `<strong>bold</strong>` tags throughout autonomous workflow
- **UI Components**: 
  - Created `ModeSwitchConfirmation.tsx` modal component with exact Figma specifications
  - Implemented z-index layering (`z-[60]`) to ensure popup visibility over main interface
  - Added proper spacing: 32px padding, 16px title-to-content gap, 32px content-to-buttons gap
- **User Experience**: 
  - Added confirmation dialog to prevent accidental mode switches
  - Implemented conversation preservation messaging for user reassurance
  - Used user-friendly language ("conversation" instead of "session")
  - Added autonomous mode trigger: "Can you help me create a valentine's day campaign for perfumes"
- **State Management**: Enhanced ChatInterface with autonomous workflow state tracking and mode switching logic

### Key Features Added:
1. **Autonomous Mode**: Complete end-to-end campaign creation without user interruption
2. **Mode Toggle**: Tab-style mode switching in expanded view header with tooltips
3. **Confirmation Dialog**: Modal popup preventing accidental conversation loss
4. **Workflow Integration**: Both modes support comprehensive mock agent interactions
5. **Visual Polish**: Proper text formatting and user-friendly messaging

### Developer Tools & UX Refinements (Current Session)
- **Dev Mode Options Panel**: 
  - Added developer options in Chat history sidebar with `<dev_options>` code-like styling
  - "Disable Animation" toggle to instantly load messages without typing animation
  - "Disable content accordion" toggle to control old accordion message visibility (enabled by default)
  - Toggle button with Settings2 icon for easy access
  - Bottom-aligned positioning in sidebar for non-intrusive placement
  - State management integration with props passed to ChatMessage components
  
- **Autonomous Mode Content Improvements**:
  - **Email Accordion**: Removed template selection UI (thumbnails, dropdowns) for cleaner autonomous flow
  - **All Accordions**: Removed "Content agent suggests:" labels to reduce visual clutter
  - **Segment Labels**: Updated from "Select segment:" to "Preview content for segment:" for better UX clarity
  - **Mode Isolation**: Ensured collaborative mode functionality remains unchanged
  
- **Animation Control System**:
  - Global animation toggle affects all ChatMessage components
  - Preserves existing animation logic while allowing instant disable
  - Default state: animations enabled (existing behavior maintained)

### Segment Accordion Implementation (Latest Updates)
- **ContentAgentSegmentAccordions.tsx**: New component featuring segment-based communication templates
  - 5 segments: Premium Perfume Enthusiasts, Recent Beauty Browsers, Loyal Beauty Shoppers, High Intent New Customers, Welcome Premium Segment
  - Each segment contains Email (subject), App Push (title/message/CTA), and WhatsApp (header/body/footer/CTA1/CTA2) content
  - Figma-accurate styling with exact dimensions (26px height, 5px padding, 2px gap) and colors
  - Interactive accordions with hover effects and chevron icons
  - First segment open by default for better UX
  - Enhanced typography hierarchy with font weights for better readability

- **Smart Copy Functionality**: 
  - Copy button functionality specific to segment accordion messages
  - Copies all segment content in expanded format with proper formatting
  - Includes separators between segments for readability
  - Maintains existing copy functionality for regular messages

- **Content Control Toggle**:
  - "Disable content accordion" toggle in dev options (enabled by default)
  - When enabled: hides old accordion-based content agent response
  - When disabled: shows both old and new segment accordion messages
  - Works in both autonomous and collaborative modes
  - Allows comparison between old and new message formats

### Collaborative Mode Enhancements & Bug Fixes (June 19, 2025)
- **Critical Bug Resolution**: Fixed modal crash issue in collaborative mode when clicking "Continue" on Content Agent Rationale
  - **Root Cause**: Complex React components with hooks and undefined object references in ContentAgentResponse.tsx
  - **Solution**: Removed problematic `customApnContent` and `collaborativeApnData` objects that were causing rendering errors
  - **Impact**: Collaborative mode now functions reliably without modal crashes

- **Scheduler Agent Response Parity**: 
  - Updated collaborative mode scheduler response to match autonomous mode detail level
  - Added comprehensive campaign information with segment IDs, user counts, STO settings, timing windows, and Push TTL configurations
  - Aligned segment data with collaborative mode segments (Affinity_based_segment, High_AOV_segment, Seasonal_buyers, Loyalty_program_members)
  - Maintained proper segment ID mapping (101-104) and realistic user counts

- **Content Agent Rationale Integration**:
  - Created `ContentAgentRationale.tsx` component for displaying content generation reasoning
  - Implemented proper "Continue" button functionality with error handling
  - Fixed message flow continuation from rationale to content response
  - Added robust state management integration with ChatInterface

- **App Push Content Improvements**:
  - Initially attempted to add collaborative mode-specific App Push content with segment dropdowns
  - Reverted to simple fallback content to prevent component crashes
  - Maintained autonomous mode functionality while ensuring collaborative mode stability

- **Error Handling & Debugging**:
  - Added comprehensive error handling in message flow continuation
  - Implemented proper React component lifecycle management
  - Fixed undefined object references and missing imports
  - Enhanced component stability through simplified content structures

- **Message Flow Optimization**:
  - Restored original `addNextMockMessage` flow after fixing component issues
  - Maintained proper message sequencing in collaborative mode
  - Ensured consistent behavior between autonomous and collaborative modes
  - Added proper animation completion handlers

### Technical Debt Reduction (June 19, 2025)
- **Component Simplification**: Removed overly complex React components that were causing instability
- **State Management**: Streamlined state variables and removed unused collaborative mode data structures
- **Import Cleanup**: Ensured all required imports are present and unused imports are removed
- **Error Prevention**: Implemented defensive programming practices to prevent similar crashes
- **Code Maintainability**: Simplified component logic for easier debugging and maintenance

### Agent Avatar System Overhaul (June 23, 2025)
- **New SVG Avatar System**: Completely replaced agent avatars throughout the application
  - **AgentIcons Integration**: Added support for new SVG icons from `public/AgentIcons/` folder
  - **Avatar Priority System**: Implemented cascading fallback system (SVG → Lucide Icon → GIF/Initials)
  - **Co-marketer GIF Replacement**: Replaced animated GIF with new Co-Marketer.svg for consistent branding
  - **Universal Coverage**: Updated avatars in all components:
    - Chat conversations (ChatMessage.tsx)
    - Agent sidebar (ChatInterface.tsx)
    - Avatar stacks (AvatarStack.tsx) 
    - Marketing agents overlay (MarketingAgentsOverlay.tsx)
    - Chat input suggestions (ChatInput.tsx)
    - Widget header and default message display

- **Data Structure Enhancement**: 
  - Added `avatarSrc` property to `MarketingAgent` interface in `agents.ts`
  - Mapped all agents to corresponding SVG files:
    - Co-Marketer.svg → co-marketer
    - Content-agent.svg → content-agent
    - Insight-agent.svg → insight-agent
    - Scheduler-agent.svg → scheduler-agent
    - Segment-agent.svg → segment-agent

- **Backward Compatibility**: Maintained existing Lucide icons as fallbacks ensuring no breaking changes

### Executive Summary Content Enhancement (June 23, 2025)
- **ExecutiveSummaryContentAccordion.tsx**: New component for Co-marketer's final report in autonomous mode
  - **Single "View content" Accordion**: Clean, intuitive interface showing all segment content when expanded
  - **Complete Content Display**: Shows Email, Push, and WhatsApp content for all 5 segments:
    - Premium Perfume Enthusiasts
    - Recent Beauty Browsers  
    - Loyal Beauty Shoppers
    - High Intent New Customers
    - Welcome Premium Segment
  - **Professional Layout**: Organized presentation with segment titles, borders, and proper spacing

- **Integration Points**:
  - **ChatMessage.tsx**: Added `isExecutiveSummaryWithContent` prop and conditional rendering logic
  - **ChatInterface.tsx**: Extended `ChatMessageData` interface and message creation logic
  - **Autonomous Mode Only**: Accordion appears exclusively in Co-marketer's final executive summary response

- **User Experience**: 
  - **Strategic Placement**: Positioned after the "Conclusion" section in the executive summary
  - **Complete Campaign View**: Users can access all segment-specific content details from the summary
  - **Consistent Design**: Matches existing ContentAgentSegmentAccordions styling and behavior

### Technical Implementation Details (June 23, 2025)
- **TypeScript Integration**: Proper interface extensions and type safety throughout
- **Component Architecture**: Modular design with clear separation of concerns
- **State Management**: Seamless integration with existing message flow system
- **Performance Optimization**: Efficient rendering with conditional logic and proper React patterns

### Collaborative Mode Segment Dropdown Implementation (July 15, 2025)
- **ContentAgentResponse.tsx**: Added unified segment dropdown for collaborative mode (Execute mode)
  - **Positioning**: Dropdown positioned outside and above the three accordions (Email, APN, WhatsApp)
  - **Unified Control**: Single dropdown controls content across all three communication channels simultaneously
  - **4 Collaborative Segments**: Affinity Based Segment, High AOV Segment, Seasonal Buyers, Loyalty Program Members
  - **Segment-Specific Content**: Each segment has tailored content for Email subjects, App Push titles/messages/CTAs, and WhatsApp headers/body/footer/CTAs
  - **Mode-Specific Implementation**: Only appears in collaborative mode (isPlanMode = false), preserving autonomous mode functionality

- **User Experience Enhancements**:
  - **Email Subject Field**: Converted static "Proposed subject line" text to editable Input field matching APN field styling
  - **WhatsApp Card Selection**: Fixed active tab styling to show proper blue color (#143F93) in collaborative mode
  - **Dropdown Styling**: Updated segment dropdown selected state from blue to grey background for consistency
  - **Label Clarity**: Changed dropdown label from "Select segment:" to "View content for segment:" for better UX

- **Data Structure & State Management**:
  - **collaborativeContentData**: Added comprehensive content data structure for all segments and channels
  - **selectedCollaborativeSegment**: New state variable for segment selection in collaborative mode
  - **collaborativeContentDataState**: State management for editable content updates
  - **Segment Integration**: Proper TypeScript interfaces and state synchronization across all form fields

- **Technical Implementation**:
  - **Conditional Rendering**: Clean separation between autonomous mode (individual dropdowns) and collaborative mode (unified dropdown)
  - **State Synchronization**: Real-time content updates across all accordions when segment changes
  - **Component Consistency**: Maintained existing functionality while adding new features
  - **Error Prevention**: Proper handling of state updates and component lifecycle management

### Template Thumbnail Preview Enhancement (Current Session)
- **ContentAgentResponse.tsx**: Added visual thumbnail previews for existing templates in collaborative mode email accordion
  - **Template Thumbnail Data**: Created seasonal-themed thumbnail data for all 8 existing templates:
    - Winter Sale Template: ❄️ with blue/slate gradient
    - New Year Special: 🎉 with yellow/amber gradient
    - Valentine's Day Promotion: 💕 with rose/pink gradient
    - Spring Collection: 🌸 with green/emerald gradient
    - Summer Flash Sale: ☀️ with orange/yellow gradient
    - Back to School: 📚 with indigo/blue gradient
    - Black Friday Deals: 🖤 with gray/slate gradient
    - Cyber Monday Offers: 💻 with purple/indigo gradient

- **User Experience Enhancement**:
  - **Visual Confirmation**: When users select pre-existing templates, matching thumbnails appear below dropdown
  - **Consistent Sizing**: Thumbnails match the exact size of recommended template thumbnails using grid layout
  - **Smart Toggle**: Thumbnails automatically hide when recommended templates are selected
  - **Display-Only**: Thumbnails are non-interactive, serving as visual preview only

- **Technical Implementation**:
  - **existingTemplateThumbnails**: New data structure with seasonal themes and visual elements
  - **Conditional Rendering**: Thumbnail visibility based on selectedExistingTemplate state
  - **Grid Layout**: Uses same `grid grid-cols-3 gap-4` structure as recommended templates
  - **Consistent Styling**: Matches visual design pattern of existing thumbnail components

### Continue Button UI/UX Improvements (Current Session)
- **Positioning Enhancement**: Moved Continue buttons from inline to next line in rationale components
  - **Components Updated**: ContentAgentRationale.tsx and SegmentAgentRationale.tsx
  - **Consistency**: Buttons now appear at same position regardless of rationale text length
  - **User Experience**: Eliminates button position jumping between different message lengths
  
- **Dark Mode Legibility Enhancement**: Improved Continue button visibility and styling across themes
  - **Light Mode Preservation**: Maintained original blue styling (`text-blue-700`, `hover:bg-blue-100`)
  - **Dark Mode Default**: Uses theme-aware muted text (`dark:text-muted-foreground`) for better contrast
  - **Dark Mode Hover**: Text color matches Execute tab blue (`dark:hover:text-blue-400`) for visual consistency
  - **Background Hover**: Consistent muted background (`dark:hover:bg-muted`) across both themes

- **Segment Agent Specific Enhancements**: Additional styling improvements for Segment Agent Continue button only
  - **Border Addition**: Added theme-aware border outline for improved definition and legibility
    - Light mode: `border-blue-200` (subtle blue border complementing text color)
    - Dark mode: `dark:border-muted-foreground/30` (muted border with 30% opacity)
  - **Enhanced Dark Mode Text**: Changed default text from muted to white (`dark:text-white`) for maximum contrast
  - **Component Isolation**: Enhancements applied only to SegmentAgentRationale.tsx, ContentAgentRationale.tsx unchanged
  
- **Technical Implementation**:
  - **Conditional Styling**: Uses Tailwind's `dark:` prefix for theme-specific styles
  - **Visual Cohesion**: Aligns Continue button hover state with existing Execute/Plan tab styling
  - **Component-Specific Styling**: Selective enhancement allowing different visual treatments per component
  - **Non-Breaking**: Preserves all existing functionality while enhancing visual design

### Interactive Content Agent Question Flow (August 22, 2025)
- **ContentAgentQuestionChoice.tsx**: New component creating an interactive pre-clarification step
  - **Two-Path Flow**: Users can choose between answering detailed questions or skipping to quick generation
  - **Primary CTA**: "ANSWER QUESTIONS" (blue filled button with darker hover state)
  - **Secondary CTA**: "SKIP AND GENERATE" (blue outline with white background for visibility)
  - **Button Positioning**: CTAs positioned outside message box similar to "Generate Content" button
  - **Message Text**: "Great! Now onto content. How would you like to continue: answer a few detailed questions for more tailored content, or skip and get a quick draft?"

- **Enhanced ContentAgentClarification.tsx**: Major overhaul with radio button selection and channel-specific accordions
  - **Radio Button Selection**: Horizontal layout with "Fill questionaire" and "Use a saved template" options
    - **Default Selection**: "Fill questionaire" selected by default
    - **Theme-Aware Styling**: Blue radio buttons in light mode, white in dark mode
    - **Updated Message**: "Alright. Choose your setup style: step through questions for more detail, or use a saved template to get going:"
  
  - **Streamlined Questionaire Fields**: Reduced to essential fields only
    - **Target audience**: Text input field
    - **Tone**: Dropdown with proper hover/focus/checked states
    - **Additional remarks**: Textarea field
    - **Removed**: Intent field for cleaner UX

  - **Channel-Specific Accordions**: Email, WhatsApp, and App Push accordions matching ContentAgentResponse styling
    - **Email Accordion**: Additional remarks field only
    - **WhatsApp Accordion**: Category (Marketing), Layout (Rich media), Language (English US), Personalization (First name), Number of CTAs (2), Additional remarks (pre-filled with "Content style should be quirky and funny")
    - **App Push Accordion**: Layout (Overlay), Language (English US), Personalization (First name), Number of CTAs (2), Additional remarks (pre-filled with "Content style should be quirky and funny")
    - **Consistent Styling**: All dropdowns use proper hover/focus/checked states to match Tone dropdown
    - **Default Values**: All fields pre-populated with appropriate defaults as specified

  - **Save as Template Feature**: New functionality for template creation
    - **Checkbox**: "Save this as a template" positioned below accordions
    - **Conditional Field**: "Prompt template name" input appears when checkbox is checked
    - **State Management**: Proper handling of template saving preferences

- **Message Flow Integration**: Seamless integration with existing collaborative mode workflow
  - **Question Choice → Clarification**: "Answer Questions" leads to enhanced clarification form
  - **Question Choice → Rationale**: "Skip and Generate" jumps directly to content rationale
  - **Flow Control**: Proper message sequencing with animation and user input handling
  - **Backward Compatibility**: All existing functionality preserved

- **Styling Consistency Improvements**: Applied consistent styling patterns across all components
  - **Primary Button Hover States**: All primary CTAs now use darker hover colors (`hover:bg-[#0f2d70]` instead of lighter variants)
  - **Secondary Button Enhancement**: Added white background to outline buttons for better visibility in both light and dark themes
  - **Dropdown Consistency**: Fixed accordion dropdown styling to match main form dropdowns
  - **Radio Button Theming**: Blue for light mode, white for dark mode with proper contrast

- **Technical Implementation Details**:
  - **New Interface Properties**: Added `isContentAgentQuestionChoice`, `onAnswerQuestions`, `onSkipAndGenerate` to ChatMessageData
  - **State Management**: Enhanced with radio button selection, accordion field states, and template saving preferences
  - **Component Architecture**: Modular design with clear separation between question choice and clarification phases
  - **Animation Integration**: Proper flow control with animation completion handlers and user input waiting states
  - **Error Handling**: Comprehensive TypeScript integration with proper type safety throughout

### Edit-and-Update Workflow Feature (July 15, 2025)
- **ContentAgentResponse.tsx**: Implemented a comprehensive edit-and-update workflow for content editing in execute mode
  - **Smart Button Behavior**: When users edit any field across the 3 accordions (Email, App Push, WhatsApp), the "APPROVE CONTENT" button automatically disappears and is replaced by two new action buttons:
    - **"UPDATE AND CONTINUE"** (primary blue button): Saves user changes and continues the workflow
    - **"DISCARD CHANGES"** (secondary left button): Resets all fields to original values and restores "APPROVE CONTENT" button
  - **Change Detection System**: Intelligent tracking that detects when users modify any content field and automatically switches the interface
  - **Original Values Tracking**: System remembers the original content so users can always revert their changes

- **New Message Flow Integration**:
  - **Update and Continue**: When clicked, creates a new Content Agent message that displays the user's actual changes
  - **Content Preservation**: New messages show specific details of what the user modified (e.g., "Updated email subject to: 'New Subject'")
  - **Workflow Continuation**: Mock flow only continues when "APPROVE CONTENT" is clicked on any response (original or updated)

- **User Experience Improvements**:
  - **Theme-Aware Hover States**: Fixed "Discard Changes" button to use proper hover effects that work in both light and dark themes
  - **Clean Visual Design**: Removed shadow artifacts between buttons for a cleaner appearance
  - **Intuitive Interface**: Users can easily experiment with content changes knowing they can always revert or save their work

- **Technical Implementation**:
  - **Deep State Cloning**: Proper deep cloning system for Email and App Push content to ensure accurate change detection
  - **TypeScript Integration**: Full type safety with proper interfaces and error handling
  - **Component Architecture**: Modular design with clear separation between original content tracking and user modifications
  - **State Management**: Robust state management system that handles complex content updates across multiple form fields

- **Quality Assurance**:
  - **Cross-Field Detection**: Change detection works reliably across all content types (Email subjects, App Push titles/messages, WhatsApp content)
  - **Error Prevention**: Comprehensive error handling and TypeScript compliance
  - **User Testing**: Verified functionality works smoothly without breaking existing features

### Prompt Template Management Enhancement (July 16, 2025)
- **New Dev Toggle**: Added "Prompt Template Exists" toggle in dev_options panel
  - **Location**: Left sidebar → Chat history → dev_options (bottom section)
  - **Label**: "Prompt Template Exists"
  - **Subtext**: "Enabling this shows pre-made prompt templates in content agent response"
  - **Default State**: ON/true (preserves existing experience)
  - **Scope**: Only affects Execute mode (collaborative mode), Plan mode unaffected

- **ContentAgentClarification.tsx Enhancement**:
  - **Conditional UI**: Toggle controls first Content Agent message (clarification phase)
  - **When Toggle ON**: Shows existing template selection UI with dropdown options
  - **When Toggle OFF**: Shows alternative UI for new users/scenarios without existing templates:
    - **Intent dropdown**: Options (Inform, Promote, Educate, Engage, Convert) - pre-selected "Promote"
    - **Target audience field**: Text input - pre-filled "Beauty enthusiasts and fragrance lovers aged 25-40"
    - **Tone dropdown**: Options (Formal, Friendly, Casual, Professional, Enthusiastic) - pre-selected "Enthusiastic"
    - **Additional remarks textarea**: Pre-filled with campaign-specific guidance
    - **"Save this for later" checkbox**: Checked by default
    - **"Prompt template name" field**: Pre-filled "Custom Campaign Template" (generic, reusable)

- **Smart Checkbox Behavior**:
  - **Checked state**: Shows template name field for saving
  - **Unchecked state**: Hides template name field
  - **Template name**: Generic and campaign-agnostic for reusability

- **Technical Implementation**:
  - **Prop Chain**: ChatInterface → ChatMessage → ContentAgentClarification
  - **State Management**: New toggle state `promptTemplateExists` in ChatInterface
  - **Component Logic**: Conditional rendering based on toggle state
  - **UI Consistency**: Matches existing form field styling and behavior patterns
  - **Non-Breaking**: Existing functionality preserved when toggle is enabled

- **Contextual Messaging System**:
  - **Template Exists (Toggle ON)**: "Let's now create the campaign content. Pick a prompt template below that fits your campaign objectives, and I'll generate compelling content for each segment. You can adjust it further if required."
  - **No Templates (Toggle OFF)**: "Let's now create the campaign content. Give me a few quick inputs in the fields below, and I'll spin them into compelling and engaging content for every segment."
  - **Smart Context Matching**: Text dynamically matches the UI elements shown (template selection vs. form fields)
  - **CTA Text Update**: Changed "Make changes" to "Customize template" for clearer action indication

- **User Experience**:
  - **Seamless Integration**: Toggle provides instant switching between modes
  - **Pre-filled Content**: Reduces user effort with contextually appropriate defaults
  - **Flexible Workflow**: Supports both template-based and custom content creation approaches
  - **Future-Proof**: Generic template naming allows cross-campaign reuse
  - **Contextual Guidance**: Messaging adapts to match the specific workflow being presented
  - **Styling Consistency**: Inverted color scheme in CTA blocks for better visual separation

### WhatsApp Accordion Enhancement (July 18, 2025)
- **ContentAgentResponse.tsx**: Enhanced the WhatsApp accordion to provide more granular control over CTA buttons
  - **Modular CTA Sections**: Replaced the single CTA input fields with distinct sections for each of the three CTAs
  - **Dynamic Fields**: Each CTA section now includes a "Button type" dropdown with "Website" and "Call phone number" options, and the fields displayed in each section dynamically update based on the selected button type
  - **Inverted Color Scheme**: The CTA blocks now have a white background with a light grey fill for the input fields and dropdowns, providing a cleaner and more modern aesthetic

### Minor UI/UX Enhancements (Current Session - December 2024)

#### Content Agent Rationale Button Styling Consistency
- **ContentAgentRationale.tsx**: Fixed Continue button styling to match SegmentAgentRationale design
  - **Border Enhancement**: Added `border border-blue-200 dark:border-muted-foreground/30` for improved definition
  - **Dark Mode Text**: Enhanced dark mode contrast by changing from `dark:text-muted-foreground` to `dark:text-white`
  - **Visual Consistency**: Both rationale components now have identical button styling and legibility

#### "Refine This" Button Implementation
- **ContentAgentRationale.tsx**: Added secondary action button alongside Continue
  - **Button Positioning**: "Refine this" button positioned to the LEFT of Continue button in horizontal layout
  - **Identical Styling**: Same visual design as Continue button for consistency
  - **State Management**: Added `refinedClicked` state and `handleRefineThis` function
  - **Dual Button Logic**: Both buttons disappear when either is clicked (`!clicked && !refinedClicked`)

- **Flow Integration**: Enhanced ContentAgentRationale callback system
  - **New Callback**: Added `onRefineThis` prop to ContentAgentRationale interface
  - **ChatMessage.tsx**: Extended props to pass `onRefineThis` callback through component chain
  - **ChatInterface.tsx**: Implemented `onRefineThis` handler that dynamically adds ContentAgentClarification message
  - **Dynamic Message Creation**: When "Refine this" is clicked, adds clarification form as new message with proper Content agent avatar

#### Content Agent Avatar System Fix
- **Avatar Consistency**: Fixed Content agent avatar display across all message types
  - **Missing avatarSrc**: Added `avatarSrc: contentAgent?.avatarSrc` to all Content agent message definitions
  - **Affected Messages**: ContentAgentQuestionChoice, ContentAgentClarification, ContentAgentRationale, ContentAgent responses, and segment accordions
  - **Dynamic Messages**: Fixed avatar properties for dynamically created messages in "Refine this" flow
  - **SVG Priority**: Ensures proper Content-agent.svg display with FileText icon and purple background as fallbacks

#### Template Edit Button Feature
- **ContentAgentClarification.tsx**: Enhanced "Use a saved template" workflow with edit capability
  - **Edit Button Addition**: Added pencil icon button next to template dropdown
    - **Positioning**: Right-aligned button with `h-9 w-9 p-0` sizing and border styling
    - **Icon**: Lucide Pencil icon with `h-4 w-4` size
    - **Light Mode Hover Fix**: `text-muted-foreground hover:text-muted-foreground` prevents white icon on hover
    - **Dark Mode Preservation**: `dark:hover:text-white` maintains correct dark mode behavior

  - **Progressive Disclosure**: Conditional UI based on edit state
    - **Before Edit**: Flex layout with dropdown (`flex-1`) + edit button
    - **After Edit**: Edit button disappears, dropdown returns to full width (`w-full`)
    - **Field Expansion**: Shows all questionnaire fields with template data pre-filled

  - **Pre-filled Template Data**: Leverages existing useEffect for auto-population
    - **Template Configs**: Existing template configurations automatically fill expanded fields
    - **All Field Types**: Target audience, tone, additional remarks, and channel-specific accordions
    - **Save as Template**: Includes save functionality for modified templates

  - **State Management Enhancement**: Added `showTemplateFields` state for edit mode control
    - **Edit Trigger**: `setShowTemplateFields(true)` on pencil button click
    - **Conditional Rendering**: Template mode with/without expanded fields
    - **Non-Breaking**: Preserves all existing "Fill questionnaire" functionality

#### Technical Implementation Details
- **Component Architecture**: Modular approach with clear prop interfaces and state management
- **Theme Compatibility**: All enhancements work seamlessly in both light and dark modes
- **Error Handling**: Comprehensive TypeScript integration with proper type safety
- **Performance**: Efficient conditional rendering and state updates
- **Accessibility**: Proper button styling and hover states for all interaction elements
- **Code Maintainability**: Clean separation of concerns and reusable patterns

### Segment Approval CTA Implementation (Current Session)
- **Segment Agent Response Enhancement**: Added "Approve Segments" CTA button for Execute mode (collaborative) workflow
  - **Execute Mode Only**: CTA appears exclusively in collaborative mode, preserving autonomous mode's auto-flow behavior
  - **Positioning**: Button positioned outside and below the segment table message bubble, matching "Approve Content" pattern
  - **Styling Consistency**: Uses identical styling to "Approve Content" button (cobalt blue, uppercase text, proper hover states)
  - **Flow Control**: Segment table now waits for user approval before continuing to Content Agent Question Choice

- **Technical Implementation**:
  - **ChatMessage.tsx**: Added `showApproveSegmentsCTA` and `onApproveSegments` props with corresponding state management
  - **ChatInterface.tsx**: Enhanced with `segmentsApproved` state and `handleApproveSegments` handler function
  - **Agent Name Matching**: Properly matches "Segment agent" (lowercase 'a') from agents.ts data
  - **Mode-Specific Logic**: Uses `!isPlanMode` condition to restrict CTA to Execute mode only
  - **Flow Integration**: Updated message flow control to pause at segment tables in collaborative mode

- **User Experience Enhancement**:
  - **Gated Progression**: Users must explicitly approve segments before content generation begins
  - **Visual Feedback**: Button shows "approving" state during transition
  - **Mode Preservation**: Plan mode (autonomous) maintains original seamless workflow
  - **Workflow Consistency**: Follows established pattern of user-controlled progression in Execute mode

This document should provide a good starting point for understanding the codebase. For deeper insights, individual files would need to be inspected. 