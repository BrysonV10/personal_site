import homePage from "./index.html";
import stalkMe from "./stalk-me.html";
import NotFound from "./404.html";
import Projects from "./projects.html";
const isProd = Bun.env.PROD && Bun.env.PROD=="true";

async function ContactFormPostHandler(req){
    let formData = await req.formData();
    let name = formData.get("name");
    let email = formData.get("email");
    let message = formData.get("message");
    let hcaptcha = formData.get("h-captcha-response");
    let hcaptchaSecret = Bun.env.HCAPTCHA_SECRET;
    if (!hcaptcha || !hcaptchaSecret) {
        console.error("hCaptcha verification unavailable: missing response token or HCAPTCHA_SECRET");
        return Response.redirect("/contact?submit=0", 302);
    }

    let response;
    try {
        response = await fetch("https://api.hcaptcha.com/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                secret: hcaptchaSecret,
                response: hcaptcha,
                sitekey: "986ee97a-b4fc-42a0-9216-5ea2b3eee0ac"
            }),
            signal: AbortSignal.timeout(10_000)
        });
    } catch (error) {
        console.error("Error contacting hCaptcha:", error);
        return Response.redirect("/contact?submit=0", 302);
    }

    if (!response.ok) {
        console.error("Error verifying hCaptcha:", response.status, response.statusText);
        return Response.redirect("/contact?submit=0", 302);
    }

    let data = await response.json();
    if (data.success !== true) {
        console.error("hCaptcha verification failed:", data["error-codes"] ?? "no error code returned");
        return Response.redirect("/contact?submit=0", 302);
    }
    if (name == null || email == null || message == null) {
        return new Response("Missing fields", { status: 400 });
    }
    if (name.length < 3 || email.length < 3 || message.length < 3) {
        return new Response("Fields too short", { status: 400 });
    }
    if (name.length > 100 || email.length > 100 || message.length > 1000) {
        return new Response("Fields too long", { status: 400 });
    }
    if (email.indexOf("@") == -1) {
        return new Response("Invalid email", { status: 400 });
    }
    if (email.indexOf(".") == -1) {
        return new Response("Invalid email", { status: 400 });
    }
    if (email.indexOf("@") > email.indexOf(".")) {
        return new Response("Invalid email", { status: 400 });
    }
    let discordWebhookUrl = Bun.env.DISCORD_WEBHOOK_URL;
    if (!discordWebhookUrl) {
        console.error("Contact form delivery unavailable: missing DISCORD_WEBHOOK_URL");
        return Response.redirect("/contact?submit=0", 302);
    }

    try {
        response = await fetch(discordWebhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                content: `**New contact form submission**\n**Name:** ${name}\n**Email:** ${email}\n**Message:**\n${message}`,
                allowed_mentions: { parse: [] }
            }),
            signal: AbortSignal.timeout(10_000)
        });
    } catch (error) {
        console.error("Error contacting Discord webhook:", error);
        return Response.redirect("/contact?submit=0", 302);
    }

    if (!response.ok) {
        console.error("Error sending contact form to Discord:", response.status, response.statusText, await response.text());
        return Response.redirect("/contact?submit=0", 302);
    }

    return Response.redirect("/contact?submit=1", 302);
}


let numClients = 0;
let clients = [];
Bun.serve({
    routes: {
        "/": homePage,
        "/styles.css": () => new Response(Bun.file("./styles.css")),
        "/opendata": stalkMe,
        "/contact": {
            GET: ()=> new Response(Bun.file("./contact.html")),
            POST: ContactFormPostHandler
        },
        "/projects": Projects,
        // fallback route for not found pages
        "/*": NotFound,
    },
    fetch(req, server){
        if(new URL(req.url).pathname == "/ws" && server.upgrade(req)){
            return;
        }
        return new Response(Bun.file("./404.html"), { status: 404 });
    },
    websocket:{
        open(ws){
            numClients++;
            clients.push(ws);
            for(let client of clients){
                client.send("clients:" + numClients);
            }
        },
        close(ws){
            numClients--;
            clients.splice(clients.indexOf(ws), 1);
            for(let client of clients){
                client.send("clients:" + numClients);
            }
        },
        message(ws, message){
            if(message == "hi"){
                for(let client of clients){
                    client.send("wave:"+numClients);
                }
            }
        }
    },
    development: isProd ? false : true,
    port: isProd ? 80 : 3000
});
