import React from 'react'
import { Section } from '../Sections/Section'
import { AdminConsole } from './AdminConsole'

export const SystemController = () => {
  return (
    <Section title="Game Name" minimizable={false} close={() => 0} style={{width: "100%", height: "100%"}}>
        <Section title="System Map" />
        <Section title="Active Battles" />
        <Section title="Economy" />
        <Section title="Planet Maps" />
        <AdminConsole />
    </Section>
    )
}
