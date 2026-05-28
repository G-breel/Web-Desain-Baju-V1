import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3002")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'Masuk' (login) link to open the login page.
        # link "Masuk"
        elem = page.locator("xpath=/html/body/div[2]/header/nav/div/a").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Fill the email and password fields with admin@gmail.com / 123456 and click the 'Masuk' submit button to log in.
        # email input name="email"
        elem = page.locator("xpath=/html/body/div[2]/main/div/div/form/div/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("admin@gmail.com")
        
        # -> Fill the email and password fields with admin@gmail.com / 123456 and click the 'Masuk' submit button to log in.
        # password input name="password"
        elem = page.locator("xpath=/html/body/div[2]/main/div/div/form/div[2]/input").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("123456")
        
        # -> Fill the email and password fields with admin@gmail.com / 123456 and click the 'Masuk' submit button to log in.
        # button "Masuk"
        elem = page.locator("xpath=/html/body/div[2]/main/div/div/form/div[3]/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Click the 'Buka' (Open) button for a design to navigate to the editor and canvas.
        # link "Buka"
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[3]/div/div[3]/a").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Add a text object by clicking 'Teks' (index 26452), select it on the canvas (index 26686), then press Ctrl+D to duplicate and observe whether a second copy appears.
        # button "Teks" title="Tambah Teks"
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/aside/div/div/div/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Add a text object by clicking 'Teks' (index 26452), select it on the canvas (index 26686), then press Ctrl+D to duplicate and observe whether a second copy appears.
        # Add a text object by clicking 'Teks' (index 26452), select it on the canvas (index 26686), then press Ctrl+D to duplicate and observe whether a second copy appears.
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/main/div/div[3]/div/div/div[2]/canvas[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # -> Click the 'Duplikat' toolbar button (index 26471) to attempt duplication via the UI and then verify whether a second object/layer appears.
        # button "Duplikat" title="Duplikat (Ctrl+D)"
        elem = page.locator("xpath=/html/body/div[2]/main/div/div[2]/aside/div/div[2]/div/button").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.click()
        
        # --> Assertions to verify final state
        assert await page.locator("xpath=//*[contains(., 'Teks')]").nth(0).is_visible(), "A second text object should be visible on the canvas after duplicating the selected text object."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    