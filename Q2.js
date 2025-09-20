// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (typeof data === "undefined" || !Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    const data2 = data.map(d => ({
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0,
        "SL": parseFloat(d["SL"]) || 0
    }));

    const tonghop = d3.rollups(
        data2,
        v => ({
            doanhThu: d3.sum(v, d => d["Thành tiền"]),
            soLuong: d3.sum(v, d => d["SL"])
        }),
        d => d["Nhóm hàng"]
    );

    const dataq2 = tonghop.map(([nhomHang, data]) => ({
        "Nhóm hàng": nhomHang,
        "Doanh thu": data.doanhThu,
        "Số lượng": data.soLuong
    }));

    dataq2.sort((a, b) => b["Doanh thu"] - a["Doanh thu"]);

    const margin = { top: 40, right: 100, bottom: 50, left: 200 },
          width = 700,
          height = 400;

    const svg = d3.select("#Q2")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(dataq2, d => d["Doanh thu"]) / 1_000_000])
        .range([0, width])
        .nice();

    const y = d3.scaleBand()
        .domain(dataq2.map(d => d["Nhóm hàng"]))
        .range([0, height])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
        .domain(dataq2.map(d => d["Nhóm hàng"]));

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left")
        .style("font-size", "12px");

    const formatNumber = d => Math.round(d).toLocaleString("en-US");

    let selectedBar = null;

    const bars = chart.selectAll(".bar")
        .data(dataq2)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Nhóm hàng"]))
        .attr("width", d => x(d["Doanh thu"] / 1_000_000))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]}<br>
                <strong>Doanh số bán:</strong> ${formatNumber(d["Doanh thu"] / 1_000_000)} triệu VNĐ<br>
                <strong>Số lượng bán:</strong> ${formatNumber(d["Số lượng"])} SKUs
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });


    bars.on("click", function (event, d) {
        if (d3.select(this).attr("opacity") !== "0.3") {
            bars.attr("opacity", 0.3);
            d3.select(this).attr("opacity", 1)
        } else {
            bars.attr("opacity", 1);
        }
    });

    chart.selectAll(".label")
        .data(dataq2)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Doanh thu"] / 1_000_000) + 5)
        .attr("y", d => y(d["Nhóm hàng"]) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "start")
        .style("fill", "black")
        .style("font-size", "11px")
        .text(d => `${formatNumber(d["Doanh thu"] / 1_000_000)} triệu VNĐ`);

    chart.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => `${d}M`)
            .ticks(7)
        )
        .style("font-size", "11px");

    chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "11px")
        .style("text-anchor", "end");
        
}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q2:", error);
});