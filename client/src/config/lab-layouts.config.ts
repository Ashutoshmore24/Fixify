export interface RoomFixture {
  id: string;
  type:
    | 'wall'
    | 'door'
    | 'projector'
    | 'whiteboard'
    | 'teaching_stand'
    | 'desk'
    | 'chair'
    | 'cabinet'
    | 'bag_rack'
    | 'table';
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  rx?: number;
  orientation?: 'horizontal' | 'vertical';
  extraPath?: string;
}

export interface WorkstationTable {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export interface WorkstationSeat {
  seatIndex: number; // 1-based index (1 to total PCs)
  x: number; // Center X coordinate in SVG viewBox
  y: number; // Center Y coordinate in SVG viewBox
  orientation?: 'horizontal' | 'vertical';
}

export interface LabRoomLayout {
  roomNumber: string; // e.g. "5401"
  code: string; // e.g. "LAB-5401"
  roomName: string;
  viewBox: { width: number; height: number };
  outerWall: { x: number; y: number; width: number; height: number; rx: number };
  fixtures: RoomFixture[];
  tables: WorkstationTable[];
  seats: WorkstationSeat[];
}

/**
 * RECONSTRUCTED ROOM LAYOUTS FROM REFERENCE DIAGRAMS IN /labs.
 * Rendered purely via native SVG / React components without any static background images.
 */
export const RECONSTRUCTED_LAB_LAYOUTS: Record<string, LabRoomLayout> = {
  // =========================================================================
  // 1. Room 5401 - Web Development Lab (25 PCs)
  // Reconstructed from Lab-5401.png (912 x 709)
  // =========================================================================
  '5401': {
    roomNumber: '5401',
    code: 'LAB-5401',
    roomName: 'Web Development Lab',
    viewBox: { width: 912, height: 709 },
    outerWall: { x: 14, y: 52, width: 884, height: 636, rx: 14 },
    fixtures: [
      // Top Whiteboard
      {
        id: '5401-whiteboard',
        type: 'whiteboard',
        x: 24,
        y: 52,
        width: 195,
        height: 10,
        label: 'Whiteboard',
        rx: 2,
      },
      // Top Projector Screen
      {
        id: '5401-projector',
        type: 'projector',
        x: 300,
        y: 50,
        width: 330,
        height: 10,
        label: 'Projector Screen',
        rx: 2,
      },
      // Teaching Stand
      {
        id: '5401-teaching-stand',
        type: 'teaching_stand',
        x: 295,
        y: 66,
        width: 340,
        height: 78,
        label: 'Teaching Stand',
        rx: 12,
      },
      // Door (Top-Right)
      {
        id: '5401-door',
        type: 'door',
        x: 655,
        y: 52,
        width: 115,
        height: 10,
        label: 'Door',
        extraPath: 'M 655 52 A 80 80 0 0 0 735 132',
      },
      // Entrance Booth / Side Table
      {
        id: '5401-entrance-booth',
        type: 'desk',
        x: 758,
        y: 86,
        width: 62,
        height: 104,
        rx: 10,
      },
      // Bottom Cabinet
      {
        id: '5401-cabinet',
        type: 'cabinet',
        x: 20,
        y: 578,
        width: 872,
        height: 44,
        label: 'Cabinet',
        rx: 6,
      },
    ],
    tables: [
      // Row 1
      { id: '5401-t1', x: 20, y: 206, width: 252, height: 68, rx: 8 },
      { id: '5401-t2', x: 328, y: 206, width: 256, height: 68, rx: 8 },
      { id: '5401-t3', x: 642, y: 206, width: 250, height: 68, rx: 8 },
      // Row 2
      { id: '5401-t4', x: 20, y: 332, width: 252, height: 68, rx: 8 },
      { id: '5401-t5', x: 330, y: 332, width: 256, height: 68, rx: 8 },
      { id: '5401-t6', x: 642, y: 332, width: 250, height: 68, rx: 8 },
      // Row 3
      { id: '5401-t7', x: 20, y: 454, width: 258, height: 68, rx: 8 },
      { id: '5401-t8', x: 334, y: 454, width: 256, height: 68, rx: 8 },
      { id: '5401-t9', x: 642, y: 454, width: 250, height: 68, rx: 8 },
    ],
    seats: [
      // Row 1 (8 PCs: 3 + 3 + 2)
      { seatIndex: 1, x: 52, y: 240, orientation: 'horizontal' },
      { seatIndex: 2, x: 132, y: 240, orientation: 'horizontal' },
      { seatIndex: 3, x: 230, y: 240, orientation: 'horizontal' },
      { seatIndex: 4, x: 366, y: 240, orientation: 'horizontal' },
      { seatIndex: 5, x: 452, y: 240, orientation: 'horizontal' },
      { seatIndex: 6, x: 540, y: 240, orientation: 'horizontal' },
      { seatIndex: 7, x: 710, y: 240, orientation: 'horizontal' },
      { seatIndex: 8, x: 816, y: 240, orientation: 'horizontal' },
      // Row 2 (9 PCs: 3 + 3 + 3)
      { seatIndex: 9, x: 46, y: 366, orientation: 'horizontal' },
      { seatIndex: 10, x: 125, y: 366, orientation: 'horizontal' },
      { seatIndex: 11, x: 230, y: 366, orientation: 'horizontal' },
      { seatIndex: 12, x: 366, y: 366, orientation: 'horizontal' },
      { seatIndex: 13, x: 452, y: 366, orientation: 'horizontal' },
      { seatIndex: 14, x: 545, y: 366, orientation: 'horizontal' },
      { seatIndex: 15, x: 676, y: 366, orientation: 'horizontal' },
      { seatIndex: 16, x: 762, y: 366, orientation: 'horizontal' },
      { seatIndex: 17, x: 848, y: 366, orientation: 'horizontal' },
      // Row 3 (8 PCs: 2 + 3 + 3)
      { seatIndex: 18, x: 70, y: 488, orientation: 'horizontal' },
      { seatIndex: 19, x: 205, y: 488, orientation: 'horizontal' },
      { seatIndex: 20, x: 370, y: 488, orientation: 'horizontal' },
      { seatIndex: 21, x: 460, y: 488, orientation: 'horizontal' },
      { seatIndex: 22, x: 552, y: 488, orientation: 'horizontal' },
      { seatIndex: 23, x: 676, y: 488, orientation: 'horizontal' },
      { seatIndex: 24, x: 765, y: 488, orientation: 'horizontal' },
      { seatIndex: 25, x: 855, y: 488, orientation: 'horizontal' },
    ],
  },

  // =========================================================================
  // 2. Room 5402 - FOSS Lab (27 PCs)
  // Reconstructed from LAB-5402.png (859 x 783)
  // =========================================================================
  '5402': {
    roomNumber: '5402',
    code: 'LAB-5402',
    roomName: 'FOSS Lab',
    viewBox: { width: 859, height: 783 },
    outerWall: { x: 14, y: 34, width: 831, height: 712, rx: 14 },
    fixtures: [
      // Projector Screen
      {
        id: '5402-projector',
        type: 'projector',
        x: 240,
        y: 36,
        width: 335,
        height: 10,
        label: 'Projector',
        rx: 2,
      },
      // Teaching Stand
      {
        id: '5402-teaching-stand',
        type: 'teaching_stand',
        x: 220,
        y: 52,
        width: 388,
        height: 66,
        label: 'Teaching Stand',
        rx: 10,
      },
      // Door (Top-Right)
      {
        id: '5402-door',
        type: 'door',
        x: 650,
        y: 36,
        width: 140,
        height: 10,
        label: 'Door',
        extraPath: 'M 650 36 A 80 80 0 0 0 730 116',
      },
      // Cabinet (Bottom)
      {
        id: '5402-cabinet',
        type: 'cabinet',
        x: 76,
        y: 670,
        width: 706,
        height: 48,
        label: 'Cabinet',
        rx: 6,
      },
    ],
    tables: [
      // Left vertical table
      { id: '5402-t-left', x: 74, y: 172, width: 75, height: 432, rx: 10 },
      // Center Row 1
      { id: '5402-t-c1', x: 218, y: 220, width: 412, height: 64, rx: 10 },
      // Center Row 2
      { id: '5402-t-c2', x: 218, y: 374, width: 412, height: 64, rx: 10 },
      // Bottom Row
      { id: '5402-t-b', x: 142, y: 538, width: 566, height: 70, rx: 10 },
      // Right vertical table
      { id: '5402-t-right', x: 708, y: 182, width: 70, height: 426, rx: 10 },
    ],
    seats: [
      // Left vertical PCs (1..5)
      { seatIndex: 1, x: 112, y: 214, orientation: 'vertical' },
      { seatIndex: 2, x: 112, y: 304, orientation: 'vertical' },
      { seatIndex: 3, x: 112, y: 395, orientation: 'vertical' },
      { seatIndex: 4, x: 112, y: 486, orientation: 'vertical' },
      { seatIndex: 5, x: 112, y: 574, orientation: 'vertical' },
      // Center Row 1 PCs (6..10)
      { seatIndex: 6, x: 254, y: 252, orientation: 'horizontal' },
      { seatIndex: 7, x: 337, y: 252, orientation: 'horizontal' },
      { seatIndex: 8, x: 418, y: 252, orientation: 'horizontal' },
      { seatIndex: 9, x: 502, y: 252, orientation: 'horizontal' },
      { seatIndex: 10, x: 592, y: 252, orientation: 'horizontal' },
      // Center Row 2 PCs (11..15)
      { seatIndex: 11, x: 254, y: 406, orientation: 'horizontal' },
      { seatIndex: 12, x: 337, y: 406, orientation: 'horizontal' },
      { seatIndex: 13, x: 418, y: 406, orientation: 'horizontal' },
      { seatIndex: 14, x: 502, y: 406, orientation: 'horizontal' },
      { seatIndex: 15, x: 592, y: 406, orientation: 'horizontal' },
      // Bottom Row PCs (16..22)
      { seatIndex: 16, x: 182, y: 573, orientation: 'horizontal' },
      { seatIndex: 17, x: 254, y: 573, orientation: 'horizontal' },
      { seatIndex: 18, x: 328, y: 573, orientation: 'horizontal' },
      { seatIndex: 19, x: 410, y: 573, orientation: 'horizontal' },
      { seatIndex: 20, x: 488, y: 573, orientation: 'horizontal' },
      { seatIndex: 21, x: 562, y: 573, orientation: 'horizontal' },
      { seatIndex: 22, x: 640, y: 573, orientation: 'horizontal' },
      // Right vertical PCs (23..27)
      { seatIndex: 23, x: 743, y: 228, orientation: 'vertical' },
      { seatIndex: 24, x: 743, y: 320, orientation: 'vertical' },
      { seatIndex: 25, x: 743, y: 412, orientation: 'vertical' },
      { seatIndex: 26, x: 743, y: 502, orientation: 'vertical' },
      { seatIndex: 27, x: 743, y: 588, orientation: 'vertical' },
    ],
  },

  // =========================================================================
  // 3. Room 5404 - PG Classroom / Lab (21 PCs)
  // Reconstructed from LAB-5404.png (569 x 501)
  // =========================================================================
  '5404': {
    roomNumber: '5404',
    code: 'LAB-5404',
    roomName: 'PG Classroom & Lab',
    viewBox: { width: 569, height: 501 },
    outerWall: { x: 8, y: 12, width: 553, height: 477, rx: 12 },
    fixtures: [
      // Projector Screen
      {
        id: '5404-projector',
        type: 'projector',
        x: 18,
        y: 14,
        width: 310,
        height: 18,
        label: 'Projector Screen',
        rx: 4,
      },
      // Door
      {
        id: '5404-door',
        type: 'door',
        x: 426,
        y: 14,
        width: 120,
        height: 18,
        label: 'Door',
        extraPath: 'M 426 14 A 60 60 0 0 0 486 74',
      },
      // Cabinet
      {
        id: '5404-cabinet',
        type: 'cabinet',
        x: 22,
        y: 432,
        width: 395,
        height: 52,
        label: 'Cabinet',
        rx: 8,
      },
      // Desk (Bottom Right)
      {
        id: '5404-desk',
        type: 'desk',
        x: 428,
        y: 390,
        width: 44,
        height: 94,
        label: 'Desk',
        rx: 8,
      },
      // Chair (Bottom Right)
      {
        id: '5404-chair',
        type: 'chair',
        x: 494,
        y: 420,
        width: 36,
        height: 36,
        label: 'Chair',
        rx: 18,
      },
    ],
    tables: [
      // Left Column (4 tables)
      { id: '5404-t-l1', x: 20, y: 96, width: 236, height: 44, rx: 8 },
      { id: '5404-t-l2', x: 20, y: 180, width: 236, height: 44, rx: 8 },
      { id: '5404-t-l3', x: 20, y: 268, width: 236, height: 44, rx: 8 },
      { id: '5404-t-l4', x: 20, y: 350, width: 236, height: 44, rx: 8 },
      // Right Column (3 tables)
      { id: '5404-t-r1', x: 318, y: 96, width: 236, height: 44, rx: 8 },
      { id: '5404-t-r2', x: 318, y: 212, width: 236, height: 44, rx: 8 },
      { id: '5404-t-r3', x: 318, y: 318, width: 236, height: 44, rx: 8 },
    ],
    seats: [
      // Left Col T1 (1..3)
      { seatIndex: 1, x: 48, y: 118, orientation: 'horizontal' },
      { seatIndex: 2, x: 130, y: 118, orientation: 'horizontal' },
      { seatIndex: 3, x: 215, y: 118, orientation: 'horizontal' },
      // Left Col T2 (4..6)
      { seatIndex: 4, x: 48, y: 202, orientation: 'horizontal' },
      { seatIndex: 5, x: 130, y: 202, orientation: 'horizontal' },
      { seatIndex: 6, x: 215, y: 202, orientation: 'horizontal' },
      // Left Col T3 (7..9)
      { seatIndex: 7, x: 48, y: 290, orientation: 'horizontal' },
      { seatIndex: 8, x: 130, y: 290, orientation: 'horizontal' },
      { seatIndex: 9, x: 215, y: 290, orientation: 'horizontal' },
      // Left Col T4 (10..12)
      { seatIndex: 10, x: 48, y: 372, orientation: 'horizontal' },
      { seatIndex: 11, x: 130, y: 372, orientation: 'horizontal' },
      { seatIndex: 12, x: 215, y: 372, orientation: 'horizontal' },
      // Right Col T1 (13..15)
      { seatIndex: 13, x: 350, y: 118, orientation: 'horizontal' },
      { seatIndex: 14, x: 432, y: 118, orientation: 'horizontal' },
      { seatIndex: 15, x: 516, y: 118, orientation: 'horizontal' },
      // Right Col T2 (16..18)
      { seatIndex: 16, x: 350, y: 234, orientation: 'horizontal' },
      { seatIndex: 17, x: 432, y: 234, orientation: 'horizontal' },
      { seatIndex: 18, x: 516, y: 234, orientation: 'horizontal' },
      // Right Col T3 (19..21)
      { seatIndex: 19, x: 350, y: 340, orientation: 'horizontal' },
      { seatIndex: 20, x: 432, y: 340, orientation: 'horizontal' },
      { seatIndex: 21, x: 516, y: 340, orientation: 'horizontal' },
    ],
  },

  // =========================================================================
  // 4. Room 5405 - DSA Lab (24 PCs)
  // Reconstructed from LAB-5405.png (696 x 576)
  // =========================================================================
  '5405': {
    roomNumber: '5405',
    code: 'LAB-5405',
    roomName: 'DSA Lab',
    viewBox: { width: 696, height: 576 },
    outerWall: { x: 12, y: 36, width: 672, height: 516, rx: 14 },
    fixtures: [
      // Door (Top-Left)
      {
        id: '5405-door',
        type: 'door',
        x: 48,
        y: 36,
        width: 100,
        height: 10,
        label: 'Door',
        extraPath: 'M 48 36 A 60 60 0 0 0 108 96',
      },
      // Projector Screen
      {
        id: '5405-projector',
        type: 'projector',
        x: 182,
        y: 36,
        width: 335,
        height: 10,
        label: 'Projector Screen',
        rx: 2,
      },
      // Teaching Stand
      {
        id: '5405-teaching-stand',
        type: 'teaching_stand',
        x: 184,
        y: 52,
        width: 332,
        height: 72,
        label: 'Teaching Stand',
        rx: 10,
      },
      // Desk (Top-Right)
      {
        id: '5405-desk',
        type: 'desk',
        x: 548,
        y: 78,
        width: 86,
        height: 46,
        label: 'Desk',
        rx: 8,
      },
      // Component Storage Cabinet (Bottom)
      {
        id: '5405-cabinet',
        type: 'cabinet',
        x: 64,
        y: 472,
        width: 568,
        height: 44,
        label: 'Component Storage Cabinet',
        rx: 6,
      },
    ],
    tables: [
      // Left vertical table
      { id: '5405-t-left', x: 68, y: 154, width: 40, height: 206, rx: 8 },
      // Center Row 1
      { id: '5405-t-c1', x: 172, y: 166, width: 356, height: 42, rx: 8 },
      // Center Row 2
      { id: '5405-t-c2', x: 172, y: 254, width: 356, height: 42, rx: 8 },
      // Bottom Row
      { id: '5405-t-b', x: 64, y: 368, width: 572, height: 44, rx: 8 },
      // Right vertical table
      { id: '5405-t-right', x: 596, y: 156, width: 40, height: 206, rx: 8 },
    ],
    seats: [
      // Left vertical PCs (1..4)
      { seatIndex: 1, x: 88, y: 178, orientation: 'vertical' },
      { seatIndex: 2, x: 88, y: 232, orientation: 'vertical' },
      { seatIndex: 3, x: 88, y: 288, orientation: 'vertical' },
      { seatIndex: 4, x: 88, y: 342, orientation: 'vertical' },
      // Center Row 1 PCs (5..9)
      { seatIndex: 5, x: 218, y: 187, orientation: 'horizontal' },
      { seatIndex: 6, x: 288, y: 187, orientation: 'horizontal' },
      { seatIndex: 7, x: 352, y: 187, orientation: 'horizontal' },
      { seatIndex: 8, x: 422, y: 187, orientation: 'horizontal' },
      { seatIndex: 9, x: 492, y: 187, orientation: 'horizontal' },
      // Center Row 2 PCs (10..14)
      { seatIndex: 10, x: 218, y: 275, orientation: 'horizontal' },
      { seatIndex: 11, x: 288, y: 275, orientation: 'horizontal' },
      { seatIndex: 12, x: 352, y: 275, orientation: 'horizontal' },
      { seatIndex: 13, x: 422, y: 275, orientation: 'horizontal' },
      { seatIndex: 14, x: 492, y: 275, orientation: 'horizontal' },
      // Bottom Row PCs (15..20)
      { seatIndex: 15, x: 148, y: 390, orientation: 'horizontal' },
      { seatIndex: 16, x: 226, y: 390, orientation: 'horizontal' },
      { seatIndex: 17, x: 304, y: 390, orientation: 'horizontal' },
      { seatIndex: 18, x: 386, y: 390, orientation: 'horizontal' },
      { seatIndex: 19, x: 466, y: 390, orientation: 'horizontal' },
      { seatIndex: 20, x: 546, y: 390, orientation: 'horizontal' },
      // Right vertical PCs (21..24)
      { seatIndex: 21, x: 616, y: 178, orientation: 'vertical' },
      { seatIndex: 22, x: 616, y: 232, orientation: 'vertical' },
      { seatIndex: 23, x: 616, y: 288, orientation: 'vertical' },
      { seatIndex: 24, x: 616, y: 342, orientation: 'vertical' },
    ],
  },

  // =========================================================================
  // 5. Room 5406 - IoT Lab (20 PCs)
  // Reconstructed from LAB-5406.png (849 x 697)
  // =========================================================================
  '5406': {
    roomNumber: '5406',
    code: 'LAB-5406',
    roomName: 'IoT Lab',
    viewBox: { width: 849, height: 697 },
    outerWall: { x: 12, y: 34, width: 825, height: 638, rx: 14 },
    fixtures: [
      // Door (Top-Left)
      {
        id: '5406-door',
        type: 'door',
        x: 104,
        y: 36,
        width: 106,
        height: 10,
        label: 'Door',
        extraPath: 'M 104 36 A 65 65 0 0 0 169 101',
      },
      // Projector
      {
        id: '5406-projector',
        type: 'projector',
        x: 270,
        y: 36,
        width: 350,
        height: 10,
        label: 'Projector',
        rx: 2,
      },
      // Teaching Stand
      {
        id: '5406-teaching-stand',
        type: 'teaching_stand',
        x: 312,
        y: 52,
        width: 230,
        height: 58,
        label: 'Stand',
        rx: 8,
      },
      // Whiteboard (Top-Right)
      {
        id: '5406-whiteboard',
        type: 'whiteboard',
        x: 650,
        y: 36,
        width: 170,
        height: 10,
        label: 'White Board',
        rx: 2,
      },
      // Central Work Table
      {
        id: '5406-table',
        type: 'table',
        x: 326,
        y: 156,
        width: 175,
        height: 365,
        label: 'Table',
        rx: 12,
      },
      // Teacher Desk (Bottom-Left)
      {
        id: '5406-desk',
        type: 'desk',
        x: 142,
        y: 458,
        width: 56,
        height: 94,
        label: 'Teacher Desk',
        rx: 8,
      },
      // Digital Trainer Kit / Cabinet (Bottom)
      {
        id: '5406-trainer',
        type: 'cabinet',
        x: 38,
        y: 602,
        width: 782,
        height: 34,
        label: 'Electronic Assets (Digital Trainer Kit)',
        rx: 6,
      },
    ],
    tables: [
      // Left vertical bench
      { id: '5406-t-left', x: 14, y: 58, width: 56, height: 462, rx: 8 },
      // Right vertical bench
      { id: '5406-t-right', x: 778, y: 88, width: 58, height: 494, rx: 8 },
    ],
    seats: [
      // Left vertical PCs (1..9)
      { seatIndex: 1, x: 42, y: 84, orientation: 'vertical' },
      { seatIndex: 2, x: 42, y: 128, orientation: 'vertical' },
      { seatIndex: 3, x: 42, y: 174, orientation: 'vertical' },
      { seatIndex: 4, x: 42, y: 220, orientation: 'vertical' },
      { seatIndex: 5, x: 42, y: 266, orientation: 'vertical' },
      { seatIndex: 6, x: 42, y: 312, orientation: 'vertical' },
      { seatIndex: 7, x: 42, y: 358, orientation: 'vertical' },
      { seatIndex: 8, x: 42, y: 404, orientation: 'vertical' },
      { seatIndex: 9, x: 42, y: 450, orientation: 'vertical' },
      // Right vertical PCs (10..20)
      { seatIndex: 10, x: 807, y: 122, orientation: 'vertical' },
      { seatIndex: 11, x: 807, y: 164, orientation: 'vertical' },
      { seatIndex: 12, x: 807, y: 206, orientation: 'vertical' },
      { seatIndex: 13, x: 807, y: 248, orientation: 'vertical' },
      { seatIndex: 14, x: 807, y: 290, orientation: 'vertical' },
      { seatIndex: 15, x: 807, y: 332, orientation: 'vertical' },
      { seatIndex: 16, x: 807, y: 374, orientation: 'vertical' },
      { seatIndex: 17, x: 807, y: 416, orientation: 'vertical' },
      { seatIndex: 18, x: 807, y: 458, orientation: 'vertical' },
      { seatIndex: 19, x: 807, y: 500, orientation: 'vertical' },
      { seatIndex: 20, x: 807, y: 542, orientation: 'vertical' },
    ],
  },

  // =========================================================================
  // 6. Room 5311 - ML Lab (31 PCs)
  // Reconstructed from LAB-5311.png (796 x 573)
  // =========================================================================
  '5311': {
    roomNumber: '5311',
    code: 'LAB-5311',
    roomName: 'Machine Learning Lab',
    viewBox: { width: 796, height: 573 },
    outerWall: { x: 12, y: 34, width: 772, height: 512, rx: 14 },
    fixtures: [
      // Door (Top-Left)
      {
        id: '5311-door',
        type: 'door',
        x: 44,
        y: 36,
        width: 90,
        height: 12,
        label: 'Door',
        extraPath: 'M 44 36 A 65 65 0 0 0 109 101',
      },
      // Bag Rack (Under Door)
      {
        id: '5311-bag-rack',
        type: 'bag_rack',
        x: 14,
        y: 64,
        width: 48,
        height: 84,
        label: 'Bag Rack',
        rx: 8,
      },
      // Projector Screen
      {
        id: '5311-projector',
        type: 'projector',
        x: 278,
        y: 38,
        width: 310,
        height: 8,
        label: 'Projector Screen',
        rx: 2,
      },
      // Teaching Stand
      {
        id: '5311-teaching-stand',
        type: 'teaching_stand',
        x: 254,
        y: 52,
        width: 360,
        height: 52,
        label: 'Teaching Stand',
        rx: 8,
      },
    ],
    tables: [
      // Row 1
      { id: '5311-t-r1-l', x: 14, y: 176, width: 246, height: 62, rx: 8 },
      { id: '5311-t-r1-m', x: 312, y: 176, width: 160, height: 62, rx: 8 },
      { id: '5311-t-r1-r', x: 518, y: 176, width: 260, height: 62, rx: 8 },
      // Row 2
      { id: '5311-t-r2-l', x: 14, y: 270, width: 246, height: 62, rx: 8 },
      { id: '5311-t-r2-m', x: 306, y: 270, width: 166, height: 62, rx: 8 },
      { id: '5311-t-r2-r', x: 518, y: 270, width: 260, height: 62, rx: 8 },
      // Row 3
      { id: '5311-t-r3-l', x: 14, y: 384, width: 246, height: 62, rx: 8 },
      { id: '5311-t-r3-m', x: 306, y: 384, width: 160, height: 62, rx: 8 },
      { id: '5311-t-r3-r', x: 518, y: 384, width: 260, height: 62, rx: 8 },
    ],
    seats: [
      // Row 1 (11 PCs: 4 + 3 + 4)
      { seatIndex: 1, x: 44, y: 207, orientation: 'horizontal' },
      { seatIndex: 2, x: 94, y: 207, orientation: 'horizontal' },
      { seatIndex: 3, x: 144, y: 207, orientation: 'horizontal' },
      { seatIndex: 4, x: 198, y: 207, orientation: 'horizontal' },
      { seatIndex: 5, x: 338, y: 207, orientation: 'horizontal' },
      { seatIndex: 6, x: 390, y: 207, orientation: 'horizontal' },
      { seatIndex: 7, x: 442, y: 207, orientation: 'horizontal' },
      { seatIndex: 8, x: 550, y: 207, orientation: 'horizontal' },
      { seatIndex: 9, x: 610, y: 207, orientation: 'horizontal' },
      { seatIndex: 10, x: 672, y: 207, orientation: 'horizontal' },
      { seatIndex: 11, x: 734, y: 207, orientation: 'horizontal' },
      // Row 2 (11 PCs: 4 + 3 + 4)
      { seatIndex: 12, x: 44, y: 301, orientation: 'horizontal' },
      { seatIndex: 13, x: 94, y: 301, orientation: 'horizontal' },
      { seatIndex: 14, x: 144, y: 301, orientation: 'horizontal' },
      { seatIndex: 15, x: 198, y: 301, orientation: 'horizontal' },
      { seatIndex: 16, x: 338, y: 301, orientation: 'horizontal' },
      { seatIndex: 17, x: 390, y: 301, orientation: 'horizontal' },
      { seatIndex: 18, x: 442, y: 301, orientation: 'horizontal' },
      { seatIndex: 19, x: 550, y: 301, orientation: 'horizontal' },
      { seatIndex: 20, x: 610, y: 301, orientation: 'horizontal' },
      { seatIndex: 21, x: 672, y: 301, orientation: 'horizontal' },
      { seatIndex: 22, x: 734, y: 301, orientation: 'horizontal' },
      // Row 3 (9 PCs: 2 + 3 + 4)
      { seatIndex: 23, x: 54, y: 415, orientation: 'horizontal' },
      { seatIndex: 24, x: 200, y: 415, orientation: 'horizontal' },
      { seatIndex: 25, x: 338, y: 415, orientation: 'horizontal' },
      { seatIndex: 26, x: 390, y: 415, orientation: 'horizontal' },
      { seatIndex: 27, x: 442, y: 415, orientation: 'horizontal' },
      { seatIndex: 28, x: 550, y: 415, orientation: 'horizontal' },
      { seatIndex: 29, x: 610, y: 415, orientation: 'horizontal' },
      { seatIndex: 30, x: 672, y: 415, orientation: 'horizontal' },
      { seatIndex: 31, x: 734, y: 415, orientation: 'horizontal' },
    ],
  },

  // =========================================================================
  // 7. Room 5308 - NIS Lab (26 PCs)
  // Reconstructed from LAB-5308.png (800 x 580)
  // =========================================================================
  '5308': {
    roomNumber: '5308',
    code: 'LAB-5308',
    roomName: 'Network & Info Security Lab',
    viewBox: { width: 800, height: 580 },
    outerWall: { x: 12, y: 34, width: 776, height: 516, rx: 14 },
    fixtures: [
      {
        id: '5308-door',
        type: 'door',
        x: 44,
        y: 36,
        width: 90,
        height: 12,
        label: 'Door',
        extraPath: 'M 44 36 A 65 65 0 0 0 109 101',
      },
      {
        id: '5308-bag-rack',
        type: 'bag_rack',
        x: 14,
        y: 64,
        width: 48,
        height: 84,
        label: 'Bag Rack',
        rx: 8,
      },
      {
        id: '5308-projector',
        type: 'projector',
        x: 278,
        y: 38,
        width: 310,
        height: 8,
        label: 'Projector Screen',
        rx: 2,
      },
      {
        id: '5308-teaching-stand',
        type: 'teaching_stand',
        x: 254,
        y: 52,
        width: 360,
        height: 52,
        label: 'Teaching Stand',
        rx: 8,
      },
    ],
    tables: [
      // Row 1
      { id: '5308-t-r1-l', x: 14, y: 176, width: 246, height: 62, rx: 8 },
      { id: '5308-t-r1-m', x: 312, y: 176, width: 160, height: 62, rx: 8 },
      { id: '5308-t-r1-r', x: 518, y: 176, width: 260, height: 62, rx: 8 },
      // Row 2
      { id: '5308-t-r2-l', x: 14, y: 270, width: 246, height: 62, rx: 8 },
      { id: '5308-t-r2-m', x: 306, y: 270, width: 166, height: 62, rx: 8 },
      { id: '5308-t-r2-r', x: 518, y: 270, width: 260, height: 62, rx: 8 },
      // Row 3
      { id: '5308-t-r3-l', x: 14, y: 384, width: 246, height: 62, rx: 8 },
      { id: '5308-t-r3-m', x: 306, y: 384, width: 160, height: 62, rx: 8 },
      { id: '5308-t-r3-r', x: 518, y: 384, width: 260, height: 62, rx: 8 },
    ],
    seats: [
      // Row 1 (11 PCs: 4 + 3 + 4)
      { seatIndex: 1, x: 44, y: 207, orientation: 'horizontal' },
      { seatIndex: 2, x: 94, y: 207, orientation: 'horizontal' },
      { seatIndex: 3, x: 144, y: 207, orientation: 'horizontal' },
      { seatIndex: 4, x: 198, y: 207, orientation: 'horizontal' },
      { seatIndex: 5, x: 338, y: 207, orientation: 'horizontal' },
      { seatIndex: 6, x: 390, y: 207, orientation: 'horizontal' },
      { seatIndex: 7, x: 442, y: 207, orientation: 'horizontal' },
      { seatIndex: 8, x: 550, y: 207, orientation: 'horizontal' },
      { seatIndex: 9, x: 610, y: 207, orientation: 'horizontal' },
      { seatIndex: 10, x: 672, y: 207, orientation: 'horizontal' },
      { seatIndex: 11, x: 734, y: 207, orientation: 'horizontal' },
      // Row 2 (11 PCs: 4 + 3 + 4)
      { seatIndex: 12, x: 44, y: 301, orientation: 'horizontal' },
      { seatIndex: 13, x: 94, y: 301, orientation: 'horizontal' },
      { seatIndex: 14, x: 144, y: 301, orientation: 'horizontal' },
      { seatIndex: 15, x: 198, y: 301, orientation: 'horizontal' },
      { seatIndex: 16, x: 338, y: 301, orientation: 'horizontal' },
      { seatIndex: 17, x: 390, y: 301, orientation: 'horizontal' },
      { seatIndex: 18, x: 442, y: 301, orientation: 'horizontal' },
      { seatIndex: 19, x: 550, y: 301, orientation: 'horizontal' },
      { seatIndex: 20, x: 610, y: 301, orientation: 'horizontal' },
      { seatIndex: 21, x: 672, y: 301, orientation: 'horizontal' },
      { seatIndex: 22, x: 734, y: 301, orientation: 'horizontal' },
      // Row 3 (4 PCs: 1 + 2 + 1)
      { seatIndex: 23, x: 50, y: 415, orientation: 'horizontal' },
      { seatIndex: 24, x: 350, y: 415, orientation: 'horizontal' },
      { seatIndex: 25, x: 430, y: 415, orientation: 'horizontal' },
      { seatIndex: 26, x: 550, y: 415, orientation: 'horizontal' },
    ],
  },

  // =========================================================================
  // 8. Room 5305 - Cloud Computing Lab (27 PCs)
  // Reconstructed from LAB-5305.png (1040 x 750)
  // =========================================================================
  '5305': {
    roomNumber: '5305',
    code: 'LAB-5305',
    roomName: 'Cloud Computing Lab',
    viewBox: { width: 1040, height: 750 },
    outerWall: { x: 38, y: 45, width: 962, height: 678, rx: 14 },
    fixtures: [
      {
        id: '5305-door',
        type: 'door',
        x: 38,
        y: 45,
        width: 10,
        height: 90,
        label: 'Door',
        extraPath: 'M 38 45 A 75 75 0 0 1 113 120',
      },
      {
        id: '5305-projector',
        type: 'projector',
        x: 297,
        y: 37,
        width: 376,
        height: 8,
        label: 'Projector Screen',
        rx: 2,
      },
      {
        id: '5305-teaching-stand',
        type: 'teaching_stand',
        x: 285,
        y: 47,
        width: 402,
        height: 62,
        label: 'Teaching Stand',
        rx: 10,
      },
      {
        id: '5305-cabin-l-wall',
        type: 'wall',
        x: 38,
        y: 530,
        width: 342,
        height: 193,
        label: 'Teacher Cabin',
        rx: 8,
      },
      {
        id: '5305-cabin-l-door',
        type: 'door',
        x: 370,
        y: 535,
        width: 10,
        height: 65,
        label: 'Door',
      },
      {
        id: '5305-chair-cabin-l',
        type: 'chair',
        x: 112,
        y: 660,
        width: 50,
        height: 50,
        label: 'Chair',
      },
      {
        id: '5305-chair-mid-bot',
        type: 'chair',
        x: 449,
        y: 655,
        width: 50,
        height: 50,
        label: 'Chair',
      },
      {
        id: '5305-cabin-r-wall',
        type: 'wall',
        x: 650,
        y: 518,
        width: 350,
        height: 205,
        label: 'Teacher Cabin',
        rx: 8,
      },
      {
        id: '5305-cabin-r-door',
        type: 'door',
        x: 650,
        y: 524,
        width: 10,
        height: 65,
        label: 'Door',
      },
      {
        id: '5305-chair-cabin-r',
        type: 'chair',
        x: 885,
        y: 650,
        width: 50,
        height: 50,
        label: 'Chair',
      },
    ],
    tables: [
      // Row 1
      { id: '5305-t-r1-l', x: 40, y: 158, width: 230, height: 64, rx: 8 },
      { id: '5305-t-r1-m', x: 398, y: 158, width: 192, height: 64, rx: 8 },
      { id: '5305-t-r1-r', x: 710, y: 158, width: 290, height: 64, rx: 8 },
      // Row 2
      { id: '5305-t-r2-l', x: 40, y: 270, width: 230, height: 64, rx: 8 },
      { id: '5305-t-r2-m', x: 398, y: 270, width: 200, height: 64, rx: 8 },
      { id: '5305-t-r2-r', x: 712, y: 270, width: 288, height: 64, rx: 8 },
      // Row 3
      { id: '5305-t-r3-l', x: 40, y: 400, width: 230, height: 64, rx: 8 },
      { id: '5305-t-r3-m', x: 398, y: 400, width: 200, height: 64, rx: 8 },
      { id: '5305-t-r3-r', x: 712, y: 400, width: 288, height: 64, rx: 8 },
      // Cabin Left & Center Desk & Cabin Right
      { id: '5305-t-cabin-l', x: 45, y: 580, width: 180, height: 56, rx: 8 },
      { id: '5305-t-mid-bot', x: 404, y: 575, width: 142, height: 56, rx: 8 },
      { id: '5305-t-cabin-r', x: 830, y: 565, width: 155, height: 56, rx: 8 },
    ],
    seats: [
      // Row 1 (8 PCs: 3 + 2 + 3)
      { seatIndex: 1, x: 73, y: 190, orientation: 'horizontal' },
      { seatIndex: 2, x: 144, y: 190, orientation: 'horizontal' },
      { seatIndex: 3, x: 224, y: 190, orientation: 'horizontal' },
      { seatIndex: 4, x: 440, y: 190, orientation: 'horizontal' },
      { seatIndex: 5, x: 542, y: 190, orientation: 'horizontal' },
      { seatIndex: 6, x: 764, y: 186, orientation: 'horizontal' },
      { seatIndex: 7, x: 856, y: 186, orientation: 'horizontal' },
      { seatIndex: 8, x: 946, y: 186, orientation: 'horizontal' },
      // Row 2 (8 PCs: 3 + 2 + 3)
      { seatIndex: 9, x: 73, y: 303, orientation: 'horizontal' },
      { seatIndex: 10, x: 144, y: 303, orientation: 'horizontal' },
      { seatIndex: 11, x: 224, y: 303, orientation: 'horizontal' },
      { seatIndex: 12, x: 440, y: 303, orientation: 'horizontal' },
      { seatIndex: 13, x: 549, y: 303, orientation: 'horizontal' },
      { seatIndex: 14, x: 764, y: 303, orientation: 'horizontal' },
      { seatIndex: 15, x: 854, y: 303, orientation: 'horizontal' },
      { seatIndex: 16, x: 946, y: 303, orientation: 'horizontal' },
      // Row 3 (8 PCs: 3 + 2 + 3)
      { seatIndex: 17, x: 73, y: 432, orientation: 'horizontal' },
      { seatIndex: 18, x: 144, y: 432, orientation: 'horizontal' },
      { seatIndex: 19, x: 224, y: 432, orientation: 'horizontal' },
      { seatIndex: 20, x: 440, y: 432, orientation: 'horizontal' },
      { seatIndex: 21, x: 549, y: 432, orientation: 'horizontal' },
      { seatIndex: 22, x: 764, y: 432, orientation: 'horizontal' },
      { seatIndex: 23, x: 854, y: 432, orientation: 'horizontal' },
      { seatIndex: 24, x: 946, y: 432, orientation: 'horizontal' },
      // Faculty & Cabin Workstations (3 PCs)
      { seatIndex: 25, x: 137, y: 600, orientation: 'horizontal' },
      { seatIndex: 26, x: 474, y: 605, orientation: 'horizontal' },
      { seatIndex: 27, x: 910, y: 593, orientation: 'horizontal' },
    ],
  },

  // =========================================================================
  // 9. Room 5309 - OS Lab (25 PCs)
  // Reconstructed from LAB-5309.png (982 x 640)
  // =========================================================================
  '5309': {
    roomNumber: '5309',
    code: 'LAB-5309',
    roomName: 'Operating Systems Lab',
    viewBox: { width: 982, height: 640 },
    outerWall: { x: 10, y: 37, width: 961, height: 523, rx: 14 },
    fixtures: [
      {
        id: '5309-door',
        type: 'door',
        x: 60,
        y: 37,
        width: 130,
        height: 10,
        label: 'Door',
        extraPath: 'M 60 37 A 80 80 0 0 0 140 117',
      },
      {
        id: '5309-bag-rack',
        type: 'bag_rack',
        x: 11,
        y: 58,
        width: 52,
        height: 72,
        label: 'Bag Rack',
        rx: 8,
      },
      {
        id: '5309-projector',
        type: 'projector',
        x: 250,
        y: 37,
        width: 400,
        height: 8,
        label: 'Projector Screen',
        rx: 2,
      },
      {
        id: '5309-teaching-stand',
        type: 'teaching_stand',
        x: 255,
        y: 47,
        width: 397,
        height: 62,
        label: 'Teaching Stand',
        rx: 10,
      },
    ],
    tables: [
      // Row 1
      { id: '5309-t-r1-l', x: 11, y: 155, width: 295, height: 66, rx: 8 },
      { id: '5309-t-r1-m', x: 358, y: 155, width: 203, height: 66, rx: 8 },
      { id: '5309-t-r1-r', x: 635, y: 155, width: 335, height: 66, rx: 8 },
      // Row 2
      { id: '5309-t-r2-l', x: 11, y: 255, width: 295, height: 66, rx: 8 },
      { id: '5309-t-r2-m', x: 368, y: 260, width: 201, height: 66, rx: 8 },
      { id: '5309-t-r2-r', x: 635, y: 255, width: 335, height: 66, rx: 8 },
      // Row 3
      { id: '5309-t-r3-l', x: 11, y: 395, width: 295, height: 66, rx: 8 },
      { id: '5309-t-r3-m', x: 368, y: 395, width: 201, height: 66, rx: 8 },
      { id: '5309-t-r3-r', x: 635, y: 395, width: 335, height: 66, rx: 8 },
    ],
    seats: [
      // Row 1 (11 PCs: 4 + 3 + 4)
      { seatIndex: 1, x: 44, y: 188, orientation: 'horizontal' },
      { seatIndex: 2, x: 115, y: 188, orientation: 'horizontal' },
      { seatIndex: 3, x: 195, y: 188, orientation: 'horizontal' },
      { seatIndex: 4, x: 273, y: 188, orientation: 'horizontal' },
      { seatIndex: 5, x: 401, y: 188, orientation: 'horizontal' },
      { seatIndex: 6, x: 469, y: 188, orientation: 'horizontal' },
      { seatIndex: 7, x: 535, y: 188, orientation: 'horizontal' },
      { seatIndex: 8, x: 678, y: 188, orientation: 'horizontal' },
      { seatIndex: 9, x: 760, y: 188, orientation: 'horizontal' },
      { seatIndex: 10, x: 848, y: 188, orientation: 'horizontal' },
      { seatIndex: 11, x: 929, y: 188, orientation: 'horizontal' },
      // Row 2 (11 PCs: 4 + 3 + 4)
      { seatIndex: 12, x: 53, y: 290, orientation: 'horizontal' },
      { seatIndex: 13, x: 115, y: 290, orientation: 'horizontal' },
      { seatIndex: 14, x: 195, y: 290, orientation: 'horizontal' },
      { seatIndex: 15, x: 273, y: 290, orientation: 'horizontal' },
      { seatIndex: 16, x: 401, y: 295, orientation: 'horizontal' },
      { seatIndex: 17, x: 469, y: 295, orientation: 'horizontal' },
      { seatIndex: 18, x: 529, y: 295, orientation: 'horizontal' },
      { seatIndex: 19, x: 682, y: 290, orientation: 'horizontal' },
      { seatIndex: 20, x: 764, y: 290, orientation: 'horizontal' },
      { seatIndex: 21, x: 852, y: 290, orientation: 'horizontal' },
      { seatIndex: 22, x: 933, y: 290, orientation: 'horizontal' },
      // Row 3 (3 PCs: 0 + 2 + 1)
      { seatIndex: 23, x: 411, y: 432, orientation: 'horizontal' },
      { seatIndex: 24, x: 529, y: 432, orientation: 'horizontal' },
      { seatIndex: 25, x: 682, y: 432, orientation: 'horizontal' },
    ],
  },

  // =========================================================================
  // 10. Room 5310 - DB Lab (30 PCs)
  // Reconstructed from LAB-5310.png (982 x 640)
  // =========================================================================
  '5310': {
    roomNumber: '5310',
    code: 'LAB-5310',
    roomName: 'Database Systems Lab',
    viewBox: { width: 982, height: 640 },
    outerWall: { x: 10, y: 37, width: 961, height: 523, rx: 14 },
    fixtures: [
      {
        id: '5310-door',
        type: 'door',
        x: 60,
        y: 37,
        width: 130,
        height: 10,
        label: 'Door',
        extraPath: 'M 60 37 A 80 80 0 0 0 140 117',
      },
      {
        id: '5310-bag-rack',
        type: 'bag_rack',
        x: 11,
        y: 58,
        width: 52,
        height: 72,
        label: 'Bag Rack',
        rx: 8,
      },
      {
        id: '5310-projector',
        type: 'projector',
        x: 250,
        y: 37,
        width: 400,
        height: 8,
        label: 'Projector Screen',
        rx: 2,
      },
      {
        id: '5310-teaching-stand',
        type: 'teaching_stand',
        x: 255,
        y: 47,
        width: 397,
        height: 62,
        label: 'Teaching Stand',
        rx: 10,
      },
    ],
    tables: [
      // Row 1
      { id: '5310-t-r1-l', x: 11, y: 155, width: 295, height: 66, rx: 8 },
      { id: '5310-t-r1-m', x: 358, y: 155, width: 203, height: 66, rx: 8 },
      { id: '5310-t-r1-r', x: 635, y: 155, width: 335, height: 66, rx: 8 },
      // Row 2
      { id: '5310-t-r2-l', x: 11, y: 255, width: 295, height: 66, rx: 8 },
      { id: '5310-t-r2-m', x: 368, y: 260, width: 201, height: 66, rx: 8 },
      { id: '5310-t-r2-r', x: 635, y: 255, width: 335, height: 66, rx: 8 },
      // Row 3
      { id: '5310-t-r3-l', x: 11, y: 395, width: 295, height: 66, rx: 8 },
      { id: '5310-t-r3-m', x: 368, y: 395, width: 201, height: 66, rx: 8 },
      { id: '5310-t-r3-r', x: 635, y: 395, width: 335, height: 66, rx: 8 },
    ],
    seats: [
      // Row 1 (11 PCs: 4 + 3 + 4)
      { seatIndex: 1, x: 44, y: 188, orientation: 'horizontal' },
      { seatIndex: 2, x: 115, y: 188, orientation: 'horizontal' },
      { seatIndex: 3, x: 195, y: 188, orientation: 'horizontal' },
      { seatIndex: 4, x: 273, y: 188, orientation: 'horizontal' },
      { seatIndex: 5, x: 401, y: 188, orientation: 'horizontal' },
      { seatIndex: 6, x: 469, y: 188, orientation: 'horizontal' },
      { seatIndex: 7, x: 535, y: 188, orientation: 'horizontal' },
      { seatIndex: 8, x: 678, y: 188, orientation: 'horizontal' },
      { seatIndex: 9, x: 760, y: 188, orientation: 'horizontal' },
      { seatIndex: 10, x: 848, y: 188, orientation: 'horizontal' },
      { seatIndex: 11, x: 929, y: 188, orientation: 'horizontal' },
      // Row 2 (11 PCs: 4 + 3 + 4)
      { seatIndex: 12, x: 53, y: 290, orientation: 'horizontal' },
      { seatIndex: 13, x: 115, y: 290, orientation: 'horizontal' },
      { seatIndex: 14, x: 195, y: 290, orientation: 'horizontal' },
      { seatIndex: 15, x: 273, y: 290, orientation: 'horizontal' },
      { seatIndex: 16, x: 401, y: 295, orientation: 'horizontal' },
      { seatIndex: 17, x: 469, y: 295, orientation: 'horizontal' },
      { seatIndex: 18, x: 529, y: 295, orientation: 'horizontal' },
      { seatIndex: 19, x: 682, y: 290, orientation: 'horizontal' },
      { seatIndex: 20, x: 764, y: 290, orientation: 'horizontal' },
      { seatIndex: 21, x: 852, y: 290, orientation: 'horizontal' },
      { seatIndex: 22, x: 933, y: 290, orientation: 'horizontal' },
      // Row 3 (8 PCs: 1 + 3 + 4)
      { seatIndex: 23, x: 258, y: 428, orientation: 'horizontal' },
      { seatIndex: 24, x: 401, y: 428, orientation: 'horizontal' },
      { seatIndex: 25, x: 469, y: 428, orientation: 'horizontal' },
      { seatIndex: 26, x: 535, y: 428, orientation: 'horizontal' },
      { seatIndex: 27, x: 682, y: 428, orientation: 'horizontal' },
      { seatIndex: 28, x: 764, y: 428, orientation: 'horizontal' },
      { seatIndex: 29, x: 852, y: 428, orientation: 'horizontal' },
      { seatIndex: 30, x: 933, y: 428, orientation: 'horizontal' },
    ],
  },

  // =========================================================================
  // 11. Room 5403 - Research Lab (21 PCs)
  // Reconstructed from LAB-5403.png (710 x 782)
  // =========================================================================
  '5403': {
    roomNumber: '5403',
    code: 'LAB-5403',
    roomName: 'Research & Advanced Computing Lab',
    viewBox: { width: 710, height: 782 },
    outerWall: { x: 9, y: 38, width: 692, height: 664, rx: 14 },
    fixtures: [
      {
        id: '5403-door',
        type: 'door',
        x: 32,
        y: 38,
        width: 114,
        height: 10,
        label: 'Door',
        extraPath: 'M 32 38 A 75 75 0 0 0 107 113',
      },
      {
        id: '5403-projector',
        type: 'projector',
        x: 200,
        y: 38,
        width: 375,
        height: 8,
        label: 'Projector Screen',
        rx: 2,
      },
      {
        id: '5403-teaching-desk',
        type: 'desk',
        x: 134,
        y: 525,
        width: 64,
        height: 125,
        rx: 10,
        label: 'Faculty Desk',
      },
      {
        id: '5403-chair',
        type: 'chair',
        x: 64,
        y: 567,
        width: 52,
        height: 52,
        label: 'Chair',
      },
      {
        id: '5403-cabinet',
        type: 'cabinet',
        x: 15,
        y: 658,
        width: 680,
        height: 44,
        label: 'Cabinet',
        rx: 6,
      },
    ],
    tables: [
      // Row 1
      { id: '5403-t1-l', x: 10, y: 135, width: 254, height: 65, rx: 8 },
      { id: '5403-t1-r', x: 368, y: 135, width: 322, height: 65, rx: 8 },
      // Row 2
      { id: '5403-t2-l', x: 10, y: 265, width: 254, height: 65, rx: 8 },
      { id: '5403-t2-r', x: 368, y: 265, width: 322, height: 65, rx: 8 },
      // Row 3
      { id: '5403-t3-l', x: 10, y: 405, width: 254, height: 65, rx: 8 },
      { id: '5403-t3-r', x: 368, y: 405, width: 322, height: 65, rx: 8 },
      // Row 4 Right
      { id: '5403-t4-r', x: 368, y: 555, width: 322, height: 65, rx: 8 },
    ],
    seats: [
      // Row 1 (6 PCs: 3 Left + 3 Right)
      { seatIndex: 1, x: 53, y: 165, orientation: 'horizontal' },
      { seatIndex: 2, x: 145, y: 165, orientation: 'horizontal' },
      { seatIndex: 3, x: 233, y: 165, orientation: 'horizontal' },
      { seatIndex: 4, x: 428, y: 165, orientation: 'horizontal' },
      { seatIndex: 5, x: 542, y: 165, orientation: 'horizontal' },
      { seatIndex: 6, x: 645, y: 165, orientation: 'horizontal' },
      // Row 2 (6 PCs: 3 Left + 3 Right)
      { seatIndex: 7, x: 53, y: 295, orientation: 'horizontal' },
      { seatIndex: 8, x: 137, y: 295, orientation: 'horizontal' },
      { seatIndex: 9, x: 223, y: 295, orientation: 'horizontal' },
      { seatIndex: 10, x: 428, y: 295, orientation: 'horizontal' },
      { seatIndex: 11, x: 535, y: 295, orientation: 'horizontal' },
      { seatIndex: 12, x: 645, y: 295, orientation: 'horizontal' },
      // Row 3 (6 PCs: 3 Left + 3 Right)
      { seatIndex: 13, x: 53, y: 435, orientation: 'horizontal' },
      { seatIndex: 14, x: 136, y: 435, orientation: 'horizontal' },
      { seatIndex: 15, x: 223, y: 435, orientation: 'horizontal' },
      { seatIndex: 16, x: 428, y: 435, orientation: 'horizontal' },
      { seatIndex: 17, x: 534, y: 435, orientation: 'horizontal' },
      { seatIndex: 18, x: 645, y: 435, orientation: 'horizontal' },
      // Row 4 (3 PCs: Right Desk)
      { seatIndex: 19, x: 428, y: 585, orientation: 'horizontal' },
      { seatIndex: 20, x: 535, y: 585, orientation: 'horizontal' },
      { seatIndex: 21, x: 645, y: 585, orientation: 'horizontal' },
    ],
  },
};

/**
 * Helper to resolve the reconstructed SVG room layout configuration for any lab code or room number.
 */
export function getReconstructedRoomLayout(roomNumberOrCode: string): LabRoomLayout | null {
  const clean = roomNumberOrCode.trim().toUpperCase().replace(/^LAB-/, '');
  if (RECONSTRUCTED_LAB_LAYOUTS[clean]) {
    return RECONSTRUCTED_LAB_LAYOUTS[clean];
  }
  // Search by code
  for (const layout of Object.values(RECONSTRUCTED_LAB_LAYOUTS)) {
    if (layout.code === roomNumberOrCode.toUpperCase() || layout.roomNumber === clean) {
      return layout;
    }
  }
  return null;
}
