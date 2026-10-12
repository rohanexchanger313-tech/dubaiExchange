"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";

const RATE_BASELINE = 3.75;
const MAX_AMOUNT = 1_000_000;

type PaymentMethod = "Bank transfer" | "STC Pay" | "urpay" | "Another method";
type PaymentDetails = {
  bankName: string;
  iban: string;
  accountHolder: string;
  mobileNumber: string;
  otherMethod: string;
};

const paymentMethods: {
  name: PaymentMethod;
  description: string;
  icon: ReactNode;
}[] = [
  {
    name: "Bank transfer",
    description: "Local Saudi bank account",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M5 15 20 7l15 8H5ZM8 18h4v13H8zm10 0h4v13h-4zm10 0h4v13h-4zM5 34h30"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "STC Pay",
    description: "Mobile wallet transfer",
    icon: <span className="mobile-icon" aria-hidden="true">▯</span>,
  },
  {
    name: "urpay",
    description: "Mobile wallet transfer",
    icon: <span className="mobile-icon" aria-hidden="true">▯</span>,
  },
  {
    name: "Another method",
    description: "Ask about your options",
    icon: <span className="other-icon" aria-hidden="true">+</span>,
  },
];

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

function isValidSaudiIban(value: string) {
  const iban = value.replace(/\s/g, "").toUpperCase();
  if (!/^SA\d{22}$/.test(iban)) return false;

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const character of rearranged) {
    const digits = /[A-Z]/.test(character)
      ? String(character.charCodeAt(0) - 55)
      : character;
    for (const digit of digits) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="Riyal home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path
            d="M8 12.5h24M11 19.5h18M15 26.5h10M18 8v24M22 8v24"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <span>riyal<span className="brand-period">.</span></span>
    </a>
  );
}

function PaymentFields({
  method,
  details,
  onChange,
}: {
  method: PaymentMethod;
  details: PaymentDetails;
  onChange: (field: keyof PaymentDetails, value: string) => void;
}) {
  if (method === "Bank transfer") {
    return (
      <div className="payment-fields">
        <label>
          Bank name
          <input
            autoComplete="off"
            maxLength={80}
            name="bankName"
            onChange={(event) => onChange("bankName", event.target.value)}
            placeholder="Your Saudi bank"
            required
            value={details.bankName}
          />
        </label>
        <label>
          IBAN
          <input
            autoComplete="off"
            maxLength={34}
            name="iban"
            onChange={(event) => onChange("iban", event.target.value.toUpperCase())}
            placeholder="SA..."
            required
            value={details.iban}
          />
        </label>
        <label className="field-full">
          Account holder name
          <input
            autoComplete="name"
            maxLength={100}
            name="accountHolder"
            onChange={(event) => onChange("accountHolder", event.target.value)}
            placeholder="Name on your account"
            required
            value={details.accountHolder}
          />
        </label>
      </div>
    );
  }

  if (method === "STC Pay" || method === "urpay") {
    return (
      <div className="payment-fields">
        <label className="field-full">
          {method} mobile number
          <input
            autoComplete="tel"
            maxLength={20}
            name="mobileNumber"
            onChange={(event) => onChange("mobileNumber", event.target.value)}
            placeholder="+966 5X XXX XXXX"
            required
            type="tel"
            value={details.mobileNumber}
          />
        </label>
      </div>
    );
  }

  return (
    <div className="payment-fields">
      <label className="field-full">
        Preferred payment method
        <input
          autoComplete="off"
          maxLength={100}
          name="otherMethod"
          onChange={(event) => onChange("otherMethod", event.target.value)}
          placeholder="Tell us how you would like to receive SAR"
          required
          value={details.otherMethod}
        />
      </label>
    </div>
  );
}

export default function Home() {
  const [amount, setAmount] = useState("250");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [details, setDetails] = useState<PaymentDetails>({
    bankName: "",
    iban: "",
    accountHolder: "",
    mobileNumber: "",
    otherMethod: "",
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const numericAmount = Number(amount);
  const estimate =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? formatAmount(numericAmount * RATE_BASELINE)
      : "—";
  const displayedAmount =
    Number.isFinite(numericAmount) && numericAmount > 0
      ? formatAmount(numericAmount)
      : "—";

  useEffect(() => {
    if (selectedMethod) {
      document.querySelector("#wallet-qr")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedMethod]);

  function updateDetail(field: keyof PaymentDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  function sellWithMethod(method: PaymentMethod) {
    if (!Number.isFinite(numericAmount) || numericAmount < 50 || numericAmount > MAX_AMOUNT) {
      setFormMessage("Enter an amount between 50 and 1,000,000 USDT before selecting Sell.");
      document.querySelector("#payment-amount")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFormMessage("");
    setSelectedMethod(method);
  }

  function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 50 ||
      numericAmount > MAX_AMOUNT
    ) {
      setFormMessage("Enter an amount between 50 and 1,000,000 USDT.");
      return;
    }

    if (!selectedMethod) {
      setFormMessage("Choose a payment method above before preparing your quote request.");
      document.querySelector("#payments")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (
      selectedMethod === "Bank transfer" &&
      (!details.bankName.trim() ||
        !isValidSaudiIban(details.iban) ||
        !details.accountHolder.trim())
    ) {
      setFormMessage("Enter your bank name, a valid Saudi IBAN, and account holder name in the payment section.");
      document.querySelector("#payments")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (
      (selectedMethod === "STC Pay" || selectedMethod === "urpay") &&
      !/^\+?[0-9\s()-]{8,20}$/.test(details.mobileNumber.trim())
    ) {
      setFormMessage("Enter a valid mobile number in the payment section.");
      document.querySelector("#payments")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (selectedMethod === "Another method" && !details.otherMethod.trim()) {
      setFormMessage("Enter your preferred payment method in the payment section.");
      document.querySelector("#payments")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    const payoutMethod =
      selectedMethod === "Another method" ? details.otherMethod : selectedMethod;
    const paymentDetails =
      selectedMethod === "Bank transfer"
        ? `Bank: ${details.bankName}\nIBAN: ${details.iban}\nAccount holder: ${details.accountHolder}`
        : selectedMethod === "Another method"
          ? `Preferred payment method: ${details.otherMethod}`
          : `${selectedMethod} mobile number: ${details.mobileNumber}`;
    const message = [
      "Hello, I would like to request a current quote for selling USDT.",
      `Amount: ${formatAmount(numericAmount)} USDT`,
      `Preferred SAR payment method: ${payoutMethod}`,
      paymentDetails,
      "Please confirm the current rate, all fees, payout amount, processing time, and supported network before I proceed.",
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
    setFormMessage("");
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="announcement">
        <span className="status-dot" aria-hidden="true" />
        A simple way to start a conversation — no wallet connection required
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <button
            aria-controls="site-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span /><span />
          </button>
          <nav
            aria-label="Main navigation"
            className={`site-nav${menuOpen ? " is-open" : ""}`}
            id="site-nav"
          >
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#payments" onClick={() => setMenuOpen(false)}>Payment methods</a>
            <a href="#questions" onClick={() => setMenuOpen(false)}>Questions</a>
            <a className="nav-cta" href="#get-quote" onClick={() => setMenuOpen(false)}>
              Request a quote <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero container" id="top">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> FOR SAUDI ARABIA</div>
            <h1>Your USDT.<br /><span>Your riyals.</span><br />A clear next step.</h1>
            <p className="hero-description">
              Explore your payment options and request a quote directly. No confusing rate cards,
              no pressure to send before you have the details.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#get-quote">Get a quote <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-assurance">
              <span className="assurance-icon" aria-hidden="true">✓</span>
              <span>Review the quote before deciding</span>
              <span className="assurance-divider" aria-hidden="true" />
              <span>No wallet connection</span>
            </div>
          </div>
          <div aria-label="A preview of your quote" className="hero-visual">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-glow" />
            <div className="visual-topline">
              <span>YOUR ESTIMATE</span><span className="live-label"><i /> NO LIVE RATE</span>
            </div>
            <div className="estimate-card">
              <div className="estimate-heading">
                <div aria-hidden="true" className="coin-symbol">₮</div>
                <div><span className="field-caption">YOU SEND</span><strong>{displayedAmount} <small>USDT</small></strong></div>
              </div>
              <div aria-hidden="true" className="estimate-arrow"><span>↓</span></div>
              <div className="estimate-heading estimate-result">
                <div aria-hidden="true" className="riyal-symbol">ر.س</div>
                <div><span className="field-caption">ILLUSTRATIVE BASELINE</span><strong>{estimate} <small>SAR</small></strong></div>
              </div>
              <div className="estimate-note">Example only. Your provider confirms the rate and final amount before you proceed.</div>
            </div>
            <div className="visual-foot"><span>USDT</span><span className="foot-dash" /><span>SAR</span><span className="foot-check">✓</span></div>
            <div className="floating-note"><span className="floating-icon">↗</span><span><strong>Clear from the start</strong><small>Choose how you&apos;d receive SAR</small></span></div>
            <div className="visual-decoration decoration-a" />
            <div className="visual-decoration decoration-b" />
          </div>
        </section>

        <section aria-label="Service principles" className="trust-strip">
          <div className="container trust-inner">
            <span><i className="trust-check">✓</i> Transparent quote first</span>
            <span><i className="trust-check">✓</i> You choose the payment method</span>
            <span><i className="trust-check">✓</i> Never share your recovery phrase</span>
          </div>
        </section>

        <section className="section container" id="payments">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> YOUR PAYMENT, YOUR CHOICE</div>
              <h2>How would you like<br className="desktop-break" /> to receive SAR?</h2>
            </div>
            <p>Enter the amount you want to sell, then choose a payment method. The matching payment QR appears when you select Sell.</p>
          </div>
          <div className="payment-amount-control">
            <label className="input-label" htmlFor="payment-amount">Amount to sell</label>
            <div className="amount-field">
              <input
                aria-describedby="payment-amount-help"
                id="payment-amount"
                inputMode="decimal"
                max={MAX_AMOUNT}
                min="50"
                onChange={(event) => {
                  setAmount(event.target.value);
                  setFormMessage("");
                }}
                required
                step="0.01"
                type="number"
                value={amount}
              />
              <span>USDT</span>
            </div>
            <span className="payment-amount-help" id="payment-amount-help">Minimum 50 USDT · Maximum 1,000,000 USDT</span>
          </div>
          <div aria-label="Choose a payment method" className="payment-grid" role="group">
            {paymentMethods.map((method) => (
              <article
                className={`payment-card${selectedMethod === method.name ? " is-selected" : ""}`}
                key={method.name}
              >
                <span className={`payment-icon${method.name === "Another method" ? " payment-icon-other" : method.name !== "Bank transfer" ? " payment-icon-mobile" : ""}`}>
                  {method.icon}
                </span>
                <span className="payment-copy"><strong>{method.name === "Another method" ? "Something else?" : method.name}</strong><small>{method.description}</small></span>
                <span aria-hidden="true" className="payment-check">✓</span>
                <button
                  aria-pressed={selectedMethod === method.name}
                  className="payment-sell"
                  onClick={() => sellWithMethod(method.name)}
                  type="button"
                >Sell <span aria-hidden="true">↗</span></button>
              </article>
            ))}
          </div>
          <p className="form-message payment-form-message" role="status" aria-live="polite">{formMessage}</p>

          <form className="payout-details" onSubmit={(event) => event.preventDefault()}>
            {selectedMethod ? (
              <>
                <div className="payout-heading">
                  <div>
                    <span className="field-caption">PAYOUT DETAILS</span>
                    <h3>{selectedMethod === "Another method" ? "Tell us what works for you" : `Your ${selectedMethod} details`}</h3>
                  </div>
                  <span className="payout-lock" aria-hidden="true">Your details stay in this browser until you choose to prepare a message.</span>
                </div>
                <PaymentFields method={selectedMethod} details={details} onChange={updateDetail} />
                <div className="payment-details-note" role="note">
                  <span aria-hidden="true">i</span>
                  <p>
                    Take a screenshot of your completed payment details, then{" "}
                    <a className="payment-support-button" href="https://t.me/Usdtbuyerus" rel="noopener noreferrer" target="_blank">
                      Send it to customer support on Telegram <span aria-hidden="true">↗</span>
                    </a>
                    . Only share it with this verified support account.
                  </p>
                </div>
                <button
                  className="payment-details-sell"
                  onClick={() => sellWithMethod(selectedMethod)}
                  type="button"
                >
                  Sell {displayedAmount} USDT <span aria-hidden="true">↗</span>
                </button>
              </>
            ) : (
              <p className="payment-prompt">Choose a payment method to enter your payout details and view the USDT payment QR.</p>
            )}
          </form>

          <p className="payment-footnote"><span aria-hidden="true">ⓘ</span> Only share payout details with a provider you have independently verified. Never share your wallet recovery phrase or private key.</p>
        </section>

        {selectedMethod && (
          <section aria-labelledby="wallet-qr-title" className="wallet-qr-section" id="wallet-qr">
            <div className="container wallet-qr-layout">
              <div className="wallet-qr-copy">
                <div className="eyebrow"><span className="eyebrow-line" /> TRUST WALLET · USDT</div>
                <h2 id="wallet-qr-title">Send USDT on<br />the right network.</h2>
                <p>Scan this Trust Wallet QR to send USDT using BNB Smart Chain (BEP-20). Make sure the selected network in your wallet matches before confirming your transfer.</p>
                <div className="wallet-warning"><span aria-hidden="true">!</span> Crypto transfers cannot usually be reversed. Verify the network and destination in your wallet before sending.</div>
              </div>
              <div className="wallet-qr-card">
                <Image
                  alt="Trust Wallet USDT receive QR for BNB Smart Chain"
                  className="wallet-qr-image"
                  height={745}
                  loading="eager"
                  src="/trust-wallet-qr.jpg"
                  unoptimized
                  width={790}
                />
                <div className="qr-card-copy">
                  <span className="field-caption">TRUST WALLET PAYMENT QR</span>
                  <strong>USDT · BNB Smart Chain</strong>
                  <p>Scan from your wallet, then verify the address and network shown in Trust Wallet before sending.</p>
                  <span className="network-badge"><i /> BNB Smart Chain · BEP-20</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="quote-section" id="get-quote">
          <div className="container quote-layout">
            <div className="quote-intro">
              <div className="eyebrow eyebrow-light"><span className="eyebrow-line" /> START WITH A NUMBER</div>
              <h2>A quote should<br />feel straightforward.</h2>
              <p>Enter the amount you&apos;d like to sell. We&apos;ll prepare a message with your payout details so you can ask a provider for their current rate and terms.</p>
              <div className="quote-promise"><span aria-hidden="true">✓</span> No account, keys, or wallet access requested.</div>
            </div>
            <form className="quote-card" id="quote-form" onSubmit={submitQuote}>
              <div className="quote-card-top">
                <div><span className="field-caption">QUOTE REQUEST</span><h3>What would you like to sell?</h3></div>
                <span className="quote-step">01 <span>/ 01</span></span>
              </div>
              <label className="input-label" htmlFor="amount">USDT amount</label>
              <div className="amount-field">
                <input
                  aria-describedby="amount-help"
                  id="amount"
                  inputMode="decimal"
                  max={MAX_AMOUNT}
                  min="50"
                  name="amount"
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setFormMessage("");
                  }}
                  required
                  step="0.01"
                  type="number"
                  value={amount}
                />
                <span>USDT</span>
              </div>
              <div className="amount-help" id="amount-help"><span>Minimum 50 USDT</span><span>Maximum 1,000,000 USDT</span></div>
              <div className="estimate-summary">
                <div><span>Illustrative SAR baseline</span><strong>{estimate} SAR</strong></div>
                <p>This is not a live exchange quote. The provider will confirm the rate, fees, and final payout with you.</p>
              </div>
              <div className="quote-method"><span>RECEIVE VIA</span><strong>{selectedMethod === "Another method" ? details.otherMethod || "Something else?" : selectedMethod || "Choose a method"}</strong><a href="#payments">Edit details</a></div>
              <button className="button button-dark button-full" type="submit">Prepare quote request <span aria-hidden="true">↗</span></button>
              <p className="privacy-note"><span aria-hidden="true">↗</span> Opens WhatsApp with a message you can review before sending.</p>
              <p className="form-message" role="status" aria-live="polite">{formMessage}</p>
            </form>
          </div>
        </section>

        <section className="section how-section container" id="how-it-works">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> A FEW SIMPLE STEPS</div>
              <h2>Stay in control,<br className="desktop-break" /> from first message.</h2>
            </div>
            <p>Take the time to understand the terms. Only move ahead when you&apos;ve verified the details and are comfortable with the provider.</p>
          </div>
          <div className="steps-grid">
            <article className="step-card"><span className="step-number">01</span><span className="step-icon" aria-hidden="true">⌕</span><h3>Choose your method</h3><p>Select where you&apos;d like to receive your SAR payout.</p></article>
            <article className="step-card"><span className="step-number">02</span><span className="step-icon" aria-hidden="true">↗</span><h3>Ask for a quote</h3><p>Share your amount and ask for the current rate, fees, and expected timing.</p></article>
            <article className="step-card"><span className="step-number">03</span><span className="step-icon" aria-hidden="true">✓</span><h3>Verify before sending</h3><p>Check the provider, network, address, and payout details independently.</p></article>
            <article className="step-card"><span className="step-number">04</span><span className="step-icon" aria-hidden="true">↙</span><h3>Decide for yourself</h3><p>Proceed only if the terms match what you agreed. Never share your seed phrase.</p></article>
          </div>
        </section>

        <section className="safety-section">
          <div className="container safety-inner">
            <div aria-hidden="true" className="safety-icon">
              <svg viewBox="0 0 48 48" fill="none"><path d="M24 5 40 11v11c0 10.2-6.9 17.4-16 21C14.9 39.4 8 32.2 8 22V11l16-6Z" stroke="currentColor" strokeWidth="2" /><path d="m17 23 5 5 10-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div className="safety-copy"><span className="eyebrow">A QUICK SAFETY CHECK</span><h2>Keep your keys yours.</h2><p>A legitimate counterparty never needs your wallet password, private key, or recovery phrase. Verify the recipient address and network through a separate trusted channel before sending any crypto.</p></div>
            <a className="text-link" href="#questions">More safety tips <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="section faq-section container" id="questions">
          <div className="section-heading faq-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> GOOD TO KNOW</div><h2>Questions, answered.</h2></div>
            <p>Crypto transactions can be irreversible. Take a moment to understand every step before you proceed.</p>
          </div>
          <div className="faq-list">
            <details><summary>Is the SAR amount shown a live quote?<span aria-hidden="true" className="faq-plus" /></summary><p>No. The calculator uses an illustrative 3.75 SAR per USDT baseline for estimation only. It is not a live rate or offer. Ask your provider to confirm their current rate, all fees, and the exact payout before making a decision.</p></details>
            <details><summary>Does Riyal hold or exchange my USDT?<span aria-hidden="true" className="faq-plus" /></summary><p>No. This website is an informational quote-request interface. It does not custody funds, connect to your wallet, execute trades, or guarantee a payout. Any transaction is directly between you and a separate provider.</p></details>
            <details><summary>How do I stay safe when selling crypto?<span aria-hidden="true" className="faq-plus" /></summary><p>Independently verify the provider and payment details. Confirm the token and network match exactly, understand the fees and timing, and never send a test or full amount until you are comfortable. Never share your password, private key, or seed phrase.</p></details>
            <details><summary>What if I don&apos;t use one of the listed payment methods?<span aria-hidden="true" className="faq-plus" /></summary><p>Select “Something else?” and mention the method you&apos;d prefer in your quote request. A provider can tell you whether they support it; availability is not guaranteed.</p></details>
          </div>
        </section>

        <section className="closing-cta">
          <div className="container closing-inner"><div><span className="eyebrow eyebrow-light">READY WHEN YOU ARE</span><h2>Start with a conversation.</h2><p>Ask questions. Check the details. Make the call that&apos;s right for you.</p></div><div className="closing-actions"><a className="button button-cream" href="#get-quote">Request a quote <span aria-hidden="true">↗</span></a><a className="button button-telegram" href="https://t.me/Usdtbuyerus" rel="noopener noreferrer" target="_blank">Contact support on Telegram <span aria-hidden="true">↗</span></a></div></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-main">
          <div className="footer-brand"><Brand /><p>A clearer place to begin your USDT-to-SAR quote request.</p></div>
          <div className="footer-links"><span className="footer-label">EXPLORE</span><a href="#how-it-works">How it works</a><a href="#payments">Payment methods</a><a href="#questions">FAQs &amp; safety</a></div>
          <div className="footer-disclaimer"><span className="footer-label">IMPORTANT</span><p>Digital assets involve risk. This interface is not a bank, exchange, broker, or financial adviser. Rates are illustrative only; verify all transaction details and any applicable local rules before proceeding.</p></div>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} Riyal. Built for clarity.</span><span>USDT · SAR · Saudi Arabia</span></div>
      </footer>
    </>
  );
}
