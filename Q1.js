// Thay vì chờ DOM load, ta dùng d3.csv để tải file và thực thi code sau khi tải xong.
// Toàn bộ code gốc của bạn sẽ được đặt bên trong hàm .then()
d3.csv("data.csv").then(function (data) {

    // Đoạn code dưới đây được giữ nguyên hoàn toàn từ file gốc của bạn.
    // Chỉ có `window.data` được thay bằng biến `data` được tải từ file CSV.

    if (typeof data === "undefined" || !Array.isArray(data) || data.length === 0) {
        console.error("Dữ liệu từ CSV chưa được load hoặc rỗng!");
        return;
    }

    console.log("Dữ liệu CSV đã load:", data);

    const margin = { top: 40, right: 200, bottom: 50, left: 250 },
        width = 700,
        height = 400;

    // Giữ nguyên logic xử lý dữ liệu gốc
    const data1 = data.map(d => ({
        "Nhóm hàng": `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`,
        "Mặt hàng": `[${d["Mã mặt hàng"]}] ${d["Tên mặt hàng"]}`,
        "Thành tiền": parseFloat(d["Thành tiền"]) || 0, // Chuyển đổi từ string sang số
        "SL": parseFloat(d["SL"]) || 0 // Chuyển đổi từ string sang số
    }));

    const dataq1 = data1.reduce((acc, item) => {
        const existingItem = acc.find(d => d["Mặt hàng"] === item["Mặt hàng"]);
        if (existingItem) {
            existingItem["Thành tiền"] += item["Thành tiền"];
            existingItem["SL"] += item["SL"];
        } else {
            acc.push({
                "Mặt hàng": item["Mặt hàng"],
                "Nhóm hàng": item["Nhóm hàng"],
                "Thành tiền": item["Thành tiền"],
                "SL": item["SL"]
            });
        }
        return acc;
    }, []);

    dataq1.sort((a, b) => b["Thành tiền"] - a["Thành tiền"]);

    // Giữ nguyên toàn bộ phần vẽ biểu đồ bằng D3.js
    const svg = d3.select("#Q1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, 700_000_000]) // Giữ nguyên domain cố định như code gốc
        .range([0, width]);

    const y = d3.scaleBand()
        .domain(dataq1.map(d => d["Mặt hàng"]))
        .range([0, height])
        .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    
    // Tooltip phải được tạo trước khi dùng trong .on("mouseover")
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
        .data(dataq1)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => y(d["Mặt hàng"]))
        .attr("width", d => x(d["Thành tiền"]))
        .attr("height", y.bandwidth())
        .attr("fill", d => colorScale(d["Nhóm hàng"]))
        .on("mouseover", function (event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                <strong>Mặt hàng:</strong> ${d["Mặt hàng"]}<br>
                <strong>Nhóm hàng:</strong> ${d["Nhóm hàng"]}<br>
                <strong>Doanh số bán:</strong> ${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VND<br>
                <strong>Số lượng bán:</strong> ${d["SL"]} SKUs
            `)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px")
                .style("font-size", "11px");
        })
        .on("mouseout", function (d) {
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
        .data(dataq1)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => x(d["Thành tiền"]) + 5)
        .attr("y", d => y(d["Mặt hàng"]) + y.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => `${(d["Thành tiền"] / 1_000_000).toFixed(0)} triệu VNĐ`)
        .style("font-size", "11px");

    chart.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => `${(d / 1_000_000).toFixed(0)}M`)
            .ticks(7)
        )
        .style("font-size", "11px");

    chart.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "11px")
        .style("text-anchor", "end");

    const filter = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 30},${margin.top})`);

    const filterRects = filter.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale)
        .on("click", function (event, selectedGroup) {
            if (d3.select(this).attr("opacity") !== "0.3") {
                bars.attr("opacity", 0.3);
                bars.filter(d => d["Nhóm hàng"] === selectedGroup).attr("opacity", 1);
            } else {
                bars.attr("opacity", 1);
            }
        });

    filter.selectAll("text")
        .data(colorScale.domain())
        .enter()
        .append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 9)
        .text(d => d)
        .style("font-size", "11px");

}).catch(function(error) {
    // Thêm hàm .catch để thông báo lỗi nếu không tải được file
    console.error("Lỗi khi tải file data.csv:", error);
});