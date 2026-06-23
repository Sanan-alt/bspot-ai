import type { ComponentType } from 'react'
import { template as testVerificationTemplate } from './test-verification'
import { template as appNotificationTemplate } from './app-notification'
import { template as receiptTemplate } from './receipt'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'test-verification': testVerificationTemplate,
  'app-notification': appNotificationTemplate,
  'receipt': receiptTemplate,
}
