import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

/**
 * @typedef {Object} Step
 * @property {string} [type] Text to type character-by-character.
 * @property {string} [key] A key to press (e.g. "Enter", "Escape", "ArrowDown").
 * @property {number} [delay] Per-character delay in ms for `type` steps.
 * @property {number} [wait] Pause in ms (a step that only waits).
 * @property {number} [holdAfter] Pause in ms after the step completes.
 * @property {string} [caption] Lower-third caption shown from this step until the next caption.
 */

/**
 * @typedef {Object} Scene
 * @property {string} name
 * @property {{ view: string, connection?: string, table?: string }} url
 * @property {"sql"|"drizzle"|"prisma"} [mode]
 * @property {{ width: number, height: number }} [size]
 * @property {{ fontSize?: number, lineHeight?: number }} [editor]
 * @property {boolean} [closeRightSidebar]
 * @property {number} [leadInMs] How much empty-editor lead-in to keep before typing.
 * @property {number} [defaultDelay] Default per-character typing delay.
 * @property {Step[]} steps
 * @property {string} [expect] Expected final editor value (asserted, warns on mismatch).
 */

const DEFAULTS = {
  size: { width: 1600, height: 900 },
  leadInMs: 600,
  defaultDelay: 95,
  base: "http://localhost:1420",
};

const MODE_KEY = { sql: "Alt+KeyS", drizzle: "Alt+KeyD", prisma: "Alt+KeyP" };

function log(...args) {
  console.log("[promo]", ...args);
}

function detectFont() {
  try {
    const r = spawnSync("fc-match", ["-f", "%{file}", "sans-serif"], {
      encoding: "utf8",
    });
    const file = (r.stdout || "").trim();
    return file && file.length > 0 ? file : null;
  } catch {
    return null;
  }
}

function escapeDrawtext(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")
    .replace(/%/g, "\\%");
}

function buildUrl(base, url) {
  const params = new URLSearchParams();
  params.set("view", url.view);
  if (url.connection) params.set("connection", url.connection);
  if (url.table) params.set("table", url.table);
  return `${base}/?${params.toString()}`;
}

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed (exit ${r.status})`);
  }
}

/**
 * Drive the Studio app into a clean, focused, empty editor ready for scripted
 * input: navigate to the scene URL, switch editor mode, collapse the right
 * sidebar, apply editor options and clear the buffer. Shared by the renderer
 * and the interactive author so both start from an identical state.
 * @param {import("@playwright/test").Page} page
 * @param {Scene} scene
 * @param {{ base?: string }} [opts]
 */
export async function setupStudioEditor(page, scene, opts = {}) {
  const base = opts.base ?? DEFAULTS.base;
  const hold = (ms) => page.waitForTimeout(ms);

  await page.goto(buildUrl(base, scene.url), { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => !!window.monaco?.editor?.getEditors?.().length,
    null,
    { timeout: 30000 },
  );
  await hold(1500);

  if (scene.mode) {
    try {
      await page
        .getByRole("button", { name: new RegExp(scene.mode, "i") })
        .first()
        .click({ timeout: 2500 });
    } catch {
      await page.keyboard.press(MODE_KEY[scene.mode] || "Alt+KeyD");
    }
    if (scene.mode === "drizzle" || scene.mode === "sql") {
      await page
        .waitForFunction(
          () =>
            (window.monaco?.editor?.getEditors?.() || []).some((e) =>
              e.getValue().includes("db.") || e.getValue().includes("SELECT"),
            ),
          null,
          { timeout: 15000 },
        )
        .catch(() => {});
    } else {
      await hold(1500);
    }
  }

  if (scene.closeRightSidebar) {
    await page.keyboard.press("Control+KeyB");
    await hold(700);
  }

  await page.evaluate(
    ({ fontSize, lineHeight }) => {
      const eds = window.monaco.editor.getEditors();
      const ed =
        eds.find((e) => e.getValue().trim().length > 0) ||
        eds[eds.length - 1] ||
        eds[0];
      ed.updateOptions({
        fontSize: fontSize ?? 18,
        lineHeight: lineHeight ?? 30,
        minimap: { enabled: false },
      });
      ed.setValue("");
      ed.focus();
    },
    { fontSize: scene.editor?.fontSize, lineHeight: scene.editor?.lineHeight },
  );
  await page
    .waitForFunction(
      () => {
        const eds = window.monaco?.editor?.getEditors?.() || [];
        return eds.length > 0 && eds.some((e) => e.getValue().trim() === "");
      },
      null,
      { timeout: 5000 },
    )
    .catch(() => {});
  await hold(800);
}

/**
 * Render a scene to an mp4 (and optionally a gif).
 * @param {Scene} scene
 * @param {{ base?: string, outDir: string, gif?: boolean, captions?: boolean, headless?: boolean }} opts
 */
export async function renderScene(scene, opts) {
  const base = opts.base ?? DEFAULTS.base;
  const size = scene.size || DEFAULTS.size;
  const leadInMs = scene.leadInMs ?? DEFAULTS.leadInMs;
  const defaultDelay = scene.defaultDelay ?? DEFAULTS.defaultDelay;
  const outDir = opts.outDir;
  const workDir = path.join(outDir, ".work");
  mkdirSync(outDir, { recursive: true });
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  const browser = await chromium.launch({ headless: opts.headless !== false });
  const context = await browser.newContext({
    viewport: size,
    deviceScaleFactor: 1,
    recordVideo: { dir: workDir, size },
  });
  const page = await context.newPage();
  const t0 = Date.now();
  const captionEvents = [];
  let typeStartMs = leadInMs;
  let finalValue = "";

  const hold = (ms) => page.waitForTimeout(ms);

  try {
    await setupStudioEditor(page, scene, { base });

    typeStartMs = Date.now() - t0;
    log("typing starts at", typeStartMs, "ms");

    for (const step of scene.steps) {
      if (step.caption) {
        captionEvents.push({ ms: Date.now() - t0, text: step.caption });
      }
      if (step.wait) {
        await hold(step.wait);
        continue;
      }
      if (step.type) {
        await page.keyboard.type(step.type, {
          delay: step.delay ?? defaultDelay,
        });
      } else if (step.key) {
        await page.keyboard.press(step.key);
      }
      if (step.holdAfter) await hold(step.holdAfter);
    }

    finalValue = await page.evaluate(() => {
      const eds = window.monaco.editor.getEditors();
      const ed = eds.find((e) => e.getValue().trim().length > 0) || eds[0];
      return ed ? ed.getValue() : "";
    });
  } finally {
    await context.close();
    await browser.close();
  }

  if (scene.expect != null) {
    if (finalValue === scene.expect) {
      log("final value OK:", JSON.stringify(finalValue));
    } else {
      log("WARNING final value mismatch");
      log("  expected:", JSON.stringify(scene.expect));
      log("  actual:  ", JSON.stringify(finalValue));
    }
  }

  const webm = readdirSync(workDir)
    .filter((f) => f.endsWith(".webm"))
    .map((f) => path.join(workDir, f))[0];
  if (!webm) throw new Error("no video was recorded");

  const trimStart = Math.max(0, (typeStartMs - leadInMs) / 1000);
  const mp4 = path.join(outDir, `${scene.name}.mp4`);

  let vf = `scale=${size.width}:${size.height}:flags=lanczos,format=yuv420p`;
  if (opts.captions && captionEvents.length) {
    const font = detectFont();
    if (!font) {
      log("captions requested but no system font found; skipping captions");
    } else {
      const draws = captionEvents.map((ev, i) => {
        const start = Math.max(0, ev.ms / 1000 - trimStart);
        const next = captionEvents[i + 1];
        const end = next ? next.ms / 1000 - trimStart : 1e6;
        const text = escapeDrawtext(ev.text);
        return (
          `drawtext=fontfile='${font}':text='${text}':` +
          `x=(w-text_w)/2:y=h-96:fontsize=30:fontcolor=white:` +
          `box=1:boxcolor=black@0.55:boxborderw=18:` +
          `enable='between(t,${start.toFixed(2)},${end.toFixed(2)})'`
        );
      });
      vf = `scale=${size.width}:${size.height}:flags=lanczos,${draws.join(",")},format=yuv420p`;
    }
  }

  ffmpeg([
    "-ss", trimStart.toFixed(3),
    "-i", webm,
    "-vf", vf,
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "20",
    "-movflags", "+faststart",
    "-an",
    mp4,
  ]);
  log("wrote", mp4);

  let gif = null;
  if (opts.gif) {
    gif = path.join(outDir, `${scene.name}.gif`);
    const palette = path.join(workDir, "palette.png");
    const gifVf = `fps=15,scale=1100:-1:flags=lanczos`;
    ffmpeg(["-ss", trimStart.toFixed(3), "-i", webm, "-vf", `${gifVf},palettegen=stats_mode=diff`, palette]);
    ffmpeg([
      "-ss", trimStart.toFixed(3),
      "-i", webm,
      "-i", palette,
      "-lavfi", `${gifVf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
      gif,
    ]);
    log("wrote", gif);
  }

  rmSync(workDir, { recursive: true, force: true });
  return { mp4, gif, finalValue, ok: scene.expect == null || finalValue === scene.expect };
}
