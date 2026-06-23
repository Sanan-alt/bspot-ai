import * as React from 'react'
import {
  Body,
  Button,
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
  title?: string
  message?: string
  actionUrl?: string
  actionLabel?: string
}

const Email = ({ title, message, actionUrl, actionLabel }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title ?? 'You have a new notification on BSpot AI'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{title ?? 'New notification'}</Heading>
        <Text style={text}>{message ?? 'You have a new update inside BSpot AI.'}</Text>
        {actionUrl ? (
          <Button href={actionUrl} style={btn}>
            {actionLabel ?? 'Open BSpot AI'}
          </Button>
        ) : null}
        <Text style={muted}>BSpot AI · notify.bspot.info</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d) => (d.title as string) ?? 'New notification on BSpot AI',
  displayName: 'App Notification',
  previewData: {
    title: 'Your dossier is ready',
    message: 'Your latest country dossier just finished generating.',
    actionUrl: 'https://bspot.info/app/notifications',
    actionLabel: 'View notification',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#334155', lineHeight: '22px', margin: '8px 0' }
const btn = {
  backgroundColor: '#22d3ee',
  color: '#0b0f1a',
  padding: '10px 18px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: 600,
  marginTop: '12px',
}
const muted = { fontSize: '12px', color: '#64748b', marginTop: '24px' }
