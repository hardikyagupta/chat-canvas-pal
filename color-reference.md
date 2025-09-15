# Color Reference Guide

## Quick Reference Table

### Core System Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Main Background** | `#FFFFFF` | `#1F2023` |
| **Primary Text** | `#0A0A0B` | `#FFFFFF` |
| **Secondary Text** | `#6F6F8D` | `#BABABA` |
| **Card Background** | `#F8F8F8` | `#28292C` |
| **Border** | `#E5E7EB` | `#414244` |

### Brand & Accent Colors

| Element | Color | Usage |
|---------|-------|-------|
| **Primary Accent** | `#63B4F7` | Both modes |
| **Cobalt Blue** | `#143F93` | Both modes |
| **Focus Ring Light** | `#007BFF` | Light mode only |
| **Focus Ring Dark** | `#63B4F7` | Dark mode only |

### Component Colors

#### Header
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `#FFFFFF` | `#25272B` |
| Text | `#051C2C` | `#FFFFFF` |
| Border | `#E7E7E8` | `#414244` |

#### Buttons
| Type | Background | Text |
|------|------------|------|
| Primary | `#143F93` | `#FFFFFF` |
| Secondary | `#002D72` | `#FFFFFF` |
| Hover Light | `#F6F7F9` | - |
| Hover Dark | `#404040` | - |

#### Forms & Inputs
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Input Background | `#FFFFFF` | `#343538` |
| Input Border | `#C7CDD9` | `#58585A` |
| Placeholder Text | `#6F6F8D` | `#BABABA` |
| Focus Background | `#F4F8FF` | `#404040` |

#### Interactive States
| State | Light Mode | Dark Mode |
|-------|------------|-----------|
| Hover | `#F3F4F6` | `#404040` |
| Active | `#F4F7FB` | `#404040` |
| Selected Background | `#E7F0FF` | `#404040` |
| Selected Text | `#143F93` | `#63B4F7` |

### Tables
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Header Background | `#F9FAFB` | `#404040` |
| Header Text | `#6B7280` | `#BABABA` |
| Border | `#E5E7EB` | `#414244` |
| Cell Background | `#FFFFFF` | `#28292C` |

### Chat Interface
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| User Message Bubble | `#E7F0FF` | `#404040` |
| Agent Message Bubble | `#FFFFFF` | `#28292C` |

### Overlay Components
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `#FFFFFF` | `#25272B` |
| Border | `#E7E7E8` | `#414244` |
| Text | `#051C2C` | `#FFFFFF` |
| Description | `#6B7280` | `#BABABA` |

### Gray Scale Palette
| Shade | HEX |
|-------|-----|
| Gray 50 | `#F9FAFB` |
| Gray 100 | `#F3F4F6` |
| Gray 200 | `#E5E7EB` |
| Gray 300 | `#D1D5DB` |
| Gray 400 | `#9CA3AF` |
| Gray 500 | `#6B7280` |
| Gray 600 | `#4B5563` |
| Gray 700 | `#374151` |
| Gray 800 | `#1F2937` |
| Gray 900 | `#111827` |

### Status Colors
| Status | HEX |
|--------|-----|
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |
| Info | `#3B82F6` |
| Destructive Light | `#DC2626` |
| Destructive Dark | `#7F1D1D` |

### Shadow Colors (RGBA)
| Type | Light Mode | Dark Mode |
|------|------------|-----------|
| Small | `rgba(0, 0, 0, 0.05)` | - |
| Medium | `rgba(23, 23, 58, 0.05)` | - |
| Large | `rgba(0, 0, 0, 0.1)` | - |
| Header | - | `rgba(22, 22, 24, 0.6)` |
| Footer | - | `rgba(18, 18, 19, 0.6)` |
| Card | - | `rgba(0, 0, 0, 0.12)` |

### Special Colors
| Element | Value | Usage |
|---------|-------|-------|
| Avatar Background | `rgba(221, 226, 238, 0.2)` | Both modes |
| Transparent | `transparent` | Dark mode borders |

## Usage Notes

1. **Light Mode**: Generally uses white backgrounds with dark text
2. **Dark Mode**: Uses dark backgrounds (`#1F2023`, `#28292C`) with light text
3. **Accent Color**: `#63B4F7` is consistently used across both modes
4. **Brand Color**: `#143F93` (Cobalt Blue) is your primary brand color
5. **Interactive States**: Light mode uses light grays, dark mode uses `#404040`
6. **Borders**: Light mode uses `#E5E7EB` family, dark mode uses `#414244`

## File Structure

- `color-palette.css` - Complete CSS file with all colors organized by component
- `color-reference.md` - This quick reference guide 