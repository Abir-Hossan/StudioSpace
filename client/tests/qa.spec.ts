import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("four social brands have accessible, keyboard-operable exact destinations", async ({page, context}) => {
  await page.goto("/");
  const links = page.getByRole("group", {name:"Social media platforms"}).getByRole("link");
  await expect(links).toHaveCount(4);
  const platforms = [["Facebook","https://www.facebook.com/"],["Instagram","https://www.instagram.com/"],["X (Twitter)","https://x.com/?lang=en"],["YouTube","https://www.youtube.com/"]];
  // Isolate navigation correctness from third-party bot/login restrictions.
  await context.route(/https:\/\/(www\.)?(facebook\.com|instagram\.com|x\.com|youtube\.com)\//, route => route.fulfill({status:200,contentType:"text/html",body:"<title>External navigation verified</title>"}));
  for (const [name, url] of platforms) {
    const link = page.getByRole("link",{name,exact:true});
    await expect(link).toHaveAttribute("href",url); await expect(link).toHaveAttribute("target","_blank"); await expect(link).toHaveAttribute("rel","noopener noreferrer");
    await link.focus(); await expect(link).toBeFocused();
    const popupEvent = page.waitForEvent("popup"); await page.keyboard.press("Enter"); const popup = await popupEvent;
    await popup.waitForLoadState(); expect(popup.url()).toBe(url); await popup.close();
  }
  await page.setViewportSize({width:320,height:740});
  for (const [name] of platforms) await expect(page.getByRole("link",{name,exact:true})).toBeVisible();
  await page.screenshot({path:"../design-review/social-footer-mobile.png",fullPage:true});
});

test("public and authenticated page links resolve to real routes and anchors", async ({page}) => {
  const errors: string[] = []; page.on("pageerror",e=>errors.push(e.message));
  const publicRoutes=["/","/studios","/about","/how-it-works","/terms","/privacy","/login","/register"];
  const api=await page.request.get("/api/studios"); const id=(await api.json()).items[0]._id;
  const rows: {page:string;href:string;status:string}[]=[];
  const inspect=async(path:string)=>{
    await page.goto(path); await expect(page.locator("[data-page-transition]")).toHaveCSS("opacity","1");
    await expect(page.locator(".skeleton")).toHaveCount(0);
    const hrefs=await page.locator("a[href]").evaluateAll(nodes=>Array.from(new Set(nodes.map(n=>n.getAttribute("href")!))));
    for(const href of hrefs){
      expect(href,`placeholder on ${path}`).not.toBe("#"); expect(href).not.toContain("undefined"); expect(href).not.toMatch(/^javascript:/i);
      if(!href.startsWith("/"))continue;
      const url=new URL(href,"http://local");
      if(url.hash && url.pathname===path){ expect(await page.locator(`[id="${decodeURIComponent(url.hash.slice(1))}"]`).count(),href).toBeGreaterThan(0); }
      const response=await page.request.get(href); expect(response.status(),`${path} -> ${href}`).toBeLessThan(400);
      rows.push({page:path,href,status:String(response.status())});
    }
  };
  for(const route of [...publicRoutes,`/studios/${id}`])await inspect(route);
  await page.goto("/login"); await page.getByLabel("Email address",{exact:true}).fill("host@studiospace.local"); await page.getByLabel("Password",{exact:true}).fill("StudioPass1"); await page.getByRole("button",{name:"Sign In",exact:true}).click(); await expect(page).toHaveURL("/dashboard");
  for(const route of ["/dashboard","/my-listings","/my-bookings","/host-bookings","/wishlist","/profile-settings","/add-studio",`/studios/edit/${id}`])await inspect(route);
  await page.goto("/studios"); await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await page.locator(".public-header nav").getByRole("link",{name:"About Us",exact:true}).click(); await expect(page).toHaveURL("/about");
  await page.goBack(); await expect(page).toHaveURL("/studios"); await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await page.goForward(); await expect(page).toHaveURL("/about"); await page.reload(); await expect(page.getByRole("heading",{name:/Making Creative Spaces/})).toBeVisible();
  expect(errors).toEqual([]); await fs.mkdir("work",{recursive:true}); await fs.writeFile("work/qa-link-results.json",JSON.stringify(rows,null,2));
});

test("new email registration, login, refresh, logout and Google handoff or configuration feedback", async ({page}) => {
  const email=`qa-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Full name",{exact:true}).fill("QA Registration"); await page.getByLabel("Email address",{exact:true}).fill(email);
  await page.getByLabel("Password",{exact:true}).fill("SecurePass1"); await page.getByLabel("Confirm password",{exact:true}).fill("SecurePass1");
  await page.locator('input[name="accepted"]').check(); await page.getByRole("button",{name:"Create Account",exact:true}).click();
  await expect(page).toHaveURL("/login"); await page.getByLabel("Email address",{exact:true}).fill(email); await page.getByLabel("Password",{exact:true}).fill("SecurePass1"); await page.getByRole("button",{name:"Sign In",exact:true}).click(); await expect(page).toHaveURL("/dashboard");
  await page.reload(); await expect(page).toHaveURL("/dashboard"); await expect(page.getByRole("heading",{name:/Welcome/})).toBeVisible();
  await page.locator(".sidebar").getByRole("button",{name:/Logout/i}).click();
  await page.goto("/profile-settings"); await expect(page).toHaveURL(/\/login\?next=/);
  const oauth=await page.request.get("/api/auth/google",{maxRedirects:0});
  expect(oauth.status()).toBe(302); const configured=new URL(oauth.headers().location).hostname==="accounts.google.com";
  await page.locator(".google-signin").click();
  if(configured) await expect(page).toHaveURL(/^https:\/\/accounts\.google\.com\//);
  else { await expect(page).toHaveURL(/error=Google/); await expect(page.getByText("Google OAuth requires server credentials",{exact:true})).toBeVisible(); }
});


