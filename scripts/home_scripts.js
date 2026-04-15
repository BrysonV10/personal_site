

document.getElementById("rowpic").addEventListener("mouseenter", ()=> {
    console.log("hover")
    document.getElementById("retro_row_pic").animate([
        {opacity:"1"},
        {opacity:"0"}
    ], {duration: 500});
    document.getElementById("retro_row_pic").style.opacity=0;
});

document.getElementById("rowpic").addEventListener("mouseleave", ()=> {
    try{sa_event("rowpick_hover_off")}catch(e){console.error("Error sending analytics event: ", e);}
    console.log("hover")
    document.getElementById("retro_row_pic").animate([
        {opacity:"0"},
        {opacity:"1"}
    ], {duration: 500});
    document.getElementById("retro_row_pic").style.opacity=1;
});

let wave = document.getElementById("wave");
let waveStatus = document.getElementById("wave-status");
let socket = new WebSocket(`ws://${window.location.host}/ws`);
socket.addEventListener("message", (event) => {
    if(event.data.startsWith("wave")){
        let numClients = event.data.split(":")[1];
        if(numClients == "1"){
            waveStatus.textContent = `You waved to yourself :)`;
        } else {
            waveStatus.textContent = `Someone waved to you and ${numClients-1} others!`;
        }
        wave.animate([
            {transform: "rotate(0deg)"},
            {transform: "rotate(20deg)"},
            {transform: "rotate(0deg)"},
            {transform: "rotate(20deg)"},
            {transform: "rotate(0deg)"}
        ], {duration: 1000});
    }
})
wave.addEventListener("click", () => {
    socket.send("hi");
})