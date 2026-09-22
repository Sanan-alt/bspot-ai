import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  recipient?: string
  credits?: number
}

const Email = ({ recipient, credits = 100 }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your BSpot AI account is live — {credits} credits unlocked</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>BSPOT.AI</Text>
        <Heading style={h1}>Welcome aboard 🎉</Heading>
        <Text style={text}>
          Your email is confirmed and your BSpot AI account is fully active
          {recipient ? <> for <strong>{recipient}</strong></> : null}.
        </Text>
        <Text style={text}>
          <strong>{credits} free credits</strong> have been added to your balance. Use them to
          explore country intelligence, live markets, visa programs and your AI relocation
          roadmap.
        </Text>
        <Button style={button} href="https://www.bspot.info/app">
          Open your dashboard
        </Button>
        <Hr style={hr} />
        <Text style={muted}>
          Running low? We top your balance up with 5 free credits every 24 hours.
        </Text>
        <Text style={muted}>You received this email because you created a BSpot AI account.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Welcome to BSpot AI — your credits are ready',
  displayName: 'Welcome',
  previewData: { recipient: 'you@example.com', credits: 100 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const brand = {
  fontSize: '12px',
  letterSpacing: '4px',
  color: '#0f9d58',
  fontWeight: 'bold' as const,
  margin: '0 0 12px',
}
const h1 = { fontSize: '24px', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '22px', margin: '10px 0' }
const button = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '16px 0',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const muted = { fontSize: '12px', color: '#64748b', margin: '6px 0' }

export default Email
