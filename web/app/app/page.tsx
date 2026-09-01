"use client";

import { useEffect, useState, useCallback } from "react";
import { createWalletClient, createPublicClient, custom, http, encodeFunctionData, formatUnits, erc20Abi } from "viem";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { Wallet, Droplet, ArrowUpRight, Check, Loader2, ExternalLink } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API || "http://localhost:8080";
const TUSDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E";
const AGENT = "0xe2cB03B9BeC91eCf0dBf8645499ccF02c3727ab9";
const CHAIN_HEX = "0xc488";

const FAUCET_ABI = [{ name: "faucet", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] }];

function label(s) {
  if (s >= 86400) return s / 86400 + "d";
  if (s >= 3600) return s / 3600 + "h";
  return s / 60 + "m";
}

function clock(iso) {
  var left = Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
  var h = Math.floor(left / 3600);
  var m = Math.floor((left % 3600) / 60);
  var sec = left % 60;
  if (h > 0) return h + "h " + String(m).padStart(2, "0") + "m";
  return m + ":" + String(sec).padStart(2, "0");
}

export default function AppPage() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [windows, setWindows] = useState([]);
  const [sel, setSel] = useState(null);
  const [amount, setAmount] = useState("10");
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const [positions, setPositions] = useState([]);
  const [agent, setAgent] = useState([]);
  const [, force] = useState(0);

  const pub = useCallback(function () {
    return createPublicClient({ chain: somniaShannon, transport: http() });
  }, []);

  useEffect(function () {
    var t = setInterval(function () { force(function (n) { return n + 1; }); }, 1000);
    return function () { clearInterval(t); };
  }, []);

  useEffect(function () {
    var alive = true;
    function load() {
      fetch(API + "/windows?t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!alive || !j.windows) return;
          setWindows(j.windows);
          setSel(function (s) {
            if (s && j.windows.some(function (w) { return w.symbol === s.symbol; })) return s;
            return j.windows[0] || null;
          });
        })
        .catch(function () {});
    }
    load();
    var i = setInterval(load, 12000);
    return function () { alive = false; clearInterval(i); };
  }, []);

  useEffect(function () {
    if (!sel || !amount) { setQuote(null); return; }
    var alive = true;
    var t = setTimeout(function () {
      fetch(API + "/quote?asset=" + sel.asset + "&intervalSec=" + sel.intervalSec + "&cover=" + amount + "&t=" + Date.now(), { cache: "no-store" })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (alive) setQuote(j.error ? null : j); })
        .catch(function () {});
    }, 350);
    return function () { alive = false; clearTimeout(t); };
  }, [sel, amount]);

  const refresh = useCallback(function (addr) {
    if (!addr) return;
    pub().readContract({ address: TUSDC, abi: erc20Abi, functionName: "balanceOf", args: [addr] })
      .then(function (b) { setBalance(formatUnits(b, 6)); }).catch(function () {});
    fetch(API + "/status/" + addr + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { setPositions(j.positions || []); }).catch(function () {});
  }, [pub]);

  useEffect(function () {
    fetch(API + "/status/" + AGENT + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (j) { setAgent((j.positions || []).slice(0, 6)); }).catch(function () {});
  }, []);

  async function connect() {
    if (!window.ethereum) { setMsg({ bad: true, text: "No wallet found. Install MetaMask." }); return; }
    setBusy("connect");
    try {
      var accts = await window.ethereum.request({ method: "eth_requestAccounts" });
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
      } catch (e) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: CHAIN_HEX,
            chainName: "Somnia Shannon",
            nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
            rpcUrls: ["https://api.infra.testnet.somnia.network/"],
            blockExplorerUrls: ["https://shannon-explorer.somnia.network/"],
          }],
        });
      }
      setAccount(accts[0]);
      refresh(accts[0]);
    } catch (e) { setMsg({ bad: true, text: (e && e.shortMessage) || (e && e.message) || String(e) }); }
    setBusy("");
  }

  async function mint() {
    if (!account) return;
    setBusy("faucet"); setMsg(null);
    try {
      var wc = createWalletClient({ account: account, chain: somniaShannon, transport: custom(window.ethereum) });
      var hash = await wc.sendTransaction({
        to: TUSDC,
        data: encodeFunctionData({ abi: FAUCET_ABI, functionName: "faucet", args: [10000n * 1000000n] }),
        gas: 5000000n,
      });
      await pub().waitForTransactionReceipt({ hash: hash });
      setMsg({ text: "Minted 10,000 tUSDC" });
      refresh(account);
    } catch (e) { setMsg({ bad: true, text: (e && e.shortMessage) || (e && e.message) || String(e) }); }
    setBusy("");
  }

  async function cover() {
    if (!account || !sel) return;
    setBusy("cover"); setMsg(null);
    try {
      var r = await fetch(API + "/cover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ asset: sel.asset, intervalSec: sel.intervalSec, cover: Number(amount), walletAddress: account }),
      });
      var body = await r.json();
      if (!r.ok) { setMsg({ bad: true, text: body.error || "quote failed" }); setBusy(""); return; }
      var wc = createWalletClient({ account: account, chain: somniaShannon, transport: custom(window.ethereum) });
      var last = null;
      for (var i = 0; i < body.transactions.length; i++) {
        var tx = body.transactions[i];
        setBusy(tx.tag);
        last = await wc.sendTransaction({ to: tx.to, data: tx.data, value: BigInt(tx.value), gas: 5000000n });
        await pub().waitForTransactionReceipt({ hash: last });
      }
      setMsg({ text: "Covered " + body.quote.contracts + " contracts for " + body.quote.cost + " tUSDC", hash: last });
      refresh(account);
    } catch (e) { setMsg({ bad: true, text: (e && e.shortMessage) || (e && e.message) || String(e) }); }
    setBusy("");
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[1160px] items-center justify-between px-[clamp(20px,5vw,48px)] py-5">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-7 w-7" />
            <span className="font-display text-[18px] tracking-[-0.03em]">Floor</span>
          </a>
          <div className="flex items-center gap-2">
            {account ? (
              <>
                <button onClick={mint} disabled={busy !== ""} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[13px] disabled:opacity-50">
                  {busy === "faucet" ? <Loader2 size={13} className="animate-spin" /> : <Droplet size={13} />} Faucet
                </button>
                <span className="rounded-full border border-line px-4 py-2.5 font-mono text-[12px] text-ink2">
                  {balance ? Number(balance).toFixed(2) + " tUSDC" : "..."}
                </span>
                <span className="rounded-full bg-white/[0.06] px-4 py-2.5 font-mono text-[12px]">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </>
            ) : (
              <button onClick={connect} disabled={busy !== ""} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-bg disabled:opacity-50">
                {busy === "connect" ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />} Connect wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1160px] px-[clamp(20px,5vw,48px)] py-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">

          <div className="min-w-0 rounded-[18px] border border-line bg-card p-[26px]">
            <div className="mono-label text-ink3">Open windows</div>
            <div className="mt-4 space-y-2">
              {windows.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-ink3">Waiting for the API...</div>
              ) : windows.map(function (win) {
                var active = sel && sel.symbol === win.symbol;
                return (
                  <button key={win.symbol} onClick={function () { setSel(win); }}
                    className={"flex w-full items-center justify-between rounded-[10px] border px-4 py-3 text-left transition " + (active ? "border-ink/30 bg-white/[0.05]" : "border-line hover:border-ink/20")}>
                    <span className="flex items-center gap-2.5">
                      <span className="font-display text-[15px]">{win.asset}</span>
                      <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-ink3">{label(win.intervalSec)}</span>
                    </span>
                    <span className="font-mono text-[12px] tabular-nums text-ink2">{clock(win.expiresAt)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-[18px] border border-line bg-card p-[26px]">
            <div className="mono-label text-ink3">Get coverage</div>

            <div className="mt-4">
              <label className="small text-ink2">Cover amount (tUSDC)</label>
              <input value={amount} onChange={function (e) { setAmount(e.target.value.replace(/[^0-9.]/g, "")); }}
                inputMode="decimal"
                className="mt-2 w-full rounded-[10px] border border-line bg-transparent px-4 py-3 font-mono text-[18px] outline-none focus:border-ink/40" />
              <div className="mt-2 flex gap-2">
                {["5", "10", "25", "50"].map(function (v) {
                  return <button key={v} onClick={function () { setAmount(v); }} className="rounded-full border border-line px-3 py-1 text-[11px] text-ink2 hover:border-ink/30">{v}</button>;
                })}
              </div>
            </div>

            {quote && quote.fillable ? (
              <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-line">
                <div className="bg-bg px-4 py-3"><div className="mono-label text-ink3">Premium</div><div className="mt-1 font-mono text-[17px]">{quote.cost.toFixed(2)}</div></div>
                <div className="bg-bg px-4 py-3"><div className="mono-label text-ink3">Pays if down</div><div className="mt-1 font-mono text-[17px]">{quote.payoutIfDown.toFixed(2)}</div></div>
                <div className="bg-bg px-4 py-3"><div className="mono-label text-ink3">Down price</div><div className="mt-1 font-mono text-[17px]">{quote.avgPrice.toFixed(3)}</div></div>
                <div className="bg-bg px-4 py-3"><div className="mono-label text-ink3">Worst case</div><div className="mt-1 font-mono text-[17px]">-{quote.maxLoss.toFixed(2)}</div></div>
              </div>
            ) : (
              <div className="mt-5 rounded-[10px] border border-line px-4 py-6 text-center text-[12px] text-ink3">
                {quote ? "Not enough depth for that amount" : "Pricing the book..."}
              </div>
            )}

            <button onClick={cover} disabled={!account || !quote || !quote.fillable || busy !== ""}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-[14px] font-medium text-bg transition disabled:opacity-40">
              {busy === "cover" || busy === "approve" || busy === "cover" ? <Loader2 size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
              {!account ? "Connect wallet first" : busy ? "Signing " + busy + "..." : "Get coverage"}
            </button>

            {msg ? (
              <div className={"mt-3 flex items-start gap-2 rounded-[10px] border px-4 py-3 text-[12px] " + (msg.bad ? "border-line text-ink2" : "border-ink/20 text-ink")}>
                {msg.bad ? null : <Check size={14} className="mt-0.5 shrink-0" />}
                <span className="min-w-0 break-words">{String(msg.text).slice(0, 200)}</span>
              </div>
            ) : null}

            {(function () {
              if (!sel) return null;
              var held = positions.filter(function (x) {
                return x.side === "DOWN" && x.status === "Trading" && x.asset === sel.asset && x.interval === label(sel.intervalSec);
              });
              if (held.length === 0) return null;
              var n = held.reduce(function (a, x) { return a + Number(x.contracts || 0); }, 0);
              return (
                <div className="mt-3 rounded-[10px] border border-line px-4 py-3 text-[12px] text-ink2">
                  You already hold {n} contracts on this window. Buying again adds to it.
                </div>
              );
            })()}

            <p className="small mt-4 text-ink3">
              Floor returns an unsigned transaction. You sign it. Coverage lasts until this window closes.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="min-w-0 rounded-[18px] border border-line bg-card p-[26px]">
            <div className="mono-label text-ink3">Your positions</div>
            <div className="mt-4 space-y-2">
              {positions.length === 0 ? (
                <div className="py-6 text-center text-[12px] text-ink3">{account ? "No positions yet" : "Connect to see positions"}</div>
              ) : positions.slice(0, 8).map(function (p, i) {
                return (
                  <div key={i} className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px]">{p.asset} {p.interval}</span>
                      <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-ink3">{p.side}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[12px]">{p.contracts}</span>
                      <span className="text-[11px] text-ink3">{p.status === "Trading" ? "open" : p.won === true ? "won" : p.won === false ? "lost" : "settled"}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 rounded-[18px] border border-line bg-card p-[26px]">
            <div className="flex items-center justify-between">
              <div className="mono-label text-ink3">The roll agent</div>
              <a href={"https://shannon-explorer.somnia.network/address/" + AGENT} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-ink3 hover:text-ink2">
                on chain <ExternalLink size={11} />
              </a>
            </div>
            <p className="small mt-3 text-ink2">
              Floor runs a rolling policy from its own key: it covers a window, reopens on the successor, and redeems what settles.
            </p>
            <div className="mt-4 space-y-2">
              {agent.length === 0 ? (
                <div className="py-4 text-center text-[12px] text-ink3">No agent activity loaded</div>
              ) : agent.map(function (p, i) {
                return (
                  <div key={i} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                    <span className="text-[12px] text-ink2">{p.asset} {p.interval}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[11px]">{p.contracts}</span>
                      <span className="text-[11px] text-ink3">{p.status === "Trading" ? "covering" : p.won ? "won" : "expired"}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="small mt-4 text-ink3">
              Per-user delegated rolling is not live: collateral allowances and vaults are per-pool, and pools are recycled each window, so an operator grant alone cannot fund the next one.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
