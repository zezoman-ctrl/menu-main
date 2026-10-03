import Menu from "./Menu";
import Admin from "./Admin";

// "/"            -> public menu (the first menu)
// "/m/my-cafe"   -> public menu with that slug
// "/admin"       -> owner login + editor
// app ready
export default function App() {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return <Admin />;
  const slug = path.startsWith("/m/") ? path.slice(3).replace(/\/+$/, "") : null;
  return <Menu slug={slug} />;
}