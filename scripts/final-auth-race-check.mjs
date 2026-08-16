import { randomBytes } from "node:crypto";
import WebSocket from "ws";

const origin = process.env.CONNEXY_TEST_ORIGIN ?? "http://127.0.0.1:8080";
const cdpPort = process.env.CONNEXY_CDP_PORT ?? "9222";
const stamp = Date.now();
const completeEmail = `auth-race-complete-${stamp}@example.com`;
const incompleteEmail = `auth-race-incomplete-${stamp}@example.com`;
const testPassword = `${randomBytes(24).toString("base64url")}Aa1!`;
const results = [];

const pages = await fetch(`http://127.0.0.1:${cdpPort}/json`).then((response) => response.json());
const page = pages.find((entry) => entry.type === "page");
if (!page) throw new Error("Nenhuma página disponível no Chrome CDP");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.once("open", resolve);
  socket.once("error", reject);
});

let id = 0;
const pending = new Map();
socket.on("message", (raw) => {
  const message = JSON.parse(raw.toString());
  if (message.method === "Runtime.exceptionThrown") {
    console.error("BROWSER EXCEPTION", message.params.exceptionDetails);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    console.error(
      "BROWSER CONSOLE",
      message.params.args.map((arg) => arg.value ?? arg.description),
    );
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function send(method, params = {}) {
  const requestId = ++id;
  socket.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function path() {
  return evaluate("location.pathname");
}

async function waitPath(expected, label, timeout = 20_000) {
  const deadline = Date.now() + timeout;
  let actual = await path();
  while (Date.now() < deadline) {
    if (actual === "/localizacao") {
      throw new Error(`${label}: redirecionamento proibido para /localizacao`);
    }
    if (actual === expected) {
      results.push(`${label}: ${actual}`);
      return;
    }
    await pause(100);
    actual = await path();
  }
  throw new Error(
    `${label}: esperado ${expected}, recebido ${actual}; página=${await evaluate("document.body.innerText")}`,
  );
}

async function navigate(pathname) {
  await send("Page.navigate", { url: `${origin}${pathname}` });
}

async function reloadAndRemain(expected, label) {
  await pause(1_500);
  if ((await path()) !== expected)
    throw new Error(`${label} após espera: recebido ${await path()}`);
  await send("Page.reload", { ignoreCache: true });
  await waitPath(expected, `${label} após reload`);
  await pause(1_500);
  if ((await path()) !== expected)
    throw new Error(`${label} após reload+espera: recebido ${await path()}`);
  results.push(`${label} após espera: ${expected}`);
}

async function setInput(selector, value) {
  const deadline = Date.now() + 10_000;
  let inputType;
  while (Date.now() < deadline) {
    inputType = await evaluate(`(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!input || input.disabled || input.readOnly) return null;
      const reactBound = Object.keys(input).some((key) =>
        key.startsWith("__reactProps$") || key === "_valueTracker");
      if (document.readyState !== "complete" || !reactBound) return null;
      input.focus();
      return document.activeElement === input ? input.type : null;
    })()`);
    if (inputType) break;
    await pause(50);
  }
  if (!inputType) {
    throw new Error(
      `Campo hidratado, habilitado e editável não encontrado: ${selector}; página=${await path()}`,
    );
  }

  if (inputType === "date") {
    await evaluate(`(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (!setter) throw new Error("Setter nativo de HTMLInputElement indisponível");
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.blur();
    })()`);
  } else {
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "a",
      code: "KeyA",
      modifiers: 2,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "a",
      code: "KeyA",
      modifiers: 2,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Backspace",
      code: "Backspace",
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Backspace",
      code: "Backspace",
    });
    for (const character of value) {
      await send("Input.dispatchKeyEvent", {
        type: "keyDown",
        key: character,
        text: character,
        unmodifiedText: character,
      });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: character });
    }
    await evaluate("document.activeElement?.blur(); true");
  }

  const updateDeadline = Date.now() + 5_000;
  while (Date.now() < updateDeadline) {
    const recognized = await evaluate(`new Promise((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve(
        document.querySelector(${JSON.stringify(selector)})?.value === ${JSON.stringify(value)}
      ))
    ))`);
    if (recognized) return;
    await pause(50);
  }
  throw new Error(`React não reconheceu o valor do campo ${selector}; página=${await path()}`);
}

async function clickText(text, selector = "button") {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const clicked = await evaluate(`(() => {
      const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
        .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(text)});
      if (!element) return false;
      element.scrollIntoView({ block: "center", inline: "center" });
      element.click();
      return true;
    })()`);
    if (clicked) return;
    await pause(100);
  }
  throw new Error(`Elemento não encontrado: ${selector} com texto ${text}`);
}

async function resetBrowserSession() {
  await evaluate("localStorage.clear(); sessionStorage.clear(); true");
  await send("Network.clearBrowserCookies");
  await navigate("/auth");
  await waitPath("/auth", "sessão encerrada");
  await pause(2_000);
}

async function signUp(email, name) {
  await navigate("/auth");
  await waitPath("/auth", `signup ${email} abre auth`);
  await pause(2_000);
  const hydration = await evaluate(
    `({ readyState: document.readyState, tsr: self.$_TSR ?? null, scripts: [...document.scripts].map((script) => script.src).filter(Boolean) })`,
  );
  if (hydration.tsr?.hydrated === false)
    throw new Error(`Aplicação não hidratou: ${JSON.stringify(hydration)}`);
  await clickText("Criar conta", "p button");
  await setInput('input[placeholder="Seu nome"]', name);
  await setInput('input[type="email"]', email);
  await setInput('input[type="password"]', testPassword);
  await clickText("Criar conta");
  await waitPath("/completar-perfil", `signup ${email}`);
}

async function signIn(email, expected) {
  await pause(500);
  await setInput('input[type="email"]', email);
  await setInput('input[type="password"]', testPassword);
  await clickText("Entrar");
  await waitPath(expected, `login ${email}`);
}

async function completeProfile(handle) {
  await setInput('input[placeholder="Digite seu nome"]', "Pessoa Teste Auth");
  await setInput('input[placeholder="Escolha um nome de usuario"]', handle);
  await setInput('input[type="date"]', "1995-05-10");
  const enabledDeadline = Date.now() + 5_000;
  let formReady = false;
  while (Date.now() < enabledDeadline) {
    formReady = await evaluate(`(() => {
      const inputs = [...document.querySelectorAll("form input")];
      const button = [...document.querySelectorAll("form button")]
        .find((candidate) => candidate.textContent.trim() === "Continuar");
      return inputs.length === 3 && inputs.every((input) => input.value) && button && !button.disabled;
    })()`);
    if (formReady) break;
    await pause(50);
  }
  if (!formReady) throw new Error("React não habilitou o formulário de perfil preenchido");
  await clickText("Continuar");
  await pause(1_000);
  if ((await path()) === "/completar-perfil") {
    throw new Error(`Envio do perfil falhou: ${await evaluate("document.body.innerText")}`);
  }
  await waitPath("/interesses", `perfil ${handle} concluído`);
}

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");

await resetBrowserSession();
await signUp(completeEmail, `Completo ${stamp}`);
await reloadAndRemain("/completar-perfil", "primeira etapa pendente");
await completeProfile(`completo${stamp}`);
await clickText("Continuar");
await waitPath("/home", "interesses concluídos");
await reloadAndRemain("/home", "usuário completo permanece no home");

await resetBrowserSession();
await signIn(completeEmail, "/home");
await reloadAndRemain("/home", "perfil completo faz login direto no home");

await resetBrowserSession();
await signUp(incompleteEmail, `Incompleto ${stamp}`);
await reloadAndRemain("/completar-perfil", "perfil sem dados vai à primeira etapa pendente");

await resetBrowserSession();
await signIn(incompleteEmail, "/completar-perfil");
await completeProfile(`incompleto${stamp}`);
await reloadAndRemain("/interesses", "perfil sem interesses vai apenas a interesses");

await resetBrowserSession();
await signIn(incompleteEmail, "/interesses");

console.log(JSON.stringify({ completeEmail, incompleteEmail, results }, null, 2));
socket.close();
