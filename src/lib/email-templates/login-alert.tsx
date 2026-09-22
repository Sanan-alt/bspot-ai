import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  recipient?: string
  device?: string
  signedInAt?: string
}

const Email = ({ recipient, device, signedInAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New sign-in to your BSpot AI account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>BSPOT.AI</Text>
        <Heading style={h1}>New sign-in detected</Heading>
        <Text style={text}>
          Your BSpot AI account{recipient ? <> (<strong>{recipient}</strong>)</> : null} was just
          signed in from a device we haven't seen before.
        </Text>
        <Text style={text}>
          Device: <strong>{device ?? 'Unknown device'}</strong>
          <br />
          Time: <strong>{signedInAt ?? new Date().toISOString()}</strong>
        </Text>
        <Text style={text}>
          If this was you, no action is needed. If it wasn't,{' '}
          <Link href="https://www.bspot.info/app/settings" style={link}>
            change your password immediately
          </Link>{' '}
          and turn on two-factor authentication.
        </Text>
        <Hr style={hr} />
        <Text style={muted}>Security alerts are sent for new devices only.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'New sign-in to your BSpot AI account',
  displayName: 'Login Alert',
  previewData: {
    recipient: 'you@example.com',
    device: 'Chrome on Windows',
    signedInAt: new Date().toISOString(),
  },
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
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '22px', margin: '10px 0' }
const link = { color: '#0f9d58', textDecoration: 'underline' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const muted = { fontSize: '12px', color: '#64748b', margin: '6px 0' }

export default Email
