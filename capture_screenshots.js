import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    await page.goto('http://localhost:5173/');

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'screenshot_timing.png' });

    // Click on TIRES tab
    await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('.app-analytics-tab')).find(el => el.textContent.includes('TIRES'));
        if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'screenshot_tires.png' });

    // Also check the dropdown
    await page.evaluate(() => {
        const btn = document.querySelector('.app-topbar__race-btn');
        if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'screenshot_dropdown.png' });

    await browser.close();
    console.log('Screenshots captured');
})();
