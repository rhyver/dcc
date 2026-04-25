import { RPCLink } from '@orpc/client/message-port'
import { createORPCClient } from '@orpc/client'
const { port1: clientPort, port2: serverPort } = new MessageChannel()
import { router, RouterClient } from '@dcc/api'

window.postMessage('start-orpc-client', '*', [serverPort])

const link = new RPCLink({
  port: clientPort
})

clientPort.start()
const client: RouterClient<typeof router> = createORPCClient(link)

export default function App(): React.JSX.Element {
  return (
    <>
      <div className="creator">Powered by electron-vite</div>
      <div className="text">Document window</div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={() => client.ping({ start: new Date() })}>
            Send oRPC
          </a>
        </div>
      </div>
    </>
  )
}
