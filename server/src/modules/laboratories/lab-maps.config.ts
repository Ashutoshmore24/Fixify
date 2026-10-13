export interface HotspotDefinition {
  hotspotId: string;
  x: number; // Normalized percentage (0 - 100)
  y: number; // Normalized percentage (0 - 100)
  width?: number; // Normalized width % (default: 4%)
  height?: number; // Normalized height % (default: 4%)
  pcIndex: number; // 1-based index corresponding to PC-01, PC-02, etc.
  label?: string; // e.g. "Workstation 1"
}

export interface LabMapConfiguration {
  roomNumber: string; // e.g. "5401"
  code: string; // e.g. "LAB-5401"
  roomName: string; // e.g. "Web Development Lab"
  assignedAssistantName: string; // e.g. "Mrs. Shradha Gade"
  assignedAssistantEmail: string; // e.g. "shradha.gade@pccoepune.org"
  hasMap: boolean;
  imageFileName?: string; // e.g. "Lab-5401.png"
  imagePath?: string; // e.g. "/labs/Lab-5401.png"
  dimensions?: {
    width: number;
    height: number;
  };
  totalWorkstations: number;
  hotspots?: HotspotDefinition[];
}

/**
 * Official 12 Laboratory Roster and Visual Layout Hotspot Definitions.
 * Derived from Eraser.io layout diagrams in /labs.
 */
export const OFFICIAL_LAB_ROSTER: LabMapConfiguration[] = [
  // 1. Room 5401 - Web Development Lab - Mrs. Shradha Gade (25 PCs)
  {
    roomNumber: '5401',
    code: 'LAB-5401',
    roomName: 'Web Development Lab',
    assignedAssistantName: 'Mrs. Shradha Gade',
    assignedAssistantEmail: 'shradha.gade@pccoepune.org',
    hasMap: true,
    imageFileName: 'Lab-5401.png',
    imagePath: '/labs/Lab-5401.png',
    dimensions: { width: 912, height: 709 },
    totalWorkstations: 25,
    hotspots: [
      // Row 1 (Y ~ 34.3%)
      { hotspotId: '5401-h01', pcIndex: 1, x: 5.57, y: 34.2, label: 'Row 1 Left - 1' },
      { hotspotId: '5401-h02', pcIndex: 2, x: 14.09, y: 34.44, label: 'Row 1 Left - 2' },
      { hotspotId: '5401-h03', pcIndex: 3, x: 25.05, y: 34.39, label: 'Row 1 Left - 3' },
      { hotspotId: '5401-h04', pcIndex: 4, x: 39.22, y: 34.13, label: 'Row 1 Mid - 1' },
      { hotspotId: '5401-h05', pcIndex: 5, x: 48.85, y: 34.44, label: 'Row 1 Mid - 2' },
      { hotspotId: '5401-h06', pcIndex: 6, x: 58.61, y: 34.39, label: 'Row 1 Mid - 3' },
      { hotspotId: '5401-h07', pcIndex: 7, x: 77.8, y: 34.44, label: 'Row 1 Right - 1' },
      { hotspotId: '5401-h08', pcIndex: 8, x: 89.42, y: 34.44, label: 'Row 1 Right - 2' },
      // Row 2 (Y ~ 52%)
      { hotspotId: '5401-h09', pcIndex: 9, x: 4.73, y: 51.89, label: 'Row 2 Left - 1' },
      { hotspotId: '5401-h10', pcIndex: 10, x: 13.43, y: 52.21, label: 'Row 2 Left - 2' },
      { hotspotId: '5401-h11', pcIndex: 11, x: 25.12, y: 51.89, label: 'Row 2 Left - 3' },
      { hotspotId: '5401-h12', pcIndex: 12, x: 39.42, y: 51.37, label: 'Row 2 Mid - 1' },
      { hotspotId: '5401-h13', pcIndex: 13, x: 48.99, y: 51.97, label: 'Row 2 Mid - 2' },
      { hotspotId: '5401-h14', pcIndex: 14, x: 59.52, y: 51.97, label: 'Row 2 Mid - 3' },
      { hotspotId: '5401-h15', pcIndex: 15, x: 74.32, y: 51.97, label: 'Row 2 Right - 1' },
      { hotspotId: '5401-h16', pcIndex: 16, x: 83.3, y: 51.9, label: 'Row 2 Right - 2' },
      { hotspotId: '5401-h17', pcIndex: 17, x: 92.71, y: 52.21, label: 'Row 2 Right - 3' },
      // Row 3 (Y ~ 69.4%)
      { hotspotId: '5401-h18', pcIndex: 18, x: 7.54, y: 69.32, label: 'Row 3 Left - 1' },
      { hotspotId: '5401-h19', pcIndex: 19, x: 22.12, y: 69.25, label: 'Row 3 Left - 2' },
      { hotspotId: '5401-h20', pcIndex: 20, x: 39.97, y: 69.56, label: 'Row 3 Mid - 1' },
      { hotspotId: '5401-h21', pcIndex: 21, x: 49.75, y: 69.25, label: 'Row 3 Mid - 2' },
      { hotspotId: '5401-h22', pcIndex: 22, x: 60.65, y: 69.24, label: 'Row 3 Mid - 3' },
      { hotspotId: '5401-h23', pcIndex: 23, x: 74.32, y: 69.32, label: 'Row 3 Right - 1' },
      { hotspotId: '5401-h24', pcIndex: 24, x: 83.94, y: 69.51, label: 'Row 3 Right - 2' },
      { hotspotId: '5401-h25', pcIndex: 25, x: 93.54, y: 69.24, label: 'Row 3 Right - 3' },
    ],
  },

  // 2. Room 5402 - Foss Lab - Mr. Nitin Kurwar (27 PCs)
  {
    roomNumber: '5402',
    code: 'LAB-5402',
    roomName: 'Foss Lab',
    assignedAssistantName: 'Mr. Nitin Kurwar',
    assignedAssistantEmail: 'nitin.kurwar@pccoepune.org',
    hasMap: true,
    imageFileName: 'LAB-5402.png',
    imagePath: '/labs/LAB-5402.png',
    dimensions: { width: 859, height: 783 },
    totalWorkstations: 27,
    hotspots: [
      // Left vertical column (5 PCs)
      { hotspotId: '5402-h01', pcIndex: 1, x: 12.2, y: 26.0, label: 'Left Col 1' },
      { hotspotId: '5402-h02', pcIndex: 2, x: 12.2, y: 36.8, label: 'Left Col 2' },
      { hotspotId: '5402-h03', pcIndex: 3, x: 12.2, y: 46.8, label: 'Left Col 3' },
      { hotspotId: '5402-h04', pcIndex: 4, x: 12.2, y: 57.8, label: 'Left Col 4' },
      { hotspotId: '5402-h05', pcIndex: 5, x: 12.2, y: 69.6, label: 'Left Col 5' },
      // Center Row 1 (5 PCs)
      { hotspotId: '5402-h06', pcIndex: 6, x: 29.8, y: 31.4, label: 'Center Row 1 - 1' },
      { hotspotId: '5402-h07', pcIndex: 7, x: 39.5, y: 31.4, label: 'Center Row 1 - 2' },
      { hotspotId: '5402-h08', pcIndex: 8, x: 48.7, y: 31.4, label: 'Center Row 1 - 3' },
      { hotspotId: '5402-h09', pcIndex: 9, x: 58.9, y: 31.4, label: 'Center Row 1 - 4' },
      { hotspotId: '5402-h10', pcIndex: 10, x: 69.8, y: 31.4, label: 'Center Row 1 - 5' },
      // Center Row 2 (5 PCs)
      { hotspotId: '5402-h11', pcIndex: 11, x: 29.8, y: 50.1, label: 'Center Row 2 - 1' },
      { hotspotId: '5402-h12', pcIndex: 12, x: 39.5, y: 50.1, label: 'Center Row 2 - 2' },
      { hotspotId: '5402-h13', pcIndex: 13, x: 48.7, y: 50.1, label: 'Center Row 2 - 3' },
      { hotspotId: '5402-h14', pcIndex: 14, x: 58.9, y: 50.1, label: 'Center Row 2 - 4' },
      { hotspotId: '5402-h15', pcIndex: 15, x: 69.8, y: 50.1, label: 'Center Row 2 - 5' },
      // Bottom Row (7 PCs)
      { hotspotId: '5402-h16', pcIndex: 16, x: 21.1, y: 71.4, label: 'Bottom Row - 1' },
      { hotspotId: '5402-h17', pcIndex: 17, x: 29.5, y: 71.4, label: 'Bottom Row - 2' },
      { hotspotId: '5402-h18', pcIndex: 18, x: 38.3, y: 71.4, label: 'Bottom Row - 3' },
      { hotspotId: '5402-h19', pcIndex: 19, x: 48.3, y: 71.4, label: 'Bottom Row - 4' },
      { hotspotId: '5402-h20', pcIndex: 20, x: 56.7, y: 71.4, label: 'Bottom Row - 5' },
      { hotspotId: '5402-h21', pcIndex: 21, x: 65.8, y: 71.4, label: 'Bottom Row - 6' },
      { hotspotId: '5402-h22', pcIndex: 22, x: 75.2, y: 71.4, label: 'Bottom Row - 7' },
      // Right vertical column (5 PCs)
      { hotspotId: '5402-h23', pcIndex: 23, x: 87.3, y: 27.1, label: 'Right Col 1' },
      { hotspotId: '5402-h24', pcIndex: 24, x: 87.3, y: 39.2, label: 'Right Col 2' },
      { hotspotId: '5402-h25', pcIndex: 25, x: 87.3, y: 50.6, label: 'Right Col 3' },
      { hotspotId: '5402-h26', pcIndex: 26, x: 87.3, y: 60.9, label: 'Right Col 4' },
      { hotspotId: '5402-h27', pcIndex: 27, x: 87.3, y: 71.4, label: 'Right Col 5' },
    ],
  },

  // 3. Room 5403 - Research Lab - Mr. Nikhil Thorve (Fallback, No PNG yet)
  {
    roomNumber: '5403',
    code: 'LAB-5403',
    roomName: 'Research Lab',
    assignedAssistantName: 'Mr. Nikhil Thorve',
    assignedAssistantEmail: 'nikhil.thorve@pccoepune.org',
    hasMap: false,
    totalWorkstations: 20,
  },

  // 4. Room 5404 - PG Classroom - Mr. Nitin Kurwar (21 PCs)
  {
    roomNumber: '5404',
    code: 'LAB-5404',
    roomName: 'PG Classroom',
    assignedAssistantName: 'Mr. Nitin Kurwar',
    assignedAssistantEmail: 'nitin.kurwar@pccoepune.org',
    hasMap: true,
    imageFileName: 'LAB-5404.png',
    imagePath: '/labs/LAB-5404.png',
    dimensions: { width: 569, height: 501 },
    totalWorkstations: 21,
    hotspots: [
      // Left Tables (4 rows of 3 = 12 PCs)
      { hotspotId: '5404-h01', pcIndex: 1, x: 13.2, y: 22.8, label: 'Left T1 - 1' },
      { hotspotId: '5404-h02', pcIndex: 2, x: 23.0, y: 22.8, label: 'Left T1 - 2' },
      { hotspotId: '5404-h03', pcIndex: 3, x: 36.2, y: 22.8, label: 'Left T1 - 3' },
      { hotspotId: '5404-h04', pcIndex: 4, x: 13.2, y: 40.7, label: 'Left T2 - 1' },
      { hotspotId: '5404-h05', pcIndex: 5, x: 23.0, y: 40.7, label: 'Left T2 - 2' },
      { hotspotId: '5404-h06', pcIndex: 6, x: 36.2, y: 40.7, label: 'Left T2 - 3' },
      { hotspotId: '5404-h07', pcIndex: 7, x: 13.2, y: 58.3, label: 'Left T3 - 1' },
      { hotspotId: '5404-h08', pcIndex: 8, x: 23.0, y: 58.3, label: 'Left T3 - 2' },
      { hotspotId: '5404-h09', pcIndex: 9, x: 36.2, y: 58.3, label: 'Left T3 - 3' },
      { hotspotId: '5404-h10', pcIndex: 10, x: 13.2, y: 74.3, label: 'Left T4 - 1' },
      { hotspotId: '5404-h11', pcIndex: 11, x: 23.0, y: 74.3, label: 'Left T4 - 2' },
      { hotspotId: '5404-h12', pcIndex: 12, x: 36.2, y: 74.3, label: 'Left T4 - 3' },
      // Right Tables (3 rows of 3 = 9 PCs)
      { hotspotId: '5404-h13', pcIndex: 13, x: 62.9, y: 23.4, label: 'Right T1 - 1' },
      { hotspotId: '5404-h14', pcIndex: 14, x: 76.6, y: 23.4, label: 'Right T1 - 2' },
      { hotspotId: '5404-h15', pcIndex: 15, x: 91.7, y: 23.4, label: 'Right T1 - 3' },
      { hotspotId: '5404-h16', pcIndex: 16, x: 63.4, y: 46.5, label: 'Right T2 - 1' },
      { hotspotId: '5404-h17', pcIndex: 17, x: 79.1, y: 46.5, label: 'Right T2 - 2' },
      { hotspotId: '5404-h18', pcIndex: 18, x: 94.4, y: 46.5, label: 'Right T2 - 3' },
      { hotspotId: '5404-h19', pcIndex: 19, x: 62.9, y: 67.5, label: 'Right T3 - 1' },
      { hotspotId: '5404-h20', pcIndex: 20, x: 78.4, y: 67.5, label: 'Right T3 - 2' },
      { hotspotId: '5404-h21', pcIndex: 21, x: 94.4, y: 67.5, label: 'Right T3 - 3' },
    ],
  },

  // 5. Room 5405 - DSA Lab - Mrs. Neha Dike (24 PCs)
  {
    roomNumber: '5405',
    code: 'LAB-5405',
    roomName: 'DSA Lab',
    assignedAssistantName: 'Mrs. Neha Dike',
    assignedAssistantEmail: 'neha.dike@pccoepune.org',
    hasMap: true,
    imageFileName: 'LAB-5405.png',
    imagePath: '/labs/LAB-5405.png',
    dimensions: { width: 696, height: 576 },
    totalWorkstations: 24,
    hotspots: [
      // Left vertical table (4 PCs)
      { hotspotId: '5405-h01', pcIndex: 1, x: 12.2, y: 32.1, label: 'Left Col 1' },
      { hotspotId: '5405-h02', pcIndex: 2, x: 12.2, y: 40.6, label: 'Left Col 2' },
      { hotspotId: '5405-h03', pcIndex: 3, x: 12.2, y: 49.7, label: 'Left Col 3' },
      { hotspotId: '5405-h04', pcIndex: 4, x: 12.2, y: 58.0, label: 'Left Col 4' },
      // Center Row 1 (5 PCs)
      { hotspotId: '5405-h05', pcIndex: 5, x: 31.9, y: 32.1, label: 'Center Row 1 - 1' },
      { hotspotId: '5405-h06', pcIndex: 6, x: 42.1, y: 32.1, label: 'Center Row 1 - 2' },
      { hotspotId: '5405-h07', pcIndex: 7, x: 51.7, y: 32.1, label: 'Center Row 1 - 3' },
      { hotspotId: '5405-h08', pcIndex: 8, x: 61.9, y: 32.1, label: 'Center Row 1 - 4' },
      { hotspotId: '5405-h09', pcIndex: 9, x: 71.1, y: 32.1, label: 'Center Row 1 - 5' },
      // Center Row 2 (5 PCs)
      { hotspotId: '5405-h10', pcIndex: 10, x: 31.9, y: 47.4, label: 'Center Row 2 - 1' },
      { hotspotId: '5405-h11', pcIndex: 11, x: 42.1, y: 47.4, label: 'Center Row 2 - 2' },
      { hotspotId: '5405-h12', pcIndex: 12, x: 51.7, y: 47.4, label: 'Center Row 2 - 3' },
      { hotspotId: '5405-h13', pcIndex: 13, x: 61.9, y: 47.4, label: 'Center Row 2 - 4' },
      { hotspotId: '5405-h14', pcIndex: 14, x: 71.1, y: 47.4, label: 'Center Row 2 - 5' },
      // Bottom Row (6 PCs)
      { hotspotId: '5405-h15', pcIndex: 15, x: 22.1, y: 65.8, label: 'Bottom Row - 1' },
      { hotspotId: '5405-h16', pcIndex: 16, x: 33.2, y: 65.8, label: 'Bottom Row - 2' },
      { hotspotId: '5405-h17', pcIndex: 17, x: 44.3, y: 65.8, label: 'Bottom Row - 3' },
      { hotspotId: '5405-h18', pcIndex: 18, x: 56.3, y: 65.8, label: 'Bottom Row - 4' },
      { hotspotId: '5405-h19', pcIndex: 19, x: 67.5, y: 65.8, label: 'Bottom Row - 5' },
      { hotspotId: '5405-h20', pcIndex: 20, x: 79.2, y: 65.8, label: 'Bottom Row - 6' },
      // Right vertical table (4 PCs)
      { hotspotId: '5405-h21', pcIndex: 21, x: 88.5, y: 32.1, label: 'Right Col 1' },
      { hotspotId: '5405-h22', pcIndex: 22, x: 88.5, y: 40.6, label: 'Right Col 2' },
      { hotspotId: '5405-h23', pcIndex: 23, x: 88.5, y: 49.7, label: 'Right Col 3' },
      { hotspotId: '5405-h24', pcIndex: 24, x: 88.5, y: 58.0, label: 'Right Col 4' },
    ],
  },

  // 6. Room 5406 - IOT Lab - Mr. Nikhil Thorve (20 Student PCs)
  {
    roomNumber: '5406',
    code: 'LAB-5406',
    roomName: 'IOT Lab',
    assignedAssistantName: 'Mr. Nikhil Thorve',
    assignedAssistantEmail: 'nikhil.thorve@pccoepune.org',
    hasMap: true,
    imageFileName: 'LAB-5406.png',
    imagePath: '/labs/LAB-5406.png',
    dimensions: { width: 849, height: 697 },
    totalWorkstations: 20,
    hotspots: [
      // Left vertical table (9 PCs)
      { hotspotId: '5406-h01', pcIndex: 1, x: 5.3, y: 13.6, label: 'IoT Left - 1' },
      { hotspotId: '5406-h02', pcIndex: 2, x: 5.3, y: 20.4, label: 'IoT Left - 2' },
      { hotspotId: '5406-h03', pcIndex: 3, x: 5.3, y: 27.3, label: 'IoT Left - 3' },
      { hotspotId: '5406-h04', pcIndex: 4, x: 5.3, y: 34.1, label: 'IoT Left - 4' },
      { hotspotId: '5406-h05', pcIndex: 5, x: 5.3, y: 41.0, label: 'IoT Left - 5' },
      { hotspotId: '5406-h06', pcIndex: 6, x: 5.3, y: 47.9, label: 'IoT Left - 6' },
      { hotspotId: '5406-h07', pcIndex: 7, x: 5.3, y: 54.8, label: 'IoT Left - 7' },
      { hotspotId: '5406-h08', pcIndex: 8, x: 5.3, y: 61.7, label: 'IoT Left - 8' },
      { hotspotId: '5406-h09', pcIndex: 9, x: 5.3, y: 68.4, label: 'IoT Left - 9' },
      // Right vertical table (11 PCs)
      { hotspotId: '5406-h10', pcIndex: 10, x: 95.1, y: 18.2, label: 'IoT Right - 1' },
      { hotspotId: '5406-h11', pcIndex: 11, x: 95.1, y: 24.5, label: 'IoT Right - 2' },
      { hotspotId: '5406-h12', pcIndex: 12, x: 95.1, y: 30.8, label: 'IoT Right - 3' },
      { hotspotId: '5406-h13', pcIndex: 13, x: 95.1, y: 37.2, label: 'IoT Right - 4' },
      { hotspotId: '5406-h14', pcIndex: 14, x: 95.1, y: 43.5, label: 'IoT Right - 5' },
      { hotspotId: '5406-h15', pcIndex: 15, x: 95.1, y: 49.8, label: 'IoT Right - 6' },
      { hotspotId: '5406-h16', pcIndex: 16, x: 95.1, y: 56.1, label: 'IoT Right - 7' },
      { hotspotId: '5406-h17', pcIndex: 17, x: 95.1, y: 62.5, label: 'IoT Right - 8' },
      { hotspotId: '5406-h18', pcIndex: 18, x: 95.1, y: 68.8, label: 'IoT Right - 9' },
      { hotspotId: '5406-h19', pcIndex: 19, x: 95.1, y: 75.2, label: 'IoT Right - 10' },
      { hotspotId: '5406-h20', pcIndex: 20, x: 95.1, y: 81.5, label: 'IoT Right - 11' },
    ],
  },

  // 7. Room 5302 - Project Lab - Mr. Nitin Gaikwad (Fallback, No PNG yet)
  {
    roomNumber: '5302',
    code: 'LAB-5302',
    roomName: 'Project Lab',
    assignedAssistantName: 'Mr. Nitin Gaikwad',
    assignedAssistantEmail: 'nitin.gaikwad@pccoepune.org',
    hasMap: false,
    totalWorkstations: 20,
  },

  // 8. Room 5305 - Cloud Computing Lab - Mr. Deepak Wankhedkar (Fallback, No PNG yet)
  {
    roomNumber: '5305',
    code: 'LAB-5305',
    roomName: 'Cloud Computing Lab',
    assignedAssistantName: 'Mr. Deepak Wankhedkar',
    assignedAssistantEmail: 'deepak.wankhedkar@pccoepune.org',
    hasMap: false,
    totalWorkstations: 20,
  },

  // 9. Room 5308 - NIS Lab - Mr. Deepak Wankhedkar (Fallback, No PNG yet)
  {
    roomNumber: '5308',
    code: 'LAB-5308',
    roomName: 'NIS Lab',
    assignedAssistantName: 'Mr. Deepak Wankhedkar',
    assignedAssistantEmail: 'deepak.wankhedkar@pccoepune.org',
    hasMap: false,
    totalWorkstations: 20,
  },

  // 10. Room 5309 - OS Lab - Mr. Deepak Wankhedkar (Fallback, No PNG yet)
  {
    roomNumber: '5309',
    code: 'LAB-5309',
    roomName: 'OS Lab',
    assignedAssistantName: 'Mr. Deepak Wankhedkar',
    assignedAssistantEmail: 'deepak.wankhedkar@pccoepune.org',
    hasMap: false,
    totalWorkstations: 20,
  },

  // 11. Room 5310 - DB Lab - Mr. Nitin Gaikwad (Fallback, No PNG yet)
  {
    roomNumber: '5310',
    code: 'LAB-5310',
    roomName: 'DB Lab',
    assignedAssistantName: 'Mr. Nitin Gaikwad',
    assignedAssistantEmail: 'nitin.gaikwad@pccoepune.org',
    hasMap: false,
    totalWorkstations: 20,
  },

  // 12. Room 5311 - ML Lab - Mr. Nitin Gaikwad (31 PCs)
  {
    roomNumber: '5311',
    code: 'LAB-5311',
    roomName: 'ML Lab',
    assignedAssistantName: 'Mr. Nitin Gaikwad',
    assignedAssistantEmail: 'nitin.gaikwad@pccoepune.org',
    hasMap: true,
    imageFileName: 'LAB-5311.png',
    imagePath: '/labs/LAB-5311.png',
    dimensions: { width: 796, height: 573 },
    totalWorkstations: 31,
    hotspots: [
      // Row 1 (Y ~ 36.3%)
      { hotspotId: '5311-h01', pcIndex: 1, x: 6.5, y: 36.3, label: 'Row 1 Left - 1' },
      { hotspotId: '5311-h02', pcIndex: 2, x: 12.8, y: 36.3, label: 'Row 1 Left - 2' },
      { hotspotId: '5311-h03', pcIndex: 3, x: 19.3, y: 36.3, label: 'Row 1 Left - 3' },
      { hotspotId: '5311-h04', pcIndex: 4, x: 25.8, y: 36.3, label: 'Row 1 Left - 4' },
      { hotspotId: '5311-h05', pcIndex: 5, x: 42.6, y: 36.3, label: 'Row 1 Mid - 1' },
      { hotspotId: '5311-h06', pcIndex: 6, x: 49.6, y: 36.3, label: 'Row 1 Mid - 2' },
      { hotspotId: '5311-h07', pcIndex: 7, x: 56.5, y: 36.3, label: 'Row 1 Mid - 3' },
      { hotspotId: '5311-h08', pcIndex: 8, x: 68.0, y: 36.3, label: 'Row 1 Right - 1' },
      { hotspotId: '5311-h09', pcIndex: 9, x: 76.9, y: 36.3, label: 'Row 1 Right - 2' },
      { hotspotId: '5311-h10', pcIndex: 10, x: 86.1, y: 36.3, label: 'Row 1 Right - 3' },
      { hotspotId: '5311-h11', pcIndex: 11, x: 93.3, y: 36.3, label: 'Row 1 Right - 4' },
      // Row 2 (Y ~ 52.5%)
      { hotspotId: '5311-h12', pcIndex: 12, x: 6.5, y: 52.5, label: 'Row 2 Left - 1' },
      { hotspotId: '5311-h13', pcIndex: 13, x: 12.8, y: 52.5, label: 'Row 2 Left - 2' },
      { hotspotId: '5311-h14', pcIndex: 14, x: 19.3, y: 52.5, label: 'Row 2 Left - 3' },
      { hotspotId: '5311-h15', pcIndex: 15, x: 25.8, y: 52.5, label: 'Row 2 Left - 4' },
      { hotspotId: '5311-h16', pcIndex: 16, x: 42.6, y: 52.5, label: 'Row 2 Mid - 1' },
      { hotspotId: '5311-h17', pcIndex: 17, x: 49.6, y: 52.5, label: 'Row 2 Mid - 2' },
      { hotspotId: '5311-h18', pcIndex: 18, x: 56.5, y: 52.5, label: 'Row 2 Mid - 3' },
      { hotspotId: '5311-h19', pcIndex: 19, x: 68.0, y: 52.5, label: 'Row 2 Right - 1' },
      { hotspotId: '5311-h20', pcIndex: 20, x: 76.9, y: 52.5, label: 'Row 2 Right - 2' },
      { hotspotId: '5311-h21', pcIndex: 21, x: 86.1, y: 52.5, label: 'Row 2 Right - 3' },
      { hotspotId: '5311-h22', pcIndex: 22, x: 93.3, y: 52.5, label: 'Row 2 Right - 4' },
      // Row 3 (Y ~ 71.9%)
      { hotspotId: '5311-h23', pcIndex: 23, x: 8.4, y: 71.9, label: 'Row 3 Left - 1' },
      { hotspotId: '5311-h24', pcIndex: 24, x: 24.5, y: 71.9, label: 'Row 3 Left - 2' },
      { hotspotId: '5311-h25', pcIndex: 25, x: 42.6, y: 71.9, label: 'Row 3 Mid - 1' },
      { hotspotId: '5311-h26', pcIndex: 26, x: 49.6, y: 71.9, label: 'Row 3 Mid - 2' },
      { hotspotId: '5311-h27', pcIndex: 27, x: 56.5, y: 71.9, label: 'Row 3 Mid - 3' },
      { hotspotId: '5311-h28', pcIndex: 28, x: 68.0, y: 71.9, label: 'Row 3 Right - 1' },
      { hotspotId: '5311-h29', pcIndex: 29, x: 76.9, y: 71.9, label: 'Row 3 Right - 2' },
      { hotspotId: '5311-h30', pcIndex: 30, x: 86.1, y: 71.9, label: 'Row 3 Right - 3' },
      { hotspotId: '5311-h31', pcIndex: 31, x: 93.3, y: 71.9, label: 'Row 3 Right - 4' },
    ],
  },
];

/**
 * Finds a lab map configuration by room number (e.g. "5401"),
 * laboratory code (e.g. "LAB-5401"), or sanitized code.
 */
export function findLabMapConfig(identifier: string): LabMapConfiguration | undefined {
  if (!identifier) return undefined;
  const cleaned = identifier.toUpperCase().replace(/^LAB-/, '').trim();
  return OFFICIAL_LAB_ROSTER.find(
    (c) =>
      c.roomNumber === cleaned ||
      c.code.toUpperCase() === identifier.toUpperCase() ||
      c.code.toUpperCase() === `LAB-${cleaned}`
  );
}
