let notifyContainer: HTMLDivElement | null = null;

export function notify(msg: string) {

  if (!notifyContainer) {
    notifyContainer = document.createElement("div");
    notifyContainer.style.position = "fixed";
    notifyContainer.style.bottom = "20px";
    notifyContainer.style.right = "20px";
    notifyContainer.style.display = "flex";
    notifyContainer.style.flexDirection = "column";
    notifyContainer.style.alignItems = "flex-end";
    notifyContainer.style.gap = "10px"; // espace entre notifs
    notifyContainer.style.zIndex = "1000";
    document.body.appendChild(notifyContainer);
  }


  const div = document.createElement("div");
  div.textContent = msg;
  div.style.background = "black";
  div.style.fontSize = "9px";
  div.style.color = "white";
  div.style.padding = "10px 15px";
  div.style.borderRadius = "8px";
  div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
  div.style.opacity = "0";
  div.style.transition = "opacity 0.3s ease";

  notifyContainer.appendChild(div);

  requestAnimationFrame(() => {
    div.style.opacity = "1";
  });

  setTimeout(() => {
    div.style.opacity = "0";
    setTimeout(() => div.remove(), 3000);
  }, 3000);
}
