export const SELECTION_LONG_PRESS_MS = 500;

export function selectedCountLabel(count: number): string {
  if (count === 1) return "1 selecionada";
  return `${count} selecionadas`;
}

export function longPressActionForMessage(isOwn: boolean): "select" | "peer-actions" {
  return isOwn ? "select" : "peer-actions";
}

export function isChatMessageSelectable(from: "me" | "them"): boolean {
  return from === "me";
}

export function batchDeleteTitle(count: number): string {
  if (count === 1) return "Excluir 1 item?";
  return `Excluir ${count} itens?`;
}

export function batchDeleteDescription(count: number): string {
  if (count === 1) {
    return "O item selecionado foi enviado por você e será removido desta conversa.";
  }
  return "Os itens selecionados foram enviados por você e serão removidos desta conversa.";
}

export function singleDeleteCopy(kind: "image" | "video" | "file" | "text"): {
  title: string;
  description: string;
} {
  if (kind === "image") {
    return {
      title: "Excluir esta foto?",
      description: "Essa ação removerá a foto desta conversa.",
    };
  }
  if (kind === "video") {
    return {
      title: "Excluir este vídeo?",
      description: "Essa ação removerá o vídeo desta conversa.",
    };
  }
  if (kind === "file") {
    return {
      title: "Excluir este documento?",
      description: "Essa ação removerá o arquivo desta conversa.",
    };
  }
  return {
    title: "Excluir esta mensagem?",
    description: "Essa ação removerá a mensagem desta conversa.",
  };
}

export function partialDeleteMessage(deleted: number, failed: number): string {
  return `${deleted} ${deleted === 1 ? "item excluído" : "itens excluídos"}. ${failed} ${failed === 1 ? "item não pôde ser excluído" : "itens não puderam ser excluídos"}.`;
}
