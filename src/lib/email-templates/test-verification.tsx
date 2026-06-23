import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  recipient?: string
  triggeredAt?: string
}

const Email = ({ recipient, triggeredAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>BSpot AI email infrastructure test</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Email delivery test ✓</Heading>
        <Text style={text}>
          If you are reading this, the BSpot AI transactional email pipeline is
          working end-to-end via <strong>notify.bspot.info</strong>.
        </Text>
        <Text style={text}>
          Recipient: <strong>{recipient ?? 'unknown'}</strong>
        </Text>
        <Text style={text}>
          Sent at: <strong>{triggeredAt ?? new Date().toISOString()}</strong>
        </Text>
        <Text style={muted}>
          This is a one-off diagnostic email triggered from the admin console.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'BSpot AI — Email delivery test',
  displayName: 'Test Verification',
  previewData: { recipient: 'you@example.com', triggeredAt: new Date().toISOString() },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '22px', margin: '8px 0' }
const muted = { fontSize: '12px', color: '#64748b', marginTop: '16px' }
