var argv = require('minimist')(process.argv.slice(2));
const puppeteer = require('puppeteer');

const filterTerm = argv['filter'];
const alpha = argv['alpha'];

(async () => {
  if (
    alpha &&
    !Array.from('ABCDEFZHIJKLMNOPQRSTUVWXYZ').some(
      (letter) => letter === alpha.toUpperCase()
    )
  ) {
    console.error(
      '\n--alpha must be a single character from the english alphabet\n'
    );

    return process.exit(1);
  }

  const entryPoint = alpha
    ? `https://try.moderne.io/code-examples/index/${alpha}`
    : 'https://try.moderne.io/code-examples';

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // set user agent (override the default headless User Agent)
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.0 Safari/537.36'
  );

  await page.goto(entryPoint);

  const gotoMethodsOnCurrentPage = async () => {
    const assetUrls = await page.$$eval('ul ul a', (assetLinks) =>
      assetLinks.map((link) => link.href)
    );

    const filteredUrls = filterTerm
      ? assetUrls.filter((url) => {
          const [className, method] = url.split('/').slice(-2);
          return className.includes(filterTerm) || method.includes(filterTerm);
        })
      : assetUrls;

    for (let assetsUrl of filteredUrls) {
      console.log(`crawling: ${assetsUrl}`);
      await page.goto(assetsUrl);
      await page.waitForSelector('#results-response');
      await page.waitForTimeout(200);
    }
  };

  await gotoMethodsOnCurrentPage();

  await browser.close();
})();
