# Bloky pro propojení firemních webů se skutečným portfoliem

Tyto HTML ukázky jsou **připravené, ale nejsou zatím nasazené na cílových webech**. Před nasazením je nutné mít oprávnění k editaci odpovídajícího webu; nezasahovat do formulářů, telefonních tlačítek ani existujících článků.

## 1. diagnostikazdarma.cz — sekce „Naše práce“

Nahradit pouze současný zástupný text „Ukázky oprav zde postupně doplníme“; ostatní část stránky zachovat.

```html
<section aria-labelledby="realne-opravy-kavovaru">
  <h2 id="realne-opravy-kavovaru">Skutečné opravy kávovarů z naší dílny</h2>
  <p>Podívejte se na vlastní fotografie z oprav kávovarů DeLonghi Magnifica, Krups, Nespresso, Nivona a Tchibo. U jednotlivých zakázek uvádíme nahlášené příznaky a praktické informace k diagnostice.</p>
  <a href="https://servisaopravaspotrebice-alt.github.io/elektro-specialist-media/pripady/oprava-kavovaru-delonghi.html">DeLonghi Magnifica – zaseknutá spařovací jednotka</a>
  <a href="https://servisaopravaspotrebice-alt.github.io/elektro-specialist-media/pripady/oprava-kavovaru-krups.html">Krups – fotodokumentace tří oprav</a>
  <a href="https://servisaopravaspotrebice-alt.github.io/elektro-specialist-media/poradna/jak-nahlasit-poruchu-kavovaru-praha.html">Co připravit před servisem kávovaru</a>
</section>
```

## 2. gastro-servis-expres.cz — sekce „Fotografie servisních zásahů“

Přidat jako samostatný doplňkový blok, bez zásahů do kontaktních údajů a formulářů.

```html
<section aria-labelledby="gastro-prace-foto">
  <h2 id="gastro-prace-foto">Fotografie z oprav gastro techniky</h2>
  <p>Prohlédněte si skutečné fotografie servisního zásahu na konvektomatu s frekvenčním měničem ABB a dokumentaci profesionální myčky CLASSEQ. Každé zařízení vyžaduje individuální diagnostiku.</p>
  <a href="https://servisaopravaspotrebice-alt.github.io/elektro-specialist-media/pripady/oprava-konvektomatu-abb.html">Fotodokumentace konvektomatu</a>
  <a href="https://servisaopravaspotrebice-alt.github.io/elektro-specialist-media/pripady/servis-mycky-classeq.html">Fotodokumentace myčky CLASSEQ</a>
</section>
```

## 3. gastro-servis-expres.online/prace/ — doplnění existujících reportáží

Zachovat existující článek o úniku vody a případ Silanos; pouze přidat vlastní fotogalerii jako samostatný odkaz.

```html
<section aria-labelledby="dalsi-realne-opravy">
  <h2 id="dalsi-realne-opravy">Další dokumentované opravy gastro zařízení</h2>
  <p>Vedle podrobných reportáží z oprav myček zveřejňujeme také fotografie profesionální myčky CLASSEQ a konvektomatu s měničem ABB. Na snímcích jsou skutečná servisovaná zařízení bez údajů zákazníků.</p>
  <a href="https://servisaopravaspotrebice-alt.github.io/elektro-specialist-media/#gastro">Otevřít fotogalerii gastro zařízení</a>
  <a href="https://servisaopravaspotrebice-alt.github.io/elektro-specialist-media/poradna/servis-konvektomatu-a-gastro-mycek-praha.html">Jak připravit nahlášení poruchy gastro zařízení</a>
</section>
```

## Kontrola po nasazení

- Ověřit funkčnost stávajících tlačítek, formulářů a kontaktů.
- Přezkoušet odkazy, mobilní zobrazení a indexovatelnost.
- Zachovat stávající canonical URL domén a jejich vlastní sitemap.
- Nepřebírat stejné texty na různých doménách: výše uvedené bloky mají různé úvodní texty.
- Do odkazovaného portfolia neumisťovat telefony a údaje zákazníků.
