import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:5173/');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click on TIRES tab
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('.app-analytics-tab')).find(el => el.textContent.includes('TIRES'));
    if (btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const layout = await page.evaluate(() => {
    const center = document.querySelector('.app-main__center');
    return center ? center.innerHTML : 'No Center';
  });
  
  console.log(layout);
  await browser.close();
})();
