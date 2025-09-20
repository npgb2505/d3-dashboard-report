// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (!Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu đã load:", data);

    const margin = { top: 40, right: 40, bottom: 50, left: 60 },
        width = 900 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const aggregatedData = Array.from(
        d3.rollup(data,
            v => new Set(v.map(d => d["Mã đơn hàng"])).size,
            d => d["Mã khách hàng"]
        ),
        ([key, value]) => ({ "Mã khách hàng": key, "Số lượt mua hàng": value })
    );
  
    const purchaseCountData = Array.from(
        d3.rollup(aggregatedData,
            v => v.length,
            d => d["Số lượt mua hàng"]
        ),
        ([key, value]) => ({ "Số lượt mua hàng": key, "Số lượng KH": value })
    );

    purchaseCountData.sort((a, b) => a["Số lượt mua hàng"] - b["Số lượt mua hàng"]);

    const svg = d3.select("#Q11")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(purchaseCountData.map(d => d["Số lượt mua hàng"].toString()))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, 5000])
        .range([height, 0]);

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left");

    const bars = svg.selectAll(".bar")
        .data(purchaseCountData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Số lượt mua hàng"].toString()))
        .attr("y", d => y(d["Số lượng KH"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Số lượng KH"]))
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <p><strong>Đã mua ${d["Số lượt mua hàng"]} lần</strong></p>
                <p><strong>Số lượng KH:</strong> ${d["Số lượng KH"].toLocaleString()}</p>
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

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .style("font-size", "11px");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(10))
        .style("font-size", "11px");

}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q11:", error);
});