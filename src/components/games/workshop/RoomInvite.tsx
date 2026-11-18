"use client";
import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import "../spark/spark.css";
export default function RoomInvite({
  code,
  joinPath,
  name,
}: {
  code: string;
  joinPath: string;
  name: string;
}) {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  const [copied, setCopied] = useState(false);
  const largeTicket = useRef<HTMLDialogElement>(null);
  const link = base + joinPath + "?room=" + code;
  return (
    <section className="sc-invite" aria-label="Join this game">
      {base && (
        <div className="sc-qr">
          <QRCodeSVG
            value={link}
            size={160}
            level="M"
            marginSize={4}
            title={`Scan to join ${name}`}
          />
        </div>
      )}
      <div>
        <small>Player tickets</small>
        <h3>Scan to take a seat</h3>
        <p>
          Or open{" "}
          <a href={joinPath}>
            {base.replace(/^https?:\/\//, "")}
            {joinPath}
          </a>{" "}
          and enter
        </p>
        <strong className="sc-code">{code}</strong>
        <button
          type="button"
          className="sc-enlarge"
          onClick={() => largeTicket.current?.showModal()}
        >
          Enlarge QR for the room
        </button>
        <dialog
          ref={largeTicket}
          className="sc-projection"
          aria-label="Projected room invitation"
        >
          <h2>Join {name}</h2>
          <QRCodeSVG
            value={link}
            size={500}
            marginSize={4}
            level="M"
            title="Scan the projected invitation"
          />
          <p>
            {base.replace(/^https?:\/\//, "")}
            {joinPath}
          </p>
          <strong className="sc-code">{code}</strong>
          <button type="button" onClick={() => largeTicket.current?.close()}>
            Back to host board
          </button>
        </dialog>
        <button
          type="button"
          className="sc-link"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setCopied(true);
            } catch {
              window.prompt("Copy the room link", link);
            }
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
          {copied ? "Invite link copied" : "Copy invite link"}
        </button>
      </div>
    </section>
  );
}
