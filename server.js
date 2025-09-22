import homePage from "./index.html";
import stalkMe from "./stalk-me.html";
import NotFound from "./404.html";
import Projects from "./projects.html";
var stravaCache = { lastUpdated: 0, data: {} };
var stravaAccessToken = { validUntil: 0, token: "" };

// load refresh token from file on server start
var stravaRefreshToken = "";
const tokenCache = Bun.file(".token.cache");
stravaRefreshToken = await tokenCache.text();


console.log("Strava refresh token: ", stravaRefreshToken);

async function getNewAccessToken() {
    let secret = Bun.env.STRAVA_SECRET;
    let clientId = Bun.env.STRAVA_ID;

    const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: secret,
            grant_type: 'refresh_token',
            refresh_token: stravaRefreshToken
        })
    });
    console.log("Response: ", response);
    if (response.status == 200) {
        let data = await response.json();
        await Bun.write(data.refresh_token, ".token.cache");
        stravaRefreshToken = data.refresh_token;
        stravaAccessToken.validUntil = data.expires_at;
        stravaAccessToken.token = data.access_token;
        return data.access_token;
    } else {
        console.error("Error fetching Strava access token: ", response.status, response.statusText);
        return null;
    }
}

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
        "/api/stravaStats": async (req) => {
            return new Response(`{
    "biggest_ride_distance": 0,
    "biggest_climb_elevation_gain": 0,
    "recent_ride_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "recent_run_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "recent_swim_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "ytd_ride_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "ytd_run_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "ytd_swim_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "all_ride_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "all_run_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    },
    "all_swim_totals": {
        "count": 0,
        "distance": 0,
        "moving_time": 0,
        "elapsed_time": 0,
        "elevation_gain": 0,
        "achievement_count": 0
    }
}`);


            if (stravaCache.lastUpdated > Date.now() - 3600000) {
                console.log("Using cached Strava data");
                return new Response(JSON.stringify(stravaCache.data), {
                    headers: {
                        "content-type": "application/json",
                        "cache-control": "max-age=3600"
                    }
                });
            }

            if (stravaAccessToken.validUntil < Date.now()) {
                console.log("Strava access token expired, fetching new one");
                let newAccessToken = await getNewAccessToken();
                if (newAccessToken == null) {
                    return new Response("Error fetching Strava access token", { status: 500 });
                }
            }
            let myId = Bun.env.STRAVA_ID;
            console.log("Fetching Strava data for ID: ", myId);
            let response = fetch(`https://www.strava.com/api/v3/athletes/${myId}/stats`, {
                headers: {
                    "authorization": `Bearer ${stravaAccessToken.token}`,
                    "accept": "application/json"
                }
            })
            if (response.status == 200) {
                let data = (await response).json();
                stravaCache.lastUpdated = Date.now();
                stravaCache.data = data;
                return new Response(JSON.stringify(data), {
                    headers: {
                        "content-type": "application/json",
                        "cache-control": "max-age=3600"
                    }
                });
            }

        },
        // fallback route for not found pages
        
        "/*": NotFound,
    },
    development: true,
    port: 3000
});