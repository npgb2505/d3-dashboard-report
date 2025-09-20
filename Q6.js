// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (typeof data === "undefined" || !Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", data);

    const margin = { top: 40, right: 40, bottom: 100, left: 50 },
        width = 1100,
        height = 350;

    const data6 = data.map(d => ({
        "Thời gian tạo đơn": new Date(d["Thời gian tạo đơn"]),
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));

    const hourdata = data6.map(d => ({
        "Khung giờ": `${d["Thời gian tạo đơn"].getHours().toString().padStart(2, '0')}:00-${d["Thời gian tạo đơn"].getHours().toString().padStart(2, '0')}:59`,
        "Ngày tạo đơn": d["Thời gian tạo đơn"].toISOString().split('T')[0],
        "Thành tiền": d["Thành tiền"],
        "SL": d["SL"]
    }));

    const dataq6 = hourdata.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Khung giờ"] === item["Khung giờ"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
            existingItem["Ngày tạo đơn"].push(item["Ngày tạo đơn"]);
        } else {
            acc.push({
                "Khung giờ": item["Khung giờ"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"],
                "Ngày tạo đơn": [item["Ngày tạo đơn"]]
            });
        }
        return acc;
    }, []);

    dataq6.forEach(d => {
        const uniqueDays = [...new Set(d["Ngày tạo đơn"])].length;
        d["Doanh số bán TB"] = Math.ceil(d["Thành tiền"] / uniqueDays);
        d["Số lượng bán TB"] = d["SL"];
    });

    dataq6.sort((a, b) => parseInt(a["Khung giờ"].split(':')[0]) - parseInt(b["Khung giờ"].split(':')[0]));

    const svg = d3.select("#Q6")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(dataq6.map(d => d["Khung giờ"]))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 900_000])
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
        .data(dataq6)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Khung giờ"]))
        .attr("y", d => y(d["Doanh số bán TB"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Doanh số bán TB"]))
        .attr("fill", d => colorScale(d["Khung giờ"]))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(
                `<p><strong>Khung giờ: ${d["Khung giờ"]}</strong></p>
                <p><strong>Doanh số bán TB:</strong> ${(d["Doanh số bán TB"] / 1000).toFixed(1)}K VND</p>
                <p><strong>Số lượng bán TB:</strong> ${Math.round(d["Số lượng bán TB"]).toLocaleString()} SKUs</p>`
            )
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
        .data(dataq6)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Khung giờ"]) + x.bandwidth() / 2)
        .attr("y", d => y(d["Doanh số bán TB"]) - 5)
        .attr("text-anchor", "middle")
        .text(d => `${(d["Doanh số bán TB"] / 1000).toFixed(1)}K`)
        .style("font-size", "10px");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "10px")
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "0.15em")
        .attr("transform", "rotate(-45)");

    chart.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => `${(d / 1_000).toFixed(0)}K`)
            .ticks(9)
        )
        .style("font-size", "11px");

}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q6:", error);
});