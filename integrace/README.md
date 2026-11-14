# Nasazovací sada SEO pro weby Elektro Specialist s.r.o.

Připraveno 14. 11. 2026 na základě ověřeného veřejného obsahu webů a fotografií oprav dodaných vlastníkem. **Soubory v této složce jsou připravené k nasazení, nikoli automaticky zveřejněné na doménách níže.** Veřejně zveřejněné jsou pouze v tomto GitHub repozitáři.

## Cílové weby a soubory

1. `diagnostikazdarma.cz/`: v části „Naše práce“ nahradit zástupný text obsahem `diagnostikazdarma.cz/nase-prace-section.html` (správný název souboru: `nase-prace-section.html`). Nezasahovat do objednávky, kalkulátoru, formulářů ani telefonů.
2. `www.gastro-servis-expres.cz/`: přidat `gastro-servis-expres.cz/portfolio-section.html` před kontaktní blok a nahrát `gastro-servis-expres.cz/sitemap.xml` přesně na `/sitemap.xml`. Na konec stávajícího `/robots.txt` přidat řádek `Sitemap: https://www.gastro-servis-expres.cz/sitemap.xml`. Stávající pokyny robots.txt zachovat; soubor nejprve přesně načíst ze zdroje.
3. `gastro-servis-expres.online/prace/`: vložit `gastro-servis-expres.online/prace-section.html` bez úprav existujících oprav Silanos a myčky s únikem vody.

## Audit webu gastro-servis-expres.cz

- Ověřeno: homepage a všech 22 stránek `servis-gastro-praha-1.html` až `servis-gastro-praha-22.html` odpovídá a má vlastní odpovídající canonical.
- Zkontrolované cesty `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap-index.xml`, `/sitemap.txt`, `/sitemap/` vrací 404.
- Připravená sitemap obsahuje 23 reálně ověřených URL. Neuvádí `lastmod`, protože data poslední změny stránek nebyla ověřena.

## Kontrola po nahrání

- Ověřit HTTP 200 pro 23 URL v mapě a pro `https://www.gastro-servis-expres.cz/sitemap.xml`.
- Ověřit odpověď `/robots.txt` včetně původních pravidel a nového řádku `Sitemap:`.
- Kliknout všechny nové odkazy a zkontrolovat skutečné fotografie, kontaktní CTA, formuláře, mobilní zobrazení a stávající canonical.
- Ověřit přístup Google Search Console; přidání sitemap do Search Console může urychlit objevení, ale neznamená zaručenou indexaci.
- Telefonní čísla a osobní údaje zákazníků nesmí být doplňovány ani měněny. Nezveřejňovat vymyšlené opravy, ceny, recenze či garance příjezdu.
