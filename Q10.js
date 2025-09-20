// Sử dụng d3.csv để tải dữ liệu, toàn bộ code gốc được đưa vào trong .then()
d3.csv("data.csv").then(function (data) {

    // Bắt đầu code gốc, thay "window.data" bằng "data"
    if (typeof data === "undefined" || !Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu chưa được load hoặc rỗng!");
        return;
    }

    const data_processed = data.map(d => ({
        "Tháng": `T ${new Date(d["Thời gian tạo đơn"]).getMonth() + 1}`,
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        "Mã đơn hàng": d["Mã đơn hàng"]
    }));

    const totalOrdersByGroupMonth = {};
    const itemOrdersByGroupMonth = {};

    data_processed.forEach(({ "Nhóm hàng": group, "Mặt hàng": item, "Tháng": month, "Mã đơn hàng": orderID }) => {
        if (!totalOrdersByGroupMonth[group]) totalOrdersByGroupMonth[group] = {};
        if (!totalOrdersByGroupMonth[group][month]) totalOrdersByGroupMonth[group][month] = new Set();
        totalOrdersByGroupMonth[group][month].add(orderID);

        const key = `${group}|||${item}|||${month}`;
        if (!itemOrdersByGroupMonth[key]) itemOrdersByGroupMonth[key] = new Set();
        itemOrdersByGroupMonth[key].add(orderID);
    });

    const probabilityData = {};
    Object.keys(itemOrdersByGroupMonth).forEach(key => {
        const [group, item, month] = key.split("|||");

        if (!probabilityData[group]) probabilityData[group] = [];
        probabilityData[group].push({
            "Tháng": month,
            "Mặt hàng": item,
            "Nhóm hàng": group,
            "Xác suất": itemOrdersByGroupMonth[key].size / totalOrdersByGroupMonth[group][month].size
        });
    });

    Object.values(probabilityData).forEach(data => {
        data.sort((a, b) => parseInt(a["Tháng"].split(" ")[1]) - parseInt(b["Tháng"].split(" ")[1]));
    });

    const margin = { top: 30, right: 20, bottom: 40, left: 120 },
          width = 450 - margin.left - margin.right,
          height = 250 - margin.top - margin.bottom;

    const chartContainer = d3.select("#Q10");
    chartContainer.html("");
    chartContainer.style("display", "grid")
        .style("grid-template-columns", "repeat(3, 1fr)")
        .style("gap", "20px");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(255, 255, 255, 0.95)")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("pointer-events", "none")
        .style("text-align", "left")
        .style("font-size", "12px");
        
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    
    const orderedGroups = ["[BOT] Bột", "[SET] Set trà", "[THO] Trà hoa", "[TMX] Trà mix", "[TTC] Trà củ, quả sấy"];

    orderedGroups.forEach(group => {
        const data = probabilityData[group];
        if (!data) return;

        const div = chartContainer.append("div")
            .style("border", "1px solid #eee")
            .style("padding-bottom", "10px");

        div.append("h3")
            .text(group)
            .style("text-align", "center")
            .style("font-size", "14px")
            .style("margin", "10px 0");
        
        const svg = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
            
        const allMonths = Array.from({length: 12}, (_, i) => `T ${i + 1}`);
        const x = d3.scalePoint()
            .domain(allMonths)
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["Xác suất"]) * 1.1])
            .range([height, 0])
            .nice();

        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style("font-size", "10px");

        chart.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format(".0%")).ticks(5))
            .style("font-size", "10px");

        const items = [...new Set(data.map(d => d["Mặt hàng"]))];

        const lines = chart.selectAll(".line-group")
            .data(items)
            .enter()
            .append("g")
            .attr("class", "line-group");

        lines.each(function (item) {
            const itemData = data.filter(d => d["Mặt hàng"] === item);
            const line = d3.line()
                .x(d => x(d["Tháng"]))
                .y(d => y(d["Xác suất"]));

            d3.select(this).append("path")
                .datum(itemData)
                .attr("fill", "none")
                .attr("stroke", color(item))
                .attr("stroke-width", 2)
                .attr("class", "line")
                .attr("d", line);
        });

        chart.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d["Tháng"]))
            .attr("cy", d => y(d["Xác suất"]))
            .attr("r", 4)
            .attr("fill", d => color(d["Mặt hàng"]))
            .on("mouseover", function (event, d) {
                tooltip.transition().duration(200).style("opacity", 0.95);
                tooltip.html(`
                    <strong>Tháng:</strong> ${d["Tháng"]} <br>
                    <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]} <br>
                    <strong>Mặt hàng:</strong> ${d["Mặt hàng"]} <br>
                    <strong>Xác suất bán:</strong> ${(d["Xác suất"] * 100).toFixed(2)}%
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function () {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    });

}).catch(function(error) {
    console.error("Lỗi khi tải file data.csv cho Q10:", error);
});