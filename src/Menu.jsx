import { useEffect, useState } from "react";
import { fetchMenu } from "./supabase";
import { photoUrl } from "./photos";

const TEXT = {
  en: { out: "Sold out", sale: "Sale", switch: "عربي", dir: "ltr", loading: "Loading…", missing: "Menu not found." },
  ar: { out: "نفد", sale: "خصم", switch: "English", dir: "rtl", loading: "جارٍ التحميل…", missing: "القائمة غير موجودة." },
};

// Theme variants (garden:, night:, sun:, plum:) are defined in index.css.
const BTN =
  "cursor-pointer rounded-full border-[1.5px] border-ink bg-transparent px-3 py-1.5 text-sm text-ink " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-acc";

const ROW =
  "flex items-center gap-3 py-2.5 " +
  "garden:border-b garden:border-dotted garden:border-line " +
  "night:mb-2.5 night:rounded-2xl night:border night:border-line night:bg-card night:px-4 night:py-3.5 " +
  "plum:mb-2.5 plum:rounded-sm plum:border plum:border-line plum:bg-card plum:px-4 plum:py-3.5 " +
  "sun:mb-3 sun:rounded-md sun:border-[3px] sun:border-line sun:bg-card sun:px-3.5 sun:py-3 sun:shadow-[4px_4px_0_var(--line)]";

const PRICE =
  "ms-auto whitespace-nowrap font-extrabold text-acc " +
  "sun:rounded-full sun:bg-ink sun:px-2.5 sun:py-0.5 sun:text-[#FFD43B]";

// Tags sit in their own flex row (not inside the name text), so Arabic letters can never be overlapped.
const TAG = "whitespace-nowrap rounded-full border border-current px-2.5 text-xs leading-5 font-normal";

function usePersisted(key, initial) {
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem(key) || initial; } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
}

function Item({ item, lang, t }) {
  const onSale = item.sale_price != null && !item.sold_out;
  const photo = photoUrl(item.photo_path);
  const desc = item[`desc_${lang}`] || item.desc_en;
  return (
    <div className={ROW + (item.sold_out ? " opacity-50" : "")}>
      {photo && (
        <img src={photo} alt="" width="64" height="64" loading="lazy" decoding="async"
          className="size-16 shrink-0 rounded-lg object-cover" />
      )}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold">{item[`name_${lang}`] || item.name_en}</span>
          {item.sold_out && <span className={TAG}>{t.out}</span>}
          {onSale && <span className={TAG}>{t.sale}</span>}
        </div>
        {desc && <span className="block text-sm font-normal text-mute">{desc}</span>}
      </div>
      <span className={PRICE}>
        {onSale ? (
          <>
            <s className="me-2 font-normal opacity-60">{Number(item.price)}</s>
            {Number(item.sale_price)}
          </>
        ) : (
          Number(item.price)
        )}
      </span>
    </div>
  );
}

export default function Menu({ slug }) {
  const [menu, setMenu] = useState(undefined); // undefined = loading, null = not found
  const [lang, setLang] = usePersisted("lang", "en");
  const t = TEXT[lang];

  useEffect(() => {
    fetchMenu({ slug }).then(setMenu).catch(() => setMenu(null));
  }, [slug]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang, t.dir]);

  return (
    <div
      data-t={menu?.theme ?? "garden"}
      className="min-h-dvh bg-bg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] font-theme text-ink transition-colors duration-300 motion-reduce:transition-none"
    >
      <header className="sticky top-0 z-10 flex items-center border-b border-line bg-bg px-4 py-2.5">
        <button className={BTN + " ms-auto"} onClick={() => setLang(lang === "en" ? "ar" : "en")}>
          {t.switch}
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-4.5 pt-7 pb-14">
        {menu === undefined && <p className="text-mute">{t.loading}</p>}
        {menu === null && <p className="text-mute">{t.missing}</p>}
        {menu && (
          <>
            <h1 className="mb-1 text-4xl leading-tight plum:text-center plum:text-5xl sun:text-5xl sun:font-extrabold sun:tracking-tight">
              {menu[`name_${lang}`] || menu.name_en}
            </h1>
            <p className="mb-7 text-mute plum:text-center">{menu[`currency_${lang}`]}</p>

            {menu.categories
              .filter((c) => c.items.length > 0)
              .map((cat) => (
                <section key={cat.id}>
                  <h2 className="mt-8 mb-3 text-xl text-acc plum:border-y plum:border-line plum:py-1.5 plum:text-center">
                    {cat[`name_${lang}`] || cat.name_en}
                  </h2>
                  {cat.items.map((item) => (
                    <Item key={item.id} item={item} lang={lang} t={t} />
                  ))}
                </section>
              ))}
          </>
        )}
      </main>
    </div>
  );
}