import { SettingsService } from './settings.service';
import { logger } from '../../common/utils/logger';

export interface StockCheckResult {
  isLowStock: boolean;
  currentStock: number;
  threshold: number;
  warning?: string;
}

/**
 * Evaluates whether an inventory stock count has breached the configurable low-stock threshold.
 * Reads dynamically from Setting collection with env fallback.
 */
export async function evaluateStockLevel(currentStock: number, itemName?: string): Promise<StockCheckResult> {
  const threshold = await SettingsService.getLowStockThreshold();
  const isLowStock = currentStock <= threshold;

  if (isLowStock) {
    logger.warn(
      `Inventory low stock alert for ${itemName || 'item'}: current stock (${currentStock}) is at or below threshold (${threshold})`
    );
  }

  return {
    isLowStock,
    currentStock,
    threshold,
    warning: isLowStock
      ? `Stock level (${currentStock}) is at or below the institutional threshold of ${threshold}. Please reorder.`
      : undefined,
  };
}
