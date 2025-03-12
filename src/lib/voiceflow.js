export const LoadVoiceFlowAgent = () => {
  ;(function (d, t) {
    var v = d.createElement(t),
      s = d.getElementsByTagName(t)[0]
    v.onload = function () {
      window.voiceflow.chat.load({
        verify: { projectID: process.env.NEXT_PUBLIC_VOICE_FLOW_KEY },
        url: 'https://general-runtime.voiceflow.com',
        versionID: 'production',
      })
    }
    v.src = 'https://cdn.voiceflow.com/widget/bundle.mjs'
    v.type = 'text/javascript'
    s.parentNode.insertBefore(v, s)
  })(document, 'script')
}

