'use client'
import React, { useEffect } from 'react'
import { LoadVoiceFlowAgent } from '@/lib/voiceflow'

type Props = {}

const VoiceFlowAgent = (props: Props) => {
  useEffect(() => {
    LoadVoiceFlowAgent()
  }, [])
  return <></>
}

export default VoiceFlowAgent
