import { test, expect, dialog, addTaskButton, type Page } from '../helpers';
import { US, seedRunningSprint } from '../sprint/seed';

// Frosted surfaces (spec 013-fond-vivant-surfaces-depolies): R81, R82, R83, R84.

/**
 * Buttons, fields and tabs of the page content that sit straight on the animated background:
 * neither the control nor any ancestor up to `main` paints a background. Expected: none.
 */
const controlsOnBackground = (page: Page) =>
  page.locator('main').evaluate((main) => {
    const paints = (el: Element) => {
      const style = getComputedStyle(el);
      return style.backgroundImage !== 'none' || !['transparent', 'rgba(0, 0, 0, 0)'].includes(style.backgroundColor);
    };
    const onBackground: string[] = [];
    for (const control of main.querySelectorAll('button, select, input, textarea, [role="tab"]')) {
      let el: Element | null = control;
      let covered = false;
      while (el && el !== main && !covered) {
        covered = paints(el);
        el = el.parentElement;
      }
      if (!covered) onBackground.push(control.textContent?.trim() || control.tagName.toLowerCase());
    }
    return onBackground;
  });

const raised = async (page: Page, locator: ReturnType<Page['locator']>, what: string) => {
  await expect(locator, `${what} missing`).toBeVisible();
  const style = await locator.evaluate((el) => {
    const s = getComputedStyle(el);
    return { shadow: s.boxShadow, width: s.borderTopWidth, colour: s.borderTopColor };
  });
  expect(style.shadow, `${what} not raised`).not.toBe('none');
  // A transparent border (kept for the focus ring) is not a visible one.
  const visibleBorder = style.width !== '0px' && alpha(style.colour) > 0;
  expect(visibleBorder, `${what} has a border (${style.width} ${style.colour})`).toBe(false);
};

/** Alpha of a computed colour: 1 for `rgb(…)`, the 4th value for `rgba(…)`, 0 for `transparent`. */
const alpha = (colour: string) => {
  if (colour === 'transparent') return 0;
  const parts = colour.match(/[\d.]+/g)!.map(Number);
  return colour.startsWith('rgba') ? parts[3] : 1;
};

/** Background of the first element painting one, from `el` down (the dialog role sits on a wrapper). */
const paintedBackground = (page: Page, selector: ReturnType<Page['locator']>) =>
  selector.evaluate((root) => {
    for (const el of [root, ...root.querySelectorAll('*')]) {
      const colour = getComputedStyle(el).backgroundColor;
      if (!['transparent', 'rgba(0, 0, 0, 0)'].includes(colour)) return colour;
    }
    return 'transparent';
  });

test.describe('page headers', () => {
  test('R81 chaque page : titre et commandes dans un panneau, aucun contrôle posé sur le fond', async ({ page, api }) => {
    await seedRunningSprint(api);
    const pages: [string, string, string[]][] = [
      ['/backlog', 'Backlog', ['New Story', 'Sandbox']],
      ['/features', 'Features', ['New Feature']],
      ['/planning', 'Planning', []],
      ['/sprint', 'Sprint', ['Clôturer le sprint']],
    ];
    for (const [path, title, controls] of pages) {
      await page.goto(path);
      const header = page.locator('main .page-header');
      await expect(header.getByRole('heading', { level: 1, name: title }), `${title}: no title in a panel`).toBeVisible();
      for (const name of controls)
        await expect(header.getByRole(name === 'Sandbox' ? 'tab' : 'button', { name: new RegExp(name) }), `${title}: ${name} not in the panel`).toBeVisible();
      if (path === '/sprint') await expect(header.getByRole('combobox', { name: 'Sprint affiché' })).toBeVisible();
      expect(await controlsOnBackground(page), `${title}: controls on the background`).toEqual([]);
    }
  });
});

test.describe('relief', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test.describe(scheme, () => {
      test.use({ colorScheme: scheme });

      test(`R82 badges et boutons en relief, sans bordure (${scheme})`, async ({ page, api }) => {
        await seedRunningSprint(api);
        await page.goto('/sprint');
        const header = page.locator('main .page-header');
        await raised(page, header.getByText('en cours', { exact: true }), 'badge « en cours »');
        await raised(page, page.getByRole('region', { name: US }).getByText('8 pts', { exact: true }), 'badge « 8 pts »');
        await raised(page, header.getByRole('button', { name: 'Clôturer le sprint' }), '« Clôturer le sprint »');
        await raised(page, addTaskButton(page, US), '« + »');
        await raised(page, page.locator('app-sidebar').getByRole('button', { name: 'Réduire le menu' }), 'sidebar toggle');
      });
    });
  }
});

test.describe('wide screen', () => {
  test.use({ viewport: { width: 1600, height: 900 } });

  test('R83 contenu centré à côté de la barre, dépliée puis repliée', async ({ page }) => {
    await page.goto('/backlog');
    const centred = async () => {
      const side = (await page.locator('app-sidebar aside').boundingBox())!;
      const main = (await page.locator('main').boundingBox())!;
      const left = main.x - (side.x + side.width);
      const right = 1600 - (main.x + main.width);
      return Math.abs(left - right) < 2 && left > 0;
    };
    await expect.poll(centred, { message: 'not centred, sidebar expanded' }).toBe(true);
    await page.locator('app-sidebar').getByRole('button', { name: 'Réduire le menu' }).click();
    await expect.poll(centred, { message: 'not centred, sidebar collapsed' }).toBe(true);
  });
});

test('R84 modal et toast opaques', async ({ page }) => {
  await page.goto('/backlog');
  await page.getByRole('button', { name: 'New Story' }).click();
  const modal = await paintedBackground(page, dialog(page));
  expect(alpha(modal), `translucent modal (${modal})`).toBe(1);

  // A blank title is refused by the API: an error toast.
  await dialog(page).getByLabel('Titre').fill('   ');
  await dialog(page).getByRole('tab', { name: /Tasks/ }).click();
  await dialog(page).getByLabel('Nom de la tâche').fill('Tâche initiale');
  await dialog(page).getByRole('button', { name: 'Ajouter la tâche' }).click();
  await dialog(page).getByRole('tab', { name: 'Details' }).click();
  await dialog(page).getByRole('button', { name: "Créer l'US" }).click();
  const toast = page.locator('[data-sonner-toast]').first();
  await expect(toast).toBeVisible();
  const toastColour = await paintedBackground(page, toast);
  expect(alpha(toastColour), `translucent toast (${toastColour})`).toBe(1);
});
