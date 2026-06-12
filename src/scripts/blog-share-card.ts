import * as QRCode from "qrcode";

interface ShareCardState {
  title: string;
  description: string;
  date: string;
  url: string;
  authorName: string;
  authorAlias: string;
  excerpt: string;
}

interface WrappedTextResult {
  lines: string[];
  nextY: number;
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;
const CARD_PADDING_X = 92;
const FOOTER_TOP_Y = 1598;
const DARK_BACKGROUND = "#1d1f22";
const PRIMARY_TEXT = "#eee5c4";
const SECONDARY_TEXT = "rgba(226, 218, 188, 0.76)";
const MUTED_TEXT = "rgba(226, 218, 188, 0.56)";

/**
 * Returns the first meaningful text snippets from the rendered article body.
 */
function readOpeningExcerpt(fallback: string): string {
  const contentRoot = document.querySelector<HTMLElement>("[data-blog-content]");
  const blocks = Array.from(contentRoot?.querySelectorAll("p, li") ?? []);
  const sentences: string[] = [];

  for (const block of blocks) {
    const normalized = normalizeText(block.textContent ?? "");
    if (normalized.length < 12) {
      continue;
    }

    for (const sentence of splitSentences(normalized)) {
      sentences.push(sentence);
      if (sentences.length >= 3 || sentences.join("").length >= 150) {
        return limitText(sentences.join(""), 178);
      }
    }
  }

  return limitText(normalizeText(fallback), 178);
}

/**
 * Collapses whitespace so article text can be measured predictably.
 */
function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Splits Chinese and English prose into sentence-like chunks.
 */
function splitSentences(value: string): string[] {
  const matches = value.match(/[^。！？!?；;]+[。！？!?；;]?/gu);
  return (matches ?? [value]).map((item) => item.trim()).filter(Boolean);
}

/**
 * Truncates long text with an ellipsis while preserving short strings.
 */
function limitText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

/**
 * Creates an image element and resolves to null if the asset cannot load.
 */
function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

/**
 * Converts canvas output into a PNG blob.
 */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Unable to create image."));
    }, "image/png");
  });
}

/**
 * Downloads a Blob as a local file through a temporary object URL.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

/**
 * Produces a filesystem-friendly PNG filename from the article title.
 */
function createFilename(title: string): string {
  const sanitized = title.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 48);
  return `${sanitized || "blog-share-card"}.png`;
}

/**
 * Draws rounded image content clipped inside a circle.
 */
function drawAvatar(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null): void {
  const centerX = 146;
  const centerY = 158;
  const radius = 54;
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#f2edda";
  ctx.fill();
  ctx.clip();
  if (image) {
    ctx.filter = "grayscale(1) contrast(1.05) brightness(1.08)";
    ctx.drawImage(image, centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.filter = "none";
  } else {
    ctx.fillStyle = "#22252a";
    ctx.font = '700 36px "Songti SC", serif';
    ctx.textAlign = "center";
    ctx.fillText("C", centerX, centerY + 12);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(231, 222, 190, 0.52)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Breaks text into units that wrap better across Chinese and English.
 */
function tokenizeText(value: string): string[] {
  return value.match(/[A-Za-z0-9@#_.:/-]+|\s+|[\uD800-\uDBFF][\uDC00-\uDFFF]|./gu) ?? [];
}

/**
 * Measures and wraps text into drawable canvas lines.
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const tokens = tokenizeText(text);
  const lines: string[] = [];
  let currentLine = "";

  for (const token of tokens) {
    const nextLine = `${currentLine}${token}`;
    if (ctx.measureText(nextLine).width <= maxWidth || currentLine.length === 0) {
      currentLine = nextLine;
      continue;
    }

    lines.push(currentLine.trimEnd());
    currentLine = token.trimStart();
    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && currentLine.trim().length > 0) {
    lines.push(currentLine.trimEnd());
  }

  if (lines.length === maxLines && tokens.join("").length > lines.join("").length) {
    lines[maxLines - 1] = fitEllipsis(ctx, lines[maxLines - 1], maxWidth);
  }

  return lines;
}

/**
 * Shrinks one line until an ellipsis fits inside the available width.
 */
function fitEllipsis(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string {
  let candidate = line.trimEnd();
  while (candidate.length > 0 && ctx.measureText(`${candidate}…`).width > maxWidth) {
    candidate = candidate.slice(0, -1).trimEnd();
  }
  return `${candidate}…`;
}

/**
 * Draws wrapped text and returns the next vertical drawing position.
 */
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): WrappedTextResult {
  const lines = wrapText(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return { lines, nextY: y + lines.length * lineHeight };
}

/**
 * Draws the WeRead-inspired share card into the target canvas.
 */
function drawShareCard(
  canvas: HTMLCanvasElement,
  state: ShareCardState,
  qrCanvas: HTMLCanvasElement,
  avatar: HTMLImageElement | null,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable.");
  }

  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const background = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  background.addColorStop(0, "#1b1d20");
  background.addColorStop(0.58, "#202226");
  background.addColorStop(1, DARK_BACKGROUND);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  drawAvatar(ctx, avatar);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = PRIMARY_TEXT;
  ctx.font = '700 34px "Songti SC", "Hiragino Sans GB", serif';
  ctx.fillText(state.authorAlias, 230, 148);
  ctx.fillStyle = SECONDARY_TEXT;
  ctx.font = '400 28px "Songti SC", "Hiragino Sans GB", serif';
  ctx.fillText(`写于 ${state.date.replaceAll("-", "/")}`, 230, 204);

  ctx.fillStyle = PRIMARY_TEXT;
  ctx.font = '600 44px "HanziPen SC", "Kaiti SC", "Songti SC", serif';
  const titleResult = drawWrappedText(ctx, state.title, CARD_PADDING_X, 356, 860, 68, 2);

  ctx.fillStyle = PRIMARY_TEXT;
  ctx.font = '520 43px "HanziPen SC", "Kaiti SC", "Songti SC", serif';
  const excerptTop = titleResult.nextY + 56;
  const excerptResult = drawWrappedText(ctx, state.excerpt, CARD_PADDING_X, excerptTop, 896, 80, 9);

  ctx.fillStyle = "rgba(226, 218, 188, 0.22)";
  ctx.font = "96px Georgia, serif";
  const quoteTop = Math.min(excerptResult.nextY + 84, 1240);
  ctx.fillText("“", CARD_PADDING_X, quoteTop);

  ctx.fillStyle = SECONDARY_TEXT;
  ctx.font = '500 32px "Songti SC", "Hiragino Sans GB", serif';
  drawWrappedText(ctx, state.description, CARD_PADDING_X, quoteTop + 86, 896, 58, 3);

  ctx.fillStyle = MUTED_TEXT;
  ctx.font = '400 29px "Songti SC", "Hiragino Sans GB", serif';
  ctx.fillText(`/ ${state.title}`, CARD_PADDING_X, quoteTop + 292);

  ctx.strokeStyle = "rgba(226, 218, 188, 0.14)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CARD_PADDING_X, FOOTER_TOP_Y);
  ctx.lineTo(CARD_WIDTH - CARD_PADDING_X, FOOTER_TOP_Y);
  ctx.stroke();

  ctx.fillStyle = SECONDARY_TEXT;
  ctx.font = '700 32px "Songti SC", "Hiragino Sans GB", serif';
  ctx.fillText(state.authorName, CARD_PADDING_X, 1718);
  ctx.fillStyle = MUTED_TEXT;
  ctx.font = '400 25px "Songti SC", "Hiragino Sans GB", serif';
  ctx.fillText("扫码阅读全文", CARD_PADDING_X, 1782);
  ctx.fillText(new URL(state.url).hostname, CARD_PADDING_X, 1828);

  ctx.fillStyle = "#f4edcc";
  ctx.fillRect(802, 1660, 186, 186);
  ctx.drawImage(qrCanvas, 814, 1672, 162, 162);
}

/**
 * Handles share card generation and modal interactions for one blog page.
 */
class BlogShareCard extends HTMLElement {
  private canvas: HTMLCanvasElement | null = null;
  private modal: HTMLElement | null = null;
  private status: HTMLElement | null = null;
  private nativeButton: HTMLButtonElement | null = null;
  private imageBlob: Blob | null = null;

  connectedCallback(): void {
    this.canvas = this.querySelector<HTMLCanvasElement>(".blog-share-canvas");
    this.modal = this.querySelector<HTMLElement>(".blog-share-modal");
    this.status = this.querySelector<HTMLElement>(".blog-share-status");
    this.nativeButton = this.querySelector<HTMLButtonElement>("[data-share-native]");
    this.querySelector<HTMLButtonElement>(".blog-share-trigger")?.addEventListener("click", () => {
      void this.open();
    });
    this.querySelector<HTMLButtonElement>("[data-share-download]")?.addEventListener("click", () => {
      void this.download();
    });
    this.nativeButton?.addEventListener("click", () => {
      void this.shareNative();
    });
    this.querySelectorAll<HTMLElement>("[data-share-close]").forEach((element) => {
      element.addEventListener("click", () => this.close());
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.modal?.hidden) {
        this.close();
      }
    });
  }

  /**
   * Opens the modal and renders the current article share image.
   */
  private async open(): Promise<void> {
    if (!this.modal || !this.canvas) {
      return;
    }
    this.modal.hidden = false;
    document.body.classList.add("overflow-hidden");
    await this.renderCard();
  }

  /**
   * Closes the modal and restores document scrolling.
   */
  private close(): void {
    if (this.modal) {
      this.modal.hidden = true;
    }
    document.body.classList.remove("overflow-hidden");
  }

  /**
   * Builds the card data from data attributes and article DOM content.
   */
  private readState(): ShareCardState {
    const title = this.dataset.title ?? "Blog";
    const description = this.dataset.description ?? "";
    return {
      title,
      description,
      date: this.dataset.date ?? "",
      url: this.dataset.url ?? window.location.href,
      authorName: this.dataset.authorName ?? "Charles Cheng",
      authorAlias: this.dataset.authorAlias ?? "安妮的心动录",
      excerpt: readOpeningExcerpt(description),
    };
  }

  /**
   * Generates QR code, draws the canvas, and prepares the PNG blob.
   */
  private async renderCard(): Promise<void> {
    if (!this.canvas) {
      return;
    }

    this.setStatus("Generating...");
    try {
      await document.fonts.ready;
      const state = this.readState();
      const qrCanvas = await QRCode.toCanvas(state.url, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 360,
        color: {
          dark: "#111111ff",
          light: "#f4edccff",
        },
      });
      const avatar = await loadImage(new URL("/images/avatar.jpg", window.location.origin).toString());
      drawShareCard(this.canvas, state, qrCanvas, avatar);
      this.imageBlob = await canvasToBlob(this.canvas);
      this.updateNativeShareVisibility();
      this.setStatus("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate image.";
      this.setStatus(message);
    }
  }

  /**
   * Downloads the generated card, rendering it first if needed.
   */
  private async download(): Promise<void> {
    if (!this.imageBlob) {
      await this.renderCard();
    }
    if (!this.imageBlob) {
      return;
    }
    downloadBlob(this.imageBlob, createFilename(this.dataset.title ?? "blog-share-card"));
  }

  /**
   * Uses the Web Share API when the browser supports image files.
   */
  private async shareNative(): Promise<void> {
    if (!this.imageBlob || !navigator.share) {
      return;
    }
    const file = new File([this.imageBlob], createFilename(this.dataset.title ?? "blog-share-card"), {
      type: "image/png",
    });
    const shareData: ShareData = {
      files: [file],
      title: this.dataset.title,
      text: this.dataset.url,
    };
    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
    }
  }

  /**
   * Shows or hides the native share action based on browser support.
   */
  private updateNativeShareVisibility(): void {
    if (!this.nativeButton || !this.imageBlob) {
      return;
    }
    const file = new File([this.imageBlob], "blog-share-card.png", { type: "image/png" });
    this.nativeButton.hidden = !navigator.canShare?.({ files: [file] });
  }

  /**
   * Updates modal status text and visibility.
   */
  private setStatus(message: string): void {
    if (!this.status) {
      return;
    }
    this.status.textContent = message;
    this.status.classList.toggle("is-hidden", message.length === 0);
  }
}

if (!customElements.get("blog-share-card")) {
  customElements.define("blog-share-card", BlogShareCard);
}
