"use client";

import { useEffect, useRef, useState } from "react";
import { CryptoWorkConfigT, PSET, WorkerMessageT } from "@/workers/types";

type CryptoDataT = {
  bitcoin: string;
  ethereum: string;
  monero: string;
  litecoin: string;
};

const Page = () => {
  const workerRef = useRef<Worker>();
  const initPrice = "waiting for data...";
  const [status, setStatus] = useState<string>("Stopped");
  const [prices, setPrices] = useState<CryptoDataT>({
    bitcoin: "",
    ethereum: "",
    monero: "",
    litecoin: "",
  });

  useEffect(() => {
    // workerRef.current = new Worker("/workers/crypto.js", {
    //   type: "module",
    // });

    workerRef.current = new Worker(
      new URL("../../workers/crypto.ts", import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      setPrices((prev) => {
        const newState = { ...prev, ...event.data };
        return newState;
      });
    };
    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
    };
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const startWorker = () => {
    setStatus("Running");

    const workerMessage: WorkerMessageT<CryptoWorkConfigT> = {
      type: "init",
      payload: {
        data: {
          assets: "bitcoin,ethereum,monero,litecoin",
        },
      },
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
    }
  };

  const stopWorker = () => {
    setStatus("Stopped");
    const workerMessage: WorkerMessageT<CryptoWorkConfigT> = {
      type: "stop",
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
    }
  };

  const terminateWorker = () => {
    setStatus("Terminated");
    const workerMessage: WorkerMessageT<CryptoWorkConfigT> = {
      type: "stop",
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
      workerRef.current.terminate();
    }
  };

  const signPset = () => {
    const base64 = "";

    const workerMessage: WorkerMessageT<PSET> = {
      type: "sign",
      payload: {
        id: "asd",

        data: { base64 },
      },
    };
    if (workerRef.current) {
      workerRef.current.postMessage(workerMessage);
    }
  };

  return (
    <section>
      <div className="mb-40 gap-12 flex">
        <button onClick={startWorker}>Start Stream</button>
        <button onClick={stopWorker}>Stop stream</button>
        <button onClick={terminateWorker}>Terminate Worker</button>
        <button onClick={signPset}>Sign</button>
      </div>
      <div>
        <h2 className="heading-md mb-12">Stream data: {status}</h2>
        <p className="mb-40 body-sm">
          This page uses a Web Worker to stream cryptocurrency prices from
          CoinCap.io. The worker is started when you click the Start stream
          button and stopped when you click the End stream button.
        </p>
        <div className="gap-12 flex-column">
          {Object.keys(prices).map((key) => {
            const price = prices[key as keyof CryptoDataT];
            return (
              <div key={key}>
                <span className="mr-12 capitalize">{key}:</span>
                <span className={`${!price && "opacity-20"}`}>
                  {price ? "$" + price : initPrice}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Page;
