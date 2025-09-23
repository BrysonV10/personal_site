
function onChartLoad(ok){
    if(!ok){
        const chartContainer = document.getElementById("chart");
        chartContainer.innerHTML = "<p style='color: red;'>Error loading chart. Please try again later.</p>";
    }
}