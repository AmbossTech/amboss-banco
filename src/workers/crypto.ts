import { Wollet } from "lwk_wasm";
import { WorkerMessageT, CryptoWorkConfigT, PSET } from "./types";

// Define pricesWs at the top-level scope of the worker
let pricesWs: WebSocket | null = null;

async function start(base64: string) {
  const { Network, Signer, Mnemonic, Pset } = await import("lwk_wasm");

  const mnemonic = "";

  const network = Network.mainnet();

  const signer = new Signer(new Mnemonic(mnemonic), network);
  const wolletDescriptor = signer.wpkhSlip77Descriptor();

  const psetFromBase64 = new Pset(base64);
  const signedPset = signer.sign(psetFromBase64);

  const wollet = new Wollet(network, wolletDescriptor);

  const finalizedPset = wollet.finalize(signedPset);

  console.log(finalizedPset.toString());

  //   return finalizedPset.toString();
}

self.onmessage = async (e) => {
  const BASE_URL = "wss://ws.coincap.io/prices";

  //   const { Network, Signer, Mnemonic } = await import("lwk_wasm");

  switch (e.data.type) {
    case "sign": {
      const message: WorkerMessageT<PSET> = e.data;

      if (!!message.payload?.data.base64) {
        start(message.payload.data.base64);
      }

      break;
    }

    case "init":
      const message: WorkerMessageT<CryptoWorkConfigT> = e.data;

      // Initialize the WebSocket connection
      pricesWs = new WebSocket(
        `${BASE_URL}?assets=${message.payload?.data.assets}`
      );

      const initSubscription = () => {
        pricesWs?.addEventListener("message", function (event) {
          self.postMessage(JSON.parse(event.data));
        });
      };

      initSubscription();

      break;

    case "stop":
      // Safely close the WebSocket if it's open
      if (pricesWs) {
        console.log("Closing WebSocket connection...", pricesWs);
        pricesWs.close();
        pricesWs = null; // Clear the reference after closing
      }
      break;

    case "error":
      // Handle error, possibly closing WebSocket
      if (pricesWs) {
        pricesWs.close();
        pricesWs = null; // Ensure clean up on error
      }
      // Implement additional error handling logic here

      console.log("WEB WORKER ERROR", e);

      break;

    default:
      // Handle any cases that are not explicitly mentioned
      console.error("Unhandled message type:", e.data.type);
  }
};
