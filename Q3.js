// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (typeof data === "undefined" || !Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", data);

    const margin = { top: 40, right: 40, bottom: 50, left: 50 },
        width = 900,
        height = 300;

    const data3 = data.map(d => ({
        "Thời gian tạo đơn": d["Thời gian tạo đơn"],
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));

    const monthdata = data3.map(d => ({
        "Tháng": new Date(d["Thời gian tạo đơn"]).toLocaleString('default', { month: '2-digit' }),
        "Thành tiền": d["Thành tiền"],
        "SL": d["SL"]
    }));

    const dataq3 = monthdata.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Tháng"] === item["Tháng"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
        } else {
            acc.push({
                "Tháng": item["Tháng"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"]
            });
        }
        return acc;
    }, []);

    dataq3.sort((a, b) => a["Tháng"] - b["Tháng"]);

    const svg = d3.select("#Q3")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(dataq3.map(d => `Tháng ${d["Tháng"]}`))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 800_000_000])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left");

    const bars = chart.selectAll(".bar")
        .data(dataq3)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(`Tháng ${d["Tháng"]}`))
        .attr("y", d => y(d["Thành tiền"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Thành tiền"]))
        .attr("fill", d => colorScale(d["Tháng"]))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Tháng ${d["Tháng"].padStart(2, '0')}</strong></p>
                <p><strong>Doanh số bán:</strong> ${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VND</p>
                <p><strong>Số lượng bán:</strong> ${d["SL"]} SKUs</p>
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3);
                d3.select(this).attr("opacity", 1);
            } else {
                bars.attr("opacity", 1);
            }
        });

    chart.selectAll(".label")
        .data(dataq3)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(`Tháng ${d["Tháng"]}`) + x.bandwidth() / 2)
        .attr("y", d => y(d["Thành tiền"]) - 5)
        .attr("text-anchor", "middle")
        .text(d => `${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ`)
        .style("font-size", "11px");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px");

    chart.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`)
            .ticks(8)
        )
        .style("font-size", "11px");
        
}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q3:", error);
});