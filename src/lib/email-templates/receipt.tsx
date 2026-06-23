import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  recipient?: string
  orderId?: string
  packLabel?: string
  credits?: number
  amount?: string
  currency?: string
  purchasedAt?: string
}

const Email = ({
  orderId,
  packLabel,
  credits,
  amount,
  currency,
  purchasedAt,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your BSpot AI receipt</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thanks for your purchase</Heading>
        <Text style={text}>Here is your BSpot AI receipt.</Text>
        <Section style={card}>
          <Row><Text style={kv}><strong>Order:</strong> {orderId ?? '—'}</Text></Row>
          <Row><Text style={kv}><strong>Pack:</strong> {packLabel ?? '—'}</Text></Row>
          <Row><Text style={kv}><strong>Credits:</strong> {credits ?? 0}</Text></Row>
          <Row><Text style={kv}><strong>Amount:</strong> {amount ?? '0'} {currency ?? 'PKR'}</Text></Row>
          <Row><Text style={kv}><strong>Date:</strong> {purchasedAt ?? new Date().toISOString()}</Text></Row>
        </Section>
        <Hr />
        <Text style={muted}>
          Questions? Email bspot.ai.official@gmail.com.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d) => `BSpot AI receipt — Order ${d.orderId ?? ''}`.trim(),
  displayName: 'Purchase Receipt',
  previewData: {
    orderId: 'ord_demo_123',
    packLabel: 'Starter Pack',
    credits: 500,
    amount: '1,500',
    currency: 'PKR',
    purchasedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '22px', margin: '8px 0' }
const card = { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const kv = { fontSize: '13px', color: '#0f172a', margin: '4px 0' }
const muted = { fontSize: '12px', color: '#64748b', marginTop: '16px' }
