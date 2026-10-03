import { useCallback, useEffect, useState } from "react";
import { supabase, fetchMenu } from "./supabase";
import { BUCKET, MAX_PHOTOS, photoUrl, resizeImage } from "./photos";

const THEMES = [
  ["garden", "Garden"],
  ["night", "Night"],
  ["sun", "Sunny"],
  ["plum", "Plum"],
];

// text-base keeps phones from zooming in when a field is focused.
const INPUT = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900";
const PRIMARY = "rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white";

// Text box that saves when you leave it, and only if the value changed.
function Field({ value, onSave, ...props }) {
  const [v, setV] = useState(value ?? "");
  useEffect(() => setV(value ?? ""), [value]);
  return (
    <input
      {...props}
      className={INPUT}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => String(v) !== String(value ?? "") && onSave(v)}
    />
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr("Wrong email or password.");
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-24 max-w-sm space-y-3 p-4">
      <h1 className="text-2xl font-bold text-slate-900">Menu admin</h1>
      <input className={INPUT} type="email" required placeholder="Email" autoComplete="username"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={INPUT} type="password" required placeholder="Password" autoComplete="current-password"
        value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button className={PRIMARY + " w-full"}>Sign in</button>
    </form>
  );
}

function AddCategory({ onAdd }) {
  const [en, setEn] = useState("");
  const [ar, setAr] = useState("");
  async function submit(e) {
    e.preventDefault();
    await onAdd(en.trim(), ar.trim());
    setEn(""); setAr("");
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <input required className={INPUT} placeholder="New category (English)" value={en} onChange={(e) => setEn(e.target.value)} />
      <input className={INPUT} dir="rtl" placeholder="القسم بالعربي" value={ar} onChange={(e) => setAr(e.target.value)} />
      <button className={PRIMARY + " col-span-2 sm:col-span-1"}>Add category</button>
    </form>
  );
}

function AddItem({ onAdd }) {
  const [f, setF] = useState({ name_en: "", name_ar: "", price: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    await onAdd({ name_en: f.name_en.trim(), name_ar: f.name_ar.trim(), price: Number(f.price) });
    setF({ name_en: "", name_ar: "", price: "" });
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
      <input required className={INPUT} placeholder="Item name (English)" value={f.name_en} onChange={set("name_en")} />
      <input className={INPUT} dir="rtl" placeholder="الاسم بالعربي" value={f.name_ar} onChange={set("name_ar")} />
      <input required className={INPUT} type="number" min="0" step="0.5" inputMode="decimal"
        placeholder="Price" value={f.price} onChange={set("price")} />
      <button className={PRIMARY}>Add item</button>
    </form>
  );
}

function ItemCard({ item, onSave, onDelete, onPhoto, onRemovePhoto, canAddPhoto, busy }) {
  const save = (patch) => onSave(item, patch);
  const url = photoUrl(item.photo_path);
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-3">
        {url ? (
          <img src={url} alt="" className="size-16 rounded-lg object-cover" />
        ) : (
          <div className="grid size-16 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">No photo</div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {(url || canAddPhoto) ? (
            <label className={"cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-slate-800" + (busy ? " opacity-50" : "")}>
              {busy ? "Uploading…" : url ? "Change photo" : "Add photo"}
              <input type="file" accept="image/*" className="sr-only" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onPhoto(f); }} />
            </label>
          ) : (
            <span className="text-xs font-normal text-slate-500">All {MAX_PHOTOS} photos used</span>
          )}
          {url && !busy && <button onClick={onRemovePhoto} className="px-2 py-2 text-red-600">Remove photo</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field value={item.name_en} placeholder="Name (English)" onSave={(v) => save({ name_en: v })} />
        <Field dir="rtl" value={item.name_ar} placeholder="الاسم" onSave={(v) => save({ name_ar: v })} />
        <Field value={item.desc_en} placeholder="Description (optional)" onSave={(v) => save({ desc_en: v })} />
        <Field dir="rtl" value={item.desc_ar} placeholder="الوصف (اختياري)" onSave={(v) => save({ desc_ar: v })} />
        <label className="text-xs text-slate-500">
          Price
          <Field type="number" min="0" step="0.5" inputMode="decimal" value={item.price}
            onSave={(v) => save({ price: Number(v) })} />
        </label>
        <label className="text-xs text-slate-500">
          Sale price (leave empty for no sale)
          <Field type="number" min="0" step="0.5" inputMode="decimal" value={item.sale_price ?? ""}
            onSave={(v) => save({ sale_price: v === "" ? null : Number(v) })} />
        </label>
      </div>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input type="checkbox" className="size-5" checked={item.sold_out}
            onChange={(e) => save({ sold_out: e.target.checked })} />
          Sold out
        </label>
        <button onClick={onDelete} className="text-sm font-semibold text-red-600">Delete item</button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [menu, setMenu] = useState(undefined); // undefined = loading, null = no menu for this account
  const [err, setErr] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  const reload = useCallback(async () => {
    try { setMenu(await fetchMenu({ ownerId: uid })); } catch (e) { setErr(e.message); }
  }, [uid]);

  useEffect(() => {
    if (uid) reload();
  }, [uid, reload]);

  // Runs any database change, shows errors, then refreshes the screen.
  async function run(query) {
    setErr("");
    const { error } = await query;
    if (error) setErr(error.message);
    await reload();
    return !error;
  }

  const nextPos = (list) => (list.length ? Math.max(...list.map((x) => x.position)) + 1 : 0);

  const updateMenu = (patch) => run(supabase.from("menus").update(patch).eq("id", menu.id));
  const addCategory = (name_en, name_ar) =>
    run(supabase.from("categories").insert({ menu_id: menu.id, name_en, name_ar, position: nextPos(menu.categories) }));
  const updateCategory = (id, patch) => run(supabase.from("categories").update(patch).eq("id", id));
  const removeFiles = async (paths) => {
    const list = paths.filter(Boolean);
    if (list.length) await supabase.storage.from(BUCKET).remove(list);
  };
  const deleteCategory = async (c) => {
    if (!window.confirm(`Delete "${c.name_en}" and all ${c.items.length} items in it?`)) return;
    if (await run(supabase.from("categories").delete().eq("id", c.id))) {
      await removeFiles(c.items.map((i) => i.photo_path));
    }
  };
  const addItem = (c, vals) =>
    run(supabase.from("items").insert({ category_id: c.id, ...vals, position: nextPos(c.items) }));
  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.name_en}"?`)) return;
    if (await run(supabase.from("items").delete().eq("id", item.id))) await removeFiles([item.photo_path]);
  };

  async function uploadPhoto(item, file) {
    const count = menu.categories.reduce((n, c) => n + c.items.filter((i) => i.photo_path).length, 0);
    if (!item.photo_path && count >= MAX_PHOTOS) return setErr(`You can add up to ${MAX_PHOTOS} photos.`);
    setErr("");
    setBusyId(item.id);
    try {
      const blob = await resizeImage(file);
      const path = `${menu.id}/${item.id}-${Date.now()}.jpg`;
      const up = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
      });
      if (up.error) throw up.error;
      const { error } = await supabase.from("items").update({ photo_path: path }).eq("id", item.id);
      if (error) {
        await removeFiles([path]);
        throw error;
      }
      await removeFiles([item.photo_path]); // old photo, if any
    } catch (e) {
      setErr(e.message || "Could not upload the photo.");
    }
    setBusyId(null);
    await reload();
  }

  async function removePhoto(item) {
    if (await run(supabase.from("items").update({ photo_path: null }).eq("id", item.id))) {
      await removeFiles([item.photo_path]);
    }
  }

  function saveItem(item, patch) {
    const price = patch.price ?? item.price;
    const sale = "sale_price" in patch ? patch.sale_price : item.sale_price;
    if (sale != null && sale >= price) {
      setErr("The sale price must be lower than the regular price.");
      return reload(); // puts the old value back in the box
    }
    return run(supabase.from("items").update(patch).eq("id", item.id));
  }

  if (session === undefined) return <p className="p-6 text-slate-500">Loading…</p>;
  if (!session) return <Login />;
  if (menu === undefined) return <p className="p-6 text-slate-500">Loading…</p>;
  if (menu === null)
    return (
      <p className="p-6 text-slate-700">
        No menu is linked to this account yet. Create it in Supabase (see the end of schema.sql).
      </p>
    );

  const photoCount = menu.categories.reduce((n, c) => n + c.items.filter((i) => i.photo_path).length, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{menu.name_en}</h1>
        <div className="flex gap-4 text-sm font-semibold">
          <a className="text-slate-700 underline" href="/" target="_blank" rel="noreferrer">View menu</a>
          <button className="text-slate-700 underline" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </header>

      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <p className="text-sm text-slate-500">Photos used: {photoCount} / {MAX_PHOTOS}</p>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h2 className="font-semibold text-slate-900">Look and name</h2>
        <div className="grid grid-cols-2 gap-2">
          <Field value={menu.name_en} placeholder="Name (English)" onSave={(v) => updateMenu({ name_en: v })} />
          <Field dir="rtl" value={menu.name_ar} placeholder="الاسم" onSave={(v) => updateMenu({ name_ar: v })} />
          <Field value={menu.currency_en} placeholder="Currency (English)" onSave={(v) => updateMenu({ currency_en: v })} />
          <Field dir="rtl" value={menu.currency_ar} placeholder="العملة" onSave={(v) => updateMenu({ currency_ar: v })} />
        </div>
        <div className="flex flex-wrap gap-2">
          {THEMES.map(([id, label]) => (
            <button key={id} aria-pressed={menu.theme === id} onClick={() => updateMenu({ theme: id })}
              className="rounded-full border border-slate-900 px-3 py-1.5 text-sm text-slate-900 aria-pressed:bg-slate-900 aria-pressed:text-white">
              {label}
            </button>
          ))}
        </div>
      </section>

      {menu.categories.map((c) => (
        <section key={c.id} className="space-y-3 rounded-xl border border-slate-300 bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Field value={c.name_en} placeholder="Category (English)" onSave={(v) => updateCategory(c.id, { name_en: v })} />
            <Field dir="rtl" value={c.name_ar} placeholder="القسم" onSave={(v) => updateCategory(c.id, { name_ar: v })} />
          </div>
          {c.items.map((item) => (
            <ItemCard key={item.id} item={item} onSave={saveItem} onDelete={() => deleteItem(item)}
              onPhoto={(file) => uploadPhoto(item, file)} onRemovePhoto={() => removePhoto(item)}
              canAddPhoto={photoCount < MAX_PHOTOS} busy={busyId === item.id} />
          ))}
          <AddItem onAdd={(vals) => addItem(c, vals)} />
          <button onClick={() => deleteCategory(c)} className="text-sm font-semibold text-red-600">
            Delete category
          </button>
        </section>
      ))}

      <AddCategory onAdd={addCategory} />
    </div>
  );
}