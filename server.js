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
    let response = await fetch("https://hcaptcha.com/siteverify", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            secret: Bun.env.HCAPTCHA_SECRET,
            response: hcaptcha
        })
    });
    if (response.status != 200) {
        return new Response("Error verifying hCaptcha", { status: 500 });
    }
    let data = await response.json();
    if (data.success != true) {
        return new Response("hCaptcha verification failed", { status: 500 });
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
    let consumerKey = Bun.env.TURBO_SMTP_KEY;
    let consumerSecret = Bun.env.TURBO_SMTP_SECRET;
    response = await fetch("https://api.turbo-smtp.com/api/v2/mail/send", {
        method:"POST",
        headers: {
            "Content-Type": "application/json",
            'ConsumerKey': consumerKey,
            'Consumersecret': consumerSecret,
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            "from" : "noreply@brysonvanryn.com",
            "to" : "brysonvanryn@gmail.com",
            "subject" : `Contact form submission from ${name}`,
            "content" : "Name: " + name + "\nEmail: " + email + "\nMessage: " + message,
            "html" : "<p>Name: " + name + "</p><p>Email: " + email + "</p><p>Message: " + message + "</p>"
        })
    });
    if(response.status != 200) {
        console.error("Error sending email: ", response.status, response.statusText);
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